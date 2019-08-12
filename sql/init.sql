create table IF NOT EXISTS logs.netflow(RouterAddr String,SrcIP String,DstIP String, SrcPort String,DstPort String,NextHop String, TimeRecvd DateTime,Proto UInt8)
engine=MergeTree
PARTITION BY toStartOfDay( TimeRecvd )
ORDER BY (RouterAddr,SrcIP,TimeRecvd)

create table IF NOT EXISTS logs.session(businessId String,memberId String,nasId String,nasTitle String,nasIp String,username String,framedIpAddress String,mac String,creationDate DateTime )
engine=MergeTree
PARTITION BY toStartOfDay( creationDate )
ORDER BY (nasIp,framedIpAddress,creationDate)

create table IF NOT EXISTS logs.syslog(memberIp String,nasIp String,protocol String,url String,method String,domain String,receivedAt DateTime )
engine=MergeTree
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,receivedAt)


## List Of Partitions
SELECT  active,partition,name  FROM system.parts  WHERE database='logs' AND table='netflow'

## Detach Partition
alter table logs.netflow detach partition '2019-08-09 14:24:53'

## Attach Partition
alter table logs.netflow attach partition '2019-08-09 14:24:53'