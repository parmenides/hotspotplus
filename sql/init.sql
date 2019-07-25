select * from netflow

create table IF NOT EXISTS logs.netflow(RouterAddr String,SrcIP String,DstIP String, SrcPort String,DstPort String,NextHop String, TimeRecvd DateTime)
engine=MergeTree
PARTITION BY TimeRecvd
ORDER BY (RouterAddr,SrcIP,TimeRecvd)


create table IF NOT EXISTS logs.session(businessId String,memberId String,nasId String,nasTitle String,nasIp String,username String,framedIpAddress String,mac String,creationDate DateTime )
engine=MergeTree
PARTITION BY creationDate
ORDER BY (nasIp,framedIpAddress,creationDate)


create table IF NOT EXISTS logs.syslog(memberIp String,nasIp String,protocol String,url String,method String,domain String,creationDate DateTime )
engine=MergeTree
PARTITION BY creationDate
ORDER BY (nasIp,memberIp,creationDate)

