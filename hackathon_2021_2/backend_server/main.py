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
    # await database.connect()
    pass


@app.on_event("shutdown")
async def shutdown():
    # await database.disconnect()
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

class Status(int, Enum):
    setup = 1
    p1_turn = 2
    p2_turn = 3
    p1_request_attr_from_p2 = 4
    p2_request_attr_from_p2 = 5
    p1_victory = 6
    p2_victory = 7
    backend_processing = 0

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
    pass
    

class Player(BaseModel):
    name: Literal['player1', 'player2']
    refresh_token: Optional[str] = None
    access_token: Optional[str] = None
    username: Optional[str] = None #ex user1 -- wont need if i have access token


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
    pass

class Row(BaseModel):
    __root__: conlist(str, min_items=10, max_items=10)

class SingleBoard(BaseModel):
    __root__: conlist(Row, min_items=10, max_items=10)

class WholeBoard(BaseModel):
    player1: SingleBoard
    player2: SingleBoard
    


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
    pass


@app.post(
    "/submit/board",
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
    pass

###https://editor.swagger.io/#/