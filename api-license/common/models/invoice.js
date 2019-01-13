'use strict';

var app = require('../../server/server');
var config = require('../../server/modules/config');
var logger = require('../../server/modules/logger');
var log = logger.createLogger();
var Payment = require('../../server/modules/payment');
var Promise = require('bluebird');

module.exports = function(Invoice) {
  Invoice.verifyAndUseCoupon = function(price, couponCode) {
    log.debug('verifyAndUseCoupon');
    var Coupon = app.models.Coupon;
    return new Promise(function(resolve, reject) {
      if (price && couponCode) {
        Coupon.findOne(
          {
            where: {
              code: couponCode,
            },
          },
          function(error, coupon) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            if (!coupon) {
              log.error('coupon not found');
              return reject('coupon not found');
            }
            var unit = coupon.value.unit;
            var amount = coupon.value.amount;
            if (unit === config.PERCENT_UNIT) {
              var discountAmount = (price * amount) / 100;
              price = price - discountAmount;
            } else if (unit === config.TOMAN_UNIT) {
              price = price - amount;
            }
            coupon
              .updateAttributes({
                used: coupon.used + 1,
                redeemDate: new Date().getTime(),
              })
              .then(
                function() {
                  return resolve(price);
                },
                function(error) {
                  log.error('coupon update error:', error);
                  return reject(error);
                },
              );
          },
        );
      } else {
        return resolve(price);
      }
    });
  };

  Invoice.issueInvoice = function(
    price,
    licenseId,
    invoiceType,
    serviceInfo,
    discountCoupon,
  ) {
    log.debug('issueInvoice');
    return new Promise(function(resolve, reject) {
      discountCoupon = discountCoupon || {};
      log.debug('issueInvoice', discountCoupon);
      Invoice.verifyAndUseCoupon(price, discountCoupon.code)
        .then(function(discountedPrice) {
          var issueDate = new Date().getTime();
          Invoice.create(
            {
              price: discountedPrice,
              payed: false,
              licenseId: licenseId,
              invoiceType: invoiceType,
              serviceInfo: serviceInfo,
              issueDate: issueDate,
            },
            function(error, invoice) {
              if (error) {
                log.error('failed to create invoice', error);
                return reject(error);
              }
              var invoiceId = invoice.id;
              var returnUrl = config.RETURN_AND_VERIFY_REMOTE_SERVER_INVOICE.replace(
                '{invoiceId}',
                invoiceId,
              );
              log.debug('Invoice created for ', returnUrl);
              Payment.openPaymentGateway(
                config.PAYMENT_API_KEY,
                discountedPrice,
                config.PAYMENT_GATEWAY_DEFAULT_DESC,
                config.PAYMENT_SUPPORT_EMAIL,
                config.PAYMENT_SUPPORT_MOBILE,
                returnUrl,
              )
                .then(function(response) {
                  var url = response.url;
                  var paymentId = response.paymentId;
                  invoice.updateAttributes(
                    {
                      paymentId: paymentId,
                    },
                    function(error) {
                      if (error) {
                        log.error('invoice update error:', error);
                        return reject(error);
                      }
                      log.debug('Invoice.create', url);
                      return resolve({ url: url });
                    },
                  );
                })
                .fail(function(error) {
                  log.error('failed to open payment gateway', error);
                  return reject(error);
                });
            },
          );
        })
        .catch(function(error) {
          log.error('failed to open payment gateway', error);
          return reject(error);
        });
    });
  };
};
