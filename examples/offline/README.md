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

Running the `build-offline-bundle` script will create a tgz file in the
`build/export` folder named `offline-bundle-[date]-[short digest].tgz.

Another script, `test-offline-bundle`, can be used to validate that a build was
created and can start, using a local k8s cluster created with kind.

### NB: Including Third Party Libraries

The current third party bundles, kind and postgresql, may require manual
editing of the `build-offline-bundle` script to get the appropriate tag and
SHA hash. See within the script for notes.

## Using the offline bundle

The offline bundle includes:

- Images
- Charts
- Sample 'quickstart' deployment
- Utility scripts
- Optional docker image with everything inside

### 1. First decompress the bundle

> `tar -xzvf offline-bundle-*.tgz && cd bundle`

Unzip the bundle and go into the folder.
The below samples all assume you are running from the `bundle` root folder.

### 2. Install pre-reqs

> `scripts/pre-reqs`

The included `pre-reqs` script will try to install a variety of tools and applications
that the quickstart and image installer scripts will use. You can also install
these manually.
They include, but are not limited to:

- for installation and testing: `curl`
- for image registry management: `docker`
- for kubernetes control: `kubectl`, `helm`, and `tilt`
- for local demos: `minikube` or `kind`
- for working with rego policies: `opa` and policy

If the pre-reqs fails for you, please let us know.

#### Selecting a local cluster tool

We currently have a facade, `lib-local.sh`, which provides simple management for minikube or kind.
To select the appropriate cluster, please run either

```
export LOCAL_TOOL=minikube
```

or 

```
export LOCAL_TOOL=kind
```

### 3. Use the quickstart test environment

> `quickstart/start.sh --offline`

This will create a local kubernetes cluster with minikube or kind,
and install the opentdf and its required services within it, and launch with
some sample data.

### 4. Exposing the sample environment

If you are using **kind**, follow instructions here: https://kind.sigs.k8s.io/docs/user/ingress/, or the `expose port` flow below.

If you are using **minikube** with the docker network, you can use the `private network` flow below.

##### Expose Port

If you are running kind, `kubectl describe ingress ingress-nginx` doesn't show an IP, since it is running on the local host.

To expose it, you can use:

```
sudo kubectl port-forward $(kubectl get pods -o name --no-headers=true | grep nginx) 80:80
```

which maps port 80 on nginx to port 80 on the current host.

##### Private Network


```
kubectl describe ingress ingress-nginx
```

to see what network address is assigned to the nginx ingress controller, e.g. 
192.168.42.2. You can then route to that as you would any other host.

#### Routing from an external machine

If you are connecting to a computer from outside. First, on the host 

> `sudo ssh -L 80:[private network address]:80 [host address]`

Next, you will need to map the external name in your /etc/hosts file, so `sudo vim /etc/hosts` and add the following line:

```
127.0.0.1 [internal hostname] offline.demo.internal opentdf.local
```

where `[internal hostname]` is the value of `hostname` run on your host server, which is inserted as the external name by default. Alternative, you can overload hostname *BEFORE RUNNING start.sh* with the environment variable `INGRESS_HOSTNAME`.

If you want to connect to the minikube dashboard, you can also do that with a tunnel.

First, start the [dashboard](https://minikube.sigs.k8s.io/docs/handbook/dashboard/) with `minikube dashboard --url`. 
Next, tunnel the URL from the host operating system using the `-L` option.

> TODO allow bootstrap to take multiple domains, to allow offline.demo.internal or opentdf.local

## Advanced Install

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
docker images --format="{{json .Repository }}"  | sort | uniq | tr -d '"'| grep ^opentdf/ | while read name; do docker push $name; done
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
sed -i '' "s/myPostgresPassword/${POSTGRES_PW}/" export/quickstart/helm/values-postgresql.yaml
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
