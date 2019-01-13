//var CONFIG_SERVER_URL = "https://lcapi.prohotspotplus.com/api";
//var CONFIG_SERVER_URL = "http://lcapi.captiveportal.ir/api";
var CONFIG_SERVER_URL = 'http://hotspotpluslicensapi:3000/api';

module.exports = {
  CONFIG_SERVER_URL: CONFIG_SERVER_URL,
  LICENSE_LOGIN: CONFIG_SERVER_URL + '/Licenses/login',
  CONFIG_SERVER_PING:
    CONFIG_SERVER_URL + '/LicenseAudits/ping?access_token={token}',
  DOWNLOAD_LICENSE:
    CONFIG_SERVER_URL +
    '/Licenses/downloadLicense?systemUuid={systemUuid}&access_token={token}',
  PASSWORD_PREFIX: process.env.PASSWORD_PREFIX,
  PING_JOB_SCHEDULER: '*/15 * * * *',
  SYSTEM_ID_PATH: process.env.SYSTEM_ID_PATH,
};
