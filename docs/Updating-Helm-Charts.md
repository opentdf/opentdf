# Updating Helm Charts

As updates are made to the [frontend] and [backend] repositories, various
packages are produced.  Some of these artifacts are published as [Helm Charts],
which are consumed by this project (`opentdf/opentdf`).

To leverage these updates, you'll need to find and replace the references
to these Helm Charts via their tag.  The process is described below:

1. Find "charts" produced by the opentdf project using the following 
link: [OpenTDF charts].  
1. Click on a component to reveal it's latest tag, for instance [charts/entitlement-store].
1. Identify the appropriate tag(s) to update (e.g. `BACKEND_CHART_TAG` or 
`FRONTEND_CHART_TAG`) in this project.
1. Find and replace all uses of the variable (e.g. `BACKEND_CHART_TAG` or 
`FRONTEND_CHART_TAG`).

Using the process above, you can work with different versions.  

When appropriate, open a Pull Request to the project.  You can see an example Pull 
Reqest [here](https://github.com/opentdf/opentdf/pull/95).


[frontend]: https://github.com/opentdf/frontend
[backend]: https://github.com/opentdf/backend
[Helm Charts]: https://helm.sh/
[OpenTDF charts]: https://github.com/orgs/opentdf/packages?ecosystem=container&tab=packages&ecosystem=container&q=charts
[charts/entitlement-store]: https://github.com/opentdf/backend/pkgs/container/charts%2Fentitlement-store