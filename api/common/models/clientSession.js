'use strict'
var logger = require('../../server/modules/logger')
var app = require('../../server/server')
var log = logger.createLogger()
var Q = require('q')
var radiusPod = require('../../server/modules/radiusDisconnectService')
var kafka = require('kafka-node')
var config = require('../../server/modules/config')
const db = require('../../server/modules/db.factory')
const moment = require('moment')
var _ = require('underscore')

const kafkaClient = new kafka.KafkaClient({
  kafkaHost: process.env.KAFKA_IP + ':' + process.env.KAFKA_PORT
})

const kafkaProducer = new kafka.Producer(kafkaClient, {partitionerType: 2})

kafkaProducer.on('ready', function () {
  log.warn('Producer ready...')
  kafkaClient.refreshMetadata([config.SESSION_TOPIC], function (error) {
    log.debug('@refreshMetadata Error:', error)
  })
  /*
    kafkaProducer.send(
      [
        {
          topic: config.SESSION_TOPIC,
          messages: JSON.stringify({ message: 'sample' })
        }
      ],
      function(error, data) {
        if (error) {
          log.error(
            `failed to send sample message to kafka topic: ${
              config.SESSION_TOPIC
            }`,
            error
          );
          return;
        }
        log.debug('sample message sent', data);
      }
    );*/
})

kafkaProducer.on('error', function (error) {
  log.error('Producer preparation failed:', error)
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
    session.groupIdentity = member.groupIdentity
    session.groupIdentityId = member.groupIdentityId
    session.groupIdentityType = member.groupIdentityType

    var Usage = app.models.Usage
    const calculatedUsage = await Usage.calculateUsage(sessionId, {
      download: session.download,
      upload: session.upload,
      sessionTime: session.sessionTime
    })
    await Usage.cacheUsage(session)
    session = {...session, ...calculatedUsage}
    log.debug(session)
    await ClientSession.sendToBroker(session)
  }

  ClientSession.sendToBroker = async (session) => {
    return Q.promise((resolve, reject) => {
      kafkaProducer.send(
        [
          {
            topic: config.SESSION_TOPIC,
            messages: JSON.stringify(session)
          }
        ],
        function (error, data) {
          if (error) {
            log.error('Failed to add session to kafka: ', error)
            return reject(error)
          }
          log.debug('session added:', JSON.stringify(session), data)
          return resolve()
        }
      )
    })
  }

  ClientSession.getOnlineUsers = async (
    startDate,
    endDate,
    businessId,
    skip,
    limit,
    cb
  ) => {
    if (!businessId) {
      throw new Error('Business Id not defined')
    }
    if (skip == null) {
      skip = 0
    }
    if (limit == null) {
      limit = 10
    }
    startDate = startDate ? startDate : (new Date()).remove({minutes: 2})
    endDate = endDate ? endDate : (new Date()).add({minutes: 2})

    const activeSessions = await db.getActiveSessionIds(businessId, startDate, endDate, skip, limit)
    const sessions = []
    for (const session of activeSessions) {
      const sessionData = await db.getSessionUsage(session.sessionId)
      sessions.push(sessionData);
    }
    return sessions;
    //return cb(null, {data: 'noReport'})
  }

  ClientSession.remoteMethod('getOnlineUsers', {
    description: 'Get Online Users Report.',
    accepts: [
      {
        arg: 'startDate',
        type: 'number',
      }, {
        arg: 'endDate',
        type: 'number',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'skip',
        type: 'number',
        required: false
      },
      {
        arg: 'limit',
        type: 'number',
        required: false
      }
    ],
    returns: {arg: 'result', type: 'Object'}
  })

  ClientSession.getOnlineSessionCount = async (businessId, startDate, endDate) => {
    try {
      if (!businessId) {
        return cb('Business Id not defined')
      }
      log.debug('@getOnlineSessionCount : ', businessId)
      startDate = startDate ? startDate : (new Date()).remove({minutes: 2})
      endDate = endDate ? endDate : (new Date()).add({minutes: 2})
      const result = await db.countSessions(businessId, startDate, endDate)
      return {count: result.count}
    } catch (error) {
      log.error(error)
      throw new Error('failed to get online session count')
    }
  }

  ClientSession.remoteMethod('getOnlineSessionCount', {
    description: 'Get Online Sessions Count.',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'startDate',
        type: 'number',
      }, {
        arg: 'endDate',
        type: 'number',
      }
    ],
    returns: {root: true}
  })

  ClientSession.killOnlineSession = async (session) => {
    log.debug('@killOnlineSession : ', session)
    if (!session.memberId) {
      return cb('memberId is not defined')
    }
    var sessionId = session.sessionId
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
        required: true
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ],
    returns: {root: true}
  })
}
