import json
import logging
from logging.config import dictConfig
import os
import sys
import requests
import asyncio
import io
import boto3
import jwt
import base64
from datetime import datetime
from opentdf import TDFClient, NanoTDFClient, OIDCCredentials, LogLevel
from enum import Enum
from http.client import NO_CONTENT, BAD_REQUEST, ACCEPTED
from fastapi.middleware.cors import CORSMiddleware
# from starlette.middleware.cors import CORSMiddleware
from typing import Optional, List, Literal, Union#, Annotated

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

ACCESS_KEY = "AKIA2KZCE7Q56T7ZXTFY"
SECRET_ACCESS_KEY = "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"
BUCKET_NAME = "hackathon-period"
ATTR_PREFIX = "http://period.com/attr/tracker/value/"
REGION = "us-east-2"


INTERNAL_KAS_URL = "http://opentdf-kas:8000"
INTERNAL_KEYCLOAK_URL= "http://keycloak-http/auth/"
EXTERNAL_KAS_URL= "http://localhost:65432/api/kas"

INTERNAL_OIDC_ENDPOINT= "http://keycloak-http/"
EXTERNAL_OIDC_ENDPOINT = "http://localhost:65432/"

KAS_URL = INTERNAL_KAS_URL
OIDC_ENDPOINT = INTERNAL_OIDC_ENDPOINT

oidc_creds = OIDCCredentials()
oidc_creds.set_client_credentials_client_secret(client_id = "tdf-client",
                                                client_secret = "123-456",
                                                organization_name = "tdf",
                                                oidc_endpoint = OIDC_ENDPOINT)


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

dictConfig(LogConfig().dict())
logger = logging.getLogger("abacship")

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
    allow_origin_regex="http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#create the clients and stuff



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


@app.on_event("shutdown")
async def shutdown():
    """
    delete all the added attributes from the users
    delete the attributes from the backend client
    delete attributes from the DB
    delete the backend client
    """
    logger.debug("App Teardown")


@app.get("/", include_in_schema=False)
async def read_semver():
    return {"Hello": "ABACSHIP BACKEND 0.0.1"}

class ProbeType(str, Enum):
    liveness = "liveness"
    readiness = "readiness"

START_DATE = "periodStart"
END_DATE = "periodEnd"
SYMP = "SYMPTOMS"

class DataType(str, Enum):
    start_date = "periodStart"
    end_date = "periodEnd"
    SYMP = "SYMPTOMS"

class Data(BaseModel):
    periodStart: Optional[List[str]]
    periodEnd: Optional[List[str]]
    SYMPTOMS: Optional[List[tuple]]

class BigRequest(BaseModel):
    access_token: str
    data_type: str
    sympList: Optional[List[str]] = None
    previous_data: Optional[Data] = None

@app.get("/healthz", status_code=NO_CONTENT, include_in_schema=False)
async def read_liveness(probe: ProbeType = ProbeType.liveness):
    if probe == ProbeType.readiness:
        logger.info("Readiness")

def download_data_actual(token):
    try:
        k_id = get_keycloak_id(token)
        # returns encrypted string
        # session = Session(aws_access_key_id=ACCESS_KEY,
        #               aws_secret_access_key=SECRET_KEY)
        s3 = boto3.client('s3', aws_access_key_id=ACCESS_KEY , aws_secret_access_key=SECRET_ACCESS_KEY)
        # Get bucket object
        # my_bucket = s3.Bucket('boto-test')
        # Download to file
        buf = io.BytesIO()
        s3.download_fileobj(BUCKET_NAME, k_id+".tdf", buf)
        # my_bucket.download_fileobj("myfile.txt", buf)
        # Get file content as bytes
        filecontent_bytes = buf.getvalue()
        # # ... or convert to string
        # filecontent_str = buf.getvalue().decode("utf-8")
        return_data = base64.b64encode(filecontent_bytes)
    except:
        logger.info("file not found")
        return_data=None
    return return_data

def get_keycloak_id(token):
    decoded = jwt.decode(token, options={"verify_signature": False})
    return decoded["sub"]


@app.post("/upload")
# async def upload_data(access_token: str, data_type: DataType, sympList: Union[str, None] = None, previous_data: Union[Data, None] = None):
async def upload_data(big_data: BigRequest):
    logger.info(big_data)
    access_token = big_data.access_token
    data_type = big_data.data_type
    sympList = big_data.sympList
    previous_data = big_data.previous_data
    # logger.info(f"{access_token}, {data_type}, {sympList}, {previous_data}")
    # append new data to old data if ther else create new data structure
    # if previous_data=={: previous_data=None
    logger.info(f"{access_token}, {data_type}, {sympList}, {previous_data}")
    now = datetime.now()
    dt_format = "%m/%d/%Y"
    date = now.strftime(dt_format)
    new_structure = dict({START_DATE: [], END_DATE: [], SYMP: []})
    if data_type == START_DATE or data_type == END_DATE:
        new_structure[data_type].append(date)
    if sympList:
        new_structure[SYMP].append([date, sympList])
    logger.info("creating total data")
    total_data = new_structure
    logger.info(total_data)
    if previous_data is not None:
        logger.info("previous not none")
        if previous_data.periodStart:
            logger.info("previous start not none")
            total_data[START_DATE] = previous_data.periodStart + new_structure[START_DATE]
        if previous_data.periodEnd:
            total_data[END_DATE] = previous_data.periodEnd + new_structure[END_DATE]
        if previous_data.SYMPTOMS:
            total_data[SYMP] = previous_data.SYMPTOMS + new_structure[SYMP]
    else:
        total_data = new_structure
    logger.info("final total_data")
    logger.info(total_data)
    # get keycloak id
    k_id = get_keycloak_id(access_token)
    attribute = ATTR_PREFIX + k_id

    # encrypt with tdf store and upload
    client = NanoTDFClient(oidc_credentials = oidc_creds,
                        kas_url = EXTERNAL_KAS_URL)
    PUB_KEY = "-----BEGIN CERTIFICATE-----\nMIIBCzCBsgIJAL1qc/lWpG3HMAoGCCqGSM49BAMCMA4xDDAKBgNVBAMMA2thczAe\nFw0yMTA5MTUxNDExNDlaFw0yMjA5MTUxNDExNDlaMA4xDDAKBgNVBAMMA2thczBZ\nMBMGByqGSM49AgEGCCqGSM49AwEHA0IABH2VM7Ws9SVr19rywr/o3fewDBj+170/\n6y8zo4leVaJqCl76Nd9QfDNy4KjNCtmmjo6ftTS+iFAhnPCeugAJOWUwCgYIKoZI\nzj0EAwIDSAAwRQIhAIFdrqhwvgL8ctPjUtmULXmg2ii0PFKg/Mox2GiCVXQdAiAW\nUDdeafEoprE+qc4paMmbWoEpRXLlo+3S7rnc5T12Kw==\n-----END CERTIFICATE-----\n"
    client.set_decrypter_public_key(PUB_KEY)
    client.enable_console_logging(LogLevel.Error)
    # client.add_data_attribute(attribute, kas_url=EXTERNAL_KAS_URL)
    logger.info(total_data)
    encrypted_string = client.encrypt_string(json.dumps(total_data))

    s3_client = boto3.client('s3', aws_access_key_id=ACCESS_KEY , aws_secret_access_key=SECRET_ACCESS_KEY)

    s3_client.put_object(Body=encrypted_string, Bucket=BUCKET_NAME, Key=k_id+'.tdf', ContentType='text/html')


    # fileStorageType = TDFStorageType()
    # S3://mybucket/puppy.jpg
    # fileStorageType.set_tdf_storage_s3_type(S3Url=f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{k_id}.tdf",
    # awsAccessKeyID=ACCESS_KEY, awsSecretAccessKey=SECRET_ACCESS_KEY, awsRegionName)

    # return status_ok
    pass

@app.get("/download")
async def download_data(access_token: str):
    logger.info(access_token)
    file_bytes = download_data_actual(access_token)
    return file_bytes