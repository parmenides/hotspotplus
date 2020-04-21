#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build --no-cache -t ${CI_REGISTRY_IMAGE}/api:latest -t ${CI_REGISTRY_IMAGE}/api:${CI_COMMIT_TAG} -f ./api/Dockerfile.build ./api
    docker login -u gitlab-cid-token -p $CI_JOB_TOKEN $CI_REGISTRY
    docker push ${CI_REGISTRY_IMAGE}/api:${CI_COMMIT_TAG}
    docker push ${CI_REGISTRY_IMAGE}/api:latest
}

build_image