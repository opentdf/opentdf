# Version Tool

Retrieve system information and both client-side and server-side version information

### To Run

```shell
sh version_tool.sh --chart PATH_TO_CHART --package PATH_TO_PACKAGE --requirement PATH_TO_REQUIREMENTS --wheel PATH_TO_WHEEL 
```

Where:

`PATH_TO_CHART` (required) is a path to the parent helm `Chart.yaml`

`PATH_TO_PACKAGE` is a path to a `package.json` if using node/web/cli client

`PATH_TO_REQUIREMENTS` is a path to `requirements.txt` if used to install python client

`PATH_TO_WHEEL` is a path a `.whl` file if used to install python client

`PATH_TO_LIB` is a path to the `include` directory of the opentdf cpp library if using cpp client

`PATH_TO_INCLUDE` is a path to the `include` directory of the opentdf cpp library if using cpp client
<br /><br />

For more information run 
```shell
sh version_tool.sh --help
```