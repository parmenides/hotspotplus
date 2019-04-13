/**
 * Created by payamyousefi on 3/31/17.
 */

var Q = require('q')
var logger = require('./logger')
var log = logger.createLogger()
var needle = require('needle')
const uuidv4 = require('uuid/v4')
const config = require('./config')

module.exports.openPaymentGateway = function (
  token,
  price,
  desc,
  email,
  mobile,
  returnUrl
) {
  log.debug(returnUrl)
  return Q.Promise(function (resolve, reject) {
    const amount = price
    const paymentId = uuidv4()
    log.error('@open gateway',token,
      price,
      desc,
      email,
      mobile,
      returnUrl)
    needle.post(config.PAYPING_CREATE_PAYMENT, {
      amount: amount,
      description: `ایمیل: ${email} شماره همراه: ${mobile}`,
      clientRefId: paymentId,
      returnUrl: returnUrl
    }, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (error, response) => {
      if (error) {
        log.error(error)
        return reject(error)
      }
      const body = response.body
      log.error(response.body)
      if (!body.code) {
        log.error('invalid body:', body)
        return reject(error)
      }
      log.debug(body)
      const url = `${config.PAYPING_PAYMENT_GATEWAY}/${body.code}`
      log.warn('open payment gateway:', url)
      return resolve({
        url: url,
        paymentId: paymentId
      })
    })
  })
}

module.exports.verifyPayment = function (token, refId, price) {
  return Q.Promise(function (resolve, reject) {
    needle.post(config.PAYPING_PAYMENT_VERIFY, {
      'refId': refId,
      'amount': price
    }, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (error, response) => {
      const body = response.body
      if (error) {
        log.error('Payment error verification ', token, refId, price)
        log.error(error)
        return reject(error)
      }
      return resolve({payed: true, refId: refId})
    })
  })
}
