#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build -t ${CI_REGISTRY_IMAGE}/api:latest -t ${CI_REGISTRY_IMAGE}/api:${CI_COMMIT_TAG} -f ./api/Dockerfile.build ./api/
    docker push ${CI_REGISTRY_IMAGE}/api:${CI_COMMIT_TAG}
}

build_image