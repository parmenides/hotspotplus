require('date-utils');
const needle = require('needle');
const logger = require('./logger');
const log = logger.createLogger();

module.exports.sendMessageToKavehnegar = function(
  SMS_API_KEY,
  receptor,
  token,
  token2,
  token3,
  token10,
  template
) {
  log.debug('@sendMessageToKavehnegar');
  const LOOKUP_SMS_PROVIDER =
    'https://api.kavenegar.com/v1/' + SMS_API_KEY + '/verify/lookup.json';
  const data = {};
  data.receptor = receptor;
  data.token = token;
  data.token2 = token2;
  data.token3 = token3;
  data.token10 = token10;
  data.template = template;
  log.debug(LOOKUP_SMS_PROVIDER);
  return needle('post', LOOKUP_SMS_PROVIDER, data).then(function(result) {
    const body = result.body;
    log.debug('Response:', typeof body);
    log.debug('Response:', body);
    if (body && body.return.status !== 200) {
      log.error(body);
      throw new Error(JSON.stringify(body));
    }
    if (body && body.entries) {
      return (result.body.entries[0].cost / 10) * -1;
    } else {
      throw new Error(500, 'no result from messaging service');
    }
  });
};

module.exports.sendGroupMessageToKavehnegar = function(
  SMS_API_KEY,
  receptors,
  message
) {
  const GROUP_SMS_PROVIDER =
    'https://api.kavenegar.com/v1/' + SMS_API_KEY + '/sms/send.json';
  const data = {};
  data.receptor = receptors.join(',').toString();
  data.message = message;
  log.debug(GROUP_SMS_PROVIDER);
  log.debug(data);
  return needle('post', GROUP_SMS_PROVIDER, data).then(function(result) {
    const body = result.body;
    log.debug('Response:', body);
    if (body && body.return && body.return.status !== 200) {
      log.error(body);
      throw new Error(JSON.stringify(body));
    }
    if (body && body.entries) {
      const entries = result.body.entries;
      let cost = 0;
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        cost = cost + (entry.cost / 10) * -1;
      }
      return cost;
    } else {
      throw new Error(500, 'no result from messaging service');
    }
  });
};
