const app = require('../../server/server');
const Q = require('q');
const config = require('../../server/modules/config.js');
const smsModule = require('../../server/modules/sms');
const logger = require('../../server/modules/logger');
const db = require('../../server/modules/db.factory');

module.exports = function(Charge) {
  const log = logger.createLogger();
  Charge.loadCharges = function(businessId, startDate, skip, limit) {
    return Q.Promise(function(resolve, reject) {
      db.getCharges(businessId, startDate, skip, limit)
        .then(function(charges) {
          // log.debug( '@getCharges', startDate, skip, limit )
          return resolve(charges);
        })
        .fail(function(error) {
          log.error('@getCharges', error);
          return reject(error);
        });
    });
  };

  Charge.addCharge = function(chargeInfo) {
    const ownerMobile = chargeInfo.notifyOwner;
    log.debug(chargeInfo);
    const charge = {
      amount: chargeInfo.amount,
      type: chargeInfo.type,
      forThe: chargeInfo.forThe, // description
      businessId: chargeInfo.businessId,
    };
    return db.addCharge(charge).then(function() {
      if (chargeInfo.amount > 0 && ownerMobile) {
        smsModule.send({
          token1: charge.amount,
          mobile: ownerMobile,
          template: config.BUSINESS_SMS_CHARGE_CONFIRM,
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
        required: true,
      },
      {
        arg: 'startDate',
        type: 'number',
        required: true,
      },
      {
        arg: 'skip',
        type: 'number',
        required: true,
      },
      {
        arg: 'limit',
        type: 'number',
        required: true,
      },
    ],
    returns: {root: true},
  });
};
