import bunyan from 'bunyan';

export const createLogger = () => {
  const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  const LOG_PATH = process.env.LOG_PATH || '/logs';
  const level: bunyan.LogLevel = LOG_LEVEL as bunyan.LogLevel;
  const streams = [
    {
      path: `${LOG_PATH}/log-worker.log`,
    },
  ];
  return bunyan.createLogger({
    name: 'log-worker',
    streams,
    level,
  });
};

export default {
  createLogger,
};
