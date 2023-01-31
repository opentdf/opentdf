#!/usr/bin/env bash
# Non-tilt variant of quickstart. Useful for people who want to run quickstart
# with 'standard' kubectl operator controls.

#Do not allow root user
if [ "$EUID" -eq 0 ]
  then echo "Not allowed to run as root"
  exit 1
fi

WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "${WORK_DIR}/../" >/dev/null && pwd)}"

CERTS_ROOT="${CERTS_ROOT:-$PROJECT_ROOT/certs}"
CHART_ROOT="${CHART_ROOT:-$PROJECT_ROOT/charts}"
DEPLOYMENT_DIR="${DEPLOYMENT_DIR:-$PROJECT_ROOT/quickstart/helm}"
TOOLS_ROOT="${TOOLS_ROOT:-$PROJECT_ROOT/scripts}"
export PATH="$TOOLS_ROOT:$PATH"

e() {
  local rval=$?
  if [[ $rval != 0 ]]; then
    monolog ERROR "${@}"
    exit $rval
  fi
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
services=(abacus attributes entitlement-pdp entitlement-store entitlements entity-resolution kas keycloak keycloak-bootstrap)
chart_tags=(1.2.0 1.2.1{,,,,,,,})

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
      monolog ERROR "Unrecognized option: [$key]"
      exit 1
      ;;
  esac
done

: "${INGRESS_HOSTNAME:=$([[ $REWRITE_HOSTNAME ]] && hostname | tr '[:upper:]' '[:lower:]')}"

wait_for_pod() {
  pod="$1"

  monolog INFO "Waiting until $1 is ready"
  while [ "$(kubectl get pods -l=app.kubernetes.io/name="${pod}" -o jsonpath='{.items[*].status.containerStatuses[0].ready}')" != "true" ]; do
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

load_or_pull() {
  if ! docker image inspect "$1" &>/dev/null; then
    docker pull "$1"
  else
    maybe_load "$1"
  fi
}

if [[ $LOAD_IMAGES ]]; then
  monolog INFO "Caching locally-built development opentdf/backend images in dev cluster"
  # Cache locally-built `latest` images, bypassing registry.
  # If this fails, try running 'docker-compose build' in the repo root
  for s in "${services[@]}"; do
    if [[ "$s" == keycloak && ! $USE_KEYCLOAK ]]; then
      : # Skip loading keycloak in this case
    elif [[ "$s" == entitlement-store ]]; then
      load_or_pull "ghcr.io/opentdf/entitlement_store:${SERVICE_IMAGE_TAG}"
    else
      load_or_pull "ghcr.io/opentdf/$s:${SERVICE_IMAGE_TAG}"
    fi
  done
else
  monolog DEBUG "Skipping loading of locally built service images"
fi

if [[ $LOAD_SECRETS ]]; then
  "$TOOLS_ROOT"/genkeys-if-needed
  e "Unable to generate keys"

  for service in "${services[@]}"; do
    case "$service" in
      attributes)
        monolog TRACE "Creating 'attributes-secrets'..."
        if ! kubectl get secret attributes-secrets; then
          kubectl create secret generic attributes-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword
        fi
        ;;
      entitlement-store)
        monolog TRACE "Creating 'entitlement-store-secrets'..."
        if ! kubectl get secret entitlement-store-secrets; then
          kubectl create secret generic entitlement-store-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword
        fi
        ;;
      entitlement-pdp)
        monolog TRACE "Creating 'entitlement-pdp-secret'..."
        # If CR_PAT is undefined and the entitlement-pdp chart is configured to use the policy bundle baked in at container build time, this isn't used and can be empty
        if ! kubectl get secret entitlement-pdp-secret; then
          kubectl create secret generic entitlement-pdp-secret --from-literal=opaPolicyPullSecret="${CR_PAT}"
        fi
        ;;
      entitlements)
        monolog TRACE "Creating 'entitlements-secrets'..."
        if ! kubectl get secret entitlements-secrets; then
          kubectl create secret generic entitlements-secrets --from-literal=POSTGRES_PASSWORD=myPostgresPassword
        fi
        ;;
      kas)
        monolog TRACE "Creating 'kas-secrets'..."
        if ! kubectl get secret kas-secrets; then
          kubectl create secret generic kas-secrets \
            "--from-file=KAS_EC_SECP256R1_CERTIFICATE=${CERTS_ROOT}/kas-ec-secp256r1-public.pem" \
            "--from-file=KAS_CERTIFICATE=${CERTS_ROOT}/kas-public.pem" \
            "--from-file=KAS_EC_SECP256R1_PRIVATE_KEY=${CERTS_ROOT}/kas-ec-secp256r1-private.pem" \
            "--from-file=KAS_PRIVATE_KEY=${CERTS_ROOT}/kas-private.pem" \
            "--from-file=ca-cert.pem=${CERTS_ROOT}/ca.crt"
        fi
        ;;
      keycloak)
        monolog TRACE "Creating 'keycloak-secrets'..."
        if ! kubectl get secret keycloak-secrets; then
          kubectl create secret generic keycloak-secrets \
            --from-literal=KEYCLOAK_ADMIN=keycloakadmin \
            --from-literal=KEYCLOAK_ADMIN_PASSWORD=mykeycloakpassword \
            --from-literal=KC_DB_USERNAME=postgres \
            --from-literal=KC_DB_PASSWORD=myPostgresPassword \
            --from-literal=KC_DB_URL_HOST=postgresql \
            --from-literal=KC_DB_URL_DATABASE=keycloak_database
        fi
        ;;
      keycloak-bootstrap)
        monolog TRACE "Creating 'keycloak-bootstrap-secret'..."
        if ! kubectl get secret keycloak-bootstrap-secret; then
          kubectl create secret generic keycloak-bootstrap-secret \
            --from-literal=CLIENT_SECRET=123-456 \
            --from-literal=keycloak_admin_username=keycloakadmin \
            --from-literal=keycloak_admin_password=mykeycloakpassword \
            --from-literal=ATTRIBUTES_USERNAME=user1 \
            --from-literal=ATTRIBUTES_PASSWORD=testuser123
        fi
        ;;
      abacus | entity-resolution)
        # Service without its own secrets
        ;;
      *)
        monolog ERROR "Unrecognized option: [$service]"
        exit 1
        ;;
    esac
    e "create secrets failed for ${service}"
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
    if [[ $RUN_OFFLINE ]]; then
      load_or_pull docker.io/bitnami/postgresql:${SERVICE_IMAGE_TAG}
    else
      load_or_pull docker.io/bitnami/postgresql:11
    fi
  fi
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install postgresql "${CHART_ROOT}"/postgresql-12.1.8.tgz -f "${DEPLOYMENT_DIR}/values-postgresql.yaml" --set image.tag=${SERVICE_IMAGE_TAG}
  else
    helm upgrade --install postgresql --repo https://raw.githubusercontent.com/bitnami/charts/archive-full-index/bitnami postgresql -f "${DEPLOYMENT_DIR}/values-postgresql.yaml"
  fi
  e "Unable to helm upgrade postgresql"
  wait_for_pod postgresql
fi

# Only do this if we were told to disable Keycloak
# This should be removed eventually, as Keycloak isn't going away
if [[ $USE_KEYCLOAK ]]; then
  monolog INFO --- "Installing Virtru-ified Keycloak"
  if [[ $RUN_OFFLINE ]]; then
    helm upgrade --install keycloak "${CHART_ROOT}"/keycloakx-1.6.1.tgz -f "${DEPLOYMENT_DIR}/values-keycloak.yaml" --set image.tag=19.0.2
  else
    helm upgrade --install keycloak --repo https://codecentric.github.io/helm-charts keycloakx -f "${DEPLOYMENT_DIR}/values-keycloak.yaml" --set image.tag=19.0.2
  fi
  e "Unable to helm upgrade keycloak"
  wait_for_pod keycloakx
fi

if [[ $INIT_NGINX_CONTROLLER ]]; then
  monolog INFO --- "Installing ingress-nginx"
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching ingress-nginx image"
    # TODO: Figure out how to guess the correct nginx tag
    load_or_pull k8s.gcr.io/ingress-nginx/controller:v1.1.1
  fi
  nginx_params=("--set" "controller.config.large-client-header-buffers=20 32k" "--set" "controller.admissionWebhooks.enabled=false" "--set" "controller.image.tag=v1.1.1")
  if [[ $RUN_OFFLINE ]]; then
    # TODO: Figure out how to set controller.image.tag to the correct value
    monolog TRACE "helm upgrade --install ingress-nginx ${CHART_ROOT}/ingress-nginx-4.0.16.tgz --set controller.image.digest= ${nginx_params[*]}"
    helm upgrade --install ingress-nginx "${CHART_ROOT}"/ingress-nginx-4.0.16.tgz "--set" "controller.image.digest=" "${nginx_params[@]}"
  else
    monolog TRACE "helm upgrade --version v1.1.1 --install ingress-nginx --repo https://kubernetes.github.io/ingress-nginx ${nginx_params[*]}"
    #helm upgrade --install ingress-nginx --repo https://kubernetes.github.io/ingress-nginx "${nginx_params[@]}"
    helm upgrade --install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx --namespace ingress-nginx --create-namespace "${nginx_params[@]}"
  fi
  e "Unable to helm upgrade ingress-nginx"
fi

load-chart() {
  svc="$1"
  repo="$2"
  version="$3"
  val_file="${DEPLOYMENT_DIR}/values-${repo}.yaml"
  if [[ $RUN_OFFLINE ]]; then
    monolog TRACE "helm upgrade --install ${svc} ${CHART_ROOT}/${repo}-*.tgz -f ${val_file} --set image.tag=${SERVICE_IMAGE_TAG}"
    helm upgrade --install "${svc}" "${CHART_ROOT}"/"${repo}"-*.tgz -f "${val_file}" --set image.tag="${SERVICE_IMAGE_TAG}"
  else
    monolog TRACE "helm upgrade --version ${version} --install ${svc} oci://ghcr.io/opentdf/charts/${repo} -f ${val_file}"
    helm upgrade --version "${version}" --install "${svc}" "oci://ghcr.io/opentdf/charts/${repo}" -f "${val_file}"
  fi
  e "Unable to install chart for ${svc}"
}

if [[ $INIT_OPENTDF ]]; then
  monolog INFO --- "OpenTDF charts"
  for index in "${!services[@]}"; do
    if [[ "${services[$index]}" == keycloak ]]; then
      : # Keycloak already loaded above in the use_keycloak block
    else
      load-chart "${services[$index]}" "${services[$index]}" "${chart_tags[$index]}"
    fi
  done
fi

if [[ $INIT_SAMPLE_DATA ]]; then
  if [[ $LOAD_IMAGES ]]; then
    monolog INFO "Caching bootstrap image in cluster"
    load_or_pull ghcr.io/opentdf/keycloak-bootstrap:${SERVICE_IMAGE_TAG}
  fi
  load-chart keycloak-bootstrap keycloak-bootstrap "${BACKEND_CHART_TAG}"
fi
