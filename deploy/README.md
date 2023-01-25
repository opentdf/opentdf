# OpenTDF Deployment Guide

Helm charts, configurations and support images for an opinionated deployment of OpenTDF

## Prerequisites
1. Install [Docker](https://www.docker.com/)

  - see https://docs.docker.com/get-docker/

1. Install [kubectl](https://kubernetes.io/docs/reference/kubectl/overview/)

  - On macOS via Homebrew: `brew install kubectl`
  - On Linux or WSL2 for Windows: `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl`
  - Others see https://kubernetes.io/docs/tasks/tools/

1. Install [helm](https://helm.sh/)

  - On macOS via Homebrew: `brew install helm`
  - On Linux or WSL2 for Windows: `curl -LO https://get.helm.sh/helm-v3.8.2-linux-amd64.tar.gz && tar -zxvf helm-v3.8.2-linux-amd64.tar.gz && chmod +x linux-amd64/helm && sudo mv linux-amd64/helm /usr/local/bin/helm`
  - Others see https://helm.sh/docs/intro/install/
1. Install Istio  
Install istio via helm [Istio Docs](https://istio.io/latest/docs/setup/install/helm/)
    ```
    helm repo add istio https://istio-release.storage.googleapis.com/charts
    helm repo update  
    kubectl create namespace istio-system
    helm install istio-base istio/base -n istio-system
    helm install istiod istio/istiod -n istio-system --wait
    ```

2. Install Istio Ingress Gateway

   **Attach Environment specific values file 

   ```
   kubectl create namespace istio-ingress
   kubectl label namespace istio-ingress istio-injection=enabled
   helm install istio-ingress istio/gateway -n istio-ingress
   ```

## Database

For production deployments, it is recommended to use a hosted PostgreSQL compatible enterprise-class database.

### Setup Schema

1. Get the schema creation script from the Helm chart (note this is version 1.2.0).
   1. https://github.com/opentdf/backend/blob/1.2.0/charts/backend/templates/postgres-initdb-secret.yaml#L13
2. Replace passwords - `{{ .Values.secrets.postgres.dbPassword }}`  Note these will be used in the Helm values below.
3. Note you may need to manually switch to the `tdf_dabase` if `\connect tdf_database;` does not work.
4. Run as postgres administrator 

## Deploy OpenTDF
1. Create namespace ```kubectl create namespace opentdf```
2. Set install namespace: ```export ns=opentdf```
3. Enable Service Mesh Sidecar injection: ```kubectl label namespace $ns istio-injection=enabled```
4. Go to chart directory ```cd <project_root>/deploy/charts/tdf-platform```
5. Update Helm dependencies ```helm dependency update```
6. Update values-mine.yaml (Use the examples values files for reference and Helm docs https://github.com/opentdf/backend/tree/main/charts/backend) 
7. Install OpenTDF Chart (note kubernetes storage is required)
     ```
     helm install otdf -f values-mine.yaml -n $ns .
      ```
8. Install cert-manager ```kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml```.  This is used by `deploy/charts/cert-manager.yaml`
9. Validate the deployment  
10. Check to see that the pods are running (Learn more [here](https://kubebyexample.com/concept/deployments)):
     ```
     kubectl get pod,replicaset,deployment
     ```
```
NAME                                     READY   STATUS    RESTARTS         AGE
pod/attributes-995749c59-c889k           1/1     Running   0                21h
pod/entitlement-pdp-5db7c857d7-5wngc     1/1     Running   0                6d20h
pod/entitlement-pdp-5db7c857d7-64pzs     1/1     Running   0                6d20h
pod/entitlement-pdp-5db7c857d7-z744z     1/1     Running   0                6d20h
pod/entitlement-store-84dbb6fdb4-mskhz   1/1     Running   16 (6d19h ago)   6d20h
pod/entitlements-5f7bb4ff5f-fpft7        1/1     Running   0                21h
pod/entity-resolution-6d4d555db5-2d6mk   1/1     Running   14   (49m ago)   5d1h
pod/kas-64555444d6-df2k6                 1/1     Running   0                21h
pod/keycloak-0                           1/1     Running   0                5d1h
pod/otdf-abacus-5bff9ddcd6-twsdf         1/1     Running   0                20m

NAME                                           DESIRED   CURRENT   READY   AGE
replicaset.apps/attributes-995749c59           1         1         1       6d20h
replicaset.apps/entitlement-pdp-5db7c857d7     3         3         3       6d20h
replicaset.apps/entitlement-store-84dbb6fdb4   1         1         1       6d20h
replicaset.apps/entitlements-5f7bb4ff5f        1         1         1       6d20h
replicaset.apps/entity-resolution-6d4d555db5   1         1         1       6d20h
replicaset.apps/kas-64555444d6                 1         1         1       6d20h
replicaset.apps/otdf-abacus-5bff9ddcd6         1         1         1       20m

NAME                                READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/attributes          1/1     1            1           6d20h
deployment.apps/entitlement-pdp     3/3     3            3           6d20h
deployment.apps/entitlement-store   1/1     1            1           6d20h
deployment.apps/entitlements        1/1     1            1           6d20h
deployment.apps/entity-resolution   1/1     1            1           6d20h
deployment.apps/kas                 1/1     1            1           6d20h
deployment.apps/otdf-abacus         1/1     1            1           20m
```
   - Run the [Python Test Script](../quickstart/tests/oidc-auth.py) to validate that the OpenTDF services can successfully encrypt and decrypt a file.

### Alternative deployments 

#### OpenShift
Check out [this guide](./README_OpenShift.md) for notes on deploying to the Red Hat OpenShift Service integration on AWS ([ROSA](https://aws.amazon.com/rosa/)). 

Check out `deploy/charts/tdf-platform/values-x509.yaml` for an example of how to accept x509 client certificates

#### AWS EKS and AWS CERT ARN
Follow the above prerequisite step, "Install Istio Ingress Gateway". You can use AWS CERT ARN if you're deploying to an AWS EKS Cluster.

Example:
```
helm install istio-ingress istio/gateway -n istio-ingress -f charts/aws-eks-example.yaml
```

