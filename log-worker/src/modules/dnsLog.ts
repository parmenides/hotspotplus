import logger from '../utils/logger';
import moment from 'moment';
import momentJ from 'moment-jalaali';
import momentTz from 'moment-timezone';

const clickHouse: any = createClickConnection();

import {
  LOCAL_TIME_ZONE,
  DATABASE_DATE_FORMAT,
  DnsReportRequestTask,
  REPORT_PERSIAN_DATE_FORMAT,
  REPORT_GREGORIAN_DATE_FORMAT,
} from '../typings';
import _ from 'lodash';
import { createClickConnection, executeClickQuery } from '../utils/clickClient';
const log = logger.createLogger();

interface DnsReportResult {
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

const queryDnsLog = async (
  dnsReportRequestTask: DnsReportRequestTask,
): Promise<DnsReportResult[]> => {
  log.debug('### queryDns ###');
  log.debug({ dnsReportRequestTask });
  const query = await createDnsQuery(dnsReportRequestTask);
  log.debug({ query });
  const { rows } = await executeClickQuery(clickHouse, query);
  const dnsRows = rows.map((row: any[]) => {
    return new ClickDnsLogRow(row);
  });
  return formatDnsReports(dnsRows);
};

const createDnsQuery = (
  dnsReportRequestTask: DnsReportRequestTask,
) => {
  let mainQuery: string = `  
  SELECT * FROM logs.Session JOIN logs.Dns  ON Session.nasIp=Dns.nasIp 
  AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Dns.receivedAt, INTERVAL 5 minute ) 
  `;

  const whereParts: string[] = [
      ' Session.framedIpAddress=Dns.memberIp '
  ];

  if (dnsReportRequestTask.fromDate) {
    whereParts.push(
      ` receivedAt>=toDateTime('${dnsReportRequestTask.fromDate.format(
        DATABASE_DATE_FORMAT,
      )}') `,
    );
  }

  if (dnsReportRequestTask.toDate) {
    whereParts.push(
      ` receivedAt<=toDateTime('${dnsReportRequestTask.toDate.format(
        DATABASE_DATE_FORMAT,
      )}') `,
    );
  }

  if (dnsReportRequestTask.username) {
    whereParts.push(` username='${dnsReportRequestTask.username}' `);
  }

  if (dnsReportRequestTask.domain) {
    whereParts.push(` domain='${dnsReportRequestTask.domain}' `);
  }

  if (dnsReportRequestTask.businessId) {
    whereParts.push(` businessId='${dnsReportRequestTask.businessId}' `);
  }
  if (dnsReportRequestTask.nas && dnsReportRequestTask.nas.length > 0) {
    const nasIdQueries: string[] = [];
    for (const nas of dnsReportRequestTask.nas) {
      nasIdQueries.push(` nasId='${nas.id}' `);
    }
    whereParts.push(` (${nasIdQueries.join(' OR ')}) `);
  }

  if (whereParts.length > 0) {
    mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
  }
  return mainQuery;
};

const formatDnsReports = (rows: ClickDnsLogRow[]) => {
  const formatted = rows.map((clickRow) => {
    return {
      Router: clickRow.nasTitle,
      Username: clickRow.username,
      IP: clickRow.memberIp,
      Mac: clickRow.mac || '',
      Jalali_Date: clickRow.getJalaliDate(),
      Http_Method: '',
      Domain: clickRow.domain,
      Url: '',
      Gregorian_Date: clickRow.getGregorianDate(),
    };
  });
  return _.sortBy(formatted, ['Router', 'Username', 'Jalali_Date', 'Domain']);
};

export class ClickDnsLogRow {
  public memberIp: string;
  public nasIp: string;
  public domain: string;
  public receivedAt: string;

  public businessId: string;
  public memberId: string;
  public nasId: string;
  public nasTitle: string;
  public nasIp: string;
  public username: string;
  public framedIpAddress: string;
  public mac: string;
  public creationDate: string;

  constructor(row: any[]) {
    this.memberIp = row[0] && row[0].toString();
    this.nasIp = row[1] && row[1].toString();
    this.domain = row[5] && row[5].toString();
    this.receivedAt = row[6] && row[6].toString();
    this.businessId = row[7] && row[7].toString();
    this.memberId = row[8] && row[8].toString();
    this.nasId = row[9] && row[9].toString();
    this.nasTitle = row[10] && row[10].toString();
    this.nasIp = row[11] && row[11].toString();
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
    queryDnsLog,
};
