# Tiltfile for development
# https://docs.tilt.dev/api.html
#

include('../quickstart/Tiltfile')

#k8s_resource("kas", resource_deps=["opentdf-attributes"], port_forwards="8000:8000")

# abacship frontend
k8s_yaml("abacship-app/kubernetes.yaml")
k8s_resource(
    "opentdf-abacship",
    resource_deps = ["keycloak-bootstrap"],
    labels="abacship",
)

docker_build(
    "opentdf/abacship",
    "./abacship-app"
)

# abacship backend
docker_build(
    "opentdf/abacship-backend",
    "./abacship-app/backend_server"
)

abacship_backend_set = [
    "image.name=opentdf/abacship-backend"
    ]

k8s_yaml(
    helm(
        "abacship-app/backend_server/helm",
        "abacship-backend",
        set=abacship_backend_set,
        values=["abacship-app/backend_server/deployment/abacship-backend-values.yaml"],
    )
)

k8s_resource(
   "abacship-backend", 
    resource_deps=["keycloak-bootstrap"],
    labels="abacship"
)

# some local resource to run integration tests?
local_resource(
    "opentdf-abacship-backend-tests",
    cmd = "./abacship-app/backend_server/setup_venv.sh && \
    cd abacship-app/backend_server/app && \
    source ./venv/bin/activate && \
    cd tests && pytest",
    labels="abacship",
    resource_deps = ["abacship-backend"],
    allow_parallel=True
)

# secure remote storage
k8s_yaml("./secure-remote-storage/kubernetes.yaml")
k8s_resource(
    "opentdf-secure-remote-storage",
    resource_deps = ["keycloak-bootstrap"],
    labels="secure-remote-storage",
)

docker_build(
    "opentdf/secure-remote-storage",
    "./secure-remote-storage"
)

# sample web app
k8s_yaml("web-app/kubernetes.yaml")
k8s_resource(
    "web-app",
    port_forwards = '4070:4070',
    resource_deps = ["keycloak-bootstrap"],
    labels="web-app"
)

docker_build(
    "opentdf/example-web-app-image",
    "./web-app",
)