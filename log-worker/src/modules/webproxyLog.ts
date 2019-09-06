import logger from '../utils/logger';
import moment from 'moment';
import momentJ from 'moment-jalaali';

const clickHouse: any = createClickConnection();

import {
  LOCAL_TIME_ZONE,
  DATABASE_DATE_FORMAT,
  WebproxyReportRequestTask,
  REPORT_PERSIAN_DATE_FORMAT,
  REPORT_GREGORIAN_DATE_FORMAT,
} from '../typings';
import _ from 'lodash';
import { executeClickQuery,createClickConnection} from '../utils/clickClient';
const log = logger.createLogger();

interface WebproxyReportResult {
  Router: string;
  Username: string;
  IP: string;
  Mac: string;
  Jalali_Date: any;
  Http_Method: string;
  Domain: string;
  Url: string;
  Gregorian_Date: string;
}

const queryWebproxyLog = async (
  webproxyReportRequestTask: WebproxyReportRequestTask,
): Promise<WebproxyReportResult[]> => {
  log.debug('### queryWebproxy ###');
  log.debug({ webproxyReportRequestTask });
  const query = await createWebproxyQuery(webproxyReportRequestTask);
  log.debug({ query });
  const {rows}  = await executeClickQuery(clickHouse, query);
  const webproxyRows = rows.map((row: any[]) => {
    return new ClickWebproxyLogRow(row);
  });
  return formatWebproxyReports(webproxyRows);
};

const createWebproxyQuery = (
  webproxyReportRequestTask: WebproxyReportRequestTask,
) => {
  let mainQuery: string = `  
  SELECT * FROM logs.Session JOIN logs.WebProxy  ON Session.nasIp=WebProxy.nasIp 
  AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(WebProxy.receivedAt, INTERVAL 5 minute ) 
  `;

  const whereParts: string[] = [
      ' Session.framedIpAddress=WebProxy.memberIp '
  ];

  if (webproxyReportRequestTask.fromDate) {
    whereParts.push(
      ` receivedAt>=toDateTime('${webproxyReportRequestTask.fromDate.format(
        DATABASE_DATE_FORMAT,
      )}') `,
    );
  }

  if (webproxyReportRequestTask.toDate) {
    whereParts.push(
      ` receivedAt<=toDateTime('${webproxyReportRequestTask.toDate.format(
        DATABASE_DATE_FORMAT,
      )}') `,
    );
  }

  if (webproxyReportRequestTask.username) {
    whereParts.push(` username='${webproxyReportRequestTask.username}' `);
  }

  if (webproxyReportRequestTask.domain) {
    whereParts.push(` domain='${webproxyReportRequestTask.domain}' `);
  }

  if (webproxyReportRequestTask.url) {
    whereParts.push(` url='${webproxyReportRequestTask.url}' `);
  }

  if (
    webproxyReportRequestTask.method &&
    webproxyReportRequestTask.method.length > 0
  ) {
    const methodQueries: string[] = [];
    for (const method of webproxyReportRequestTask.method) {
      methodQueries.push(` method='${method}' `);
    }
    whereParts.push(` (${methodQueries.join(' OR ')}) `);
  }

  if (webproxyReportRequestTask.businessId) {
    whereParts.push(` businessId='${webproxyReportRequestTask.businessId}' `);
  }
  if (webproxyReportRequestTask.nas && webproxyReportRequestTask.nas.length > 0) {
    const nasIdQueries: string[] = [];
    for (const nas of webproxyReportRequestTask.nas) {
      nasIdQueries.push(` nasId='${nas.id}' `);
    }
    whereParts.push(` (${nasIdQueries.join(' OR ')}) `);
  }

  if (whereParts.length > 0) {
    mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
  }
  return mainQuery;
};

const formatWebproxyReports = (rows: ClickWebproxyLogRow[]) => {
  const formatted = rows.map((clickRow) => {
    return {
      Router: clickRow.nasTitle,
      Username: clickRow.username,
      IP: clickRow.memberIp,
      Mac: clickRow.mac,
      Jalali_Date: clickRow.getJalaliDate(),
      Http_Method: clickRow.method,
      Domain: clickRow.domain,
      Url: clickRow.url,
      Gregorian_Date: clickRow.getGregorianDate(),
    };
  });
  return _.sortBy(formatted, ['Router', 'Username', 'Jalali_Date', 'Domain']);
};

export class ClickWebproxyLogRow {
  public memberIp: string;
  public nasIp: string;
  public protocol: string;
  public url: string;
  public method: string;
  public domain: string;
  public receivedAt: string;

  public businessId: string;
  public memberId: string;
  public nasId: string;
  public nasTitle: string;
  public username: string;
  public framedIpAddress: string;
  public mac: string;
  public creationDate: string;

  constructor(row: any[]) {
    this.memberIp = row[0] && row[0].toString();
    this.nasIp = row[1] && row[1].toString();
    this.protocol = row[2] && row[2].toString();
    this.url = row[3] && row[3].toString();
    this.method = row[4] && row[4].toString();
    this.domain = row[5] && row[5].toString();
    this.receivedAt = row[6] && row[6].toString();
    this.businessId = row[7] && row[7].toString();
    this.memberId = row[8] && row[8].toString();
    this.nasId = row[9] && row[9].toString();
    this.nasTitle = row[10] && row[10].toString();
    //this.nasIp = row[11] && row[11].toString();
    this.username = row[12] && row[12].toString();
    this.framedIpAddress = row[13] && row[13].toString();
    this.mac = row[14] && row[14].toString();
    this.creationDate = row[15] && row[15].toString();
  }

  public getJalaliDate() {
    return momentJ(moment.tz(this.receivedAt, '').tz(LOCAL_TIME_ZONE)).format(
      REPORT_PERSIAN_DATE_FORMAT,
    );
  }

  public getGregorianDate() {
    return moment
      .tz(this.receivedAt, '')
      .tz(LOCAL_TIME_ZONE)
      .format(REPORT_GREGORIAN_DATE_FORMAT);
  }
}

export default {
    queryWebproxyLog,
};
