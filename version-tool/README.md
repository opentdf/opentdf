# Version Tool

Retrieve system information and both client-side and server-side version information

Note: We enforce minimum version requirements for k8s, tilt, helm, kind, and ctlptl. They can be found in the quickstart [Tiltfile](../quickstart/Tiltfile#L7-L11).

### To Run

```shell
sh version_tool.sh --chart PATH_TO_CHART --package PATH_TO_PACKAGE --requirement PATH_TO_REQUIREMENTS --wheel PATH_TO_WHEEL --lib PATH_TO_LIB --include PATH_TO_INCLUDE
```

Where:

`PATH_TO_PACKAGE` is a path to a `package.json` if using node/web/cli client

`PATH_TO_REQUIREMENTS` is a path to `requirements.txt` if used to install python client

`PATH_TO_WHEEL` is a path a `.whl` file if used to install python client

`PATH_TO_LIB` is a path to the `lib` directory of the opentdf cpp library if using cpp client

`PATH_TO_INCLUDE` is a path to the `include` directory of the opentdf cpp library if using cpp client

`PATH_TO_CHART` is a path to the parent helm `Chart.yaml` if used
<br /><br />

For more information run 
```shell
sh version_tool.sh --help
```

Sample output:
```shell
-------------------------------System Information----------------------------
Hostname:		sample.lan
System Name:		Darwin
Kernel:
kern.version: Darwin Kernel Version 21.1.0: Wed Oct 13 17:33:01 PDT 2021; root:xnu-8019.41.5~1/RELEASE_ARM64_T6000
Architecture:		arm64
Machine Hardware:	arm64
Machine Info:
machdep.cpu.brand_string: Apple M1 Pro
machdep.cpu.core_count: 10
machdep.cpu.cores_per_package: 10
machdep.cpu.logical_per_package: 10
machdep.cpu.thread_count: 10
Date and Time:
Tue Mar 22 10:58:11 EDT 2022

-------------------------------Version Information-------------------------------
-----PYTHON-----:
python:
Python 2.7.18
pip:
python3:
Python 3.10.6
pip3:
pip 22.2.2 from /opt/homebrew/lib/python3.10/site-packages/pip (python 3.10)

-----JAVSCRIPT-----:
Node:		v17.4.0
NPM:		8.3.1

-----CPP-----:
Apple clang version 13.0.0 (clang-1300.0.27.3)
Target: arm64-apple-darwin21.1.0
Thread model: posix
InstalledDir: /Library/Developer/CommandLineTools/usr/bin

-----JAVA-----:
openjdk version "11.0.11" 2021-04-20
OpenJDK Runtime Environment AdoptOpenJDK-11.0.11+9 (build 11.0.11+9)
OpenJDK 64-Bit Server VM AdoptOpenJDK-11.0.11+9 (build 11.0.11+9, mixed mode)

-----GO-----:
go version go1.17.6 darwin/arm64

-----HELM-----:
version.BuildInfo{Version:"v3.8.1", GitCommit:"5cb9af4b1b271d11d7a97a71df3ac337dd94ad37", GitTreeState:"clean", GoVersion:"go1.17.8"}

-----KUBECTL-----:
Client Version: version.Info{Major:"1", Minor:"23", GitVersion:"v1.23.3", GitCommit:"816c97ab8cff8a1c72eccca1026f7820e93e0d25", GitTreeState:"clean", BuildDate:"2022-01-25T21:17:57Z", GoVersion:"go1.17.6", Compiler:"gc", Platform:"darwin/arm64"}
Server Version: version.Info{Major:"1", Minor:"23", GitVersion:"v1.23.4", GitCommit:"e6c093d87ea4cbb530a7b2ae91e54c0842d8308a", GitTreeState:"clean", BuildDate:"2022-03-06T21:39:59Z", GoVersion:"go1.17.7", Compiler:"gc", Platform:"linux/arm64"}

-----KIND-----:
kind v0.12.0 go1.17.8 darwin/arm64

-----TILT-----:
v0.30.6, built 2022-08-05


-------------------------------Client Information----------------------------
PYTHON CLIENT:
Version:  0.6.0
TDF3-JS:
Version: 4.1.8
CLIENT-WEB:
Version: 0.1.0
CLIENT-CPP:
0.6.1


-------------------------------Server Information----------------------------
-----HELM LIST-----
NAME              	NAMESPACE	REVISION	UPDATED                             	STATUS  	CHART                   	APP VERSION
abacus            	default  	1       	2022-10-06 10:53:51.399278 -0400 EDT	deployed	abacus-0.0.0-sha-f7c9fa0	0.0.0      
attributes        	default  	1       	2022-10-06 10:52:18.939334 -0400 EDT	deployed	attributes-1.1.0        	1.1.0      
entitlement-pdp   	default  	1       	2022-10-06 10:52:36.246603 -0400 EDT	deployed	entitlement-pdp-1.1.0   	1.1.0      
entitlement-store 	default  	1       	2022-10-06 10:52:18.632524 -0400 EDT	deployed	entitlement-store-1.1.0 	1.1.0      
entitlements      	default  	1       	2022-10-06 10:52:18.328352 -0400 EDT	deployed	entitlements-1.1.0      	1.1.0      
ingress-nginx     	default  	1       	2022-10-06 10:51:41.545902 -0400 EDT	deployed	ingress-nginx-4.0.16    	1.1.1      
kas               	default  	1       	2022-10-06 10:53:44.698561 -0400 EDT	deployed	kas-1.1.0               	1.1.0      
keycloak          	default  	1       	2022-10-06 10:52:59.713952 -0400 EDT	deployed	keycloakx-1.4.2         	18.0.0     
keycloak-bootstrap	default  	1       	2022-10-06 10:53:44.450678 -0400 EDT	deployed	keycloak-bootstrap-1.1.0	1.1.0      
postgresql        	default  	1       	2022-10-06 10:51:39.497778 -0400 EDT	deployed	postgresql-10.16.2      	11.14.0    

-----K8s PODS-----
NAMESPACE            NAME                                            READY   STATUS      RESTARTS   AGE
default              abacus-95746dcfd-ggcft                          1/1     Running     0          21m
default              attributes-5958f476cf-82jmm                     1/1     Running     0          22m
default              entitlement-pdp-659cc54fc5-2x6jq                1/1     Running     0          22m
default              entitlement-pdp-659cc54fc5-7dgsm                1/1     Running     0          22m
default              entitlement-pdp-659cc54fc5-x94jx                1/1     Running     0          22m
default              entitlement-store-67686bf664-fbmlp              1/1     Running     0          22m
default              entitlements-8d4c85478-7qvmr                    1/1     Running     0          22m
default              ingress-nginx-controller-7f8dc5d54-q44wl        1/1     Running     0          23m
default              kas-6c6f7df455-z8cv4                            1/1     Running     0          21m
default              keycloak-0                                      1/1     Running     0          22m
default              keycloak-bootstrap-662zg                        0/1     Completed   0          21m
default              postgresql-postgresql-0                         1/1     Running     0          23m
default              web-app-56cb798d5-ttbbs                         1/1     Running     0          20m
kube-system          coredns-64897985d-b9qtm                         1/1     Running     0          23m
kube-system          coredns-64897985d-kncms                         1/1     Running     0          23m
kube-system          etcd-opentdf-control-plane                      1/1     Running     0          24m
kube-system          kindnet-vfk55                                   1/1     Running     0          23m
kube-system          kube-apiserver-opentdf-control-plane            1/1     Running     0          24m
kube-system          kube-controller-manager-opentdf-control-plane   1/1     Running     0          24m
kube-system          kube-proxy-qccbn                                1/1     Running     0          23m
kube-system          kube-scheduler-opentdf-control-plane            1/1     Running     0          24m
local-path-storage   local-path-provisioner-5ddd94ff66-5vhzt         1/1     Running     0          23m

-----DOCKER IMAGES FROM KUBECTL-----
Image: ghcr.io/opentdf/abacus:sha-f7c9fa0
ImageID: ghcr.io/opentdf/abacus@sha256:df379988498cce58090e8569130ea51045c2b00c898102bb05f8e17835947b6e

Image: ghcr.io/opentdf/attributes:1.1.0
ImageID: ghcr.io/opentdf/attributes@sha256:503e8fce13301054157b77154ac4b2a59cf4019326faa80eda52792a92be5ee3

Image: ghcr.io/opentdf/entitlement-pdp:1.1.0
ImageID: ghcr.io/opentdf/entitlement-pdp@sha256:bffb29918020b778d89e28f53c136cf5fe9e8c1d8586ffd8860d16ad3453f450

Image: ghcr.io/opentdf/entitlement-pdp:1.1.0
ImageID: ghcr.io/opentdf/entitlement-pdp@sha256:bffb29918020b778d89e28f53c136cf5fe9e8c1d8586ffd8860d16ad3453f450

Image: ghcr.io/opentdf/entitlement-pdp:1.1.0
ImageID: ghcr.io/opentdf/entitlement-pdp@sha256:bffb29918020b778d89e28f53c136cf5fe9e8c1d8586ffd8860d16ad3453f450

Image: ghcr.io/opentdf/entitlement_store:1.1.0
ImageID: ghcr.io/opentdf/entitlement_store@sha256:adbd3a637308aa180081e0619aa8c3f6dd0c05910ab43ea0f4cecec98cdd6a92

Image: ghcr.io/opentdf/entitlements:1.1.0
ImageID: ghcr.io/opentdf/entitlements@sha256:88027589bb750411897aedd35612e455a794200ae8f23a70f264f4757153fcb4

Image: sha256:fcd5f7d32d480b3df6590af5a5153829999099eed276675e78ed11f3bd6957df
ImageID: k8s.gcr.io/ingress-nginx/controller@sha256:0bc88eb15f9e7f84e8e56c14fa5735aaa488b840983f87bd79b1054190e660de

Image: ghcr.io/opentdf/kas:1.1.0
ImageID: ghcr.io/opentdf/kas@sha256:d1bd519dd32f2579ec951ecb1c471c067ae33a6479ec252a558b3bd480e94a5a

Image: ghcr.io/opentdf/keycloak:18.0.2
ImageID: ghcr.io/opentdf/keycloak@sha256:a660f8ecf7d5aa873910bee207d11e416f8db8479e9336f10cf3e4f557b1bc5b

Image: ghcr.io/opentdf/keycloak-bootstrap:1.1.0
ImageID: ghcr.io/opentdf/keycloak-bootstrap@sha256:d761722129abecf39f950c5435d997e1cc0b650c50ba4d16399e0b185208daf8

Image: docker.io/bitnami/postgresql:11.14.0-debian-10-r28
ImageID: docker.io/bitnami/postgresql@sha256:522b02d183e01d30fedc81ebd842f66bb5d1a46e2ee33a85b5d90fbbe20718c3

Image: docker.io/opentdf/web-app:tilt-f73bc8b0f7dc95c4
ImageID: sha256:f73bc8b0f7dc95c4af92b26fd958d1dea911d72b81a6c3c75d253184e1251f12

Image: k8s.gcr.io/coredns/coredns:v1.8.6
ImageID: sha256:edaa71f2aee883484133da046954ad70fd6bf1fa42e5aec3f7dae199c626299c

Image: k8s.gcr.io/coredns/coredns:v1.8.6
ImageID: sha256:edaa71f2aee883484133da046954ad70fd6bf1fa42e5aec3f7dae199c626299c

Image: k8s.gcr.io/etcd:3.5.1-0
ImageID: sha256:1040f7790951c9d14469b9c1fb94f8e6212b17ad124055e4a5c8456ee8ef5d7e

Image: docker.io/kindest/kindnetd:v20211122-a2c10462
ImageID: sha256:ae1c622332ee60e894e68977e4b007577678b193cba45fb49203225bb3ef8b05

Image: k8s.gcr.io/kube-apiserver:v1.23.4
ImageID: sha256:33b93b125ebd40f8948749fa119f70437af6ed989a2c27817e3cb3bd1ee8d993

Image: k8s.gcr.io/kube-controller-manager:v1.23.4
ImageID: sha256:72f8c918f90d70316225f7adbd93669b727443bc71da259bee6d2d20c58995b0

Image: k8s.gcr.io/kube-proxy:v1.23.4
ImageID: sha256:2c33211109395f3e239a95cf537f7ee354d83ff38fd9efc948d508a24ee19dfe

Image: k8s.gcr.io/kube-scheduler:v1.23.4
ImageID: sha256:a2067c4dfb6a6bf120bae65748953a44f4ad8a8f5b67759f832f64a3ee8a6a46

Image: docker.io/rancher/local-path-provisioner:v0.0.14
ImageID: sha256:2b703ea309660ea944a48f41bb7a55716d84427cf5e04b8078bcdc44fa4ab2eb

-----LABELS FOR OPENTDF/VIRTRU IMAGES-----
ghcr.io/opentdf/abacus@sha256:df379988498cce58090e8569130ea51045c2b00c898102bb05f8e17835947b6e 
	Created: 2022-09-19T15:19:02.433Z
	Commit: f7c9fa0a5666a39db43ca76c458a164f71704120
	Source: https://github.com/opentdf/frontend
	Repo: frontend
ghcr.io/opentdf/attributes@sha256:503e8fce13301054157b77154ac4b2a59cf4019326faa80eda52792a92be5ee3 
	Created: 2022-09-09T16:48:24.358Z
	Commit: 22ed27df2daa140b3e294254eb6199c2e72a2d8e
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/entitlement-pdp@sha256:bffb29918020b778d89e28f53c136cf5fe9e8c1d8586ffd8860d16ad3453f450 
	Created: null
	Commit: null
	Source: null
	Repo: null
ghcr.io/opentdf/entitlement-pdp@sha256:bffb29918020b778d89e28f53c136cf5fe9e8c1d8586ffd8860d16ad3453f450 
	Created: null
	Commit: null
	Source: null
	Repo: null
ghcr.io/opentdf/entitlement-pdp@sha256:bffb29918020b778d89e28f53c136cf5fe9e8c1d8586ffd8860d16ad3453f450 
	Created: null
	Commit: null
	Source: null
	Repo: null
ghcr.io/opentdf/entitlement_store@sha256:adbd3a637308aa180081e0619aa8c3f6dd0c05910ab43ea0f4cecec98cdd6a92 
	Created: 2022-09-09T16:48:19.905Z
	Commit: 22ed27df2daa140b3e294254eb6199c2e72a2d8e
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/entitlements@sha256:88027589bb750411897aedd35612e455a794200ae8f23a70f264f4757153fcb4 
	Created: 2022-09-09T16:48:29.516Z
	Commit: 22ed27df2daa140b3e294254eb6199c2e72a2d8e
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/kas@sha256:d1bd519dd32f2579ec951ecb1c471c067ae33a6479ec252a558b3bd480e94a5a 
	Created: 2022-09-09T16:11:46.781Z
	Commit: 22ed27df2daa140b3e294254eb6199c2e72a2d8e
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/keycloak@sha256:a660f8ecf7d5aa873910bee207d11e416f8db8479e9336f10cf3e4f557b1bc5b 
	Created: 2022-06-13T11:33:30.815416
	Commit: edcc925e57a080c97a7295f38e4140ec72c8d5d8
	Source: https://access.redhat.com/containers/#/registry.access.redhat.com/ubi8-minimal/images/8.6-751.1655117800
	Repo: backend
ghcr.io/opentdf/keycloak-bootstrap@sha256:d761722129abecf39f950c5435d997e1cc0b650c50ba4d16399e0b185208daf8 
	Created: 2022-09-09T16:11:51.630Z
	Commit: 22ed27df2daa140b3e294254eb6199c2e72a2d8e
	Source: https://github.com/opentdf/backend
	Repo: backend
```