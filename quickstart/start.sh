#!/usr/bin/env bash
# Non-tilt variant of quickstart. Useful for people who want to run quickstart
# with 'standard' kubectl operator controls.

WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "${WORK_DIR}/../" >/dev/null && pwd)}"

CERTS_ROOT="${CERTS_ROOT:-$PROJECT_ROOT/certs}"
CHART_ROOT="${CHART_ROOT:-$PROJECT_ROOT/charts}"
DEPLOYMENT_DIR="${DEPLOYMENT_DIR:-$PROJECT_ROOT/quickstart/helm}"
TOOLS_ROOT="${TOOLS_ROOT:-$PROJECT_ROOT/scripts}"
export PATH="$TOOLS_ROOT:$PATH"

e() {
  local rval=$?
  monolog ERROR "${@}"
  exit $rval
}

: "${SERVICE_IMAGE_TAG:="offline"}"
LOAD_IMAGES=1
LOAD_SECRETS=1
START_CLUSTER=1
export RUN_OFFLINE=
USE_KEYCLOAK=1
INIT_POSTGRES=1
INIT_OPENTDF=1
INIT_SAMPLE_DATA=1
REWRITE_HOSTNAME=1

while [[ $# -gt 0 ]]; do
  key="$1"
  shift

  case "$key" in
    --no-bootstrap)
      monolog TRACE "$key"
      INIT_SAMPLE_DATA=
      ;;
    --no-sample-data)
      monolog TRACE "$key"
      INIT_SAMPLE_DATA=
      ;;
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
    --no-host-update)
      monolog TRACE "--no-host-update"
      REWRITE_HOSTNAME=
      ;;
    --no-init-opentdf)
      monolog TRACE "--no-init-opentdf"
      INIT_OPENTDF=
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

: "${INGRESS_HOSTNAME:=$([[ $REWRITE_HOSTNAME ]] && hostname | tr '[:upper:]' '[:lower:]')}"

if [[ ! $RUN_OFFLINE ]]; then
  INGRESS_HOSTNAME=
fi

. "${TOOLS_ROOT}/lib-local.sh"

# Make sure required utilities are installed.
local_info || e "Local cluster manager [${LOCAL_TOOL}] is not available"
kubectl version --client | monolog DEBUG || e "kubectl is not available"
helm version | monolog DEBUG || e "helm is not available"

if [[ $LOAD_IMAGES && $RUN_OFFLINE ]]; then
  # Copy images from local tar files into local docker registry
  docker-load-and-tag-exports || e "Unable to load images"
fi

if [[ $START_CLUSTER ]]; then
  local_start || e "Failed to start local k8s tool [${LOCAL_TOOL}]"
fi

# Copy images from local registry into k8s registry
maybe_load() {
  if [[ $LOAD_IMAGES ]]; then
    local_load "$1" || e "Unable to load service image [${1}]"
  fi
}

if [[ $LOAD_IMAGES ]]; then
  monolog INFO "Caching locally-built development opentdf/backend images in dev cluster"
  # Cache locally-built `latest` images, bypassing registry.
  # If this fails, try running 'docker-compose build' in the repo root
  for s in abacus attributes claims entitlements kas; do
    maybe_load ghcr.io/opentdf/$s:${SERVICE_IMAGE_TAG}
  done
else
  monolog DEBUG "Skipping loading of locally built service images"
fi

if [[ $LOAD_SECRETS ]]; then
  "$TOOLS_ROOT"/genkeys-if-needed || e "Unable to generate keys"

  monolog TRACE "Creating 'kas-secrets'..."
  kubectl create secret generic kas-secrets \
    "--from-file=KAS_EC_SECP256R1_CERTIFICATE=${CERTS_ROOT}/kas-ec-secp256r1-public.pem" \
    "--from-file=KAS_CERTIFICATE=${CERTS_ROOT}/kas-public.pem" \
    "--from-file=KAS_EC_SECP256R1_PRIVATE_KEY=${CERTS_ROOT}/kas-ec-secp256r1-private.pem" \
    "--from-file=KAS_PRIVATE_KEY=${CERTS_ROOT}/kas-private.pem" \
    "--from-file=ca-cert.pem=${CERTS_ROOT}/ca.crt" || e "create kas-secrets failed"

  monolog TRACE "Creating 'attributes-secrets'..."
  kubectl create secret generic attributes-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create aa secrets failed"
  monolog TRACE "Creating 'claims-secrets'..."
  kubectl create secret generic claims-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create claims secrets failed"
  monolog TRACE "Creating 'entitlements-secrets'..."
  kubectl create secret generic entitlements-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create ea secrets failed"
  monolog TRACE "Creating 'keycloak-secrets'..."
  kubectl create secret generic keycloak-secrets \
    --from-literal=DB_USER=postgres \
    --from-literal=DB_PASSWORD=myPostgresPassword \
    --from-literal=KEYCLOAK_USER=keycloakadmin \
    --from-literal=KEYCLOAK_PASSWORD=mykeycloakpassword
fi

if [[ $INGRESS_HOSTNAME ]]; then
  for x in "${DEPLOYMENT_DIR}"/values-*.yaml; do
    if sed --help 2>&1 | grep in-place; then
      sed --in-place -e s/offline.demo.internal/"${INGRESS_HOSTNAME}"/g "$x"
    else
      sed -i'' s/offline.demo.internal/"${INGRESS_HOSTNAME}"/g "$x"
    fi
  done
fi

# Only do this if we were told to disable Keycloak
# This should be removed eventually, as Keycloak isn't going away
if [[ $USE_KEYCLOAK ]]; then
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching locally-built development opentdf Keycloak in dev cluster"
    for s in claims keycloak keycloak-bootstrap; do
      maybe_load ghcr.io/opentdf/$s:${SERVICE_IMAGE_TAG}
    done
  fi

  monolog INFO --- "Installing Virtru-ified Keycloak"
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install keycloak "${CHART_ROOT}"/keycloak-17.0.1.tgz -f "${DEPLOYMENT_DIR}/values-keycloak.yaml" --set image.tag=${SERVICE_IMAGE_TAG} || e "Unable to helm upgrade keycloak"
  else
    helm upgrade --install keycloak --repo https://codecentric.github.io/helm-charts keycloak -f "${DEPLOYMENT_DIR}/values-keycloak.yaml" --set image.tag=${SERVICE_IMAGE_TAG} || e "Unable to helm upgrade keycloak"
  fi
  monolog INFO "Waiting until Keycloak server is ready"

  while [[ $(kubectl get pods keycloak-0 -n default -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do
    echo "waiting for keycloak..."
    sleep 5
  done
fi

if [[ $INIT_POSTGRES ]]; then
  monolog INFO --- "Installing Postgresql for opentdf backend"
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching postgresql image"
    maybe_load bitnami/postgresql:${SERVICE_IMAGE_TAG}
  fi
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install postgresql "${CHART_ROOT}"/postgresql-10.16.2.tgz -f "${DEPLOYMENT_DIR}/values-postgresql.yaml" --set image.tag=${SERVICE_IMAGE_TAG} || e "Unable to helm upgrade postgresql"
  else
    helm upgrade --install postgresql --repo https://charts.bitnami.com/bitnami postgresql -f "${DEPLOYMENT_DIR}/values-postgresql.yaml" || e "Unable to helm upgrade postgresql"
  fi
  monolog INFO "Waiting until postgresql is ready"

  while [[ $(kubectl get pods postgresql-postgresql-0 -n default -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do
    echo "waiting for postgres..."
    sleep 5
  done
fi

if [[ $INIT_OPENTDF ]]; then
  monolog INFO --- "OpenTDF charts"
  for s in attributes claims entitlements kas; do
    val_file="${DEPLOYMENT_DIR}/values-${s}.yaml"
    if [[ $RUN_OFFLINE ]]; then
      helm upgrade --install ${s} "${CHART_ROOT}"/${s}-*.tgz -f "${val_file}" --set image.tag="${SERVICE_IMAGE_TAG}" || e "Unable to install chart for ${s}"
    else
      helm upgrade --version "0.0.0-sha-0b804dd" --install ${s} "oci://ghcr.io/opentdf/charts/${s}" -f "${val_file}" || e "Unable to install $s chart"
    fi
  done
  for s in abacus; do
    val_file="${DEPLOYMENT_DIR}/values-${s}.yaml"
    if [[ $RUN_OFFLINE ]]; then
      helm upgrade --install ${s} "${CHART_ROOT}"/${s}-*.tgz -f "${val_file}" --set image.tag="${SERVICE_IMAGE_TAG}" || e "Unable to install chart for ${s}"
    else
      helm upgrade --version "0.0.0-sha-fe676f4" --install ${s} "oci://ghcr.io/opentdf/charts/${s}" -f "${val_file}" || e "Unable to install $s chart"
    fi
  done
fi

if [[ $INIT_SAMPLE_DATA ]]; then
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching bootstrap image in cluster"
    maybe_load ghcr.io/opentdf/keycloak-bootstrap:${SERVICE_IMAGE_TAG}
  fi
  helm upgrade --install keycloak-bootstrap "${CHART_ROOT}"/keycloak-bootstrap-*.tgz -f "${DEPLOYMENT_DIR}/values-bootstrap.yaml" --set image.tag="${SERVICE_IMAGE_TAG}" || e "Unable to start bootstrap job"
fi
