import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import netflow from "./netflow";
import session from "./session";

const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const log = logger.createLogger();
const API_BASE = process.env.CORE_API;
if (!LOG_WORKER_QUEUE) {
  throw new Error('invalid settings');
}

interface ReportRequestTask {
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
        const reports = await netflow.getNetflowReports(logTask.fromDate,logTask.toDate,{
            nasIpList:sessionData.nasIpList,
            clientIpList:sessionData.clientIpList
        });

      } catch (error) {
        log.error(error);
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
};

export default {
  processLogRequest,
};
