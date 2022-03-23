# Version Tool

Retrieve system information and both client-side and server-side version information

### To Run

```shell
sh version_tool.sh --chart PATH_TO_CHART --package PATH_TO_PACKAGE --requirement PATH_TO_REQUIREMENTS --wheel PATH_TO_WHEEL --lib PATH_TO_LIB --include PATH_TO_INCLUDE
```

Where:

`PATH_TO_CHART` (required) is a path to the parent helm `Chart.yaml`

`PATH_TO_PACKAGE` is a path to a `package.json` if using node/web/cli client

`PATH_TO_REQUIREMENTS` is a path to `requirements.txt` if used to install python client

`PATH_TO_WHEEL` is a path a `.whl` file if used to install python client

`PATH_TO_LIB` is a path to the `lib` directory of the opentdf cpp library if using cpp client

`PATH_TO_INCLUDE` is a path to the `include` directory of the opentdf cpp library if using cpp client
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
-----HELM DEPENDENCIES-----
NAME        	VERSION	REPOSITORY	STATUS  
attributes  	0.1.0  	          	unpacked
entitlements	0.1.0  	          	unpacked
claims      	0.1.0  	          	unpacked
access      	0.1.0  	          	unpacked

WARNING: "../helm/charts/abacus" is not in Chart.yaml.

-----DOCKER IMAGES FROM HELM-----
opentdf/abacus:0.4.0
opentdf/attributes:head
opentdf/claims:head
opentdf/entitlements:head
opentdf/kas:head

-----DOCKER IMAGES FROM KUBECTL-----
Image: sha256:19cf70651d3e2cc683f9b439b733fda47f20ba73e295db53aa13d638dc89c6cc
ImageID: k8s.gcr.io/ingress-nginx/controller@sha256:28b11ce69e57843de44e3db6413e98d09de0f6688e33d4bd384002a44f78405c

Image: k8s.gcr.io/coredns/coredns:v1.8.0
ImageID: sha256:1a1f05a2cd7c2fbfa7b45b21128c8a4880c003ca482460081dc12d76bfa863e8

Image: k8s.gcr.io/coredns/coredns:v1.8.0
ImageID: sha256:1a1f05a2cd7c2fbfa7b45b21128c8a4880c003ca482460081dc12d76bfa863e8

Image: k8s.gcr.io/etcd:3.4.13-0
ImageID: sha256:05b738aa1bc6355db8a2ee8639f3631b908286e43f584a3d2ee0c472de033c28

Image: docker.io/kindest/kindnetd:v20210326-1e038dc5
ImageID: sha256:f37b7c809e5dcc2090371f933f7acb726bb1bffd5652980d2e1d7e2eff5cd301

Image: k8s.gcr.io/kube-apiserver:v1.21.1
ImageID: sha256:18e61c783b41758dd391ab901366ec3546b26fae00eef7e223d1f94da808e02f

Image: k8s.gcr.io/kube-controller-manager:v1.21.1
ImageID: sha256:0c6dccae49de8003ee4fa06db04a9f13bb46cbaad03977e6baa21174f2dba2fc

Image: k8s.gcr.io/kube-proxy:v1.21.1
ImageID: sha256:4bbef4ca108cdc3b99fe23d487fa4fca933a62c4fc720626a3706df9cef63b21

Image: k8s.gcr.io/kube-scheduler:v1.21.1
ImageID: sha256:8c783dd2520887cc8e7908489ffc9f356c82436ba0411d554237a0b9632c9b87

Image: docker.io/rancher/local-path-provisioner:v0.0.14
ImageID: sha256:2b703ea309660ea944a48f41bb7a55716d84427cf5e04b8078bcdc44fa4ab2eb

Image: docker.io/opentdf/abacus:0.4.0
ImageID: docker.io/opentdf/abacus@sha256:7d82b5d5875234dffe49097f8db908b820e3b2185aafd7656392c366f2aa4b01

Image: docker.io/opentdf/kas:head
ImageID: docker.io/opentdf/kas@sha256:5bb0a5bf8c7213a1364ac272d1dbffea7fa0aa6a540cb68defab1cc73b8c94e2

Image: docker.io/opentdf/attributes:head
ImageID: docker.io/opentdf/attributes@sha256:b7c28a5a101ab0de28ff2b60e312eb969253372aab4e1fac38566445f18345ad

Image: docker.io/opentdf/claims:head
ImageID: docker.io/opentdf/claims@sha256:10077939e0792bb3cce045c17d85117b2eaa478bfbe96e6d356bfeae5add1d7a

Image: docker.io/opentdf/entitlements:head
ImageID: docker.io/opentdf/entitlements@sha256:279ca2db50f062a2583ae360c9a3fb3a086a40a81012eb7e788ee5784d42d18a

-----LABELS FOR OPENTDF/VIRTRU IMAGES-----
opentdf/abacus:0.4.0 
	Created: null
	Commit: null
	Source: null
	Repo: null
opentdf/attributes:head 
	Created: 2022-01-14T15:57:41.189Z
	Commit: e94217f01a3c32fa4966aab0157f341141982ead
	Source: https://github.com/opentdf/backend
	Repo: backend
opentdf/claims:head 
	Created: 2022-01-14T15:57:42.999Z
	Commit: e94217f01a3c32fa4966aab0157f341141982ead
	Source: https://github.com/opentdf/backend
	Repo: backend
opentdf/entitlements:head 
	Created: 2022-01-14T15:57:41.708Z
	Commit: e94217f01a3c32fa4966aab0157f341141982ead
	Source: https://github.com/opentdf/backend
	Repo: backend
opentdf/kas:head 
	Created: 2022-01-14T15:57:42.164Z
	Commit: e94217f01a3c32fa4966aab0157f341141982ead
	Source: https://github.com/opentdf/backend
	Repo: backend
```