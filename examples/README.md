# OpenTDF Examples

Experience examples based on OpenTDF

## Prerequisites

The examples are built on top of the Quickstart. See Prerequisites in [Quickstart](../quickstart#prerequisites).

In addition:

- Install [ctptl](https://github.com/tilt-dev/ctlptl#readme)
  - On macOS via Homebrew: `brew install tilt-dev/tap/ctlptl`
  - Others see https://github.com/tilt-dev/ctlptl#homebrew-maclinux

### Start examples

```shell
ctlptl create cluster kind --registry=ctlptl-registry --name kind-opentdf-examples
tilt up
```

### Clean up

NOTE: Running kind delete will wipe your local cluster and any data associated with it. Delete at your own risk!

```shell
tilt down
ctlptl delete cluster kind-opentdf-examples
```
