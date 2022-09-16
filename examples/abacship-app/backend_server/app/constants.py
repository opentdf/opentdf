import os
from pydantic import BaseModel

# services
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:65432/auth/")
KC_ADMIN_USER = os.getenv("KC_ADMIN_USER", "keycloakadmin")
KC_ADMIN_PASSWORD = os.getenv("KC_ADMIN_PASSWORD", "mykeycloakpassword")
REALM = os.getenv("REALM", "tdf")
OIDC_CLIENTID = os.getenv("OIDC_CLIENTID", "abachsip-backend-client")
FRONTEND_OIDC_CLIENTID = os.getenv("FRONTEND_OIDC_CLIENTID", "abacship-frontend")

ENTITLEMENTS_URL = os.getenv("ENTITLEMENTS_URL", "http://localhost:65432/api/entitlements")
ATTRIBUTES_URL = os.getenv("ATTRIBUTES_URL","http://localhost:65432/api/attributes")
OIDC_ENDPOINT = os.getenv("OIDC_ENDPOINT", "http://localhost:65432")
KAS_URL = os.getenv("KAS_URL", "http://localhost:65432/api/kas")
EXTERNAL_KAS_URL = os.getenv("EXTERNAL_KAS_URL", "http://localhost:65432/api/kas")

KAS_PUB_KEY_URL = "/kas_public_key?algorithm=ec:secp256r1"

# to get authToken for posting attributes and entitlements
SAMPLE_USER = "abacship-backend-user"
SAMPLE_PASSWORD = "testuser123"

AUTH_NAMESPACE = "http://ship.fun"

BACKEND_CLIENTID = "abacship"
BACKEND_CLIENT_SECRET = "123-456"

class ShipType:
    def __init__(self, name, size):
        self.name = name
        self.size = size

class Ship:
    def __init__(self, row, col, size, orientation):
        self.row = row
        self.col = col
        self.type = next(ship for ship in SHIPS if ship.size==size)
        self.orientation = orientation

## board
# ship types
SHIP_MAP = {
    "aircraft carrier": 5,
    "battleship": 4,
    "cruiser": 3,
    "destroyer": 2,
    "submarine": 1
}
AIRCRAFT = ShipType("aircraft carrier", SHIP_MAP["aircraft carrier"])
BATTLESHIP = ShipType("battleship", SHIP_MAP["battleship"])
CRUISER = ShipType("cruiser", SHIP_MAP["cruiser"])
DESTROYER = ShipType("destroyer", SHIP_MAP["destroyer"])
SUBMARINE = ShipType("submarine", SHIP_MAP["submarine"])
# required ships
SHIPS = [AIRCRAFT, BATTLESHIP, CRUISER, DESTROYER, DESTROYER, SUBMARINE, SUBMARINE]
SHIP_NAMES = [ship.name for ship in SHIPS]
SHIP_SIZES = [ship.size for ship in SHIPS if ship != SUBMARINE]
NR_OF_ONES = SHIPS.count(SUBMARINE)
SHIP = "ship"
OCEAN = "ocean"
SIZE = 10
HORIZONTAL = 0
VERTICAL = 1


class LogConfig(BaseModel):
    """Logging configuration to be set for the server"""

    LOGGER_NAME: str = "abacship"
    LOG_FORMAT: str = "%(levelprefix)s | %(asctime)s | %(message)s"
    LOG_LEVEL: str = os.getenv("SERVER_LOG_LEVEL", "DEBUG")

    # Logging config
    version = 1
    disable_existing_loggers = False
    formatters = {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }
    handlers = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    }
    loggers = {
        "abacship": {"handlers": ["default"], "level": LOG_LEVEL},
    }
