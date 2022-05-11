import json
import logging
import os
import sys
import requests
from enum import Enum
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED
from urllib.parse import urlparse
from pprint import pprint
from typing import Optional, List, Literal#, Annotated
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

import databases as databases
import sqlalchemy
from asyncpg import UniqueViolationError
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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2AuthorizationCodeBearer, OpenIdConnect
from keycloak import KeycloakOpenID
from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel
#from python_base import Pagination, get_query
from sqlalchemy import and_
from sqlalchemy.orm import Session, sessionmaker, declarative_base

from game import Status, Player, Row, SingleBoard, WholeBoard, Game, valid_board
from services import *


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


def get_retryable_request():
    retry_strategy = Retry(total=3, backoff_factor=1)

    adapter = HTTPAdapter(max_retries=retry_strategy)

    http = requests.Session()
    http.mount("https://", adapter)
    http.mount("http://", adapter)
    return http


# middleware
@app.middleware("http")
async def add_response_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.on_event("startup")
async def startup():
    # load all the attributes (if not already there)
    # create a backend client (if not already created)
    # assign the client the proper attributes
    pass


@app.on_event("shutdown")
async def shutdown():
    # delete all the added attributes from the users
    # delete the attributes from the backend client
    # delete attributes from the DB
    # delete the backend client
    pass


@app.get("/", include_in_schema=False)
async def read_semver():
    return {"Hello": "ABACSHIP BACKEND 0.0.1"}

class ProbeType(str, Enum):
    liveness = "liveness"
    readiness = "readiness"

@app.get("/healthz", status_code=NO_CONTENT, include_in_schema=False)
async def read_liveness(probe: ProbeType = ProbeType.liveness):
    # if probe == ProbeType.readiness:
    #     await database.execute("SELECT 1")
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
    #just return the current stored status
    pass


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
    # change game status back to opposing players turn?
    # return new status
    pass
    


@app.get(
    "/board",
    response_model=WholeBoard,
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
    Returns 2D array board representation for each player (with encrypted strings)
    (or nothing if the board is not set yet)
    """
    #return the stored board
    pass


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
async def submit_board(access_token: str, refresh_token: str, board: SingleBoard):
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
    # some sort of board verification -- raise error if invalid
    # store the player information in the game (user name [get from access token], current access token and refresh token?)
    # encrypt each tile with correct attributes
    # store the board in the game
    # await other players board -- do not reutrn until game has both boards stored (some boolean)
    # return player information and full board and game status
    pass



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
    # check if square already checked -- if so tell them?
    # change status to p1 request p2 or whatever
    # 
    pass

###https://editor.swagger.io/#/