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

## Troubleshooting

### S3 CORS Errors

If you encounter CORS error during the S3 upload, please check the CORS configurations for your bucket and see the [AWS docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html) and [troubleshooting guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors-troubleshooting.html). While you may want to customize your CORS policy, here is a simple example that works for this app:
```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://localhost:65432",
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "Referer",
            "Cache-Control",
            "Content-Type",
            "Content-Length",
            "Access-Control-Allow-Origin"
        ]
    }
]
```
