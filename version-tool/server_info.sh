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

echo ""

echo "-----DOCKER IMAGES FROM KUBECTL-----"
images=( $(kubectl get pods --all-namespaces -o jsonpath="{.items[*].status.containerStatuses[*].image}" |\
tr -s '[[:space:]]' '\n') )
imageIDs=( $(kubectl get pods --all-namespaces -o jsonpath="{.items[*].status.containerStatuses[*].imageID}" |\
tr -s '[[:space:]]' '\n') )

for i in "${!images[@]}"; do
    printf "Image: %s\nImageID: %s\n\n" "${images[i]}" "${imageIDs[i]}"
done


echo "-----LABELS FOR OPENTDF/VIRTRU IMAGES-----"
for image in "${helmImages[@]}"
do
    if [[ "$image" == *"opentdf"* || "$image" == *"virtru"* ]]; then
        parts=( $(echo $image | tr ":" "\n") )
        if [ "${#parts[@]}" -eq "1" ]; then
            jsonData=$( sh $SCRIPT_DIR/get_config_dockerhub.sh ${parts[0]} )
        else
            jsonData=$( sh $SCRIPT_DIR/get_config_dockerhub.sh ${parts[0]} ${parts[1]} )
        fi
        printf "%s \n" "$image"
        if [[ "$image" == *"opentdf"* ]]; then
            labels=$( jq -r 'try .config.Labels catch null' 2> /dev/null <<< "$jsonData") 
            printf "\tCreated: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.created"' )"
            printf "\tCommit: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.revision"' )"
            printf "\tSource: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.source"' )"
            printf "\tRepo: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.title"' )"
        else
            labels=$( jq -r 'try .container_config.Labels catch null' 2> /dev/null <<< "$jsonData") 
            echo "\t${labels}"
        fi
    fi

done

