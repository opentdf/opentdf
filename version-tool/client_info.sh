#!/usr/bin/env bash

echo  "-------------------------------Client Information----------------------------"

RUN_DIR=$( pwd )

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

while [[ $# -gt 0 ]]; do
    key="$1"
    shift
    case "${key}" in
        -p | --package)
            PATH_TO_PACKAGE=$1
            shift
            ;;
        -w | --wheel)
            PYTHON_WHEEL=$1
            shift
            ;;
        -r | --requirement)
            PYTHON_REQUIREMENT=$1
            shift
            ;;
        -i | --include)
            CPP_INCLUDE=$1
            shift
            ;;
        -l | --lib)
            CPP_LIB=$1
            shift
            ;;
        * ) 
            echo "Unrecognized parameter [${key}]. See --help for usage."
            break ;;
    esac
done

start_venv(){
    pip3 install --upgrade virtualenv > /dev/null
    python3 -m virtualenv venv > /dev/null
    source venv/bin/activate > /dev/null
}

exit_venv(){
    deactivate > /dev/null
    rm -rf venv > /dev/null
    cd $RUN_DIR
}


#get the directory of the package if set
if [[ ! -z ${PATH_TO_PACKAGE+z} ]]; then
    PATH_TO_PACKAGE_DIR="$(dirname "${PATH_TO_PACKAGE}")"
fi

#trying python
if [[ ! -z ${PYTHON_WHEEL+z} ]]; then
    start_venv
    pip3 install $PYTHON_WHEEL > /dev/null
    echo "PYTHON CLIENT:"
    python3 $SCRIPT_DIR/version-files/client-py.py
    exit_venv
elif [[ ! -z ${PYTHON_REQUIREMENT+z} ]]; then
    start_venv
    pip3 install -r $PYTHON_REQUIREMENT > /dev/null
    echo "PYTHON CLIENT:"
    python3 $SCRIPT_DIR/version-files/client-py.py
    exit_venv
else
    #otherwise see if its installed already
    if [[ $(pip3 list | grep -F opentdf) ]]; then
        echo "CLIENT-PYTHON:"
        python3 $SCRIPT_DIR/version-files/client-py.py
    fi
    #else not installed
fi

# #trying tdf3-js, client-web, and cli -- user has to provide path to package.json
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

    cd $RUN_DIR

fi

if [[ ! -z ${CPP_INCLUDE+z} ]]; then
    cp -R $CPP_INCLUDE $SCRIPT_DIR/version-files/cpp-client
    cp -R $CPP_LIB $SCRIPT_DIR/version-files/cpp-client

    cd $SCRIPT_DIR/version-files/cpp-client

    cmake . > /dev/null

    make > /dev/null

    echo "CLIENT-CPP:"
    ./tdf_sample

    rm -rf $SCRIPT_DIR/version-files/cpp-client/include \
    $SCRIPT_DIR/version-files/cpp-client/lib \
    $SCRIPT_DIR/version-files/cpp-client/CMakeFiles > /dev/null

    rm -f $SCRIPT_DIR/version-files/cpp-client/cmake_install.cmake \
    $SCRIPT_DIR/version-files/cpp-client/CMakeCache.txt \
    $SCRIPT_DIR/version-files/cpp-client/Makefile \
    $SCRIPT_DIR/version-files/cpp-client/tdf_sample > /dev/null

    cd $RUN_DIR    
fi


cd $RUN_DIR
