#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build -t ${CI_REGISTRY_IMAGE}/licensedashboard:latest -t ${CI_REGISTRY_IMAGE}/licensedashboard:${CI_COMMIT_TAG} -f ./license-dashboard/Dockerfile.build ./license-dashboard
    docker push ${CI_REGISTRY_IMAGE}/licensedashboard:${CI_COMMIT_TAG}
    docker push ${CI_REGISTRY_IMAGE}/licensedashboard:latest
}

build_image