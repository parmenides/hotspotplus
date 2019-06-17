'use strict';

const rabbitMq = require('../../server/modules/rabbitmq');
const config = require('../../server/modules/config');
var logger = require('../../server/modules/logger');
var app = require('../../server/server');
var utility = require('../../server/modules/utility');
var temp = require('temp').track();
var fs = require('fs');
var Q = require('q');
var redis = require('redis');

module.exports = function(Report) {
  var log = logger.createLogger();
  Report.observe('after save', function(ctx, next) {
    if (ctx.isNewInstance) {
      rabbitMq.getRabbitMqChannel((error, channel) => {
        if (error) {
          log.error('send report request to q failed');
          log.error(error);
          throw error;
        }
        var message = ctx.instance;

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
