import os

# services
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:65432/auth/")
KC_ADMIN_USER = os.getenv("KC_ADMIN_USER", "keycloakadmin")
KC_ADMIN_PASSWORD = os.getenv("KC_ADMIN_PASSWORD", "mykeycloakpassword")
REALM = os.getenv("REALM", "tdf")
OIDC_CLIENTID = os.getenv("OIDC_CLIENTID", "dcr-test")

ENTITLEMENTS_URL = os.getenv("ENTITLEMENTS_URL", "http://localhost:65432/api/entitlements")
ATTRIBUTES_URL = os.getenv("ATTRIBUTES_URL","http://localhost:65432/api/attributes")
OIDC_ENDPOINT = os.getenv("OIDC_ENDPOINT", "http://localhost:65432")
KAS_URL = os.getenv("KAS_URL", "http://localhost:65432/api/kas")

# to get authToken for posting attributes and entitlements
SAMPLE_USER = "testuser@virtru.com"
SAMPLE_PASSWORD = "testuser123"

AUTH_NAMESPACE = "http://battleship.fun"

BACKEND_CLIENTID = "abacship"
BACKEND_CLIENT_SECRET = "123-456"

## board
SHIP = "ship"
OCEAN = "ocean"
SIZE = 10
HORIZONTAL = 0
VERTICAL = 1
SHIP_SIZES = [4, 3, 3, 2, 2, 2]
NR_OF_ONES = 4
