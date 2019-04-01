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
        var message = ctx.instance;
        message.reportRequestId = ctx.instance.id;

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
