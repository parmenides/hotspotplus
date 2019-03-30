#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build  --no-cache -t ${CI_REGISTRY_IMAGE}/coordinator:latest -t ${CI_REGISTRY_IMAGE}/coordinator:${CI_COMMIT_TAG} -f ./coordinator/Dockerfile.build ./coordinator
    docker push ${CI_REGISTRY_IMAGE}/coordinator:${CI_COMMIT_TAG}
    docker push ${CI_REGISTRY_IMAGE}/coordinator:latest
}

build_image