FROM alpine:latest
RUN apk add tzdata
RUN ls /usr/share/zoneinfo

COPY ./clickhouse_sinker /go/bin/clickhouse_sinker
COPY . /opt/
ENTRYPOINT ["/go/bin/clickhouse_sinker"]