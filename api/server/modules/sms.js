/**
 * Created by payamyousefi on 10/17/16.
 */

require('date-utils')
const Q = require('q')
const app = require('../server')
const redis = require('redis')
const config = require('./config')
const REDIS_PORT = config.REDIS.PORT
const REDIS_HOST = config.REDIS.HOST
const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST)
const logger = require('./logger')
const log = logger.createLogger()
const utility = require('./utility')
const db = require('./db.factory')
const kavehnegar = require('./kavehnegar')

exports.send = function (data) {
  log.debug('Mobile data', data)
  const Business = app.models.Business
  const businessId = data.businessId || 'service'
  const mobilesList = data.mobiles
  const message = data.message

  return Q.Promise(function (resolve, reject) {
    if (mobilesList && message) {
      log.debug('mobiles: ', mobilesList)
      log.debug('message: ', message)
      log.debug('businessId: ', businessId)
      if (!mobilesList.length || mobilesList.length === 0) {
        log.error(
          '@send message dismissed, empty message or mobile ',
          mobilesList
        )
        return resolve()
      }
      sendGroupMessage(mobilesList, message, businessId)
        .then(function () {
          return resolve()
        })
        .fail(function (error) {
          return reject(error)
        })
    } else {
      // Send service message by template
      const mobile = data.mobile
      let token1 = data.token1
      let token2 = data.token2
      let token3 = data.token3
      const template = data.template
      if (token1) {
        token1 = utility.removeAllSpace(token1)
      }
      if (token2) {
        token2 = utility.removeAllSpace(token2)
      }
      if (token3) {
        token3 = utility.removeAllSpace(token3)
      }
      if (businessId !== 'service') {
        Business.findById(businessId)
          .then(function (business) {
            const token10 =
              business.smsSignature ||
              business.title ||
              process.env.SMS_SIGNATURE
            db.getProfileBalance(businessId)
              .then(function (result) {
                const balance = result.balance
                if (balance > config.MIN_REQUIRED_SMS_CREDIT) {
                  sendMessage(
                    mobile,
                    token1,
                    token2,
                    token3,
                    token10,
                    template,
                    businessId
                  )
                    .then(function () {
                      return resolve()
                    })
                    .fail(function (error) {
                      log.error(error)
                      return reject(error)
                    })
                } else {
                  log.warn('business has not enough credit:', businessId)
                  return resolve()
                }
              })
              .fail(function (error) {
                log.error(error)
                return reject(error)
              })
          })
          .catch(function (error) {
            log.error(error)
            return reject(error)
          })
      } else {
        const token10 = process.env.SMS_SIGNATURE
        sendMessage(mobile, token1, token2, token3, token10, template)
          .then(function () {
            return resolve()
          })
          .fail(function (error) {
            log.error(error)
            return reject(error)
          })
      }
    }
  })
}

const getSmsApiKey = function () {
  log.debug('@getSmsApiKey')
  return Q.Promise(function (resolve, reject) {
    redisClient.get('SMS_API_KEY', function (error, SMS_API_KEY) {
      if (error) {
        log.error(error)
        return reject(error)
      }
      if (!SMS_API_KEY) {
        log.debug('invalid sms api key:', SMS_API_KEY)
        return resolve()
      }
      return resolve(SMS_API_KEY)
    })
  })
}

function sendMessage (
  mobile,
  token1,
  token2,
  token3,
  token10,
  template,
  businessId
) {
  log.debug('@sendMessage')
  const Charge = app.models.Charge
  return Q.Promise(function (resolve, reject) {
    getSmsApiKey()
      .then(function (SMS_API_KEY) {
        if (!mobile) {
          log.error(
            '@SMS_Queue:send message dismissed, empty message or mobile ',
            mobile
          )
          return resolve()
        }
        log.debug(SMS_API_KEY)
        if (SMS_API_KEY && SMS_API_KEY !== '-') {
          kavehnegar
            .sendMessageToKavehnegar(
              SMS_API_KEY,
              mobile,
              token1,
              token2,
              token3,
              token10,
              template
            )
            .then(function (cost) {
              log.debug('message cost in Toman:', cost)
              Charge.addCharge({
                businessId: businessId,
                type: 'smsCost',
                amount: cost,
                forThe: 'message',
                date: new Date().getTime(),
              })
                .then(function () {
                  return resolve()
                })
                .fail(function (error) {
                  log.error(error)
                  return reject(error)
                })
            })
            .catch(function (error) {
              log.error(error)
              return reject(error)
            })
        } else {
          return reject(new Error('invalid sms api key'))
        }
      })
      .fail(function (error) {
        log.error(error)
        return reject(error)
      })
  })
}

var sendGroupMessage = function (mobilesList, message, businessId) {
  log.debug('@sendGroupMessage')
  const Charge = app.models.Charge
  return Q.Promise(function (resolve, reject) {
    getSmsApiKey()
      .then(function (SMS_API_KEY) {
        if (SMS_API_KEY) {
          kavehnegar
            .sendGroupMessageToKavehnegar(SMS_API_KEY, mobilesList, message)
            .then(function (cost) {
              log.debug('message cost in Toman:', cost)
              Charge.addCharge({
                businessId: businessId,
                type: 'smsCost',
                amount: cost,
                forThe: 'bulkMessages:' + mobilesList.length,
                date: new Date().getTime(),
              })
              return resolve()
            })
            .catch(function (error) {
              return reject(error)
            })
        } else {
          return reject('sms api key is empty')
        }
      })
      .fail(function (error) {
        log.error(error)
        return reject(error)
      })
  })
}
