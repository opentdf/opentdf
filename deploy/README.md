# opentdf-fedstack

Repo containing Helm charts, configurations and support images for an opinionated internal deployment of OpenTDF


# Install
Prerequisites:
1. Istio.  
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
1. Set install namespace: ```export ns=default```
1. Enable Service Mesh Sidecar injection: ```kubectl label namespace $ns istio-injection=enabled```
1. Local Machine Deployment TLS/HTTPS: Generate TLS Certs and create secret
 - Generate Certs:  ./charts/local_gencerts.sh
 - Create tls-opentdf secret for OpenTDF Gateway:
   ```
   kubectl create secret \
   tls tls-opentdf \
   -n $ns \
   --key local.opentdf.io.key \
   --cert local.opentdf.io.crt
   ```
1. Install Chart

