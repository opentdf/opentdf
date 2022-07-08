### To run:

```shell
cd backend_server/app
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

### Run Tests
For unit tests:
```shell
cd backend_server/app/tests && pytest
```
For integration tests:

Start the services
```shell
# in abacship-app/
tilt up
```
Wait for all the serviecs to spin up, then
```shell
cd backend_server
python3 backend_integration_test.py
```