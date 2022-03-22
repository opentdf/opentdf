#!/bin/sh
repo=${1:-library/ubuntu}
tag=${2:-latest}
token=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repo}:pull" \
        | jq -r '.token')
digest=$(curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
              -H "Authorization: Bearer $token" \
              -s "https://registry-1.docker.io/v2/${repo}/manifests/${tag}" | jq -r .config.digest)
curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
     -H "Authorization: Bearer $token" \
     -s -L "https://registry-1.docker.io/v2/${repo}/blobs/${digest}" | jq -r .config.Labels
# jsonResp=$(curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
#      -H "Authorization: Bearer $token" \
#      -s -L "https://registry-1.docker.io/v2/${repo}/blobs/${digest}")
# echo "${jsonResp}" | jq '[paths] | select(.[-1] | type == "string" and contains("Labels")) | join(".")'
# #-r '.[] | try .Labels catch "null"'