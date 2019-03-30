#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build  --no-cache -t ${CI_REGISTRY_IMAGE}/logworker:latest -t ${CI_REGISTRY_IMAGE}/logworker:${CI_COMMIT_TAG} -f ./log-worker/Dockerfile.build ./log-worker
    docker push ${CI_REGISTRY_IMAGE}/logworker:${CI_COMMIT_TAG}
    docker push ${CI_REGISTRY_IMAGE}/logworker:latest
}

build_image