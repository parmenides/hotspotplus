import app from '../../server/server';
import Q from 'q';
import config from '../../server/modules/config';
import aggregate from '../../server/modules/aggregates';
import smsModule from '../../server/modules/sms';
import logger from '../../server/modules/logger';

const log = logger.createLogger();

module.exports = function(Campaign) {
  Campaign.sendBulkMessages = function(campaignId) {
    var Member = app.models.Member;
    var Business = app.models.Business;
    var Coupon = app.models.Coupon;

    return Q.Promise(function(resolve, reject) {
      Campaign.findById(campaignId, function(error, campaign) {
        if (error) {
          log.error('failed to load campaign');
          return reject(error);
        }
        if (!campaign) {
          return reject('campaign not found');
        }
        if (!campaign.messageBody && !campaign.sendCoupon) {
          return reject('campaign message empty');
        }
        var businessId = campaign.businessId;
        var sendCoupon = campaign.sendCoupon;
        var messageBody = campaign.messageBody;
        var discount = campaign.discount;
        var couponPrefix = campaign.couponPrefix;
        var campaignLog = [];

        if (campaign.log) {
          campaignLog = campaign.log;
        }

        Business.findById(businessId, function(error, business) {
          if (error) {
            log.error('failed to load business');
            return reject(error);
          }
          if (!business) {
            return reject('business not found');
          }
          Business.hasValidSubscription(business)
            .then(function() {
              Member.count(
                {
                  businessId: campaign.businessId,
                  mobile: { gt: 0 },
                },
                function(error, receptorsLength) {
                  if (error) {
                    log.error('@sendBulkMessages', error);
                    return reject(error);
                  }
                  if (messageBody && sendCoupon) {
                    var tempMessage = messageBody.concat(
                      '\n',
                      config.PERSIAN_COUPON_MESSAGE,
                    );
                  } else if (!messageBody && sendCoupon) {
                    tempMessage = config.PERSIAN_COUPON_MESSAGE;
                  }

                  var totalCost = Member.calculateBulkSmsCost(
                    receptorsLength,
                    tempMessage,
                  );
                  aggregate
                    .getProfileBalance(businessId)
                    .then(function(balance) {
                      if (balance.balance > totalCost) {
                        Member.find(
                          {
                            where: {
                              and: [
                                { businessId: businessId },
                                {
                                  mobile: {
                                    gt: 0,
                                  },
                                },
                              ],
                            },
                            fields: {
                              mobile: true,
                              id: true,
                            },
                          },
                          function(error, membersList) {
                            if (error) {
                              log.error('@sendBulkMessages', error);
                              return reject(error);
                            }
                            if (membersList.length != 0) {
                              for (var i = 0; i < membersList.length; i++) {
                                (function() {
                                  var member = membersList[i];
                                  var mobile = member.mobile;
                                  var mobileArray = [];
                                  mobileArray.push(mobile);
                                  var logData = {};
                                  logData.pushedMessages = 0;
                                  logData.members = [];
                                  logData.mobiles = [];
                                  logData.date = new Date().getTime();
                                  if (sendCoupon == true) {
                                    var coupon = {
                                      //coupon code is combination of a prefix (defined in business profile) and a 4-digit random number.
                                      code:
                                        couponPrefix +
                                        Math.floor(
                                          Math.random() * 10000 + 1000,
                                        ),
                                      value: discount,
                                      ownerId: businessId,
                                      campaignId: campaignId,
                                      used: 0,
                                      creationDate: new Date().getTime(),
                                      count: 1,
                                    };
                                    Coupon.create(coupon, function(
                                      error,
                                      result,
                                    ) {
                                      if (error) {
                                        log.error(error);
                                        return reject(error);
                                      }
                                      var couponMessage = config.PERSIAN_COUPON_MESSAGE.replace(
                                        '{0}',
                                        result.code,
                                      ).replace('{1}', result.value.amount);
                                      switch (result.value.unit) {
                                        case config.PERCENT_UNIT:
                                          couponMessage = couponMessage.replace(
                                            '{2}',
                                            config.PERSIAN_PERCENT_UNIT,
                                          );
                                          break;
                                        case config.TOMAN_UNIT:
                                          couponMessage = couponMessage.replace(
                                            '{2}',
                                            config.PERSIAN_TOMAN_UNIT,
                                          );
                                          break;
                                        default:
                                          break;
                                      }
                                      if (messageBody != null) {
                                        var message = messageBody.concat(
                                          '\n',
                                          couponMessage,
                                        );
                                      } else {
                                        message = couponMessage;
                                      }
                                      smsModule.send({
                                        businessId: businessId,
                                        mobiles: mobileArray,
                                        message: message,
                                      });
                                      logData.members.push(member.id);
                                      logData.mobiles.push(mobile);
                                      logData.pushedMessages++;
                                      logData.message = message;
                                      logData.sendCoupon = sendCoupon;
                                      logData.discount = discount;
                                      campaignLog.push(logData);
                                      log.debug(
                                        'bulk message added to Queue',
                                        businessId,
                                        mobile,
                                        message,
                                      );
                                      campaign.updateAttributes(
                                        { log: campaignLog },
                                        function(error, res) {
                                          if (error) {
                                            log.error(
                                              '@sendBulkMessages',
                                              error,
                                            );
                                            return reject(error);
                                          }
                                          log.debug(
                                            'campaign updated',
                                            campaignLog,
                                          );
                                          return resolve(
                                            'bulk message added to Queue',
                                          );
                                        },
                                      );
                                    });
                                  } else if (messageBody != null) {
                                    smsModule.send({
                                      businessId: businessId,
                                      mobiles: mobileArray,
                                      message: messageBody,
                                    });
                                    logData.members.push(member.id);
                                    logData.mobiles.push(mobile);
                                    logData.pushedMessages++;
                                    logData.message = messageBody;
                                    logData.sendCoupon = sendCoupon;
                                    logData.discount = discount;
                                    campaignLog.push(logData);
                                    log.debug(
                                      'bulk message added to Queue',
                                      businessId,
                                      mobile,
                                      messageBody,
                                    );
                                    campaign.updateAttributes(
                                      { log: campaignLog },
                                      function(error, res) {
                                        if (error) {
                                          log.error('@sendBulkMessages', error);
                                          return reject(error);
                                        }
                                        log.debug(
                                          'campaign updated',
                                          campaignLog,
                                        );
                                        return resolve(
                                          'bulk message added to Queue',
                                        );
                                      },
                                    );
                                  }
                                })();
                              }
                            } else {
                              return reject('mobile list or message empty');
                            }
                          },
                        );
                      } else {
                        var error = 'balanceNotEnough';
                        log.error('@sendBulkMessages', error);
                        return reject(error);
                      }
                    })
                    .fail(function(error) {
                      log.error('@sendBulkMessages', error);
                      return reject(error);
                    });
                },
              );
            })
            .fail(function(error) {
              log.error('@sendBulkMessages', error);
              log.debug(
                '@sendBulkMessages',
                'business does not have valid subscription',
              );
              return reject('business does not have valid subscription');
            });
        });
      });
    });
  };

  Campaign.remoteMethod('sendBulkMessages', {
    description: 'send message to all members with mobile number',
    accepts: [
      {
        arg: 'campaignId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  });
};
