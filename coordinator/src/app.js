require('./ping');
var lc = require('nodejs-license-file');
var config = require('./config');
var needle = require('needle');
var Q = require('q');
require('date-utils');
var redis = require('redis');
var redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST,
);
var utility = require('./modules/utility');
var authUtility = require('./modules/auth');
var logger = require('./modules/logger');
var log = logger.createLogger();
var SYSTEM_ID_PATH = process.env.SYSTEM_ID_PATH;
var redisLicenseRenew = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IP,
);
var redisLicenseLoaded = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IP,
);

const CONFIG_SERVER_LICENSE_TEMPLATE = [
  '====HOTSPOTPLUS BEGIN LICENSE====',
  '{{&licenseVersion}}',
  '{{&applicationVersion}}',
  '{{&numberOfAllowedBusiness}}',
  '{{&loadedAt}}',
  '{{&systemUuid}}',
  '{{&creationDate}}',
  '{{&expiresAt}}',
  '{{&issueDate}}',
  '{{&title}}',
  '{{&systemConfig}}',
  '{{&modules}}',
  '{{&services}}',
  '{{&scripts}}',
  '{{&serial}}',
  '=====HOTSPOTPLUS END LICENSE=====',
].join('\n');

const NodeRSA = require('node-rsa');

const pkString =
  '-----BEGIN RSA PUBLIC KEY-----\n' +
  'MIIBCgKCAQEAuVOpPgx7WngRcnPLQrdTTzQ4eaniWhchNfwlPxCbmNQuC9NLdsJ8\n' +
  '+U3ajeBJG+pQ6s/Y1ND9b6W2IJHP69h3yXr1xcV/3bNa9IALDe4v2wriUJXCcCGV\n' +
  'vC22Lwp7xGJJV+pW/em9aB1kwLFEQjr0uCzAsTZTMRBQj8FlVp0ZAQzNZXPlyDKi\n' +
  '4LpOuJLpB+bfrPcP3SywomJPiWkBPjWbi4jAx8ZtJYSu6TE/kn5HwoLh5R5pbC7C\n' +
  'vfU4IHVJlxz0MeRUGpJVInpVs1OyzVam59+Khumwq0gMiO+/nf23hHLeblBArNo/\n' +
  '6z4v0DTKP+Zh3k2l0OSXD0csUnsnq0a1nwIDAQAB\n' +
  '-----END RSA PUBLIC KEY-----\n';
const publicKey = new NodeRSA(pkString);
const KEYS_EXPIRES = 604800 * 2;
const LC_RENEW_INTERVAL = 3600 * 1000;

var LC_PATH = process.env.LC_PATH;
var fs = require('fs');

function loadLicense() {
  return Q.Promise(function(resolve, reject) {
    log.debug('loadLicense');
    var lcPath = LC_PATH + '/license';
    fs.readFile(lcPath, 'utf8', function(error, lcFileContent) {
      if (error) {
        log.error(error);
        return reject('license not found');
      }
      try {
        var decryptedLc = publicKey.decryptPublic(lcFileContent, 'utf8');
        utility
          .writeStringToFile(decryptedLc)
          .then(function(filePath) {
            fs.unlink(lcPath, () => {});
            return resolve(filePath);
          })
          .fail(function(error) {
            return reject(error);
          });
      } catch (e) {
        log.error(e);
        return reject('invalid license');
      }
    });
  });
}

function validateLicense() {
  return Q.Promise(function(resolve, reject) {
    log.debug('validateLicense');
    loadLicense()
      .then(function(licensePath) {
        utility
          .writeStringToFile(pkString)
          .then(function(publicKeyPath) {
            try {
              log.debug(lc);
              var lcData = lc.parse({
                publicKeyPath: publicKeyPath,
                licenseFilePath: licensePath,
                template: CONFIG_SERVER_LICENSE_TEMPLATE,
              });
              fs.unlink(publicKeyPath,()=>{
                log.debug('removed1');
              });
              fs.unlink(licensePath,()=>{
                log.debug('removed2');
              });
              if (lcData.valid === true) {
                log.debug('validated');
                var oneWeekBefore = new Date().removeDays(7);
                if (new Date(lcData.data.issueDate).isBefore(oneWeekBefore)) {
                  log.error('invalid license, expired');
                  return reject('error');
                }
                if (new Date(lcData.data.expiresAt).isBefore(new Date())) {
                  log.error('expires license');
                  return reject('error');
                } else {
                  if (lcData.data.modules) {
                    var modules = JSON.parse(lcData.data.modules);
                    log.debug(modules);
                    if (modules.sms && modules.sms.smsApiKey) {
                      log.debug('setting sms api key');
                      redisClient.set('SMS_API_KEY', modules.sms.smsApiKey);
                    }
                  }
                  for (var i in lcData.data) {
                    if (i !== 'scripts' && i !== 'systemConfig') {
                      (function(j) {
                        log.debug(lcData.data[j]);
                        redisClient.set(
                          j,
                          lcData.data[j],
                          'EX',
                          KEYS_EXPIRES,
                          function(error) {
                            if (error) {
                              log.error(error);
                              return reject();
                            }
                          },
                        );
                      })(i);
                    }
                  }
                  redisClient.set(
                    'SystemConfig',
                    lcData.data.systemConfig,
                    'EX',
                    KEYS_EXPIRES,
                    function(error) {
                      if (error) {
                        log.error(error);
                        return reject();
                      }
                      var scripts = JSON.parse(
                        publicKey.decryptPublic(lcData.data.scripts, 'utf8'),
                      );
                      var methods = scripts.scripts;
                      var methodNames = [];
                      for (var i in methods) {
                        methodNames.push(i);
                        redisClient.set(
                          'sc_' + i,
                          methods[i],
                          'EX',
                          KEYS_EXPIRES,
                          function(error) {
                            if (error) {
                              log.error(error);
                              return reject();
                            }
                          },
                        );
                      }
                      /*log.debug ( '#########' );
								log.debug ( methodNames );*/
                      redisClient.set(
                        'methodNames',
                        JSON.stringify(methodNames),
                        'EX',
                        KEYS_EXPIRES,
                        function(error) {
                          if (error) {
                            log.error(error);
                            return reject();
                          }
                        },
                      );
                      return resolve(lcData);
                    },
                  );
                }
              } else {
                log.error('invalid license');
                return reject('error');
              }
            } catch (error) {
              log.error(error);
              log.error(error.stack);
              log.error(error.trace);
              return reject('error');
            }
          })
          .fail(function(error) {
            log.error(error);
            return reject(error);
          });
      })
      .fail(function(error) {
        log.error(error);
        return reject(error);
      });
  });
}

/*
setInterval ( function () {
	validateLicense ();
}, LC_CHECK_INTERVAL );
*/

function renewLicense() {
  return Q.Promise(function(resolve, reject) {
    log.debug('renewLicense');
    utility
      .getSystemUuid(SYSTEM_ID_PATH)
      .then(function(systemUuid) {
        log.debug(systemUuid);
        log.debug(
          config.LICENSE_LOGIN,
          systemUuid,
          config.PASSWORD_PREFIX + utility.md5(systemUuid),
        );
        authUtility
          .loginToConfigServer(
            config.LICENSE_LOGIN,
            systemUuid,
            config.PASSWORD_PREFIX + utility.md5(systemUuid),
          )
          .then(function(authResult) {
            var token = authResult.token;
            //log.debug ( config.DOWNLOAD_LICENSE.replace ( '{token}', token ).replace ( '{systemUuid}', systemUuid ) );
            /*log.debug ( "Auth res: ", PASSWORD_PREFIX + utility.md5 ( systemUuid ) );*/
            needle.get(
              config.DOWNLOAD_LICENSE.replace('{token}', token).replace(
                '{systemUuid}',
                systemUuid,
              ),
              {
                output: LC_PATH + '/license',
                rejectUnauthorized: true,
              },
              function(error, resp, body) {
                if (error) {
                  log.error(error);
                  return reject(error);
                }
                log.debug(resp.statusCode);
                if (resp.statusCode === 403 || resp.statusCode === 401) {
                  fs.unlink(LC_PATH + '/license', function(error, cb) {
                    if (error) {
                      log.error(error);
                      return reject(error);
                    }
                    log.debug('license removed');
                    return resolve();
                  });
                } else if (resp.statusCode === 200) {
                  log.debug('renewLicense done!');
                  validateLicense();
                  redisLicenseLoaded.publish('LICENSE_RELOAD', 'true');
                  return resolve();
                } else {
                  log.warn('failed to renew license');
                  return resolve();
                }
              },
            );
          })
          .fail(function(error) {
            log.error(error);
            return reject(error);
          });
      })
      .fail(function(error) {
        log.debug(error);
        return reject(error);
      });
  });
}

renewLicense();
setInterval(function() {
  renewLicense();
}, LC_RENEW_INTERVAL);

redisLicenseRenew.on('message', function() {
  renewLicense();
});
redisLicenseRenew.subscribe('INVOICE_PAYED');
