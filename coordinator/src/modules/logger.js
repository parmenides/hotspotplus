/**
 * Created by payamyousefi on 6/29/16.
 */

var bunyan = require('bunyan');
const config = require('../config')
module.exports.createLogger = function() {
  const name =  'coordinator';
  const path = config.LOG_DIR;
  return bunyan.createLogger({
    name: name,
    streams: [
      {
        level: process.env.LOG_LEVEL || 'info',
        path: path + '/' + name + '-debug.log'
      },
      {
        level: 'error',
        path: path + '/' + name + '-error.log'
      }
    ]
  });
};
