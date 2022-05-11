#!/usr/bin/env bash
# Non-tilt variant of quickstart. Useful for people who want to run quickstart
# with 'standard' kubectl operator controls.

WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "${WORK_DIR}/../../" >/dev/null && pwd)}"

CERTS_ROOT="${CERTS_ROOT:-$PROJECT_ROOT/containers/python_base/certs}"
CHART_ROOT="${CHART_ROOT:-$PROJECT_ROOT/charts}"
DEPLOYMENT_DIR="${DEPLOYMENT_DIR:-$PROJECT_ROOT/deployments/local}"
EXPORT_ROOT="${EXPORT_ROOT:-$PROJECT_ROOT/build/export}"
TOOLS_ROOT="${TOOLS_ROOT:-$PROJECT_ROOT/containers/python_base/scripts}"
export PATH="$TOOLS_ROOT:$PATH"

e() {
  local rval=$?
  monolog ERROR "${@}"
  exit $rval
}

: "${SERVICE_IMAGE_TAG:="head"}"
LOAD_IMAGES=1
LOAD_SECRETS=1
START_CLUSTER=1
export RUN_OFFLINE=
USE_KEYCLOAK=1
INIT_POSTGRES=1

while [[ $# -gt 0 ]]; do
  key="$1"
  shift

  case "$key" in
    --no-keycloak)
      monolog TRACE "--no-keycloak"
      USE_KEYCLOAK=
      ;;
    --no-init-postgres)
      monolog TRACE "--no-init-postgres"
      INIT_POSTGRES=
      ;;
    --no-load-images)
      monolog TRACE "--no-load-images"
      LOAD_IMAGES=
      ;;
    --no-secrets)
      monolog TRACE "--no-secrets"
      LOAD_SECRETS=
      ;;
    --no-start)
      monolog TRACE "--no-start"
      START_CLUSTER=
      ;;
    --offline)
      monolog TRACE "--offline"
      RUN_OFFLINE=1
      ;;
    *)
      e "Unrecognized options: $*"
      ;;
  esac
done

. "${TOOLS_ROOT}/lib-local.sh"

# Make sure required utilities are installed.
local_info || e "Local cluster manager [${LOCAL_TOOL}] is not available"
kubectl version --client | monolog DEBUG || e "kubectl is not available"
helm version | monolog DEBUG || e "helm is not available"

if [[ $START_CLUSTER ]]; then
  local_start || e "Failed to start local k8s tool [${LOCAL_TOOL}]"
fi

maybe_load() {
  if [[ $LOAD_IMAGES ]]; then
    local_load $1 || e "Unable to load service image [${1}]"
  fi
}

if [[ $LOAD_IMAGES ]]; then
  monolog INFO "Caching locally-built development opentdf/backend images in dev cluster"
  # Cache locally-built `latest` images, bypassing registry.
  # If this fails, try running 'docker-compose build' in the repo root
  for s in entity-attribute-service kas entitlements storage-service attributes-service; do
    maybe_load opentdf/$s:${SERVICE_IMAGE_TAG}
  done
else
  monolog DEBUG "Skipping loading of locally built service images"
fi

if [[ $LOAD_SECRETS ]]; then
  $TOOLS_ROOT/genkeys-if-needed || e "Unable to generate keys"

  printf "\nCreating 'kas-secrets'..."
  kubectl create secret generic kas-secrets \
    "--from-file=EAS_PRIVATE_KEY=${CERTS_ROOT}/eas-private.pem" \
    "--from-file=EAS_CERTIFICATE=${CERTS_ROOT}/eas-public.pem" \
    "--from-file=KAS_EC_SECP256R1_CERTIFICATE=${CERTS_ROOT}/kas-ec-secp256r1-public.pem" \
    "--from-file=KAS_CERTIFICATE=${CERTS_ROOT}/kas-public.pem" \
    "--from-file=KAS_EC_SECP256R1_PRIVATE_KEY=${CERTS_ROOT}/kas-ec-secp256r1-private.pem" \
    "--from-file=KAS_PRIVATE_KEY=${CERTS_ROOT}/kas-private.pem" \
    "--from-file=ca-cert.pem=${CERTS_ROOT}/ca.crt" || e "create kas-secrets failed"

  kubectl create secret generic attributes-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create aa secrets failed"
  kubectl create secret generic entitlements-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create ea secrets failed"
  kubectl create secret generic tdf-storage-secrets \
    --from-literal=AWS_ACCESS_KEY_ID=myAccessKeyId \
    --from-literal=AWS_SECRET_ACCESS_KEY=mySecretAccessKey || e "create tdf-storage-secrets failed"
fi

# Only do this if we were told to disable Keycloak
# This should be removed eventually, as Keycloak isn't going away
if [[ $USE_KEYCLOAK ]]; then
  monolog INFO "Caching locally-built development opentdf Keycloak in dev cluster"
  for s in claim-test-webservice keycloak keycloak-bootstrap; do
    maybe_load opentdf/$s:${SERVICE_IMAGE_TAG}
  done

  monolog INFO --- "Installing Virtru-ified Keycloak"
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install keycloak "${CHART_ROOT}"/keycloak-15.0.1.tgz -f "${DEPLOYMENT_DIR}/values-virtru-keycloak.yaml" --set image.tag=${SERVICE_IMAGE_TAG:-head} || e "Unable to helm upgrade keycloak"
  else
    helm upgrade --install keycloak --repo https://codecentric.github.io/helm-charts keycloak -f "${DEPLOYMENT_DIR}/values-virtru-keycloak.yaml" --set image.tag=${SERVICE_IMAGE_TAG:-head} || e "Unable to helm upgrade keycloak"
  fi
  monolog INFO "Waiting until Keycloak server is ready"

  while [[ $(kubectl get pods keycloak-0 -n default -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do
    sleep 5
  done
fi

if [[ $INIT_POSTGRES ]]; then
  monolog INFO --- "Installing Postgresql for opentdf backend"
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install postgresql "${CHART_ROOT}"/postgresql-10.12.2.tgz -f "${DEPLOYMENT_DIR}/values-postgresql-tdf.yaml" --set image.tag=${SERVICE_IMAGE_TAG:-offline} || e "Unable to helm upgrade postgresql"
  else
    helm upgrade --install postgresql --repo https://charts.bitnami.com/bitnami postgresql -f "${DEPLOYMENT_DIR}/values-postgresql-tdf.yaml" || e "Unable to helm upgrade postgresql"
  fi
  monolog INFO "Waiting until postgresql is ready"

  while [[ $(kubectl get pods postgresql-postgresql-0 -n default -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do
    sleep 5
  done
fi

monolog INFO --- "Umbrella chart"
val_file="${DEPLOYMENT_DIR}/values-all-in-one.yaml"
if [[ $RUN_OFFLINE ]]; then
  helm upgrade --install etheria "${CHART_ROOT}"/etheria -f "${val_file}" || e "Unable to install composite chart"
else
  helm repo add virtru https://charts.production.virtru.com || true #Might fail if you've already done this, and that's OK
  helm dependency update "$CHART_ROOT/etheria" || e "Unable to update composite chart"
  helm upgrade --install etheria "$CHART_ROOT/etheria" -f "${val_file}" || e "Unable to install composite chart"
fi
