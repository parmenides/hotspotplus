'use strict'
const logger = require('../../server/modules/logger')
const app = require('../../server/server')
const log = logger.createLogger()
const Q = require('q')
const radiusPod = require('../../server/modules/radiusDisconnectService')
const kafka = require('kafka-node')
const config = require('../../server/modules/config')
const db = require('../../server/modules/db.factory')
const moment = require('moment')
const cacheManager = require('../../server/modules/cacheManager')
const _ = require('underscore')

const kafkaClient = new kafka.KafkaClient({
  kafkaHost: process.env.KAFKA_CONNECTION,
  autoConnect: true,
  reconnectOnIdle: true,
  connectRetryOptions: {
    retries: 200,
    factor: 3,
    randomize: true,
  }
})

const kafkaProducer = new kafka.Producer(kafkaClient, {partitionerType: 2})

kafkaProducer.on('ready', function () {
  log.debug('kafka producer is ready...')
})

kafkaProducer.on('error', function (error) {
  log.error('Producer preparation failed:', error)
  kafkaClient.connect()
})

module.exports = function (ClientSession) {
  ClientSession.setSession = async (options) => {
    const {RadiusAccountingMessage, member, nas} = options
    const sessionId = RadiusAccountingMessage.getSessionId()
    let session = {}
    session.sessionId = sessionId
    session.memberId = member.id
    session.businessId = nas.businessId
    session.nasId = nas.id
    session.departmentId = nas.department
    session.nasIp = RadiusAccountingMessage.getNasIp()
    session.framedIpAddress = RadiusAccountingMessage.getAttribute('framedIpAddress')
    session.creationDate = moment.utc(RadiusAccountingMessage.getAttribute('timestamp')).unix()
    session.username = RadiusAccountingMessage.getAttribute('username')
    session.accStatusType = RadiusAccountingMessage.getAttribute('acctStatusType')
    session.sessionId = RadiusAccountingMessage.getAttribute('sessionId')
    session.mac = RadiusAccountingMessage.getAttribute('mac')
    session.download = RadiusAccountingMessage.getAttribute('download') || 0
    session.upload = RadiusAccountingMessage.getAttribute('upload') || 0
    session.sessionTime = !_.isUndefined(RadiusAccountingMessage.getAttribute('sessionTime')) ? RadiusAccountingMessage.getAttribute('sessionTime') : 0
    // session.groupIdentity = member.groupIdentity
    session.groupIdentityId = member.groupIdentityId
    // session.groupIdentityType = member.groupIdentityType

    const Usage = app.models.Usage
    const calculatedUsage = await Usage.calculateUsage(sessionId, {
      download: session.download,
      upload: session.upload,
      sessionTime: session.sessionTime,
    })

    await Usage.updateSessionUsageCache(session)
    await cacheManager.addMemberUsage({memberId: session.memberId, sessionId, ...calculatedUsage})
    session = {...session, ...calculatedUsage}
    await cacheManager.cacheMemberSession(session.memberId, sessionId, session)
    await cacheManager.cacheBusinessSession(session.businessId, sessionId, session)
    await ClientSession.sendToBroker(session)
  }

  ClientSession.sendToBroker = async (session) => {
    return Q.promise((resolve, reject) => {

      kafkaClient.refreshMetadata([config.SESSION_TOPIC], function (error) {
        if (error) {
          log.error('@refreshMetadata Error:', error)
          kafkaClient.connect()
          return reject(error)
        }

        kafkaProducer.send(
          [
            {
              topic: config.SESSION_TOPIC,
              messages: JSON.stringify(session),
            },
          ],
          function (error, data) {
            if (error) {
              log.error('Failed to add session to kafka: ', error)
              kafkaClient.connect()
              return reject(error)
            }
            log.debug('session sent to kafka ', JSON.stringify(session), data)
            return resolve()
          }
        )
      })
    })
  }

  ClientSession.getOnlineUsers = async (
    startDate,
    endDate,
    businessId,
    departments,
    skip,
    limit,
    cb
  ) => {
    if (skip == null) {
      skip = 0
    }
    if (limit == null) {
      limit = 10
    }
    startDate = startDate ? startDate : (new Date()).remove({minutes: 2})
    endDate = endDate ? endDate : (new Date()).add({minutes: 2})
    const sessions = []

    const activeSessions = await db.getActiveSessionIds(businessId, departments, startDate, endDate, skip, limit)
    for (const session of activeSessions) {
      const sessionData = await db.getSessionUsage(session.sessionId)
      if (sessionData && sessionData.memberId) {
        sessionData.download = Number(sessionData.download)
        sessionData.upload = Number(sessionData.upload)
        sessionData.sessionTime = Number(sessionData.sessionTime)
        sessions.push(sessionData)
      }
    }
    return sessions
    // return cb(null, {data: 'noReport'})
  }

  ClientSession.getActiveMemberSessions = async (memberId) => {
    const sessions = await cacheManager.getMemberSessions(memberId)
    log.debug('return sessions from cache,', sessions);
    return sessions
    /* const minutes = Math.round((Number(config.DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS) / 60) + 1)
    startDate = startDate ? startDate : (new Date()).remove({minutes})
    endDate = endDate ? endDate : (new Date()).add({minutes})
    return db.getMemberSessions(memberId, startDate, endDate) */
  }

  ClientSession.remoteMethod('getOnlineUsers', {
    description: 'Get Online Users Report.',
    accepts: [
      {
        arg: 'startDate',
        type: 'number',
      },
      {
        arg: 'endDate',
        type: 'number',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'departments',
        type: 'array',
        required: true
      },
      {
        arg: 'skip',
        type: 'number',
        required: false,
      },
      {
        arg: 'limit',
        type: 'number',
        required: false,
      },
    ],
    returns: {arg: 'result', type: 'Object'},
  })

  ClientSession.getOnlineSessionCount = async (businessId, departments) => {
    log.debug('@getOnlineSessionCount : ', businessId);
    let result
    result = await cacheManager.getBusinessSessions(businessId, (session) => {
      if (departments.includes(session.departmentId)) {
        return session
      }
    })
    return {count: result.length}
  }

  ClientSession.remoteMethod('getOnlineSessionCount', {
    description: 'Get Online Sessions Count.',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'departments',
        type: 'array',
        required: true,
      },
      {
        arg: 'startDate',
        type: 'number',
      }, {
        arg: 'endDate',
        type: 'number',
      },
    ],
    returns: {root: true},
  })

  ClientSession.killOnlineSession = async (session) => {
    log.debug('@killOnlineSession : ', session)
    if (!session.memberId) {
      return cb('memberId is not defined')
    }
    const sessionId = session.sessionId
    const loadedSession = await db.getSessionsById(sessionId)
    radiusPod.sendPod(loadedSession)
    return {ok: true, killedSession: loadedSession}
  }

  ClientSession.remoteMethod('killOnlineSession', {
    description: 'Kill Online Session',
    accepts: [
      {
        arg: 'session',
        type: 'object',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  })
}
