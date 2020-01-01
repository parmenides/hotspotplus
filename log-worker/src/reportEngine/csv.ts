import * as fs from 'fs';

import { createLogger } from '../utils/logger';
import util from 'util';
import { CsvReportConfig, ReportConfig } from './reportTypes';

const { AsyncParser } = require('json2csv');

const log = createLogger();

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const closeFile = util.promisify(fs.close);
const unlink = util.promisify(fs.unlink);

const render = async (
  reportConfig: ReportConfig,
  data: any,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const config = reportConfig as CsvReportConfig;
    const transformOpts = { highWaterMark: 8192 };
    const asyncParser = new AsyncParser(
      { fields: config.headers },
      transformOpts,
    );

    let csv = '';
    asyncParser.processor
      .on('data', (chunk: string) => (csv += chunk.toString()))
      .on('end', () => {
        log.debug('csv parser done');
        resolve(csv);
      })
      .on('error', (error: any) => {
        log.error('csv parser error', error);
        reject(error);
      });

    const dataList = data as any[];

    for (const row of dataList) {
      asyncParser.input.push(row);
    }
    log.debug('all rows send to csv parser');
    asyncParser.input.push(null); // Sending `null` to a stream signal that no more data is expected and ends it.
  });
};

export default render;
