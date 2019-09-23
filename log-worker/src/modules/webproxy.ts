import logger from '../utils/logger';
import moment from 'moment';
import momentJ from 'moment-jalaali';

import {
  LOCAL_TIME_ZONE,
  DATABASE_DATE_FORMAT,
  WebproxyReportRequestTask,
  REPORT_PERSIAN_DATE_FORMAT,
  REPORT_GREGORIAN_DATE_FORMAT,
} from '../typings';
import { executeClickQuery } from '../utils/clickClient';

const log = logger.createLogger();

const query = async (
  type: string,
  webproxyReportRequestTask: WebproxyReportRequestTask,
) => {
  const mainQuery = await createWebproxyQuery(webproxyReportRequestTask, false);
  const countQuery = await createWebproxyQuery(webproxyReportRequestTask, true);
  log.debug({ countQuery });
  const countResult = await executeClickQuery(countQuery);
  const { rows, columns } = await executeClickQuery(mainQuery);
  let data;
  if (type === 'json' && rows) {
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

const formatJson = (data: any[]) => {
  return data.map((row) => {
    if (row.receivedAt) {
      row.jalaliDate = toJalaliDate(row.timeRecvd);
      row.gregorianDate = toGregorianDate(row.timeRecvd);
    }
    return row;
  });
};

const createWebproxyQuery = (
  webproxyReportRequestTask: WebproxyReportRequestTask,
  count: boolean,
) => {
  const {
    departments,
    fromDate,
    toDate,
    businessId,
    limit,
    skip,
    domain,
    url,
    username,
  } = webproxyReportRequestTask;
  let mainQuery: string;

  if (count) {
    mainQuery = `SELECT toInt32(count (*)) FROM hotspotplus.Session JOIN hotspotplus.WebProxy  ON Session.nasIp=WebProxy.nasIp 
  AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(WebProxy.receivedAt, INTERVAL 5 minute )`;
  } else {
    mainQuery = `SELECT businessId,departmentId,memberId,nasIp,username,domain,method,url,nasIp,memberIp, receivedAt FROM hotspotplus.Session JOIN hotspotplus.WebProxy  ON Session.nasIp=WebProxy.nasIp 
  AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(WebProxy.receivedAt, INTERVAL 5 minute )`;
  }
  const whereParts: string[] = [' Session.framedIpAddress=WebProxy.memberIp '];

  if (fromDate) {
    whereParts.push(
      ` receivedAt>=toDateTime('${fromDate.format(DATABASE_DATE_FORMAT)}') `,
    );
  }

  if (toDate) {
    whereParts.push(
      ` receivedAt<=toDateTime('${toDate.format(DATABASE_DATE_FORMAT)}') `,
    );
  }

  if (username) {
    whereParts.push(` username='${username}' `);
  }

  if (domain) {
    whereParts.push(` domain like '%${domain}%' `);
  }

  if (url) {
    whereParts.push(` url like '%${url}%' `);
  }

  if (businessId) {
    whereParts.push(` businessId='${businessId}' `);
  }

  if (departments && departments.length > 0) {
    const departmentsIdQueries: string[] = [];
    for (const department of departments) {
      departmentsIdQueries.push(` nasId='${department}' `);
    }
    whereParts.push(` (${departmentsIdQueries.join(' OR ')}) `);
  }

  if (whereParts.length > 0) {
    mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
  }

  if (!count && limit >= 0 && skip >= 0) {
    mainQuery = `${mainQuery} LIMIT ${limit}  OFFSET ${skip} `;
  }

  return mainQuery;
};

export default {
  query,
  formatJson,
};
