CREATE MATERIALIZED VIEW logs.report ENGINE=MergeTree()
PARTITION BY (toStartOfDay( TimeRecvd))
ORDER BY (toStartOfDay(TimeRecvd))
AS SELECT * FROM logs.netflow JOIN logs.session ON session.nasIp=netflow.RouterAddr
AND toStartOfMinute(session.creationDate)=toStartOfMinute(netflow.TimeRecvd)
WHERE session.framedIpAddress=netflow.DstIP OR session.framedIpAddress=netflow.SrcIP OR session.framedIpAddress=netflow.NextHop


