import { createLogger } from '../utils/logger';
import _ from 'lodash';
import {
  LOCAL_TIME_ZONE,
  NetflowReportRequestTask,
  PROTOCOLS,
  DATABASE_DATE_FORMAT,
  REPORT_PERSIAN_DATE_FORMAT,
  REPORT_GREGORIAN_DATE_FORMAT,
} from '../typings';
import moment from 'moment';
import momentJ from 'moment-jalaali';
import { createClickConnection, executeClickQuery } from '../utils/clickClient';

const log = createLogger();

const clickHouse: any = createClickConnection();

const formatReports = (rows: any[]) => {
  const formatted = rows.map((row) => {
    return {
      BusinessId: row.businessId,
      memberId: row.memberId,
      nasId: row.nasId,
      nasIp: row.nasIp,
      Username: row.username,
      Mac: row.mac,
      Jalali_Date: toJalaliDate(row.TimeRecvd),
      Src_Addr: row.SrcIP,
      Src_Port: row.SrcPort,
      Dst_Addr: row.DstIP,
      Dst_Port: row.DstPort,
      Protocol: toProtocolString(row.Proto),
      gregorian_date: toGregorianDate(row.TimeRecvd),
    };
  });
  return _.sortBy(formatted, ['Router', 'Username', 'Jalali_Date']);
};

const createNetflowQuery = (
  netflowReportRequestTask: NetflowReportRequestTask,
  count: boolean,
) => {
  let mainQuery: string;
  if (count) {
    mainQuery = ` SELECT toInt32(count(*)) as size FROM hotspotplus.Session JOIN hotspotplus.Netflow ON Session.nasIp=Netflow.RouterAddr 
 AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Netflow.TimeRecvd,INTERVAL 5 minute ) `;
  } else {
    mainQuery = ` SELECT businessId,memberId,nasIp,username,RouterAddr as routerAddr,SrcIP as srcIp, DstIP as dstIp, SrcPort as srcPort, DstPort as dstPort,TimeRecvd as timeRecvd,Proto as proto FROM hotspotplus.Session JOIN hotspotplus.Netflow ON Session.nasIp=Netflow.RouterAddr 
 AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Netflow.TimeRecvd,INTERVAL 5 minute ) `;
  }

  const whereParts: string[] = [
    ` (Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop) `,
  ];
  if (netflowReportRequestTask.fromDate) {
    whereParts.push(
      ` TimeRecvd>=toDateTime('${netflowReportRequestTask.fromDate.format(
        DATABASE_DATE_FORMAT,
      )}') `,
    );
  }
  if (netflowReportRequestTask.toDate) {
    whereParts.push(
      ` TimeRecvd<=toDateTime('${netflowReportRequestTask.toDate.format(
        DATABASE_DATE_FORMAT,
      )}') `,
    );
  }
  if (netflowReportRequestTask.username) {
    whereParts.push(` username='${netflowReportRequestTask.username}' `);
  }
  if (
    netflowReportRequestTask.dstPort &&
    netflowReportRequestTask.dstPort.length > 0
  ) {
    const dstPortQueries: string[] = [];
    for (const dstPort of netflowReportRequestTask.dstPort) {
      dstPortQueries.push(` DstPort='${dstPort}' `);
    }
    whereParts.push(` (${dstPortQueries.join(' OR ')}) `);
  }
  if (
    netflowReportRequestTask.srcPort &&
    netflowReportRequestTask.srcPort.length > 0
  ) {
    const srcPortQueries: string[] = [];
    for (const srcPort of netflowReportRequestTask.srcPort) {
      srcPortQueries.push(` SrcPort='${srcPort}' `);
    }
    whereParts.push(` (${srcPortQueries.join(' OR ')}) `);
  }
  if (netflowReportRequestTask.businessId) {
    whereParts.push(` businessId='${netflowReportRequestTask.businessId}' `);
  }
  if (
    netflowReportRequestTask.departments &&
    netflowReportRequestTask.departments.length > 0
  ) {
    const departmentQueries: string[] = [];
    for (const departmentId of netflowReportRequestTask.departments) {
      departmentQueries.push(` departmentId='${departmentId}' `);
    }
    whereParts.push(` (${departmentQueries.join(' OR ')}) `);
  }
  if (netflowReportRequestTask.srcAddress) {
    whereParts.push(
      ` ( SrcIP='${netflowReportRequestTask.srcAddress}' OR NextHop='${
        netflowReportRequestTask.srcAddress
      }' ) `,
    );
  }
  if (netflowReportRequestTask.dstAddress) {
    whereParts.push(
      ` ( DstIP='${netflowReportRequestTask.dstAddress}' OR NextHop='${
        netflowReportRequestTask.dstAddress
      }' ) `,
    );
  }
  if (whereParts.length > 0) {
    mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
  }
  if (count === false) {
    mainQuery = `${mainQuery} LIMIT ${netflowReportRequestTask.limit}  OFFSET ${
      netflowReportRequestTask.skip
    } `;
  }
  log.debug(netflowReportRequestTask);
  return mainQuery;
};

interface NetflowReportResult {
  Router: string;
  Username: string;
  Mac: string;
  Jalali_Date: any;
  Src_Addr: string;
  Src_Port: string;
  Dst_Addr: string;
  Dst_Port: string;
  Protocol: string;
  Gregorian_Date: string;
}

const queryNetflow = async (
  netflowReportRequestTask: NetflowReportRequestTask,
) => {
  const mainQuery = await createNetflowQuery(netflowReportRequestTask, false);
  const countQuery = await createNetflowQuery(netflowReportRequestTask, true);
  log.error({ countQuery });
  const countResult = await executeClickQuery(countQuery);
  const { rows, columns } = await executeClickQuery(mainQuery);
  const data = rows.map((row: any[]) => {
    return rowValueToJson(columns, row);
  });
  log.debug(countResult);
  return {
    data,
    size: countResult.rows[0][0],
  };
};

const formatJson = (data: any[]) => {
  return data.map((row) => {
    if (row.timeRecvd) {
      row.jalaliDate = toJalaliDate(row.timeRecvd);
      row.gregorianDate = toGregorianDate(row.timeRecvd);
    }
    if (row.proto) {
      row.protocol = toProtocolString(row.proto);
    }
    return row;
  });
};

const rowValueToJson = (
  columns: Array<{ name: 'string'; type: 'string' }>,
  row: any[],
) => {
  let i = 0;
  const jsonRow: any = {};
  for (const value of row) {
    jsonRow[columns[i].name] = value;
    i++;
  }
  return jsonRow;
};

const toJalaliDate = (date: string) => {
  return momentJ(moment.tz(date, '').tz(LOCAL_TIME_ZONE)).format(
    REPORT_PERSIAN_DATE_FORMAT,
  );
};

const toGregorianDate = (date: string) => {
  return moment
    .tz(date, '')
    .tz(LOCAL_TIME_ZONE)
    .format(REPORT_GREGORIAN_DATE_FORMAT);
};

const toProtocolString = (protocol: number) => {
  let protocolString = '';
  if (protocol === 6) {
    protocolString = PROTOCOLS.TCP;
  }
  if (protocol === 17) {
    protocolString = PROTOCOLS.UPD;
  }
  return protocolString;
};

export default {
  queryNetflow,
  formatJson,
};
