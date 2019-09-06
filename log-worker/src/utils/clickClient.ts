import ClickHouse from '@apla/clickhouse';
import { createLogger } from './logger';
import { ClickHouseColumnMeta } from '../typings';

const log = createLogger();

if (!process.env.CLICK_HOST) {
  throw new Error('CLICK_HOST is empty');
}

if (!process.env.CLICK_USER) {
  throw new Error('CLICK_USER is empty');
}
if (!process.env.CLICK_PASSWORD) {
  throw new Error('CLICK_PASSWORD is empty');
}

const createClickConnection = () => {
  return new ClickHouse({
    host: process.env.CLICK_HOST,
    port: process.env.CLICK_PORT || 8123,
    user: process.env.CLICK_USER,
    password: process.env.CLICK_PASSWORD,
  });
};

const executeClickQuery = async (
  mainQuery: string,
  clickClient: ClickHouse,
):Promise<{rows:any,columns:any}> => {
  return new Promise((resolve, reject) => {
    const stream: any = clickClient.query(mainQuery);

    let columns: ClickHouseColumnMeta[] = [];
    stream.on('metadata', (columnsInfo: ClickHouseColumnMeta[]) => {
      log.debug(`row meta:`, columnsInfo);
      columns = columnsInfo;
    });

    const rows: any[] = [];
    stream.on('data', (row: any) => {
      rows.push(row);
    });

    stream.on('error', (error: any) => {
      reject(error);
    });

    stream.on('end', () => {
      resolve({ rows, columns });
    });
  });
};

export { executeClickQuery, createClickConnection };
