# Cloud Deployment Demo

This demonstration will walk through a sample setup of OpenTDF in a Kubernetes cluster managed by AWS EKS and deployed using Helm.

This example also uses AWS Okta + SAML sign-on. 

By the end of this demo, we will have:
* OpenTDF services running in a namespaced kubernetes cluster
* A Docker container running our application within the same cluster
* A publicly-available domain
* The ability to encrypt & decrypt a file using TDF in our application


:exclamation: **Please note that this is for demonstration/development purposes only and is NOT intended to be production-ready**. In this configuration, the secrets are opaque and unprotected. Our production-ready guide is still under construction. 


## Prerequisites

- Install [Docker](https://www.docker.com/)

  - see https://docs.docker.com/get-docker/

- Install [kubectl](https://kubernetes.io/docs/reference/kubectl/overview/)

  - On macOS via Homebrew: `brew install kubectl`
  - On Linux or WSL2 for Windows: `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl`
  - Others see https://kubernetes.io/docs/tasks/tools/

- Install [helm](https://helm.sh/)

  - On macOS via Homebrew: `brew install helm`
  - On Linux or WSL2 for Windows: `curl -LO https://get.helm.sh/helm-v3.7.0-linux-amd64.tar.gz && tar -zxvf helm-v3.7.0-linux-amd64.tar.gz && chmod +x linux-amd64/helm && sudo mv linux-amd64/helm /usr/local/bin/helm`
  - Others see https://helm.sh/docs/intro/install/
  
- An AWS Account with AWS EKS
  
  - See [Getting Started with Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html) 
  
- Install [eksctl](https://docs.aws.amazon.com/eks/latest/userguide/eksctl.html) 
  
  - On macOS via Homebrew: `brew install weaveworks/tap/eksctl` 
  - Others see [Installing eksctl](https://docs.aws.amazon.com/eks/latest/userguide/eksctl.html)
  - - **NOTE**: This is an AWS-specific utility

- Install & Configure [AWS CLI](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html)
  - [Installing AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
  - :exclamation: You will need to configure AWS CLI if you haven't done so already. See [Quick configuration with aws configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-config)

- Install [AWS Okta](https://docs.aws.amazon.com/singlesignon/latest/userguide/okta-idp.html)
  - On macOS via Homebrew: `brew install aws-okta` 
  - **Note**: Other authentication providers can be used, but this guide assumes TODO: finish this sentence


## Setting up Amazon EKS Cluster

If you are using a different EKS Management service, please skip this section and go to **Deploying OpenTDF with Helm**. 

Others, please follow the instructions at [Getting Started with Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html) to set up your cluster for OpenTDF. 

You should be able to follow all of the steps on the guide. Some notes from our setup are below.

### Cluster Configuration Notes

* We selected Kubernetes Version: 1.21 for our cluster
* We used an existing VPC for our cluster. See AWS's [Tutorial: Creating a VPC](https://docs.aws.amazon.com/batch/latest/userguide/create-public-private-vpc.html).
* Cluster Endpoint Access: Set to Public and Private
* Step 3: Create nodes
  * In our example, we wanted to use EC2 instances, so we followed the steps under "Managed nodes - Linux", which involves [Creating the Amazon EKS node IAM role](https://docs.aws.amazon.com/eks/latest/userguide/create-node-role.html).
* Compute & Scaling configurations we used:
  * Amazon linux 2 (AL2_x86_64)
  * On demand
  * C5.large -size nodes*

\*for more information about node instance types, see [Amazon EC2 Instance Types](https://www.amazonaws.cn/en/ec2/instance-types/)


## AWS Okta Setup

Under construction


## Deploying OpenTDF with Helm

The steps here are very similar to the [Integrate guide](https://github.com/opentdf/documentation/tree/main/integrate#keycloak), but using our EKS Cluster rather than a local cluster with `kind` . 

Run the fllowing helm command:

`helm install --version 5.1.1 --values helm/keycloak-values.yaml --namespace keycloak keycloak bitnami/keycloak` TODO: confirm this command

specifying the values file you'd like helm to use - `helm/keycloak-values.yaml` in the example above.

edit `helm/keycloak-values.yaml` TODO: link to it within this deployment dir? do we want to put the code in here? by updating the following values:
* `KEYCLOAK_FRONTEND_URL`: update to your public-facing domain name
* `KEYCLOAK_EXTRA_ARGS`
  * Replace instances of `localhost` with your public-facing domain name
* `ingress.hostname` : update to your public-facing 
* Update the `annotations` with the values in `ingress-values.yaml` to set up the ingress. **Note**: the certificate will need to be updated. See Creating an SSL Cert

When you run the `helm upgrade install` command above, it will create a namespace for keycloak, and use the charts from codecentric. It also pulls the dockerhub keycloak image and includes the OpenTDF plugin (the claims mapper). TODO: Make this more detailed, with links 

### Verifying the dpeloyment

Run `kubens` to see your namespaces. you should see `keycloak`. 

Run `kubens keycloak` , then `kubectl get pods` to see your running pods within the keycloak ns. This shows that you have keycloak up and running! 

:exclamation: Note that this is NOT production ready. In this configuration, keycloak creates its own stateful set. File storage is created within k8s. It creates its own postgres inside k8s, and its own container of keycloak. IN PRODUCTION, the file storage would likely be elsewhere. Postgres would be hosted. 

CURRENTLY, there is an issue with this configuration where keycloak will reinstall itself after some time. This deletes postgres and subsequently your data, so it is NOT intended for long-term use. Production-ready demo is still under construction. 

## Creating an SSL Cert

You will need to create an SSL cert. TODO: finish





 




