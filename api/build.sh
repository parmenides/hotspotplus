#!/bin/bash -e

REGISTRY="registry.gitlab.com"

build_image(){
    docker build --no-cache -t ${CI_REGISTRY_IMAGE}/api:latest -t ${CI_REGISTRY_IMAGE}/api:${CI_COMMIT_TAG} -f ./api/Dockerfile.build ./api
    docker push ${CI_REGISTRY_IMAGE}/api:${CI_COMMIT_TAG}
    docker push ${CI_REGISTRY_IMAGE}/api:latest
}

build_image