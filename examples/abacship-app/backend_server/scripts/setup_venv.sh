#!/bin/bash

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

cd $SCRIPTPATH/../app

if [ ! -d "./venv" ] 
then
    python3 -m venv ./venv
fi

source ./venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install --requirement ../requirements.txt
