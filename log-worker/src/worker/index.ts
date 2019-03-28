import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import netflow from './netflow';
import { createHttpClient } from '../utils/httpClient';
import { Parser as Json2CsvParser } from 'json2csv';
import fs from 'fs';
import _ from 'lodash';
import request from 'request-promise';
import { login } from '../utils/auth';
import { file as tmpFile } from 'tmp-promise';
import util from 'util';
import syslog from './syslog';
import {
  GeneralReportRequestTask,
  NetflowReportRequestTask,
  QUEUES,
  REPORT_TYPE,
  SyslogReportRequestTask,
} from '../typings';

// Convert fs.readFile into Promise version of same

const log = logger.createLogger();
const UPLOAD_API = `${process.env.API_ADDRESS}/api/file/upload`;
const REPORT_API = `${process.env.API_ADDRESS}/api/Reports`;

if (
  !process.env.SERVICE_MAN_USERNAME ||
  !process.env.SERVICE_MAN_PASSWORD ||
  !process.env.API_ADDRESS
) {
  throw new Error('invalid auth env variables');
}

export const processLogRequest = async () => {
  log.debug('At processing log requests');
  const channel = await getRabbitMqChannel();
  channel.prefetch(2, true);
  process.once('SIGINT', async () => {
    await channel.close();
  });
  channel.consume(
    QUEUES.LOG_WORKER_QUEUE,
    async (message) => {
      if (!message) {
        log.debug('empty message:', message);
        throw new Error('empty message');
      }

      const body = message.content.toString();
      log.debug(" [x] Received Log Request '%s'", body);
      const generalReportRequestTask: GeneralReportRequestTask = JSON.parse(
        body,
      );

      if (!generalReportRequestTask.toDate) {
        generalReportRequestTask.toDate = Date.now();
      }
      // create fromDate 1 year before from Date
      if (!generalReportRequestTask.fromDate) {
        generalReportRequestTask.fromDate =
          generalReportRequestTask.toDate - 31539999 * 1000;
      }

      try {
        let reports: any;
        let fields: string[];
        if (generalReportRequestTask.reportType === REPORT_TYPE.NETFLOW) {
          reports = await netflow.getNetflowReports(
            generalReportRequestTask as NetflowReportRequestTask,
          );
          fields = getNetflowFields();
        } else if (generalReportRequestTask.reportType === REPORT_TYPE.SYSLOG) {
          reports = await syslog.getSyslogReports(
            generalReportRequestTask as SyslogReportRequestTask,
          );
          fields = getSyslogFields();
        } else {
          throw new Error('invalid report type');
        }

        log.debug('#######################');
        log.debug(reports);
        const csvReport = jsonToCsv(fields, reports);
        log.debug(csvReport);
        await uploadReport(
          generalReportRequestTask.reportRequestId,
          generalReportRequestTask.businessId,
          csvReport,
        );
        channel.ack(message);
      } catch (error) {
        log.error(error);
        //todo remove me after test
        channel.ack(message);
        //channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
};

const getNetflowFields = () => {
  return [
    'Router',
    'Username',
    'Jalali_Date',
    'Mac',
    'Src_Addr',
    'Src_Port',
    'Dst_Addr',
    'Dst_Port',
    'Protocol',
    'Gregorian_Date',
  ];
};

const getSyslogFields = () => {
  return [
    'Router',
    'Username',
    'IP',
    'Mac',
    'Jalali_Date',
    'Http_Method',
    'Domain',
    'Url',
    'Gregorian_Date',
  ];
};
const jsonToCsv = (fields: string[], jsonData: any[]) => {
  try {
    const opts = { fields, defaultValue: 'N/A' };
    const json2CsvParser = new Json2CsvParser(opts);
    const csvReport = json2CsvParser.parse(jsonData);
    return csvReport;
  } catch (error) {
    log.error(error);
    throw error;
  }
};

const writeFile = util.promisify(fs.writeFile);
const closeFile = util.promisify(fs.close);
const unlink = util.promisify(fs.unlink);
const uploadReport = async (
  reportId: string,
  businessId: string,
  csv: string,
) => {
  const reportFile = await tmpFile();
  await writeFile(reportFile.path, csv, 'utf8');
  await closeFile(reportFile.fd);
  log.debug(reportFile.path);
  log.debug(reportFile.path);
  const token = await login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME,
    process.env.SERVICE_MAN_PASSWORD,
  );
  const options = {
    method: 'POST',
    url: UPLOAD_API,
    headers: {
      authorization: token,
      Accept: 'application/json',
      'cache-control': 'no-cache',
      'content-type':
        'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    },
    formData: {
      businessId,
      myfile: {
        value: fs.createReadStream(reportFile.path),
        options: { filename: 'report.csv', contentType: 'text/csv' },
      },
    },
  };
  const response: string = await request(options);
  await unlink(reportFile.path);
  const data: { fileId: string } = JSON.parse(response);
  await updateReportRequest(reportId, data.fileId);
};

const updateReportRequest = async (reportId: string, fileStorageId: string) => {
  const token = await login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME,
    process.env.SERVICE_MAN_PASSWORD,
  );
  log.debug('report:', reportId);
  log.debug('file:', fileStorageId);
  const httpClient = createHttpClient(`${REPORT_API}`);
  await httpClient.patch(
    `/${reportId}`,
    {
      status: 'ready',
      fileStorageId,
    },
    {
      headers: {
        authorization: token,
      },
    },
  );
};
