#!/bin/bash

cd backend_server/src

if [ ! -d "./venv" ] 
then
    python3 -m venv ./venv
fi

source ./venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install --requirement ../requirements.txt
deactivate
