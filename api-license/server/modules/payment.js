/**
 * Created by payamyousefi on 3/31/17.
 */

var Q = require('q');
var logger = require('./logger');
var log = logger.createLogger();
var Payir = require('payir');

module.exports.openPaymentGateway = function(
  api_key,
  price,
  desc,
  email,
  mobile,
  returnUrl,
) {
  log.debug(returnUrl);
  return Q.Promise(function(resolve, reject) {
    var gateway = new Payir(api_key);
    gateway
      .send(price * 10, returnUrl)
      .then(function(response) {
        var url = response;
        var authority = url.split('/');
        authority = authority[authority.length - 1];
        log.warn('OPENNN    ////////////////////');
        log.warn(response);
        return resolve({
          url: url,
          paymentId: authority,
        });
      })
      .catch(function(error) {
        return reject(error);
      });
  });
};

module.exports.verifyPayment = function(api_key, paymentId, price) {
  return Q.Promise(function(resolve, reject) {
    var gateway = new Payir(api_key);
    gateway
      .verify({
        api: api_key,
        transId: paymentId,
      })
      .then(function(response) {
        log.warn('////////////////////');
        log.warn(response);
        if (response.amount && response.amount == price * 10) {
          return resolve({ payed: true, refId: response.transactionId });
        } else {
          return resolve({ payed: false });
        }
      })
      .catch(function(error) {
        log.error('Payment error', api_key, paymentId, price);
        log.error(error);
        return reject(error);
      });
  });
};
