
SELECT count(*) FROM logs.Session JOIN logs.Netflow ON Session.nasIp=Netflow.RouterAddr
AND toStartOfInterval( Session.creationDate ,INTERVAL 5 minute )=toStartOfInterval( Netflow.TimeRecvd ,INTERVAL 5 minute )
WHERE (Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop )
AND (SrcIP='192.168.2.1' OR DstIP='192.168.2.1' OR NextHop='192.168.2.1')
AND Netflow.TimeRecvd>=toDateTime('2019-08-29 03:45:05')
AND Netflow.TimeRecvd<=toDateTime('2019-08-29 04:29:06')



select DstPort from logs.Netflow where
Netflow.TimeRecvd>=toDateTime('2019-08-29 03:45:05')
AND Netflow.TimeRecvd<=toDateTime('2019-08-29 04:29:06')
AND (SrcIP='192.168.2.1' OR DstIP='192.168.2.1' OR NextHop='192.168.2.1')



CREATE MATERIALIZED VIEW logs.UserNetflowReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( TimeRecvd))
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,username,toStartOfHour( TimeRecvd ))
AS SELECT * FROM logs.Session JOIN logs.Netflow ON Session.nasIp=Netflow.RouterAddr
AND toStartOfFiveMinute(Session.creationDate)=toStartOfFiveMinute(Netflow.TimeRecvd)
WHERE Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop


CREATE MATERIALIZED VIEW logs.UserWebProxyReport ENGINE=MergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (nasIp,memberIp,username,toStartOfHour( receivedAt ))
AS SELECT username,domain FROM logs.Session JOIN logs.WebProxy  ON Session.nasIp=WebProxy.nasIp
AND toStartOfMinute(Session.creationDate)=toStartOfMinute(WebProxy.receivedAt)
WHERE Session.framedIpAddress=WebProxy.memberIp


CREATE MATERIALIZED VIEW logs.UserDnsReport ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (nasIp,memberIp,domain,username,toStartOfHour( receivedAt ))
AS SELECT * FROM logs.Session JOIN logs.Dns ON Session.nasIp=Dns.nasIp
AND toStartOfFiveMinute(Session.creationDate)=toStartOfFiveMinute(Dns.receivedAt)
WHERE Session.framedIpAddress=Dns.memberIp