const axios = require('axios');
const http = require('http');
const https = require('https');

const HTTP_KEEP_ALIVE_TIME = 5 * 60 * 1000;
const HTTP_TIME_OUT = 1000 * 60;

module.exports = (apiBaseUrl) => {
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
