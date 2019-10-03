#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build  --no-cache -t ${CI_REGISTRY_IMAGE}/goflow:latest   ./goflow
    docker push ${CI_REGISTRY_IMAGE}/goflow:latest
}

build_image