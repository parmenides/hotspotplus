"use strict";
var Q = require('q');
var logger = require('./logger');
var log = logger.createLogger();
const ACCOUNTING_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}accounting`;
const CHARGE_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}charge`;
const LICENSE_CHARGE_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}licensecharge`;
const { Client } = require('@elastic/elasticsearch');
const elasticClient = new Client({
    node: `http://${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,
    apiVersion: '6.7',
    log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
});
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
var self = this;
redisClient.get('methodNames', function (error, methods) {
    log.debug('Methods: ', methods);
    if (error || !methods) {
        log.error('failed to load methods');
        return;
    }
    methods = JSON.parse(methods);
    for (let i in methods) {
        (function (theMethodName) {
            log.debug('TheMethodName: ', theMethodName);
            redisClient.get(`sc_${theMethodName}`, function (error, a_method) {
                if (error) {
                    log.error(error);
                    return;
                }
                module.exports[theMethodName] = function () {
                    log.debug(theMethodName);
                    log.debug(arguments);
                    return eval(`(${a_method}).apply(this,arguments)`);
                    //return eval('(' + a_method + ').apply(this,arguments)');
                };
            });
        })(methods[i]);
    }
});
//# sourceMappingURL=aggregates.js.map