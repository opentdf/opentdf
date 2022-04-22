#!/usr/bin/env bash

RUN_DIR=$( pwd )

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

echo  "-------------------------------Server Information----------------------------"


if [[ ! -z "$1" ]]; then
    PATH_TO_CHART_DIR="$(dirname "$1")"

    echo "--------HELM CHART INFO--------"

    echo "-----HELM CHART DEPENDENCIES-----"

    helm dependency list $PATH_TO_CHART_DIR

    echo ""

    echo "-----DOCKER IMAGES FROM HELM CHART-----"

    helmImages=( $(helm template $PATH_TO_CHART_DIR \
        | perl -ne 'print "$1\n" if /image: (.+)/' \
        | tr -d '"' \
        | sort -u) )
    printf '%s\n' "${helmImages[@]}"

    echo "--------END HELM CHART INFO--------"

    echo ""
fi

echo "-----HELM LIST-----"
helm list --all-namespaces

echo ""

echo "-----K8s PODS-----"
kubectl get pods --all-namespaces

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
for image in "${imageIDs[@]}"
do
    if [[ "$image" == *"opentdf"* || "$image" == *"virtru"* ]]; then
        docker pull $image > /dev/null
        jsonData=$( docker inspect $image | jq -r '.[0]')
        docker rmi $image > /dev/null
        printf "%s \n" "$image"
        if [[ "$image" == *"opentdf"* ]]; then
            labels=$( jq -r 'try .Config.Labels catch null' 2> /dev/null <<< "$jsonData") 
            if [[ "$image" == *"keycloak"* && "$image" != *"bootstrap"* ]]; then
                printf "\tCreated: %s\n" "$( echo ${labels} | jq -r '."build-date"' )"
                printf "\tCommit: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.revision"' )"
                printf "\tSource: %s\n" "$( echo ${labels} | jq -r '."url"' )"
                printf "\tRepo: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.title"' )"
            else
                printf "\tCreated: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.created"' )"
                printf "\tCommit: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.revision"' )"
                printf "\tSource: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.source"' )"
                printf "\tRepo: %s\n" "$( echo ${labels} | jq -r '."org.opencontainers.image.title"' )"
            fi 
        else
            labels=$( jq -r 'try .container_config.Labels catch null' 2> /dev/null <<< "$jsonData") 
            printf "\tCreated: %s\n" "$( echo ${labels} | jq -r '."created"' )"
            printf "\tCommit: %s\n" "$( echo ${labels} | jq -r '."revision"' )"
            printf "\tSource: %s\n" "$( echo ${labels} | jq -r '."source"' )"
            printf "\tRepo: %s\n" "$( echo ${labels} | jq -r '."title"' )"
        fi
    fi

done

