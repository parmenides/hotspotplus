/**
 * Created by payamyousefi on 6/29/16.
 */

const bunyan = require('bunyan');
const config = require('./config');

module.exports.createLogger = function() {
  const name = 'API';
  const path = config.LOG.LOG_DIR;

  return bunyan.createLogger({
    name: name,
    streams: [
      {
        level: config.LOG.LOG_LEVEL,
        path: path + '/' + name + '-debug.log',
      },
      {
        level: 'error',
        path: path + '/' + name + '-error.log',
      },
    ],
  });
};
