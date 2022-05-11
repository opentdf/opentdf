#!/usr/bin/env bash
# Bash functions for kind

minikube_start() {
  # See https://github.com/kubernetes/minikube/issues/7332
  # Docker driver is always preferred, and the only/best option on build agents
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    docker version | monolog DEBUG || e "docker is not available"
    minikube start --driver=docker || e "Failed to start minikube in docker mode"
  else
    minikube start --vm=true --driver=hyperkit --disk-size 30g --memory 6000 || e "Failed to start minikube in hyperkit mode"
  fi
}

local_load() {
  minikube image load "${@}"
}

local_info() {
  minikube version | monolog DEBUG
}

local_start() {
  minikube status
  minikube_status_rval=$?
  case $minikube_status_rval in
    7)
      monolog TRACE "minikube stopped; starting"
      minikube_start
      minikube status
      ;;
    85)
      monolog TRACE "minikube destroyed; starting"
      minikube_start
      minikube status
      ;;
    0)
      monolog DEBUG "minikube running already"
      ;;
    *)
      monolog ERROR "minikube status in transition: [$minikube_status_rval]"
      exit $minikube_status_rval
      ;;
  esac

  minikube addons enable ingress || e "Failed addons enable ingress"
}

local_clean() {
  minikube delete
}
