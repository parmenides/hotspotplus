'use strict';
var app = require('../../server/server');
var Q = require('q');
var config = require('../../server/modules/config.js');
var logger = require('hotspotplus-common').logger;
var log = logger.createLogger(process.env.APP_NAME, process.env.LOG_DIR);
var smsModule = require('../../server/modules/sms');

module.exports = function(Ticket) {
  Ticket.replyToTicket = function(ticketId, msg) {
    var Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      Ticket.findById(ticketId, function(error, ticket) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!ticket) {
          var error = new Error();
          error.message = 'member not found';
          error.status = 404;
          return reject(error);
        }
        var messages = ticket.messages || [];
        messages.push(msg);
        log.debug(ticket);
        log.debug(ticket.messages);
        ticket.updateAttributes({ messages: messages }, function(
          error,
          result,
        ) {
          if (error) {
            log.error(error);
            return reject(error);
          }

          Business.findById(ticket.businessId, function(error, business) {
            var ticketCode = ticket.ticketCode;
            var mobile;
            var messageTemplate;
            if (msg.sendBy == 'customer') {
              messageTemplate = config.NOTIFY_SUPPORT_TEMPLATE;
              mobile = config.SUPPORT_MOBILE;
            } else if (msg.sendBy == 'support') {
              mobile = business.mobile;
              messageTemplate = config.NOTIFY_CUSTOMER_TEMPLATE;
            }
            smsModule.send({
              token1: ticketCode,
              mobile: mobile,
              template: messageTemplate,
            });
          });
          return resolve(result);
        });
      });
    });
  };
  Ticket.remoteMethod('replyToTicket', {
    accepts: [
      {
        arg: 'ticketId',
        type: 'string',
        required: true,
      },
      {
        arg: 'message',
        type: 'object',
        required: true,
      },
    ],
    returns: { root: true },
  });
};
