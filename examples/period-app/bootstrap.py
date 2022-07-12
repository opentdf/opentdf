"""
This module configures a locally running Keycloak instance from OpenTDF/documentation/quickstart
to support the secure-remote-storage sample application
"""

from keycloak import KeycloakAdmin, KeycloakOpenID
import requests
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED

FRONTEND_URL = 'http://localhost:3001'
KC_URL = 'http://localhost:65432/auth/'
ATTRIBUTES_URL = "http://localhost:65432/api/attributes"
KC_ADMIN_USER = 'keycloakadmin'
KC_ADMIN_PASS = 'mykeycloakpassword'
REALM = 'tdf'
USER_REALM = 'master'

keycloak_admin = KeycloakAdmin(
  server_url=KC_URL,
  username=KC_ADMIN_USER,
  password=KC_ADMIN_PASS,
  realm_name=REALM,
  user_realm_name=USER_REALM
)

CLIENT_ID = "abacus-web"

keycloak_client_id = keycloak_admin.get_client_id(CLIENT_ID)

new_client = keycloak_admin.update_client(keycloak_client_id,
  payload={
    "clientId": CLIENT_ID,
    "publicClient": "true",
    "standardFlowEnabled": "true",
    "clientAuthenticatorType": "client-secret",
    "serviceAccountsEnabled": "true",
    "protocol": "openid-connect",
    "redirectUris": ["http://localhost:65432/*", f"{FRONTEND_URL}/*"], # add whatever uris you want to the list
    "webOrigins": ["+"],
  }
)

try:
  keycloak_admin.add_mapper_to_client(keycloak_client_id,
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
        "claim.type": "Virtru OIDC to Entity Claim Mapper"
      },
      "name": "tdf_claims",
      "protocolMapper": "virtru-oidc-protocolmapper",
    },
  )

  print('Protocol mapper successfully created.')

except Exception as e:
  print('Protocol mapper already exists with same name, bootstrap script skipped.')


# get all the user ids
users = keycloak_admin.get_users({})
ids = [user["id"] for user in users]

# attribute rule json
definition = {
    "authority": "http://period.com",
    "name": "tracker",
    "rule": "allOf",
    "state": "published",
    "order": ids
}

# keycloak openid w user 1
keycloak_openid = KeycloakOpenID(
    # NOTE: `realm_name` IS NOT == `target_realm` here
    # Target realm is the realm you're querying users from keycloak for
    # `realm_name` is the realm you're using to get a token to talk to entitlements with
    # They are not the same.
    server_url="http://localhost:65432/auth/",
    client_id="dcr-test",
    realm_name="tdf",
)  # Entitlements endpoint always uses `tdf` realm client creds
authToken = keycloak_openid.token("user1", "testuser123")
authToken = authToken["access_token"]


# attempt to delete attribute definition
loc = f"{ATTRIBUTES_URL}/definitions/attributes"
print(f"Adding attribute definition {definition}")
response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
definitions = response.json()
definitions_no_order = [f'{d["authority"]}/{d["name"]}/{d["rule"]}' for d in definitions]


if f'{definition["authority"]}/{definition["name"]}/{definition["rule"]}' in definitions_no_order:
  print(f"Attribute definition {definition} already exists, deleting definition")
  old_definition = [d for d in definitions if d["authority"]==definition["authority"] and 
  d["name"]==definition["name"] and d["rule"]==definition["rule"]]
  response = requests.delete(
      loc,
      json=old_definition[0],
      headers={"Authorization": f"Bearer {authToken}"},
  )
  if response.status_code != 202:
    print(
        "Unexpected code [%s] from attributes service when attempting to delete attribute definition! [%s]",
        response.status_code,
        response.text,
        exc_info=True,
    )
    raise HTTPException(
        status_code=BAD_REQUEST,
        detail="Failed to delete attribute definition",
    )
  

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

