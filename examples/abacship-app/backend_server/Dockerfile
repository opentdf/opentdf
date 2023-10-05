# Context: backend_server

ARG PY_VERSION=3.11

# stage - build
FROM python:${PY_VERSION} AS build

WORKDIR /build

COPY requirements.txt requirements.txt
RUN echo $(arch)
RUN pip3 install --no-cache-dir --upgrade pip setuptools
RUN pip3 install --no-cache-dir --requirement requirements.txt
COPY ./app ./app

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
    app.main:app
