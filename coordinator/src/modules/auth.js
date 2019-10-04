/**
 * Created by hamidehnouri on 9/21/2016 AD.
 */

var Q = require('q');
var needle = require('needle');
var logger = require('./logger');
var config = require('../config');
var log = logger.createLogger();
var utility = require('./utility');
/*
var API_ADDRESS = utility.getApiAddress();
var LOGIN_REST_API = API_ADDRESS + '/api/Users/login';
var LOGOUT_REST_API = API_ADDRESS + '/api/Users/logout?access_token={0}';
*/
// login to the rest api to get the access token
module.exports.serviceManLogin = function(ttlMs) {
  log.debug('service man logged in ', ttlMs);
  return login(
    process.env.SERVICE_MAN_USERNAME,
    process.env.SERVICE_MAN_PASSWORD,
    ttlMs
  );
};

var loginToConfigServer = (module.exports.loginToApi = module.exports.loginToConfigServer = function(
  configServerUrl,
  username,
  password
) {
  return Q.Promise(function(resolve, reject) {
    needle.post(
      configServerUrl,
      {
        username: username,
        password: password
      },
      { json: true },
      function(error, response, body) {
        if (error) {
          log.error('Error: ', error);
          return reject(error);
        }
        log.debug('Auth Login:', response.statusCode);
        if (response.statusCode !== 200) {
          return reject(body);
        }
        var accessToken = body.id;
        return resolve({ token: accessToken, userId: body.userId });
      }
    );
  });
});

module.exports.loginToLicenseServer = function(CONFIG_SERVER_LOGIN_URL) {
  log.debug('@loginToLicenseServer');
  return Q.Promise(function(resolve, reject) {
    utility
      .getSystemUuid(config.SYSTEM_ID_PATH)
      .then(function(systemUuid) {
        if (!systemUuid) {
          return resolve({});
        }
        log.info(systemUuid);
        loginToConfigServer(
          CONFIG_SERVER_LOGIN_URL,
          systemUuid,
          config.PASSWORD_PREFIX + utility.md5(systemUuid)
        )
          .then(function(authResult) {
            var token = authResult.token;
            var userId = authResult.userId;
            log.debug('@loginToLicenseServer', authResult);
            return resolve({ token: token, userId: userId });
          })
          .fail(function(error) {
            log.error(error);
            return reject(error);
          });
      })
      .fail(function(error) {
        log.error(error);
        return reject(new Error('failed to load systemid'));
      });
  });
};
/*

var login = (module.exports.login = function(username, password, ttlMs) {
  return Q.Promise(function(resolve, reject) {
    needle.post(
      LOGIN_REST_API,
      {
        username: username,
        password: password
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('Error: ', error);
          return reject(error);
        }
        log.debug('Auth Login:', response.statusCode);
        log.debug(response.body);
        var accessToken = response.body.id;
        if (ttlMs) {
          setTimeout(function() {
            logout(accessToken);
          }, ttlMs);
        }
        return resolve(accessToken);
      }
    );
  });
});

var logout = (module.exports.logout = function(accessToken) {
  return Q.Promise(function(resolve, reject) {
    if (!accessToken) {
      return reject('accessToken can not be empty');
    }
    needle.post(LOGOUT_REST_API.replace('{0}', accessToken), function(
      error,
      response
    ) {
      if (error) {
        log.error('logged out failed: ', error);
        return reject(error);
      }
      log.debug('logged out ');
      return resolve();
    });
  });
});
*/
