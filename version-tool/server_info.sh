#!/usr/bin/env bash

echo  "-------------------------------Server Information----------------------------"

echo "-----HELM DEPENDENCIES-----"

if [[ -z "$1" ]]; then
    echo "No chart supplied"
    exit 1
fi

PATH_TO_CHART_DIR="$(dirname "$1")"


helm dependency list $PATH_TO_CHART_DIR

echo ""

echo "-----DOCKER IMAGES FROM HELM-----"

helm template $PATH_TO_CHART_DIR \
    | perl -ne 'print "$1\n" if /image: (.+)/' \
    | tr -d '"' \
    | sort -u

echo "-----DOCKER IMAGES FROM KUBECTL-----"
images=( $(kubectl get pods --all-namespaces -o jsonpath="{.items[*].status.containerStatuses[*].image}" |\
tr -s '[[:space:]]' '\n') )
imageIDs=( $(kubectl get pods --all-namespaces -o jsonpath="{.items[*].status.containerStatuses[*].imageID}" |\
tr -s '[[:space:]]' '\n') )

# echo "Image\nImageID"
for i in "${!images[@]}"; do
    printf "Image: %s\nImageID: %s\n\n" "${images[i]}" "${imageIDs[i]}"
done


# # lists all the images running in kubernetes cluster
# kubectl get pods --all-namespaces -o jsonpath="{.status.containerStatuses[*].image}" |\
# tr -s '[[:space:]]' '\n'

# kubectl get pods --all-namespaces -o jsonpath="{.status.containerStatuses[*].imageID}" |\
# tr -s '[[:space:]]' '\n'

# kubectl get pods --all-namespaces -o json | jq '.items[] .status.containerStatuses[] | { "image": .image, "imageID": .imageID }'