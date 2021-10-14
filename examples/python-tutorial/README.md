# tdf3-python-tutorial

This repository provides the sample code used in the Python Quick start tutorial.

## Requirements

* install `pip install tdf3sdk==1.2.6a1390`
* You should be able to clone [Etheria](https://github.com/virtru-corp/etheria)
* After minikube is done you should forward ports like this:
* In etheria run `sh ./quickstart-minikube.sh` (Will take 20-60 minutes)
* To port forward keycloak:
  * `export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=keycloak,app.kubernetes.io/instance=keycloak" -o name)`
  * `kubectl --namespace default port-forward "$POD_NAME" 8080`
* To port forward kas:
  * `kubectl --namespace default port-forward deployment/kas 8000`

Follow the instructions in the `README.md` files in each subdirectory!
