load("ext://helm_resource", "helm_resource", "helm_repo")
load("ext://min_tilt_version", "min_tilt_version")

# The helm_resource extension uses the 'new extensions api' introduced in tilt 0.25
min_tilt_version("0.25")

# Versions of things backend to pull (attributes, kas, etc)
BACKEND_IMAGE_TAG = "main"

k8s_yaml(helm("./charts/secrets"))

helm_repo("bitnami", "https://charts.bitnami.com/bitnami", labels="utility")
helm_repo("codecentric", "https://codecentric.github.io/helm-charts", labels="utility")
helm_repo("k8s-in", "https://kubernetes.github.io/ingress-nginx", labels="utility")

helm_resource(
    "ingress-nginx",
    "k8s-in/ingress-nginx",
    flags=[
        "--version",
        "4.0.16",
        "--set",
        "controller.config.large-client-header-buffers=20 32k",
        "--set",
        "controller.admissionWebhooks.enabled=false",
    ],
    labels="third-party",
    port_forwards="65432:80",
    resource_deps=["k8s-in"],
)

helm_resource(
    "postgresql",
    "bitnami/postgresql",
    flags=["--version", "10.16.2", "-f", "charts/values-postgresql.yaml"],
    labels="third-party",
    resource_deps=["bitnami"],
)

helm_resource(
    "keycloak",
    "codecentric/keycloak",
    flags=["--version", "17.0.1", "-f", "charts/values-keycloak.yaml", "--set", "image.tag=%s" % BACKEND_IMAGE_TAG],
    labels="third-party",
    resource_deps=["postgresql", "codecentric", "ingress-nginx"],
)

helm_resource(
    "opentdf",
    "./charts",
    flags=["-f", "charts/values.yaml"],
    labels="opentdf",
    resource_deps=["postgresql", "keycloak", "ingress-nginx"]
)
