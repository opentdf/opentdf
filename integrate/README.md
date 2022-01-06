# openTDF Integrate

**_Not for production_**

For local development

## Overview

[OpenID Connect](https://openid.net/connect/) (OIDC) is used by openTDF.

[Keycloak](https://www.keycloak.org/) is used for identity management.

[PostgreSQL](https://www.postgresql.org/) is the database.

## Prerequisites

- Install [Docker](https://www.docker.com/)

  - see https://docs.docker.com/get-docker/

- Install [kubectl](https://kubernetes.io/docs/reference/kubectl/overview/)

  - On macOS via Homebrew: `brew install kubectl`
  - On Linux or WSL2 for Windows: `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl`
  - Others see https://kubernetes.io/docs/tasks/tools/

- Install [kind](https://kind.sigs.k8s.io/)

  - On macOS via Homebrew: `brew install kind`
  - On Linux or WSL2 for Windows: `curl -Lo kind https://kind.sigs.k8s.io/dl/v0.11.1/kind-linux-amd64 && chmod +x kind && sudo mv kind /usr/local/bin/kind`
  - Others see https://kind.sigs.k8s.io/docs/user/quick-start/#installation

- Install [helm](https://helm.sh/)

  - On macOS via Homebrew: `brew install helm`
  - On Linux or WSL2 for Windows: `curl -LO https://get.helm.sh/helm-v3.7.0-linux-amd64.tar.gz && tar -zxvf helm-v3.0.0-linux-amd64.tar.gz && chmod +x linux-amd64/helm && sudo mv linux-amd64/helm /usr/local/bin/helm`
  - Others see https://helm.sh/docs/intro/install/

- Install [Tilt](https://tilt.dev/)
  - On macOS via Homebrew: `brew install tilt-dev/tap/tilt`
  - On Linux or WSL2 for Windows: `curl -fsSL https://github.com/tilt-dev/tilt/releases/download/v0.22.9/tilt.0.22.9.linux.x86_64.tar.gz | tar -xzv tilt && sudo mv tilt /usr/local/bin/tilt
  - Others see https://docs.tilt.dev/install.html

## Start

### Create cluster

`kind create cluster --name opentdf-integrate`

### Keycloak

```shell
kubectl create namespace keycloak
helm install --version 5.1.1 --values helm/keycloak-values.yaml --namespace keycloak keycloak bitnami/keycloak
```

## Configure

### Keycloak

[Operator documentation](https://www.keycloak.org/docs/latest/server_installation/index.html#_operator)

#### Add realm

![](../resource/keycloak-realm-add.png)

#### Add clients

The clients are web services and applications that use this for authentication.  
The services are `entitlements` and `attributes`.  
The web application is `abacus`.

![](../resource/keycloak-client-add.png)

#### Set audience on client

The web application is `abacus` and it requires audiences of `entitlements` and `attributes`.

![](../resource/keycloak-client-audience.png)

#### Add abacus user

This user will be able to create attributes and entitle.  
Add user and set role for viewing clients and users.

![](../resource/keycloak-grantor-add.png)

![](../resource/keycloak-grantor-role.png)

#### Add entity (person, PE)

![](../resource/keycloak-entity-person-add.png)

#### Set password on entity (person)

![](../resource/keycloak-entity-person-password.png)

#### Add entity (client, NPE)

![](../resource/keycloak-client-nonperson-service.png)

#### Set password on entity (client, NPE)

![](../resource/keycloak-client-nonperson-secret.png)

#### Set OIDC User Info Signing

**User Info Signed Response Algorithm** set to RS256 under **Fine Grain OpenID Connect Configuration**

![](../resource/keycloak-client-nonperson-token.png)

#### Set mapper to apply claims

**Attribute Provider URL** is an internal service (use internal URL)  
**Token Claim Name** must be `tdf_claims`

![](../resource/keycloak-mapper-claims.png)
