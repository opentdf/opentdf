### To run:

```shell
cd backend_server/src
python3 -m venv ./venv
source ./venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install --requirement ../requirements.txt
python3 -m uvicorn main:app --reload --port 4060
```

#### Swagger UI
http://localhost:4060/docs

#### ReDoc
http://localhost:4030/redoc
