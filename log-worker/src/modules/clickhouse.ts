// @ts-ignore
import ClickHouse from '@apla/clickhouse';
import { createLogger } from '../utils/logger';
const log = createLogger();
const clickHouse: any = new ClickHouse({
  host: 'clickhouse',
  port: 8123,
  user: 'admin',
  password: '123',
});

const init = async () => {
  log.debug('init');
};

const insert = async () => {};

const query = async () => {
  // promise interface (requires 'util.promisify' for node < 8, Promise shim for node < 4)
  //const result = await clickHouse.querying("CREATE DATABASE clickhouse_test");
  // it is better to use stream interface to fetch select results
  const stream: any = clickHouse.query('SELECT * from logs.netflow');

  // or collect records yourself
  const rows: any = [];

  stream.on('metadata', (columns: any) => {
    log.debug(`row meta:`);
    log.debug(columns);
  });

  stream.on('data', (row: any) => {
    rows.push(row);
    log.debug(`row added: ${row}`);
  });

  stream.on('error', (error: any) => {
    throw error;
  });

  stream.on('end', () => {
    // all rows are collected, let's verify count
    // assert (rows.length === stream.supplemental.rows);
    // how many rows in result are set without windowing:
    log.debug(
      'rows in result set',
      stream.supplemental.rows_before_limit_at_least,
    );
    log.debug(rows);
  });
};

export default {
  init,
};
