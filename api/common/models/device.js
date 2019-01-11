/*
 var Q = require('q');
 var logger = require('../../server/logger');
 var log = logger.createLogger(process.env.APP_NAME,process.env.LOG_DIR);
 var config = require('../../server/config');
 var DEVICE_QUEUE = Queue(config.DEVICE_QUEUE, {redis: {port: config.REDIS.PORT, host: config.REDIS.HOST}});
 */
module.exports = function ( Device ) {
	Device.observe( 'before save', function ( ctx, next ) {
		// Check if nas is created
		if ( ctx.instance && ctx.isNewInstance ) {
			ctx.instance.id = ctx.instance.id.replace( /-/g, '' ).replace( /:/g, '' ).replace( /\./g, '' )
		}
		next ()
	} );
	/*
	 // Add device details to bull queue
	 Device.observe('after save', function (ctx, next) {
	 DEVICE_QUEUE.add(ctx.instance,{attempts: 5, backoff: {delay: 60000}});
	 next();
	 });
	 */
}
