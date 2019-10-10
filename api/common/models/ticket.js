'use strict';
const app = require('../../server/server');
const Q = require('q');
const config = require('../../server/modules/config.js');
const logger = require('../../server/modules/logger');
const log = logger.createLogger();
const smsModule = require('../../server/modules/sms');

module.exports = function(Ticket) {
  Ticket.replyToTicket = function(ticketId, msg) {
    const Business = app.models.Business;
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
        const messages = ticket.messages || [];
        messages.push(msg);
        log.debug(ticket);
        log.debug(ticket.messages);
        ticket.updateAttributes({messages: messages}, function(
          error,
          result
        ) {
          if (error) {
            log.error(error);
            return reject(error);
          }

          Business.findById(ticket.businessId).then(function(business) {
            const ticketCode = ticket.ticketCode;
            let mobile,
              messageTemplate;
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
    returns: {root: true},
  });
};
