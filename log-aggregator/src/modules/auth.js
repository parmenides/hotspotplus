/**
 * Created by hamidehnouri on 9/21/2016 AD.
 */

var Q = require('q');
var needle = require('needle');
var logger = require('./logger');
var log = logger.createLogger();
var utility = require('./utility');
var API_ADDRESS = utility.getApiAddress();
var LOGIN_REST_API = API_ADDRESS + '/api/Users/login';
var LOGOUT_REST_API = API_ADDRESS + '/api/Users/logout?access_token={0}';
// login to the rest api to get the access token
module.exports.serviceManLogin = function(ttlMs) {
  log.debug('service man logged in ', ttlMs);
  return login(
    process.env.SERVICE_MAN_USERNAME,
    process.env.SERVICE_MAN_PASSWORD,
    ttlMs,
  );
};

var login = (module.exports.login = function(username, password, ttlMs) {
  return Q.Promise(function(resolve, reject) {
    needle.post(
      LOGIN_REST_API,
      {
        username: username,
        password: password,
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
      },
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
      response,
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
