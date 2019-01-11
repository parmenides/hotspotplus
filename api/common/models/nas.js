var logger = require('../../server/modules/logger');
var app = require('../../server/server');
var utility = require('../../server/modules/utility');
var temp = require('temp').track();
var fs = require('fs');
var config = require('../../server/modules/config');
var Q = require('q');
var redis = require('redis');
var redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);
var hotspotMessages = require('../../server/modules/hotspotMessages');
var hotspotTemplates = require('../../server/modules/hotspotTemplates');

module.exports = function(Nas) {
  Nas.validatesUniquenessOf('nasIpPortKey');
  var log = logger.createLogger();

  Nas.observe('loaded', function(ctx, next) {
    if (ctx.data) {
      if (ctx.data.accessPointType) {
        ctx.data.accessPointType = ctx.data.accessPointType.toLowerCase();
      }
    }
    next();
  });

  Nas.loadNasByRadiusRequest = function(radiusRequest) {
    var nasId = radiusRequest.getNasId();
    var nasIp = radiusRequest.getNasIp();

    return Q.Promise(function(resolve, reject) {
      if (!nasId && !nasIp) {
        return reject('both nas ip and nas ids are empty');
      }
      if (nasId) {
        Nas.findById(nasId, function(error, nas) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (!nas) {
            log.warn('Nas by nas id not found');
            var nasCalledStationId = radiusRequest.getCalledStationIdAsNasId();
            if (nasCalledStationId) {
              Nas.findById(nasCalledStationId, function(error, nas) {
                if (error) {
                  log.error(error);
                  return reject(error);
                }
                if (!nas) {
                  log.warn('Nas by called station id not found');
                  return reject('invalid nas id');
                }
                return resolve(nas);
              });
            } else {
              log.warn('Nas not found');
              return reject('invalid nas id');
            }
          } else {
            return resolve(nas);
          }
        });
      } else if (nasIp) {
        redisClient.get(nasIp, function(error, reply) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (!reply) {
            return reject('nas by ip not found:', nasIp);
          }
          var businessData = JSON.parse(reply);
          var nasId = businessData.nasId;
          Nas.findById(nasId, function(error, nas) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            if (!nas) {
              log.error('Nas not found');
              return reject('invalid nas id');
            }
            return resolve(nas);
          });
        });
      }
    });
  };

  Nas.observe('before save', function(ctx, next) {
    // Check if nas is created
    if (ctx.instance && ctx.isNewInstance) {
      // add email and password because it's a generic user
      ctx.instance.creationDate = ctx.instance.updateDate = new Date();
      if (ctx.instance.mac) {
        if (ctx.instance.mac.match(/[a-z]/i)) {
          ctx.instance.mac = utility.trimMac(ctx.instance.mac);
          ctx.instance.id = ctx.instance.mac;
        } else {
          return next('invalid mac address');
        }
      }
      if (ctx.instance.ip && ctx.instance.port) {
        ctx.nasIpPortKey = ctx.instance.ip + ctx.instance.port;
      }
      log.debug('nas created : ', ctx.instance);
    }
    next();
  });

  Nas.loadRouterInfo = function(nasId, clbk) {
    Nas.findById(nasId, function(error, nas) {
      log.debug('loading nas id', nasId);
      if (error) {
        log.error(error);
        return clbk(error);
      }
      if (!nas) {
        var error = new Error();
        error.message = hotspotMessages.routerNotFound;
        error.status = 404;
        return clbk(error);
      }
      log.debug('loaded nas ', nas);
      return clbk(null, nas);
    });
  };

  Nas.remoteMethod('loadRouterInfo', {
    description: 'Load router info',
    accepts: [
      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  });

  Nas.loadThemeConfigById = function(nasId, cb) {
    var Business = app.models.Business;
    var Theme = app.models.Theme;
    Nas.loadRouterInfo(nasId, function(error, nas) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      Business.loadConfig(nas.businessId, function(error, businessConfig) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        //log.debug ( "business loaded:", businessConfig );
        businessConfig.nasId = nas.id;
        businessConfig.accessPointType = nas.accessPointType;
        businessConfig.businessId = nas.businessId;
        businessConfig.themeConfig.controller =
          hotspotTemplates[businessConfig.selectedThemeId].controller;
        businessConfig.themeConfig.template =
          hotspotTemplates[businessConfig.selectedThemeId].template;
        /*businessConfig.themeConfig[ businessConfig.selectedThemeId ] = Object.assign( {},
                 hotspotTemplates[ businessConfig.selectedThemeId ],
                 businessConfig.themeConfig[ businessConfig.selectedThemeId ] );*/
        return cb(null, businessConfig);
      });
    });
  };

  Nas.remoteMethod('loadThemeConfigById', {
    description: 'Load loadThemeConfigById ',
    accepts: [
      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  });

  Nas.loadRadiusInfo = function(cb) {
    return cb(null, {
      radiusIp: config.RADIUS_IP,
      secondRadiusIp: config.SECOND_RADIUS_IP,
      accountingPort: config.RADIUS_ACC_PORT,
      authenticationPort: config.RADIUS_AUTH_PORT,
    });
  };

  Nas.remoteMethod('loadRadiusInfo', {
    description: 'Load router info',
    accepts: [],
    returns: { root: true },
  });

  Nas.getMikrotikScripts = function(businessId, nasId) {
    var Business = app.models.Business;
    return Q.promise(function(resolve, reject) {
      var nasTitle = 'nasScripts';
      utility
        .zipIt(nasTitle + '.zip', [
          {
            type: 'folder',
            name: 'hotspotplus',
            files: config.SCRIPTS.MIKROTIK_HOTSPOT_PAGES,
          },
        ])
        .then(function(zipFilePath) {
          log.debug(zipFilePath);
          //Business.updateBusinessHistoryActivity ( businessId, { name: "Theme Downloaded" } );
          return resolve(zipFilePath);
        })
        .fail(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  };

  Nas.getStatus = function(businessId, cb) {
    if (businessId == null) {
      return cb('businessId not defined');
    }
    var NAS_STATUS_CHECK_IN_MILLISECONDS =
      config.NAS_STATUS_CHECK_IN_SECONDS * 1000;
    var checkTime = new Date().getTime() - NAS_STATUS_CHECK_IN_MILLISECONDS;
    var result = {};
    Nas.count(
      {
        businessId: businessId,
        pingUpdatedAt: { lte: checkTime },
      },
      function(error, offLineNas) {
        if (error) {
          return cb(error);
        }
        result.offLine = offLineNas;
        Nas.count(
          {
            businessId: businessId,
          },
          function(error, onLineNas) {
            if (error) {
              return cb(error);
            }
            result.onLine = onLineNas;
            return cb(null, result);
          },
        );
      },
    );
  };

  Nas.remoteMethod('getStatus', {
    description: 'return status of related business routers',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  });

  Nas.getNasCredential = function() {
    return config.PRIMARY_SHARED_SECRET;
  };

  Nas.getIpSession = function(nasIp) {
    return Q.promise(function(resolve, reject) {
      if (!nasIp) {
        return reject('invalid nas ip', nasIp);
      }

      redisClient.get(nasIp, function(error, reply) {
        if (error) {
          log.error('Error:', error);
          return reject(error);
        }
        if (!reply) {
          return reject('nas by ip not found');
        }
        var nasSession = JSON.parse(reply);
        return resolve(nasSession);
      });
    });
  };

  Nas.setIpSession = function(options) {
    return Q.Promise(function(resolve, reject) {
      var Business = app.models.Business;
      var nasId = options.nasId;
      var remoteIp = options.remoteIp || options.ip;
      var businessId = options.businessId;
      var ip = options.ip;
      var port = options.port;
      if (!ip || !businessId || !nasId) {
        return reject('invalid params, bizid or nasid or ip is empty');
      }
      Business.findById(businessId, function(error, business) {
        if (error) {
          log.error('business not found', error);
          return reject(error);
        }
        if (!business) {
          log.error('business not found, is empty', business);
          return reject('business not found, is empty');
        }
        if (business.active === false) {
          log.debug('skip in active business', business);
          return reject('skip in active business');
        }
        if (!business.validateNasIpSrcPacket) {
          business.validateNasIpSrcPacket = false;
        }
        var setByRemoteIp = false;
        if (business.validateNasIpSrcPacket && remoteIp !== ip) {
          log.error('set remote ip as nas ip');
          ip = remoteIp;
          setByRemoteIp = true;
        }
        Nas.findById(nasId, function(error, nas) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (!nas) {
            log.error('failed to load nas: ', nasId);
            return reject('failed to loaf nas');
          }

          var businessServiceId = config.SERVICES.packages[0].id;
          var businessServicesExpiresAt = new Date()
            .add({ months: 1 })
            .getTime();
          if (business.services) {
            businessServiceId = business.services.id;
            businessServicesExpiresAt = business.services.expiresAt;
          }
          var hasValidLogSubscription = false;
          if (
            business.modules &&
            business.modules.log &&
            business.modules.log.expiresAt
          ) {
            hasValidLogSubscription = new Date().isBefore(
              new Date(business.modules.log.expiresAt),
            );
          }
          var sessionString = JSON.stringify({
            businessId: businessId,
            hasValidLogSubscription: hasValidLogSubscription,
            businessServiceId: businessServiceId,
            businessServicesExpiresAt: businessServicesExpiresAt,
            sharedSecret:
              business.nasSharedSecret || config.PRIMARY_SHARED_SECRET,
            nasId: nasId,
            nasIp: ip,
            nasPort: port,
          });
          log.debug(
            'Ip session updated on MongoDB businessId: ',
            businessId,
            ' nasId: ',
            nasId,
            ' ip: ',
            ip,
          );
          redisClient.set(
            ip,
            sessionString,
            'EX',
            config.NAS_SESSION_EXPIRES_AT,
            function(error, reply) {
              if (error) {
                log.error('Setting nas session failed ', error);
                return reject(error);
              }
              log.debug(
                'Set nas session updated on REDIS businessId: ',
                businessId,
                ' nasId: ',
                nasId,
                ' ip: ',
                ip,
              );
              return resolve();
            },
          );
          business.updateAttributes(
            {
              routerActivated: true,
              lastPingAt: new Date().getTime(),
            },
            function(error) {
              if (error) {
                log.error(error);
                return reject(error);
              }
            },
          );
        });
      });
    });
  };
};
