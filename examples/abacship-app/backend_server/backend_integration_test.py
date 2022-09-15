from app.constants import *
from app.game import *
from app.tests.test_data import INVALID_BOARD_MISSING, VALID_BOARD, VALID_BOARD_2

from keycloak import KeycloakOpenID, KeycloakAdmin
from colorlog import ColoredFormatter
import requests
import aiohttp
import time
import logging
from http.client import BAD_REQUEST, OK
import asyncio

ABACSHIP_BACKEND_URL = "http://localhost:65432/abacship-backend"

player1_guess_response = None
player2_guess_response = None

def setup_logger():
    formatter = ColoredFormatter(
        "%(asctime)s %(log_color)s%(levelname)-8s%(reset)s%(message)s",
        datefmt=None,
        reset=True,
        log_colors={
            "DEBUG": "cyan",
            "INFO": "green",
            "WARNING": "yellow",
            "ERROR": "red",
            "CRITICAL": "bold_red",
        },
    )

    logger = logging.getLogger("abacship-backend-integration")
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)

    return logger


def check_authority_setup(authToken):
    logger.info("Test authority setup")
    loc = f"{ATTRIBUTES_URL}/authorities"
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    assert AUTH_NAMESPACE in response.json()


def check_attributes_setup(authToken):
    logger.info("Test attribute setup")
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    digits = ["%.2d" % i for i in range(100)]
    # add group_by to match response from attribtues service
    player1_definition = {
        "authority": AUTH_NAMESPACE,
        "name": "player1",
        "rule": "anyOf",
        "state": "published",
        "order": digits + ["board"],
        "group_by": None
    }
    player2_definition = {
        "authority": AUTH_NAMESPACE,
        "name": "player2",
        "rule": "anyOf",
        "state": "published",
        "order": digits + ["board"],
        "group_by": None
    }
    assert player1_definition in response.json() and player2_definition in response.json()


def get_entitlements_for_uuid(uuid, authToken):
    logger.debug(f"Getting entitlements for {uuid}")
    loc = f"{ENTITLEMENTS_URL}/entitlements"
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    entitlements = []
    for item in response.json():
        if uuid in item.keys():
            entitlements = entitlements + item[uuid]
    return entitlements


def post_board(board, access_token, refresh_token, name):
    params = {"access_token": access_token, "refresh_token": refresh_token, "player_name": name}
    loc = f"{ABACSHIP_BACKEND_URL}/board"
    response = requests.post(loc, params=params, json=board)
    return response


def get_status():
    loc = f"{ABACSHIP_BACKEND_URL}/status"
    response = requests.get(loc)
    return response


def reset_game():
    loc = f"{ABACSHIP_BACKEND_URL}/reset"
    response = requests.put(loc)
    return response


def get_board():
    loc = f"{ABACSHIP_BACKEND_URL}/board"
    response = requests.get(loc)
    return response


async def make_guess(guesser, row, col):
    loc1 = f"{ABACSHIP_BACKEND_URL}/check/square"
    params = {"row": row, "col": col}
    async with aiohttp.ClientSession() as session:
        async with session.post(loc1, json=guesser, params=params) as resp_guess:
            await resp_guess.json()


async def make_grant(granter):
    await asyncio.sleep(5)
    loc2 = f"{ABACSHIP_BACKEND_URL}/grant"
    async with aiohttp.ClientSession() as session:
        async with session.post(loc2, json=granter) as resp_grant:
            await resp_grant.json()


async def make_guess_and_grant(guesser, granter, row, col):
    task2 = asyncio.create_task(make_grant(granter))
    task1 = asyncio.create_task(make_guess(guesser, row, col))
    await task2
    await task1


def try_make_guess(guesser, granter, col, row):
    try:
        asyncio.run(make_guess_and_grant(guesser, granter, col, row))
        return True
    except:
        return False
    

def run_tests():
    # make sure that the authority and attributes were created
    logger.info(f"************Test attribute and authority setup************")
    keycloak_openid = KeycloakOpenID(
        server_url=KEYCLOAK_URL,
        client_id="abachsip-backend-client",
        realm_name="tdf",
    )
    authToken = keycloak_openid.token("user1", "testuser123")
    refreshToken = authToken["refresh_token"]
    authToken = authToken["access_token"]
    check_authority_setup(authToken)
    check_attributes_setup(authToken)
    logger.info("PASS")


    # make sure the backend keycloak client exists
    logger.info(f"************Test abacship backend client created***********")
    keycloak_admin = KeycloakAdmin(
        server_url=KEYCLOAK_URL,
        username=KC_ADMIN_USER,
        password=KC_ADMIN_PASSWORD,
        realm_name=REALM,
        user_realm_name="master",
    )
    client_id = keycloak_admin.get_client_id(BACKEND_CLIENTID)
    assert client_id is not None
    logger.info("PASS")


    # make sure the backend client has the right entitlements
    logger.info(f"************Test abacship backend client entitlements***********")
    client_id = keycloak_admin.get_client_id(BACKEND_CLIENTID)
    backend_entitlements = get_entitlements_for_uuid(client_id, authToken)
    assert set(backend_entitlements) == set([f"{AUTH_NAMESPACE}/attr/player1/value/board", 
                                            f"{AUTH_NAMESPACE}/attr/player2/value/board"])
    logger.info("PASS")


    #post invalid board for player 1
    logger.info(f"************Test invalid board post***********")
    response = post_board(INVALID_BOARD_MISSING, authToken, refreshToken, "player1")
    assert response.status_code == BAD_REQUEST
    response = get_status()
    assert response.json() == Status.setup
    logger.info("PASS")


    # post valid board player 1 -- make sure returned values correct
    logger.info(f"************Test valid board post player1***********")
    response = post_board(VALID_BOARD, authToken, refreshToken, "player1")
    assert response.status_code == OK
    data = response.json()
    assert data["player_info"]["name"] == "player1"
    assert data["status"] == Status.setup
    p1_access_token = data["player_info"]["access_token"]
    p1_refresh_token = data["player_info"]["refresh_token"]
    logger.info("PASS")
    

    # check player 1 entitlements -- use returned access token
    logger.info(f"************Test entitlements setup player1***********")
    user_id = keycloak_admin.get_user_id("user1")
    p1_entitlements = get_entitlements_for_uuid(user_id, p1_access_token)
    p1_abacship_entitlements = [x for x in p1_entitlements if AUTH_NAMESPACE in x]
    assert set(p1_abacship_entitlements) == set([f"{AUTH_NAMESPACE}/attr/player1/value/board"])
    logger.info("PASS")


    # post valid board player 2 -- make sure returned values correct
    logger.info(f"************Test valid board post player2***********")
    authToken2 = keycloak_openid.token("user2", "testuser123")
    refreshToken2 = authToken2["refresh_token"]
    authToken2 = authToken2["access_token"]
    response = post_board(VALID_BOARD_2, authToken2, refreshToken2, "player2")
    assert response.status_code == OK
    data = response.json()
    assert data["player_info"]["name"] == "player2"
    assert data["status"] == Status.p1_turn
    p2_access_token = data["player_info"]["access_token"]
    p2_refresh_token = data["player_info"]["refresh_token"]
    logger.info("PASS")


    # check player 2 entitlements -- use returned access token
    logger.info(f"************Test entitlements setup player2***********")
    user_id = keycloak_admin.get_user_id("user2")
    p2_entitlements = get_entitlements_for_uuid(user_id, p2_access_token)
    p2_abacship_entitlements = [x for x in p2_entitlements if AUTH_NAMESPACE in x]
    assert set(p2_abacship_entitlements) == set([f"{AUTH_NAMESPACE}/attr/player2/value/board"])
    logger.info("PASS")


    # get encrypted boards
    logger.info(f"************Test get encrypted boards***********")
    response = get_board()
    encrypted_board = response.json()
    assert "player1" in encrypted_board.keys()
    assert "player2" in encrypted_board.keys()
    logger.info("PASS")


    # p1 makes guess -- make sure correct encrypted string is returned
    logger.info(f"************Test make guess and grant player 1***********")
    guesser = {
        "name": "player1",
        "refresh_token": p1_refresh_token,
        "access_token": p1_access_token
    }
    granter = {
        "name": "player2"
    }
    assert try_make_guess(guesser, granter, 1,2)
    logger.info("PASS")


    # check p1 entitlements and make sure they have new attribute
    logger.info(f"************Test player1 given entitlement***********")
    p1_access_token = keycloak_openid.token("user1", "testuser123")
    p1_refresh_token = p1_access_token["refresh_token"]
    p1_access_token = p1_access_token["access_token"]
    user_id = keycloak_admin.get_user_id("user1")
    p1_entitlements = get_entitlements_for_uuid(user_id, p1_access_token)
    p1_abacship_entitlements = [x for x in p1_entitlements if AUTH_NAMESPACE in x]
    assert set(p1_abacship_entitlements) == set([f"{AUTH_NAMESPACE}/attr/player1/value/board",
     f"{AUTH_NAMESPACE}/attr/player2/value/12"])
    logger.info("PASS")


    # make sure its p2 turn
    logger.info(f"************Test status update***********")
    status = get_status()
    assert status.json() == Status.p2_turn
    logger.info("PASS")


    # p2 makes a guess
    logger.info(f"************Test make guess and grant player 2***********")
    guesser = {
        "name": "player2",
        "refresh_token": p2_refresh_token,
        "access_token": p2_access_token
    }
    granter = {
        "name": "player1"
    }
    assert try_make_guess(guesser, granter, 3,4)
    logger.info("PASS")

    
    # check p2 entitlements and make srue they have new attribtue
    logger.info(f"************Test player2 given entitlement***********")
    user_id = keycloak_admin.get_user_id("user2")
    p2_entitlements = get_entitlements_for_uuid(user_id, p1_access_token)
    p2_abacship_entitlements = [x for x in p2_entitlements if AUTH_NAMESPACE in x]
    assert set(p2_abacship_entitlements) == set([f"{AUTH_NAMESPACE}/attr/player2/value/board",
     f"{AUTH_NAMESPACE}/attr/player1/value/34"])
    logger.info("PASS")


    # reset game
    logger.info(f"************Test reset game***********")
    response = reset_game()
    data = response.json()
    #check status
    assert data["status"] == Status.setup
    # check entitlements for both players
    user_id = keycloak_admin.get_user_id("user1")
    p1_entitlements = get_entitlements_for_uuid(user_id, authToken)
    p1_abacship_entitlements = [x for x in p1_entitlements if AUTH_NAMESPACE in x]
    assert p1_abacship_entitlements == []
    user_id = keycloak_admin.get_user_id("user2")
    p2_entitlements = get_entitlements_for_uuid(user_id, authToken)
    p2_abacship_entitlements = [x for x in p2_entitlements if AUTH_NAMESPACE in x]
    assert p1_abacship_entitlements == []
    logger.info("PASS")
        

if __name__ == "__main__":
    # create a logger
    logger = setup_logger()

    logger.info("Make sure backend is fully setup -- sleep 10s")
    time.sleep(10)

    run_tests()