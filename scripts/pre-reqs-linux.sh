#!/usr/bin/env bash

TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
export PATH="$PATH:$TOOLS_DIR"

monolog TRACE "pre-reqs-linux: [$0 $*]"

# some constants
rm -rf build-temp
mkdir -p build-temp/bin
BUILD_DIR="$(cd build-temp >/dev/null && pwd)"
BUILD_BIN="$(cd build-temp/bin >/dev/null && pwd)"
export PATH="$BUILD_BIN:$PATH"

e() {
  local rval=$?
  monolog ERROR "${@}"
  exit $rval
}

stuff=()
if [[ $# -gt 0 ]]; then
  while [[ $# -gt 0 ]]; do
    item="$1"
    shift

    case "$item" in
      curl | docker | helm | kubectl | minikube | tilt | jq)
        stuff+=("$item")
        ;;
      *)
        e "Unrecognized options: [$*]"
        ;;
    esac
  done
else
  stuff=(curl docker helm kubectl kuttl minikube jq)
fi

i_curl() {
  monolog INFO "Installing curl"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  if ! which curl; then

    (apt-get update && apt install -y curl) || e "Unable to install curl"
  fi
  curl --version || e "Bad curl install"
}

i_docker() (
  monolog INFO "Installing Docker"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  if ! which docker; then
    (apt-get update && apt install -y docker.io) || e "Unable to install docker"
  fi
  docker --version || e "Bad docker install"
)

i_helm() (
  monolog INFO "Installing Helm binary version ${HELM_VERSION?helm version required}"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf helm
  mkdir helm || e "Unable to make ${BUILD_DIR}/helm"
  cd helm || e "Failed to create dir"
  HELMVER="helm-v${HELM_VERSION}-linux-amd64.tar.gz"
  curl -LO https://get.helm.sh/"$HELMVER" || e "Unable to curl [${HELMVER}]"
  tar -xf "$HELMVER" || e "Unable to untar helm blob"
  cp linux-amd64/helm "${BUILD_BIN}/" || e "Unable to install [${HELMVER}] binary"
)

i_kind() (
  monolog INFO "Installing kind ${KIND_VERSION?kind version required}"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf kind
  mkdir kind || e "Unable to make ${BUILD_DIR}/kind"
  cd kind || e "Failed to create dir"
  curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v${KIND_VERSION}/kind-linux-amd64" || e "Unable to download kind"
  chmod +x kind || e "kind is not executableable"
  mv kind "$BUILD_BIN/" || e "kind is not mvable"
)

i_kubectl() {
  monolog INFO "Installing kubectl"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  if ! which kubectl; then
    if which snap; then
      snap install kubectl --classic || e "Unable to install kubectl"
    else
      (apt-get update && apt install -y kubectl) || e "Unable to install kubectl"
    fi
  fi
  kubectl version --client || e "Bad kubectl install"
}

i_kuttl() (
  monolog INFO "Installing KUTTL binary version ${KUTTL_VERSION?kuttl version required}"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf kuttl
  mkdir kuttl || e "Unable to make ${BUILD_DIR}/kuttl"
  cd kuttl || e "Failed to create dir"
  curl -LO https://github.com/kudobuilder/kuttl/releases/download/v"${KUTTL_VERSION}"/kubectl-kuttl_"${KUTTL_VERSION}"_linux_x86_64 || e "Unable to download kuttl"
  chmod +x kubectl-kuttl_"${KUTTL_VERSION}"_linux_x86_64 || e "kuttl is not executableable"
  mv kubectl-kuttl_"${KUTTL_VERSION}"_linux_x86_64 "$BUILD_BIN/kubectl-kuttl" || e "kuttl is not mvable"
)

i_minikube() (
  monolog INFO "Installing Minikube binary"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf minikube
  mkdir minikube || e "mkdir minikube fail"
  cd minikube || e "no minikube build folder"
  curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 || e "minikube download fail"
  chmod +x minikube-linux-amd64 || e "minikube is not executableable"
  mv minikube-linux-amd64 "${BUILD_BIN}/minikube" || e "minikube mv fail"

  monolog INFO "Cleaning up any previous minikube cluster"
  minikube delete || e "Unable to minikube delete"

  docker network prune -f
  docker system prune --volumes -af
)

i_opa() (
  monolog INFO "Installing opa binary ${OPA_VERSION?tilt version required}"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf opa
  mkdir opa || e "mkdir opa fail"
  cd opa || e "no opa build folder"
  curl -fsSL -o opa "https://openpolicyagent.org/downloads/v${OPA_VERSION}/opa_linux_amd64_static" || e "opa download failure"
  chmod +x opa || e "opa is not executableable"
  mv opa "$BUILD_BIN/" || e "opa is not mvable"
)

i_policy() (
  monolog INFO "Installing policy binary ${POLICY_VERSION?policy version required}"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf policy
  mkdir policy || e "mkdir policy fail"
  cd policy || e "no policy build folder"
  curl -fsSL "https://github.com/opcr-io/policy/releases/download/v${POLICY_VERSION}/policy${POLICY_VERSION}_linux_x86_64.zip" -o policy.zip || e "policy download failure"
  unzip policy.zip || e "policy.zip unzip failure"
  chmod +x policy || e "policy binary is not executableable"
  mv policy "$BUILD_BIN/" || e "policy is not mvable"
)

i_tilt() (
  monolog INFO "Installing Tilt binary ${TILT_VERSION?tilt version required}"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  rm -rf tilt
  mkdir tilt || e "mkdir tilt fail"
  cd tilt || e "no tilt build folder"
  curl -fsSL "https://github.com/tilt-dev/tilt/releases/download/v$TILT_VERSION/tilt.$TILT_VERSION.linux.x86_64.tar.gz" | tar -xzv tilt || e "tilt download and untar failure"
  chmod +x tilt || e "tilt is not executableable"
  mv tilt "$BUILD_BIN/" || e "tilt is not mvable"
)

i_jq() (
  monolog INFO "Installing jq binary"
  cd "${BUILD_DIR}" || e "no ${BUILD_DIR}"
  if ! which jq; then
    (apt-get update && apt install -y jq) || e "Unable to install jq"
  fi
  jq --version || e "Bad jq install"
)

for item in "${stuff[@]}"; do
  case "$item" in
    curl)
      i_curl
      ;;
    docker)
      i_docker
      ;;
    helm)
      i_helm
      ;;
    kubectl)
      i_kubectl
      ;;
    kuttl)
      i_kuttl
      ;;
    minikube)
      i_minikube
      ;;
    opa)
      i_opa
      ;;
    policy)
      i_policy
      ;;
    tilt)
      i_tilt
      ;;
    jq)
      i_jq
      ;;
    *)
      e "Unrecognized options: [$*]"
      ;;
  esac
done

if [ -n "$(ls -A "${BUILD_BIN}" 2>/dev/null)" ]; then
   cp "${BUILD_BIN}"/* /bin || e "Unable to install binaries"
fi

monolog INFO "Finished installing linux pre-reqs"