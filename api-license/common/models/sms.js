'use strict';
var app = require('../../server/server');
var logger = require('../../server/modules/logger');
var log = logger.createLogger();
var aggregates = require('../../server/modules/aggregates');
var smsModule = require('../../server/modules/sms');
var Promise = require('bluebird');
var SMS_API_KEY = process.env.SMS_API_KEY;
var needle = require('needle');
var config = require('../../server/modules/config');

module.exports = function(Sms) {
  Sms.sendGroupMessage = function(receptor, message, ctx) {
    var licenseId = ctx.currentUserId;
    var License = app.models.License;
    return License.findById(licenseId)
      .then(function(license) {
        return Sms.getLicenseBalance(license.systemUuid);
      })
      .then(function(balance) {
        var optimisticCostPrediction = receptor.length * 13;
        if (balance.remaincredit > optimisticCostPrediction) {
          return smsModule.sendGroupMessageToKavehnegar(
            SMS_API_KEY,
            receptor,
            message,
          );
        } else {
          throw new Error(403, 'Lowe credit');
        }
      })
      .then(function(cost) {
        return License.addLicenseLocalCharge(cost, licenseId);
      })
      .catch(function(error) {
        log.error(error);
        throw error;
      });
  };

  Sms.remoteMethod('sendGroupMessage', {
    returns: { root: true },
    accepts: [
      {
        arg: 'receptor',
        type: 'array',
        required: true,
      },
      {
        arg: 'message',
        type: 'string',
        required: true,
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' },
    ],
  });

  Sms.sendMessages = function(
    receptor,
    token,
    token2,
    token3,
    token10,
    template,
    ctx,
  ) {
    var currentLicenseId = ctx.currentUserId;
    log.debug(ctx);
    var License = app.models.License;
    return License.findById(currentLicenseId)
      .then(function(license) {
        return Sms.getLicenseBalance(license.systemUuid);
      })
      .then(function(balance) {
        if (balance.remaincredit > 500) {
          log.debug('Remain Credit: ', balance.remaincredit);
          return smsModule.sendMessageToKavehnegar(
            SMS_API_KEY,
            receptor,
            token,
            token2,
            token3,
            token10,
            template,
          );
        } else {
          throw new Error(403, 'Low credit');
        }
      })
      .then(function(cost) {
        return License.addLicenseLocalCharge(cost, currentLicenseId);
      })
      .catch(function(error) {
        log.error(error);
        throw error;
      });
  };

  Sms.remoteMethod('sendMessages', {
    returns: { root: true },
    accepts: [
      {
        arg: 'receptor',
        type: 'string',
        required: true,
      },
      {
        arg: 'token',
        type: 'string',
      },
      {
        arg: 'token2',
        type: 'string',
      },
      {
        arg: 'token3',
        type: 'string',
      },
      {
        arg: 'token10',
        type: 'string',
      },
      {
        arg: 'template',
        type: 'string',
        required: true,
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' },
    ],
  });

  Sms.getLicenseBalance = function(systemUuid) {
    var License = app.models.License;
    return License.findOne({
      where: {
        systemUuid: systemUuid,
      },
    })
      .then(function(license) {
        if (!license) {
          log.error('lc not found:', systemUuid);
          throw new Error('404', 'not found');
        }
        if (!license.modules.sms) {
          return { remaincredit: 0 };
        }

        if (license.modules.sms.smsApiKey) {
          return needle('post', config.KAVEHNEGAR_LOAD_CUSTOMER, {
            apikey: license.modules.sms.smsApiKey,
          }).then(function(response) {
            var body = response.body;
            if (
              response.statusCode !== 200 ||
              (body.entries && !body.entries.apikey)
            ) {
              log.error('Status Code: ', response.statusCode, body);
              throw new Error(body);
            } else {
              if (body.entries.remaincredit) {
                //To Toman
                body.entries.remaincredit = Math.round(
                  body.entries.remaincredit / 10,
                );
              }
              return { balance: body.entries.remaincredit };
            }
          });
        } else {
          return aggregates.getLicenseBalance(license.id);
        }
      })
      .then(function(balanceResult) {
        return { remaincredit: balanceResult.balance };
      })
      .catch(function(error) {
        log.error(error);
        return error;
      });
  };

  Sms.remoteMethod('getLicenseBalance', {
    description: 'load sms credit',
    accepts: [{ arg: 'systemUuid', type: 'string', required: true }],
    returns: { root: true },
  });

  Sms.buySmsCredit = function(systemUuid, localReturnUrl, price) {
    var Invoice = app.models.Invoice;
    var License = app.models.License;
    return License.findOne({
      where: {
        systemUuid: systemUuid,
      },
    })
      .then(function(license) {
        if (!license) {
          throw new Error('license not found');
        }
        log.error(price);
        var serviceInfo = {
          smsCharge: { amount: price },
          localReturnUrl: localReturnUrl,
        };
        var priceInToman = Math.round(price / 10);
        return Invoice.issueInvoice(
          priceInToman,
          license.id,
          config.LOCAL_SMS_CHARGE_INVOICE_TYPE,
          serviceInfo,
        );
      })
      .catch(function(error) {
        log.error(error);
        return error;
      });
  };

  Sms.remoteMethod('buySmsCredit', {
    description: 'buySmsCredit',
    accepts: [
      { arg: 'systemUuid', type: 'string', required: true },
      { arg: 'returnUrl', type: 'string', required: true },
      { arg: 'price', type: 'number', required: true },
    ],
    returns: { root: true },
  });
};
