import axios from 'axios';
import http from 'http';
import https from 'https';
import logger from './logger';

const HTTP_KEEP_ALIVE_TIME = 5 * 60 * 1000;
const HTTP_TIME_OUT = 8000;

export const createHttpClient = (apiBaseUrl: string) => {
  return axios.create({
    baseURL: apiBaseUrl,
    timeout: HTTP_TIME_OUT,
    httpAgent: new http.Agent({
      keepAlive: true,
      keepAliveMsecs: HTTP_KEEP_ALIVE_TIME,
    }),
    httpsAgent: new https.Agent({
      keepAlive: true,
      keepAliveMsecs: HTTP_KEEP_ALIVE_TIME,
    }),
  });
};
