import express from 'express';
import logger from './logger';
const log = logger.createLogger();
// tslint:disable-next-line
const isDev = process.env.DEV == 'true';

const errorHandler: express.ErrorRequestHandler = (error, req, res, next) => {
  if (isDev) {
    if (!error.status || error.status > 499) {
      // tslint:disable-next-line no-console
      console.log(error.stack);
      log.error('Error:', error);
      //log.error('Main Error Handler:', error.stack);
    }
  }

  res.status(error.status || 500);
  res.send({ message: error.message });
};

export default errorHandler;
