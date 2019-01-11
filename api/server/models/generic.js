import logger from '../modules/logger';
import config from '../modules/config';

module.exports = function(Generic) {
  Generic.getLogger = function() {
    return logger.createLogger();
  };
  const log = Generic.getLogger();

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
