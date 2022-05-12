import os
import json
import logging
import jwt
from keycloak import KeycloakAdmin, KeycloakOpenID
import requests
from constants import *

logging.basicConfig()
logger = logging.getLogger("abacship")
logger.setLevel(logging.DEBUG)

keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
)

keycloak_openid = KeycloakOpenID(
    # NOTE: `realm_name` IS NOT == `target_realm` here
    # Target realm is the realm you're querying users from keycloak for
    # `realm_name` is the realm you're using to get a token to talk to entitlements with
    # They are not the same.
    server_url=KEYCLOAK_URL,
    client_id=OIDC_CLIENTID,
    realm_name=REALM,
)  # Entitlements endpoint always uses `tdf` realm client creds


########################## Setup ##############################

def setupKeycloak():
    createAbacshipClient()

def setupAttributes():
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    createAbacshipAuthority(authToken)
    createAbacshipAttributes(authToken) 

def setupEntitlements():
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    addBackendClientAttrs(authToken)

def setupUserEntitlements(username, player_name):
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    addGameUserAttrs(username, player_name, authToken)

###############################################################

######################## Teardown #############################

def teardownEntitlements(username1, username2):
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    deleteBackendClientAttrs(authToken)
    deleteGameUserAttrs(username1, username2, authToken)

def teardownAttributes():
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    deleteAbacshipAttrDefinitions(authToken)

def teardownKeycloak():
    deleteAbacshipClient()

###############################################################

####################### Guess a Square ########################

def addUserEntitlement(username, player_name, row, col):
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    user_attr_map = {
        username: [f"{AUTH_NAMESPACE}/attr/{player_name}/value/{str(row)+str(col)}"],
    }
    insertAttrsForUsers(keycloak_admin, ENTITLEMENTS_URL, user_attr_map, authToken)

###############################################################


########################### Keycloak ############################

def addVirtruMappers(keycloak_admin, keycloak_client_id):
    logger.info("Assigning custom mappers to client %s", keycloak_client_id)
    try:
        keycloak_admin.add_mapper_to_client(
            keycloak_client_id,
            payload={
                "protocol": "openid-connect",
                "config": {
                    "id.token.claim": "false",
                    "access.token.claim": "false",
                    "userinfo.token.claim": "true",
                    "remote.parameters.username": "true",
                    "remote.parameters.clientid": "true",
                    "client.publickey": "X-VirtruPubKey",
                    "claim.name": "tdf_claims",
                },
                "name": "Virtru OIDC UserInfo Mapper",
                "protocolMapper": "virtru-oidc-protocolmapper",
            },
        )
    except Exception as e:
        logger.warning(
            "Could not add custom userinfo mapper to client %s - this likely means it is already there, so we can ignore this.",
            keycloak_client_id,
        )
        logger.warning(
            "Unfortunately python-keycloak doesn't seem to have a 'remove-mapper' function"
        )
        logger.warning(str(e))
    try:
        keycloak_admin.add_mapper_to_client(
            keycloak_client_id,
            payload={
                "protocol": "openid-connect",
                "config": {
                    "id.token.claim": "true",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "false",
                    "remote.parameters.username": "true",
                    "remote.parameters.clientid": "true",
                    "client.publickey": "X-VirtruPubKey",
                    "claim.name": "tdf_claims",
                },
                "name": "Virtru OIDC Auth Mapper",
                "protocolMapper": "virtru-oidc-protocolmapper",
            },
        )
    except Exception as e:
        logger.warning(
            "Could not add custom auth mapper to client %s - this likely means it is already there, so we can ignore this.",
            keycloak_client_id,
        )
        logger.warning(
            "Unfortunately python-keycloak doesn't seem to have a 'remove-mapper' function"
        )
        logger.warning(str(e))


def createClient(keycloak_admin, keycloak_auth_url, client_id, client_secret):
    logger.debug("Creating client %s configured for clientcreds flow", client_id)
    keycloak_admin.create_client(
        payload={
            "clientId": client_id,
            "directAccessGrantsEnabled": "true",
            "clientAuthenticatorType": "client-secret",
            "secret": client_secret,
            "serviceAccountsEnabled": "true",
            "publicClient": "false",
            "redirectUris": [keycloak_auth_url + "admin/" + client_id + "/console"],
            "attributes": {
                "user.info.response.signature.alg": "RS256"
            },  # Needed to make UserInfo return signed JWT
        },
        skip_exists=True,
    )

    keycloak_client_id = keycloak_admin.get_client_id(client_id)
    logger.info("Created client %s", keycloak_client_id)

    addVirtruMappers(keycloak_admin, keycloak_client_id)


def createAbacshipClient():
    createClient(keycloak_admin, KEYCLOAK_URL, BACKEND_CLIENTID, BACKEND_CLIENT_SECRET)

def deleteAbacshipClient():
    keycloak_admin.delete_client(BACKEND_CLIENTID)

def refreshTokens(refresh_token):
    decoded = jwt.decode(refresh_token, options={"verify_signature": False})
    response = requests.post("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token",
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    data={"grant_type": "refresh_token", "refresh_token": f"{refresh_token}", "client_id":decoded["azp"]})
    if response.status_code != 200:
        logger.error(
            "Unexpected error when refreshing token",
            response.status_code,
            response.text,
            exc_info=True,
        )
        exit(1)
    rsp_json = response.json()
    return rsp_json["access_token"], rsp_json["refresh_token"]



######################################################################



########################## Attributes ################################

digits = ["%.2d" % i for i in range(100)]
player1_definition = {
    "authority": AUTH_NAMESPACE,
    "name": "Player1",
    "rule": "anyOf",
    "state": "published",
    "order": digits + ["Board"]
    }
    player2_definition = {
    "authority": AUTH_NAMESPACE,
    "name": "Player2",
    "rule": "anyOf",
    "state": "published",
    "order": digits + ["Board"]
    }


def createAuthority(authority, authToken):
    loc = f"{ATTRIBUTES_URL}/authorities"
    logger.info(f"Adding authority {authority}")
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    if authority in response.json():
        logger.info(f"Authority {authority} already exists")
    
    logger.debug("Using auth JWT: [%s]", authToken)

    response = requests.post(
        loc,
        json={"authority": authority},
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 200:
        logger.error(
            "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        exit(1)

def createAttibuteDefinition(definition, authToken):
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    logger.debug(f"Adding attribute definition {definition}")

    response = requests.post(
        loc,
        json=definition,
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 200:
        logger.error(
            "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        exit(1)

def deleteAuthority(authory, authToken):
    loc = f"{ATTRIBUTES_URL}/authorities"
    logger.info(f"Adding authority {authority}")
    logger.debug("Using auth JWT: [%s]", authToken)

    response = requests.delete(
        loc,
        json={"authority": authority},
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 202:
        logger.error(
            "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        exit(1)

def deleteAttributeDefinition(definition, authToken):
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    logger.debug(f"Adding attribute definition {definition}")

    response = requests.delete(
        loc,
        json=definition,
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 202:
        logger.error(
            "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        exit(1)


def createAbacshipAuthority(authToken):
    createAuthority(AUTH_NAMESPACE, authToken)

def create_abacship_attributes(authToken):
    createAttibuteDefinition(player1_definition, authToken)
    createAttibuteDefinition(player2_definition, authToken)

def deleteAbacshipAttrDefinitions(authToken):
    deleteAttributeDefinition(player1_definition, authToken)
    deleteAttributeDefinition(player2_definition, authToken)
    

######################################################################


########################## Entitlements ##############################

def insertAttrsForUsers(keycloak_admin, entitlement_host, user_attr_map, authToken):
    users = keycloak_admin.get_users()
    logger.info(f"Got users: {users}")

    for user in users:
        if user["username"] not in user_attr_map:
            continue
        loc = f"{entitlement_host}/entitlements/{user['id']}"
        attrs = user_attr_map[user["username"]]
        logger.info(
            "Entitling for user: [%s] with [%s] at [%s]", user["username"], attrs, loc
        )
        logger.debug("Using auth JWT: [%s]", authToken)

        for attr in attrs:
            response = requests.post(
                loc,
                json=[attr],
                headers={"Authorization": f"Bearer {authToken}"},
            )
            if response.status_code != 200:
                logger.error(
                    "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
                    response.status_code,
                    response.text,
                    exc_info=True,
                )
                exit(1)

def insertAttrsForClients(keycloak_admin, entitlement_host, client_attr_map, authToken):
    clients = keycloak_admin.get_clients()

    for client in clients:
        if client["clientId"] not in client_attr_map:
            continue
        clientId = client["clientId"]
        loc = f"{entitlement_host}/entitlements/{client['id']}"
        attrs = client_attr_map[clientId]
        logger.info(
            "Entitling for client: [%s] with [%s] at [%s]", clientId, attrs, loc
        )
        logger.debug("Using auth JWT: [%s]", authToken)
        for attr in attrs:
            response = requests.post(
                loc,
                json=[attr],
                headers={"Authorization": f"Bearer {authToken}"},
            )
            if response.status_code != 200:
                logger.error(
                    "Unexpected code [%s] from entitlements service when attempting to entitle client! [%s]",
                    response.status_code,
                    response.text,
                    exc_info=True,
                )
                exit(1)

def deleteAttrsForUsers(keycloak_admin, entitlement_host, user_attr_map, authToken):
    users = keycloak_admin.get_users()
    logger.info(f"Got users: {users}")

    for user in users:
        if user["username"] not in user_attr_map:
            continue
        loc = f"{entitlement_host}/entitlements/{user['id']}"
        attrs = user_attr_map[user["username"]]
        logger.info(
            "Deleting entitlement for user: [%s] with [%s] at [%s]", user["username"], attrs, loc
        )
        logger.debug("Using auth JWT: [%s]", authToken)

        for attr in attrs:
            response = requests.delete(
                loc,
                json=[attr],
                headers={"Authorization": f"Bearer {authToken}"},
            )
            if response.status_code != 202:
                logger.error(
                    "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
                    response.status_code,
                    response.text,
                    exc_info=True,
                )
                exit(1)

def deleteAttrsForClients(keycloak_admin, entitlement_host, client_attr_map, authToken):
    clients = keycloak_admin.get_clients()

    for client in clients:
        if client["clientId"] not in client_attr_map:
            continue
        clientId = client["clientId"]
        loc = f"{entitlement_host}/entitlements/{client['id']}"
        attrs = client_attr_map[clientId]
        logger.info(
            "Deleting entitlement for client: [%s] with [%s] at [%s]", clientId, attrs, loc
        )
        logger.debug("Using auth JWT: [%s]", authToken)
        for attr in attrs:
            response = requests.delete(
                loc,
                json=[attr],
                headers={"Authorization": f"Bearer {authToken}"},
            )
            if response.status_code != 200:
                logger.error(
                    "Unexpected code [%s] from entitlements service when attempting to entitle client! [%s]",
                    response.status_code,
                    response.text,
                    exc_info=True,
                )
                exit(1)

def addBackendClientAttrs(authToken):
    attr_map = {
        BACKEND_CLIENTID: [
            f"{AUTH_NAMESPACE}/attr/player1/value/board",
            f"{AUTH_NAMESPACE}/attr/player2/value/board"
        ]
    }
    insertAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def addGameUserAttr(username, player_name, authToken):
    user_attr_map = {
        username: [f"{AUTH_NAMESPACE}/attr/{player_name}/value/{i}" for i in digits],
    }
    insertAttrsForUsers(keycloak_admin, ENTITLEMENTS_URL, user_attr_map, authToken)

def deleteBackendClientAttrs(authToken):
    attr_map = {
        BACKEND_CLIENTID: [
            f"{AUTH_NAMESPACE}/attr/player1/value/board",
            f"{AUTH_NAMESPACE}/attr/player2/value/board"
        ]
    }
    deleteAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def deleteGameUserAttrs(username1, username2, authToken):
    user_attr_map = {
        username1: [f"{AUTH_NAMESPACE}/attr/player1/value/{i}" for i in digits],
        username2: [f"{AUTH_NAMESPACE}/attr/player2/value/{i}" for i in digits]
    }
    deleteAttrsForUsers(keycloak_admin, ENTITLEMENTS_URL, user_attr_map, authToken)


######################################################################