# OpenTDF Deployment Guide

Helm charts, configurations and support images for an opinionated deployment of OpenTDF

## Prerequisites
1. Install [kubectl](https://kubernetes.io/) by following the [installation steps](https://kubernetes.io/docs/tasks/tools/) for your operating system. 

1. Install [helm](https://helm.sh) by following the [installation steps](https://helm.sh/docs/intro/install/) for your operating system. 
  
1. Install Istio  
Install istio via helm [Istio Docs](https://istio.io/latest/docs/setup/install/helm/)
    ```
    helm repo add istio https://istio-release.storage.googleapis.com/charts
    helm repo update  
    kubectl create namespace istio-system
    helm install istio-base istio/base -n istio-system
    helm install istiod istio/istiod -n istio-system --wait
    ```

1. Install Istio Ingress Gateway

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
 2. Enable Service Mesh Sidecar injection: ```kubectl label namespace $ns istio-injection=enabled```
 3. :warning: **Local Deploy Only** : Gateway TLS/HTTPS: Generate TLS Certs and create secret
    - Generate Certs:  ./charts/local_gencerts.sh
    - Create tls-opentdf secret for OpenTDF Gateway:
    ```
    kubectl create secret \
    tls tls-opentdf \
    -n $ns \
    --key local.opentdf.io.key \
    --cert local.opentdf.io.crt
    ```
 4. Install Open TDF Chart
     ```
     helm install odtf -f myvalues.yaml -n $ns ./tdf-platform
      ```
 5. Validate the deployment  
   - Check to see that the pods are running (Learn more [here](https://kubebyexample.com/concept/deployments)):
      ```
      kubectl get pod,replicaset,deployment
      ```
   - Run the [Python Test Script](../quickstart/tests/oidc-auth.py) to validate that the OpenTDF services can successfully encrypt and decrypt a file.

### Alternative deployment with OpenShift
Check out [this guide](./README_OpenShift.md) for notes on deploying to the Red Hat OpenShift Service integration on AWS ([ROSA](https://aws.amazon.com/rosa/)). 

        

