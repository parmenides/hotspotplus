const logger = require('../../server/modules/logger');
const app = require('../../server/server');
const utility = require('../../server/modules/utility');
const config = require('../../server/modules/config');
const Q = require('q');
const hotspotMessages = require('../../server/modules/hotspotMessages');
const hotspotTemplates = require('../../server/modules/hotspotTemplates');
const cacheManager = require('../../server/modules/cacheManager');

module.exports = function(Nas) {
  Nas.validatesUniquenessOf('nasIpPortKey');
  const log = logger.createLogger();

  Nas.observe('loaded', function(ctx, next) {
    if (ctx.data) {
      if (ctx.data.accessPointType) {
        ctx.data.accessPointType = ctx.data.accessPointType.toLowerCase();
      }
    }
    next();
  });

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
    Nas.findById(nasId).then(function(nas) {
      log.debug('loading nas id', nasId);
      if (!nas) {
        const error = new Error();
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
    returns: {root: true},
  });

  Nas.observe('after save', function(ctx, next) {
    if (ctx.instance) {
      const entity = ctx.instance;
      cacheManager.clearCache(entity.id);
    }
    next();
  });

  Nas.loadThemeConfigById = function(nasId, cb) {
    const Business = app.models.Business;
    const Theme = app.models.Theme;
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
        // log.debug ( "business loaded:", businessConfig );
        businessConfig.nasId = nas.id;
        businessConfig.accessPointType = nas.accessPointType;
        businessConfig.businessId = nas.businessId;
        businessConfig.themeConfig.controller =
          hotspotTemplates[businessConfig.selectedThemeId].controller;
        businessConfig.themeConfig.template =
          hotspotTemplates[businessConfig.selectedThemeId].template;
        /* businessConfig.themeConfig[ businessConfig.selectedThemeId ] = Object.assign( {},
                 hotspotTemplates[ businessConfig.selectedThemeId ],
                 businessConfig.themeConfig[ businessConfig.selectedThemeId ] ); */
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
    returns: {root: true},
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
    returns: {root: true},
  });

  Nas.getMikrotikScripts = function(businessId, nasId) {
    const Business = app.models.Business;
    return Q.promise(function(resolve, reject) {
      const nasTitle = 'nasScripts';
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
          // Business.updateBusinessHistoryActivity ( businessId, { name: "Theme Downloaded" } );
          return resolve(zipFilePath);
        })
        .fail(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  };

  Nas.getNasCredential = function() {
    return config.PRIMARY_SHARED_SECRET;
  };

  Nas.loadById = async (id) => {
    const cachedNas = await cacheManager.readFromCache(id);
    if (cachedNas) {
      return cachedNas;
    }
    const nas = await Nas.findById(id);
    log.warn('from db...', nas);
    cacheManager.cacheIt(id, nas);
    return nas;
  };
};
