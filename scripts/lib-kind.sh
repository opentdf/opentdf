#!/usr/bin/env bash
# Bash functions for kind

local_load() {
  kind load docker-image "${@}"
}

local_info() {
  kind version
}

local_start() {
  if [[ $RUN_OFFLINE ]]; then
    kind create cluster --image kindest/node:offline
  else
    kind create cluster
  fi
}

local_clean() {
  kind delete cluster
}
