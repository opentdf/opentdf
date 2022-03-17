#!/usr/bin/env bash

#pip3 install /Users/ehealy/Desktop/repos/virtru/tdf3-cpp/src/python-bindings/pips/dist/opentdf-0.6.0-cp38-cp38-macosx_12_0_arm64.whl

echo  "-------------------------------Client Information----------------------------"

RUN_DIR=$( pwd )

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# echo $SCRIPT_DIR
# echo $PATH_TO_PACKAGE_DIR

cd $RUN_DIR



#trying python
if [[ ! -z ${PYTHON_INSTALL+z} ]]; then #user can supply path to whl or specific package name if they want
    #install the whl in a venv
    pip3 install --upgrade virtualenv > /dev/null
    python3 -m virtualenv venv > /dev/null
    source venv/bin/activate > /dev/null
    pip3 install $PYTHON_INSTALL > /dev/null
    echo "PYTHON CLIENT:"
    python3 $SCRIPT_DIR/version-files/client-py.py
    deactivate > /dev/null
    rm -rf venv > /dev/null
else
    #otherwise see if its installed already
    if [[ $(pip3 list | grep -F opentdf) ]]; then
    echo "PYTHON CLIENT:"
    python3 $SCRIPT_DIR/version-files/client-py.py
    fi
    #else not installed
fi

# #trying tdf3-js, client-web, and cli -- user has to provide path to pakage.json directory
if [[ ! -z ${PATH_TO_PACKAGE_DIR+z} ]]; then
    cd $PATH_TO_PACKAGE_DIR > /dev/null
    npm install > /dev/null
    if [[ $(npm list | grep tdf3-js) ]]; then
        echo "TDF3-JS:"
        cp $SCRIPT_DIR/version-files/tdf3-js.js . > /dev/null
        node tdf3-js.js
        rm -f tdf3-js.js > /dev/null
    fi
    if [[ $(npm list | grep opentdf/client) ]]; then
        echo "CLIENT-WEB:"
        cp $SCRIPT_DIR/version-files/client-web.js . > /dev/null
        node client-web.js
        rm -f client-web.js > /dev/null
    fi
    if [[ $(npm list | grep opentdf/cli@) ]]; then
        echo "CLI:"
        npx @opentdf/cli --version
    fi

fi
