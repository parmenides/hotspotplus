'use strict';

const rabbitMq = require('../../server/modules/rabbitmq');
const config = require('../../server/modules/config');

module.exports = function(Report) {
  Report.observe('after save', function(ctx, next) {
    if (ctx.isNewInstance) {
      rabbitMq.getRabbitMqChannel((error, channel) => {
        if (error) {
          log.error('send report request to q failed');
          log.error(error);
          throw error;
        }
        var report = ctx.instance;
        var reportId = ctx.instance.id;
        const message = {
          reportType: report.type,
          username: report.username,
          fromDate: report.from,
          toDate: report.to,
          businessId: report.businessId,
          reportRequestId: reportId,
          memberId: report.memberId
        };

        channel.sendToQueue(
          config.LOG_WORKER_QUEUE,
          Buffer.from(JSON.stringify(message))
        );
        channel.close();
        next();
      });
    } else {
      return next();
    }
  });

  Report.remoteMethod('downloadReport', {
    description: 'download report',
    accepts: [
      {
        arg: 'resellerId',
        type: 'string',
        required: true
      }
    ],
    returns: { root: true }
  });
};
