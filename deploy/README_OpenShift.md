## Deployment:
### 1. Update chart dependencies:
helm dependency update .
### 2. Install / Upgrade Chart
#### Set certificates folder env var:
```shell
export CERTS_ROOT=certs
```
#### Create X509 Secret for Keycloak Truststore (Install only)
Example using CA Certs in the certs directory:
```shell
kubectl create secret generic x509-secret \
    "--from-file=ca.crt=${CERTS_ROOT}/ca.crt" \
    "--from-file=ca2.crt=${CERTS_ROOT}/ca2.crt"
```
#### Install / Upgrade via helm:
Example using keys located in the certs directory:
```shell
KAS_SEC_PUB=$(cat ${CERTS_ROOT}/kas-ec-certificate.pem)
KAS_SEC_PRIV=$(cat ${CERTS_ROOT}/kas-ec-private-key.pem)
KAS_PUB=$(cat ${CERTS_ROOT}/kas-certificate.pem)
KAS_PRIV=$(cat ${CERTS_ROOT}/kas-private-key.pem)

helm upgrade --install  \
    --namespace opentdf \
    --set backend.kas.envConfig.ecCert="$KAS_SEC_PUB" \
    --set backend.kas.envConfig.ecPrivKey="$KAS_SEC_PRIV" \
    --set backend.kas.envConfig.cert="$KAS_PUB" \
    --set backend.kas.envConfig.privKey="$KAS_PRIV" \
    -f  values-x509.yaml \
    -f  values-openshift.yaml \
     tdf-platform .
 ```

Example using existing secret:
1. Create the KAS secret with required data elements:
   - ATTR_AUTHORITY_CERTIFICATE, 
   - KAS_EC_SECP256R1_CERTIFICATE, 
   - KAS_CERTIFICATE, 
   - KAS_EC_SECP256R1_PRIVATE_KEY, 
   - KAS_PRIVATE_KEY
1. Deploy
```
helm upgrade --install  \
   --namespace opentdf \
   --set backend.kas.externalEnvSecretName="$YOUR_KAS_SECRET_NAME" \
   -f  values.yaml \
   -f  values-openshift.yaml \
   tdf-platform .
 ```

# Openshift Service Mesh 
AWS ROSA:
Prerequisites:
- Install operators: https://docs.openshift.com/container-platform/4.10/service_mesh/v2x/installing-ossm.html
- Install Service Mesh Control Plane: https://docs.openshift.com/container-platform/4.10/service_mesh/v2x/ossm-create-smcp.html#ossm-create-smcp
```shell
oc create -n istio-system -f ../openshift-rosa/istio-installation.yaml 
```
- Add the project to service member roles 
```shell
oc create -n istio-system -f ../openshift-rosa/servicemeshmemberroll-default.yaml
```
- Create a tls certificate named opentdf-tls (in istio-system namespace)
- Mesh OpenTDF Componenets:
```
kubectl patch deployment abacus -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
kubectl patch deployment attributes -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
kubectl patch deployment entitlement-store -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
kubectl patch deployment entitlements -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
kubectl patch deployment entity-resolution  -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
kubectl patch deployment kas  -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
kubectl patch deployment entitlement-pdp  -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'

kubectl patch statefulset keycloak -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
```

