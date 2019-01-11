var logger = require('hotspotplus-common').logger;
var config = require('../modules/config');
var Q = require('q');

module.exports = function(Generic) {
  Generic.getLogger = function() {
    return logger.createLogger(process.env.APP_NAME, process.env.LOG_DIR);
  };
  var log = Generic.getLogger();

  Generic.isMongoDbStorage = function() {
    return config.STORAGE === config.STORAGES.MONGODB;
  };
  Generic.isElasticStorage = function() {
    return config.STORAGE === config.STORAGES.ELASTICSEARCH;
  };
  Generic.getCurrentUserId = function(ctx) {
    const token = ctx && ctx.accessToken;
    const userId = token && token.userId;
    return userId;
  };

  Generic.createOptionsFromRemotingContext = function(ctx) {
    var base = this.base.createOptionsFromRemotingContext(ctx);
    base.currentUserId = base.accessToken && base.accessToken.userId;
    return base;
  };
};
