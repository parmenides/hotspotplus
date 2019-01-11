'use strict';
var app = require('../../server/server');
var config = require('../modules/config');
var utility = require('../modules/utility');
var Q = require('q');
var redis = require('redis');
var redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);
var logger = require('../modules/logger');

module.exports = function(Systemconfig) {
  var log = logger.createLogger();

  Systemconfig.isLocal = function() {
    return Systemconfig.getConfig().then(function(systemConfig) {
      if (systemConfig.serviceStatus === 'local') {
        return true;
      } else if (systemConfig.serviceStatus === 'cloud') {
        return false;
      } else {
        process.exit(1);
      }
    });
  };

  Systemconfig.getConfig = function() {
    return Q.Promise(function(resolve, reject) {
      redisClient.get('SystemConfig', function(error, systemConfig) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!systemConfig) {
          return resolve(config.DEFAULT_SYSTEM_CONFIG);
        }
        try {
          systemConfig = JSON.parse(systemConfig);
          process.env.CALCULATED_WEB_APP_ADDRESS =
            systemConfig.webAppAddress || process.env.EXTRACTED_WEB_APP_ADDRESS;
          process.env.CALCULATED_EXTERNAL_API_ADDRESS =
            systemConfig.externalApiAddress ||
            process.env.EXTRACTED_EXTERNAL_API_ADDRESS;
          process.env.CALCULATED_HOTSPOT_ADDRESS =
            systemConfig.hotspotAddress ||
            process.env.EXTRACTED_HOTSPOT_ADDRESS;
          //set env
          process.env.DROPBOX_APP_SECRET = systemConfig.dropBoxAppSecret;
          process.env.DROPBOX_APP_KEY = systemConfig.dropBoxAppKey;

          redisClient.get('numberOfAllowedBusiness', function(
            error,
            numberOfAllowedBusiness,
          ) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            systemConfig.numberOfAllowedBusiness =
              Number(numberOfAllowedBusiness) || 1;
            return resolve(systemConfig);
          });
        } catch (error) {
          log.error(error);
          return resolve(config.DEFAULT_SYSTEM_CONFIG);
        }
      });
    });
  };

  Systemconfig.getService = function() {
    log.debug('@getService');
    return Q.Promise(function(resolve, reject) {
      redisClient.get('services', function(error, currentService) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!currentService) {
          return resolve({});
        }
        try {
          log.debug(currentService);
          return resolve(JSON.parse(currentService));
        } catch (error) {
          log.error(error);
          return reject(error);
        }
      });
    });
  };
  Systemconfig.getModules = function() {
    return Q.Promise(function(resolve, reject) {
      redisClient.get('modules', function(error, modules) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!modules) {
          return resolve({});
        }
        try {
          log.debug(modules);
          return resolve(JSON.parse(modules));
        } catch (error) {
          log.error(error);
          return reject(error);
        }
      });
    });
  };
};
