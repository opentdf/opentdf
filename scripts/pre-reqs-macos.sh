#!/usr/bin/env bash

TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
export PATH="$PATH:$TOOLS_DIR"

monolog TRACE "pre-reqs-macos: [$0 $*]"

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
      docker | helm | kind | kuttl | minikube | octant | tilt)
        stuff+=("$item")
        ;;
      *)
        e "Unrecognized options: [$item]"
        ;;
    esac
  done
else
  stuff=(docker helm kuttl minikube)
fi

for i in "${stuff[@]}"; do
  if brew ls --versions "$i" >/dev/null; then
    monolog DEBUG "pre-reqs-macos:${i}: Already installed"
  else
    monolog TRACE "pre-reqs-macos:${i}: Installing..."
    case "$i" in
      kuttl)
        brew tap kudobuilder/tap || e "Failed to tap [${i}]"
        brew install kuttl-cli || e "Failed installing [${i}]"
        ;;
      tilt)
        brew install tilt-dev/tap/tilt
        ;;
      *)
        brew install "${i}" || e "Failed installing [${i}]"
        ;;
    esac
  fi
done
