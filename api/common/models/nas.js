var logger = require('../../server/modules/logger')
var app = require('../../server/server')
var utility = require('../../server/modules/utility')
var config = require('../../server/modules/config')
var Q = require('q')
var hotspotMessages = require('../../server/modules/hotspotMessages')
var hotspotTemplates = require('../../server/modules/hotspotTemplates')
const hspCache = require('../../server/modules/hspCache')

module.exports = function (Nas) {
  Nas.validatesUniquenessOf('nasIpPortKey')
  var log = logger.createLogger()

  Nas.observe('loaded', function (ctx, next) {
    if (ctx.data) {
      if (ctx.data.accessPointType) {
        ctx.data.accessPointType = ctx.data.accessPointType.toLowerCase()
      }
    }
    next()
  })

  Nas.observe('before save', function (ctx, next) {
    // Check if nas is created
    if (ctx.instance && ctx.isNewInstance) {
      // add email and password because it's a generic user
      ctx.instance.creationDate = ctx.instance.updateDate = new Date()
      if (ctx.instance.mac) {
        if (ctx.instance.mac.match(/[a-z]/i)) {
          ctx.instance.mac = utility.trimMac(ctx.instance.mac)
          ctx.instance.id = ctx.instance.mac
        } else {
          return next('invalid mac address')
        }
      }
      if (ctx.instance.ip && ctx.instance.port) {
        ctx.nasIpPortKey = ctx.instance.ip + ctx.instance.port
      }
      log.debug('nas created : ', ctx.instance)
    }
    next()
  })

  Nas.loadRouterInfo = function (nasId, clbk) {
    Nas.findById(nasId).then(function (nas) {
      log.debug('loading nas id', nasId)
      if (!nas) {
        var error = new Error()
        error.message = hotspotMessages.routerNotFound
        error.status = 404
        return clbk(error)
      }
      log.debug('loaded nas ', nas)
      return clbk(null, nas)
    })
  }

  Nas.remoteMethod('loadRouterInfo', {
    description: 'Load router info',
    accepts: [
      {
        arg: 'nasId',
        type: 'string',
        required: true
      }
    ],
    returns: {root: true}
  })

  Nas.observe('persist', function (ctx, next) {
    let entityId
    if (ctx.instance && ctx.instance.id) {
      entityId = ctx.instance.id
    } else if (ctx.data && ctx.data.id) {
      entityId = ctx.data.id
    } else if (ctx.currentInstance && ctx.currentInstance.id) {
      entityId = ctx.currentInstance.id
    }
    if (entityId) {
      hspCache.clearCache(entityId)
    }
    next()
  })

  Nas.loadThemeConfigById = function (nasId, cb) {
    var Business = app.models.Business
    var Theme = app.models.Theme
    Nas.loadRouterInfo(nasId, function (error, nas) {
      if (error) {
        log.error(error)
        return cb(error)
      }
      Business.loadConfig(nas.businessId, function (error, businessConfig) {
        if (error) {
          log.error(error)
          return cb(error)
        }
        //log.debug ( "business loaded:", businessConfig );
        businessConfig.nasId = nas.id
        businessConfig.accessPointType = nas.accessPointType
        businessConfig.businessId = nas.businessId
        businessConfig.themeConfig.controller =
          hotspotTemplates[businessConfig.selectedThemeId].controller
        businessConfig.themeConfig.template =
          hotspotTemplates[businessConfig.selectedThemeId].template
        /*businessConfig.themeConfig[ businessConfig.selectedThemeId ] = Object.assign( {},
                 hotspotTemplates[ businessConfig.selectedThemeId ],
                 businessConfig.themeConfig[ businessConfig.selectedThemeId ] );*/
        return cb(null, businessConfig)
      })
    })
  }

  Nas.remoteMethod('loadThemeConfigById', {
    description: 'Load loadThemeConfigById ',
    accepts: [
      {
        arg: 'nasId',
        type: 'string',
        required: true
      }
    ],
    returns: {root: true}
  })

  Nas.loadRadiusInfo = function (cb) {
    return cb(null, {
      radiusIp: config.RADIUS_IP,
      secondRadiusIp: config.SECOND_RADIUS_IP,
      accountingPort: config.RADIUS_ACC_PORT,
      authenticationPort: config.RADIUS_AUTH_PORT
    })
  }

  Nas.remoteMethod('loadRadiusInfo', {
    description: 'Load router info',
    accepts: [],
    returns: {root: true}
  })

  Nas.getMikrotikScripts = function (businessId, nasId) {
    var Business = app.models.Business
    return Q.promise(function (resolve, reject) {
      var nasTitle = 'nasScripts'
      utility
        .zipIt(nasTitle + '.zip', [
          {
            type: 'folder',
            name: 'hotspotplus',
            files: config.SCRIPTS.MIKROTIK_HOTSPOT_PAGES
          }
        ])
        .then(function (zipFilePath) {
          log.debug(zipFilePath)
          //Business.updateBusinessHistoryActivity ( businessId, { name: "Theme Downloaded" } );
          return resolve(zipFilePath)
        })
        .fail(function (error) {
          log.error(error)
          return reject(error)
        })
    })
  }

  Nas.getNasCredential = function () {
    return config.PRIMARY_SHARED_SECRET
  }

  Nas.loadById = async (id) => {
    const cachedNas = await hspCache.readFromCache(id)
    if (cachedNas) {
      return cachedNas
    }
    const nas = await Nas.findById(id)
    log.warn('from db...', nas)
    hspCache.cacheIt(id, nas)
    return nas
  }
}
