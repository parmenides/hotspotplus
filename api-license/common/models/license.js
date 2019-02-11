'use strict';

var app = require('../../server/server');
var licenseFile = require('nodejs-license-file');
var config = require('../../server/modules/config');
var temp = require('temp');
var logger = require('../../server/modules/logger');
var log = logger.createLogger();
var utility = require('../../server/modules/utility');
var Payment = require('../../server/modules/payment');
var aggregates = require('../../server/modules/aggregates');

var PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH + '/private_key.pem';
var PUBLIC_KEY_PATH = process.env.PRIVATE_KEY_PATH + '/public_key.pem';
var NodeRSA = require('node-rsa');
var needle = require('needle');
var fs = require('fs');
var privateKey;
var Q = require('q');
var uuidv4 = require('uuid/v4');

module.exports = function(License) {
  License.validatesUniquenessOf('systemUuid');
  License.createOptionsFromRemotingContext = function(ctx) {
    var base = this.base.createOptionsFromRemotingContext(ctx);
    base.currentUserId = base.accessToken && base.accessToken.userId;
    return base;
  };
  fs.readFile(PRIVATE_KEY_PATH, 'utf8', function(error, pkContent) {
    if (error) {
      log.error('failed to load pk', log.error(error));
      return;
    }
    privateKey = new NodeRSA(pkContent);
  });

  License.registerNewLicense = function(
    mobile,
    fullName,
    title,
    serviceStatus,
    numberOfAllowedBusiness,
    apiProtocol,
    webAppAddress,
    externalApiAddress,
    hotspotAddress,
    dropBoxAppKey,
    dropBoxAppSecret
  ) {
    log.debug('@registerNewLicense');
    var systemUuid = License.createSystemUuid();
    return License.createNewLicense(
      systemUuid,
      mobile,
      fullName,
      title,
      serviceStatus,
      numberOfAllowedBusiness,
      apiProtocol,
      webAppAddress,
      externalApiAddress,
      hotspotAddress,
      dropBoxAppKey,
      dropBoxAppSecret
    ).then(function(license) {
      return {
        ok: true,
        licenseId: license.id,
        systemUuid: license.systemUuid
      };
    });
  };

  License.remoteMethod('registerNewLicense', {
    returns: [{ root: true }],
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
      },
      {
        arg: 'serviceStatus',
        type: 'string',
        required: true
      },
      {
        arg: 'numberOfAllowedBusiness',
        type: 'number',
        required: true
      },
      {
        arg: 'apiProtocol',
        type: 'string',
        required: true
      },
      {
        arg: 'webAppAddress',
        type: 'string',
        required: true
      },
      {
        arg: 'externalApiAddress',
        type: 'string',
        required: true
      },
      {
        arg: 'hotspotAddress',
        type: 'string',
        required: true
      },
      {
        arg: 'dropBoxAppKey',
        type: 'string',
        required: true
      },
      {
        arg: 'dropBoxAppSecret',
        type: 'string',
        required: true
      }
    ]
  });

  License.registerPublicLicense = function(mobile, fullName, title) {
    log.debug('@registerPublicLicense');
    return License.registerNewLicense(
      mobile,
      fullName,
      title,
      'local',
      1,
      'http',
      null,
      null,
      null,
      '',
      ''
    )
      .then(function(result) {
        return result.licenseId;
      })
      .then(function(licenseId) {
        var freePackage = License.getPackageById(config.DEFAULT_FREE_PACKAGE);
        return License.assignAccountingService(
          licenseId,
          freePackage.duration,
          freePackage.title,
          freePackage.service.allowedOnlineUsers
        )
          .then(function(result) {
            return result;
          })
          .then(function(result) {
            if (config.DEFAULT_FREE_LOG_PACKAGE) {
              var freeLogModule = License.getPackageById(
                config.DEFAULT_FREE_LOG_PACKAGE
              );
              return License.assignLogModule(
                licenseId,
                freeLogModule.duration,
                freeLogModule.title,
                new Date()
              );
            } else {
              return result;
            }
          })
          .then(function(result) {
            if (config.DEFAULT_FREE_SMS_PACKAGE) {
              var freeSmsModule = License.getPackageById(
                config.DEFAULT_FREE_SMS_PACKAGE
              );
              return License.assignSmsModule(
                licenseId,
                freeSmsModule.duration,
                freeSmsModule.title,
                null,
                new Date()
              );
            } else {
              return result;
            }
          });
      });
  };

  License.createSystemUuid = function() {
    return uuidv4();
  };

  License.getPackageById = function(packageId) {
    var pkgList = config.LOCAL_MODULES.packages;
    for (var j in pkgList) {
      var pkg = pkgList[j];
      if (pkg.id === packageId) {
        return pkg;
      }
    }
  };

  License.remoteMethod('registerPublicLicense', {
    returns: [{ root: true }],
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
    ]
  });

  License.verifyLicense = function(licenseFilePath) {
    log.debug('@verifyLicense');
    return Q.Promise(function(resolve, reject) {
      var licenseTemplate = config.LICENSE_TEMPLATE;
      var parsedLicense = licenseFile.parse({
        publicKeyPath: PUBLIC_KEY_PATH,
        licenseFilePath: licenseFilePath,
        template: licenseTemplate
      });
      if (!parsedLicense.valid) {
        log.error('invalid license!', parsedLicense);
        return reject();
      } else {
        return resolve(parsedLicense.data);
      }
    });
  };

  License.getAllLicenseScripts = function() {
    var methodNameLists = Object.keys(aggregates);
    var scripts = {};
    for (var i = 0; i < methodNameLists.length; i++) {
      var methodName = methodNameLists[i];
      scripts[methodName] = aggregates[methodName].toString();
    }
    return JSON.stringify({ scripts: scripts });
  };

  License.getSystemConfig = function(options) {
    options = options || {};
    return {
      appTitle: options.appTitle || 'هات اسپات پلاس',
      dropBoxAppSecret: options.dropBoxAppSecret || '',
      dropBoxAppKey: options.dropBoxAppKey || '',
      hotspotAddress: options.hotspotAddress,
      externalApiAddress: options.externalApiAddress,
      numberOfAllowedBusiness: options.numberOfAllowedBusiness,
      webAppAddress: options.webAppAddress,
      apiProtocol: options.apiProtocol || 'http',
      serviceStatus: options.serviceStatus || 'local',
      dontShowBuyPackages: options.dontShowBuyPackages || false,
      oneTimeLicense: options.oneTimeLicense || false,
      disableSignup: options.disableSignup || false,
      sentryUrl: process.env.SENTRY_URL,
      enableSentry: process.env.ENABLE_SENTRY,
      sentryReleaseToken: process.env.SENTRY_RELEASE_TOKEN
    };
  };

  License.createNewLicense = function(
    systemUuid,
    mobile,
    fullName,
    title,
    serviceStatus,
    numberOfAllowedBusiness,
    apiProtocol,
    webAppAddress,
    externalApiAddress,
    hotspotAddress,
    dropBoxAppKey,
    dropBoxAppSecret
  ) {
    log.debug('#createNewLicense');
    var Role = app.models.Role;
    return Q.Promise(function(resolve, reject) {
      var expiresAt = new Date();
      expiresAt.addMonths(config.DEFAULT_LICENSE_DURATION_IN_MONTHS);

      if (!config.PASSWORD_PREFIX) {
        log.error('invalid pass prefix', config.PASSWORD_PREFIX);
        return reject('invalid security prefix');
      }
      var license = {
        licenseVersion: 'v4',
        applicationVersion: '1.0.0',
        active: true,
        username: systemUuid,
        password: config.PASSWORD_PREFIX + utility.md5(systemUuid),
        email: systemUuid + '@hotspotplus.ir',
        numberOfAllowedBusiness: numberOfAllowedBusiness || 1,
        webAppAddress: webAppAddress,
        externalApiAddress: externalApiAddress,
        hotspotAddress: hotspotAddress,
        dropBoxAppKey: dropBoxAppKey || '',
        dropBoxAppSecret: dropBoxAppSecret || '',
        systemUuid: systemUuid,
        serviceStatus: serviceStatus,
        apiProtocol: apiProtocol,
        expiresAt: expiresAt.toLocaleString('fa-IR', {
          timeZone: 'Asia/Tehran'
        }),
        creationDate: new Date().toLocaleString('fa-IR', {
          timeZone: 'Asia/Tehran'
        }),
        mobile: mobile,
        fullName: fullName,
        title: title,
        modules: {},
        services: {}
      };
      License.create(license, function(error, createdLicense) {
        if (error) {
          log.error(error);
          return reject('failed to create lc');
        }
        License.assignSmsModule(createdLicense.id, 0, 'SMS Module')
          .then(function() {
            License.assignLogModule(createdLicense.id, 0, 'Log Module')
              .then(function() {
                License.assignAccountingService(
                  createdLicense.id,
                  config.DEFAULT_LICENSE_DURATION_IN_MONTHS,
                  'Accounting Module',
                  config.DEFAULT_ONLINE_USER
                )
                  .then(function() {
                    Role.findOne(
                      { where: { name: config.ROLES.LICENSE_ROLE } },
                      function(error, role) {
                        if (error) {
                          log.error(
                            'failed to load ' +
                              config.ROLES.LICENSE_ROLE +
                              ' for role assignment',
                            error
                          );
                          return reject();
                        }
                        if (!role) {
                          log.error('failed to load sp role ');
                          return reject('failed to load sp role ');
                        }
                        var roleMapping = {
                          principalType: 'USER',
                          principalId: createdLicense.id
                        };
                        role.principals.create(roleMapping, function(
                          error,
                          result
                        ) {
                          if (error) {
                            log.error('failed to assign role to sp', error);
                          }
                          log.debug('principal assigned ', result);
                          return resolve(createdLicense);
                        });
                      }
                    );
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
    });
  };

  License.downloadLicense = function(systemUuid, ctx, cb) {
    var licenseId = ctx.currentUserId;
    License.findById(licenseId, function(error, license) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      if (!license) {
        return cb(new Error('license not found'));
      }

      License.createLicenseFile(license.id)
        .then(function(result) {
          var licenseContent = result.content;
          var encryptedLicense = privateKey.encryptPrivate(
            licenseContent,
            'base64'
          );
          if (result.active === true) {
            return cb(null, encryptedLicense, 'application/octet-stream');
          } else {
            var error = new Error();
            error.message = 'Done!';
            error.status = 403;
            return cb(error);
          }
        })
        .fail(function(error) {
          log.error(error);
          return cb(error);
        });
    });
  };

  License.remoteMethod('downloadLicense', {
    http: { verb: 'get' },
    returns: [{ arg: 'body', type: 'file', root: true }],
    accepts: [
      {
        arg: 'systemUuid',
        type: 'string',
        required: true
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ]
  });

  License.createLicenseFile = function(licenseId) {
    return Q.Promise(function(resolve, reject) {
      License.findById(licenseId, function(error, license) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!license) {
          return reject('lc not found');
        }
        var licenseData = {
          title: license.title,
          licenseVersion: 'v4',//license.licenseVersion ,
          numberOfAllowedBusiness: license.numberOfAllowedBusiness,
          applicationVersion: license.applicationVersion,
          systemUuid: license.systemUuid,
          creationDate: license.creationDate,
          expiresAt: license.expiresAt,
          issueDate: new Date().getTime(),
          modules: JSON.stringify(license.modules),
          services: JSON.stringify(license.services)
        };

        licenseData.loadedAt = new Date();
        licenseData.systemConfig = JSON.stringify(
          License.getSystemConfig({
            appTitle: 'هات اسپات پلاس',
            apiProtocol: license.apiProtocol,
            serviceStatus: license.serviceStatus,
            numberOfAllowedBusiness: license.numberOfAllowedBusiness,
            webAppAddress: license.webAppAddress,
            externalApiAddress: license.externalApiAddress,
            hotspotAddress: license.hotspotAddress,
            dontShowBuyPackages: license.services.dontShowBuyPackages,
            oneTimeLicense: license.services.oneTimeLicense,
            disableSignup: license.services.disableSignup,
            dropBoxAppKey: license.dropBoxAppKey,
            dropBoxAppSecret: license.dropBoxAppSecret
          })
        );
        log.debug(licenseData.systemConfig);
        licenseData.scripts = privateKey.encryptPrivate(
          License.getAllLicenseScripts(),
          'base64'
        );
        var licenseTemplate = config.LICENSE_TEMPLATE;
        var licenseFileContent = licenseFile.generate({
          privateKeyPath: PRIVATE_KEY_PATH,
          template: licenseTemplate,
          data: licenseData
        });
        utility
          .writeStringToFile(licenseFileContent)
          .then(function(licenseFilePath) {
            License.verifyLicense(licenseFilePath)
              .then(function() {
                return resolve({
                  path: licenseFilePath,
                  content: licenseFileContent,
                  active: license.active
                });
              })
              .fail(function(error) {
                log.error(error);
                return reject('invalid lc');
              });
          })
          .fail(function(error) {
            log.error(error);
            return reject(error);
          });
      });
    });
  };

  License.createSmsCustomer = function(licenseId, forceUpdate) {
    log.debug('@createSmsCustomer');
    return Q.Promise(function(resolve, reject) {
      License.findById(licenseId, function(error, license) {
        if (error) {
          return reject(error);
        }
        if (!license) {
          return reject('lc not found');
        }
        if (
          license.modules &&
          license.modules.sms &&
          license.modules.sms.smsApiKey &&
          !forceUpdate
        ) {
          log.debug('sms api key exist, so let it be');
          return resolve(license.modules.sms.smsApiKey);
        }

        var title = license.title;
        var smsPanelCustomer = {
          localid: licenseId,
          credit: config.KAVEHNEGAR_DEFAULT_SMS_CREDIT,
          mobile: license.mobile,
          username: 'hsp_' + licenseId,
          fullname: title + '/' + license.fullName,
          password: licenseId,
          planid: config.KAVEHNEGAR_SMS_PLAN_ID,
          status: config.KAVEHNEGAR_PANEL_DEFAULT_STATUS
        };
        log.debug('Sms Customer', smsPanelCustomer);
        needle.post(config.KAVEHNEGAR_ADD_CUSTOMER, smsPanelCustomer, function(
          error,
          response,
          body
        ) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (
            response.statusCode !== 200 ||
            (body.entries && !body.entries.apikey)
          ) {
            log.error(response.statusCode);
            log.error(body);
            return reject('failed to create sms customer: ', body);
          } else {
            license.updateAttributes(
              { 'modules.sms.smsApiKey': body.entries.apikey },
              function(error) {
                if (error) {
                  log.error(error);
                  return reject(body);
                }
                return resolve(body.entries.apikey);
              }
            );
          }
        });
      });
    });
  };

  License.remoteMethod('createSmsCustomer', {
    description: 'load sms credit',
    accepts: [
      { arg: 'licenseId', type: 'string', required: true },
      { arg: 'forceUpdate', type: 'boolean' }
    ],
    returns: { root: true }
  });

  License.addLicenseLocalCharge = function(chargeInToman, licenseId) {
    var charge = {
      amount: chargeInToman,
      type: config.LICENSE_TYPE_CHARGE,
      licenseId: licenseId,
      date: new Date().getTime(),
      timestamp: new Date().getTime()
    };
    return needle('post', config.ELASTIC_LICENSE_CHARGE, charge, { json: true })
      .then(function(result) {
        log.debug('charged: ', result.body._id);
        return { ok: true };
      })
      .catch(function(error) {
        log.error(error);
        throw error;
      });
  };

  License.getPackages = function(cb) {
    return cb(null, config.LOCAL_MODULES);
  };

  License.remoteMethod('getPackages', {
    accepts: [],
    returns: { root: true }
  });

  License.buyLocalPackage = function(
    systemUuid,
    localReturnUrl,
    packageId,
    discountCoupon
  ) {
    return Q.Promise(function(resolve, reject) {
      var Invoice = app.models.Invoice;
      License.findOne({
        where: {
          systemUuid: systemUuid
        }
      })
        .then(function(license) {
          if (!license) {
            return reject(new Error('license not found'));
          }
          var pkgList = config.LOCAL_MODULES.packages;
          var selectedPackage;
          for (var j in pkgList) {
            var pkg = pkgList[j];
            if (pkg.id === packageId) {
              selectedPackage = pkg;
              break;
            }
          }
          if (!selectedPackage) {
            return reject('pkg not found');
          }
          var serviceInfo = {
            selectedPackage: selectedPackage,
            localReturnUrl: localReturnUrl
          };
          Invoice.issueInvoice(
            selectedPackage.price,
            license.id,
            config.LOCAL_PKG_INVOICE_TYPE,
            serviceInfo,
            discountCoupon
          )
            .then(function(result) {
              return resolve(result);
            })
            .catch(function(error) {
              log.error(error);
              return reject(error);
            });
        })
        .catch(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  };

  License.remoteMethod('buyLocalPackage', {
    description: 'buyService for ',
    accepts: [
      { arg: 'systemUuid', type: 'string', required: true },
      { arg: 'returnUrl', type: 'string', required: true },
      { arg: 'packageId', type: 'string', required: true },
      { arg: 'discount', type: 'object' }
    ],
    returns: { root: true }
  });

  License.verifyInvoice = function(invoiceId, httpResponse) {
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
                  paymentDate: new Date().getTime()
                },
                function(error) {
                  if (error) {
                    log.error(error);
                    return reject(error);
                  }
                  License.processInvoice(invoice.licenseId, invoice.serviceInfo)
                    .then(function() {
                      return httpResponse.redirect(
                        invoice.serviceInfo.localReturnUrl
                          .replace('{0}', true)
                          .replace('{1}', 'success')
                      );
                    })
                    .fail(function(error) {
                      log.error(error);
                      return httpResponse.redirect(
                        invoice.serviceInfo.localReturnUrl
                          .replace('{0}', false)
                          .replace('{1}', 'license_update_failed')
                      );
                    });
                }
              );
            } else {
              return httpResponse.redirect(
                invoice.serviceInfo.localReturnUrl
                  .replace('{0}', false)
                  .replace('{1}', 'not_payed')
              );
            }
          })
          .fail(function(error) {
            log.error(error);
            return httpResponse.redirect(
              invoice.serviceInfo.localReturnUrl
                .replace('{0}', false)
                .replace('{1}', 'verification_failed')
            );
          });
      });
    });
  };

  License.remoteMethod('verifyInvoice', {
    description: 'verifyInvoice',
    accepts: [
      { arg: 'invoiceId', type: 'string', required: true },
      {
        arg: 'res',
        type: 'object',
        http: function(ctx) {
          return ctx.res;
        }
      }
    ],
    returns: { root: true }
  });

  License.processInvoice = function(licenseId, serviceInfo) {
    log.debug('@processInvoice');
    return Q.Promise(function(resolve, reject) {
      License.findById(licenseId)
        .then(function(license) {
          if (!license) {
            return reject('lc not found');
          }

          var selectedPackage = serviceInfo.selectedPackage;
          var updateTasks = [];
          if (
            selectedPackage &&
            selectedPackage.modules.sms &&
            selectedPackage.modules.sms.id
          ) {
            updateTasks.push(
              License.assignSmsModule(
                license.id,
                selectedPackage.duration,
                selectedPackage.modules.sms.title
              )
            );
          }
          if (
            selectedPackage &&
            selectedPackage.modules.log &&
            selectedPackage.modules.log.id
          ) {
            updateTasks.push(
              License.assignLogModule(
                license.id,
                selectedPackage.duration,
                selectedPackage.modules.log.title
              )
            );
          }
          if (
            selectedPackage &&
            selectedPackage.service &&
            selectedPackage.service.id
          ) {
            updateTasks.push(
              License.assignAccountingService(
                license.id,
                selectedPackage.duration,
                selectedPackage.service.title,
                selectedPackage.service.allowedOnlineUsers
              )
            );
          }
          if (serviceInfo.smsCharge && serviceInfo.smsCharge.amount) {
            updateTasks.push(
              License.addLicenseCharge(license.id, serviceInfo.smsCharge.amount)
            );
          }

          Q.all(updateTasks)
            .then(function() {
              return resolve();
            })
            .fail(function(error) {
              log.error(error);
              return reject(error);
            });
        })
        .catch(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  };

  License.assignSmsModule = function(
    licenseId,
    duration,
    title,
    smsApiKey,
    subscriptionDate
  ) {
    return Q.Promise(function(resolve, reject) {
      if (!licenseId) {
        return reject('lc id is empty:', licenseId);
      }
      License.findById(licenseId, function(error, license) {
        if (error) {
          return reject(error);
        }
        if (!license) {
          return reject('lc not found');
        }
        var smsModule = license.modules.sms || {};
        smsModule.id = 'sms';
        smsModule.duration = duration;
        smsModule.smsApiKey = smsApiKey || smsModule.smsApiKey;
        smsModule.title = title;
        var sDate;
        if (subscriptionDate) {
          sDate = new Date(subscriptionDate);
        } else {
          sDate = new Date();
        }
        smsModule.subscriptionDate = sDate.getTime();
        smsModule.expiresAt = sDate.addMonths(duration).getTime();
        license.updateAttributes({ 'modules.sms': smsModule }, function(error) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          return resolve({
            ok: true,
            assign: true,
            systemUuid: license.systemUuid
          });
        });
      });
    });
  };

  License.remoteMethod('assignSmsModule', {
    description: 'assignSmsModule',
    accepts: [
      { arg: 'licenseId', type: 'string', required: true },
      { arg: 'duration', type: 'number', required: true },
      { arg: 'title', type: 'string' },
      { arg: 'smsApiKey', type: 'string' },
      { arg: 'subscriptionDate', type: 'number' }
    ],
    returns: { root: true }
  });

  License.assignLogModule = function(
    licenseId,
    duration,
    title,
    subscriptionDate
  ) {
    return Q.Promise(function(resolve, reject) {
      if (!licenseId) {
        return reject('lc id is empty:', licenseId);
      }
      License.findById(licenseId, function(error, license) {
        if (error) {
          return reject(error);
        }
        if (!license) {
          return reject('lc not found');
        }
        var logModule = license.modules.log || {};
        logModule.id = 'log';
        logModule.duration = duration;
        logModule.title = title;
        var sDate;
        if (subscriptionDate) {
          sDate = new Date(subscriptionDate);
        } else {
          sDate = new Date();
        }
        logModule.subscriptionDate = sDate.getTime();
        logModule.expiresAt = sDate.addMonths(duration).getTime();
        license.updateAttributes({ 'modules.log': logModule }, function(error) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          return resolve({
            ok: true,
            assign: true,
            systemUuid: license.systemUuid
          });
        });
      });
    });
  };

  License.remoteMethod('assignLogModule', {
    description: 'assignLogModule',
    accepts: [
      { arg: 'licenseId', type: 'string', required: true },
      { arg: 'duration', type: 'number', required: true },
      { arg: 'title', type: 'number' },
      { arg: 'subscriptionDate', type: 'number' }
    ],
    returns: { root: true }
  });

  License.assignAccountingService = function(
    licenseId,
    duration,
    title,
    allowedOnlineUsers,
    subscriptionDate,
    dontShowBuyPackages,
    oneTimeLicense,
    disableSignup
  ) {
    return Q.Promise(function(resolve, reject) {
      if (!licenseId) {
        return reject('lc id is empty:', licenseId);
      }
      License.findById(licenseId, function(error, license) {
        if (error) {
          return reject(error);
        }
        if (!license) {
          return reject('lc not found');
        }
        var services = license.services || {};
        services.id = 'economic';
        services.duration = duration;
        if (dontShowBuyPackages === true) {
          services.dontShowBuyPackages = dontShowBuyPackages;
        } else {
          services.dontShowBuyPackages = services.dontShowBuyPackages || false;
        }
        if (oneTimeLicense === true) {
          services.oneTimeLicense = oneTimeLicense;
        } else {
          services.oneTimeLicense = services.oneTimeLicense || false;
        }
        if (disableSignup === true) {
          services.disableSignup = disableSignup;
        } else {
          services.disableSignup = services.disableSignup || false;
        }
        services.allowedOnlineUsers =
          allowedOnlineUsers || config.DEFAULT_ONLINE_USER;
        services.title = title;

        var sDate;
        if (subscriptionDate) {
          sDate = new Date(subscriptionDate);
        } else {
          sDate = new Date();
        }
        services.subscriptionDate = sDate.getTime();
        services.expiresAt = sDate.addMonths(duration).getTime();

        license.updateAttributes({ services: services }, function(error) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          return resolve({
            ok: true,
            assign: true,
            systemUuid: license.systemUuid
          });
        });
      });
    });
  };

  License.remoteMethod('assignAccountingService', {
    description: 'assignAccountingService',
    accepts: [
      { arg: 'licenseId', type: 'string', required: true },
      { arg: 'duration', type: 'number', required: true },
      { arg: 'title', type: 'number' },
      { arg: 'allowedOnlineUsers', type: 'number', required: true },
      { arg: 'subscriptionDate', type: 'number', required: true },
      { arg: 'dontShowBuyPackages', type: 'boolean' },
      { arg: 'oneTimeLicense', type: 'boolean' },
      { arg: 'disableSignup', type: 'boolean' }
    ],
    returns: { root: true }
  });

  License.addLicenseCharge = function(licenseId, chargeInRial) {
    return Q.Promise(function(resolve, reject) {
      License.findById(licenseId, function(error, license) {
        if (error) {
          return reject(error);
        }
        if (!license) {
          return reject('lc not found');
        }

        if (license.modules.sms && license.modules.sms.smsApiKey) {
          var chargeRequest = {
            apikey: license.modules.sms.smsApiKey,
            credit: chargeInRial
          };
          log.debug('charge sms credit', chargeRequest);
          needle.post(
            config.KAVEHNEGAR_CHARGE_CUSTOMER_CREDIT,
            chargeRequest,
            function(error, response, body) {
              if (error) {
                log.error(error);
                return reject(error);
              }
              if (response.statusCode !== 200) {
                log.error(response.statusCode);
                log.error(body);
                return reject('failed to charge customer sms: ', body);
              } else {
                return resolve();
              }
            }
          );
        } else {
          var chargeInToman = chargeInRial / 10;
          License.addLicenseLocalCharge(chargeInToman, licenseId)
            .then(function() {
              return resolve();
            })
            .fail(function(error) {
              return reject(error);
            });
        }
      });
    });
  };
};
