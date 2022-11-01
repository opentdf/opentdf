#!/bin/bash

set -e

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

cd $SCRIPTPATH
sh setup_venv.sh
cd $SCRIPTPATH/../app
source venv/bin/activate

echo "Running unit tests"
cd tests && pytest
echo "Unit tests passed"

# sleep 30

# cd $SCRIPTPATH/..
# echo "Running integration tests"
# python3 backend_integration_test.py
# echo "Integration tests passed"

deactivate
