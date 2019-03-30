#!/bin/bash -e

REGISTRY="registry.gitlab.com"

get_latest_commit(){
    echo $(git log -n 1 --pretty=format:""%H)
}

build_image(){
    docker build  --no-cache -t ${CI_REGISTRY_IMAGE}/logaggregator:latest -t ${CI_REGISTRY_IMAGE}/logaggregator:${CI_COMMIT_TAG} -f ./log-aggregator/Dockerfile.build ./log-aggregator
    docker push ${CI_REGISTRY_IMAGE}/logaggregator:${CI_COMMIT_TAG}
    docker push ${CI_REGISTRY_IMAGE}/logaggregator:latest
}

build_image