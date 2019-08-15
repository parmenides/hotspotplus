CREATE MATERIALIZED VIEW logs.UserNetflowReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( TimeRecvd))
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,username,toStartOfHour( TimeRecvd ))
AS SELECT * FROM logs.Netflow JOIN logs.Session ON Session.nasIp=Netflow.RouterAddr
AND toStartOfMinute(Session.creationDate)=toStartOfMinute(Netflow.TimeRecvd)
WHERE Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop


CREATE MATERIALIZED VIEW logs.UserWebProxyReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (nasIp,memberIp,domain,username,toStartOfHour( receivedAt ))
POPULATE AS SELECT * FROM logs.WebProxy JOIN logs.Session ON Session.nasIp=WebProxy.nasIp
AND toStartOfMinute(Session.creationDate)=toStartOfMinute(WebProxy.receivedAt)
WHERE Session.framedIpAddress=WebProxy.memberIp


CREATE MATERIALIZED VIEW logs.UserDnsReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (nasIp,memberIp,domain,username,toStartOfHour( receivedAt ))
AS SELECT * FROM logs.Dns JOIN logs.Session ON Session.nasIp=Dns.nasIp
AND toStartOfMinute(Session.creationDate)=toStartOfMinute(Dns.receivedAt)
WHERE Session.framedIpAddress=Dns.memberIp