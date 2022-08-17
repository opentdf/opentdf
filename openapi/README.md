## Aggregate OpenAPI
The aggregate OpenAPI encompasses the OpenAPIs of the KAS, Attributes, and Entitlements services.

### How to Generate
We are generating the aggregate OpenAPI using a cli [openapi-merge-cli](https://www.npmjs.com/package/openapi-merge-cli).

Clone backend and opentdf repos and navigate to this directory:
```shell
git clone https://github.com/opentdf/opentdf.git
git clone https://github.com/opentdf/backend.git
cd opentdf/openapi
```

Install the cli and run:
```shell
npm i
npx openapi-merge-cli
```

You can edit the configs in [openapi-merge.json](./openapi-merge.json). See the cli [docs](https://github.com/robertmassaioli/openapi-merge/tree/main/packages/openapi-merge-cli) for more info.