/**
 * Created by payamyousefi on 6/29/16.
 */

import bunyan from 'bunyan';

export default {
  createLogger,
};
const createLogger = function() {
  const name = process.env.APP_NAME;
  const path = process.env.LOG_DIR;
  return bunyan.createLogger({
    name: name,
    streams: [
      {
        level: process.env.LOG_LEVEL || 'debug',
        path: path + '/' + name + '-debug.log',
      },
      {
        level: 'error',
        path: path + '/' + name + '-error.log',
      },
    ],
  });
};
