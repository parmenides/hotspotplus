const loopback = require('loopback');
const bodyParser = require('body-parser');
const boot = require('loopback-boot');
const mongoConnector = require('loopback-connector-mongodb');

// var config = require('./modules/config');
const app = (module.exports = loopback());
const Sentry = require('@sentry/node');

if (process.env.ENABLE_SENTRY === 'true') {
  Sentry.init({dsn: process.env.SENTRY_URL});
  app.use(Sentry.Handlers.requestHandler());
}

const logger = require('./modules/logger');
const log = logger.createLogger();
require('date-utils');

app.dataSource('mongo', {
  connector: mongoConnector,
  url:
    'mongodb://' +
    process.env.MONGO_IP +
    ':27017/' +
    process.env.MONGO_DB_NAME +
    '?w=1&j=true',
  name: 'mongo',
});

app.use(loopback.token());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

app.use(function(req, res, next) {
  if (req.path.indexOf('/api') !== -1) {
    if (req.path.indexOf('/api/radius/loadThemeConfig') !== -1) {
      process.env.EXTRACTED_HOTSPOT_ADDRESS =
        req.protocol + '://' + req.get('Host');
    } else {
      process.env.EXTRACTED_EXTERNAL_API_ADDRESS =
        req.protocol + '://' + req.get('Host');
      process.env.EXTRACTED_WEB_APP_ADDRESS = req.get('Origin');
    }
  }
  next();
});

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
if (process.env.ENABLE_SENTRY === 'true') {
  app.use(Sentry.Handlers.errorHandler());
}

process.on('unhandledRejection', (reason, promise) => {
  log.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', function(error) {
  console.error('Something bad happened here....',Date());
  console.error(error);
  error ? console.error(error.stack) : null;
  log.error('Something bad happened here',error);
  error ? log.error(error && error.stack) : null;
  process.exit(1);
});
