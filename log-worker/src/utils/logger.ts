import bunyan from 'bunyan';

export const createLogger = () => {
  const level: bunyan.LogLevel = process.env.LOG_LEVEL as bunyan.LogLevel;
  let streams;
  if (process.env.LOG_LEVEL && process.env.LOG_PATH) {
    streams = [
      {
        path: process.env.LOG_PATH,
        period: '1d', // daily rotation
      },
    ];
  }
  return bunyan.createLogger({
    name: 'log-workerV3',
    streams,
    level,
  });
};

export default {
  createLogger,
};
