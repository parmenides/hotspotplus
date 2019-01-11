/**
 * Created by payamyousefi on 6/29/16.
 */

var config = require ( './config' )
var bunyan = require ( 'bunyan' )

var pinFiLogger = bunyan.createLogger( {
	name:    'PinFi',
	streams: [
		{
			level: 'debug',
			path:  config.LOG.LOG_DIR + '/pinfi-debug.log'  // log ERROR and above to a file
		},
		{
			level: 'error',
			path:  config.LOG.LOG_DIR + '/pinfi-error.log'  // log ERROR and above to a file
		}
	]
} )

module.exports.pinFiLogger = pinFiLogger

var subscriberLogger = bunyan.createLogger( {
	name:    'subscriberLogger',
	streams: [
		{
			level: 'debug',
			path:  config.LOG.LOG_DIR + '/subscriberLogger-debug.log'  // log ERROR and above to a file
		},
		{
			level: 'error',
			path:  config.LOG.LOG_DIR + '/subscriberLogger-error.log'  // log ERROR and above to a file
		}
	]
} )

module.exports.subscriberLogger = subscriberLogger
