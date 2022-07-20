## Troubleshoot

If you need to restart, delete cluster and try again

```shell
kind delete cluster --name opentdf
kind create cluster --name opentdf
```

---

After `tilt up` and hitting (space), and have trouble opening tilt UI with http://localhost:10350/ in Chrome

- Go to chrome://net-internals/#hsts
- Type `localhost` in Delete domain security policies section and hit DELETE button

---

```text
Error: writing tilt api configs: open /path/to/.tilt-dev/config.lock: file exists
```

```shell
rm -f /path/to/.tilt-dev/config.lock
```

---

A stuck Status of "Runtime Pending" on a postgresql:statefulset.
Trigger a restart manually, once or twice.

---

```text
python3 tests/oidc-auth.py
Unexpected error: <class 'RuntimeError'>
Traceback (most recent call last):
  File "/Users/paul/Projects/opentdf-aux/documentation/quickstart/tests/oidc-auth.py", line 26, in <module>
    client.encrypt_file("sample.txt", "sample.txt.tdf")
RuntimeError: Error code 1.  [oidc_service.cpp:168] Get OIDC token failed status: 404{"error":"Realm does not exist"}
```

Wait. All services aren't up, namely keycloak.

---

Port conflicts
check that ports used in `Tiltfile` are not used on the host

---

attribute-provider: Name or service not known
hard-coded value in keycloak-bootstrap?

---

Database connection issue

```angular2html
pg_isready --dbname=tdf_database --host=opentdf-postgresql --port=5432 --username=postgres
```

---

Husky Issue

```text
sh: husky: command not found

In order to resolve this issue, refer to the following instructions:

1. Temporarily remove the "prepare": "husky install" script from the package.json file.

2. Run npm i (npm install). Dependencies installed successfuly.

3. Add again the "prepare" script that you removed in step 1.

4. Run again npm i to install the husky git hooks, so husky can do its job from now on.
```

---

Craco Issue

```
sh: craco: command not found
```
 craco dependencies should be installed with `npm i`, if that doesn't work here is the other command: -g @craco/craco

---

ABACUS in `Tiltfile`

```
helm_resource(
    "opentdf-abacus",
    "oci://ghcr.io/opentdf/charts/abacus",
    flags=[
        "--version",
        FRONTEND_CHART_TAG,
        "-f",
        "helm/values-abacus.yaml",
        "--set",
        "attributes.serverUrl=%s/api/attributes" % EXTERNAL_URL,
        "--set",
        "entitlements.serverUrl=%s/api/entitlements" % EXTERNAL_URL,
        "--set",
        "image.tag=%s" % FRONTEND_IMAGE_TAG,
        "--set",
        "oidc.serverUrl=%s/auth/" % EXTERNAL_URL,
    ],
    labels="frontend",
    resource_deps=["keycloak-bootstrap"],
)
```
Comment out this helm resource that is found in the `Tiltfile` of Quickstart if you have issues bringing up ABACUS.

---

Running/Downloading Node

Installing node through the web is finicky, and can lead to minor issues within the developemnt environment. Instead, use homebrew to download node, with the following simple command:

```
brew install node
```

If you don't have homebrew installed on your machine, visit the homebrew site [here](https://brew.sh/) and follow the installation directions. You will only need to paste one line of code into the terminal.

---
CORS Error

Error message format:
```
Request header field [headerfeield] is not allowed by Access-Control-Allow-Headers in preflight response.
```
Custom request headers often give you a CORS preflight depending on the headers included in the request. The `Access-Control-Allow-Headers` needs to contain the same values the `Access-Control-Request-Headers` header contained.

```
Tip: If you using Chrome and your not sure what headers are being requested, use the Developer Console, Network select the call being made and you can view what headers are being requested by Access-Control-Request-Headers.
```
Please refer to this [stackoverflow](https://stackoverflow.com/questions/32500073/request-header-field-access-control-allow-headers-is-not-allowed-by-itself-in-pr) or [documentation](https://fetch.spec.whatwg.org/#http-cors-protocol) for reference.

---

Docker Disk Space Error

If you find yourself running out of disk space when trying to build the docker container image, please use the following command to clean up all containers, images, networks, and volumes not used.

```
docker system prune -af
```
---

## Slack Tips/Tricks

Being productive in the workplace is a lot about efficient communication, which is done primarily on Slack here at Virtru. [Here](https://www.atlassian.com/blog/halp/10-slack-tips-and-tricks-for-productivity-in-2020) is an amazing article by Atlassian that dives into some of the niftier tips and tricks that'll help you utilize the most Slack has to offer.

---

## Contacting Support

To submit an issue, start a discussion, or email support@opentdf.io if you are still having issues.
