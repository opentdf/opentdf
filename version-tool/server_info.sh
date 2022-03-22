#!/usr/bin/env bash

RUN_DIR=$( pwd )

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

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

helmImages=( $(helm template $PATH_TO_CHART_DIR \
    | perl -ne 'print "$1\n" if /image: (.+)/' \
    | tr -d '"' \
    | sort -u) )
printf '%s\n' "${helmImages[@]}"

echo "-----DOCKER IMAGES FROM KUBECTL-----"
images=( $(kubectl get pods --all-namespaces -o jsonpath="{.items[*].status.containerStatuses[*].image}" |\
tr -s '[[:space:]]' '\n') )
imageIDs=( $(kubectl get pods --all-namespaces -o jsonpath="{.items[*].status.containerStatuses[*].imageID}" |\
tr -s '[[:space:]]' '\n') )

# echo "Image\nImageID"
for i in "${!images[@]}"; do
    printf "Image: %s\nImageID: %s\n\n" "${images[i]}" "${imageIDs[i]}"
done


echo "-----GET LABELS FOR EACH IMAGE-----"
for image in "${helmImages[@]}"
do
    if [[ "$image" == *"virtru"* || "$image" == *"opentdf"* ]]; then
        parts=( $(echo $image | tr ":" "\n") )
        if [ "${#parts[@]}" -eq "1" ]; then
            labels=$( sh $SCRIPT_DIR/get_config_dockerhub.sh ${parts[0]} )
        else
            labels=$( sh $SCRIPT_DIR/get_config_dockerhub.sh ${parts[0]} ${parts[1]} )
        fi
        printf "%s: " "$image"
        echo "${labels}"
    fi

done


# # lists all the images running in kubernetes cluster
# kubectl get pods --all-namespaces -o jsonpath="{.status.containerStatuses[*].image}" |\
# tr -s '[[:space:]]' '\n'

# kubectl get pods --all-namespaces -o jsonpath="{.status.containerStatuses[*].imageID}" |\
# tr -s '[[:space:]]' '\n'

# kubectl get pods --all-namespaces -o json | jq '.items[] .status.containerStatuses[] | { "image": .image, "imageID": .imageID }'
