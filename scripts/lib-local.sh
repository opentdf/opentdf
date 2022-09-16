#!/usr/bin/env bash
TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE:-$_}")" >/dev/null && pwd)"
export PATH="$TOOLS_DIR:$PATH"

: "${LOCAL_TOOL:="minikube"}"

e() {
  local rval=$?
  if [[ $rval != 0 ]]; then
    monolog ERROR "${@}"
    exit $rval
  fi
}

case ${LOCAL_TOOL} in
  kind)
    # shellcheck disable=SC1091
    . "$TOOLS_DIR/lib-kind.sh"
    ;;
  minikube)
    # shellcheck disable=SC1091
    . "$TOOLS_DIR/lib-minikube.sh"
    ;;
  *)
    monolog ERROR "Unrecognized local tool [${LOCAL_TOOL}]"
    exit 1
    ;;
esac
