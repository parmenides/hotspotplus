// @ts-ignore
import ClickHouse from '@apla/clickhouse';
import { createLogger } from '../utils/logger';
import {
  ClickHouseColumnMeta,
  ClickHouseQueryResult,
  LOCAL_TIME_ZONE,
  NetflowReportRequestTask,
  PROTOCOLS,
  REPORT_TYPE,
} from '../typings';
import moment from 'moment';
import momentJ from 'moment-jalaali';
import momentTz from 'moment-timezone';
const reportDateFormat = 'YYYY-MM-DD HH:mm:ss';
const log = createLogger();

if (!process.env.CLICK_NETFLOW_REPORT_DB) {
  throw new Error('CLICK_NETFLOW_REPORT_DB is empty');
}

if (!process.env.CLICK_HOST) {
  throw new Error('CLICK_HOST is empty');
}

if (!process.env.CLICK_USER) {
  throw new Error('CLICK_USER is empty');
}
if (!process.env.CLICK_PASSWORD) {
  throw new Error('CLICK_PASSWORD is empty');
}

const clickHouse: any = new ClickHouse({
  host: process.env.CLICK_HOST,
  port: process.env.CLICK_PORT || 8123,
  user: process.env.CLICK_USER,
  password: process.env.CLICK_PASSWORD,
});

const createNetflowQuery = (
  netflowReportRequestTask: NetflowReportRequestTask,
) => {
  let mainQuery: string = ` SELECT * from ${
    process.env.CLICK_NETFLOW_REPORT_DB
  } `;
  const whereParts: string[] = [];

  if (netflowReportRequestTask.fromDate) {
    whereParts.push(
      ` TimeRecvd>='${netflowReportRequestTask.fromDate.format(
        reportDateFormat,
      )}' `,
    );
  }
  if (netflowReportRequestTask.toDate) {
    whereParts.push(
      ` TimeRecvd<='${netflowReportRequestTask.toDate.format(
        reportDateFormat,
      )}' `,
    );
  }
  if (netflowReportRequestTask.username) {
    whereParts.push(` username='${netflowReportRequestTask.username}' `);
  }
  if (netflowReportRequestTask.dstPort) {
    whereParts.push(` dstPort='${netflowReportRequestTask.dstPort}' `);
  }
  if (netflowReportRequestTask.srcPort) {
    whereParts.push(` srcPort='${netflowReportRequestTask.srcPort}' `);
  }
  if (netflowReportRequestTask.businessId) {
    whereParts.push(` businessId='${netflowReportRequestTask.businessId}' `);
  }
  if (
    netflowReportRequestTask.nasId &&
    netflowReportRequestTask.nasId.length > 0
  ) {
    const nasIdQueries: string[] = [];
    for (const nasId of netflowReportRequestTask.nasId) {
      nasIdQueries.push(` nasId='${nasId}' `);
    }
    whereParts.push(` (${nasIdQueries.join(' OR ')}) `);
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
  if (netflowReportRequestTask.protocol) {
    if (netflowReportRequestTask.protocol === PROTOCOLS.TCP) {
      whereParts.push(` Proto=6 `);
    } else if (netflowReportRequestTask.protocol === PROTOCOLS.UPD) {
      whereParts.push(` Proto=17 `);
    }
  }

  if (whereParts.length > 0) {
    mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;
  }
  return mainQuery;
};

const queryNetflow = async (
  netflowReportRequestTask: NetflowReportRequestTask,
): Promise<ClickHouseQueryResult> => {
  return new Promise((resolve, reject) => {
    const mainQuery = createNetflowQuery(netflowReportRequestTask);
    log.debug(mainQuery);
    const stream: any = clickHouse.query(mainQuery);

    let columns: ClickHouseColumnMeta[] = [];
    stream.on('metadata', (columnsInfo: ClickHouseColumnMeta[]) => {
      log.debug(`row meta:`, columnsInfo);
      columns = columnsInfo;
    });

    const rows: ClickNetflowRow[] = [];
    stream.on('data', (row: any) => {
      rows.push(new ClickNetflowRow(row));
    });

    stream.on('error', (error: any) => {
      reject(error);
    });

    stream.on('end', () => {
      resolve({ rows, columns });
    });
  });
};

export class ClickNetflowRow {
  public RouterAddr: string;
  public SrcIP: string;
  public DstIP: string;
  public SrcPort: string;
  public DstPort: string;
  public NextHop: string;
  public TimeRecvd: string;
  public businessId: string;
  public memberId: string;
  public nasId: string;
  public nasTitle: string;
  public nasIp: string;
  public username: string;
  public framedIpAddress: string;
  public mac: string;
  public creationDate: string;
  public Proto: number;
  constructor(row: any[]) {
    this.RouterAddr = row[0] && row[0].toString();
    this.SrcIP = row[1] && row[1].toString();
    this.DstIP = row[2] && row[2].toString();
    this.SrcPort = row[3] && row[3].toString();
    this.DstPort = row[4] && row[4].toString();
    this.NextHop = row[5] && row[5].toString();
    this.TimeRecvd = row[6] && row[6].toString();
    this.businessId = row[7] && row[7].toString();
    this.memberId = row[8] && row[8].toString();
    this.nasId = row[9] && row[9].toString();
    this.nasTitle = row[10] && row[10].toString();
    this.nasIp = row[11] && row[11].toString();
    this.username = row[12] && row[12].toString();
    this.framedIpAddress = row[13] && row[13].toString();
    this.mac = row[14] && row[14].toString();
    this.creationDate = row[15] && row[15].toString();
    this.Proto = row[16] && (row[16] as number);
  }

  public getJalaliDate() {
    return momentJ(momentTz.tz(this.TimeRecvd, LOCAL_TIME_ZONE)).format(
      'jYYYY/jM/jD HH:MM',
    );
  }
  public getGregorianDate() {
    return momentTz
      .tz(this.TimeRecvd, LOCAL_TIME_ZONE)
      .format('YYYY/MM/DD HH:mm');
  }

  public getProtocolString() {
    let protocolString = '';
    if (this.Proto === 6) {
      protocolString = PROTOCOLS.TCP;
    }
    if (this.Proto === 17) {
      protocolString = PROTOCOLS.UPD;
    }
    return protocolString;
  }
}

export default {
  queryNetflow,
};
