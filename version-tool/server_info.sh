#!/usr/bin/env bash

echo  "-------------------------------Server Information----------------------------"

echo "-----HELM-----"

if [[ -z "$1" ]]; then
    echo "No chart supplied"
    exit 1
fi

PATH_TO_CHART_DIR="$(dirname "$1")"


helm dependency list $PATH_TO_CHART_DIR

echo "-----DOCKER IMAGES-----"

helm template $PATH_TO_CHART_DIR \
    | perl -ne 'print "$1\n" if /image: (.+)/' \
    | tr -d '"' \
    | sort -u

