#!/usr/bin/env bash

RUN_DIR=$( pwd )

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

while [[ $# -gt 0 ]]; do
    key="$1"
    shift
    case "${key}" in
        -h | --help)
            echo "Usage: get version information for client and server
                -c --chart  path to parent helm chart.yaml for backend services (if used)
                -p --package  path to package.json if using tdf3-js or client-web
                -w --wheel  path to .whl if installing client-python with whl
                -r --requirement  path to requirements.txt if using to install client-python
                -i --include path to 'include' directory if using C++ client
                -l --lib path to 'lib' directory if using C++ client"
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
        -r | --requirement)
            REQUIREMENT=$1
            shift
            ;;
        -i | --include)
            INCLUDE=$1
            shift
            ;;
        -l | --lib)
            LIB=$1
            shift
            ;;
        * ) 
            echo "Unrecognized parameter [${key}]. See --help for usage."
            break ;;
    esac
done

sh $SCRIPT_DIR/system_info.sh

args=("$@")
if [ ! -z ${PACKAGE+x} ]; then
    args+=(--package)
    args+=($PACKAGE)
fi
if [ ! -z ${WHEEL+x} ]; then
    args+=(--wheel)
    args+=($WHEEL)
fi
if [ ! -z ${REQUIREMENT+x} ]; then
    args+=(--requirement)
    args+=($REQUIREMENT)
fi
if [ ! -z ${INCLUDE+x} ]; then
    if [ -z ${LIB+x} ]; then
        echo "Must provide both --lib and --include if using CPP client"
        exit 1
    fi
    args+=(--include)
    args+=($INCLUDE)
    args+=(--lib)
    args+=($LIB)
elif [ ! -z ${LIB+x} ]; then
    echo "Must provide both --lib and --include if using CPP client"
    exit 1
fi
 

sh $SCRIPT_DIR/client_info.sh "${args[@]}"

echo "\n"

if [ -z ${CHART+x} ]; then
    sh $SCRIPT_DIR/server_info.sh
else
    sh $SCRIPT_DIR/server_info.sh $CHART
fi