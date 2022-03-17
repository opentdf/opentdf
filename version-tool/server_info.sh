#!/usr/bin/env bash

echo  "-------------------------------Server Information----------------------------"

echo "-----HELM-----"

helm dependency list $PATH_TO_CHART

echo "-----DOCKER IMAGES-----"

helm template $PATH_TO_CHART \
    | perl -ne 'print "$1\n" if /image: (.+)/' \
    | tr -d '"' \
    | sort -u

