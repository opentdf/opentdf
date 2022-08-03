import json
import logging
import os
import sys
import requests
import uuid
import base64
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
from keycloak import KeycloakOpenID, KeycloakAdmin
from pydantic import AnyUrl, BaseSettings, Field, Json, ValidationError, conlist
from pydantic.main import BaseModel
#from python_base import Pagination, get_query
from sqlalchemy import and_, insert
from sqlalchemy.orm import Session, sessionmaker, declarative_base
from opentdf import NanoTDFClient, OIDCCredentials, LogLevel


# POSTGRES_HOST = "localhost"
# POSTGRES_PORT = "5432"
# POSTGRES_USER = "secure_cycle_manager"
# POSTGRES_PASSWORD = "myPostgresPassword"
# POSTGRES_DATABASE = "tdf_database"
# POSTGRES_SCHEMA = "secure_cycle"

AUTH_NAMESPACE = "http://period.com"

BACKEND_ATTR = "http://period.com/attr/backend/value/backend"

BACKEND_CLIENTID = "dcr-test"
BACKEND_CLIENT_SECRET = "123-456"

# to get authToken for posting attributes and entitlements
SAMPLE_USER = "testuser@virtru.com"
SAMPLE_PASSWORD = "testuser123"

KC_ADMIN_USER = os.getenv("KC_ADMIN_USER", "keycloakadmin")
KC_ADMIN_PASSWORD = os.getenv("KC_ADMIN_PASSWORD", "mykeycloakpassword")
REALM = os.getenv("OIDC_REALM", "tdf")
KEYCLOAK_URL = os.getenv("OIDC_SERVER_URL", "http://localhost:65432/auth")
OIDC_ENDPOINT = os.getenv("OIDC_ENDPOINT", "http://localhost:65432")

ENTITLEMENTS_URL = os.getenv("ENTITLEMENTS_URL", "http://localhost:65432/api/entitlements")
ATTRIBUTES_URL = os.getenv("ATTRIBUTES_URL","http://localhost:65432/api/attributes")
KAS_URL = os.getenv("KAS_URL", "http://localhost:65432/api/kas")
EXTERNAL_KAS_URL = os.getenv("EXTERNAL_KAS_URL", "http://localhost:65432/api/kas")

KAS_PUB_KEY_URL = "/kas_public_key?algorithm=ec:secp256r1"

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "secure_cycle_manager")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "myPostgresPassword")
POSTGRES_DATABASE = os.getenv("POSTGRES_DATABASE", "tdf_database")
POSTGRES_SCHEMA = os.getenv("POSTGRES_SCHEMA", "secure_cycle")

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DATABASE}"

# OIDC_REALM = "tdf"
# OIDC_CLIENT_ID = "dcr-test"
# OIDC_CLIENT_SECRET = "123-456"
# OIDC_AUTHORIZATION_URL = "http://localhost:65432/auth/realms/tdf/protocol/openid-connect/auth"
# OIDC_SERVER_URL = "http://localhost:65432/auth/"
# OIDC_TOKEN_URL = "http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token"
# OIDC_CONFIGURATION_URL = "http://localhost:65432/auth/realms/tdf/.well-known/openid-configuration"
# OIDC_SCOPES = "email"
# SERVER_PUBLIC_NAME = "Secure Cycle Backend"

####################### Server Setup ##################################

logging.basicConfig(
    stream=sys.stdout, level=os.getenv("SERVER_LOG_LEVEL", "INFO").upper()
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
    openapi_url: str = os.getenv("SERVER_ROOT_PATH", "")+"/openapi.json"


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


####################### OIDC ##################################

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

oidc_creds = OIDCCredentials()
oidc_creds.set_client_credentials_client_secret(
    client_id=BACKEND_CLIENTID,
    client_secret=BACKEND_CLIENT_SECRET,
    organization_name=REALM,
    oidc_endpoint=OIDC_ENDPOINT,
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


def createAttributeDefinition(definition, authToken):
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    logger.debug(f"Adding attribute definition {definition}")
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    if definition in response.json():
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

def deleteAttributeDefinition(definition, authToken):
    loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    logger.debug(f"Adding attribute definition {definition}")
    params = {"name": "tracker", "authority": AUTH_NAMESPACE}
    response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"}, params=params)
    definitions = response.json()
    # loc = f"{ATTRIBUTES_URL}/definitions/attributes"
    # logger.debug(f"Deleting attribute definition {definition}")
    # response = requests.get(loc, headers={"Authorization": f"Bearer {authToken}"})
    # if definition not in response.json():
    #     logger.info(f"Attribute definition {definition} does not exists")
    #     return
    for definition in definitions:

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

def createAttributes(order):
    logger.debug("Setting up attributes")
    deleteAttributes(order)
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    attr_definition = {
    "authority": AUTH_NAMESPACE,
    "name": "tracker",
    "rule": "allOf",
    "state": "published",
    "order": order
    }
    createAttributeDefinition(attr_definition, authToken)

def deleteAttributes(order):
    logger.debug("Deleting attributes")
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    attr_definition = {
    "authority": AUTH_NAMESPACE,
    "name": "tracker",
    "rule": "allOf",
    "state": "published",
    "order": order
    }
    deleteAttributeDefinition(attr_definition, authToken)

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


def entitleClients(keycloak_admin, client_ids, uuids):
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    attr_map = {client_ids[i]: [f"{AUTH_NAMESPACE}/attr/tracker/value/"
                                + uuids[i]] for i in range(len(client_ids))}
    insertAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)

def removeEntitlements(keycloak_admin, client_ids, uuids):
    authToken = keycloak_openid.token(SAMPLE_USER, SAMPLE_PASSWORD)["access_token"]
    attr_map = {client_ids[i]: [f"{AUTH_NAMESPACE}/attr/tracker/value/"
                                + uuids[i]] for i in range(len(client_ids))}
    deleteAttrsForClients(keycloak_admin, ENTITLEMENTS_URL, attr_map, authToken)


####################### Database ##################################

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
    sqlalchemy.Column("date", sqlalchemy.VARCHAR),
    sqlalchemy.Column("on_period", sqlalchemy.VARCHAR),
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




####################### Helpers ##################################

def backen_encrypt(items):
    # where items is a list of things
    pass

def backend_decrypt(items):
    #where items is a list of encrypted strings with backend attr
    pass

def get_clients_and_ids(keycloak_admin):
    clients = [(item["clientId"],item["id"]) for item in keycloak_admin.get_clients()]
    client_ids, ids = list(zip(*clients))
    return client_ids, ids

def gen_uuids(number):
    return [str(uuid.uuid4()) for i in range(number)]

async def setup_keycloak():
    logger.debug(f"Setting up keycloak {KEYCLOAK_URL}")
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    client_ids, ids = get_clients_and_ids(keycloak_admin)
    uuids = gen_uuids(len(client_ids))
    try:
        createAttributes(uuids)
        entitleClients(keycloak_admin, client_ids, uuids)
    except:
        await teardown_keycloak(uuids)
        createAttributes(uuids) #
        entitleClients(keycloak_admin, client_ids, uuids)
    return ids, uuids

async def teardown_keycloak(uuids=None):
    logger.debug(f"Tearing down up keycloak {KEYCLOAK_URL}")
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    client_ids, ids = get_clients_and_ids(keycloak_admin)
    if uuids is None:
        uuid_map = await get_uuids()
        # add step to decrypt uuids
        if uuid_map:
            uuids = [uuid_map[k_id] for k_id in ids]
            removeEntitlements(keycloak_admin, client_ids, uuids)
            deleteAttributes(uuids)
    else:
        removeEntitlements(keycloak_admin, client_ids, uuids)
        deleteAttributes(uuids)




####################### Endpoints ##################################

# middleware
@app.middleware("http")
async def add_response_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

async def populate_uuids(uuids, b64ids):
    # insert
    # query = table_authority.insert().values(name=request.authority)
    rows = [{"keycloak_id": b64ids[i], "uuid": uuids[i]} for i in range(len(uuids))]
    try:
        await database.execute(table_uuid.insert(rows))
    except UniqueViolationError as e:
        raise HTTPException(
            status_code=BAD_REQUEST, detail=f"duplicate: {str(e)}"
        ) from e

async def delete_uuids():
    statement = table_uuid.delete()
    await database.execute(statement)
    return {}

async def delete_cycle_data():
    statement = table_cycle_data.delete()
    await database.execute(statement)
    return {}

async def get_uuids():
    query = table_uuid.select()
    result = await database.fetch_all(query)
    uuids = {}
    for row in result:
        uuids[
            base64.b64decode(row.get(table_uuid.c.keycloak_id).encode('ascii')).decode('ascii')
        ] = f"{row.get(table_uuid.c.uuid)}"
    return uuids

async def get_cycle_data():
    query = table_cycle_data.select()
    result = await database.fetch_all(query)
    return result
    

@app.on_event("startup")
async def startup():
    # delete all old stuff?
    # create new stuff?
    await database.connect()
    await teardown_keycloak()
    ids, uuids = await setup_keycloak()
    b64ids = [base64.b64encode(item.encode('ascii')).decode('ascii') for item in ids]
    #add step to encrypt uuids
    try:
        await delete_uuids()
        await delete_cycle_data()
        await populate_uuids(uuids, b64ids)
    except Exception as e:
        logger.error(f"ERROR {str(e)}")
        teardown_keycloak(uuids)


@app.on_event("shutdown")
async def shutdown():
    # get uuid -> client map
    # delete contents of uuid table ?
    # delete contents of other table ?
    # remove entitlements? 
    # delete attributes?
    await teardown_keycloak()
    await delete_uuids()
    await delete_cycle_data()
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

class Day(BaseModel):
    date: str
    on_period: str
    symptoms: str

class EndDates(BaseModel):
    enddates: str
    

class Symptoms(BaseModel):
    symptoms: str

async def get_uuid_from_client_id(client_id):
    keycloak_admin = KeycloakAdmin(
    server_url=KEYCLOAK_URL,
    username=KC_ADMIN_USER,
    password=KC_ADMIN_PASSWORD,
    realm_name=REALM,
    user_realm_name="master",
    )
    keycloak_id = base64.b64encode(keycloak_admin.get_client_id(client_id).encode('ascii')).decode('ascii')
    query = table_uuid.select().where(table_uuid.c.keycloak_id == keycloak_id)
    result = await database.fetch_one(query)
    # need to do some decrypting here
    return result.uuid


@app.get("/uuid", 
        # dependencies=[Depends(get_auth)], 
        responses={
        200: {"content": {"data": {"example":"abcd-1234-abcd-1234"}
    }}}
)
async def get_uuid(client_id: str):
    return await get_uuid_from_client_id(client_id)
    # return await get_cycle_data()


async def retrieve_dates(uuid, ids):
    if ids:
        query = table_cycle_data.select().where(and_(table_cycle_data.c.uuid == uuid,
         table_cycle_data.c.id.in_(ids)))
    else:
        query = table_cycle_data.select().where(table_cycle_data.c.uuid == uuid)
    result = await database.fetch_all(query)
    records = []
    logger.info(result)
    for row in result:
        records.append({"id":row.get(table_cycle_data.c.id), "uuid": row.get(table_cycle_data.c.uuid), 
        "date": row.get(table_cycle_data.c.date), "on_period": row.get(table_cycle_data.c.on_period),
        "symptoms": row.get(table_cycle_data.c.symptoms)})
    return records

@app.post("/getdate",# dependencies=[Depends(get_auth)], 
        responses={
        200: {"content": {"application/json": {"example":[{"id": 10, "uuid": "1234", 
        "date": "encryptedString", "on_period": "encryptedString", "symptoms": "encrypte_string"}]}
    }}}
)
async def post_get_dates(uuid: str, ids: Optional[List[int]]):
    return await retrieve_dates(uuid, ids if ids is not None else [])


@app.get("/date", 
        # dependencies=[Depends(get_auth)], 
        responses={
        200: {"content": {"application/json": {"example":[{"id": 10, "uuid": "1234", 
        "date": "encryptedString", "on_period": "encryptedString", "symptoms": "encrypte_string"}]}
    }}}
)
async def get_dates(uuid: str, ids: Optional[List[int]]):
    return retrieve_dates(uuid, ids if ids is not null else [])

async def insert_date(uuid, day):
    # insert
    query = table_cycle_data.insert().values(uuid=uuid, date=day.date, on_period=day.on_period,
    symptoms=day.symptoms)
    try:
        await database.execute(query)
    except UniqueViolationError as e:
        raise HTTPException(
            status_code=BAD_REQUEST, detail=f"duplicate: {str(e)}"
        ) from e
    # select
    query = table_cycle_data.select().where(and_(table_cycle_data.c.uuid == uuid,
         table_cycle_data.c.date == day.date,
         table_cycle_data.c.on_period == day.on_period,
         table_cycle_data.c.symptoms == day.symptoms))
    rows = await database.fetch_all(query)
    ids = [row.id for row in rows]
    return rows[ids.index(max(ids))]

@app.post("/date", 
        # dependencies=[Depends(get_auth)], 
        responses={
        200: {"content": {"application/json": {"example":{"id": 10, "uuid": "1234", 
        "date": "encryptedString", "on_period": "encryptedString", "symptoms": "encrypte_string"}}
    }}}
)
async def post_dates(uuid: str, day: Day):
    return await insert_date(uuid, day)

async def update_date(uuid, rid, day):
    # make sure its there
    query = table_cycle_data.select().where(table_cycle_data.c.id == rid)
    result = await database.fetch_one(query)
    if not result:
        raise HTTPException(
            status_code=BAD_REQUEST, detail=f"id not in DB"
        )
    
    query = table_cycle_data.update().where(table_cycle_data.c.id == rid).values(
        uuid=uuid, date=day.date, on_period=day.on_period,symptoms=day.symptoms)
    await database.execute(query)

    # select
    query = table_cycle_data.select().where(table_cycle_data.c.id == rid)
    result = await database.fetch_one(query)
    return result

@app.put("/date", 
        # dependencies=[Depends(get_auth)], 
        responses={
        200: {"content": {"application/json": {"example":{"id": 10, "uuid": "1234", 
        "date": "encryptedString", "on_period": "encryptedString", "symptoms": "encrypte_string"}}}
    }}
)
async def put_dates(uuid: str, rid: int, day: Day):
    return await update_date(uuid, rid, day)

@app.post("/reset",
 # dependencies=[Depends(get_auth)]
)
async def post_reset():
    await teardown_keycloak()
    await delete_uuids()
    await delete_cycle_data()
    ids, uuids = await setup_keycloak()
    b64ids = [base64.b64encode(item.encode('ascii')).decode('ascii') for item in ids]
    #add step to encrypt uuids
    await delete_uuids()
    await delete_cycle_data()
    await populate_uuids(uuids, b64ids)
    return


# @app.get("/onperiod", 
#         # dependencies=[Depends(get_auth)], 
#         responses={
#         200: {"content": {"application/json": {"example":{"enddates": {"encrypted_string"}}}
#     }}}
# )
# async def get_enddates(uuid: str):
#     pass

# @app.post("/onperiod", 
#         # dependencies=[Depends(get_auth)], 
#         responses={
#         200: {"content": {"application/json": {"example":{"enddates": {"encrypted_string"}}}
#     }}}
# )
# async def post_enddates(uuid: str, enddates: EndDates):
#     pass

# @app.get("/symptoms", 
#         # dependencies=[Depends(get_auth)], 
#         responses={
#         200: {"content": {"application/json": {"example":{"startdates": {"encrypted_string"}}}
#     }}}
# )
# async def get_symptoms(uuid: str):
#     pass

# @app.get("/symptoms", 
#         # dependencies=[Depends(get_auth)], 
#         responses={
#         200: {"content": {"application/json": {"example":{"symptoms": {"encrypted_string"}}}
#     }}}
# )
# async def post_symptoms(uuid: str, symptoms: Symptoms):
#     pass
