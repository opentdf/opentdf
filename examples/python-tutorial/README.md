# opentdf for python: A Tutorial

This repository provides the sample code used in the Python Quick start tutorial.

## Requirements

* Install the opentdf SDK with `pip install opentdf`.
* Start up a local cluster with `cd ../quickstart && tilt up`.
* To port forward keycloak:
  * `export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=keycloak,app.kubernetes.io/instance=keycloak" -o name)`
  * `kubectl --namespace default port-forward "$POD_NAME" 8080`
* To port forward kas:
  * `kubectl --namespace default port-forward deployment/kas 8000`

Follow the instructions in the `README.md` files in each subdirectory!
