'use strict';
var logger = require('hotspotplus-common').logger;
var app = require('../../server/server');
var config = require('../../server/modules/config');
var utility = require('hotspotplus-common').utility;
var Payment = require('hotspotplus-common').payment;
var Q = require('q');
var serviceInfo = require('../../server/modules/serviceInfo.js');

module.exports = function(Invoice) {
  var log = logger.createLogger(process.env.APP_NAME, process.env.LOG_DIR);

  Invoice.verifyInvoice = function(invoiceId) {
    return Q.Promise(function(resolve, reject) {
      if (!invoiceId) {
        return reject('invalid invoice id');
      }
      Invoice.findById(invoiceId, function(error, invoice) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!invoice) {
          return resolve('invoice not found');
        }
        var paymentId = invoice.paymentId;
        var price = invoice.price;
        Payment.verifyPayment(config.PAYMENT_API_KEY, paymentId, price)
          .then(function(result) {
            log.debug(result);
            if (result.payed) {
              var refId = result.refId;
              invoice.updateAttributes(
                {
                  payed: true,
                  paymentRefId: refId,
                  paymentDate: new Date().getTime(),
                },
                function(error, updated) {
                  if (error) {
                    log.error(error);
                    return reject(error);
                  }
                  return resolve(updated);
                },
              );
            } else {
              return reject();
            }
          })
          .fail(function(error) {
            log.error(error);
          });
      });
    });
  };

  Invoice.verifyAndUseCoupon = function(price, couponCode) {
    var Coupon = app.models.Coupon;
    return Q.Promise(function(resolve, reject) {
      if (price && couponCode) {
        Coupon.findOne(
          {
            where: {
              and: [{ code: couponCode }, { ownerId: config.ADMIN_OWNER_ID }],
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

  Invoice.issueExternalInvoiceAndOpenPayment = function(
    price,
    uniqueId,
    invoiceType,
    returnUrl,
    serviceInfo,
    discountCoupon,
  ) {
    return Q.Promise(function(resolve, reject) {
      discountCoupon = discountCoupon || {};
      Invoice.verifyAndUseCoupon(price, discountCoupon.code)
        .then(function(discountedPrice) {
          var issueDate = new Date().getTime();
          Invoice.create(
            {
              price: discountedPrice,
              payed: false,
              uniqueId: uniqueId,
              returnUrl: returnUrl,
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
              var returnUrl = config
                .EXTERNAL_PAYMENT_RETURN_URL()
                .replace('{0}', 'invoiceId')
                .replace('{1}', invoiceId);
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
        .fail(function(error) {
          log.error('failed to open payment gateway', error);
          return reject(error);
        });
    });
  };

  Invoice.remoteMethod('issueExternalInvoiceAndOpenPayment', {
    accepts: [
      {
        arg: 'price',
        type: 'number',
        required: true,
      },
      {
        arg: 'uniqueId',
        type: 'string',
        required: true,
      },
      {
        arg: 'invoiceType',
        type: 'string',
        required: true,
      },
      {
        arg: 'returnUrl',
        type: 'string',
        required: true,
      },
      {
        arg: 'serviceInfo',
        type: 'object',
        required: true,
      },
      {
        arg: 'discountCoupon',
        type: 'object',
      },
    ],
    returns: { root: true },
  });

  Invoice.verifyExternalInvoice = function(invoiceId) {
    return Q.Promise(function(resolve, reject) {
      var Invoice = app.models.Invoice;
      if (!invoiceId) {
        log.error('invoice not found');
        return reject('invoice id is empty');
      }
      Invoice.findById(invoiceId, function(error, invoice) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!invoice) {
          return reject('invoice not found');
        }
        var paymentId = invoice.paymentId;
        var price = invoice.price;
        log.debug(invoice);
        Payment.verifyPayment(config.PAYMENT_API_KEY, paymentId, price)
          .then(function(result) {
            log.debug(result);
            if (result.payed) {
              if (error) {
                log.error(error);
                return reject(error);
              }
              var refId = result.refId;
              invoice.updateAttributes(
                {
                  payed: true,
                  paymentRefId: refId,
                  paymentDate: new Date().getTime(),
                },
                function(error) {
                  if (error) {
                    log.error(error);
                    return reject(error);
                  }
                  //needle post to update license and then update
                  return resolve({
                    code: 302,
                    returnUrl: invoice.returnUrl
                      .replace('{invoiceId}', invoiceId)
                      .replace('{status}', 'success'),
                  });
                },
              );
            } else {
              return resolve({
                code: 302,
                returnUrl: invoice.returnUrl
                  .replace('{invoiceId}', invoiceId)
                  .replace('{status}', 'failed'),
              });
            }
          })
          .fail(function(error) {
            log.error(error);
            return resolve({
              code: 302,
              returnUrl: invoice.returnUrl
                .replace('{invoiceId}', invoiceId)
                .replace('{status}', 'failed'),
            });
          });
      });
    });
  };

  Invoice.remoteMethod('verifyExternalInvoice', {
    accepts: [
      {
        arg: 'invoiceId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  });
};
