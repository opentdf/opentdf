# OpenTDF Examples

Experience examples based on OpenTDF

## Prerequisites

The examples are built on top of the Quickstart. See Prerequisites in [Quickstart](../quickstart#prerequisites).

## Create cluster

```shell
kind create cluster --name opentdf-examples
```

### Start examples

```shell
tilt up
```

### Clean up

NOTE: Running kind delete will wipe your local cluster and any data associated with it. Delete at your own risk!

```shell
tilt down
kind delete cluster --name opentdf-examples
```
