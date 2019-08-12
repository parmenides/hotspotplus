CREATE MATERIALIZED VIEW logs.report ENGINE=MergeTree()
PARTITION BY (toStartOfDay( TimeRecvd))
ORDER BY (toStartOfDay(TimeRecvd))
AS SELECT * FROM logs.netflow JOIN logs.session ON session.nasIp=netflow.RouterAddr
AND toStartOfMinute(session.creationDate)=toStartOfMinute(netflow.TimeRecvd)
WHERE session.framedIpAddress=netflow.DstIP OR session.framedIpAddress=netflow.SrcIP OR session.framedIpAddress=netflow.NextHop


CREATE MATERIALIZED VIEW logs.syslogreport ENGINE=MergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (toStartOfDay(receivedAt))
AS SELECT * FROM logs.syslog JOIN logs.session ON session.nasIp=syslog.nasIp
AND toStartOfMinute(session.creationDate)=toStartOfMinute(syslog.receivedAt)
WHERE session.framedIpAddress=syslog.memberIp


