var loopback = require('loopback')
var bodyParser = require('body-parser')
var boot = require('loopback-boot')
var mongoConnector = require('loopback-connector-mongodb')

//var config = require('./modules/config');
var app = (module.exports = loopback())
const Sentry = require('@sentry/node')

if (process.env.ENABLE_SENTRY) {
  Sentry.init({dsn: process.env.SENTRY_URL})
  app.use(Sentry.Handlers.requestHandler());
}

var logger = require('./modules/logger')
var log = logger.createLogger()
require('date-utils')
var cors = require('cors')
//var redis = require('redis');
//var redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);

app.dataSource('mongo', {
  connector: mongoConnector,
  url:
    'mongodb://' +
    process.env.MONGO_IP +
    ':27017/' +
    process.env.MONGO_DB_NAME +
    '?w=1&j=true',
  name: 'mongo'
})

app.use(loopback.token())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true})) // support encoded bodies
app.use(cors())

// Prevent Wapelizer from exposing our server side technologies.
app.use(function (req, res, next) {
  res.setHeader('X-Powered-By', 'PHP 4.2.0')
  next()
})

app.use(function (req, res, next) {
  if (req.path.indexOf('/api') !== -1) {
    if (req.path.indexOf('/api/radius/loadThemeConfig') !== -1) {
      process.env.EXTRACTED_HOTSPOT_ADDRESS =
        req.protocol + '://' + req.get('Host')
    } else {
      process.env.EXTRACTED_EXTERNAL_API_ADDRESS =
        req.protocol + '://' + req.get('Host')
      process.env.EXTRACTED_WEB_APP_ADDRESS = req.get('Origin')
    }
  }
  next()
})

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started')
    var baseUrl = app.get('url').replace(/\/$/, '')
    console.log('Web server listening at: %s', baseUrl)
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath)
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath)
    }
  })
}
boot(app, __dirname, function (err) {
  if (err) throw err

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start()
  }
})
if (process.env.ENABLE_SENTRY) {
  app.use(Sentry.Handlers.errorHandler())
}

/*
process.on('uncaughtException', function (error) {
  console.error('Something bad happened here....')
  console.error(error)
  error ? console.error(error.stack) : null
  log.error(error)
  error ? log.error(error && error.stack) : null
  process.exit(1)
  //utility.sendMessage ( error, { fileName: 'server.js', source: 'boot' } );
})
*/
