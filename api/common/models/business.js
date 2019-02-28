var logger = require('../../server/modules/logger');
var app = require('../../server/server');
var config = require('../../server/modules/config');
var utility = require('../../server/modules/utility');
var aggregate = require('../../server/modules/aggregates');
var Payment = require('../../server/modules/payment');
var request = require('request');
var Q = require('q');
var smsModule = require('../../server/modules/sms');
var serviceInfo = require('../../server/modules/serviceInfo.js');
var auth = require('../../server/modules/auth');
var needle = require('needle');
var redis = require('redis');
var redisInvoicePayed = redis.createClient(
  config.REDIS.PORT,
  config.REDIS.HOST
);

var underscore = require('underscore');
var hotspotMessages = require('../../server/modules/hotspotMessages');
var hotspotTemplates = require('../../server/modules/hotspotTemplates');
var extend = require('util')._extend;

module.exports = function(Business) {
  var log = logger.createLogger();

  Business.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      updateModel(ctx.instance);
    } else if (ctx.data) {
      updateModel(ctx.data);
    }

    function updateModel(business) {
      if (business.mobile) {
        business.mobile = utility.removeAllSpace(
          utility.verifyAndTrimMobile(business.mobile)
        );
        if (!business.mobile) {
          var error = new Error();
          error.message = hotspotMessages.invalidMobileNumber;
          error.status = 403;
          return next(error);
        }
      }
      if (business.password) {
        business.passwordText = utility.encrypt(
          business.password,
          config.ENCRYPTION_KEY
        );
      }
    }

    // Check if this is a business create
    if (ctx.instance && ctx.isNewInstance) {
      /*if ( !ctx.instance.services ) {
  ctx.instance.services = {
    id:               "economic",
    subscriptionDate: new Date ().getTime (),
    expiresAt:        (new Date ().addDays ( config.TRIAL_DAYS )).getTime (),
    duration:         1
  }
}*/
      ctx.instance.smsSignature = ctx.instance.title;
      // add time zone defaults to business
      ctx.instance.timeZone = {};
      ctx.instance.groupMemberHelps = {};
      ctx.instance.timeZone = config.TIME_ZONE_DEFAULT;
      ctx.instance.autoAssignInternetPlan = false;
      ctx.instance.defaultInternetPlan = {};
      ctx.instance.username = utility.removeAllSpace(ctx.instance.email);
      ctx.instance.username = ctx.instance.username.toLowerCase();
      ctx.instance.email = utility.removeAllSpace(ctx.instance.email);
      ctx.instance.email = ctx.instance.email.toLowerCase();
      ctx.instance.creationDate = new Date().getTime();
      ctx.instance.subscriptionDate = new Date().getTime();
      ctx.instance.selectedThemeId = config.DEFAULT_THEME_ID;
      ctx.instance.themeConfig = {};
      ctx.instance.themeConfig[config.DEFAULT_THEME_ID] = {};
      ctx.instance.themeConfig[config.DEFAULT_THEME_ID].style =
        hotspotTemplates[config.DEFAULT_THEME_ID].styles[0].id;
      ctx.instance.themeConfig[config.DEFAULT_THEME_ID].formConfig =
        hotspotTemplates[config.DEFAULT_THEME_ID].formConfig;
      var SystemConfig = app.models.SystemConfig;
      SystemConfig.getConfig()
        .then(function(systemConfig) {
          Business.count(function(error, numberOfBusiness) {
            if (error) {
              log.error(error);
              return next(error);
            }
            if (systemConfig.numberOfAllowedBusiness > numberOfBusiness) {
              return next();
            } else {
              var error = new Error();
              error.message = hotspotMessages.maxProfileReached;
              error.status = 403;
              return next(error);
            }
          });
        })
        .fail(function(error) {
          log.error(error);
          return next(error);
        });
    } else {
      next();
    }
  });

  Business.observe('before delete', function(ctx, next) {
    if (ctx.where && ctx.where.id && ctx.where.id.inq[0]) {
      var businessId = ctx.where.id.inq[0];
      var InternetPlan = app.models.InternetPlan;
      var Nas = app.models.Nas;
      var Member = app.models.Member;
      var Invoice = app.models.Invoice;
      var File = app.models.FileStorage;
      log.debug('@Business before delete');
      InternetPlan.destroyAll({ businessId: businessId }, function(error, res) {
        if (error) {
          log.error(error);
          return next(error);
        }
        log.debug('internetPlans deleted');
        Nas.destroyAll({ businessId: businessId }, function(error, res) {
          if (error) {
            log.error(error);
            return next(error);
          }
          log.debug('nas deleted');
          Member.destroyAll({ businessId: businessId }, function(error, res) {
            if (error) {
              log.error(error);
              return next(error);
            }
            log.debug('members deleted');
            Invoice.destroyAll({ businessId: businessId }, function(
              error,
              res
            ) {
              if (error) {
                log.error(error);
                return next(error);
              }
              log.debug('invoices deleted');
              File.destroyAll({ businessId: businessId }, function(error, res) {
                if (error) {
                  log.error(error);
                  return next(error);
                }
                log.debug('files deleted');
              });
            });
          });
        });
      });
    }
    next();
  });

  Business.observe('after save', function(ctx, next) {
    var Role = app.models.Role;
    if (ctx.isNewInstance) {
      var business = ctx.instance;
      var businessId = ctx.instance.id;
      Role.findOne({ where: { name: config.ROLES.NETWORKADMIN } }, function(
        error,
        role
      ) {
        if (error) {
          log.error(
            'failed to load ' +
              config.ROLES.NETWORKADMIN +
              ' for role assignment',
            error
          );
          return next();
        }
        if (!role) {
          return next('failed to load role');
        }
        var roleMapping = { principalType: 'USER', principalId: businessId };
        role.principals.create(roleMapping, function(error, result) {
          if (error) {
            log.error('failed to assign role to business', error);
          }
          log.debug('principal assigned ', result);
          smsModule.send({
            token1: business.username,
            mobile: business.mobile,
            template: config.REGISTRATION_MESSAGE_TEMPLATE
          });
          //Add trial sms test;
          Business.assignDefaultPlanToBusiness(businessId)
            .then(function() {
              Business.adminChargeCredit(businessId, 10000);
              return next();
            })
            .fail(function(err) {
              return next(err);
            });
        });
      });
    } else {
      return next();
    }
  });

  Business.registerNewLicense = function(mobile, fullname, title) {
    return Q.Promise(function(resolve, reject) {
      mobile = utility.verifyAndTrimMobile(mobile);
      if (!mobile) {
        var error = new Error();
        error.status = 422;
        error.message = hotspotMessages.invalidMobileNumber;
        return reject(error);
      }

      log.debug(config.CONFIG_SERVER_NEW_LICENSE);
      needle.request(
        'post',
        config.CONFIG_SERVER_NEW_LICENSE,
        {
          mobile: mobile,
          title: title,
          fullName: fullname
        },
        { json: true },
        function(error, resp, body) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          log.debug(resp.statusCode);
          if (resp.statusCode !== 200) {
            log.error(body);
            return reject(resp.statusCode);
          }
          if (!body.systemUuid) {
            log.error('invalid uuid ');
            return reject('invalid system uuid');
          }
          utility
            .writeStringToFileInPath(config.SYSTEM_ID_PATH, body.systemUuid)
            .then(function() {
              Business.reloadLicense();
              return resolve();
            })
            .fail(function(error) {
              return reject(error);
            });
        }
      );
    });
  };

  Business.remoteMethod('registerNewLicense', {
    description: 'Register A New License ',
    accepts: [
      {
        arg: 'mobile',
        type: 'string',
        required: true
      },
      {
        arg: 'fullName',
        type: 'string',
        required: true
      },
      {
        arg: 'title',
        type: 'string',
        required: true
      }
    ],
    returns: { root: true }
  });

  Business.loadConfig = function(bizId, cb) {
    Business.findById(bizId, function(error, business) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      if (!business) {
        var error = new Error();
        error.message = hotspotMessages.invalidBusinessId;
        error.status = 404;
        return cb(error);
      }
      business.password = null;
      business.passwordText = null;
      business.mobile = null;
      business.username = null;
      business.email = null;
      //todo: don't remove -- for analytics
      //business.autoCheck = business.autoCheck || false
      //business.autoLogin = business.autoLogin || false
      business.autoAssignInternetPlan =
        business.autoAssignInternetPlan || false;
      business.defaultInternetPlan = business.defaultInternetPlan || {};
      business.selectedThemeId =
        business.selectedThemeId || config.DEFAULT_THEME_ID;
      if (!business.themeConfig) {
        business.themeConfig = {};
        business.themeConfig[config.DEFAULT_THEME_ID] = {
          formConfig: hotspotTemplates[config.DEFAULT_THEME_ID].formConfig
        };
      }
      business.enableMemberAutoLogin = business.enableMemberAutoLogin === true;
      if (!business.formConfig || !underscore.isArray(business.formConfig)) {
        business.formConfig =
          hotspotTemplates[config.DEFAULT_THEME_ID].formConfig;
      }
      return cb(null, business);
    });
  };

  Business.remoteMethod('loadConfig', {
    description: 'Load business config',
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      }
    ],
    returns: { root: true }
  });

  Business.getPackageById = function(packageId) {
    return Q.Promise(function(resolve, reject) {
      if (
        !packageId ||
        packageId === 'premium' ||
        packageId === 'silver' ||
        packageId === 'gold' ||
        packageId === 'bronze' ||
        packageId === 'free'
      ) {
        packageId = 'economic';
      }
      Business.getPackages().then(function(pkgList) {
        for (var j in pkgList) {
          var pkg = pkgList[j];
          if (pkg.id === packageId) {
            return resolve(pkg);
          }
        }
        return reject();
      });
    });
  };

  Business.assignDefaultPlanToBusiness = function(businessId) {
    var SystemConfig = app.models.SystemConfig;
    return Q.Promise(function(resolve, reject) {
      SystemConfig.isLocal().then(function(isLocal) {
        if (!isLocal) {
          Business.assignPackageToBusiness(businessId, 'demo')
            .then(function() {
              return resolve();
            })
            .fail(function(error) {
              return reject(error);
            });
        } else {
          return resolve();
        }
      });
    });
  };
  Business.getCurrentService = function(business) {
    var SystemConfig = app.models.SystemConfig;
    return Q.Promise(function(resolve, reject) {
      SystemConfig.isLocal().then(function(isLocal) {
        if (isLocal) {
          SystemConfig.getService()
            .then(function(currentService) {
              return resolve(currentService);
            })
            .fail(function(error) {
              return reject(error);
            });
        } else {
          var currentService = business.services;
          if (!currentService) {
            currentService = {
              id: 'economic',
              subscriptionDate: new Date().removeDays(31).getTime(),
              expiresAt: new Date().getTime(),
              duration: 1
            };
          }
          if (
            currentService.allowedOnlineUsers &&
            typeof currentService.allowedOnlineUsers === 'string'
          ) {
            currentService.allowedOnlineUsers = Number(
              currentService.allowedOnlineUsers
            );
          }
          currentService.allowedOnlineUsers =
            currentService.allowedOnlineUsers ||
            config.DEFAULT_ALLOWED_ONLINE_USERS;
          return resolve(currentService);
        }
      });
    });
  };

  Business.getModules = function(business) {
    var SystemConfig = app.models.SystemConfig;
    return Q.Promise(function(resolve, reject) {
      SystemConfig.isLocal().then(function(isLocal) {
        if (isLocal) {
          SystemConfig.getModules()
            .then(function(modules) {
              return resolve(modules);
            })
            .fail(function(error) {
              return reject(error);
            });
        } else {
          var currentModules = {
            sms: {
              id: 'sms',
              duration: business.services.duration,
              subscriptionDate: business.services.subscriptionDate,
              expiresAt: business.services.expiresAt
            },
            log: {
              id: 'log',
              duration: business.services.duration,
              subscriptionDate: business.services.subscriptionDate,
              expiresAt: business.services.expiresAt
            }
          };
          return resolve(currentModules);
        }
      });
    });
  };

  Business.reloadLicense = function(cb) {
    redisInvoicePayed.publish('INVOICE_PAYED', 'Payed');
    var SystemConfig = app.models.SystemConfig;
    setTimeout(function() {
      SystemConfig.getConfig();
    }, 5000);
    return cb && cb(null, { ok: true });
  };

  Business.remoteMethod('reloadLicense', {
    description: 'reloadLicense',
    accepts: [],
    returns: { root: true }
  });

  Business.buyPackage = function(packageId, discountCoupon, ctx) {
    var Invoice = app.models.Invoice;
    var SystemConfig = app.models.SystemConfig;
    var issueDate = new Date().getTime();
    var businessId = ctx.currentUserId;
    return Q.Promise(function(resolve, reject) {
      SystemConfig.isLocal().then(function(isLocal) {
        if (isLocal) {
          utility
            .getSystemUuid(config.SYSTEM_ID_PATH)
            .then(function(systemUuid) {
              auth
                .loginToLicenseServer(config.CONFIG_SERVER_LOGIN)
                .then(function(authResult) {
                  var token = authResult.token;
                  var providerId = authResult.userId;
                  log.debug('REturn to ', config.BUY_LOCAL_PACKAGE_RETURN());
                  needle.post(
                    config.CONFIG_SERVER_BUY_PACKAGE.replace('{token}', token),
                    {
                      systemUuid: systemUuid,
                      providerId: providerId,
                      returnUrl: config.BUY_LOCAL_PACKAGE_RETURN(),
                      packageId: packageId,
                      discountCoupon: discountCoupon
                    },
                    { json: true },
                    function(error, response, body) {
                      if (error) {
                        log.error(error);
                        return reject(error);
                      }
                      if (response.statusCode !== 200) {
                        return reject(response.body);
                      }
                      return resolve({ url: body.url });
                    }
                  );
                })
                .fail(function(error) {
                  log.error(error);
                  return reject(new Error('failed to authenticate'));
                });
            })
            .fail(function(error) {
              log.error(error);
              return reject(new Error('failed to load systemid'));
            });
        } else {
          Business.getPackageById(packageId)
            .then(function(selectedPackage) {
              if (!selectedPackage) {
                return reject('package not found');
              }
              var price =
                selectedPackage.price -
                selectedPackage.price * selectedPackage.discount;
              if (discountCoupon && discountCoupon.code) {
                var Coupon = app.models.Coupon;
                Coupon.findOne(
                  {
                    where: {
                      and: [
                        { code: discountCoupon.code },
                        { ownerId: config.ADMIN_OWNER_ID }
                      ]
                    }
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
                    }
                    if (unit === config.TOMAN_UNIT) {
                      price = price - amount;
                    }
                    coupon
                      .updateAttributes({
                        used: coupon.used + 1,
                        redeemDate: new Date().getTime()
                      })
                      .then(
                        function() {
                          createInvoiceAndPay(price);
                        },
                        function(error) {
                          log.error('coupon update error:', error);
                          log.error(error);
                          return reject(error);
                        }
                      );
                  }
                );
              } else {
                createInvoiceAndPay(price);
              }

              function createInvoiceAndPay(price) {
                if (price === 0) {
                  Business.assignPackageToBusiness(businessId, packageId)
                    .then(function() {
                      var returnUrl = config.BUSINESS_PAYMENT_RESULT_URL();
                      return resolve({
                        url: returnUrl
                          .replace('{0}', 'true')
                          .replace('{1}', '&desc=success')
                      });
                    })
                    .fail(function(error) {
                      log.error(
                        'failed to assign zero price pkg to business',
                        error
                      );
                      return reject(error);
                    });
                } else {
                  log.debug('createInvoiceAndPay price:', price);
                  Invoice.create(
                    {
                      price: price,
                      payed: false,
                      packageId: packageId,
                      invoiceType: config.BUY_SERVICE_CHARGE,
                      issueDate: issueDate,
                      businessId: businessId
                    },
                    function(error, invoice) {
                      if (error) {
                        log.error('failed to create invoice', error);
                        return reject(error);
                      }
                      var invoiceId = invoice.id;
                      var returnUrl = config
                        .BUSINESS_PAYMENT_RETURN_URL()
                        .replace('{0}', 'invoiceId')
                        .replace('{1}', invoiceId);
                      log.debug(
                        'config.BUSINESS_PAYMENT_RETURN_URL (): ',
                        config.BUSINESS_PAYMENT_RETURN_URL()
                      );
                      log.debug('returnUrl: ', returnUrl);
                      log.debug(
                        'EXTRACTED_EXTERNAL_API_ADDRESS: ',
                        process.env.EXTRACTED_EXTERNAL_API_ADDRESS
                      );
                      Payment.openPaymentGateway(
                        config.PAYMENT_API_KEY,
                        price,
                        config.PAYMENT_GATEWAY_DEFAULT_DESC,
                        config.PAYMENT_SUPPORT_EMAIL,
                        config.PAYMENT_SUPPORT_MOBILE,
                        returnUrl
                      )
                        .then(function(response) {
                          var url = response.url;
                          var paymentId = response.paymentId;
                          invoice
                            .updateAttributes({
                              paymentId: paymentId
                            })
                            .then(
                              function() {
                                return resolve({ url: url });
                              },
                              function(error) {
                                log.error('invoice update error:', error);
                                return reject(error);
                              }
                            );
                        })
                        .fail(function(error) {
                          log.error('failed to open payment gateway');
                          log.error(error);
                          return reject(error);
                        });
                    }
                  );
                }
              }
            })
            .fail(function(error) {
              log.error(error);
              return reject(error);
            });
        }
      });
    });
  };

  Business.remoteMethod('buyPackage', {
    description: 'buyService for business',
    accepts: [
      {
        arg: 'packageId',
        type: 'string',
        required: true
      },
      {
        arg: 'discount',
        type: 'object'
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.assignPackageToBusiness = function(businessId, packageId, options) {
    return Q.Promise(function(resolve, reject) {
      options = options || {};
      Business.getPackageById(packageId)
        .then(function(selectedPkg) {
          if (!selectedPkg) {
            return reject('pkg not found:' + packageId);
          }
          Business.findById(businessId, function(error, business) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            if (!business) {
              return reject('invalid biz id');
            }
            var update = {};
            var duration = options.duration || selectedPkg.duration;
            duration = Number(duration);
            var durationInDays =
              options.durationInDays || selectedPkg.durationInDays;
            durationInDays = Number(durationInDays);
            var selectedService = selectedPkg.service;
            if (selectedService) {
              var serviceSubscriptionDate =
                options.subscriptionDate || new Date().getTime();
              log.debug('service duration:', duration);
              var expiresAt;
              if (duration) {
                expiresAt = new Date(serviceSubscriptionDate)
                  .add({ months: duration })
                  .getTime();
              } else if (durationInDays) {
                expiresAt = new Date(serviceSubscriptionDate)
                  .add({ days: durationInDays })
                  .getTime();
              }
              log.debug('service expires at:', expiresAt);
              update.services = {
                allowedOnlineUsers:
                  options.allowedOnlineUsers ||
                  selectedService.allowedOnlineUsers,
                subscriptionDate: serviceSubscriptionDate,
                expiresAt: expiresAt,
                duration: duration,
                durationInDays: durationInDays
              };
            }
            var selectedModules = selectedPkg.modules;
            if (selectedModules) {
              var modules = business.modules;
              underscore.each(selectedModules, function(module, moduleId) {
                var modSubscriptionDate =
                  options.subscriptionDate || new Date().getTime();
                var modExpiresAt;
                log.debug('module duration ', duration);
                if (duration) {
                  modExpiresAt = new Date(modSubscriptionDate)
                    .add({ months: duration })
                    .getTime();
                } else if (durationInDays) {
                  modExpiresAt = new Date(modSubscriptionDate)
                    .add({ days: durationInDays })
                    .getTime();
                }
                log.debug('module expires at:', modExpiresAt);
                modules[moduleId] = {
                  subscriptionDate: modSubscriptionDate,
                  expiresAt: modExpiresAt,
                  duration: duration
                };
              });
              update.modules = modules;
            }

            business.updateAttributes(update, function(error, updatedBiz) {
              if (error) {
                log.error(error);
                return reject(error);
              }
              return resolve();
            });
          });
        })
        .fail(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  };

  Business.remoteMethod('assignPackageToBusiness', {
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'packageId',
        type: 'string',
        required: true
      },
      {
        arg: 'options',
        type: 'object'
      }
    ],
    returns: { root: true }
  });

  /*Business.assignModuleToBusiness = function ( businessId, modulesItems ) {
  log.debug ( "@assignModuleToBusiness: ", businessId, modulesItems );
  return Q.Promise ( function ( resolve, reject ) {
    if ( !modulesItems || modulesItems.length == 0 ) {
      log.debug ( "no module assigned", modulesItems );
      return resolve ()
    }
    Business.findById ( businessId, function ( error, business ) {
      if ( !business ) {
        return reject ( "invalid biz id" );
      }
      var modules = business.modules || {};
      for ( var k in modulesItems ) {
        var modulesItem = modulesItems[ k ];
        var subscriptionDate = modulesItem.subscriptionDate || new Date ().getTime ();
        var duraion = modulesItem.durationInMonths;
        var expiresAt = (new Date ( subscriptionDate ).addMonths ( duraion )).getTime ();
        modules[ modulesItem.id ] = {
          id:               modulesItem.id,
          subscriptionDate: subscriptionDate,
          expiresAt:        expiresAt,
          duration:         duraion
        };
      }

      business.updateAttributes ( {
        modules: modules
      }, function ( error ) {
        if ( error ) {
          log.error ( error );
          return reject ( error );
        }
        return resolve ();
      } )

    } )
  } )
};*/

  /*
  Business.remoteMethod ( 'assignModuleToBusiness', {
    accepts: [
      {
        arg:        'businessId',
        type:       'string',
        'required': true
      },
      {
        arg:        'moduleItem',
        type:       'array',
        'required': true
      }
    ],
    returns: { root: true }
  } );*/

  Business.buyCredit = function(rialPrice, ctx) {
    var Invoice = app.models.Invoice;
    var SystemConfig = app.models.SystemConfig;
    var issueDate = new Date().getTime();
    var businessId = ctx.currentUserId;
    return Q.Promise(function(resolve, reject) {
      SystemConfig.isLocal()
        .then(function(isLocal) {
          if (isLocal) {
            utility
              .getSystemUuid(config.SYSTEM_ID_PATH)
              .then(function(systemUuid) {
                auth
                  .loginToLicenseServer(config.CONFIG_SERVER_LOGIN)
                  .then(function(authResult) {
                    var token = authResult.token;
                    var providerId = authResult.userId;
                    needle.post(
                      config.CONFIG_SERVER_CHARGE_SMS.replace('{token}', token),
                      {
                        systemUuid: systemUuid,
                        providerId: providerId,
                        returnUrl: config.BUY_LOCAL_SMS_CHARGE_RETURN(),
                        price: rialPrice
                      },
                      { json: true },
                      function(error, response, body) {
                        if (error) {
                          log.error(error);
                          return reject(error);
                        }
                        if (response.statusCode !== 200) {
                          return reject(response.body);
                        }
                        return resolve({ url: body.url });
                      }
                    );
                  })
                  .fail(function(error) {
                    log.error(error);
                    return reject(new Error('failed to authenticate'));
                  });
              })
              .fail(function(error) {
                log.error(error);
                return reject(new Error('failed to load systemid'));
              });
          } else {
            var price = rialPrice / 10;
            Invoice.create(
              {
                price: price,
                payed: false,
                invoiceType: config.BUY_CHARGE,
                issueDate: issueDate,
                businessId: businessId
              },
              function(error, invoice) {
                if (error) {
                  log.error('invoice create error:', error);
                  return reject(error);
                }
                var invoiceId = invoice.id;
                var returnUrl = config
                  .CHARGE_PAYMENT_RETURN_URL()
                  .replace('{0}', 'invoiceId')
                  .replace('{1}', invoiceId);
                log.debug(returnUrl);
                Payment.openPaymentGateway(
                  config.PAYMENT_API_KEY,
                  price,
                  config.PAYMENT_GATEWAY_DEFAULT_DESC,
                  config.PAYMENT_SUPPORT_EMAIL,
                  config.PAYMENT_SUPPORT_MOBILE,
                  returnUrl
                )
                  .then(function(response) {
                    var url = response.url;
                    var paymentId = response.paymentId;
                    invoice.updateAttributes({ paymentId: paymentId }).then(
                      function() {
                        return resolve({ url: url });
                      },
                      function(error) {
                        log.error('invoice update error:', error);
                        log.error(error);
                        return reject(error);
                      }
                    );
                  })
                  .fail(function(error) {
                    log.error('failed to open payment gateway');
                    log.error(error);
                    return reject(error);
                  });
              }
            );
          }
        })
        .fail(function(error) {
          return reject(error);
        });
    });
  };

  Business.remoteMethod('buyCredit', {
    description: 'payment by business',
    accepts: [
      {
        arg: 'rialPrice',
        type: 'number',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.observe('loaded', function(ctx, next) {
    //Set the default configs
    if (ctx.data) {
      Business.getCurrentService(ctx.data)
        .then(function(currentService) {
          ctx.data.services = currentService;
          Business.getModules(ctx.data)
            .then(function(modules) {
              ctx.data.modules = modules;
              //Check if business has a selected theme
              var themeId = ctx.data.selectedThemeId;
              var themeConfig = extend({}, ctx.data.themeConfig);
              var oldThemeConfig = extend({}, themeConfig[themeId]);
              var serviceId = ctx.data.services.id;
              if (!ctx.data.selectedThemeId) {
                themeId = config.DEFAULT_THEME_ID;
                themeConfig[themeId] = extend({}, returnThemeConfig(themeId));
              } else if (
                ctx.data.selectedThemeId === config.PREVIOUS_DEFAULT_THEME_ID
              ) {
                themeId = config.DEFAULT_THEME_ID;
                themeConfig[themeId] = extend(
                  {},
                  returnThemeConfig(themeId, oldThemeConfig, serviceId)
                );
              } else if (
                ctx.data.selectedThemeId === config.PREVIOUS_HOTEL_THEME_ID
              ) {
                themeId = config.HOTEL_THEME_ID;
                themeConfig[themeId] = extend(
                  {},
                  returnThemeConfig(themeId, oldThemeConfig, serviceId)
                );
              } else if (!hotspotTemplates[ctx.data.selectedThemeId]) {
                themeId = config.DEFAULT_THEME_ID;
                themeConfig[themeId] = extend(
                  {},
                  returnThemeConfig(themeId, oldThemeConfig, serviceId)
                );
              }
              ctx.data.selectedThemeId = themeId;
              ctx.data.groupMemberHelps = ctx.data.groupMemberHelps || {};
              ctx.data.themeConfig = themeConfig;
              ctx.data.nasSharedSecret =
                ctx.data.nasSharedSecret || config.PRIMARY_SHARED_SECRET;
              ctx.data.newNasSharedSecret = config.PRIMARY_SHARED_SECRET;
              ctx.data.passwordText = '#$*%&#$*%^(#$*&%(*#$%*&';
              return next();
            })
            .fail(function(error) {
              log.error(error);
              return next(error);
            });
        })
        .fail(function(error) {
          log.error(error);
          return next(error);
        });
    } else {
      return next();
    }

    function returnThemeConfig(themeId, oldThemeConfig, serviceId) {
      //we check for premium service
      if (serviceId && serviceId === 'premium' && oldThemeConfig) {
        var newThemeConfig = {
          style: hotspotTemplates[themeId].styles[0].id,
          showLogo: oldThemeConfig.showLogo || true,
          logo: oldThemeConfig.logo || {},
          background: oldThemeConfig.background || {},
          isMultiLanguage: themeId === config.HOTEL_THEME_ID,
          showPinCode: false,
          showTelegram: oldThemeConfig.showTelegram || false,
          telegram: oldThemeConfig.telegram || null,
          showInstagram: oldThemeConfig.showTelegram || false,
          instagram: oldThemeConfig.instagram || null,
          verificationMethod: 'mobile',
          formConfig: hotspotTemplates[themeId].formConfig
        };
        if (oldThemeConfig.formConfig) {
          for (var i = 0; i < newThemeConfig.formConfig.length; i++) {
            for (var j = 0; j < oldThemeConfig.formConfig.length; j++) {
              if (
                newThemeConfig.formConfig[i].label ===
                oldThemeConfig.formConfig.label
              ) {
                newThemeConfig.formConfig[i].active =
                  oldThemeConfig.formConfig[j].active;
                newThemeConfig.formConfig[i].required =
                  oldThemeConfig.formConfig[j].required;
              }
            }
          }
        }
        return newThemeConfig;
      } else {
        return config.DEFAULT_THEME_CONFIG[config.DEFAULT_THEME_ID];
      }
    }
  });

  Business.verifyBuyPackage = function(invoiceId) {
    return Q.Promise(function(resolve, reject) {
      var Reseller = app.models.Reseller;
      var Invoice = app.models.Invoice;
      var Charge = app.models.Charge;
      var Business = app.models.Business;
      var returnUrl = config.BUSINESS_PAYMENT_RESULT_URL();
      if (!invoiceId) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No invoice id')
        });
      }
      Invoice.findById(invoiceId, function(error, invoice) {
        if (error) {
          log.error(error);
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Error in finding invoice')
          });
        }
        if (!invoice) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid invoice id')
          });
        }
        log.debug(invoice);
        var businessId = invoice.businessId;
        var paymentId = invoice.paymentId;
        var price = invoice.price;
        var invoiceType = invoice.invoiceType;
        Payment.verifyPayment(config.PAYMENT_API_KEY, paymentId, price)
          .then(function(result) {
            log.debug(result);
            if (!result.payed) {
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=Payment failed')
              });
            }

            Business.findById(businessId, function(error, business) {
              if (error) {
                log.error(error);
                return resolve({
                  code: 302,
                  returnUrl: returnUrl
                    .replace('{0}', 'false')
                    .replace('{1}', '&error=Error in finding business')
                });
              }
              if (!business) {
                return resolve({
                  code: 302,
                  returnUrl: returnUrl
                    .replace('{0}', 'false')
                    .replace('{1}', '&error=Invalid business id')
                });
              }

              var refId = result.refId;
              Charge.addCharge({
                businessId: businessId,
                type: config.BUY_SERVICE_CHARGE,
                amount: price,
                forThe: refId + ':' + invoice.paymentId + ':' + invoiceType,
                date: new Date().getTime()
              });
              invoice.updateAttributes(
                {
                  payed: true,
                  paymentRefId: refId,
                  paymentDate: new Date().getTime()
                },
                function(error) {
                  if (error) {
                    log.error(error);
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'false')
                        .replace(
                          '{1}',
                          '&error=Error in update invoice with payment reference Id'
                        )
                    });
                  }

                  var packageId = invoice.packageId;
                  // assign service to business
                  Business.assignPackageToBusiness(businessId, packageId)
                    .then(function() {
                      Business.getPackageById(packageId)
                        .then(function(selectedPackage) {
                          Charge.addCharge({
                            businessId: businessId,
                            type: config.BUY_SERVICE_CHARGE,
                            amount: price * -1,
                            forThe: selectedPackage.title,
                            date: new Date().getTime()
                          });

                          //add credit for business reseller
                          if (business.resellerId) {
                            Reseller.addResellerCommission(
                              business.resellerId,
                              businessId,
                              invoice.price
                            )
                              .then(function() {
                                log.debug('Reseller commission added ');
                              })
                              .fail(function(error) {
                                log.error(error);
                                utility.sendMessage(error, {
                                  type: 'FailedToAddResellerCommission',
                                  resellerId: business.resellerId,
                                  businessId: businessId
                                });
                              });
                          }
                          return resolve({
                            code: 302,
                            returnUrl: returnUrl
                              .replace('{0}', 'true')
                              .replace('{1}', '&desc=success')
                          });
                        })
                        .fail(function(error) {
                          log.error(error);
                          return resolve({
                            code: 302,
                            returnUrl: returnUrl
                              .replace('{0}', 'false')
                              .replace(
                                '{1}',
                                '&error=Error in update business with packageId'
                              )
                          });
                        });
                    })
                    .fail(function(error) {
                      log.error(error);
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update business with packageId'
                          )
                      });
                    });
                }
              );
            });
          })
          .fail(function(error) {
            log.error(error);
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=Error in verifying payment')
            });
          });
      });
    });
  };
  Business.verifyBuyCredit = function(invoiceId) {
    return Q.Promise(function(resolve, reject) {
      var Invoice = app.models.Invoice;
      var Charge = app.models.Charge;
      var Business = app.models.Business;
      var returnUrl = config.BUSINESS_PAYMENT_RESULT_URL();
      if (!invoiceId) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No invoice id')
        });
      }
      Invoice.findById(invoiceId, function(error, invoice) {
        if (error) {
          log.error(error);
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Error in finding invoice')
          });
        }
        if (!invoice) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid invoice id')
          });
        }
        log.debug(invoice);
        var businessId = invoice.businessId;
        var paymentId = invoice.paymentId;
        var price = invoice.price;
        var invoiceType = invoice.invoiceType;
        Payment.verifyPayment(config.PAYMENT_API_KEY, paymentId, price)
          .then(function(result) {
            log.debug(result);
            if (result.payed) {
              Business.findById(businessId, function(error, business) {
                if (error) {
                  log.error(error);
                  return resolve({
                    code: 302,
                    returnUrl: returnUrl
                      .replace('{0}', 'false')
                      .replace('{1}', '&error=Error in finding business')
                  });
                }
                if (!business) {
                  return resolve({
                    code: 302,
                    returnUrl: returnUrl
                      .replace('{0}', 'false')
                      .replace('{1}', '&error=Invalid business id')
                  });
                }

                var refId = result.refId;
                log.debug('sending resolve updating');
                invoice.updateAttributes(
                  {
                    payed: true,
                    paymentRefId: refId,
                    paymentDate: new Date().getTime()
                  },
                  function(error) {
                    if (error) {
                      log.error(error);
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update invoice with payment reference Id'
                          )
                      });
                    }
                    Charge.addCharge({
                      businessId: businessId,
                      type: config.BUY_CHARGE,
                      notifyOwner: business.mobile,
                      amount: price,
                      forThe:
                        refId + ':' + invoice.paymentId + ':' + invoiceType,
                      date: new Date().getTime()
                    });
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'true')
                        .replace('{1}', '&desc=success')
                    });
                  }
                );
              });
            } else {
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=Payment failed')
              });
            }
          })
          .fail(function(error) {
            log.error(error);
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=Error in verifying payment')
            });
          });
      });
    });
  };

  Business.adminChargeCredit = function(businessId, rialPrice, cb) {
    var Invoice = app.models.Invoice;
    var Charge = app.models.Charge;
    var issueDate = new Date().getTime();
    var paymentDate = new Date().getTime();
    var price = rialPrice / 10;

    Invoice.create(
      {
        price: price,
        payed: true,
        invoiceType: config.ADMIN_CHARGE,
        issueDate: issueDate,
        paymentDate: paymentDate,
        businessId: businessId
      },
      function(error, invoice) {
        if (error) {
          log.error('@adminPayment, invoice create error:', error);
          return cb && cb(error);
        }

        Business.findById(businessId, function(error, business) {
          if (error) {
            log.error('@adminPayment, error in finding business:', error);
            return cb && cb(error);
          }
          if (!business) {
            log.error('@adminPayment, Invalid business id');
            return cb && cb('Invalid business id');
          }
          Charge.addCharge({
            businessId: businessId,
            type: config.ADMIN_CHARGE,
            amount: price,
            notifyOwner: business.mobile,
            forThe: config.ADMIN_CHARGE,
            date: new Date().getTime()
          });

          log.debug('@adminPayment, smsCharge', price);
          return cb && cb(null, invoice);
        });
      }
    );
  };

  Business.remoteMethod('adminChargeCredit', {
    description: 'payment by admin',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'rialPrice',
        type: 'number',
        required: true
      }
    ],
    returns: { root: true }
  });

  Business.getBalance = function(businessId, ctx, cb) {
    log.debug('@getProfileBalance');
    var SystemConfig = app.models.SystemConfig;
    SystemConfig.isLocal()
      .then(function(isLocal) {
        if (isLocal) {
          utility
            .getSystemUuid(config.SYSTEM_ID_PATH)
            .then(function(systemUuid) {
              auth
                .loginToLicenseServer(config.CONFIG_SERVER_LOGIN)
                .then(function(authResult) {
                  var token = authResult.token;
                  var userId = authResult.userId;
                  log.debug(config.CONFIG_SERVER_LOCAL_CHARGE);
                  needle.post(
                    config.CONFIG_SERVER_LOCAL_CHARGE.replace('{token}', token),
                    {
                      systemUuid: systemUuid
                    },
                    { json: true },
                    function(error, response, body) {
                      if (error) {
                        log.error(error);
                        return cb(new Error('failed to load charges'));
                      }
                      log.debug('@loginToLicenseServer', body);

                      if (response.statusCode !== 200) {
                        log.error(body);
                        return cb(new Error('failed to load charges'));
                      }
                      return cb(null, { balance: body.remaincredit });
                    }
                  );
                })
                .fail(function(error) {
                  log.error(error);
                  return cb(error);
                });
            })
            .fail(function(error) {
              log.error(error);
              return cb(error);
            });
        } else {
          aggregate
            .getProfileBalance(businessId)
            .then(function(balance) {
              log.debug(balance);
              return cb(null, balance);
            })
            .fail(function(error) {
              log.error(error);
              return cb(error);
            });
        }
      })
      .fail(function(error) {
        log.error(error);
        return reject(error);
      });
  };

  Business.remoteMethod('getBalance', {
    description: 'get balance of the business',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.getTrafficUsage = function(
    startDate,
    endDate,
    offset,
    monthDays,
    ctx,
    cb
  ) {
    var businessId = ctx.currentUserId;
    startDate = startDate.toString();
    endDate = endDate.toString();
    var fromDate = Number.parseInt(startDate);
    var toDate = Number.parseInt(endDate);
    var intervalMili = config.AGGREGATE.DAY_MILLISECONDS;
    var Usage = app.models.Usage;
    Business.findById(businessId, function(error, business) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      if (!business) {
        log.error('invalid business id');
        return cb('invalid business id');
      }
      return Usage.getBusinessUsageReport(
        fromDate,
        toDate,
        businessId,
        offset,
        intervalMili,
        monthDays
      )
        .then(function(result) {
          return cb(null, result);
        })
        .fail(function(error) {
          log.error(error);
          return cb(error);
        });
    });
  };

  Business.remoteMethod('getTrafficUsage', {
    description: 'Find data for traffic usage chart from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'number',
        required: true,
        description: 'Start Date'
      },
      {
        arg: 'endDate',
        type: 'number',
        required: true,
        description: 'End Date'
      },
      {
        arg: 'offset',
        type: 'number',
        required: false,
        description: 'Time Zone'
      },
      {
        arg: 'monthDays',
        type: 'array',
        required: false,
        description: 'Days Of Month'
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { arg: 'result', type: 'object' }
  });

  Business.loadServiceInfo = function(clbk) {
    return clbk(null, serviceInfo);
  };

  Business.remoteMethod('loadServiceInfo', {
    description: 'Load business packages',
    accepts: [],
    returns: { root: true }
  });

  Business.getNetflowReport = function(
    fromDate,
    toDate,
    username,
    sourceIp,
    destinationIp,
    skip,
    limit,
    ctx,
    cb
  ) {
    log.debug('@getNetflowReport');
    var businessId = ctx.currentUserId;
    var options = {};
    options.businessId = businessId;
    options.fromDate = fromDate;
    options.toDate = toDate;
    options.username = username;
    options.sourceIp = sourceIp;
    options.destinationIp = destinationIp;
    options.skip = skip;
    options.limit = limit;
    aggregate
      .getNetflowLog(options)
      .then(function(netflowLog) {
        var result = {};
        var data = [];
        var logs = netflowLog.log;
        if (logs.length > 0) {
          for (var i = 0; i < logs.length; i++) {
            var log = logs[i]._source;
            if (log.dstGeoIp) {
              delete log.dstGeoIp;
            }
            if (log.hostGeoIp) {
              delete log.hostGeoIp;
            }
            data.push(log);
          }
        }
        result.count = netflowLog.total;
        result.data = data;
        return cb(null, result);
      })
      .fail(function(error) {
        log.error(error);
        return cb(error);
      });
  };

  Business.remoteMethod('getNetflowReport', {
    description: 'Return users internet survey ip log',
    accepts: [
      {
        arg: 'fromDate',
        type: 'number',
        required: true
      },
      {
        arg: 'toDate',
        type: 'number',
        required: true
      },
      {
        arg: 'username',
        type: 'string'
      },
      {
        arg: 'sourceIp',
        type: 'string'
      },
      {
        arg: 'destinationIp',
        type: 'string'
      },
      {
        arg: 'skip',
        type: 'number'
      },
      {
        arg: 'limit',
        type: 'number'
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.getSyslogReport = function(
    fromDate,
    toDate,
    username,
    skip,
    limit,
    ctx,
    cb
  ) {
    var businessId = ctx.currentUserId;
    log.debug('@getSyslogReport');
    var options = {};
    options.businessId = businessId;
    options.fromDate = fromDate;
    options.toDate = toDate;
    options.username = username;
    options.skip = skip;
    options.limit = limit;
    aggregate
      .getSyslog(options)
      .then(function(syslog) {
        var result = {};
        var data = [];
        var logs = syslog.log;
        if (logs.length > 0) {
          for (var i = 0; i < logs.length; i++) {
            var log = logs[i]._source;
            if (log.hostGeoIp) {
              delete log.hostGeoIp;
            }
            if (log.clientGeoIp) {
              delete log.clientGeoIp;
            }
            data.push(log);
          }
        }
        result.count = syslog.total;
        result.data = data;
        return cb(null, result);
      })
      .fail(function(error) {
        log.error(error);
        return cb(error);
      });
  };

  Business.remoteMethod('getSyslogReport', {
    description: 'Return users internet survey url log',
    accepts: [
      {
        arg: 'fromDate',
        type: 'number',
        required: true
      },
      {
        arg: 'toDate',
        type: 'number',
        required: true
      },
      {
        arg: 'username',
        type: 'string'
      },
      {
        arg: 'skip',
        type: 'number'
      },
      {
        arg: 'limit',
        type: 'number'
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.getResellerMobile = function(businessId, cb) {
    log.debug('@getResellerMobile');
    if (!businessId) {
      log.error('invalid business id');
      return cb('invalid business id');
    }
    Business.findById(businessId, function(error, business) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      if (!business) {
        return cb('business not found');
      }
      var resellerId = business.resellerId;
      var Reseller = app.models.Reseller;
      Reseller.findOne(
        {
          where: {
            id: resellerId
          },
          fields: {
            mobile: true
          }
        },
        function(error, reseller) {
          if (error) {
            log.error(error);
            return cb(error);
          }
          if (!reseller) {
            log.error('reseller not found');
            return cb('reseller not found');
          }
          return cb(null, reseller);
        }
      );
    });
  };

  Business.remoteMethod('getResellerMobile', {
    description: 'Get Reseller Mobile Number of Business',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      }
    ],
    returns: { root: true }
  });

  Business.hasValidSubscription = function(business) {
    return Q.Promise(function(resolve, reject) {
      if (!business || !business.services) {
        return reject('business is empty or has no service');
      }
      var services = business.services;
      /*var totalDurationInMonths = services.duration;
if ( totalDurationInMonths <= 0 || !totalDurationInMonths ) {
  log.warn ( 'business service has no duration', totalDurationInMonths );
  return reject ( 'business service has no duration' );
}*/
      var businessId = business.id;
      var now = new Date();
      var fromDate = new Date(services.subscriptionDate);
      var endDate = new Date(services.expiresAt);
      //endDate.addMonths ( totalDurationInMonths );
      //endDate.addDays ( config.THRESHOLD_BEFORE_BLOCKING_SERVICE_IN_DAYS );
      if (now.between(fromDate, endDate)) {
        log.warn(
          'This business has valid subscription ',
          business.title,
          businessId
        );
        return resolve(true);
      } else {
        return reject('expired subscription');
      }
    });
  };

  Business.remoteMethod('hasValidSubscription', {
    description: 'Check if business has valid subscription',
    accepts: [
      {
        arg: 'business',
        type: 'Object',
        required: true
      }
    ],
    returns: { root: true }
  });

  Business.getPackages = function() {
    return Q.Promise(function(resolve, reject) {
      var SystemConfig = app.models.SystemConfig;
      SystemConfig.isLocal().then(function(isLocal) {
        if (isLocal) {
          needle.post(
            config.CONFIG_SERVER_LOCAL_MODULES,
            {},
            { json: true },
            function(error, response, body) {
              if (error) {
                log.error(error);
                return reject(error);
              }
              if (response.statusCode !== 200) {
                return reject('failed to load pkgs');
              }
              return resolve(body.packages);
            }
          );
        } else {
          return resolve(config.SERVICES.packages);
        }
      });
    });
  };
  Business.loadServices = function(cb) {
    Business.getPackages()
      .then(function(pkgs) {
        return cb(null, { packages: pkgs });
      })
      .fail(function(error) {
        log.error(error);
        return cb(error);
      });
  };

  Business.remoteMethod('loadServices', {
    accepts: [],
    returns: { root: true }
  });

  Business.loadResellersPackages = function(cb) {
    return cb(null, config.RESELLERS_TARIFFS);
  };

  Business.remoteMethod('loadResellersPackages', {
    accepts: [],
    returns: { root: true }
  });

  Business.resetPasswordByAdmin = function(businessId, password) {
    return Q.Promise(function(resolve, reject) {
      if (!businessId) {
        return reject('biz id is empty');
      }
      password = password || utility.createRandomLongNumericalPassword();
      Business.findById(businessId, function(error, business) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!business) {
          return reject('biz not found');
        }
        business.updateAttributes(
          {
            password: password
          },
          function(error) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            smsModule.send({
              token1: business.username,
              token2: password,
              mobile: business.mobile,
              template: config.PASSWORD_RESET_TEMPLATE
            });
            return resolve({ password: password });
          }
        );
      });
    });
  };

  Business.remoteMethod('resetPasswordByAdmin', {
    description: '',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'password',
        type: 'string'
      }
    ],
    returns: { root: true }
  });

  Business.makeBackup = function(ctx) {
    return Q.Promise(function(resolve, reject) {
      var businessId = ctx.currentUserId;
      Business.findById(businessId, function(error, business) {
        if (error) {
          return reject(error);
        }

        var Member = app.models.Member;
        var InternetPlan = app.models.InternetPlan;
        var MemberGroup = app.models.MemberGroup;
        var tasks = [];
        var numberOfMembers = 10000;
        var partitionSize = 100;
        var numberOfTaskPartitions = Math.ceil(numberOfMembers / partitionSize);
        if (!businessId) {
          return reject('invalid biz id');
        }
        for (var i = 0; i <= numberOfTaskPartitions; i++) {
          tasks.push(
            (function(j) {
              return function(result) {
                return Member.find({
                  where: {
                    businessId: businessId
                  },
                  skip: j * partitionSize,
                  limit: partitionSize
                }).then(function(members) {
                  members.forEach(function(member) {
                    member.passwordText = utility.decrypt(
                      member.passwordText,
                      config.ENCRYPTION_KEY
                    );
                    member.internetPlanHistory = [];
                    result.push(member);
                  });
                  return result;
                });
              };
            })(i)
          );
        }
        var result = Q([]);
        tasks.forEach(function(f) {
          result = result.then(f);
        });
        result
          .then(function(members) {
            InternetPlan.find({ where: { businessId: businessId } })
              .then(function(internetPlans) {
                MemberGroup.find({ where: { businessId: businessId } })
                  .then(function(memberGroups) {
                    return resolve({
                      groupMemberCounter: business.groupMemberCounter,
                      memberGroups: memberGroups || [],
                      memberGroupsSize: memberGroups.length || 0,
                      members: members || [],
                      membersSize: members.length || 0,
                      internetPlans: internetPlans || [],
                      internetPlansSize: internetPlans.length || 0
                    });
                  })
                  .catch(function(error) {
                    return reject(error);
                  });
              })
              .catch(function(error) {
                return reject(error);
              });
          })
          .fail(function(error) {
            return reject(error);
          });
      });
    });
  };

  Business.remoteMethod('makeBackup', {
    http: { verb: 'get' },
    accepts: [{ arg: 'options', type: 'object', http: 'optionsFromRequest' }],
    returns: { root: true }
  });

  Business.restoreBackupFromApi = function(url, ctx) {
    return Q.Promise(function(resolve, reject) {
      if (!url) {
        return reject('invalid api address');
      }
      needle.get(url, { json: true }, function(error, response, body) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!body) {
          return reject('invalid response, empty body');
        }
        Business.restoreBackup(body, ctx)
          .then(function(result) {
            return resolve(result);
          })
          .fail(function(error) {
            log.error(error);
            return reject(error);
          });
      });
    });
  };

  Business.remoteMethod('restoreBackupFromApi', {
    accepts: [
      {
        arg: 'url',
        type: 'string',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.restoreBackup = function(backup, ctx) {
    var businessId = ctx.currentUserId;
    var Member = app.models.Member;
    var InternetPlan = app.models.InternetPlan;
    var MemberGroup = app.models.MemberGroup;

    return Q.Promise(function(resolve, reject) {
      var createMemberGroupTasks = [];
      backup.memberGroups.forEach(function(memberGroup) {
        createMemberGroupTasks.push(
          (function(memberGroupId) {
            return function(memberGroupDic) {
              memberGroup.businessId = businessId;
              delete memberGroup.id;
              log.debug('go add memberGroup', memberGroup);
              return MemberGroup.create(memberGroup).then(function(
                createdMemberGroup
              ) {
                memberGroupDic[memberGroupId] = createdMemberGroup.id;
                return memberGroupDic;
              });
            };
          })(memberGroup.id)
        );
      });

      var memberGroupResult = Q({});
      createMemberGroupTasks.forEach(function(f) {
        memberGroupResult = memberGroupResult.then(f);
      });
      memberGroupResult
        .then(function(memberGroupCreateResult) {
          var createInternetPlanTasks = [];
          backup.internetPlans.forEach(function(internetPlan) {
            createInternetPlanTasks.push(
              (function(internetPlanId) {
                return function(internetPlanDic) {
                  internetPlan.businessId = businessId;
                  delete internetPlan.id;
                  log.debug('go add ip', internetPlan);
                  return InternetPlan.create(internetPlan).then(function(
                    createdInternetPlan
                  ) {
                    internetPlanDic[internetPlanId] = createdInternetPlan.id;
                    return internetPlanDic;
                  });
                };
              })(internetPlan.id)
            );
          });

          var internetPlanResult = Q({});
          createInternetPlanTasks.forEach(function(f) {
            internetPlanResult = internetPlanResult.then(f);
          });
          internetPlanResult
            .then(function(createInternetPlanResult) {
              var createMembersTasks = [];
              backup.members.forEach(function(member) {
                createMembersTasks.push(
                  (function() {
                    return function() {
                      var options = {
                        businessId: businessId,
                        active: member.active,
                        sendVerificationSms: false,
                        internetPlanHistory: [],
                        internetPlanId:
                          createInternetPlanResult[member.internetPlanId],
                        groupIdentity: member.groupIdentity,
                        groupIdentityId:
                          memberGroupCreateResult[member.groupIdentityId],
                        groupIdentityType: member.groupIdentityType,
                        username: member.username.split('@')[0],
                        password: member.passwordText
                      };
                      log.debug('go add member', options);
                      return Member.createNewMember(options, businessId);
                    };
                  })()
                );
              });

              var memberResult = Q({});
              createMembersTasks.forEach(function(f) {
                memberResult = memberResult.then(f);
              });
              memberResult
                .then(function() {
                  Business.findById(businessId)
                    .then(function(business) {
                      business.updateAttributes(
                        {
                          groupMemberCounter:
                            backup.groupMemberCounter ||
                            config.BUSINESS_GROUP_MEMBER_COUNTER_START
                        },
                        function(error) {
                          if (error) {
                            return reject(error);
                          }
                          return resolve({ ok: true });
                        }
                      );
                    })
                    .catch(function(error) {
                      return reject(error);
                    });
                })
                .fail(function(error) {
                  return reject(error);
                });
            })
            .fail(function(error) {
              return reject(error);
            });
        })
        .fail(function(error) {
          return reject(error);
        });
    });
  };

  Business.remoteMethod('restoreBackup', {
    accepts: [
      {
        arg: 'backup',
        type: 'object',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.isMoreSessionAllowed = function(businessId) {
    var ClientSession = app.models.ClientSession;
    var SystemConfig = app.models.SystemConfig;
    return Q.Promise(function(resolve, reject) {
      if (!businessId) {
        return reject('invalid business id');
      }
      Business.findById(businessId, function(error, business) {
        if (error) {
          log.error('failed to query business', error);
          return reject(error);
        }
        SystemConfig.isLocal()
          .then(function(isLocal) {
            var query;
            if (isLocal) {
              query = {};
            } else {
              query = {
                where: {
                  businessId: businessId
                }
              };
            }
            ClientSession.find(query, function(error, sessions) {
              if (error) {
                log.error('failed to query sessions', error);
                return reject(error);
              }
              var concurrentSession = sessions.length;
              var currentService = business.services;
              if (concurrentSession <= currentService.allowedOnlineUsers) {
                return resolve({ ok: true });
              } else {
                log.error('no more session allowed:', sessions.length);
                return resolve({ ok: false });
              }
            });
          })
          .fail(function(error) {
            log.error('check isLocal error', error);
            return reject(error);
          });
      });
    });
  };

  Business.destroyMembersById = function(memberIds, ctx) {
    return Q.promise(function(resolve, reject) {
      var businessId = ctx.currentUserId;
      log.error(ctx);
      log.error('businessId:', businessId);
      log.error('memberIds:', memberIds);
      var Member = app.models.Member;
      log.debug('@destroyMembersById');
      if (!businessId) {
        return reject('invalid businessId');
      }
      if (!memberIds || memberIds.length == 0) {
        return reject('invalid array of members');
      }
      var tasks = [];
      for (var i = 0; i < memberIds.length; i++) {
        (function() {
          var memberId = memberIds[i];
          tasks.push(
            Q.Promise(function(resolve, reject) {
              Member.destroyById(memberId, { businessId: businessId }, function(
                error,
                res
              ) {
                if (error) {
                  log.error(error);
                  return reject(error);
                }
                return resolve(res);
              });
            })
          );
        })();
      }
      Q.all(tasks)
        .then(function(resultArray) {
          return resolve({ result: resultArray });
        })
        .fail(function(error) {
          return reject(error);
        });
    });
  };

  Business.remoteMethod('destroyMembersById', {
    accepts: [
      {
        arg: 'memberIds',
        type: 'array',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });

  Business.dropBoxAuthorization = function(ctx, cb) {
    var businessId = ctx.currentUserId;
    var SystemConfig = app.models.SystemConfig;
    if (!businessId) {
      return cb('invalid biz id');
    }
    log.debug('@dropBoxAuthorization');
    Business.findById(businessId, function(error, business) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      if (!business) {
        return cb('invalid biz id');
      }
      var CSRFToken = businessId;
      var redirectURI = config.DROPBOX_REST_API();
      var appKey = config.DROPBOX_APP_KEY();
      var DROPBOX_AUTH_URL = config.DROPBOX_AUTHORISE_URL;
      var dropBoxAuthUrl = DROPBOX_AUTH_URL.replace('{0}', appKey)
        .replace('{1}', redirectURI)
        .replace('{2}', CSRFToken);
      return cb(null, {
        code: 302,
        returnUrl: dropBoxAuthUrl
      });
    });
  };

  Business.remoteMethod('dropBoxAuthorization', {
    accepts: [{ arg: 'options', type: 'object', http: 'optionsFromRequest' }],
    returns: { root: true }
  });

  Business.dropboxSaveToken = function(options) {
    return Q.Promise(function(resolve, reject) {
      log.debug('@dropboxSaveToken');
      var returnUrl = config.DROPBOX_AUTHORISE_RESULT_URL();
      if (!options) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No response')
        });
      }
      if (options.error && options.error === 'access_denied') {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=Access denied')
        });
      }
      if (options.error) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=Error in connecting to dropbox')
        });
      }
      var Business = app.models.Business;
      var businessId = options.state;
      var code = options.code;
      Business.findById(businessId, function(error, business) {
        if (error) {
          log.error(error);
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Error in finding business')
          });
        }
        if (!business) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid business id')
          });
        }
        request(
          {
            url: 'https://api.dropboxapi.com/1/oauth2/token',
            method: 'POST',
            form: {
              code: code,
              grant_type: 'authorization_code',
              client_id: config.DROPBOX_APP_KEY(),
              client_secret: config.DROPBOX_APP_SECRET(),
              redirect_uri: config.DROPBOX_REST_API()
            }
          },
          function(error, resp, body) {
            if (error) {
              log.error('failed to get access_token for code', code);
              log.error(error);
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=' + error)
              });
            }
            try {
              var result = JSON.parse(body);
              var access_token = result.access_token;
              var account_id = result.account_id;
              if (access_token && account_id) {
                business.updateAttributes(
                  {
                    dropboxToken: access_token,
                    dropboxAccountId: account_id
                  },
                  function(error) {
                    if (error) {
                      log.error(error);
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update business with new Dropbox token'
                          )
                      });
                    }
                    log.debug(
                      '@Dropbox token saved successfully for business: ',
                      businessId
                    );
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'true')
                        .replace('{1}', '&desc=success')
                    });
                  }
                );
              } else {
                log.error(result);
                return resolve({
                  code: 302,
                  returnUrl: returnUrl
                    .replace('{0}', 'false')
                    .replace('{1}', '&error=invalid access token or account id')
                });
              }
            } catch (error) {
              log.error(error);
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=' + error)
              });
            }
          }
        );
      });
    });
  };

  Business.createLocalInvoice = function(
    businessId,
    mobile,
    moduleId,
    duration
  ) {
    return Q.Promise(function(resolve, reject) {
      var Invoice = app.models.Invoice;
      var price = config.LOCAL_MODULES[moduleId].price * duration;
      Invoice.create(
        {
          price: price,
          payed: false,
          businessId: businessId,
          mobile: mobile,
          moduleId: moduleId,
          duration: duration,
          type: 'local',
          creationDate: new Date().getTime(),
          issueDate: new Date()
        },
        function(error, invoice) {
          if (error) {
            log.error('failed to create invoice', error);
            return reject(error);
          }
          var invoiceId = invoice.id;
          var returnUrl = config
            .LOCAL_PAYMENT_RETURN_URL()
            .replace('{0}', 'invoiceId')
            .replace('{1}', invoiceId);
          Payment.openPaymentGateway(
            config.PAYMENT_API_KEY,
            price,
            config.PAYMENT_GATEWAY_DEFAULT_DESC,
            config.PAYMENT_SUPPORT_EMAIL,
            config.PAYMENT_SUPPORT_MOBILE,
            returnUrl
          )
            .then(function(response) {
              var url = response.url;
              var paymentId = response.paymentId;
              invoice
                .updateAttributes({
                  paymentId: paymentId
                })
                .then(
                  function() {
                    return resolve({ url: url });
                  },
                  function(error) {
                    log.error('invoice update error:', error);
                    return reject(error);
                  }
                );
            })
            .fail(function(error) {
              utility.sendMessage(
                'failed to open local payment gateway not found',
                { error: error }
              );
              log.error('failed to open payment gateway');
              log.error(error);
              return reject(error);
            });
        }
      );
    });
  };

  Business.loadMembersUsernames = function(businessId) {
    var Member = app.models.Member;
    return Q.Promise(function(resolve, reject) {
      Member.find(
        {
          where: {
            and: [{ businessId: businessId }]
          },
          fields: {
            username: true,
            id: true
          }
        },
        function(error, members) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (members.length != 0) {
            members.forEach(function(member) {
              var username = member.username;
              member.username = username.split('@')[0];
            });
            return resolve(members);
          } else {
            log.error('member not found');
            return reject('member not found');
          }
        }
      );
    });
  };

  Business.remoteMethod('loadMembersUsernames', {
    description: 'load members usernames',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      }
    ],
    returns: { arg: 'members', type: 'Array' }
  });

  Business.destroyReportsById = function(reportIds, ctx) {
    return Q.promise(function(resolve, reject) {
      var businessId = ctx.currentUserId;
      log.error(ctx);
      log.error('businessId:', businessId);
      log.error('reportIds:', reportIds);
      var Report = app.models.Report;
      log.debug('@destroyReportsById');
      if (!businessId) {
        return reject('invalid businessId');
      }
      if (!reportIds || reportIds.length == 0) {
        return reject('invalid array of reports');
      }
      var tasks = [];
      for (var i = 0; i < reportIds.length; i++) {
        (function() {
          var reportId = reportIds[i];
          tasks.push(
            Q.Promise(function(resolve, reject) {
              Report.destroyById(reportId, { businessId: businessId }, function(
                error,
                res
              ) {
                if (error) {
                  log.error(error);
                  return reject(error);
                }
                return resolve(res);
              });
            })
          );
        })();
      }
      Q.all(tasks)
        .then(function(resultArray) {
          return resolve({ result: resultArray });
        })
        .fail(function(error) {
          return reject(error);
        });
    });
  };

  Business.remoteMethod('destroyReportsById', {
    accepts: [
      {
        arg: 'reportIds',
        type: 'array',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true }
  });
};
