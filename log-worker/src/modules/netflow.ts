import { createLogger } from '../utils/logger';
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
import { executeClickQuery } from '../utils/clickClient';

const log = createLogger();

const createNetflowQuery = (
  netflowReportRequestTask: NetflowReportRequestTask,
  count: boolean,
) => {
  const {
    skip,
    limit,
    businessId,
    toDate,
    fromDate,
    departments,
    srcPort,
    dstAddress,
    dstPort,
    srcAddress,
    username,
  } = netflowReportRequestTask;
  let mainQuery: string;

  if (count) {
    mainQuery = ` SELECT toInt32(count(*)) as size FROM hotspotplus.NetflowReport `;
  } else {
    mainQuery = ` SELECT businessId,departmentId,memberId,nasIp,username,RouterAddr as routerAddr,SrcIP as srcIp,
  DstIP as dstIp, SrcPort as srcPort, DstPort as dstPort,TimeRecvd as timeRecvd,Proto as proto FROM hotspotplus.NetflowReport `;
  }

  const whereParts: string[] = [];
  if (fromDate) {
    whereParts.push(
      ` timeRecvd>=toDateTime('${fromDate.format(DATABASE_DATE_FORMAT)}') `,
    );
  }
  if (toDate) {
    whereParts.push(
      ` timeRecvd<=toDateTime('${toDate.format(DATABASE_DATE_FORMAT)}') `,
    );
  }

  if (username) {
    whereParts.push(` username='${username}' `);
  }

  if (dstPort) {
    whereParts.push(` dstPort='${dstPort}' `);
  }

  if (srcPort) {
    whereParts.push(` srcPort='${srcPort}' `);
  }

  if (businessId) {
    whereParts.push(` businessId='${businessId}' `);
  }
  if (departments && departments.length > 0) {
    const departmentQueries: string[] = [];
    for (const departmentId of departments) {
      departmentQueries.push(` departmentId='${departmentId}' `);
    }
    whereParts.push(` (${departmentQueries.join(' OR ')}) `);
  }
  if (srcAddress) {
    whereParts.push(` ( srcIP='${srcAddress}' OR nextHop='${srcAddress}' ) `);
  }
  if (dstAddress) {
    whereParts.push(` ( dstIP='${dstAddress}' OR nextHop='${dstAddress}' ) `);
  }
  if (whereParts.length > 0) {
    mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
  }
  if (!count && limit >= 0 && skip >= 0) {
    mainQuery = `${mainQuery} LIMIT ${limit}  OFFSET ${skip} `;
  }
  log.debug(netflowReportRequestTask);
  return mainQuery;
};

const query = async (
  type: string,
  netflowReportRequestTask: NetflowReportRequestTask,
) => {
  const mainQuery = await createNetflowQuery(netflowReportRequestTask, false);
  const countQuery = await createNetflowQuery(netflowReportRequestTask, true);
  log.debug({ countQuery });
  const countResult = await executeClickQuery(countQuery);
  const { rows, columns } = await executeClickQuery(mainQuery);
  let data;
  if (type === 'json') {
    data = rows.map((row: any[]) => {
      return rowValueToJson(columns, row);
    });
  }
  return {
    data,
    columns,
    size: countResult.rows && countResult.rows[0] && countResult.rows[0][0],
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
  query,
  formatJson,
};
