FROM node:10-alpine

WORKDIR /usr/src/app
COPY package*.json ./

RUN apk add tzdata
RUN cp /usr/share/zoneinfo/Asia/Tehran /etc/localtime
