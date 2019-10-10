'use strict';
const kafka = require('kafka-node');
const config = require('../../server/modules/config.js');
const logger = require('../../server/modules/logger');
const log = logger.createLogger();
const kafkaClient = new kafka.KafkaClient({
  kafkaHost: process.env.KAFKA_IP + ':' + process.env.KAFKA_PORT,
});
const db = require('../../server/modules/db.factory');
const kafkaProducer = new kafka.Producer(kafkaClient, {partitionerType: 2});
const redis = require('promise-redis')();
const redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);

kafkaProducer.on('ready', function() {
  log.warn('Producer ready...');
  kafkaClient.refreshMetadata([config.ACCOUNTING_TOPIC], function(error) {
    log.debug('@refreshMetadata Error:', error);
  });
});

kafkaProducer.on('error', function(error) {
  log.error('Producer preparation failed:', error);
});

module.exports = function(Usage) {
  Usage.calculateUsage = async (sessionId, usage) => {
    let {upload, download, sessionTime} = usage;
    const previewsUsage = await Usage.getSessionUsageFromCache(sessionId);
    if (previewsUsage) {
      upload = upload - previewsUsage.upload;
      download = download - previewsUsage.download;
      sessionTime = sessionTime - previewsUsage.sessionTime;
    }
    return {upload, download, sessionTime};
  };

  Usage.getUsage = async (departmentId, startDate, endDate, ctx) => {
    const businessId = ctx.currentUserId;
    if (!departmentId) {
      return {
        bulk: 0,
        download: 0,
        upload: 0,
        sessionTime: 0,
      };
    }
    if (departmentId === 'all') {
      departmentId = null;
    }

    const result = await db.getBusinessUsage(businessId, departmentId, startDate, endDate);
    return result;
  };

  Usage.remoteMethod('getUsage', {
    description: 'Get usage report.',
    accepts: [
      {
        arg: 'departmentId',
        type: 'string',
        description: 'departmentId',
      },
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
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Usage.reportStatus = async () => {
    const dbInfo = await db.getDatabaseInfo();
    const info = {};
    for (const tb of dbInfo) {
      info[tb.table] = tb;
    }
    return {
      db: info,
    };
  };

  Usage.remoteMethod('reportStatus', {
    description: 'Get report.',
    accepts: [],
    returns: {root: true},
  });

  Usage.getTopMembers = async (departmentId, startDate, endDate, ctx) => {
    const businessId = ctx.currentUserId;
    const fromDate = Number.parseInt(startDate);
    const toDate = Number.parseInt(endDate);
    const limit = 10;
    const skip = 0;

    const username = [];
    const upload = [];
    const download = [];
    const sessionTime = [];

    if (!departmentId) {
      return {
        username,
        upload,
        download,
        sessionTime,
      };
    }
    if (departmentId === 'all') {
      departmentId = null;
    }

    const result = await db.getTopMembersByUsage(
      businessId,
      departmentId,
      fromDate,
      toDate,
      limit,
      skip
    );
    for (const res of result) {
      username.push(res.username);
      upload.push(Number(res.upload));
      download.push(Number(res.download));
      sessionTime.push(Number(res.sessionTime));
    }
    return {
      username,
      upload,
      download,
      sessionTime,
    };
  };

  Usage.remoteMethod('getTopMembers', {
    description: 'Get Top Members.',
    accepts: [
      {
        arg: 'departmentId',
        type: 'string',
        description: 'departmentId',
      },
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
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Usage.updateSessionUsageCache = async function(usage) {
    await redisClient.set(usage.sessionId, JSON.stringify(usage), 'EX', 3600);
  };

  Usage.getSessionUsageFromCache = async function(sessionId) {
    const usage = await redisClient.get(sessionId);
    if (!usage) {
      log.warn('previews session is empty');
      return;
    }
    return JSON.parse(usage);
  };
};
