'use strict';
var logger = require('../../server/modules/logger');
var app = require('../../server/server');
var log = logger.createLogger();
var Q = require('q');
var radiusPod = require('../../server/modules/radiusDisconnectService');
const kafkaClient = new kafka.KafkaClient({
  kafkaHost: process.env.KAFKA_IP + ':' + process.env.KAFKA_PORT,
});
const kafkaProducer = new kafka.Producer(kafkaClient, {partitionerType: 2});

kafkaProducer.on('ready', function() {
  log.warn('Producer ready...');
  kafkaClient.refreshMetadata([config.SESSION_TOPIC], function(error) {
    log.debug('@refreshMetadata Error:', error);
  });
});

kafkaProducer.on('error', function(error) {
  log.error('Producer preparation failed:', error);
});


module.exports = function(ClientSession) {
  
  ClientSession.saveLogSession = function(session){
    kafkaProducer.send(
      [
        {
          topic: config.SESSION_TOPIC,
          messages: JSON.stringify(session),
        },
      ],
      function(error, data) {
        if (error) {
          log.error('Failed to add session to kafka: ', error);
          return;
        }
        log.debug('session added:', data);
      },
    );
  }
  
  ClientSession.getOnlineUsers = function(
    startDate,
    businessId,
    skip,
    limit,
    cb,
  ) {
    if (!businessId) {
      return cb('Business Id not defined');
    }
    if (!startDate) {
      return cb('Start date is not defined');
    }
    if (skip == null) {
      skip = 0;
    }
    if (limit == null) {
      limit = 10;
    }
    startDate = startDate.toString();
    // find sessions of business
    /*fields: { memberId: true, ipId: true, creationDate: true, expiresAt: false, businessId: false },*/
    var Usage = app.models.Usage;
    ClientSession.find(
      {
        where: { businessId: businessId },
        order: 'expiresAt DESC',
        limit: limit,
        skip: skip,
      },
      function(error, sessionList) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        // if no online users find, return no session
        if (sessionList.length == 0) {
          return cb(null, { data: 'noSession' });
        } else {
          // get owner info from getSubscriptionDate
          // create array of getSessionsReport aggregation function
          log.debug('Sessions length', sessionList.length);
          if (sessionList.length > 0) {
            Usage.getSessionUsage(sessionList)
              .then(function(result) {
                return cb(null, result);
              })
              .fail(function(error) {
                log.error(error);
                return cb(error);
              });
          } else {
            return cb(null, { data: 'noReport' });
          }
        }
      },
    );
  };

  ClientSession.remoteMethod('getOnlineUsers', {
    description: 'Get Online Users Report.',
    accepts: [
      {
        arg: 'startDate',
        type: 'number',
        required: true,
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
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
    returns: { arg: 'result', type: 'Object' },
  });

  ClientSession.getOnlineSessionCount = function(businessId, cb) {
    if (!businessId) {
      return cb('Business Id not defined');
    }
    log.debug('@getOnlineSessionCount : ', businessId);
    ClientSession.find({ where: { businessId: businessId } }, function(
      error,
      count,
    ) {
      if (error) {
        log.error(error);
        return cb(error);
      }
      log.debug(count.length);
      return cb(null, { count: count.length });
    });
  };

  ClientSession.remoteMethod('getOnlineSessionCount', {
    description: 'Get Online Sessions Count.',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  });

  ClientSession.killOnlineSession = function(session, ctx, cb) {
    log.debug('@killOnlineSession : ', session);
    var businessId = ctx.currentUserId;
    if (!session.memberId) {
      return cb('memberId is not defined');
    }
    var memberId = session.memberId;
    var sessionId = session.id;
    ClientSession.findOne(
      {
        where: {
          and: [
            { memberId: memberId },
            { businessId: businessId },
            { id: sessionId },
          ],
        },
      },
      function(error, loadedSession) {
        if (error) {
          return cb(error);
        }
        if (!loadedSession) {
          return cb(new Error('session not found'));
        }
        radiusPod.sendPod(loadedSession);
        return cb(null, { ok: true, killedSession: loadedSession });
      },
    );
  };

  ClientSession.remoteMethod('killOnlineSession', {
    description: 'Kill Online Session',
    accepts: [
      {
        arg: 'session',
        type: 'object',
        required: true,
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' },
    ],
    returns: { root: true },
  });
};
