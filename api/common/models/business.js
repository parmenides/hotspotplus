const logger = require('../../server/modules/logger')
const app = require('../../server/server')
const config = require('../../server/modules/config')
const utility = require('../../server/modules/utility')
const Payment = require('../../server/modules/payment')
const request = require('request')
const Q = require('q')
const smsModule = require('../../server/modules/sms')
const serviceInfo = require('../../server/modules/serviceInfo.js')
const auth = require('../../server/modules/auth')
const needle = require('needle')
const redis = require('redis')
const crypto = require('crypto')
const db = require('../../server/modules/db.factory')
const cacheManager = require('../../server/modules/cacheManager')

const redisInvoicePayed = redis.createClient(
  config.REDIS.PORT,
  config.REDIS.HOST,
)

const underscore = require('underscore')
const hotspotMessages = require('../../server/modules/hotspotMessages')
const hotspotTemplates = require('../../server/modules/hotspotTemplates')
const extend = require('util')._extend

module.exports = function (Business) {
  const log = logger.createLogger()

  Business.loadById = async function (id) {
    const cachedBusiness = await cacheManager.getBusiness(id)
    if (cachedBusiness) {
      return cachedBusiness
    }
    const business = await Business.findById(id)
    log.warn('from db...', business)
    await cacheManager.cacheBusiness(id, business)
    return business
  }

  Business.observe('before save', function (ctx, next) {
    if (ctx.instance) {
      updateModel(ctx.instance)
    } else if (ctx.data) {
      updateModel(ctx.data)
    }

    function updateModel (business) {
      if (business.mobile) {
        business.mobile = utility.removeAllSpace(
          utility.verifyAndTrimMobile(business.mobile),
        )
        if (!business.mobile) {
          const error = new Error()
          error.message = hotspotMessages.invalidMobileNumber
          error.status = 403
          return next(error)
        }
      }
      if (business.password) {
        business.passwordText = utility.encrypt(
          business.password,
          config.ENCRYPTION_KEY,
        )
      }
    }

    // Check if this is a business create
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance.smsSignature = ctx.instance.title
      // add time zone defaults to business
      ctx.instance.timeZone = {}
      ctx.instance.groupMemberHelps = {}
      ctx.instance.timeZone = config.TIME_ZONE_DEFAULT
      ctx.instance.autoAssignInternetPlan = false
      ctx.instance.defaultInternetPlan = {}
      ctx.instance.username = utility.removeAllSpace(ctx.instance.email)
      ctx.instance.username = ctx.instance.username.toLowerCase()
      ctx.instance.email = utility.removeAllSpace(ctx.instance.email)
      ctx.instance.email = ctx.instance.email.toLowerCase()
      ctx.instance.creationDate = new Date().getTime()
      ctx.instance.subscriptionDate = new Date().getTime()
      ctx.instance.selectedThemeId = config.DEFAULT_THEME_ID
      ctx.instance.themeConfig = {}
      ctx.instance.themeConfig[config.DEFAULT_THEME_ID] = {}
      ctx.instance.themeConfig[config.DEFAULT_THEME_ID].style =
        hotspotTemplates[config.DEFAULT_THEME_ID].styles[0].id
      ctx.instance.themeConfig[config.DEFAULT_THEME_ID].formConfig =
        hotspotTemplates[config.DEFAULT_THEME_ID].formConfig
    } else {
      next()
    }
  })

  Business.observe('before delete', function (ctx, next) {
    if (ctx.where && ctx.where.id && ctx.where.id.inq[0]) {
      const businessId = ctx.where.id.inq[0]
      const InternetPlan = app.models.InternetPlan
      const Nas = app.models.Nas
      const Member = app.models.Member
      const Invoice = app.models.Invoice
      const File = app.models.FileStorage
      log.debug('@Business before delete')
      InternetPlan.destroyAll({businessId: businessId}, function (error, res) {
        if (error) {
          log.error(error)
          return next(error)
        }
        log.debug('internetPlans deleted')
        Nas.destroyAll({businessId: businessId}, function (error, res) {
          if (error) {
            log.error(error)
            return next(error)
          }
          log.debug('nas deleted')
          Member.destroyAll({businessId: businessId}, function (error, res) {
            if (error) {
              log.error(error)
              return next(error)
            }
            log.debug('members deleted')
            Invoice.destroyAll({businessId: businessId}, function (
              error,
              res,
            ) {
              if (error) {
                log.error(error)
                return next(error)
              }
              log.debug('invoices deleted')
              File.destroyAll({businessId: businessId}, function (error, res) {
                if (error) {
                  log.error(error)
                  return next(error)
                }
                log.debug('files deleted')
              })
            })
          })
        })
      })
    }
    next()
  })

  Business.observe('after save', function (ctx, next) {
    const Role = app.models.Role
    if (ctx.instance) {
      const entity = ctx.instance
      cacheManager.clearBusiness(entity.id)
    }
    if (ctx.isNewInstance) {
      const business = ctx.instance
      const businessId = ctx.instance.id
      Role.findOne({where: {name: config.ROLES.NETWORKADMIN}}, function (
        error,
        role,
      ) {
        if (error) {
          log.error(
            'failed to load ' +
            config.ROLES.NETWORKADMIN +
            ' for role assignment',
            error,
          )
          return next()
        }
        if (!role) {
          return next('failed to load role')
        }
        const roleMapping = {principalType: 'USER', principalId: businessId}
        role.principals.create(roleMapping, function (error, result) {
          if (error) {
            log.error('failed to assign role to business', error)
          }
          log.debug('principal assigned ', result)
          smsModule.send({
            token1: business.username,
            mobile: business.mobile,
            template: config.REGISTRATION_MESSAGE_TEMPLATE,
          })
          // Add trial sms test;
          Business.assignDefaultPlanToBusiness(businessId)
            .then(function () {
              Business.adminChargeCredit(businessId, 10000)
              // Business.createDefaultDepartment()
              return next()
            })
            .fail(function (err) {
              return next(err)
            })
        })
      })
    } else {
      return next()
    }
  })

  /*Business.registerNewLicense = function (mobile, fullname, title) {
    return Q.Promise(function (resolve, reject) {
      mobile = utility.verifyAndTrimMobile(mobile)
      if (!mobile) {
        const error = new Error()
        error.status = 422
        error.message = hotspotMessages.invalidMobileNumber
        return reject(error)
      }

      log.debug(config.CONFIG_SERVER_NEW_LICENSE)
      needle.request(
        'post',
        config.CONFIG_SERVER_NEW_LICENSE,
        {
          mobile: mobile,
          title: title,
          fullName: fullname,
        },
        {json: true},
        function (error, resp, body) {
          if (error) {
            log.error(error)
            return reject(error)
          }
          log.debug(resp.statusCode)
          if (resp.statusCode !== 200) {
            log.error(body)
            return reject(resp.statusCode)
          }
          if (!body.systemUuid) {
            log.error('invalid uuid ')
            return reject('invalid system uuid')
          }
          utility
            .writeStringToFileInPath(config.SYSTEM_ID_PATH, body.systemUuid)
            .then(function () {
              Business.reloadLicense()
              return resolve()
            })
            .fail(function (error) {
              return reject(error)
            })
        },
      )
    })
  }

  Business.remoteMethod('registerNewLicense', {
    description: 'Register A New License ',
    accepts: [
      {
        arg: 'mobile',
        type: 'string',
        required: true,
      },
      {
        arg: 'fullName',
        type: 'string',
        required: true,
      },
      {
        arg: 'title',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  })
*/
  Business.getMyDepartments = async (ctx) => {
    const Operator = app.models.Operator
    const Department = app.models.Department
    const userId = ctx.currentUserId
    let limitedToDepartments
    const business = await Business.findById(userId)
    let departments = []
    if (business) {
      // return all deps
      limitedToDepartments = []
      departments = await Department.find({
        where: {
          businessId: userId,
        },
      })
    } else {
      const operator = await Operator.findById(userId)
      log.error({operator})
      limitedToDepartments = operator.departments
      const depIds = limitedToDepartments.map((depId) => {
        return {id: depId}
      })
      log.error({depIds})
      departments = await Department.find({
        where: {
          or: depIds,
        },
      })
    }
    return {
      limited: limitedToDepartments.length !== 0,
      departments,
    }
  }

  Business.remoteMethod('getMyDepartments', {
    description: 'Register A New License ',
    accepts: [
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.loadConfig = function (bizId, cb) {
    Business.findById(bizId).then(function (business) {
      if (!business) {
        const error = new Error()
        error.message = hotspotMessages.invalidBusinessId
        error.status = 404
        return cb(error)
      }
      business.password = null
      business.passwordText = null
      business.mobile = null
      business.username = null
      business.email = null
      // todo: don't remove -- for analytics
      // business.autoCheck = business.autoCheck || false
      // business.autoLogin = business.autoLogin || false
      business.autoAssignInternetPlan =
        business.autoAssignInternetPlan || false
      business.defaultInternetPlan = business.defaultInternetPlan || {}
      business.selectedThemeId =
        business.selectedThemeId || config.DEFAULT_THEME_ID
      if (!business.themeConfig) {
        business.themeConfig = {}
        business.themeConfig[config.DEFAULT_THEME_ID] = {
          formConfig: hotspotTemplates[config.DEFAULT_THEME_ID].formConfig,
        }
      }
      business.enableMemberAutoLogin = business.enableMemberAutoLogin === true
      if (!business.formConfig || !underscore.isArray(business.formConfig)) {
        business.formConfig =
          hotspotTemplates[config.DEFAULT_THEME_ID].formConfig
      }

      return cb(null, business)
    })
  }

  Business.remoteMethod('loadConfig', {
    description: 'Load business config',
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  })

  Business.getPackageById = function (packageId) {
    return Q.Promise(function (resolve, reject) {
      if (
        !packageId ||
        packageId === 'premium' ||
        packageId === 'silver' ||
        packageId === 'gold' ||
        packageId === 'bronze' ||
        packageId === 'free'
      ) {
        packageId = 'economic'
      }
      Business.getPackages().then(function (pkgList) {
        for (const j in pkgList) {
          const pkg = pkgList[j]
          if (pkg.id === packageId) {
            return resolve(pkg)
          }
        }
        return reject()
      })
    })
  }

  Business.assignDefaultPlanToBusiness = function (businessId) {
    return Business.assignPackageToBusiness(businessId, 'demo')
  }
  Business.getCurrentService = function (business) {
    return Q.Promise(function (resolve, reject) {
      let currentService = business.services
      if (!currentService) {
        currentService = {
          id: 'economic',
          subscriptionDate: new Date().removeDays(31).getTime(),
          expiresAt: new Date().getTime(),
          duration: 1,
        }
      }
      if (
        currentService.allowedOnlineUsers &&
        typeof currentService.allowedOnlineUsers === 'string'
      ) {
        currentService.allowedOnlineUsers = Number(
          currentService.allowedOnlineUsers,
        )
      }
      currentService.allowedOnlineUsers =
        currentService.allowedOnlineUsers ||
        config.DEFAULT_ALLOWED_ONLINE_USERS
      return resolve(currentService)
    })
  }

  Business.getModules = function (business) {
    return Q.Promise(function (resolve, reject) {
      const currentModules = {
        sms: {
          id: 'sms',
          duration: business.services.duration,
          subscriptionDate: business.services.subscriptionDate,
          expiresAt: business.services.expiresAt,
        },
        log: {
          id: 'log',
          duration: business.services.duration,
          subscriptionDate: business.services.subscriptionDate,
          expiresAt: business.services.expiresAt,
        },
      }
      return resolve(currentModules)
    })
  }

  Business.buyPackage = function (packageId, discountCoupon, ctx) {
    const Invoice = app.models.Invoice
    const issueDate = new Date().getTime()
    const businessId = ctx.currentUserId
    return Q.Promise(function (resolve, reject) {
      Business.getPackageById(packageId)
        .then(function (selectedPackage) {
          if (!selectedPackage) {
            return reject('package not found')
          }
          let price =
            selectedPackage.price -
            selectedPackage.price * selectedPackage.discount
          if (discountCoupon && discountCoupon.code) {
            const Coupon = app.models.Coupon
            Coupon.findOne(
              {
                where: {
                  and: [
                    {code: discountCoupon.code},
                    {ownerId: config.ADMIN_OWNER_ID},
                  ],
                },
              },
              function (error, coupon) {
                if (error) {
                  log.error(error)
                  return reject(error)
                }
                if (!coupon) {
                  log.error('coupon not found')
                  return reject('coupon not found')
                }
                const unit = coupon.value.unit
                const amount = coupon.value.amount
                if (unit === config.PERCENT_UNIT) {
                  const discountAmount = (price * amount) / 100
                  price = price - discountAmount
                }
                if (unit === config.TOMAN_UNIT) {
                  price = price - amount
                }
                coupon
                  .updateAttributes({
                    used: coupon.used + 1,
                    redeemDate: new Date().getTime(),
                  })
                  .then(
                    function () {
                      createInvoiceAndPay(price)
                    },
                    function (error) {
                      log.error('coupon update error:', error)
                      log.error(error)
                      return reject(error)
                    },
                  )
              },
            )
          } else {
            createInvoiceAndPay(price)
          }

          function createInvoiceAndPay (price) {
            if (price === 0) {
              Business.assignPackageToBusiness(businessId, packageId)
                .then(function () {
                  const returnUrl = config.BUSINESS_PAYMENT_RESULT_URL()
                  return resolve({
                    url: returnUrl
                      .replace('{0}', 'true')
                      .replace('{1}', '&desc=success'),
                  })
                })
                .fail(function (error) {
                  log.error(
                    'failed to assign zero price pkg to business',
                    error,
                  )
                  return reject(error)
                })
            } else {
              log.debug('createInvoiceAndPay price:', price)
              Invoice.create(
                {
                  price: price,
                  payed: false,
                  packageId: packageId,
                  invoiceType: config.BUY_SERVICE_CHARGE,
                  issueDate: issueDate,
                  businessId: businessId,
                },
                function (error, invoice) {
                  if (error) {
                    log.error('failed to create invoice', error)
                    return reject(error)
                  }
                  const invoiceId = invoice.id
                  const returnUrl = config
                    .BUSINESS_PAYMENT_RETURN_URL()
                    .replace('{0}', 'invoiceId')
                    .replace('{1}', invoiceId)
                  log.debug(
                    'config.BUSINESS_PAYMENT_RETURN_URL (): ',
                    config.BUSINESS_PAYMENT_RETURN_URL(),
                  )
                  log.debug('returnUrl: ', returnUrl)
                  log.debug(
                    'EXTRACTED_EXTERNAL_API_ADDRESS: ',
                    process.env.EXTRACTED_EXTERNAL_API_ADDRESS,
                  )
                  Payment.openPaymentGateway(
                    config.PAYMENT_API_KEY,
                    price,
                    config.PAYMENT_GATEWAY_DEFAULT_DESC,
                    config.PAYMENT_SUPPORT_EMAIL,
                    config.PAYMENT_SUPPORT_MOBILE,
                    returnUrl,
                  )
                    .then(function (response) {
                      const url = response.url
                      const paymentId = response.paymentId
                      invoice
                        .updateAttributes({
                          paymentId: paymentId,
                        })
                        .then(
                          function () {
                            return resolve({url: url})
                          },
                          function (error) {
                            log.error('invoice update error:', error)
                            return reject(error)
                          },
                        )
                    })
                    .fail(function (error) {
                      log.error('failed to open payment gateway')
                      log.error(error)
                      return reject(error)
                    })
                },
              )
            }
          }
        })
        .fail(function (error) {
          log.error(error)
          return reject(error)
        })
    })
  }

  Business.remoteMethod('buyPackage', {
    description: 'buyService for business',
    accepts: [
      {
        arg: 'packageId',
        type: 'string',
        required: true,
      },
      {
        arg: 'discount',
        type: 'object',
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.assignPackageToBusiness = function (businessId, packageId, options) {
    return Q.Promise(function (resolve, reject) {
      options = options || {}
      Business.getPackageById(packageId)
        .then(function (selectedPkg) {
          if (!selectedPkg) {
            return reject('pkg not found:' + packageId)
          }
          Business.findById(businessId).then(function (business) {
            if (!business) {
              return reject('invalid biz id')
            }
            const update = {}
            let duration = options.duration || selectedPkg.duration
            duration = Number(duration)
            let durationInDays =
              options.durationInDays || selectedPkg.durationInDays
            durationInDays = Number(durationInDays)
            const selectedService = selectedPkg.service
            if (selectedService) {
              const serviceSubscriptionDate =
                options.subscriptionDate || new Date().getTime()
              log.debug('service duration:', duration)
              let expiresAt
              if (duration) {
                expiresAt = new Date(serviceSubscriptionDate)
                  .add({months: duration})
                  .getTime()
              } else if (durationInDays) {
                expiresAt = new Date(serviceSubscriptionDate)
                  .add({days: durationInDays})
                  .getTime()
              }
              log.debug('service expires at:', expiresAt)
              update.services = {
                allowedOnlineUsers:
                  options.allowedOnlineUsers ||
                  selectedService.allowedOnlineUsers,
                subscriptionDate: serviceSubscriptionDate,
                expiresAt: expiresAt,
                duration: duration,
                durationInDays: durationInDays,
              }
            }
            const selectedModules = selectedPkg.modules
            if (selectedModules) {
              const modules = business.modules
              underscore.each(selectedModules, function (module, moduleId) {
                const modSubscriptionDate =
                  options.subscriptionDate || new Date().getTime()
                let modExpiresAt
                log.debug('module duration ', duration)
                if (duration) {
                  modExpiresAt = new Date(modSubscriptionDate)
                    .add({months: duration})
                    .getTime()
                } else if (durationInDays) {
                  modExpiresAt = new Date(modSubscriptionDate)
                    .add({days: durationInDays})
                    .getTime()
                }
                log.debug('module expires at:', modExpiresAt)
                modules[moduleId] = {
                  subscriptionDate: modSubscriptionDate,
                  expiresAt: modExpiresAt,
                  duration: duration,
                }
              })
              update.modules = modules
            }

            business.updateAttributes(update, function (error, updatedBiz) {
              if (error) {
                log.error(error)
                return reject(error)
              }
              return resolve()
            })
          })
        })
        .fail(function (error) {
          log.error(error)
          return reject(error)
        })
    })
  }

  Business.remoteMethod('assignPackageToBusiness', {
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'packageId',
        type: 'string',
        required: true,
      },
      {
        arg: 'options',
        type: 'object',
      },
    ],
    returns: {root: true},
  })

  Business.buyCredit = function (rialPrice, ctx) {
    const Invoice = app.models.Invoice
    const issueDate = new Date().getTime()
    const businessId = ctx.currentUserId
    return Q.Promise(function (resolve, reject) {

      const price = rialPrice / 10
      Invoice.create(
        {
          price: price,
          payed: false,
          invoiceType: config.BUY_CHARGE,
          issueDate: issueDate,
          businessId: businessId,
        },
        function (error, invoice) {
          if (error) {
            log.error('invoice create error:', error)
            return reject(error)
          }
          const invoiceId = invoice.id
          const returnUrl = config
            .CHARGE_PAYMENT_RETURN_URL()
            .replace('{0}', 'invoiceId')
            .replace('{1}', invoiceId)
          log.debug(returnUrl)
          Payment.openPaymentGateway(
            config.PAYMENT_API_KEY,
            price,
            config.PAYMENT_GATEWAY_DEFAULT_DESC,
            config.PAYMENT_SUPPORT_EMAIL,
            config.PAYMENT_SUPPORT_MOBILE,
            returnUrl,
          )
            .then(function (response) {
              const url = response.url
              const paymentId = response.paymentId
              invoice.updateAttributes({paymentId: paymentId}).then(
                function () {
                  return resolve({url: url})
                },
                function (error) {
                  log.error('invoice update error:', error)
                  log.error(error)
                  return reject(error)
                },
              )
            })
            .fail(function (error) {
              log.error('failed to open payment gateway')
              log.error(error)
              return reject(error)
            })
        })
    })
  }

  Business.remoteMethod('buyCredit', {
    description: 'payment by business',
    accepts: [
      {
        arg: 'rialPrice',
        type: 'number',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.observe('loaded', async (ctx) => {
    // Set the default configs
    if (ctx.data) {
      const currentService = await Business.getCurrentService(ctx.data)
      ctx.data.services = currentService
      const modules = await Business.getModules(ctx.data)
      ctx.data.modules = modules
      let themeId = ctx.data.selectedThemeId
      const themeConfig = extend({}, ctx.data.themeConfig)
      const oldThemeConfig = extend({}, themeConfig[themeId])
      const serviceId = ctx.data.services.id
      if (!ctx.data.selectedThemeId) {
        themeId = config.DEFAULT_THEME_ID
        themeConfig[themeId] = extend({}, returnThemeConfig(themeId))
      } else if (
        ctx.data.selectedThemeId === config.PREVIOUS_DEFAULT_THEME_ID
      ) {
        themeId = config.DEFAULT_THEME_ID
        themeConfig[themeId] = extend(
          {},
          returnThemeConfig(themeId, oldThemeConfig, serviceId),
        )
      } else if (
        ctx.data.selectedThemeId === config.PREVIOUS_HOTEL_THEME_ID
      ) {
        themeId = config.HOTEL_THEME_ID
        themeConfig[themeId] = extend(
          {},
          returnThemeConfig(themeId, oldThemeConfig, serviceId),
        )
      } else if (!hotspotTemplates[ctx.data.selectedThemeId]) {
        themeId = config.DEFAULT_THEME_ID
        themeConfig[themeId] = extend(
          {},
          returnThemeConfig(themeId, oldThemeConfig, serviceId),
        )
      }
      ctx.data.selectedThemeId = themeId
      ctx.data.groupMemberHelps = ctx.data.groupMemberHelps || {}
      ctx.data.themeConfig = themeConfig
      ctx.data.nasSharedSecret = ctx.data.nasSharedSecret || config.PRIMARY_SHARED_SECRET
      ctx.data.newNasSharedSecret = config.PRIMARY_SHARED_SECRET
      ctx.data.passwordText = '#$*%&#$*%^(#$*&%(*#$%*&'
    }

    function returnThemeConfig (themeId, oldThemeConfig, serviceId) {
      // we check for premium service
      if (serviceId && serviceId === 'premium' && oldThemeConfig) {
        const newThemeConfig = {
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
          formConfig: hotspotTemplates[themeId].formConfig,
        }
        if (oldThemeConfig.formConfig) {
          for (let i = 0; i < newThemeConfig.formConfig.length; i++) {
            for (let j = 0; j < oldThemeConfig.formConfig.length; j++) {
              if (
                newThemeConfig.formConfig[i].label ===
                oldThemeConfig.formConfig.label
              ) {
                newThemeConfig.formConfig[i].active =
                  oldThemeConfig.formConfig[j].active
                newThemeConfig.formConfig[i].required =
                  oldThemeConfig.formConfig[j].required
              }
            }
          }
        }
        return newThemeConfig
      } else {
        return config.DEFAULT_THEME_CONFIG[config.DEFAULT_THEME_ID]
      }
    }
  })

  Business.verifyBuyPackage = function (invoiceId, refId) {
    return Q.Promise(function (resolve, reject) {
      const Reseller = app.models.Reseller
      const Invoice = app.models.Invoice
      const Charge = app.models.Charge
      const Business = app.models.Business
      const returnUrl = config.BUSINESS_PAYMENT_RESULT_URL()
      if (!invoiceId) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No invoice id'),
        })
      }
      Invoice.findById(invoiceId, function (error, invoice) {
        if (error) {
          log.error(error)
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Error in finding invoice'),
          })
        }
        if (!invoice) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid invoice id'),
          })
        }
        log.debug(invoice)
        const businessId = invoice.businessId
        const price = invoice.price
        const invoiceType = invoice.invoiceType
        Payment.verifyPayment(config.PAYMENT_API_KEY, refId, price)
          .then(function (result) {
            log.debug(result)
            if (!result.payed) {
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=Payment failed'),
              })
            }

            Business.findById(businessId).then(function (business) {
              if (!business) {
                return resolve({
                  code: 302,
                  returnUrl: returnUrl
                    .replace('{0}', 'false')
                    .replace('{1}', '&error=Invalid business id'),
                })
              }

              Charge.addCharge({
                businessId: businessId,
                type: config.BUY_SERVICE_CHARGE,
                amount: price,
                forThe: refId + ':' + invoice.paymentId + ':' + invoiceType,
                date: new Date().getTime(),
              })
              invoice.updateAttributes(
                {
                  payed: true,
                  paymentRefId: refId,
                  paymentDate: new Date().getTime(),
                },
                function (error) {
                  if (error) {
                    log.error(error)
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'false')
                        .replace(
                          '{1}',
                          '&error=Error in update invoice with payment reference Id',
                        ),
                    })
                  }

                  const packageId = invoice.packageId
                  // assign service to business
                  Business.assignPackageToBusiness(businessId, packageId)
                    .then(function () {
                      Business.getPackageById(packageId)
                        .then(function (selectedPackage) {
                          Charge.addCharge({
                            businessId: businessId,
                            type: config.BUY_SERVICE_CHARGE,
                            amount: price * -1,
                            forThe: selectedPackage.title,
                            date: new Date().getTime(),
                          })

                          // add credit for business reseller
                          if (business.resellerId) {
                            Reseller.addResellerCommission(
                              business.resellerId,
                              businessId,
                              invoice.price,
                            )
                              .then(function () {
                                log.debug('Reseller commission added ')
                              })
                              .fail(function (error) {
                                log.error(error)
                              })
                          }
                          return resolve({
                            code: 302,
                            returnUrl: returnUrl
                              .replace('{0}', 'true')
                              .replace('{1}', '&desc=success'),
                          })
                        })
                        .fail(function (error) {
                          log.error(error)
                          return resolve({
                            code: 302,
                            returnUrl: returnUrl
                              .replace('{0}', 'false')
                              .replace(
                                '{1}',
                                '&error=Error in update business with packageId',
                              ),
                          })
                        })
                    })
                    .fail(function (error) {
                      log.error(error)
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update business with packageId',
                          ),
                      })
                    })
                },
              )
            })
          })
          .fail(function (error) {
            log.error(error)
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=Error in verifying payment'),
            })
          })
      })
    })
  }
  Business.verifyBuyCredit = function (invoiceId, refId) {
    return Q.Promise(function (resolve, reject) {
      const Invoice = app.models.Invoice
      const Charge = app.models.Charge
      const Business = app.models.Business
      const returnUrl = config.BUSINESS_PAYMENT_RESULT_URL()
      if (!invoiceId) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No invoice id'),
        })
      }
      Invoice.findById(invoiceId, function (error, invoice) {
        if (error) {
          log.error(error)
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Error in finding invoice'),
          })
        }
        if (!invoice) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid invoice id'),
          })
        }
        log.debug(invoice)
        const businessId = invoice.businessId
        const price = invoice.price
        const invoiceType = invoice.invoiceType
        Payment.verifyPayment(config.PAYMENT_API_KEY, refId, price)
          .then(function (result) {
            log.debug(result)
            if (result.payed) {
              Business.findById(businessId).then(function (business) {
                if (!business) {
                  return resolve({
                    code: 302,
                    returnUrl: returnUrl
                      .replace('{0}', 'false')
                      .replace('{1}', '&error=Invalid business id'),
                  })
                }

                log.debug('sending resolve updating')
                invoice.updateAttributes(
                  {
                    payed: true,
                    paymentRefId: refId,
                    paymentDate: new Date().getTime(),
                  },
                  function (error) {
                    if (error) {
                      log.error(error)
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update invoice with payment reference Id',
                          ),
                      })
                    }
                    Charge.addCharge({
                      businessId: businessId,
                      type: config.BUY_CHARGE,
                      notifyOwner: business.mobile,
                      amount: price,
                      forThe:
                        refId + ':' + invoice.paymentId + ':' + invoiceType,
                      date: new Date().getTime(),
                    })
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'true')
                        .replace('{1}', '&desc=success'),
                    })
                  },
                )
              })
            } else {
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=Payment failed'),
              })
            }
          })
          .fail(function (error) {
            log.error(error)
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=Error in verifying payment'),
            })
          })
      })
    })
  }

  Business.adminChargeCredit = function (businessId, rialPrice, cb) {
    const Invoice = app.models.Invoice
    const Charge = app.models.Charge
    const issueDate = new Date().getTime()
    const paymentDate = new Date().getTime()
    const price = rialPrice / 10

    Invoice.create(
      {
        price: price,
        payed: true,
        invoiceType: config.ADMIN_CHARGE,
        issueDate: issueDate,
        paymentDate: paymentDate,
        businessId: businessId,
      },
      function (error, invoice) {
        if (error) {
          log.error('@adminPayment, invoice create error:', error)
          return cb && cb(error)
        }

        Business.findById(businessId).then(function (business) {
          if (!business) {
            log.error('@adminPayment, Invalid business id')
            return cb && cb(new Error('Invalid business id'))
          }
          Charge.addCharge({
            businessId: businessId,
            type: config.ADMIN_CHARGE,
            amount: price,
            notifyOwner: business.mobile,
            forThe: config.ADMIN_CHARGE,
            date: new Date().getTime(),
          })

          log.debug('@adminPayment, smsCharge', price)
          return cb && cb(null, invoice)
        })
      },
    )
  }

  Business.remoteMethod('adminChargeCredit', {
    description: 'payment by admin',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'rialPrice',
        type: 'number',
        required: true,
      },
    ],
    returns: {root: true},
  })

  Business.getBalance = async function (businessId) {
    log.debug('@getProfileBalance')
    return db.getProfileBalance(businessId)
  }

  Business.remoteMethod('getBalance', {
    description: 'get balance of the business',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.getTrafficUsage = async (startDate, endDate, departmentId, ctx) => {
    const businessId = ctx.currentUserId
    const fromDate = Number.parseInt(startDate)
    const toDate = Number.parseInt(endDate)

    const date = []
    const upload = []
    const download = []
    const sessionTime = []
    if (!departmentId) {
      return {
        date,
        upload,
        download,
        sessionTime,
      }
    }
    if (departmentId === 'all') {
      departmentId = null
    }
    const result = await db.getUsageByInterval(
      businessId,
      departmentId,
      fromDate,
      toDate,
    )
    for (const res of result) {
      date.push(res.date)
      upload.push(Number(res.upload))
      download.push(Number(res.download))
      sessionTime.push(Number(res.sessionTime))
    }
    return {
      date,
      upload,
      download,
      sessionTime,
    }
  }

  Business.remoteMethod('getTrafficUsage', {
    description: 'Find data for traffic usage chart from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'number',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'number',
        required: true,
        description: 'End Date',
      },
      {
        arg: 'departmentId',
        type: 'string',
        description: 'Department',
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {arg: 'result', type: 'object'},
  })

  Business.loadServiceInfo = function (clbk) {
    return clbk(null, serviceInfo)
  }

  Business.remoteMethod('loadServiceInfo', {
    description: 'Load business packages',
    accepts: [],
    returns: {root: true},
  })

  Business.getResellerMobile = function (businessId, cb) {
    log.debug('@getResellerMobile')
    if (!businessId) {
      log.error('invalid business id')
      return cb(new Error('invalid business id'))
    }
    Business.findById(businessId).then(function (business) {
      if (!business) {
        return cb(new Error('business not found'))
      }
      const resellerId = business.resellerId
      const Reseller = app.models.Reseller
      Reseller.findOne(
        {
          where: {
            id: resellerId,
          },
          fields: {
            mobile: true,
          },
        },
        function (error, reseller) {
          if (error) {
            log.error(error)
            return cb(error)
          }
          if (!reseller) {
            log.error('reseller not found')
            return cb(new Error('reseller not found'))
          }
          return cb(null, reseller)
        },
      )
    })
  }

  Business.remoteMethod('getResellerMobile', {
    description: 'Get Reseller Mobile Number of Business',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  })

  Business.hasValidSubscription = function (business) {
    return Q.Promise(function (resolve, reject) {
      if (!business || !business.services) {
        return reject('business is empty or has no service')
      }
      const services = business.services
      /* var totalDurationInMonths = services.duration;
if ( totalDurationInMonths <= 0 || !totalDurationInMonths ) {
  log.warn ( 'business service has no duration', totalDurationInMonths );
  return reject ( 'business service has no duration' );
} */
      const businessId = business.id
      const now = new Date()
      const fromDate = new Date(services.subscriptionDate)
      const endDate = new Date(services.expiresAt)
      // endDate.addMonths ( totalDurationInMonths );
      // endDate.addDays ( config.THRESHOLD_BEFORE_BLOCKING_SERVICE_IN_DAYS );
      if (now.isBefore(endDate)) {
        log.warn(
          'This business has valid subscription ',
          business.title,
          businessId,
        )
        return resolve(true)
      } else {
        return resolve(false)
      }
    })
  }

  Business.remoteMethod('hasValidSubscription', {
    description: 'Check if business has valid subscription',
    accepts: [
      {
        arg: 'business',
        type: 'Object',
        required: true,
      },
    ],
    returns: {root: true},
  })

  Business.getPackages = function () {
    return Q.Promise(function (resolve, reject) {
      return resolve(config.SERVICES.packages)
    })
  }

  Business.loadServices = function (cb) {
    Business.getPackages()
      .then(function (pkgs) {
        return cb(null, {packages: pkgs})
      })
      .fail(function (error) {
        log.error(error)
        return cb(error)
      })
  }

  Business.remoteMethod('loadServices', {
    accepts: [],
    returns: {root: true},
  })

  Business.loadResellersPackages = function (cb) {
    return cb(null, config.RESELLERS_TARIFFS)
  }

  Business.remoteMethod('loadResellersPackages', {
    accepts: [],
    returns: {root: true},
  })

  Business.resetPasswordByAdmin = function (businessId, password) {
    return Q.Promise(function (resolve, reject) {
      if (!businessId) {
        return reject('biz id is empty')
      }
      password = password || utility.createRandomLongNumericalPassword()
      Business.findById(businessId).then(function (business) {
        if (!business) {
          return reject('biz not found')
        }
        business.updateAttributes(
          {
            password: password,
          },
          function (error) {
            if (error) {
              log.error(error)
              return reject(error)
            }
            smsModule.send({
              token1: business.username,
              token2: password,
              mobile: business.mobile,
              template: config.PASSWORD_RESET_TEMPLATE,
            })
            return resolve({password: password})
          },
        )
      })
    })
  }

  Business.remoteMethod('resetPasswordByAdmin', {
    description: '',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'password',
        type: 'string',
      },
    ],
    returns: {root: true},
  })

  Business.makeBackup = function (ctx) {
    return Q.Promise(function (resolve, reject) {
      const businessId = ctx.currentUserId
      Business.findById(businessId).then(function (business) {
        const Member = app.models.Member
        const InternetPlan = app.models.InternetPlan
        const MemberGroup = app.models.MemberGroup
        const tasks = []
        const numberOfMembers = 10000
        const partitionSize = 100
        const numberOfTaskPartitions = Math.ceil(numberOfMembers / partitionSize)
        if (!businessId) {
          return reject('invalid biz id')
        }
        for (let i = 0; i <= numberOfTaskPartitions; i++) {
          tasks.push(
            (function (j) {
              return function (result) {
                return Member.find({
                  where: {
                    businessId: businessId,
                  },
                  skip: j * partitionSize,
                  limit: partitionSize,
                }).then(function (members) {
                  members.forEach(function (member) {
                    member.passwordText = utility.decrypt(
                      member.passwordText,
                      config.ENCRYPTION_KEY,
                    )
                    member.internetPlanHistory = []
                    result.push(member)
                  })
                  return result
                })
              }
            })(i),
          )
        }
        let result = Q([])
        tasks.forEach(function (f) {
          result = result.then(f)
        })
        result
          .then(function (members) {
            InternetPlan.find({where: {businessId: businessId}})
              .then(function (internetPlans) {
                MemberGroup.find({where: {businessId: businessId}})
                  .then(function (memberGroups) {
                    return resolve({
                      groupMemberCounter: business.groupMemberCounter,
                      memberGroups: memberGroups || [],
                      memberGroupsSize: memberGroups.length || 0,
                      members: members || [],
                      membersSize: members.length || 0,
                      internetPlans: internetPlans || [],
                      internetPlansSize: internetPlans.length || 0,
                    })
                  })
                  .catch(function (error) {
                    return reject(error)
                  })
              })
              .catch(function (error) {
                return reject(error)
              })
          })
          .fail(function (error) {
            return reject(error)
          })
      })
    })
  }

  Business.remoteMethod('makeBackup', {
    http: {verb: 'get'},
    accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}],
    returns: {root: true},
  })

  Business.restoreBackupFromApi = function (url, ctx) {
    return Q.Promise(function (resolve, reject) {
      if (!url) {
        return reject('invalid api address')
      }
      needle.get(url, {json: true}, function (error, response, body) {
        if (error) {
          log.error(error)
          return reject(error)
        }
        if (!body) {
          return reject('invalid response, empty body')
        }
        Business.restoreBackup(body, ctx)
          .then(function (result) {
            return resolve(result)
          })
          .fail(function (error) {
            log.error(error)
            return reject(error)
          })
      })
    })
  }

  Business.remoteMethod('restoreBackupFromApi', {
    accepts: [
      {
        arg: 'url',
        type: 'string',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.restoreBackup = function (backup, ctx) {
    const businessId = ctx.currentUserId
    const Member = app.models.Member
    const InternetPlan = app.models.InternetPlan
    const MemberGroup = app.models.MemberGroup

    return Q.Promise(function (resolve, reject) {
      const createMemberGroupTasks = []
      backup.memberGroups.forEach(function (memberGroup) {
        createMemberGroupTasks.push(
          (function (memberGroupId) {
            return function (memberGroupDic) {
              memberGroup.businessId = businessId
              delete memberGroup.id
              log.debug('go add memberGroup', memberGroup)
              return MemberGroup.create(memberGroup).then(function (
                createdMemberGroup,
              ) {
                memberGroupDic[memberGroupId] = createdMemberGroup.id
                return memberGroupDic
              })
            }
          })(memberGroup.id),
        )
      })

      let memberGroupResult = Q({})
      createMemberGroupTasks.forEach(function (f) {
        memberGroupResult = memberGroupResult.then(f)
      })
      memberGroupResult
        .then(function (memberGroupCreateResult) {
          const createInternetPlanTasks = []
          backup.internetPlans.forEach(function (internetPlan) {
            createInternetPlanTasks.push(
              (function (internetPlanId) {
                return function (internetPlanDic) {
                  internetPlan.businessId = businessId
                  delete internetPlan.id
                  log.debug('go add ip', internetPlan)
                  return InternetPlan.create(internetPlan).then(function (
                    createdInternetPlan,
                  ) {
                    internetPlanDic[internetPlanId] = createdInternetPlan.id
                    return internetPlanDic
                  })
                }
              })(internetPlan.id),
            )
          })

          let internetPlanResult = Q({})
          createInternetPlanTasks.forEach(function (f) {
            internetPlanResult = internetPlanResult.then(f)
          })
          internetPlanResult
            .then(function (createInternetPlanResult) {
              const createMembersTasks = []
              backup.members.forEach(function (member) {
                createMembersTasks.push(
                  (function () {
                    return function () {
                      const options = {
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
                        password: member.passwordText,
                      }
                      log.debug('go add member', options)
                      return Member.createNewMember(options, businessId)
                    }
                  })(),
                )
              })

              let memberResult = Q({})
              createMembersTasks.forEach(function (f) {
                memberResult = memberResult.then(f)
              })
              memberResult
                .then(function () {
                  Business.findById(businessId)
                    .then(function (business) {
                      business.updateAttributes(
                        {
                          groupMemberCounter:
                            backup.groupMemberCounter ||
                            config.BUSINESS_GROUP_MEMBER_COUNTER_START,
                        },
                        function (error) {
                          if (error) {
                            return reject(error)
                          }
                          return resolve({ok: true})
                        },
                      )
                    })
                    .catch(function (error) {
                      return reject(error)
                    })
                })
                .fail(function (error) {
                  return reject(error)
                })
            })
            .fail(function (error) {
              return reject(error)
            })
        })
        .fail(function (error) {
          return reject(error)
        })
    })
  }

  Business.remoteMethod('restoreBackup', {
    accepts: [
      {
        arg: 'backup',
        type: 'object',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.isMoreSessionAllowed = async (business) => {
    const ClientSession = app.models.ClientSession
    const result = await ClientSession.getOnlineSessionCount(business.id, 'all')
    const concurrentSession = result.count
    const currentService = business.services
    return concurrentSession <= currentService.allowedOnlineUsers
  }

  Business.destroyMembersById = function (memberIds, ctx) {
    return Q.promise(function (resolve, reject) {
      const businessId = ctx.currentUserId
      const Member = app.models.Member
      log.debug('@destroyMembersById')
      if (!businessId) {
        return reject('invalid businessId')
      }
      if (!memberIds || memberIds.length == 0) {
        return reject('invalid array of members')
      }
      const tasks = []
      for (var i = 0; i < memberIds.length; i++) {
        (function () {
          const memberId = memberIds[i]
          tasks.push(
            Q.Promise(function (resolve, reject) {
              Member.destroyById(memberId, {businessId: businessId}, function (
                error,
                res,
              ) {
                if (error) {
                  log.error(error)
                  return reject(error)
                }
                return resolve(res)
              })
            }),
          )
        })()
      }
      Q.all(tasks)
        .then(function (resultArray) {
          return resolve({result: resultArray})
        })
        .fail(function (error) {
          return reject(error)
        })
    })
  }

  Business.remoteMethod('destroyMembersById', {
    accepts: [
      {
        arg: 'memberIds',
        type: 'array',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.paypingAuthorization = function (ctx, cb) {
    const businessId = ctx.currentUserId
    if (!businessId) {
      return cb(new Error('invalid biz id'))
    }
    Business.findById(businessId).then(function (business) {
      if (!business) {
        return cb(new Error('invalid biz id'))
      }
      const verifier = base64URLEncode(crypto.randomBytes(32))
      log.debug('verifier', verifier)
      business.updateAttributes({
        paypingCodeVerifier: verifier,
      }, (error) => {
        if (error) {
          return cb(error)
        }
        const challenge = base64URLEncode(sha256(verifier))
        log.debug('challenge ', challenge)
        const clientId = config.PAYPING_APP_CLIENT_ID
        // const token = config.PAYPING_APP_TOKEN;
        const returnUrl = config.PAYPING_AUTH_RETURN_URL
        const scopes = config.PAYPING_APP_REQUESTED_SCOPES
        const paypingAuthUrl = `https://oauth.payping.ir/connect/authorize?state=${businessId}&scope=${scopes}&response_type=code&client_id=${clientId}&code_challenge=${challenge}&code_challenge_method=S256&redirect_uri=${returnUrl}`
        log.debug('@payping auth')
        return cb(null, {
          code: 302,
          returnUrl: paypingAuthUrl,
        })
      },)
    })

    function sha256 (buffer) {
      return crypto.createHash('sha256').update(buffer).digest()
    }

    function base64URLEncode (str) {
      return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }
  }

  Business.remoteMethod('paypingAuthorization', {
    accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}],
    returns: {root: true},
  })

  Business.paypingSaveToken = function (options) {
    return Q.Promise(function (resolve, reject) {
      log.debug('@paypingSaveToken')
      const returnUrl = config.PAYPING_AUTHORISE_RESULT_URL()
      if (!options) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No response'),
        })
      }
      if (options.error && options.error === 'access_denied') {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=Access denied'),
        })
      }
      if (options.error) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=Error in connecting to Payping'),
        })
      }
      const Business = app.models.Business
      const businessId = options.state
      const code = options.code
      Business.findById(businessId).then(function (business) {
        if (!business) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid business id'),
          })
        }
        needle.post(config.PAYPING_OAUTH2, {
          'grant_type': 'authorization_code',
          'client_id': config.PAYPING_APP_CLIENT_ID,
          'client_secret': config.PAYPING_APP_TOKEN,
          'code_verifier': business.paypingCodeVerifier,
          'code': code,
          'redirect_uri': `${config.PAYPING_AUTH_RETURN_URL}`,
        }, {'content-type': 'application/json'}, (error, resp) => {
          const body = resp.body
          if (error) {
            log.error('failed to get access_token for code', code)
            log.error(error)
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=' + error),
            })
          }
          try {
            const accessToken = body.access_token
            const accessTokenType = body.token_type
            const tokenId = body.id_token
            if (accessToken) {
              business.updateAttributes(
                {
                  paymentApiKey: accessToken,
                  paypingTokenId: tokenId,
                  paypingTokenType: accessTokenType,
                },
                function (error) {
                  if (error) {
                    log.error(error)
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'false')
                        .replace(
                          '{1}',
                          '&error=Error in update business with new Payping token',
                        ),
                    })
                  }
                  log.debug(
                    '@Payping token saved successfully for business: ',
                    businessId,
                  )
                  return resolve({
                    code: 302,
                    returnUrl: returnUrl
                      .replace('{0}', 'true')
                      .replace('{1}', '&desc=success'),
                  })
                },
              )
            } else {
              log.error(body)
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace(
                    '{1}',
                    '&error=invalid access token or account id',
                  ),
              })
            }
          } catch (error) {
            log.error(error)
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=' + error),
            })
          }
        },)
      })
    })
  }

  Business.dropBoxAuthorization = function (ctx, cb) {
    const businessId = ctx.currentUserId
    if (!businessId) {
      return cb(new Error('invalid biz id'))
    }
    log.debug('@dropBoxAuthorization')
    Business.findById(businessId).then(function (business) {
      if (!business) {
        return cb(new Error('invalid biz id'))
      }
      const CSRFToken = businessId
      const redirectURI = config.DROPBOX_REST_API()
      const appKey = config.DROPBOX_APP_KEY()
      const DROPBOX_AUTH_URL = config.DROPBOX_AUTHORISE_URL
      const dropBoxAuthUrl = DROPBOX_AUTH_URL.replace('{0}', appKey)
        .replace('{1}', redirectURI)
        .replace('{2}', CSRFToken)
      return cb(null, {
        code: 302,
        returnUrl: dropBoxAuthUrl,
      })
    })
  }

  Business.remoteMethod('dropBoxAuthorization', {
    accepts: [{arg: 'options', type: 'object', http: 'optionsFromRequest'}],
    returns: {root: true},
  })

  Business.dropboxSaveToken = function (options) {
    return Q.Promise(function (resolve, reject) {
      log.debug('@dropboxSaveToken')
      const returnUrl = config.DROPBOX_AUTHORISE_RESULT_URL()
      if (!options) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No response'),
        })
      }
      if (options.error && options.error === 'access_denied') {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=Access denied'),
        })
      }
      if (options.error) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=Error in connecting to dropbox'),
        })
      }
      const Business = app.models.Business
      const businessId = options.state
      const code = options.code
      Business.findById(businessId).then(function (business) {
        if (!business) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid business id'),
          })
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
              redirect_uri: config.DROPBOX_REST_API(),
            },
          },
          function (error, resp, body) {
            if (error) {
              log.error('failed to get access_token for code', code)
              log.error(error)
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=' + error),
              })
            }
            try {
              const result = JSON.parse(body)
              const access_token = result.access_token
              const account_id = result.account_id
              if (access_token && account_id) {
                business.updateAttributes(
                  {
                    dropboxToken: access_token,
                    dropboxAccountId: account_id,
                  },
                  function (error) {
                    if (error) {
                      log.error(error)
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update business with new Dropbox token',
                          ),
                      })
                    }
                    log.debug(
                      '@Dropbox token saved successfully for business: ',
                      businessId,
                    )
                    return resolve({
                      code: 302,
                      returnUrl: returnUrl
                        .replace('{0}', 'true')
                        .replace('{1}', '&desc=success'),
                    })
                  },
                )
              } else {
                log.error(result)
                return resolve({
                  code: 302,
                  returnUrl: returnUrl
                    .replace('{0}', 'false')
                    .replace(
                      '{1}',
                      '&error=invalid access token or account id',
                    ),
                })
              }
            } catch (error) {
              log.error(error)
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=' + error),
              })
            }
          },
        )
      })
    })
  }

  Business.createLocalInvoice = function (
    businessId,
    mobile,
    moduleId,
    duration,
  ) {
    return Q.Promise(function (resolve, reject) {
      const Invoice = app.models.Invoice
      const price = config.LOCAL_MODULES[moduleId].price * duration
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
          issueDate: new Date(),
        },
        function (error, invoice) {
          if (error) {
            log.error('failed to create invoice', error)
            return reject(error)
          }
          const invoiceId = invoice.id
          const returnUrl = config
            .LOCAL_PAYMENT_RETURN_URL()
            .replace('{0}', 'invoiceId')
            .replace('{1}', invoiceId)
          Payment.openPaymentGateway(
            config.PAYMENT_API_KEY,
            price,
            config.PAYMENT_GATEWAY_DEFAULT_DESC,
            config.PAYMENT_SUPPORT_EMAIL,
            config.PAYMENT_SUPPORT_MOBILE,
            returnUrl,
          )
            .then(function (response) {
              const url = response.url
              const paymentId = response.paymentId
              invoice
                .updateAttributes({
                  paymentId: paymentId,
                })
                .then(
                  function () {
                    return resolve({url: url})
                  },
                  function (error) {
                    log.error('invoice update error:', error)
                    return reject(error)
                  },
                )
            })
            .fail(function (error) {
              log.error('failed to open payment gateway')
              log.error(error)
              return reject(error)
            })
        }
      )
    })
  }

  Business.loadMembersUsernames = function (businessId) {
    const Member = app.models.Member
    return Q.Promise(function (resolve, reject) {
      Member.find(
        {
          where: {
            and: [
              {businessId: businessId},
            ],
          },
          fields: {
            username: true,
            id: true,
          },
        },
        function (error, members) {
          if (error) {
            log.error(error)
            return reject(error)
          }
          if (members.length != 0) {
            members.forEach(function (member) {
              const username = member.username
              member.username = username.split('@')[0]
            })
            return resolve(members)
          } else {
            log.error('member not found')
            return reject('member not found')
          }
        }
      )
    })
  }

  Business.remoteMethod('loadMembersUsernames', {
    description: 'load members usernames',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: {arg: 'members', type: 'Array'},

  })

  Business.destroyReportsById = function (reportIds, ctx) {
    return Q.promise(function (resolve, reject) {
      const businessId = ctx.currentUserId
      const Report = app.models.Report
      log.debug('@destroyReportsById')
      if (!businessId) {
        return reject('invalid businessId')
      }
      if (!reportIds || reportIds.length == 0) {
        return reject('invalid array of reports')
      }
      const tasks = []
      for (var i = 0; i < reportIds.length; i++) {
        (function () {
          const reportId = reportIds[i]
          tasks.push(
            Q.Promise(function (resolve, reject) {
              Report.destroyById(reportId, {businessId: businessId}, function (
                error,
                res,
              ) {
                if (error) {
                  log.error(error)
                  return reject(error)
                }
                return resolve(res)
              })
            }),
          )
        })()
      }
      Q.all(tasks)
        .then(function (resultArray) {
          return resolve({result: resultArray})
        })
        .fail(function (error) {
          return reject(error)
        })
    })
  }

  Business.remoteMethod('destroyReportsById', {
    accepts: [
      {
        arg: 'reportIds',
        type: 'array',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })

  Business.loadNasTitles = function (businessId) {
    const Nas = app.models.Nas
    return Q.Promise(function (resolve, reject) {
      Nas.find(
        {
          where: {
            and: [
              {businessId: businessId},
            ],
          },
          fields: {
            title: true,
            id: true,
          },
        },
        function (error, nas) {
          if (error) {
            log.error(error)
            return reject(error)
          }
          if (nas.length != 0) {
            return resolve(nas)
          } else {
            log.error('nas not found')
            return reject('nas not found')
          }
        }
      )
    })
  }

  Business.remoteMethod('loadNasTitles', {
    description: 'load nas by titles',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: {arg: 'nas', type: 'Array'},

  })
}
