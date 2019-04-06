"use strict";
require('date-utils');
var needle = require('needle');
var logger = require('./logger');
var log = logger.createLogger();
module.exports.sendMessageToKavehnegar = function (SMS_API_KEY, receptor, token, token2, token3, token10, template) {
    log.debug('@sendMessageToKavehnegar');
    var LOOKUP_SMS_PROVIDER = 'https://api.kavenegar.com/v1/' + SMS_API_KEY + '/verify/lookup.json';
    var data = {};
    data.receptor = receptor;
    data.token = token;
    data.token2 = token2;
    data.token3 = token3;
    data.token10 = token10;
    data.template = template;
    log.debug(LOOKUP_SMS_PROVIDER);
    return needle('post', LOOKUP_SMS_PROVIDER, data).then(function (result) {
        var body = result.body;
        log.debug('Response:', typeof body);
        log.debug('Response:', body);
        if (body && body.return.status !== 200) {
            log.error(body);
            throw new Error(JSON.stringify(body));
        }
        if (body && body.entries) {
            return (result.body.entries[0].cost / 10) * -1;
        }
        else {
            throw new Error(500, 'no result from messaging service');
        }
    });
};
module.exports.sendGroupMessageToKavehnegar = function (SMS_API_KEY, receptors, message) {
    var GROUP_SMS_PROVIDER = 'https://api.kavenegar.com/v1/' + SMS_API_KEY + '/sms/send.json';
    var data = {};
    data.receptor = receptors.join(',').toString();
    data.message = message;
    log.debug(GROUP_SMS_PROVIDER);
    log.debug(data);
    return needle('post', GROUP_SMS_PROVIDER, data).then(function (result) {
        var body = result.body;
        log.debug('Response:', body);
        if (body && body.return && body.return.status !== 200) {
            log.error(body);
            throw new Error(JSON.stringify(body));
        }
        if (body && body.entries) {
            var entries = result.body.entries;
            var cost = 0;
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                cost = cost + (entry.cost / 10) * -1;
            }
            return cost;
        }
        else {
            throw new Error(500, 'no result from messaging service');
        }
    });
};
//# sourceMappingURL=kavehnegar.js.map