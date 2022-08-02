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


POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
POSTGRES_USER = "secure_cycle_manager"
POSTGRES_PASSWORD = "myPostgresPassword"
POSTGRES_DATABASE = "tdf_database"
POSTGRES_SCHEMA = "secure_cycle"

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DATABASE}"
database = databases.Database(DATABASE_URL)

OIDC_REALM = "tdf"
OIDC_CLIENTID = "tdf-attributes"
OIDC_CLIENT_SECRET = "myclientsecret"
OIDC_AUTHORIZATION_URL = "http://localhost:65432/auth/realms/tdf/protocol/openid-connect/auth"
OIDC_SERVER_URL = "http://localhost:65432/auth"
OIDC_TOKEN_URL = "http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token"
OIDC_CONFIGURATION_URL = "http://localhost:65432/auth/realms/tdf/.well-known/openid-configuration"
OIDC_SCOPES = "email"
SERVER_PUBLIC_NAME = "Secure Cycle Backend"


logging.basicConfig(
    stream=sys.stdout, level=os.getenv("SERVER_LOG_LEVEL", "CRITICAL").upper()
)
logger = logging.getLogger(__package__)

swagger_ui_init_oauth = {
    "usePkceWithAuthorizationCodeGrant": True,
    "clientId": os.getenv("OIDC_CLIENT_ID"),
    "realm": os.getenv("OIDC_REALM"),
    "appName": os.getenv("SERVER_PUBLIC_NAME"),
    "scopes": [os.getenv("OIDC_SCOPES")],
    "authorizationUrl": os.getenv("OIDC_AUTHORIZATION_URL"),
}

class Settings(BaseSettings):
    base_path: str = os.getenv("SERVER_ROOT_PATH", "")


settings = Settings()

app = FastAPI(
    debug=True,
    root_path=os.getenv("SERVER_ROOT_PATH", ""),
    servers=[{"url": settings.base_path}],
    swagger_ui_init_oauth=swagger_ui_init_oauth,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=(os.environ.get("SERVER_CORS_ORIGINS", "").split(",")),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    # format f"{keycloak_url}realms/{realm}/protocol/openid-connect/auth"
    authorizationUrl=os.getenv("OIDC_AUTHORIZATION_URL", ""),
    # format f"{keycloak_url}realms/{realm}/protocol/openid-connect/token"
    tokenUrl=os.getenv("OIDC_TOKEN_URL", ""),
)

keycloak_openid = KeycloakOpenID(
    # trailing / is required
    server_url=os.getenv("OIDC_SERVER_URL"),
    client_id=os.getenv("OIDC_CLIENT_ID"),
    realm_name=os.getenv("OIDC_REALM"),
    client_secret_key=os.getenv("OIDC_CLIENT_SECRET"),
    verify=True,
)


def get_retryable_request():
    retry_strategy = Retry(total=3, backoff_factor=1)

    adapter = HTTPAdapter(max_retries=retry_strategy)

    http = requests.Session()
    http.mount("https://", adapter)
    http.mount("http://", adapter)
    return http

# Given a realm ID, request that realm's public key from Keycloak's endpoint
#
# If anything fails, raise an exception
#
# TODO Consider replacing the endpoint here with the OIDC JWKS endpoint
# Keycloak exposes: `/auth/realms/{realm-name}/.well-known/openid-configuration`
# This is a low priority though since it doesn't save us from having to get the
# realmId first and so is a largely cosmetic difference
async def get_idp_public_key(realm_id):
    url = f"{os.getenv('OIDC_SERVER_URL').rstrip('/')}/realms/{realm_id}"

    http = get_retryable_request()

    response = http.get(
        url, headers={"Content-Type": "application/json"}, timeout=5  # seconds
    )

    if not response.ok:
        logger.warning("No public key found for Keycloak realm %s", realm_id)
        raise RuntimeError(f"Failed to download Keycloak public key: [{response.text}]")

    try:
        resp_json = response.json()
    except Exception as e:
        logger.warning(
            f"Could not parse response from Keycloak pubkey endpoint: {response}"
        )
        raise e

    keycloak_public_key = f"""-----BEGIN PUBLIC KEY-----
{resp_json['public_key']}
-----END PUBLIC KEY-----"""

    logger.debug(
        "Keycloak public key for realm %s: [%s]", realm_id, keycloak_public_key
    )
    return keycloak_public_key


# Looks as `iss` header field of token - if this is a Keycloak-issued token,
# `iss` will have a value like 'https://<KEYCLOAK_SERVER>/auth/realms/<REALMID>
# so we can parse the URL parts to obtain the realm this token was issued from.
# Once we know that, we know where to get a pubkey to validate it.
#
# `urlparse` should be safe to use as a parser, and if the result is
# an invalid realm name, no validation key will be fetched, which simply will result
# in an access denied
def try_extract_realm(unverified_jwt):
    issuer_url = unverified_jwt["iss"]
    # Split the issuer URL once, from the right, on /,
    # then get the last element of the result - this will be
    # the realm name for a keycloak-issued token.
    return urlparse(issuer_url).path.rsplit("/", 1)[-1]


def has_aud(unverified_jwt, audience):
    aud = unverified_jwt["aud"]
    if not aud:
        logger.debug("No aud found in token [%s]", unverified_jwt)
        return False
    if isinstance(aud, str):
        aud = [aud]
    if audience not in aud:
        logger.debug("Audience mismatch [%s] ⊄ %s", audience, aud)
        return False
    return True


async def get_auth(token: str = Security(oauth2_scheme)) -> Json:
    logger.debug(token)
    if logger.isEnabledFor(logging.DEBUG):
        pprint(vars(keycloak_openid))
        pprint(vars(keycloak_openid.connection))
    try:
        unverified_decode = keycloak_openid.decode_token(
            token,
            key="",
            options={"verify_signature": False, "verify_aud": False, "exp": True},
        )
        #   skip has aud
        # if not has_aud(unverified_decode, keycloak_openid.client_id):
        #     raise Exception("Invalid audience")
        return keycloak_openid.decode_token(
            token,
            key=await get_idp_public_key(try_extract_realm(unverified_decode)),
            options={"verify_signature": True, "verify_aud": False, "exp": True},
        )
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),  # "Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


database = databases.Database(DATABASE_URL)

metadata = sqlalchemy.MetaData(schema=POSTGRES_SCHEMA)

table_uuid = sqlalchemy.Table(
    "uuids",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("keycloak_id", sqlalchemy.VARCHAR),
    sqlalchemy.Column("uuid", sqlalchemy.VARCHAR)
)

table_cycle_data = sqlalchemy.Table(
    "cycle_data",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("uuid", sqlalchemy.VARCHAR),
    sqlalchemy.Column("startdates", sqlalchemy.VARCHAR),
    sqlalchemy.Column("enddates", sqlalchemy.VARCHAR),
    sqlalchemy.Column("symptoms", sqlalchemy.VARCHAR),
)

engine = sqlalchemy.create_engine(DATABASE_URL)
dbase = sessionmaker(bind=engine)


def get_db() -> Session:
    session = dbase()
    try:
        yield session
    finally:
        session.close()


class CycleSchema(declarative_base()):
    __table__ = table_cycle_data

class UUIDSchema(declarative_base()):
    __table__ = table_uuid


# middleware
@app.middleware("http")
async def add_response_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/", include_in_schema=False)
async def read_semver():
    return {"Hello": "Secure Cycle Backend 0.0.1"}

class ProbeType(str, Enum):
    liveness = "liveness"
    readiness = "readiness"

@app.get("/healthz", status_code=NO_CONTENT, include_in_schema=False)
async def read_liveness(probe: ProbeType = ProbeType.liveness):
    if probe == ProbeType.readiness:
        await database.execute("SELECT 1")

oidc_scheme = OpenIdConnect(
    openIdConnectUrl=os.getenv("OIDC_CONFIGURATION_URL", ""), auto_error=False
)