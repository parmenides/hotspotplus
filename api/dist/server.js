"use strict";
var loopback = require('loopback');
var bodyParser = require('body-parser');
var boot = require('loopback-boot');
var config = require('./modules/config');
var app = (module.exports = loopback());
var logger = require('./modules/logger');
var log = logger.createLogger();
require('date-utils');
var cors = require('cors');
var redis = require('redis');
var redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);
var utility = require('./modules/utility');
var dataSource = {
    connector: require('loopback-connector-mongodb'),
    url: 'mongodb://' +
        process.env.MONGO_IP +
        ':27017/' +
        process.env.MONGO_DB_NAME +
        '?w=1&j=true',
    name: 'mongo'
};
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(dataSource.url, function (error, db) {
    if (error) {
        console.log('connection to mongo failed');
        console.log(error);
        return;
    }
    db.collection('ClientSession').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    db.collection('NasSession').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    db.collection('Member').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
});
app.dataSource('mongo', dataSource);
app.use(loopback.token());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors());
app.get('/a/:urlKey', function (req, res) {
    var urlKey = req.params.urlKey;
    redisClient.get(urlKey, function (error, reply) {
        if (error) {
            log.error(error);
            return res.status(500).json({ ok: false });
        }
        if (!reply) {
            //log.error ( "businessData not found for ip", hostIp );
            return res.redirect(302, 'http://google.com');
        }
        return res.redirect(302, reply);
    });
});
app.get('/api/status', function (req, res) {
    res.redirect(301, 'http://example.com');
});
// Prevent Wapelizer from exposing our server side technologies.
app.use(function (req, res, next) {
    res.setHeader('X-Powered-By', 'PHP 4.2.0');
    next();
});
app.use(function (req, res, next) {
    if (req.path.indexOf('/api') !== -1) {
        if (req.path.indexOf('/api/radius/loadThemeConfig') !== -1) {
            process.env.EXTRACTED_HOTSPOT_ADDRESS =
                req.protocol + '://' + req.get('Host');
        }
        else {
            process.env.EXTRACTED_EXTERNAL_API_ADDRESS =
                req.protocol + '://' + req.get('Host');
            process.env.EXTRACTED_WEB_APP_ADDRESS = req.get('Origin');
        }
    }
    next();
});
app.use(function (request, response, next) {
    response.on('finish', function () {
        var statusCode = response.statusCode;
        statusCode = Number(statusCode);
        if (statusCode >= 500) {
            var myError = 'Http Error ' + response.statusCode + ' ' + request.path;
            utility.sendMessage(myError, {
                request: request.body
            });
        }
        else if (statusCode == 403) {
            var myError = 'Error UnAuthorized Access' + response.statusCode + ' ' + request.path;
            utility.sendMessage(myError, {
                request: request.body
            });
        }
        else if (statusCode >= 400) {
            var myError = 'Http Error ' + response.statusCode + ' ' + request.path;
            utility.sendMessage(myError, {
                request: request.body
            });
        }
    });
    return next();
});
app.start = function () {
    // start the web server
    return app.listen(function () {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};
boot(app, __dirname, function (err) {
    if (err)
        throw err;
    // start the server if `$ node server.js`
    if (require.main === module) {
        app.start();
    }
});
process.on('uncaughtException', function (error) {
    console.error('Something bad happened here....');
    console.error(error);
    console.error(error.stack);
    log.error(error);
    log.error(error.stack);
    //utility.sendMessage ( error, { fileName: 'server.js', source: 'boot' } );
});
//# sourceMappingURL=server.js.map