FROM node:10-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add git make python g++
ENV NPM_CONFIG_PREFIX=/app/.npm-global
ENV PATH=$PATH:/app/.npm-global/bin
RUN npm i npm@latest -g
RUN npm i
RUN npm install git+https://gitlab-ci-token:yw4Y31Gx9eRZKVH2GCt5@gitlab.com/parmenides/HotspotplusCommon.git#licensed
