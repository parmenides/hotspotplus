const CONFIG_SERVER_URL = 'https://lcapiv4.prohotspotplus.com/api';
//var CONFIG_SERVER_URL = "http://lcapi.captiveportal.ir/api";
//var CONFIG_SERVER_URL = 'http://lc.localhotspot.ir/api';

module.exports = {
  CONFIG_SERVER_URL: CONFIG_SERVER_URL,
  LICENSE_LOGIN: CONFIG_SERVER_URL + '/Licenses/login',
  SYSTEM_ID_PATH:'/app/machine-id',
  REDIS: {
    HOST: process.env.REDIS_IP,
    PORT: process.env.REDIS_PORT,
    PASS: null,
    OPTIONS: {}
  },
  CONFIG_SERVER_PING:
    CONFIG_SERVER_URL + '/LicenseAudits/ping?access_token={token}',
  DOWNLOAD_LICENSE:
    CONFIG_SERVER_URL +
    '/Licenses/downloadLicense?systemUuid={systemUuid}&access_token={token}',
  PASSWORD_PREFIX: '#$*%*#$^%@)',
  PING_JOB_SCHEDULER: '0 1 * * *',
  LC_PATH: '/key',
  LOG_DIR: '/logs',
};
