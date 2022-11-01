#!/usr/bin/env bash

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
APP="${APP_DIR}/oidc-auth.py"

_wait-for() {
  echo "[INFO] In retry loop for quickstarted opentdf backend..."
  limit=5
  for i in $(seq 1 $limit); do
    echo $(pip show opentdf)
    if python3 "${APP}"; then
      return 0
    fi
    if [[ $i == $limit ]]; then
      break
    fi
    sleep_for=$((10 + i * i * 2))
    echo "[INFO] retrying in ${sleep_for} seconds... ( ${i} / $limit ) ..."
    sleep ${sleep_for}
  done
  echo "[ERROR] Couldn't connect to opentdf backend"
  exit 1
}

_wait-for
