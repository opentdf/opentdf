# syntax=docker/dockerfile:1.4
# Dockerfile for offline demos. To build this, run `build-offline-bundle --clean --all`
FROM ubuntu:22.04

COPY charts ./charts
COPY containers ./containers
COPY lib ./lib
COPY quickstart ./quickstart
COPY scripts ./scripts
COPY BUNDLE_TAG ./

RUN scripts/pre-reqs

