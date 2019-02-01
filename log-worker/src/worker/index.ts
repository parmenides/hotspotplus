import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import netflow from './netflow';
import session from './session';
import { createHttpClient } from '../utils/httpClient';
import { Parser as Json2CsvParser } from 'json2csv';
import fs from 'fs';
import request from 'request';
import { login } from '../utils/auth';

if (!process.env.API_ADDRESS) {
  throw new Error('invalid env config');
}
const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const log = logger.createLogger();
const UPLOAD_API = `${process.env.API_ADDRESS}/api/file/upload`;
if (!LOG_WORKER_QUEUE) {
  throw new Error('invalid settings');
}
if (
  !process.env.SERVICE_MAN_USERNAME ||
  !process.env.SERVICE_MAN_PASSWORD ||
  !process.env.API_ADDRESS
) {
  throw new Error('invalid auth env variables');
}

export interface ReportRequestTask {
  username: string;
  fromDate: number;
  toDate: number;
  memberId?: string;
  businessId?: string;
}

const processLogRequest = async () => {
  log.debug('At processing payment requests');
  const channel = await getRabbitMqChannel();
  process.once('SIGINT', async () => {
    await channel.close();
  });

  channel.consume(
    LOG_WORKER_QUEUE,
    async (message) => {
      if (!message) {
        log.debug('empty message:', message);
        throw new Error('empty message');
      }

      const body = message.content.toString();
      log.debug(" [x] Received '%s'", body);
      const logTask: ReportRequestTask = JSON.parse(body);

      try {
        const sessionData = await session.findSessions(logTask);
        const reports = await netflow.getNetflowReports(
          logTask.username,
          logTask.fromDate,
          logTask.toDate,
          {
            nasIpList: sessionData.nasIpList,
            clientIpList: sessionData.clientIpList,
          },
        );
        const fields = [
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
        const csvReport = jsonToCsv(fields, reports);
        log.debug(csvReport);
        channel.ack(message);
        const token = await login(
          // @ts-ignore
          process.env.SERVICE_MAN_USERNAME,
          process.env.SERVICE_MAN_PASSWORD,
        );
        log.debug(token);
      } catch (error) {
        log.error(error);
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
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

const uploadReport = async (filePath: string) => {
  const options = {
    method: 'POST',
    url: ``,
    headers: {
      'Postman-Token': '1cccb3ff-0b39-4205-9122-acfe60a3e379',
      'cache-control': 'no-cache',
      'content-type':
        'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    },
    formData: {
      myfile: {
        value: fs.createReadStream(filePath),
        options: { filename: 'report.csv', contentType: 'text/csv' },
      },
    },
  };

  const response = await request(options);
  log.debug(response.body);
};
export default {
  processLogRequest,
};
