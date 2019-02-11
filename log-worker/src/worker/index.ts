import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import netflow from './netflow';
import session from './session';
import { createHttpClient } from '../utils/httpClient';
import { Parser as Json2CsvParser } from 'json2csv';
import fs from 'fs';
import request from 'request-promise';
import { login } from '../utils/auth';
import { file as tmpFile } from 'tmp-promise';
import util from 'util';
import syslog from './syslog';
import { QUEUES } from '../typings';

// Convert fs.readFile into Promise version of same

if (!process.env.API_ADDRESS) {
  throw new Error('invalid env config');
}
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

export enum ReportType {
  NETFLOW = 'netflow',
  SYSLOG = 'syslog',
}

export interface ReportRequestTask {
  reportType: ReportType;
  username: string;
  fromDate: number;
  toDate: number;
  memberId: string;
  businessId: string;
  reportRequestId: string;
}

const processLogRequest = async () => {
  log.debug('At processing log requests');
  const channel = await getRabbitMqChannel();
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
      log.debug(" [x] Received '%s'", body);
      const reportRequestTask: ReportRequestTask = JSON.parse(body);

      try {
        const sessionData = await session.findSessions(reportRequestTask);
        log.debug(
          `Sessions: nasIps: ${sessionData.nasIpList} memberIps: ${
            sessionData.memberIpList
          }`,
        );
        let reports: any;
        let fields: string[];
        if (reportRequestTask.reportType === ReportType.NETFLOW) {
          reports = await netflow.getNetflowReports(
            reportRequestTask.username,
            reportRequestTask.fromDate,
            reportRequestTask.toDate,
            {
              nasIpList: sessionData.nasIpList,
              memberIpList: sessionData.memberIpList,
            },
          );
          fields = getNetflowFields();
        } else if (reportRequestTask.reportType === ReportType.SYSLOG) {
          reports = await syslog.getSyslogReports(
            reportRequestTask.username,
            reportRequestTask.fromDate,
            reportRequestTask.toDate,
            {
              nasIpList: sessionData.nasIpList,
              memberIpList: sessionData.memberIpList,
            },
          );
          fields = getSyslogFields();
        } else {
          throw new Error('invalid report type');
        }
        log.debug(reports);
        const csvReport = jsonToCsv(fields, reports);
        log.debug(csvReport);
        await uploadReport(
          reportRequestTask.reportRequestId,
          reportRequestTask.businessId,
          csvReport,
        );
        channel.ack(message);
      } catch (error) {
        log.error(error);
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
};

const getNetflowFields = () => {
  return [
    'username',
    'date',
    'src_addr',
    'src_port',
    'src_port_name',
    'src_mac',
    'dst_addr',
    'dst_port',
    'dst_port_name',
    'dst_mac',
    'protocol_name',
    '@timestamp',
  ];
};

const getSyslogFields = () => {
  return ['username', 'date', 'domain', 'method', 'url', '@timestamp'];
};
const jsonToCsv = (fields: string[], jsonData: any) => {
  try {
    const opts = { fields };
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
export default {
  processLogRequest,
};
