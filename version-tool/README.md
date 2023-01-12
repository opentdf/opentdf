# Version Tool

Retrieve system information and both client-side and server-side version information

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
Python 3.8.9
pip3:
pip 22.0.4 from /Users/TESTUSER/Library/Python/3.8/lib/python/site-packages/pip (python 3.8)

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
version.BuildInfo{Version:"v3.8.0", GitCommit:"d14138609b01886f544b2025f5000351c9eb092e", GitTreeState:"clean", GoVersion:"go1.17.6"}

-----KUBECTL-----:
Client Version: version.Info{Major:"1", Minor:"23", GitVersion:"v1.23.3", GitCommit:"816c97ab8cff8a1c72eccca1026f7820e93e0d25", GitTreeState:"clean", BuildDate:"2022-01-25T21:17:57Z", GoVersion:"go1.17.6", Compiler:"gc", Platform:"darwin/arm64"}
Server Version: version.Info{Major:"1", Minor:"21", GitVersion:"v1.21.1", GitCommit:"5e58841cce77d4bc13713ad2b91fa0d961e69192", GitTreeState:"clean", BuildDate:"2021-05-21T23:06:30Z", GoVersion:"go1.16.4", Compiler:"gc", Platform:"linux/arm64"}

-----KIND-----:
kind v0.11.1 go1.17.2 darwin/arm64

-----TILT-----:
v0.23.9, built 2022-01-28


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
abacus            	default  	1       	2022-04-21 07:41:56.101688 -0400 EDT	deployed	abacus-0.1.0            	0.3.1      
attributes        	default  	1       	2022-04-21 07:41:06.199801 -0400 EDT	deployed	attributes-0.0.1        	0.0.1      
claims            	default  	1       	2022-04-21 07:40:57.814474 -0400 EDT	deployed	claims-0.0.1            	0.1.0      
entitlements      	default  	1       	2022-04-21 07:40:57.098717 -0400 EDT	deployed	entitlements-0.0.1      	0.0.1      
ingress-nginx     	default  	1       	2022-04-21 07:38:59.421522 -0400 EDT	deployed	ingress-nginx-4.0.16    	1.1.1      
kas               	default  	1       	2022-04-21 07:41:44.364691 -0400 EDT	deployed	kas-0.0.1               	0.6.3a0    
keycloak          	default  	1       	2022-04-21 07:41:03.576945 -0400 EDT	deployed	keycloak-17.0.1         	16.1.1     
keycloak-bootstrap	default  	1       	2022-04-21 07:41:43.03611 -0400 EDT 	deployed	keycloak-bootstrap-0.4.2	0.4.2      
postgresql        	default  	1       	2022-04-21 07:40:40.562598 -0400 EDT	deployed	postgresql-12.1.8      	11.14.0    

-----K8s PODS-----
NAMESPACE            NAME                                            READY   STATUS      RESTARTS   AGE
default              abacus-79dc495588-f6vxp                         1/1     Running     0          24h
default              attributes-b7dbbc5cb-zlj5v                      1/1     Running     0          24h
default              claims-578587c9-zd26f                           1/1     Running     0          24h
default              entitlements-869d6d876f-5mtxv                   1/1     Running     0          24h
default              ingress-nginx-controller-7f8dc5d54-tgzmr        1/1     Running     0          24h
default              kas-59d9465bd4-v2jvj                            1/1     Running     0          24h
default              keycloak-0                                      1/1     Running     0          24h
default              keycloak-bootstrap-vfmpk                        0/1     Completed   0          24h
default              postgresql-postgresql-0                         1/1     Running     0          24h
kube-system          coredns-64897985d-llpn8                         1/1     Running     0          2d17h
kube-system          coredns-64897985d-r25qx                         1/1     Running     0          2d17h
kube-system          etcd-opentdf-control-plane                      1/1     Running     0          2d17h
kube-system          kindnet-8qnr9                                   1/1     Running     0          2d17h
kube-system          kube-apiserver-opentdf-control-plane            1/1     Running     0          2d17h
kube-system          kube-controller-manager-opentdf-control-plane   1/1     Running     0          2d17h
kube-system          kube-proxy-jrz2d                                1/1     Running     0          2d17h
kube-system          kube-scheduler-opentdf-control-plane            1/1     Running     0          2d17h
local-path-storage   local-path-provisioner-5ddd94ff66-89ghj         1/1     Running     0          2d17h

-----DOCKER IMAGES FROM KUBECTL-----
Image: docker.io/opentdf/abacus:0.3.1
ImageID: docker.io/opentdf/abacus@sha256:b49b3176604e2c5b65845ab9853f190d15e86db76e104bc0dfbb3f3e544f2539

Image: ghcr.io/opentdf/attributes:main
ImageID: ghcr.io/opentdf/attributes@sha256:6e1c7a6d62bd3b3dbb477701b4353032dfd40bf525d4d3d82f3741f76d6b2cee

Image: ghcr.io/opentdf/claims:main
ImageID: ghcr.io/opentdf/claims@sha256:085e5b472ee034ebc7b6775d9a14cd7cd868f54d5424383e69d3a3f482305980

Image: ghcr.io/opentdf/entitlements:main
ImageID: ghcr.io/opentdf/entitlements@sha256:b9b94603ad6724f0ba092e91d97116a3a24c5f07745c2b8c670b59048c1de1d8

Image: sha256:fcd5f7d32d480b3df6590af5a5153829999099eed276675e78ed11f3bd6957df
ImageID: k8s.gcr.io/ingress-nginx/controller@sha256:0bc88eb15f9e7f84e8e56c14fa5735aaa488b840983f87bd79b1054190e660de

Image: ghcr.io/opentdf/kas:main
ImageID: ghcr.io/opentdf/kas@sha256:9cc4285d27ea88e76eefc1bb22747b22b802ed1955e93b8914c781e762af8dcc

Image: ghcr.io/opentdf/keycloak:main
ImageID: ghcr.io/opentdf/keycloak@sha256:79e34b4ebfaa6a8218fa152e58e9a4e79e541bf234a6150b8e61b8c0a902090a

Image: ghcr.io/opentdf/keycloak-bootstrap:main
ImageID: ghcr.io/opentdf/keycloak-bootstrap@sha256:31961e6d37f1228438da7c0bcf8db99cbac6cc5cac5eaa8785e173f976714eb3

Image: docker.io/bitnami/postgresql:11.14.0-debian-10-r28
ImageID: docker.io/bitnami/postgresql@sha256:522b02d183e01d30fedc81ebd842f66bb5d1a46e2ee33a85b5d90fbbe20718c3

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
docker.io/opentdf/abacus@sha256:b49b3176604e2c5b65845ab9853f190d15e86db76e104bc0dfbb3f3e544f2539 
	Created: null
	Commit: null
	Source: null
	Repo: null
ghcr.io/opentdf/attributes@sha256:6e1c7a6d62bd3b3dbb477701b4353032dfd40bf525d4d3d82f3741f76d6b2cee 
	Created: 2022-04-19T17:19:18.622Z
	Commit: 42501002d5ec00ead7252a913da00a03275ce677
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/claims@sha256:085e5b472ee034ebc7b6775d9a14cd7cd868f54d5424383e69d3a3f482305980 
	Created: 2022-04-19T17:19:19.990Z
	Commit: 42501002d5ec00ead7252a913da00a03275ce677
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/entitlements@sha256:b9b94603ad6724f0ba092e91d97116a3a24c5f07745c2b8c670b59048c1de1d8 
	Created: 2022-04-19T17:19:18.254Z
	Commit: 42501002d5ec00ead7252a913da00a03275ce677
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/kas@sha256:9cc4285d27ea88e76eefc1bb22747b22b802ed1955e93b8914c781e762af8dcc 
	Created: 2022-04-19T17:19:23.365Z
	Commit: 42501002d5ec00ead7252a913da00a03275ce677
	Source: https://github.com/opentdf/backend
	Repo: backend
ghcr.io/opentdf/keycloak@sha256:79e34b4ebfaa6a8218fa152e58e9a4e79e541bf234a6150b8e61b8c0a902090a 
	Created: 2022-03-08T13:06:16.389850
	Commit: 42501002d5ec00ead7252a913da00a03275ce677
	Source: https://access.redhat.com/containers/#/registry.access.redhat.com/ubi8-minimal/images/8.5-240
	Repo: backend
ghcr.io/opentdf/keycloak-bootstrap@sha256:31961e6d37f1228438da7c0bcf8db99cbac6cc5cac5eaa8785e173f976714eb3 
	Created: 2022-04-20T14:01:00.958Z
	Commit: 7860b10688ed3ee1e1922440f156370194407bff
	Source: https://github.com/opentdf/backend
	Repo: backend
```