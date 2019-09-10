const logger = require('./logger')
const log = logger.createLogger()
const moment = require('moment')
const config = require('./config')
const SESSION_TABLE = 'hotspotplus.Session'
const CHARGE_TABLE = 'hotspotplus.Charge'
const LICENSE_TABLE = 'license.Charge'

module.exports = (insert, query, uuid) => {
  return Object.freeze({

    getBusinessUsageByInterval: (businessId, startDate, endDate) => {
      if (!businessId) {
        throw new Error('businessId is undefined')
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate)
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT)
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT)
      const intervalInSeconds = 86400
      const durationInDays = moment(endDate).diff(moment(startDate), 'days')
      const sqlQuery = `
SELECT * FROM (
SELECT any(toStartOfInterval(creationDate,INTERVAL ${intervalInSeconds} second)) as date ,toInt32(SUM(upload)) as upload,toInt32(SUM(download)) download,toInt32(SUM(sessionTime)) as sessionTime
FROM hotspotplus.Session
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}'
GROUP BY toStartOfInterval(creationDate,INTERVAL ${intervalInSeconds} second) order by date
) ANY RIGHT JOIN (
SELECT arrayJoin(timeSlots(toDateTime('${from}'), toUInt32(${intervalInSeconds}*${durationInDays}),${intervalInSeconds})) AS date
) USING (date) order by date
 `
      log.warn(sqlQuery)
      return query(sqlQuery).then((result) => {
        log.debug({result})
        return result
      })
    },
    getMemberUsage: (startDate, endDate, memberId, businessId) => {
      if (!businessId) {
        throw new Error('businessId is undefined')
      }
      if (!memberId) {
        throw new Error('memberId is undefined')
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate)
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT)
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT)
      const sqlQuery = `SELECT toInt32(SUM(upload)) as upload,toInt32(SUM(download)) download,toInt32(SUM(sessionTime)) as sessionTime FROM ${SESSION_TABLE}
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}' AND memberId='${memberId}' `

      return query(sqlQuery).then((result) => {
        const {upload, download, sessionTime, bulk} = result[0]
        log.debug({result})
        return {
          memberId: memberId,
          bulk: Number(bulk),
          download: Number(download),
          upload: Number(upload),
          sessionTime: Number(sessionTime)
        }
      })
    },
    getBusinessUsage: (businessId, startDate, endDate) => {
      if (!businessId) {
        throw new Error('businessId is undefined')
      }
      if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined', startDate, endDate)
      }

      const from = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT)
      const to = moment.utc(endDate).format(config.DATABASE_DATE_FORMAT)
      const sqlQuery = `SELECT toInt32(SUM(upload)) as upload,toInt32(SUM(download)) download,toInt32(SUM(sessionTime)) as sessionTime FROM ${SESSION_TABLE}
WHERE creationDate>=toDateTime('${from}') AND creationDate<=toDateTime('${to}') AND businessId='${businessId}' `

      return query(sqlQuery).then((result) => {
        const {upload, download, sessionTime, bulk} = result[0]
        log.debug({result})
        return {
          bulk: Number(bulk),
          download: Number(download),
          upload: Number(upload),
          sessionTime: Number(sessionTime)
        }
      })
    },
    addCharge: (chargeData) => {
      if (chargeData.amount <= 0) {
        throw new Error(`invalid amount charge amount ${chargeData.amount}`)
      }
      const now = moment.utc()
      log.debug(chargeData)
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
    getActiveSessionIds: (businessId, fromDate, toDate, skip, limit) => {

      if (!businessId) {
        throw new Error('business ID is undefined')
      }
      if (!fromDate) {
        throw new Error('startDate is undefined')
      }
      if (!limit) {
        throw new Error('limit is undefined')
      }
      if (skip == null) {
        throw new Error('skip is undefined')
      }

      try {
        const startDate = moment.utc(fromDate).format(config.DATABASE_DATE_FORMAT)
        const endDate = toDate ? moment.utc(toDate).format(config.DATABASE_DATE_FORMAT) : moment.utc().format(config.DATABASE_DATE_FORMAT)
        const sqlQuery = `SELECT sessionId
 FROM ${SESSION_TABLE} WHERE businessId='${businessId}' AND creationDate>=toDateTime('${startDate}') AND creationDate<=toDateTime('${endDate}')
 AND (accStatusType=3 OR accStatusType=1) 
 GROUP BY sessionId LIMIT ${limit} OFFSET ${skip} `
        log.warn({sqlQuery})
        return query(sqlQuery).then((result) => {
          log.warn({result})
          return result
        })
      } catch (error) {
        log.error('get sessions %j', error)
        throw error
      }
    },
    getSessionUsage: (sessionId) => {

      if (!sessionId) {
        throw new Error('session ID is undefined')
      }

      try {

        const sqlQuery = `SELECT any(framedIpAddress) as framedIpAddress,sessionId,any(nasIp) as nasIp,
any(username) as username,any(memberId) as memberId,toInt32(sum(download)) as download,toInt32(sum(upload)) as upload,toInt32(sum(sessionTime)) as sessionTime
 FROM ${SESSION_TABLE} WHERE sessionId='${sessionId}'
 GROUP BY sessionId `

        log.warn({sqlQuery})
        return query(sqlQuery).then((result) => {
          log.warn({result})
          return result[0]
        })
      } catch (error) {
        log.error('get session usage %j', error)
        throw error
      }
    },
    countSessions: (businessId, fromDate, toDate) => {

      if (!businessId) {
        throw new Error('business ID is undefined')
      }
      if (!fromDate) {
        throw new Error('startDate is undefined')
      }

      try {
        const startDate = moment.utc(fromDate).format(config.DATABASE_DATE_FORMAT)
        const endDate = toDate ? moment.utc(toDate).format(config.DATABASE_DATE_FORMAT) : moment.utc().format(config.DATABASE_DATE_FORMAT)
        const sqlQuery = `SELECT  sessionId,count() as count FROM ${SESSION_TABLE} WHERE businessId='${businessId}' 
AND creationDate>=toDateTime('${startDate}') AND creationDate<=toDateTime('${endDate}') AND (accStatusType=3 OR accStatusType=1) group by sessionId`
        log.debug({sqlQuery})
        return query(sqlQuery).then(function (result) {
          log.debug({result})
          return {
            count: result.length
          }
        })
      } catch (error) {
        log.error('count sessions %j', error)
        throw error
      }
    },
    getSessionsById: (sessionId) => {
      if (!sessionId) {
        throw new Error('sessionId ID is undefined')
      }
      try {
        const sqlQuery = `SELECT  * FROM ${SESSION_TABLE} WHERE sessionId='${sessionId}'`
        log.debug({sqlQuery})
        return query(sqlQuery).then(function (result) {
          log.debug({result})
          return result[0]
        })
      } catch (error) {
        log.error('find sessions by id %j', error)
        throw error
      }
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
        const fromDate = moment.utc(startDate).format(config.DATABASE_DATE_FORMAT)
        const sqlQuery = `SELECT * FROM ${CHARGE_TABLE} WHERE businessId='${businessId}' AND date>=toDateTime('${fromDate}') ORDER BY date LIMIT ${limit} OFFSET ${skip}`
        log.debug({sqlQuery})
        return query(sqlQuery).then(function (result) {
          log.debug({result})
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
          log.debug(result)
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
        moment.utc(chargeData.date).format(config.DATABASE_DATE_FORMAT)
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