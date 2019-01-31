import bunyan from 'bunyan';

export const createLogger = () => {
  const level: bunyan.LogLevel = process.env.LOG_LEVEL as bunyan.LogLevel;
  let streams;
  if (process.env.LOG_LEVEL && process.env.LOG_PATH) {
    streams = [
      {
        path: process.env.LOG_PATH,
      },
    ];
  }
  return bunyan.createLogger({
    name: 'log-worker',
    streams,
    level,
  });
};

export default {
  createLogger,
};
