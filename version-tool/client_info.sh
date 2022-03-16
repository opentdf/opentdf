#!/usr/bin/env bash

echo  "-------------------------------Client Information----------------------------"

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo SCRIPT_DIR

RUN_DIR = $(pwd)

#trying python
if [[ -z "${PYTHON_INSTALL}" ]]; then #user can supply path to whl or specific package name if they want
    #install the whl in a venv
    pip3 install --upgrade virtualenv
    python3 -m virtualenv venv
    source venv/bin/activate
    pip3 install ${PYTHON_INSTALL}
    echo "PYTHON CLIENT:"
    python3 SCRIPT_DIR/version-files/client-py.py
    deactivate
    rm -rf venv
else
    #otherwise see if its install already
    if [[ -z "${pip3 list | grep -F package_name}" ]]; then
    echo "PYTHON CLIENT:"
    python3 SCRIPT_DIR/version-files/client-py.py
    fi
    #else not installed
fi

# #trying tdf3-js, client-web, and cli -- user has to provide path to pakage.json directory
if [[ -z "${PATH_TO_PACKAGE}" ]]; then
    cd ${PATH_TO_JS_PACKAGE}
    npm install
    if [[ -z "${npm list | grep tdf3-js}" ]]; then
        echo "TDF3-JS:"
        cp SCRIPT_DIR/version-files/tdf3-js.js .
        node tdf3-js.js
        rm -f tdf3-js.js
    if [[ -z "${npm list | grep opentdf/client}" ]]; then
        echo "CLIENT-WEB:"
        cp SCRIPT_DIR/version-files/client-web.js .
        node client-web.js
        rm -f client-web.js
    fi
    if [[ -z "${npm list | grep opentdf/cli@}" ]]; then
        echo "CLI:"
        npx @opentdf/cli --version
    fi

fi