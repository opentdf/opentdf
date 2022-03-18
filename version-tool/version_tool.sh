#!/usr/bin/env bash

RUN_DIR=$( pwd )

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )


case "$1" in
    -h|--help)
        echo "Usage: get version information for client and server
            -c --chart  path to parent helm chart.yaml for backend services (required)
            -p --package  path to package.json if using tdf3-js or client-web
            -w --wheel  path to .whl if installing client-python with whl"
        exit 1
esac

while [[ $# -gt 0 ]]; do
    key="$1"
    shift
    case "${key}" in
        -h | --help)
            echo "Usage: get version information for client and server
                -c --chart  path to parent helm chart.yaml for backend services (required)
                -p --package  path to package.json if using tdf3-js or client-web
                -w --wheel  path to .whl if installing client-python with whl"
            exit 1
            ;;
        -c | --chart)
            CHART=$1
            shift
            ;;
        -p | --package)
            PACKAGE=$1
            shift
            ;;
        -w | --wheel)
            WHEEL=$1
            shift
            ;;
        * ) 
            echo "Unrecognized parameter. See --help for usage."
            break ;;
    esac
done

if [ -z ${CHART+x} ]; then
    echo "Must provide path to parent helm chart.yaml"
    exit 1
fi

sh $SCRIPT_DIR/system_info.sh

sh $SCRIPT_DIR/client_info.sh --package $PACKAGE --wheel $WHEEL

sh $SCRIPT_DIR/server_info.sh $CHART