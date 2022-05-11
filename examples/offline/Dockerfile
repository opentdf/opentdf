# syntax=docker/dockerfile:1.4
# Dockerfile for offline demos. To build this, run `build-offline-bundle --clean --all`.
#
# This will give you 
# To run it, run 
#    docker run -v /var/run/docker.sock:/var/run/docker.sock \
#        opentdf/offline-bundle:$(<build/export/bundle/BUNDLE_TAG)
# 
# More details:
# https://devopscube.com/run-docker-in-docker/#method-1-docker-in-docker-using-var-run-docker-sock
FROM ubuntu:22.04

COPY charts ./charts
COPY containers ./containers
COPY lib ./lib
COPY quickstart ./quickstart
COPY scripts ./scripts
COPY BUNDLE_TAG ./

RUN scripts/pre-reqs

CMD [ "quickstart/start.sh" ]
