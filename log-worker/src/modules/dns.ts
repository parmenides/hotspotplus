import logger from '../utils/logger';
import moment from 'moment';
import momentJ from 'moment-jalaali';

import {
  LOCAL_TIME_ZONE,
  DATABASE_DATE_FORMAT,
  DnsReportRequestTask,
  REPORT_PERSIAN_DATE_FORMAT,
  REPORT_GREGORIAN_DATE_FORMAT,
} from '../typings';
import { executeClickQuery } from '../utils/clickClient';

const log = logger.createLogger();

const query = async (
  type: string,
  dnsReportRequestTask: DnsReportRequestTask,
) => {
  let mainQuery;
  let countQuery;
  if (dnsReportRequestTask.groupBy) {
    mainQuery = await createGroupByDnsQuery(dnsReportRequestTask);
    countQuery = await createGroupByCountDnsQuery(dnsReportRequestTask);
  } else {
    mainQuery = await createDnsQuery(dnsReportRequestTask, false);
    countQuery = await createDnsQuery(dnsReportRequestTask, true);
  }
  log.debug({ countQuery });
  log.debug({ mainQuery });
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
    if (row.DepartmentId) {
      row.departmentId = row.DepartmentId;
      delete row.DepartmentId;
    }
    if (row.Username) {
      row.username = row.Username;
      delete row.Username;
    }
    if (row.NasIp) {
      row.nasIp = row.NasIp;
      delete row.NasIp;
    }
    if (row.MemberId) {
      row.memberId = row.MemberId;
      delete row.MemberId;
    }

    return row;
  });
};

//group by departmentId,domain and filter by date
// SELECT departmentId,any(memberId) as memberId,any(nasIp) as nasIp,username , domain,count(domain) as visit FROM hotspotplus.DnsReport GROUP BY departmentId,domain
//group by username,domain and filter by date
// SELECT any(departmentId) as departmentId,any(memberId) as memberId,any(nasIp) as nasIp,username,domain,count(domain) as visit FROM hotspotplus.DnsReport GROUP BY username,domain

const createGroupByCountDnsQuery = (
  dnsReportRequestTask: DnsReportRequestTask,
) => {
  const {
    groupBy,
    departments,
    domain,
    fromDate,
    toDate,
    businessId,
    username,
  } = dnsReportRequestTask;
  const whereParts: string[] = [];

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

  if (businessId) {
    whereParts.push(` businessId='${businessId}' `);
  }

  if (departments && departments.length > 0) {
    const departmentsIdQueries: string[] = [];
    for (const department of departments) {
      departmentsIdQueries.push(` departmentId='${department}' `);
    }
    whereParts.push(` (${departmentsIdQueries.join(' OR ')}) `);
  }

  const whereQuery =
    whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')} ` : '';

  let selectQuery;
  if (groupBy === 'domain') {
    selectQuery = `SELECT count(*) FROM hotspotplus.DnsReport ${whereQuery} GROUP BY domain `;
  } else if (groupBy === 'username') {
    selectQuery = `SELECT count(*) FROM hotspotplus.DnsReport ${whereQuery} GROUP BY username,domain `;
  } else if (groupBy === 'department') {
    selectQuery = `SELECT count(*) FROM hotspotplus.DnsReport ${whereQuery} GROUP BY departmentId,domain `;
  }

  return `SELECT count(*) FROM ( ${selectQuery} )`;
};

const createGroupByDnsQuery = (dnsReportRequestTask: DnsReportRequestTask) => {
  const {
    groupBy,
    departments,
    domain,
    fromDate,
    toDate,
    businessId,
    limit,
    skip,
    username,
  } = dnsReportRequestTask;
  const whereParts: string[] = [];

  let selectQuery;
  let groupByQuery;

  if (groupBy === 'domain') {
    selectQuery = `SELECT domain, count(domain) as visit , any(username) as Username ,any(departmentId) as DepartmentId,any(memberId) as MemberId,any(nasIp) as NasIp  FROM hotspotplus.DnsReport`;
    groupByQuery = `group by domain`;
  } else if (groupBy === 'username') {
    selectQuery = `SELECT domain, username, count(domain) as visit,any(departmentId) as DepartmentId,any(memberId) as MemberId,any(nasIp) as NasIp  FROM hotspotplus.DnsReport`;
    groupByQuery = `group by username,domain`;
  } else if (groupBy === 'department') {
    selectQuery = `SELECT domain, departmentId, count(domain) as visit,any(username) as Username,any(memberId) as MemberId,any(nasIp) as NasIp FROM hotspotplus.DnsReport`;
    groupByQuery = `group by departmentId,domain`;
  } else {
    throw new Error(`invalid group by filter ${groupBy}`);
  }

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

  if (businessId) {
    whereParts.push(` businessId='${businessId}' `);
  }

  if (departments && departments.length > 0) {
    const departmentsIdQueries: string[] = [];
    for (const department of departments) {
      departmentsIdQueries.push(` departmentId='${department}' `);
    }
    whereParts.push(` (${departmentsIdQueries.join(' OR ')}) `);
  }

  let mainQuery =
    whereParts.length > 0
      ? `${selectQuery} WHERE ${whereParts.join(' AND ')} ${groupByQuery}`
      : `${selectQuery} ${groupByQuery} `;

  if (limit >= 0 && skip >= 0) {
    mainQuery = `${mainQuery} LIMIT ${limit}  OFFSET ${skip} `;
  }

  return mainQuery;
};

const createDnsQuery = (
  dnsReportRequestTask: DnsReportRequestTask,
  count: boolean,
) => {
  const {
    departments,
    domain,
    fromDate,
    toDate,
    businessId,
    limit,
    skip,
    username,
  } = dnsReportRequestTask;
  let mainQuery: string;

  mainQuery = count
    ? `SELECT toInt32(count (*)) FROM hotspotplus.DnsReport`
    : `SELECT businessId,departmentId, memberId, nasIp, username, domain, receivedAt FROM hotspotplus.DnsReport`;

  const whereParts: string[] = [];

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

  if (businessId) {
    whereParts.push(` businessId='${businessId}' `);
  }
  if (departments && departments.length > 0) {
    const departmentsIdQueries: string[] = [];
    for (const department of departments) {
      departmentsIdQueries.push(` departmentId='${department}' `);
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
