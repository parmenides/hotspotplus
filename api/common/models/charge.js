var app = require('../../server/server');
var utility = require('../../server/modules/utility');
var Q = require('q');
var config = require('../../server/modules/config.js');
var smsModule = require('../../server/modules/sms');
var logger = require('../../server/modules/logger');
var needle = require('needle');
var aggregate = require('../../server/modules/aggregates');
var elasticURL =
  'http://' + process.env.ELASTIC_IP + ':' + process.env.ELASTIC_PORT;
var ELASTIC_CHARGE_PATH =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'charge/charge';

module.exports = function(Charge) {
  var log = logger.createLogger();

  Charge.loadCharges = function(businessId, startDate, skip, limit) {
    return Q.Promise(function(resolve, reject) {
      aggregate
        .getCharges(businessId, startDate, skip, limit)
        .then(function(charges) {
          //log.debug( '@getCharges', startDate, skip, limit )
          return resolve(charges);
        })
        .fail(function(error) {
          log.error('@getCharges', error);
          return reject(error);
        });
    });
  };

  Charge.addCharge = function(aCharge) {
    return Q.Promise(function(resolve, reject) {
      if (utility.isMongoDbStorage()) {
        Charge.create(aCharge, function(error) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          return resolve();
        });
      } else {
        var ownerMobile = aCharge.notifyOwner;
        log.debug(aCharge);
        var charge = {
          amount: aCharge.amount,
          type: aCharge.type,
          forThe: aCharge.forThe, // Reason description
          businessId: aCharge.businessId,
          date: aCharge.date,
          timestamp: new Date().getTime()
        };
        needle.post(ELASTIC_CHARGE_PATH, charge, { json: true }, function(
          error,
          result
        ) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          log.debug('charged: ', result.body._id);
          if (aCharge.amount > 0 && ownerMobile) {
            smsModule.send({
              token1: aCharge.amount,
              mobile: ownerMobile,
              template: process.env.BUSINESS_SMS_CHARGE_CONFIRM
            });
          }
          return resolve();
        });
      }
    });
  };

  Charge.remoteMethod('loadCharges', {
    description: 'get charges of a business between two dates, skip and limit',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'startDate',
        type: 'number',
        required: true
      },
      {
        arg: 'skip',
        type: 'number',
        required: true
      },
      {
        arg: 'limit',
        type: 'number',
        required: true
      }
    ],
    returns: { root: true }
  });
};
