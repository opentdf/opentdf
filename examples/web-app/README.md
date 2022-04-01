# OpenTDF Quick Start: Writing a Web App
*Using FastAPI to Access the OpenTDF backend*
> Author: Dave M
> <br>Created: 2021-10-01
> <br>Last Updated: 2021-10-05

Let's make a single-page web app that allows a user to quickly encrypt and decrypt files with OpenTDF!

> Note: This tutorial sequence will be in several parts. First, we will get a local environment up and running with an app that encrypts using its own credentials. Next, we will demonstrate allowing an application to encrypt with the user's credentials. Finally, we discuss how we can extend this to enable client side encryption to allow the server to host only encrypted key and policy information.

## Part 1: Encrypting data with a Web Service

### Setting up a Fast API Application

[FastAPI] is a python framework that provides a framework for developing REST APIs using a modern python style, taking advantage of type annotations to generate an OpenAPI framework atop an ASGI server, [uvicorn]. With decorators that convert standard async python functions into routes that operate as REST endpoints, and support for features like OpenAPI (aka swagger), it allows us to write a modern, performant web app with very little code.
> [FastAPI images] with python slim still measure in the 200+MB range. Perhaps we should be using go or something even simpler?

#### The application

We will use a `requirements.txt` file for collecting our dependencies. In addition to uvicorn and FastAPI, we will also require some libraries to provide templating (`jinja2`), and processing for file uploads (`python-multipart`). Finally, we also need `opentdf` to create and decrypt tdf3 files.

```txt
fastapi
jinja2
opentdf
python-multipart
uvicorn[standard]
```

 


#### Running in the host

> If you don't want to clutter up your local machine, skip ahead to Running in k8s below.

```Python
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.templating import Jinja2Templates
from logging import getLogger
from os import getenv, remove, stat
from tdf3sdk import TDF3Client, OIDCCredentials, LogLevel
from tempfile import NamedTemporaryFile

logger = getLogger(__name__)

KAS_URL = getenv('KAS_URL', "http://opentdf-key-access:8000")
OIDC_ENDPOINT = getenv('OIDC_ENDPOINT', "http://opentdf-keycloak")

app = FastAPI()
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/encrypt/",
    responses = {
        200: {
            "content": {"application/octet-stream": {}}
        }
    },
)
async def create_upload_file(file: bytes = File(...)):
    plaintext = NamedTemporaryFile(delete=False, prefix="plaintext-", suffix=".tmp")
    plaintext_path = plaintext.name
    try:
        plaintext.write(file)
        plaintext.close()
        logger.warning("Wrote file as [%s]", plaintext_path)

        oidc_creds = OIDCCredentials(
            client_id="tdf-client",
            client_secret="123-456",
            organization_name="tdf",
            oidc_endpoint=OIDC_ENDPOINT
        )
        logger.warning("Logging in at [%s] for [%s]", OIDC_ENDPOINT, KAS_URL)
        client = TDF3Client(oidc_credentials=oidc_creds,
                            kas_url=KAS_URL)
        client.enable_console_logging(LogLevel.Trace)
        logger.warning("Starting encrypt; input file size [%s]", len(file))

        ciphertext_path = plaintext_path + ".tdf"
        client.encrypt_file(plaintext_path, ciphertext_path)
        logger.warning("Encrypt completed; file size [%s]", stat(ciphertext_path).st_size)


        return FileResponse(ciphertext_path, filename="sample.tdf")
    finally:
        remove(plaintext_path)

@app.post("/decrypt/",
    responses = {
        200: {
            "content": {"application/octet-stream": {}}
        }
    },
    response_class=FileResponse,
)
async def create_upload_file(file: bytes = File(...)):
    ciphertext = NamedTemporaryFile(delete=False, prefix="ciphertext-", suffix=".tmp")
    ciphertext_path = ciphertext.name
    try:
        ciphertext.write(file)
        ciphertext.close()

        oidc_creds = OIDCCredentials(
            client_id="tdf-client",
            client_secret="123-456",
            organization_name="tdf",
            oidc_endpoint=OIDC_ENDPOINT
        )
        logger.warning("Logging in at [%s] for [%s]", OIDC_ENDPOINT, KAS_URL)
        client = TDF3Client(oidc_credentials=oidc_creds,
                            kas_url=KAS_URL)
        client.enable_console_logging(LogLevel.Trace)
        logger.warning("Starting dencrypt; input file size [%s]", len(file))

        plaintext_path = ciphertext_path + ".untdf"
        client.decrypt_file(ciphertext_path, plaintext_path)
        logger.warning("Decrypt completed; file size [%s]", stat(plaintext_path).st_size)

        return FileResponse(plaintext_path, filename="untdf.bin")
    finally:
        remove(ciphertext_path)
```


#### Running in a local cluster

To work well with a local cluster, we will be leveraging the existing OpenTDF backend quickstart, which builds a working OpenTDF fleet of microservices into a local kubernetes cluster, using [kind] for the cluster management and [tilt] with [docker] for the build mechanism. So we will first build a container for our application.

```Dockerfile
FROM python:3.8-slim

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
# RUN pip install tdf3sdk==1.2.7a1402 --no-cache-dir

ADD . .

ENTRYPOINT ["uvicorn", "main:app", "--reload"]
```

To build, we can use the command `docker build -t web-app:latest .`. However, if we let tilt build it, we can get [live update] functionality, where edits to our source code are reflected in our k8s service in a second or less.

To do this, we can extend the existing quickstart Tiltfile with the following:


```Python
docker_build('opentdf/example-web-app-image', '.',
    live_update=[
        sync('.', '/app'),
        run('cd /app && pip install -r requirements.txt',
            trigger='./requirements.txt'),
])
```

This will sync the file contents on all file changes, and execute `pip install` when the requirements change.

But this doesn't build the service, as Tilt builds a k8s resource graph and there is no correponding kuberenetes deployment. So we must add that with a little k8s yaml:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web-app
          env:
          - name: KAS_URL
            value: "http://localhost:65432/kas"
          - name: OIDC_ENDPOINT
            value: "http://localhost:65432/"
          image: opentdf/example-web-app-image
          ports:
            - containerPort: 8000
```

We can create a local cluster with the command

```sh
ctlptl create cluster kind --name=kind-opentdf --registry=tk-tdf
```

To load and connect to the service, declare it in the Tiltfile

```Python
k8s_yaml("kubernetes.yaml")
k8s_resource(
    "web-app", port_forwards=8000, resource_deps=["opentdf-key-access", "opentdf-keycloak"]
)
```

and load it via

```
tilt up
```

This will initialize all backend services, and start a keycloak with an example configuration via the quickstart `keycloak-bootstrap` job. Depending on your computer configuration and network connectivity, this could take 10 minutes to an hour to complete. Notably, then the `opentdf-key-access`, `opentdf-keycloak-bootstrap`, and `web-app` itself are all green, you should be able to `encrypt` a file. (The upper green chevron in a Tilt resource label indicates a service with a `ready` status.)


[docker]: https://docs.docker.com/get-started/overview/
[FastAPI]: https://fastapi.tiangolo.com/ "FastAPI Documentation Home Page"
[FastAPI images]: https://github.com/tiangolo/uvicorn-gunicorn-fastapi-docker 
[kind]: https://kind.sigs.k8s.io
[live update]: https://docs.tilt.dev/live_update_tutorial.html
[tilt]: http://tilt.dev
[uvicorn]: https://www.uvicorn.org
