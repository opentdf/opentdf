# OpenTDF Deployment Guide

Helm charts, configurations and support images for an opinionated deployment of OpenTDF

## Prerequisites
1. Install [Docker](https://www.docker.com/)

  - see https://docs.docker.com/get-docker/

2. Install [kubectl](https://kubernetes.io/docs/reference/kubectl/overview/)

  - On macOS via Homebrew: `brew install kubectl`
  - On Linux or WSL2 for Windows: `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl`
  - Others see https://kubernetes.io/docs/tasks/tools/

3. Install [helm](https://helm.sh/)

  - On macOS via Homebrew: `brew install helm`
  - On Linux or WSL2 for Windows: `curl -LO https://get.helm.sh/helm-v3.8.2-linux-amd64.tar.gz && tar -zxvf helm-v3.8.2-linux-amd64.tar.gz && chmod +x linux-amd64/helm && sudo mv linux-amd64/helm /usr/local/bin/helm`
  - Others see https://helm.sh/docs/intro/install/
4. Install Istio  
Install istio via helm [Istio Docs](https://istio.io/latest/docs/setup/install/helm/)
    ```
    helm repo add istio https://istio-release.storage.googleapis.com/charts
    helm repo update  
    kubectl create namespace istio-system
    helm install istio-base istio/base -n istio-system
    helm install istiod istio/istiod -n istio-system --wait
    ```

5. Install Istio Ingress Gateway

   **Attach Environment specific values file 

   ```
   kubectl create namespace istio-ingress
   kubectl label namespace istio-ingress istio-injection=enabled
   helm install istio-ingress istio/gateway -n istio-ingress
   ```
   Example for AWS EKS using AWS CERT ARN:
   ```
   helm install istio-ingress istio/gateway -n istio-ingress -f charts/aws-eks-example.yaml
   ```
## Deploy OpenTDF
 1. Set install namespace: ```export ns=default```
 1. Enable Service Mesh Sidecar injection: ```kubectl label namespace $ns istio-injection=enabled```
 1. :warning: **Local Deploy Only** : Gateway TLS/HTTPS: Generate TLS Certs and create secret
    - Generate Certs:  ./charts/local_gencerts.sh
    - Create tls-opentdf secret for OpenTDF Gateway:
    ```
    kubectl create secret \
    tls tls-opentdf \
    -n $ns \
    --key local.opentdf.io.key \
    --cert local.opentdf.io.crt
    ```
 2. Install Open TDF Chart
     ```
     helm install odtf -f myvalues.yaml -n $ns ./tdf-platform
      ```
 3. Validate the deployment  
   - Check to see that the pods are running (Learn more [here](https://kubebyexample.com/concept/deployments)):
      ```
      kubectl get pod,replicaset,deployment
      ```
   - Run the [Python Test Script](../quickstart/tests/oidc-auth.py) to validate that the OpenTDF services can successfully encrypt and decrypt a file.

### Alternative deployment with OpenShift
Check out [this guide](./README_OpenShift.md) for notes on deploying to the Red Hat OpenShift Service integration on AWS ([ROSA](https://aws.amazon.com/rosa/)). 

        

