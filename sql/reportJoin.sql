CREATE MATERIALIZED VIEW logs.UserNetflowReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( TimeRecvd))
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,username,toStartOfHour( TimeRecvd ))
AS SELECT * FROM logs.Session JOIN logs.Netflow ON Session.nasIp=Netflow.RouterAddr
AND toStartOfFiveMinute(Session.creationDate)=toStartOfFiveMinute(Netflow.TimeRecvd)
WHERE Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop


CREATE MATERIALIZED VIEW logs.UserWebProxyReport ENGINE=MergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (nasIp,memberIp,username,toStartOfHour( receivedAt ))
AS SELECT * FROM logs.Session JOIN logs.WebProxy  ON Session.nasIp=WebProxy.nasIp
AND toStartOfMinute(Session.creationDate)=toStartOfMinute(WebProxy.receivedAt)
WHERE Session.framedIpAddress=WebProxy.memberIp


CREATE MATERIALIZED VIEW logs.UserDnsReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (nasIp,memberIp,domain,username,toStartOfHour( receivedAt ))
AS SELECT * FROM logs.Session JOIN logs.Dns ON Session.nasIp=Dns.nasIp
AND toStartOfFiveMinute(Session.creationDate)=toStartOfFiveMinute(Dns.receivedAt)
WHERE Session.framedIpAddress=Dns.memberIp