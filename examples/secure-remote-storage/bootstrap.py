"""
This module configures a locally running Keycloak instance from OpenTDF/documentation/quickstart
to support the secure-remote-storage sample application
"""

from keycloak import KeycloakAdmin

FRONTEND_URL = 'http://localhost:3001'
KC_URL = 'http://localhost:65432/auth/'
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
