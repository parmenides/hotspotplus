drop table session
create table IF NOT EXISTS logs.session (nasTitle String,creationDate datetime,framedIpAddress IPv4, businessId String ,memberId String,nasId String,username String,mac String,nasIp IPv4  )
engine=MergeTree
PARTITION BY creationDate
ORDER BY (nasIp,framedIpAddress,creationDate)

insert into session (nasTitle,creationDate,framedIpAddress, businessId,memberId,nasId,username,mac,nasIp) Values
  (
     'FOODLAND',
        toDateTime( '2016-06-15 11:31:23' ),
     '192.168.3.123',
     '5c7649e78520860012d21a5d',
    '5c860d1e3039780012dd4145',
     '5c764b6e8520860012d21a62',
    '9170676670',
    '60:A4:D0:08:55:E1',
     '109.201.1.137'
  ),
  (
     'FOODLAND',
toDateTime( '2016-06-15 11:32:23' ),
     '192.168.3.123',
     '5c7649e78520860012d21a5d',
    '5c860d1e3039780012dd4145',
     '5c764b6e8520860012d21a62',
    '9170676670',
    '60:A4:D0:08:55:E1',
     '109.230.80.33'
  ),
  (
     'mikrotik',
toDateTime( '2016-06-15 11:33:23' ),
     '172.1.3.232',
     '5c7d21ee53c40b0012c3d91d',
    '5ca5ffa45f89e70012bb2a9b',
     '5c7ea57387173f0012467526',
    '9112180994',
    '88:83:22:4B:3E:4C',
     '81.12.87.82'
  ),
  (
     'cafe',
toDateTime( '2016-06-15 11:34:23' ),
     '10.5.50.33',
     '59f0885af4a846001ea5726a',
    '5c4e063f5e8faa001278d238',
     '59f08b25f4a846001ea5726f',
    '9304223329',
    '0C:A8:A7:B9:B7:AE',
     '66.79.106.27'
  ),
  (
     'cafe',
toDateTime( '2016-06-15 11:35:23' ),
     '10.5.50.33',
     '59f0885af4a846001ea5726a',
    '5c4e063f5e8faa001278d238',
     '59f08b25f4a846001ea5726f',
    '9304223329',
    '0C:A8:A7:B9:B7:AE',
     '66.79.106.27'
  ),
  (
     'amirkabir',
toDateTime( '2016-06-15 11:36:23' ),
     '192.168.4.179',
     '5af817ecb37e7f0012368e4f',
    '5c1299749c3fd9001282d6b8',
     '5af81a5bb37e7f0012368e52',
    'zeus2',
    '80:7A:BF:29:30:6B',
     '109.201.1.137'
  )
