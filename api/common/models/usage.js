'use strict';
const config = require('../../server/modules/config.js');
const logger = require('../../server/modules/logger');
const log = logger.createLogger();

const db = require('../../server/modules/db.factory');
const redis = require('promise-redis')();
const redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);


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

  Usage.getUsage = async (departments, startDate, endDate, ctx) => {
    const businessId = ctx.currentUserId;
    const result = await db.getBusinessUsage(businessId, departments, startDate, endDate);
    return result;
  };

  Usage.remoteMethod('getUsage', {
    description: 'Get usage report.',
    accepts: [
      {
        arg: 'departments',
        type: 'array',
        required:true,
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

  Usage.getTopMembers = async (departments, startDate, endDate, ctx) => {
    const businessId = ctx.currentUserId;
    const fromDate = Number.parseInt(startDate);
    const toDate = Number.parseInt(endDate);
    const limit = 10;
    const skip = 0;

    const username = [];
    const upload = [];
    const download = [];
    const sessionTime = [];


    const result = await db.getTopMembersByUsage(
      businessId,
      departments,
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
        arg: 'departments',
        type: 'array',
        description: 'departments',
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
