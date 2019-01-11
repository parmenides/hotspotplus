/**
 * Created by payamyousefi on 10/17/16.
 */

require('date-utils');
var Q = require('q');
var app = require('../server');
var redis = require('redis');
var REDIS_PORT = process.env.REDIS_PORT;
var REDIS_HOST = process.env.REDIS_HOST;
var redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);
var logger = require("hotspotplus-common").logger;
var log = logger.createLogger(process.env.APP_NAME, process.env.LOG_DIR);
var utility = require("hotspotplus-common").utility;
var auth = require("hotspotplus-common").auth;
var aggregate = require("hotspotplus-common").aggregates;
var CONFIG_SERVER_URL = process.env.CONFIG_SERVER_URL;
var LICENSE_SERVER_SMS_API_URL = CONFIG_SERVER_URL + "/Sms/sendMessages?access_token={token}";
var LICENSE_SERVER_GROUP_SMS_API_URL = CONFIG_SERVER_URL + "/Sms/sendGroupMessage?access_token={token}";
var LICENSE_SERVER_LOGIN_URL = CONFIG_SERVER_URL + "/Licenses/login";
var smsService = require("hotspotplus-common").sms;

var needle = require('needle');

exports.send = function (data) {
    log.debug('Mobile data', data);
    var SystemConfig = app.models.SystemConfig;
    var Business = app.models.Business;
    var Charge = app.models.Charge;
    var businessId = data.businessId || 'service';
    var mobilesList = data.mobiles;
    var message = data.message;

    return Q.Promise(function (resolve, reject) {
        if (mobilesList && message) {
            log.debug('mobiles: ', mobilesList);
            log.debug('message: ', message);
            log.debug('businessId: ', businessId);
            if (!mobilesList.length || mobilesList.length === 0) {
                log.error('@send message dismissed, empty message or mobile ', mobilesList);
                return resolve();
            }
            sendGroupMessage(mobilesList, message, businessId).then(function () {
                return resolve();
            }).fail(function (error) {
                return reject(error);
            });
        } else {
            //Send service message by template
            var mobile = data.mobile;
            var token1 = data.token1;
            var token2 = data.token2;
            var token3 = data.token3;
            var template = data.template;
            if (token1) {
                token1 = utility.removeAllSpace(token1);
            }
            if (token2) {
                token2 = utility.removeAllSpace(token2);
            }
            if (token3) {
                token3 = utility.removeAllSpace(token3);
            }
            if (businessId !== 'service') {
                Business.findById(businessId).then(function (business) {
                    var token10 = business.smsSignature || business.title || process.env.SMS_SIGNATURE;
                    SystemConfig.isLocal().then(function (isALocal) {
                        if (isALocal) {
                            sendMessage(mobile, token1, token2, token3, token10, template, businessId).then(function () {
                                return resolve();
                            }).fail(function (error) {
                                log.error(error);
                                return reject(error);
                            });
                        } else {
                            aggregate.getProfileBalance(businessId).then(function (result) {
                                var balance = result.balance;
                                if (balance > process.env.MIN_REQUIRED_SMS_CREDIT) {
                                    sendMessage(mobile, token1, token2, token3, token10, template, businessId).then(function () {
                                        return resolve();
                                    }).fail(function (error) {
                                        log.error(error);
                                        return reject(error);
                                    });
                                } else {
                                    log.warn("business has not enough credit:", businessId);
                                    return resolve();
                                }
                            }).fail(function (error) {
                                log.error(error)
                                return reject(error)
                            })
                        }
                    }).fail(function (error) {
                        log.error(error)
                        return reject(error)
                    })
                }).catch(function (error) {
                    log.error(error);
                    return reject(error);
                })
            } else {
                var token10 = process.env.SMS_SIGNATURE;
                sendMessage(mobile, token1, token2, token3, token10, template).then(function () {
                    return resolve();
                }).fail(function (error) {
                    log.error(error);
                    return reject(error);
                });
            }
        }
    });
};


var getSmsApiKey = function () {
    log.debug("@getSmsApiKey");
    return Q.Promise(function (resolve, reject) {
        redisClient.get('SMS_API_KEY', function (error, SMS_API_KEY) {
            if (error) {
                log.error(error);
                return reject(error);
            }
            if (!SMS_API_KEY) {
                log.debug("invalid sms api key:", SMS_API_KEY);
                return resolve();
            }
            return resolve(SMS_API_KEY)
        });
    });
};

function sendMessage(mobile, token1, token2, token3, token10, template, businessId) {
    log.debug("@sendMessage");
    var Charge = app.models.Charge;
    return Q.Promise(function (resolve, reject) {
        getSmsApiKey().then(function (SMS_API_KEY) {
            if (!mobile) {
                log.error('@SMS_Queue:send message dismissed, empty message or mobile ', mobile);
                return resolve();
            }
            log.debug(SMS_API_KEY);
            log.debug(smsService.sendMessageToKavehnegar);
            if (SMS_API_KEY && SMS_API_KEY !== '-') {
                smsService.sendMessageToKavehnegar(SMS_API_KEY, mobile, token1, token2, token3, token10, template).then(function (cost) {
                    log.debug("message cost in Toman:", cost);
                    Charge.addCharge({
                        businessId: businessId,
                        type: 'smsCost',
                        amount: cost,
                        forThe: 'message',
                        date: new Date().getTime()
                    }).then(function () {
                        return resolve()
                    }).fail(function (error) {
                        log.error(error);
                        return reject(error);
                    });
                }).catch(function (error) {
                    log.error(error);
                    return reject(error);
                })
            } else {
                auth.loginToLicenseServer(LICENSE_SERVER_LOGIN_URL).then(function (authResult) {
                    log.debug("authResult:", authResult);
                    var data = {};
                    data.receptor = mobile;
                    data.token = token1;
                    data.token2 = token2;
                    data.token3 = token3;
                    data.token10 = token10;
                    data.template = template;
                    log.debug("LICENSE_SERVER_SMS_API_URL: ", LICENSE_SERVER_SMS_API_URL);
                    needle.post(LICENSE_SERVER_SMS_API_URL.replace("{token}", authResult.token),
                        data,
                        function (error, result, body) {
                            if (error) {
                                log.error('Error in LICENSE_SERVER_SMS_API:', error);
                                return reject(error);
                            }
                            if (result.statusCode !== 200) {
                                log.error('Error code in LICENSE_SERVER_SMS_API: ', result.statusCode, " Body: ", body);
                                return reject(body);
                            }
                            log.debug(body);
                            return resolve(result)
                        })
                }).fail(function (error) {
                    log.error(error);
                    return reject(error);
                })
            }
        }).fail(function (error) {
            log.error(error);
            return reject(error);
        })
    });
}

var sendGroupMessage = function (mobilesList, message, businessId) {
    log.debug("@sendGroupMessage");
    var Charge = app.models.Charge;
    return Q.Promise(function (resolve, reject) {
        getSmsApiKey().then(function (SMS_API_KEY) {
            if (SMS_API_KEY) {
                smsService.sendGroupMessageToKavehnegar(SMS_API_KEY, mobilesList, message).then(function (cost) {
                    log.debug("message cost in Toman:", cost);
                    Charge.addCharge({
                        businessId: businessId,
                        type: 'smsCost',
                        amount: cost,
                        forThe: 'bulkMessages:' + mobilesList.length,
                        date: new Date().getTime()
                    });
                    return resolve();
                }).catch(function (error) {
                    return reject(error);
                });
            } else {
                auth.loginToLicenseServer(LICENSE_SERVER_LOGIN_URL).then(function (authResult) {
                    var data = {};
                    data.receptor = mobilesList;
                    data.message = message;
                    needle.post(LICENSE_SERVER_GROUP_SMS_API_URL.replace("{token}", authResult.token),
                        data, {json: true},
                        function (error, result, body) {
                            if (error) {
                                log.error('Error in LICENSE_SERVER_GROUP_SMS_API:', error);
                                return reject(error);
                            }
                            if (result.statusCode !== 200) {
                                log.error('Error code in LICENSE_SERVER_GROUP_SMS_API', result.statusCode, " Body: ", body);
                                return reject(body);
                            }
                            log.debug(body);
                            return resolve(result)
                        })
                }).fail(function (error) {
                    log.error(error);
                    return reject(error);
                })
            }
        }).fail(function (error) {
            log.error(error);
            return reject(error);
        })

    });
};