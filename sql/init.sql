

create database hotspotplus

create table IF NOT EXISTS hotspotplus.Charge(_id UUID,businessId String,type String,forThe String, amount UInt32,date DateTime)
engine=MergeTree()
PARTITION BY toStartOfMonth( date )
ORDER BY (businessId)


create MATERIALIZED VIEW IF NOT EXISTS  hotspotplus.Usage
engine=SummingMergeTree((sessionTime,download,upload))
PARTITION BY (toStartOfMonth( creationDate))
ORDER BY (businessId,memberId,departmentId,sessionId)
POPULATE AS select *
from hotspotplus.Session

--create table IF NOT EXISTS hotspotplus.Usage(creationDate DateTime,accStatusType UInt8, sessionId String, businessId String,memberId String,nasId String,mac String,username String,download UInt32,upload UInt32,totalUsage UInt32,
--sessionTime UInt32)
--engine=SummingMergeTree((sessionTime,download,upload,totalUsage))
--PARTITION BY toStartOfMonth( creationDate )
--ORDER BY ( sessionId,businessId,memberId,username,toStartOfInterval( creationDate ,INTERVAL 60 minute ) )

--
--CREATE MATERIALIZED VIEW hotspotplus.UsageView ENGINE=MergeTree()
--PARTITION BY (toStartOfMonth( creationDate))
--ORDER BY (sessionId,businessId,memberId)
--POPULATE AS SELECT sessionId,any(businessId) as businessId,any(memberId) as memberId,any(nasId) as nasId,any(username) as username,MAX(creationDate) as creationDate,MAX(upload) as upload,MAX(download) as download,MAX(sessionTime) as sessionTime
--FROM hotspotplus.Usage
--group by sessionId

select sum(a.download) from (select sessionId,max(download) download,max(upload),max(sessionTime) from hotspotplus.UsageView  where memberId='5d728a37a987c2013d392bf4' group by sessionId) a

create database hotspotplusLicense
create table IF NOT EXISTS hotspotplusLicense.Charge(_id UUID,licenseId String,type String,forThe String, amount UInt8,date DateTime)
engine=MergeTree()
PARTITION BY toStartOfMonth( creationDate )
ORDER BY (licenseId)


create table IF NOT EXISTS hotspotplus.Netflow(RouterAddr String,SrcIP String,DstIP String, SrcPort String,DstPort String,NextHop String, TimeRecvd DateTime,Proto UInt8)
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( TimeRecvd )
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,toStartOfInterval( TimeRecvd ,INTERVAL 30 minute ))

create table IF NOT EXISTS hotspotplus.Session(sessionId String,businessId String,memberId String,nasId String,departmentId String,groupIdentityId String,nasIp String,username String,framedIpAddress String,mac String,creationDate DateTime,download UInt32,upload UInt32,
sessionTime UInt32,accStatusType UInt8 )
engine=MergeTree()
PARTITION BY toStartOfDay( creationDate )
ORDER BY (businessId,memberId,sessionId,departmentId,nasIp,framedIpAddress,creationDate,username)

create table IF NOT EXISTS hotspotplus.WebProxy( memberIp String,nasIp String,protocol String,url String,method String,domain String,receivedAt DateTime )
engine=MergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,receivedAt)

create table IF NOT EXISTS hotspotplus.Dns1(memberIp String,nasIp String,domain String,receivedAt DateTime )
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,domain,toStartOfInterval( receivedAt , INTERVAL 1 day ))

## List Of Partitions
select  active,partition,name  from system.parts  where database='logs' and table='netflow'

## Detach Partition
alter table hotspotplus.netflow detach partition '2019-08-09 14:24:53'

## Attach Partition
alter table hotspotplus.netflow attach partition '2019-08-09 14:24:53'

SELECT * FROM (
SELECT any(toStartOfInterval(creationDate,INTERVAL 86400 second)) as date ,toUnixTimestamp(date) as unixTime,SUM(upload) as upload,SUM(download) download,SUM(sessionTime) as sessionTime
FROM hotspotplus.Session
GROUP BY toStartOfInterval(creationDate,INTERVAL 86400 second) order by date
) ANY RIGHT JOIN (
SELECT arrayJoin(timeSlots(toDateTime('2019-09-01 00:00:00'), toUInt32(86400*30),86400)) AS date
) USING (date) order by date