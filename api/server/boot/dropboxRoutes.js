/**
 * Created by payam on 12/14/16.
 */
var logger = require ( "hotspotplus-common" ).logger;
var log = logger.createLogger ( process.env.APP_NAME, process.env.LOG_DIR );

module.exports = function ( app ) {
	var router = app.loopback.Router ()

	router.get ( '/api/dropBox', function ( req, res ) {
		var Business = app.models.Business;
		Business.dropboxSaveToken ( req.query ).then ( function ( result ) {
			var url = result.returnUrl;
			var code = result.code;
			return res.status ( code ).redirect ( url )
		} ).fail ( function ( error ) {
			log.error ( 'error' )
			log.error ( error )
			return res.json ( 500, {error: error} )
		} );
	} );

	app.use ( router )
}
