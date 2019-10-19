const SESSION_TABLE = 'hotspotplus.Session';
const USAGE_TABLE = 'hotspotplus.Usage';
const CHARGE_TABLE = 'hotspotplus.Charge';
const NETFLOW_REPORT_TABLE = 'hotspotplus.NetflowReport';
const DNS_REPORT_TABLE = 'hotspotplus.DnsReport';
const LICENSE_TABLE = 'license.Charge';

module.exports = (insert, query, uuid, config, moment, log) => {
  return Object.freeze({

    init: async () => {
      await query('create database IF NOT EXISTS  hotspotplus');
      await query(`create table IF NOT EXISTS hotspotplus.Charge(_id UUID,businessId String,type String,forThe String, amount UInt32,date DateTime) engine=MergeTree()
PARTITION BY toStartOfMonth( date )
ORDER BY (businessId)
`);

      await query(`create table IF NOT EXISTS hotspotplus.Netflow(RouterAddr String,SrcIP String,DstIP String, SrcPort String,DstPort String,NextHop String, TimeRecvd DateTime,Proto UInt8)
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( TimeRecvd )
ORDER BY (NextHop,DstPort,SrcPort,DstIP,SrcIP,RouterAddr,toStartOfInterval( TimeRecvd ,INTERVAL 30 minute ))
`);

      await query(`create table IF NOT EXISTS ${SESSION_TABLE}(sessionId String,businessId String,memberId String,nasId String,departmentId String,groupIdentityId String,nasIp String,username String,framedIpAddress String,mac String,creationDate DateTime,download UInt32,upload UInt32,
sessionTime UInt32,accStatusType UInt8 )
engine=MergeTree()
PARTITION BY toStartOfDay( creationDate )
ORDER BY (businessId,memberId,sessionId,departmentId,nasIp,framedIpAddress,creationDate,username)
`);

      await query(`CREATE MATERIALIZED VIEW IF NOT EXISTS  ${USAGE_TABLE}
engine=SummingMergeTree((sessionTime,download,upload))
PARTITION BY (toStartOfMonth( creationDate))
ORDER BY (businessId,memberId,departmentId,sessionId)
POPULATE AS SELECT *
FROM hotspotplus.Session
`);

      await query(`create table IF NOT EXISTS hotspotplus.WebProxy( memberIp String,nasIp String,protocol String,url String,method String,domain String,receivedAt DateTime )
engine=MergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,receivedAt)
`);
      await query(`create table IF NOT EXISTS hotspotplus.Dns(memberIp String,nasIp String,domain String,receivedAt DateTime )
engine=AggregatingMergeTree()
PARTITION BY toStartOfDay( receivedAt )
ORDER BY (nasIp,memberIp,domain,toStartOfInterval( receivedAt , INTERVAL 1 day ))
`);
      await query(`CREATE MATERIALIZED VIEW IF NOT EXISTS ${NETFLOW_REPORT_TABLE} ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( timeRecvd))
ORDER BY (dstIp,srcIp,routerAddr,dstPort,srcPort,username,toStartOfHour( timeRecvd ))
Populate AS SELECT Session.businessId,Session.departmentId,Session.memberId,Session.nasIp,Session.username,Netflow.RouterAddr as routerAddr,Netflow.SrcIP as srcIp, Netflow.DstIP as dstIp, Netflow.SrcPort as srcPort, Netflow.DstPort as dstPort,Netflow.TimeRecvd as timeRecvd,Netflow.Proto as proto, NextHop as nextHop
FROM hotspotplus.Session JOIN hotspotplus.Netflow ON Session.nasIp=Netflow.RouterAddr
 AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Netflow.TimeRecvd,INTERVAL 5 minute )
WHERE Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop
`);
      await query(`CREATE MATERIALIZED VIEW IF NOT EXISTS ${DNS_REPORT_TABLE} ENGINE=AggregatingMergeTree()
PARTITION BY (toStartOfDay( receivedAt))
ORDER BY (memberId,nasIp,memberIp,domain,username,toStartOfHour( receivedAt ))
Populate AS SELECT Session.businessId,Session.departmentId,Session.memberId,Session.nasIp,Session.memberIp as memberIp, Session.username,Dns.receivedAt as receivedAt,Dns.domain as domain
FROM hotspotplus.Session JOIN hotspotplus.Dns ON Session.nasIp=Dns.nasIp
 AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Dns.receivedAt,INTERVAL 5 minute )
WHERE Session.framedIpAddress=Dns.memberIp
`);
    },

    getUsageByInterval: (businessId, departmentId, startDate, endDate) => {
      if (!businessId) {
        throw new Error('businessId is undefined');
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate);
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT);
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT);
      const intervalInSeconds = 86400;
      const durationInDays = moment(endDate).diff(moment(startDate), 'days');
      const sqlQuery = `
SELECT * FROM (
SELECT any(toStartOfInterval(creationDate,INTERVAL ${intervalInSeconds} second)) as date ,toInt64(SUM(upload)) as upload,toInt64(SUM(download)) download,toInt64(SUM(sessionTime)) as sessionTime
FROM ${USAGE_TABLE}
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}' ${departmentId ? ` AND departmentId='${departmentId}'` : ''}
GROUP BY toStartOfInterval(creationDate,INTERVAL ${intervalInSeconds} second) order by date
) ANY RIGHT JOIN (
SELECT arrayJoin(timeSlots(toDateTime('${from}'), toUInt32(${intervalInSeconds}*${durationInDays}),${intervalInSeconds})) AS date
) USING (date) order by date
 `;
      log.warn(sqlQuery);
      return query(sqlQuery).then((result) => {
        log.debug({result});
        return result;
      });
    },
    getMemberUsage: (startDate, endDate, memberId, businessId) => {
      if (!businessId) {
        throw new Error('businessId is undefined');
      }
      if (!memberId) {
        throw new Error('memberId is undefined');
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate);
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT);
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT);
      const sqlQuery = `SELECT sessionId , toInt64(SUM(upload)) as upload,toInt64(SUM(download)) as download,toInt64(SUM(sessionTime)) as sessionTime FROM ${USAGE_TABLE}
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}' AND memberId='${memberId}' group by sessionId`;
      log.debug(sqlQuery);
      return query(sqlQuery).then((result) => {
        // const {upload, download, sessionTime} = result[0]
        log.debug({result});
        return result;
        /* return {
          memberId: memberId,
          bulk: Number(download) + Number(upload),
          download: Number(download),
          upload: Number(upload),
          sessionTime: Number(sessionTime)
        } */
      });
    },
    getBusinessUsage: (businessId, departmentId, startDate, endDate) => {
      if (!businessId) {
        throw new Error('businessId is undefined');
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate);
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT);
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT);
      const sqlQuery = `SELECT toInt64(SUM(upload)) as upload,toInt64(SUM(download)) as download,toInt64(SUM(sessionTime)) as sessionTime FROM ${USAGE_TABLE}
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}' ${departmentId ? `AND departmentId='${departmentId}'` : ''}`;

      return query(sqlQuery).then((result) => {
        const {upload, download, sessionTime, bulk} = result[0];
        log.debug({result});
        return {
          bulk: Number(bulk),
          download: Number(download),
          upload: Number(upload),
          sessionTime: Number(sessionTime),
        };
      });
    },
    getTopMembersByUsage: (businessId, departmentId, startDate, endDate, limit, skip) => {
      if (!businessId) {
        throw new Error('businessId is undefined');
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate);
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT);
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT);
      const sqlQuery = `SELECT memberId,any(username) as username,toInt64(SUM(upload)) as upload,toInt64(SUM(download)) as download,toInt64(SUM(sessionTime)) as sessionTime FROM ${USAGE_TABLE}
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}' ${departmentId ? `AND departmentId='${departmentId}'` : ''} 
    GROUP BY memberId ORDER BY download DESC,upload DESC, sessionTime DESC LIMIT ${limit} OFFSET ${skip} 
`;
      log.debug(sqlQuery);
      return query(sqlQuery).then((result) => {
        log.debug({result});
        return result;
      });
    },
    addCharge: (chargeData) => {
      if (chargeData.amount <= 0) {
        throw new Error(`invalid amount charge amount ${chargeData.amount}`);
      }
      const now = moment.utc();
      log.debug(chargeData);
      const charge = [
        uuid(),
        chargeData.businessId,
        chargeData.type,
        chargeData.forThe,
        chargeData.amount,
        now.format(config.DATABASE_DATE_FORMAT),
      ];
      return insert(CHARGE_TABLE, charge);
    },
    getActiveSessionIds: (businessId, departmentId, fromDate, toDate, skip, limit) => {
      if (!businessId) {
        throw new Error('business ID is undefined');
      }
      if (!fromDate) {
        throw new Error('startDate is undefined');
      }
      if (!limit) {
        throw new Error('limit is undefined');
      }
      if (skip == null) {
        throw new Error('skip is undefined');
      }

      try {
        const startDate = moment.utc(fromDate).format(config.DATABASE_DATE_FORMAT);
        const endDate = toDate ? moment.utc(toDate).format(config.DATABASE_DATE_FORMAT) : moment.utc().format(config.DATABASE_DATE_FORMAT);
        const sqlQuery = `SELECT sessionId
 FROM ${SESSION_TABLE} WHERE businessId='${businessId}' AND creationDate>=toDateTime('${startDate}') AND creationDate<=toDateTime('${endDate}') ${departmentId ? ` AND departmentId='${departmentId}'` : ''}
       AND (accStatusType=3 OR accStatusType=1) 
       GROUP BY sessionId LIMIT ${limit} OFFSET ${skip} `;
        log.warn({sqlQuery});
        return query(sqlQuery).then((result) => {
          log.warn({result});
          return result;
        });
      } catch (error) {
        log.error('get sessions %j', error);
        throw error;
      }
    },
    getMemberSessions: (memberId, fromDate, toDate) => {
      if (!memberId) {
        throw new Error('member ID is undefined');
      }
      if (!fromDate) {
        throw new Error('startDate is undefined');
      }

      try {
        const startDate = moment.utc(fromDate).format(config.DATABASE_DATE_FORMAT);
        const endDate = toDate ? moment.utc(toDate).format(config.DATABASE_DATE_FORMAT) : moment.utc().format(config.DATABASE_DATE_FORMAT);
        const sqlQuery = `SELECT sessionId,any(businessId),any(memberId),any(nasId),any(departmentId),any(groupIdentityId), any(nasIp),           
any(username),any(framedIpAddress),any(mac),any(creationDate),any(download),any(upload),any(sessionTime),any(accStatusType)
 FROM ${SESSION_TABLE} WHERE memberId='${memberId}' AND creationDate>=toDateTime('${startDate}') AND creationDate<=toDateTime('${endDate}') 
       AND (accStatusType=3 OR accStatusType=1) 
       GROUP BY sessionId  `;
        log.warn({sqlQuery});
        return query(sqlQuery).then((result) => {
          log.warn({result});
          return result;
        });
      } catch (error) {
        log.error('get member sessions %j', error);
        throw error;
      }
    },
    getSessionUsage: (sessionId) => {
      if (!sessionId) {
        throw new Error('session ID is undefined');
      }

      try {
        const sqlQuery = `SELECT any(framedIpAddress) as framedIpAddress,sessionId,any(nasIp) as nasIp,
any(username) as username,any(memberId) as memberId,toInt64(sum(download)) as download,toInt64(sum(upload)) as upload,toInt64(sum(sessionTime)) as sessionTime
 FROM ${USAGE_TABLE} WHERE sessionId='${sessionId}'
 GROUP BY sessionId `;

        log.warn({sqlQuery});
        return query(sqlQuery).then((result) => {
          log.warn({result});
          return result[0];
        });
      } catch (error) {
        log.error('get session usage %j', error);
        throw error;
      }
    },
    countSessions: (businessId, departmentId, fromDate, toDate) => {
      if (!businessId) {
        throw new Error('business ID is undefined');
      }
      if (!fromDate) {
        throw new Error('startDate is undefined');
      }

      try {
        const startDate = moment.utc(fromDate).format(config.DATABASE_DATE_FORMAT);
        const endDate = toDate ? moment.utc(toDate).format(config.DATABASE_DATE_FORMAT) : moment.utc().format(config.DATABASE_DATE_FORMAT);
        const sqlQuery = `SELECT  sessionId,count() as count FROM ${SESSION_TABLE} WHERE businessId='${businessId}'  ${departmentId ? `AND departmentId='${departmentId}'` : ''} 
      AND creationDate>=toDateTime('${startDate}') AND creationDate<=toDateTime('${endDate}') AND (accStatusType=3 OR accStatusType=1) group by sessionId`;
        log.debug({sqlQuery});
        return query(sqlQuery).then(function(result) {
          log.debug({result});
          return {
            count: result.length,
          };
        });
      } catch (error) {
        log.error('count sessions %j', error);
        throw error;
      }
    },
    getDatabaseInfo: () => {
      try {
        const sqlQuery = `SELECT table, formatReadableSize(size) as size, rows, days, formatReadableSize(avgDaySize) as avgDaySize FROM (
    SELECT
        table,
        sum(bytes) AS size,
        sum(rows) AS rows,
        min(min_time) AS min_time,
        max(max_time) AS max_time,
        toUInt32((max_time - min_time) / 86400) AS days,
        size / ((max_time - min_time) / 86400) AS avgDaySize
    FROM system.parts
    WHERE active
    GROUP BY table
    ORDER BY rows DESC
)
`;
        log.debug({sqlQuery});
        return query(sqlQuery).then(function(result) {
          log.debug({result});
          return result;
        });
      } catch (error) {
        log.error('count sessions %j', error);
        throw error;
      }
    },
    getSessionsById: (sessionId) => {
      if (!sessionId) {
        throw new Error('sessionId ID is undefined');
      }
      try {
        const sqlQuery = `SELECT  * FROM ${SESSION_TABLE} WHERE sessionId='${sessionId}'`;
        log.debug({sqlQuery});
        return query(sqlQuery).then(function(result) {
          log.debug({result});
          return result[0];
        });
      } catch (error) {
        log.error('find sessions by id %j', error);
        throw error;
      }
    },
    getCharges: (businessId, startDate, skip, limit) => {
      if (!businessId) {
        throw new Error('business ID is undefined');
      }
      if (!startDate) {
        throw new Error('startDate or endDate is undefined');
      }
      if (!limit) {
        throw new Error('limit is undefined');
      }
      if (skip == null) {
        throw new Error('skip is undefined');
      }
      try {
        const fromDate = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT);
        const sqlQuery = `SELECT * FROM ${CHARGE_TABLE} WHERE businessId='${businessId}' AND date>=toDateTime('${fromDate}') ORDER BY date LIMIT ${limit} OFFSET ${skip}`;
        log.debug({sqlQuery});
        return query(sqlQuery).then(function(result) {
          log.debug({result});
          return {
            charges: result,
          };
        });
      } catch (error) {
        log.error('getCharges %j', error);
        throw error;
      }
    },
    getProfileBalance: (businessId) => {
      if (!businessId) {
        throw new Error('businessId is undefined');
      }
      try {
        const sqlQuery = `SELECT sum(amount) as balance FROM ${CHARGE_TABLE} WHERE businessId='${businessId}' `;
        return query(sqlQuery).then((result) => {
          log.debug(result);
          return {
            balance: result[0].balance,
          };
        });
      } catch (error) {
        log.error(error);
        throw error;
      }
    },
    getLicenseBalance: (licenseId) => {
      if (!licenseId) {
        throw new Error('licenseId is undefined');
      }
      try {
        const sqlQuery = `SELECT sum(amount) as balance FROM ${LICENSE_TABLE} WHERE licenseId='${licenseId}' `;
        return query(sqlQuery).then((result) => {
          return {
            balance: result[0].balance,
          };
        });
      } catch (error) {
        log.error(error);
        throw error;
      }
    },
    addLicenseCharge: (chargeData) => {
      if (chargeData.amount <= 0) {
        throw new Error(`invalid amount charge amount ${chargeData.amount}`);
      }
      const ownerMobile = chargeData.notifyOwner;
      const charge = [
        uuid(),
        chargeData.licenseId,
        chargeData.type,
        chargeData.forThe,
        chargeData.amount,
        moment.utc(chargeData.date).format(config.DATABASE_DATE_FORMAT),
      ];

      return insert(LICENSE_TABLE, charge).then(() => {
        if (ownerMobile) {
          smsModule.send({
            token1: charge.amount,
            mobile: ownerMobile,
            template: config.BUSINESS_SMS_CHARGE_CONFIRM,
          });
        }
      });
    },
  });
};
