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
INIT_NGINX_CONTROLLER=1
REWRITE_HOSTNAME=1

# NOTE: 1.1.0 default values. When releasing a new version, move these below to
# the api-version selector and update the default.
services=(abacus attributes entitlement-pdp entitlement_store entitlements entity-resolution kas keycloak keycloak-bootstrap)
chart_tags=(1.1.0{,,,,,,,})

while [[ $# -gt 0 ]]; do
  key="$1"
  shift

  case "$key" in
    --no-host-update)
      monolog TRACE "--no-host-update"
      REWRITE_HOSTNAME=
      ;;
    --no-init-nginx-controller)
      monolog TRACE "--no-nginx-controller"
      INIT_NGINX_CONTROLLER=
      ;;
    --no-init-opentdf)
      monolog TRACE "--no-init-opentdf"
      INIT_OPENTDF=
      ;;
    --no-init-postgres)
      monolog TRACE "--no-init-postgres"
      INIT_POSTGRES=
      ;;
    --no-keycloak)
      monolog TRACE "--no-keycloak"
      USE_KEYCLOAK=
      ;;
    --no-load-images)
      monolog TRACE "--no-load-images"
      LOAD_IMAGES=
      ;;
    --no-sample-data)
      monolog TRACE "$key"
      INIT_SAMPLE_DATA=
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
      e "Unrecognized option: [$key]"
      ;;
  esac
done

: "${INGRESS_HOSTNAME:=$([[ $REWRITE_HOSTNAME ]] && hostname | tr '[:upper:]' '[:lower:]')}"

wait_for_pod() {
  pod="$1"

  monolog INFO "Waiting until $1 is ready"
  while [[ $(kubectl get pods "${pod}" -n default -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do
    echo "waiting for ${pod}..."
    sleep 5
  done
}

if [[ ! $RUN_OFFLINE ]]; then
  INGRESS_HOSTNAME=
fi

# shellcheck source-path=SCRIPTDIR/../scripts
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
  for s in "${services[@]}"; do
    if [[ "$s" == keycloak && ! $USE_KEYCLOAK ]]; then
      : # Skip loading keycloak in this case
    else
      maybe_load "ghcr.io/opentdf/$s:${SERVICE_IMAGE_TAG}"
    fi
  done
else
  monolog DEBUG "Skipping loading of locally built service images"
fi

if [[ $LOAD_SECRETS ]]; then
  "$TOOLS_ROOT"/genkeys-if-needed || e "Unable to generate keys"

  for service in "${services[@]}"; do
    case "$service" in
      attributes)
        monolog TRACE "Creating 'attributes-secrets'..."
        kubectl create secret generic attributes-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create aa secrets failed"
        ;;
      entitlement-store)
        monolog TRACE "Creating 'entitlement-store-secrets'..."
        kubectl create secret generic entitlement-store-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create ent-store secrets failed"
        ;;
      entitlement-pdp)
        monolog TRACE "Creating 'entitlement-pdp-secret'..."
        # If CR_PAT is undefined and the entitlement-pdp chart is configured to use the policy bundle baked in at container build time, this isn't used and can be empty
        kubectl create secret generic entitlement-pdp-secret --from-literal=opaPolicyPullSecret="${CR_PAT}" || e "create ent-pdp secrets failed"
        ;;
      entitlements)
        monolog TRACE "Creating 'entitlements-secrets'..."
        kubectl create secret generic entitlements-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword || e "create ea secrets failed"
        ;;
      kas)
        monolog TRACE "Creating 'kas-secrets'..."
        kubectl create secret generic kas-secrets \
          "--from-file=KAS_EC_SECP256R1_CERTIFICATE=${CERTS_ROOT}/kas-ec-secp256r1-public.pem" \
          "--from-file=KAS_CERTIFICATE=${CERTS_ROOT}/kas-public.pem" \
          "--from-file=KAS_EC_SECP256R1_PRIVATE_KEY=${CERTS_ROOT}/kas-ec-secp256r1-private.pem" \
          "--from-file=KAS_PRIVATE_KEY=${CERTS_ROOT}/kas-private.pem" \
          "--from-file=ca-cert.pem=${CERTS_ROOT}/ca.crt" || e "create kas-secrets failed"
        ;;
      keycloak)
        monolog TRACE "Creating 'keycloak-secrets'..."
        kubectl create secret generic keycloak-secrets \
          --from-literal=DB_USER=postgres \
          --from-literal=DB_PASSWORD=myPostgresPassword \
          --from-literal=KEYCLOAK_USER=keycloakadmin \
          --from-literal=KEYCLOAK_PASSWORD=mykeycloakpassword
        ;;
      abacus | keycloak-bootstrap)
        # Service without its own secrets
        ;;
      *)
        e "Failed due to unknown service [$service]"
        ;;
    esac
  done
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
  wait_for_pod postgresql-postgresql-0
fi

# Only do this if we were told to disable Keycloak
# This should be removed eventually, as Keycloak isn't going away
if [[ $USE_KEYCLOAK ]]; then
  monolog INFO --- "Installing Virtru-ified Keycloak"
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install keycloak "${CHART_ROOT}"/keycloakx-1.4.2.tgz -f "${DEPLOYMENT_DIR}/values-keycloak.yaml" --set image.tag=${SERVICE_IMAGE_TAG} || e "Unable to helm upgrade keycloak"
  else
    helm upgrade --install keycloak --repo https://codecentric.github.io/helm-charts keycloakx -f "${DEPLOYMENT_DIR}/values-keycloak.yaml" --set image.tag=${SERVICE_IMAGE_TAG} || e "Unable to helm upgrade keycloak"
  fi
  wait_for_pod keycloak-0
fi

if [[ $INIT_NGINX_CONTROLLER ]]; then
  monolog INFO --- "Installing ingress-nginx"
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching ingress-nginx image"
    # TODO: Figure out how to guess the correct nginx tag
    maybe_load k8s.gcr.io/ingress-nginx/controller:v1.1.1
  fi
  nginx_params=("--set" "controller.config.large-client-header-buffers=20 32k" "--set" "controller.admissionWebhooks.enabled=false")
  if [[ $RUN_OFFLINE ]]; then
    # TODO: Figure out how to set controller.image.tag to the correct value
    monolog TRACE "helm upgrade --install ingress-nginx ${CHART_ROOT}/ingress-nginx-4.0.16.tgz --set controller.image.digest= ${nginx_params[*]}"
    helm upgrade --install ingress-nginx "${CHART_ROOT}"/ingress-nginx-4.0.16.tgz "--set" "controller.image.digest=" "${nginx_params[@]}" || e "Unable to helm upgrade postgresql"
  else
    monolog TRACE "helm upgrade --version v1.1.1 --install ingress-nginx --repo https://kubernetes.github.io/ingress-nginx ${nginx_params[*]}"
    helm upgrade --version v1.1.1 --install ingress-nginx --repo https://kubernetes.github.io/ingress-nginx "${nginx_params[@]}" || e "Unable to helm upgrade postgresql"
  fi
fi

load-chart() {
  svc="$1"
  repo="$2"
  version="$3"
  val_file="${DEPLOYMENT_DIR}/values-${repo}.yaml"
  if [[ $RUN_OFFLINE ]]; then
    monolog TRACE "helm upgrade --install ${svc} ${CHART_ROOT}/${repo}-*.tgz -f ${val_file} --set image.tag=${SERVICE_IMAGE_TAG}"
    helm upgrade --install "${svc}" "${CHART_ROOT}"/"${repo}"-*.tgz -f "${val_file}" --set image.tag=${SERVICE_IMAGE_TAG} || e "Unable to install chart for ${svc}"
  else
    monolog TRACE "helm upgrade --version ${version} --install ${svc} oci://ghcr.io/opentdf/charts/${repo} -f ${val_file}"
    helm upgrade --version "${version}" --install "${svc}" "oci://ghcr.io/opentdf/charts/${repo}" -f "${val_file}" || e "Unable to install $svc chart"
  fi
}

if [[ $INIT_OPENTDF ]]; then
  monolog INFO --- "OpenTDF charts"
  for index in "${!services[@]}"; do
    if [[ "$s" == keycloak ]]; then
      : # Keycloak already loaded above in the use_keycloak block
    else
      load-chart "${services[$index]}" "${services[$index]}" "${chart_tags[$index]}"
    fi
  done
fi

if [[ $INIT_SAMPLE_DATA ]]; then
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching bootstrap image in cluster"
    maybe_load ghcr.io/opentdf/keycloak-bootstrap:${SERVICE_IMAGE_TAG}
  fi
  load-chart keycloak-bootstrap keycloak-bootstrap "${BACKEND_CHART_TAG}"
fi
