import os
import json
import logging
from logging.config import dictConfig
import jwt
import sys
from keycloak import KeycloakAdmin, KeycloakOpenID
import requests
from .constants import *
from fastapi import HTTPException
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED

dictConfig(LogConfig().dict())
logger = logging.getLogger("abacship")


keycloak_openid = KeycloakOpenID(
    # NOTE: `realm_name` IS NOT == `target_realm` here
    # Target realm is the realm you're querying users from keycloak for
    # `realm_name` is the realm you're using to get a token to talk to entitlements with
    # They are not the same.
    server_url=KEYCLOAK_URL,
    client_id=OIDC_CLIENTID,
    realm_name=REALM,
)


########################## Setup ##############################

def setupKeycloak():
    logger.debug(f"Setting up keycloak {KEYCLOAK_URL}")
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    createAbacshipClient(keycloak_admin)

def setupAttributes():
    logger.debug("Setting up attributes")
    teardownAttributes()
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    createAbacshipAuthority(authToken)
    createAbacshipAttributes(authToken)

def setupEntitlements():
    logger.debug("Setting up entitlements")
    teardownClientEntitlements()
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    addBackendClientAttrs(authToken, keycloak_admin)
    addFrontendClientAttrs(authToken, keycloak_admin)

def setupUserEntitlements(username, player_name):
    logger.debug(f"Setting up user entitlements for {username}")
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    teardownUserEntitlements(username)
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    addGameUserAttrs(username, player_name, authToken, keycloak_admin)

###############################################################

######################## Teardown #############################

def teardownUserEntitlements(username):
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    deleteGameUserAttrs(username, authToken, keycloak_admin)

def teardownClientEntitlements():
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    deleteBackendClientAttrs(authToken, keycloak_admin)
    deleteFrontendClientAttrs(authToken, keycloak_admin)


def teardownAttributes():
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    deleteAbacshipAttrDefinitions(authToken)

def teardownKeycloak():
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    deleteAbacshipClient(keycloak_admin)

###############################################################

####################### Guess a Square ########################

def addUserEntitlement(username, player_name, row, col):
    logger.debug(f"Adding entitlement for {username} {player_name} {row},{col}")
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    user_attr_map = {
        username: [f"{AUTH_NAMESPACE}/attr/{player_name}/value/{str(row)+str(col)}"],
    }
    insertAttrsForUsers(keycloak_admin, ENTITLEMENTS_URL, user_attr_map, authToken)

def deleteUserEntitlement(username):
    logger.debug(f"Deleting entitlements for {username}")
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    deleteGameUserAttrs(username, authToken, keycloak_admin)

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
                "user.info.response.signature.alg": "RS256", "pkce.code.challenge.method": "S256"
            },  # Needed to make UserInfo return signed JWT
        },
        skip_exists=True,
    )

    keycloak_client_id = keycloak_admin.get_client_id(client_id)
    logger.info("Created client %s", keycloak_client_id)

    addVirtruMappers(keycloak_admin, keycloak_client_id)


def createAbacshipClient(keycloak_admin):
    createClient(keycloak_admin, KEYCLOAK_URL, BACKEND_CLIENTID, BACKEND_CLIENT_SECRET)

def deleteAbacshipClient(keycloak_admin):
    keycloak_admin.delete_client(keycloak_admin.get_client_id(BACKEND_CLIENTID))

def refreshTokens(refresh_token):
    logger.debug("Refreshing token")
    decoded = jwt.decode(refresh_token, options={"verify_signature": False})
    response = requests.post(f"{KEYCLOAK_URL}realms/tdf/protocol/openid-connect/token",
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    data={"grant_type": "refresh_token", "refresh_token": f"{refresh_token}", "client_id":decoded['azp']})
    if response.status_code != 200:
        logger.error(
            "Unexpected error when refreshing token",
            response.status_code,
            response.text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Unable to refresh token",
        )
    rsp_json = response.json()
    return rsp_json["access_token"], rsp_json["refresh_token"]



######################################################################



########################## Attributes ################################

digits = ["%.2d" % i for i in range(100)]
player1_definition = {
    "authority": AUTH_NAMESPACE,
    "name": "player1",
    "rule": "anyOf",
    "state": "published",
    "order": digits + ["board"]
}
player2_definition = {
    "authority": AUTH_NAMESPACE,
    "name": "player2",
    "rule": "anyOf",
    "state": "published",
    "order": digits + ["board"]
}


def createAuthority(authority, authToken):
    loc = f"{ATTRIBUTES_URL}/authorities"
    logger.info(f"Adding authority {authority}")
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    if authority in response.json():
        logger.info(f"Authority {authority} already exists")
        return

    logger.debug("Using auth JWT: [%s]", authToken)

    response = requests.post(
        loc,
        json={"authority": authority},
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 200:
        logger.error(
            "Unexpected code [%s] from attributes service when attempting to create authority! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Failed to create authority",
        )

def createAttributeDefinition(definition, authToken):
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    logger.debug(f"Adding attribute definition {definition}")
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    check_definition = dict(definition)
    check_definition['group_by'] = None
    if check_definition in response.json():
        logger.info(f"Attribute definition {definition} already exists")
        return

    response = requests.post(
        loc,
        json=definition,
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 200:
        logger.error(
            "Unexpected code [%s] from attributes service when attempting to create attribute definition! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Failed to create attribute definition",
        )

def deleteAuthority(authory, authToken):
    loc = f"{ATTRIBUTES_URL}/authorities"
    logger.info(f"Deleting authority {authority}")
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    if authority not in response.json():
        logger.info(f"Authority {authority} does not exists")
        return

    logger.debug("Using auth JWT: [%s]", authToken)

    response = requests.delete(
        loc,
        json={"authority": authority},
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 202:
        logger.error(
            "Unexpected code [%s] from attributes service when attempting to delete authority! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Failed to delete authority",
        )

def deleteAttributeDefinition(definition, authToken):
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    logger.debug(f"Deleting attribute definition {definition}")
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    if definition not in response.json():
        logger.info(f"Attribute definition {definition} does not exists")
        return

    response = requests.delete(
        loc,
        json=definition,
        headers={"Authorization": f"Bearer {authToken}"},
    )
    if response.status_code != 202:
        logger.error(
            "Unexpected code [%s] from attributes service when attempting to delete attribute definition! [%s]",
            response.status_code,
            response.text,
            exc_info=True,
        )
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Failed to delete attribute definition",
        )


def createAbacshipAuthority(authToken):
    createAuthority(AUTH_NAMESPACE, authToken)

def createAbacshipAttributes(authToken):
    createAttributeDefinition(player1_definition, authToken)
    createAttributeDefinition(player2_definition, authToken)

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

        response = requests.post(
            loc,
            json=attrs,
            headers={"Authorization": f"Bearer {authToken}"},
        )
        if response.status_code != 200:
            logger.error(
                "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
                response.status_code,
                response.text,
                exc_info=True,
            )
            raise HTTPException(
                status_code=BAD_REQUEST,
                detail=f"Failed to entitle user {user['username']} with {attrs}",
            )

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
        response = requests.post(
            loc,
            json=attrs,
            headers={"Authorization": f"Bearer {authToken}"},
        )
        if response.status_code != 200:
            logger.error(
                "Unexpected code [%s] from entitlements service when attempting to entitle client! [%s]",
                response.status_code,
                response.text,
                exc_info=True,
            )
            raise HTTPException(
                status_code=BAD_REQUEST,
                detail=f"Failed to entitle client {user['clientId']} with {attrs}",
            )

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

        response = requests.delete(
            loc,
            json=attrs,
            headers={"Authorization": f"Bearer {authToken}"},
        )
        if response.status_code != 202:
            logger.error(
                "Unexpected code [%s] from entitlements service when attempting to entitle user! [%s]",
                response.status_code,
                response.text,
                exc_info=True,
            )
            raise HTTPException(
                status_code=BAD_REQUEST,
                detail=f"Failed to delete entitlements for user {user['username']} with {attrs}",
            )

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
        response = requests.delete(
            loc,
            json=attrs,
            headers={"Authorization": f"Bearer {authToken}"},
        )
        if response.status_code != 202:
            logger.error(
                "Unexpected code [%s] from entitlements service when attempting to entitle client! [%s]",
                response.status_code,
                response.text,
                exc_info=True,
            )
            raise HTTPException(
            status_code=BAD_REQUEST,
            detail=f"Failed to delete entitlements for client {client['clientId']} with {attrs}",
            )

def addBackendClientAttrs(authToken, keycloak_admin):
    attr_map = {
        BACKEND_CLIENTID: [
            f"{AUTH_NAMESPACE}/attr/player1/value/board",
            f"{AUTH_NAMESPACE}/attr/player2/value/board"]
        # + [f"{AUTH_NAMESPACE}/attr/player1/value/{i}" for i in digits] +
        # [f"{AUTH_NAMESPACE}/attr/player2/value/{i}" for i in digits]
    }
    insertAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def addFrontendClientAttrs(authToken, keycloak_admin):
    attr_map = {
        FRONTEND_OIDC_CLIENTID: [
            f"{AUTH_NAMESPACE}/attr/player1/value/board",
            f"{AUTH_NAMESPACE}/attr/player2/value/board"]
        # + [f"{AUTH_NAMESPACE}/attr/player1/value/{i}" for i in digits] +
        # [f"{AUTH_NAMESPACE}/attr/player2/value/{i}" for i in digits]
    }
    insertAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def addGameUserAttrs(username, player_name, authToken, keycloak_admin):
    # user_attr_map = {
    #     username: [f"{AUTH_NAMESPACE}/attr/{player_name}/value/board"] +
    #     [f"{AUTH_NAMESPACE}/attr/{player_name}/value/{i}" for i in digits],
    # }

    # temporarily stop assinging player1 all of player1 attributes
    user_attr_map = {
        username: [f"{AUTH_NAMESPACE}/attr/{player_name}/value/board"],
    }
    insertAttrsForUsers(keycloak_admin, ENTITLEMENTS_URL, user_attr_map, authToken)

def deleteBackendClientAttrs(authToken, keycloak_admin):
    attr_map = {
        BACKEND_CLIENTID: [
            f"{AUTH_NAMESPACE}/attr/player1/value/board",
            f"{AUTH_NAMESPACE}/attr/player2/value/board"
        ] + [f"{AUTH_NAMESPACE}/attr/player1/value/{i}" for i in digits] +
        [f"{AUTH_NAMESPACE}/attr/player2/value/{i}" for i in digits]
    }
    deleteAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def deleteFrontendClientAttrs(authToken, keycloak_admin):
    attr_map = {
        FRONTEND_OIDC_CLIENTID: [
            f"{AUTH_NAMESPACE}/attr/player1/value/board",
            f"{AUTH_NAMESPACE}/attr/player2/value/board"
        ] + [f"{AUTH_NAMESPACE}/attr/player1/value/{i}" for i in digits] +
        [f"{AUTH_NAMESPACE}/attr/player2/value/{i}" for i in digits]
    }
    deleteAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def deleteGameUserAttrs(username, authToken, keycloak_admin):
    user_attr_map = {
        username: [f"{AUTH_NAMESPACE}/attr/player1/value/{i}" for i in digits] +
         [f"{AUTH_NAMESPACE}/attr/player1/value/board"] +
         [f"{AUTH_NAMESPACE}/attr/player2/value/{i}" for i in digits] +
         [f"{AUTH_NAMESPACE}/attr/player2/value/board"]
    }
    deleteAttrsForUsers(keycloak_admin, ENTITLEMENTS_URL, user_attr_map, authToken)


######################################################################
