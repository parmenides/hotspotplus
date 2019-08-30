create table IF NOT EXISTS logs.Netflow(RouterAddr String,SrcIP String,DstIP String, SrcPort String,DstPort String,NextHop String, TimeRecvd DateTime,Proto UInt8)
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( TimeRecvd )
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,toStartOfInterval( TimeRecvd ,INTERVAL 30 minute ))

create table IF NOT EXISTS logs.Session(businessId String,memberId String,nasId String,nasTitle String,nasIp String,username String,framedIpAddress String,mac String,creationDate DateTime )
engine=MergeTree()
PARTITION BY toStartOfDay( creationDate )
ORDER BY (nasIp,framedIpAddress,creationDate)

create table IF NOT EXISTS logs.WebProxy( memberIp String,nasIp String,protocol String,url String,method String,domain String,receivedAt DateTime )
engine=MergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,receivedAt)

create table IF NOT EXISTS logs.Dns(memberIp String,nasIp String,domain String,receivedAt DateTime )
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,domain,toStartOfInterval( receivedAt , INTERVAL 120 minute ))

## List Of Partitions
SELECT  active,partition,name  FROM system.parts  WHERE database='logs' AND table='netflow'

## Detach Partition
alter table logs.netflow detach partition '2019-08-09 14:24:53'

## Attach Partition
alter table logs.netflow attach partition '2019-08-09 14:24:53'