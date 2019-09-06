const logger = require('./logger')
const log = logger.createLogger()
const moment = require('moment')
const config = require('./config')
const CHARGE_TABLE = 'hotspotplus.Charge'
const LICENSE_TABLE = 'license.Charge'

module.exports = (insert, query, uuid) => {
  return Object.freeze({

    getMemberUsage: (startDate, endDate, memberId, businessId) => {
      return Q.Promise(function (resolve, reject) {
        if (!businessId) {
          return reject('business ID is undefined')
        }
        if (!startDate || !endDate || startDate.getTime) {
          return reject('invalid startDate or endDate ', startDate, endDate)
        }
        // filter by businessId,memberId,fromDate,toDate and group by sessionId and return max value on
        // sessionTime,upload,download,totalUsage
        const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT)
        const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT)
        const sqlQuery = `SELECT MAX(upload) as upload,MAX(download) download,MAX(sessionTime) as sessionTime FROM hotspotplus.Usage 
WHERE creationDate>=${from} AND creationDate<=${to} AND businessId=${businessId} AND memberId=${memberId}`
        const usage = {
          memberId: memberId,
          bulk: 0,
          download: 0,
          upload: 0,
          sessionTime: 0
        }
      })

    },
    addCharge: (chargeData) => {
      if (chargeData.amount <= 0) {
        throw new Error(`invalid amount charge amount ${chargeData.amount}`)
      }
      const now = moment()
      log.error(chargeData)
      var charge = [
        uuid(),
        chargeData.businessId,
        chargeData.type,
        chargeData.forThe,
        chargeData.amount,
        now.format(config.DATABASE_DATE_FORMAT)
      ]
      return insert(CHARGE_TABLE, charge)
    },
    getCharges: (businessId, startDate, skip, limit) => {

      if (!businessId) {
        throw new Error('business ID is undefined')
      }
      if (!startDate) {
        throw new Error('startDate or endDate is undefined')
      }
      if (!limit) {
        throw new Error('limit is undefined')
      }
      if (skip == null) {
        throw new Error('skip is undefined')
      }
      try {
        const fromDate = moment(startDate).format(config.DATABASE_DATE_FORMAT)
        const sqlQuery = `SELECT * FROM ${CHARGE_TABLE} WHERE businessId='${businessId}' AND date>=toDateTime('${fromDate}') ORDER BY date LIMIT ${limit} OFFSET ${skip}`
        log.debug({sqlQuery})
        return query(sqlQuery).then(function (result) {
          log.error({result})
          return {
            charges: result
          }
        })
      } catch (error) {
        log.error('getCharges %j', error)
        throw error
      }
    },
    getProfileBalance: (businessId) => {
      if (!businessId) {
        throw new Error('businessId is undefined')
      }
      try {
        const sqlQuery = `SELECT sum(amount) as balance FROM ${CHARGE_TABLE} WHERE businessId='${businessId}' `
        return query(sqlQuery).then((result) => {
          log.error(result)
          return {
            balance: result[0].balance
          }
        })

      } catch (error) {
        log.error(error)
        throw error
      }
    },
    getLicenseBalance: (licenseId) => {
      if (!licenseId) {
        throw new Error('licenseId is undefined')
      }
      try {
        const sqlQuery = `SELECT sum(amount) as balance FROM ${LICENSE_TABLE} WHERE licenseId='${licenseId}' `
        return query(sqlQuery).then((result) => {
          return {
            balance: result[0].balance
          }
        })

      } catch (error) {
        log.error(error)
        throw error
      }
    },
    addLicenseCharge: (chargeData) => {
      if (chargeData.amount <= 0) {
        throw new Error(`invalid amount charge amount ${chargeData.amount}`)
      }
      var ownerMobile = chargeData.notifyOwner
      var charge = [
        uuid(),
        chargeData.licenseId,
        chargeData.type,
        chargeData.forThe,
        chargeData.amount,
        moment(chargeData.date).format(config.DATABASE_DATE_FORMAT)
      ]

      return insert(LICENSE_TABLE, charge).then(() => {
        if (ownerMobile) {
          smsModule.send({
            token1: charge.amount,
            mobile: ownerMobile,
            template: process.env.BUSINESS_SMS_CHARGE_CONFIRM
          })
        }
      })
    }
  })
}