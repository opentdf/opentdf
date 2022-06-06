# Context: backend_server

ARG PY_VERSION=3.10
ARG ALPINE_VERSION=3.15

# stage - build
# FROM python:${PY_VERSION}-alpine${ALPINE_VERSION} AS build
FROM python:${PY_VERSION} as build

WORKDIR /build

COPY requirements.txt requirements.txt
COPY ./src .
RUN echo $(arch)
RUN pip3 install --no-cache-dir --upgrade pip setuptools
RUN pip3 install --no-cache-dir --requirement requirements.txt

# Server
ENV SERVER_ROOT_PATH "/"
ENV SERVER_PORT "4060"
ENV SERVER_PUBLIC_NAME ""
ENV SERVER_LOG_LEVEL "DEBUG"

#Endpoints
ENV ENTITLEMENTS_URL "http://entitlements:4030"
ENV ATTRIBUTES_URL "http://attributes:4020" 
ENV OIDC_ENDPOINT "http://keycloak-http"
ENV KAS_URL "http://kas:8000"
ENV KEYCLOAK_URL "http://keycloak-http/auth/"
ENV EXTERNAL_KAS_URL "http://localhost:65432/api/kas"


ENTRYPOINT python3 -m uvicorn \
    --host 0.0.0.0 \
    --port ${SERVER_PORT} \
    --root-path ${SERVER_ROOT_PATH} \
    --no-use-colors \
    --no-server-header \
    main:app
