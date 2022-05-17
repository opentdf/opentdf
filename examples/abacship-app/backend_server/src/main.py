import json
import logging
import os
import sys
import requests
import asyncio
from enum import Enum
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Literal#, Annotated

from fastapi import (
    FastAPI,
    Body,
    Depends,
    HTTPException,
    Request,
    Query,
    Security,
    status,
)
from fastapi.openapi.utils import get_openapi

from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel
#from python_base import Pagination, get_query

from game import (
    Status,
    Player,
    WholeBoard,
    Game,
    validBoard
)
from services import (
    setupKeycloak,
    setupAttributes,
    setupEntitlements,
    teardownEntitlements,
    teardownAttributes,
    teardownKeycloak,
    setupUserEntitlements,
    addUserEntitlement
)

from constants import *


logging.basicConfig(
    stream=sys.stdout, level=os.getenv("SERVER_LOG_LEVEL", "CRITICAL").upper()
)
logger = logging.getLogger(__package__)

class Settings(BaseSettings):
    base_path: str = os.getenv("SERVER_ROOT_PATH", "")


settings = Settings()

app = FastAPI(
    debug=True,
    root_path=os.getenv("SERVER_ROOT_PATH", ""),
    servers=[{"url": settings.base_path}],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#create the game
abacship = Game()


# middleware
@app.middleware("http")
async def add_response_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.on_event("startup")
async def startup():
    """
    load all the attributes (if not already there)
    create a backend client (if not already created)
    assign the client the proper attributes
    """
    logger.info("App Startup")
    setupKeycloak()
    setupAttributes()
    setupEntitlements()


@app.on_event("shutdown")
async def shutdown():
    """
    delete all the added attributes from the users
    delete the attributes from the backend client
    delete attributes from the DB
    delete the backend client
    """
    logger.debug("App Teardown")
    if abacship.player1 is not None:
        teardownEntitlements(abacship.player1.username, abacship.player2.username)
    teardownAttributes()
    teardownKeycloak()


@app.get("/", include_in_schema=False)
async def read_semver():
    return {"Hello": "ABACSHIP BACKEND 0.0.1"}

class ProbeType(str, Enum):
    liveness = "liveness"
    readiness = "readiness"

@app.get("/healthz", status_code=NO_CONTENT, include_in_schema=False)
async def read_liveness(probe: ProbeType = ProbeType.liveness):
    pass

@app.get(
    "/status",
    responses={
        200: {"content": {"application/json": {"example":{
            "status": 2}}}}
    },
)
async def get_status():
    """
    Returns the current game status
    (See Status enum -- possibly restructuring)
    """
    logger.debug("Get status")
    return abacship.status


@app.post(
    "/grant",
    responses={
        200: {"content": {"application/json": {"example":{
            "status": 2}}}}
    }
)
async def grant_attribute(player: Player):
    """
    Accepts Player information of player making POST request
    Grants an attribute to opposing player
    Returns game status
    """
    logger.debug("Grant attribute")
    if player.name == "player1" and abacship.status == Status.p2_request_attr_from_p1:
        logger.debug("player1 grants attribute to player2")
        abacship.status = Status.p1_grants_attr_to_p2
    elif player.name == "player2" and abacship.status == Status.p1_request_attr_from_p2:
        logger.debug("player2 grants attribute to player1")
        abacship.status = Status.p2_grants_attr_to_p1

    return {"status": abacship.status}
    


@app.get(
    "/board",
    responses={
        200: {"content": {"application/json": {"example":{
            "player1": [
            ["encryptedstring00", "encryptedstring01", "..."],
            ["encryptedstring10", "encryptedstring11", "..."],
            ["..."],
            ["encryptedstring90", "encryptedstring91", "..."]],
            "player2":[
                ["encryptedstring00", "encryptedstring01", "..."],
            ["encryptedstring10", "encryptedstring11", "..."],
            ["..."],
            ["encryptedstring90", "encryptedstring91", "..."]]
            }}}}
    }
)
async def get_board():
    """
    Returns 2D array board representation for each player (with encrypted strings, base64-encoded)
    (or nothing if the board is not set yet)
    """
    logger.debug("Get board")
    return abacship.getWholeBoard()


@app.post(
    "/board",
    responses={
        200: {"content": {"application/json": {"example":{
            "player_info": {
            "name": "player1",
            "refresh_token": "the refresh token ...",
            "access_token": "the access token ...",
            },
            "full_board": {"player1": [
            ["encryptedstring00", "encryptedstring01", "..."],
            ["encryptedstring10", "encryptedstring11", "..."],
            ["..."],
            ["encryptedstring90", "encryptedstring91", "..."]],
            "player2":[
                ["encryptedstring00", "encryptedstring01", "..."],
            ["encryptedstring10", "encryptedstring11", "..."],
            ["..."],
            ["encryptedstring90", "encryptedstring91", "..."]]
            },
            "status": 2}}}}
    }
)
async def post_board(access_token: str, refresh_token: str, board: conlist(conlist(str, min_items=10, max_items=10), min_items=10, max_items=10)):
    """
    submit refresh token and 2D array representation of board (unencrypted)
    returns player information including assigned name and new refresh token,
    and the full board

    (will not return until both player submit their board -- tentative design choice)

    performs board verification, assigns attributes to users,
    encryptes strings with tile attribtues

    (im not sure if I will need both the access and refresh token 
    -- i will need the username (ex user1) in order to assign attributes, which i can
    get from the access_token, or can just change it to pass in the username instead)
    """
    logger.debug("Post board")
    # some sort of board verification -- raise error if invalid
    if not validBoard(board):
        raise HTTPException( #could add some more reasoning here -- valid board could return why invalid
            status_code=BAD_REQUEST,
            detail="Invalid board",
        )
    # store the player information in the game (user name [get from access token], current access token and refresh token?)
    player_name, username = abacship.setupPlayer(access_token, board, refresh_token)
    # assign the attributes to this player
    setupUserEntitlements(username, player_name)
    # encrypt this board
    if player_name == "player1":
        abacship.player1.encryptBoard(abacship.opentdf_oidccreds)
        abacship.player1.refreshPlayerTokens()
    else:
        abacship.player2.encryptBoard(abacship.opentdf_oidccreds)
        abacship.player2.refreshPlayerTokens()
    # await other players board -- do not reutrn until game has both boards stored (some boolean)
    while not (abacship.player1 is not None and abacship.player2 is not None and abacship.player1.ready and abacship.player2.ready):
        await asyncio.sleep(1)
    # set status to p1 turn
    if abacship.status == Status.setup:
        abacship.status = Status.p1_turn
    # return player information and full board and game status
    wholeboard = abacship.getWholeBoard()
    payload = {}
    if player_name == "player1":
        payload = {
            "player_info": {
            "name": player_name,
            "refresh_token": abacship.player1.player.refresh_token,
            "access_token": abacship.player1.player.access_token,
            },
            "full_board": wholeboard,
            "status": abacship.status
            }
    else:
        payload = {
            "player_info": {
            "name": player_name,
            "refresh_token": abacship.player2.player.refresh_token,
            "access_token": abacship.player2.player.access_token,
            },
            "full_board": wholeboard,
            "status": abacship.status
        }
    logger.debug(f"Payload: {payload}")
    return payload


@app.post(
    "/check/square",
    responses={
        200: {"content": {"application/json": {"example":{
            "player_info": {
            "name": "player1",
            "refresh_token": "the refresh token ...",
            "access_token": "the access token ...",
            },
            "full_board": {"player1": [
            ["encryptedstring00", "encryptedstring01", "..."],
            ["encryptedstring10", "encryptedstring11", "..."],
            ["..."],
            ["encryptedstring90", "encryptedstring91", "..."]],
            "player2":[
                ["encryptedstring00", "encryptedstring01", "..."],
            ["encryptedstring10", "encryptedstring11", "..."],
            ["..."],
            ["encryptedstring90", "encryptedstring91", "..."]]
            },
            "status": 2}}}}
    }
)
async def check_square(player: Player, row: int, col: int):
    """
    player: the player making the request
    row: the row of the square to check on opponents board
    col: the col of the square to check on opponents board

    request attribute at that square from opponent
    assign attribute to player
    get updated tokens

    returns Player with updated refresh and access token
    returns updated board
    returns new status
    """
    logger.debug(f"Check square {row}, {col}")
    if row not in range(SIZE) or col not in range(SIZE):
        raise HTTPException(
            status_code=BAD_REQUEST,
            detail="Invalid row/col",
        )

    if player.name == "player1":
        if str(row)+str(col) in abacship.player1.guesses:
            raise HTTPException( #could add some more reasoning here -- valid board could return why invalid
            status_code=BAD_REQUEST,
            detail="Has already been guessed",
        )
        abacship.status = Status.p1_request_attr_from_p2
        # await grant access
        logger.debug("Waiting for player2 to grant access")
        while not (abacship.status==Status.p2_grants_attr_to_p1):
            await asyncio.sleep(1)
        # actually grant the access
        abacship.player1.makeGuess(row, col)
        # refresh tokens?
        try:
            abacship.player1.refreshPlayerTokens()
        except Exception as e:
            raise HTTPException( 
            status_code=BAD_REQUEST,
            detail=f"Unable to refresh keycloak tokens -- {str(e)}",
            ) 
        # set new status
        victory = abacship.victoryCheck()
        if not victory:
            abacship.status = Status.p2_turn
        #construct payload
        payload = {
            "player_info": {
            "name": player.name,
            "refresh_token": abacship.player1.player.refresh_token,
            "access_token": abacship.player1.player.access_token,
            },
            "full_board": abacship.getWholeBoard(),
            "status": abacship.status
        }
    else:
        if str(row)+str(col) in abacship.player2.guesses:
            raise HTTPException( #could add some more reasoning here -- valid board could return why invalid
            status_code=BAD_REQUEST,
            detail="Has already been guessed",
            )
        abacship.status = Status.p2_request_attr_from_p1
        # await grant access
        logger.debug("Waiting for player1 to grant access")
        while not (abacship.status==Status.p1_grants_attr_to_p2):
            await asyncio.sleep(1)
        # actually grant the access
        abacship.player2.makeGuess(row, col)
        # refresh tokens?
        abacship.player2.refreshPlayerTokens()
        # set new status
        victory = abacship.victoryCheck()
        if not victory:
            abacship.status = Status.p1_turn
        #construct payload
        payload = {
            "player_info": {
            "name": player.name,
            "refresh_token": abacship.player2.player.refresh_token,
            "access_token": abacship.player2.player.access_token,
            },
            "full_board": abacship.getWholeBoard(),
            "status": abacship.status
        }
    logger.debug(f"Payload: {payload}")
    return payload

