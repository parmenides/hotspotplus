

create database hotspotplus
create table IF NOT EXISTS hotspotplus.Charge(_id UUID,businessId String,type String,forThe String, amount UInt32,date DateTime)
engine=MergeTree()
PARTITION BY toStartOfMonth( date )
ORDER BY (businessId)

create table IF NOT EXISTS hotspotplus.Usage(creationDate DateTime,accStatusType UInt8, sessionId String, businessId String,memberId String,nasId String,mac String,username String,download UInt32,upload UInt32,totalUsage UInt32,
sessionTime UInt32)
engine=AggregatingMergeTree()
PARTITION BY toStartOfMonth( creationDate )
ORDER BY (sessionId)


create database hotspotplusLicense
create table IF NOT EXISTS hotspotplusLicense.Charge(_id UUID,licenseId String,type String,forThe String, amount UInt8,date DateTime)
engine=MergeTree()
PARTITION BY toStartOfMonth( creationDate )
ORDER BY (licenseId)


create table IF NOT EXISTS hotspotplus.Netflow(RouterAddr String,SrcIP String,DstIP String, SrcPort String,DstPort String,NextHop String, TimeRecvd DateTime,Proto UInt8)
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( TimeRecvd )
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,toStartOfInterval( TimeRecvd ,INTERVAL 30 minute ))

create table IF NOT EXISTS hotspotplus.Session(businessId String,memberId String,nasId String,nasTitle String,nasIp String,username String,framedIpAddress String,mac String,creationDate DateTime )
engine=MergeTree()
PARTITION BY toStartOfDay( creationDate )
ORDER BY (nasIp,framedIpAddress,creationDate)

create table IF NOT EXISTS hotspotplus.WebProxy( memberIp String,nasIp String,protocol String,url String,method String,domain String,receivedAt DateTime )
engine=MergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,receivedAt)

create table IF NOT EXISTS hotspotplus.Dns(memberIp String,nasIp String,domain String,receivedAt DateTime )
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,domain,toStartOfInterval( receivedAt , INTERVAL 120 minute ))

## List Of Partitions
SELECT  active,partition,name  FROM system.parts  WHERE database='logs' AND table='netflow'

## Detach Partition
alter table hotspotplus.netflow detach partition '2019-08-09 14:24:53'

## Attach Partition
alter table hotspotplus.netflow attach partition '2019-08-09 14:24:53'