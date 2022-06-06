#!/usr/bin/env bash
TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE:-$_}")" >/dev/null && pwd)"
export PATH="$TOOLS_DIR:$PATH"

: "${LOCAL_TOOL:="minikube"}"

e() {
  local rval=$?
  monolog ERROR "${@}"
  exit $rval
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
    e "Unrecognized local tool [${LOCAL_TOOL}]"
    ;;
esac
