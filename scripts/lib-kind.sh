#!/usr/bin/env bash
# Bash functions for kind

local_load() {
  monolog TRACE "local_load: kind load docker-image [$*]"
  kind load docker-image "${@}"
}

local_info() {
  monolog TRACE "local_info: kind version"
  kind version
}

local_start() {
  if [[ $RUN_OFFLINE ]]; then
    monolog TRACE "local_start: kind create cluster --image kindest/node:offline"
    kind create cluster --image kindest/node:offline
  else
    monolog TRACE "local_start: kind create cluster"
    kind create cluster
  fi
}

local_clean() {
  monolog TRACE "local_clean: kind delete cluster"
  kind delete cluster
}
