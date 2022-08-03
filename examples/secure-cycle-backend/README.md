# Secure Cycle Backend

### To start all services and app backend
Create cluster and tilt up
```shell
kind create cluster --name opentdf
tilt up
```

### To run this service locally
```shell
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_USER="secure_cycle_manager"
export POSTGRES_PASSWORD="myPostgresPassword"
export POSTGRES_DATABASE="tdf_database"
export POSTGRES_SCHEMA="secure_cycle"
export OIDC_REALM="tdf"
export OIDC_CLIENT_ID="dcr-test"
export OIDC_CLIENT_SECRET="123-456"
export OIDC_AUTHORIZATION_URL="http://localhost:65432/auth/realms/tdf/protocol/openid-connect/auth"
export OIDC_SERVER_URL="http://localhost:65432/auth/"
export OIDC_TOKEN_URL="http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token"
export OIDC_CONFIGURATION_URL="http://localhost:65432/auth/realms/tdf/.well-known/openid-configuration"
export OIDC_SCOPES="email"
export SERVER_PUBLIC_NAME="Secure Cycle Backend"
```
```shell
cd secure-cycle-backend
python3 -m venv ./venv
source ./venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install --requirement requirements.txt
python3 -m uvicorn main:app --reload --port 4060
```

#### Swagger UI
http://localhost:4060/docs

#### ReDoc
http://localhost:4030/redoc