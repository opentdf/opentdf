# Installation in Isolated Kubernetes Clusters

If you are working on a kubernetes cluster that does not have access to the
Internet, or if you want to configure a demo the
[`build-offline-bundle`](./build-offline-bundle) script generates an archive
of the microservices container images and charts to allow installing without
a direct connection to the Internet.

## Building the offline bundle

To build the bundle, on a connected server that has recent (2022+) versions of
the following scripts (some of which may be installed with `scripts/pre-reqs`
on linux and macos):

- The bash shell
- git
- docker
- helm
- python
- curl
- npm (for abacus and node/web libraries)

Running the `build-offline-bundle` script will create a zip file in the
`build/export` folder named `offline-bundle-[date]-[short digest].zip.

Another script, `test-offline-bundle`, can be used to validate that a build was
created and can start, using a local k8s cluster created with kind.

### NB: Including Third Party Libraries

The current third party bundles, kind and postgresql, may require manual
editing of the `build-offline-bundle` script to get the appripriate tag and
SHA hash. See within the script for notes.

## Using the offline bundle

The offline bundle includes:

- Images
- Charts

## Install images locally

The images are installed in separate files from the bundle's `containers` folder.
`opentdf-service-images-[tag].tar` includes all the opentdf custom microservices.
`third-party-image-service-[tag].tar` includes individual images of various
required and optional third party services. For the configuration we use, we
require only the `postgresql` image.

These images must be made available to your cluster's registry.
One way to do this is to first install them to a local docker registry,
and then push them to a remote registry, e.g. using `docker load` and `docker push`.


```sh
docker load export/*.tar
docker images --format="{{json .Repository }}"  | sort | uniq | tr -d '"'| grep ^virtru/tdf | while read name; do docker push $name; done
```

## Configuring the OpenTDF Services

To install the app, we need to configure the helm values to match the configuration of your system,
and to include secrets that are unique to your installation.

#### Secrets

For this example, we will use self signed certificates and secrets:

```sh
export/scripts/genkeys-if-needed
kubectl create secret generic kas-secrets \
    "--from-file=EAS_CERTIFICATE=export/certs/eas-public.pem" \
    "--from-file=KAS_EC_SECP256R1_CERTIFICATE=export/certs/kas-ec-secp256r1-public.pem" \
    "--from-file=KAS_CERTIFICATE=export/certs/kas-public.pem" \
    "--from-file=KAS_EC_SECP256R1_PRIVATE_KEY=export/certs/kas-ec-secp256r1-private.pem" \
    "--from-file=KAS_PRIVATE_KEY=export/certs/kas-private.pem" \
    "--from-file=ca-cert.pem=export/certs/ca.crt" || e "create kas-secrets failed"
```

We will also need to generate and use a custom postgres password.

```sh
POSTGRES_PW=$(openssl rand -base64 40)
sed -i '' "s/myPostgresPassword/${POSTGRES_PW}/" export/deployment/values-postgresql-tdf.yaml
kubectl create secret generic attributes-secrets --from-literal=POSTGRES_PASSWORD="${POSTGRES_PW}"
kubectl create secret generic entitlements-secrets --from-literal=POSTGRES_PASSWORD="${POSTGRES_PW}"
```

> TODO: Move keycloak creds into secrets.

## Names and Values

### `values-*`: Service configurations

Replace the values for `host` and `kasDefaultUrl` with your public domain name.

> TODO: Migrate into a true umbrella charts, to include the ability to set a single host

#### `values-postgresql-tdf`: Advanced Postgres Configuration

This should be left alone, but may be edited as needed for insight into postres, or schema upgrades.
