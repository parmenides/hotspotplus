"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rabbitmq_1 = require("./utils/rabbitmq");
const typings_1 = require("./typings");
exports.testRunner = async () => {
    const channel = await rabbitmq_1.getRabbitMqChannel();
    const LOG_WORKER_QUEUE = typings_1.QUEUES.LOG_WORKER_QUEUE;
    const from = new Date('2019-03-25T00:00:00').getTime();
    const to = new Date('2019-03-28T23:59:59').getTime();
    /*const message: SyslogReportRequestTask = {
      reportRequestId: '123123123123',
      businessId: '3724627346278346',
      reportType: REPORT_TYPE.SYSLOG,
    };
    console.log('add test task', message);
    await channel.sendToQueue(
      LOG_WORKER_QUEUE,
      Buffer.from(JSON.stringify(message)),
    );
    await channel.close();*/
    //const res = await countAndUpdateBusinessReports();
    // await channel.close();;;
    //await addEnrichmentTasks(from, to, 'syslog' as REPORT_TYPE.SYSLOG);
    //await addEnrichmentTasks(from, to, 'netflow' as REPORT_TYPE.NETFLOW);
};
//# sourceMappingURL=test.js.map