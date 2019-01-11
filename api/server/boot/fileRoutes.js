/**
 * Created by payamyousefi on 5/11/15.
 */
var config = require ( '../modules/config' );
var logger = require ("hotspotplus-common").logger;
var log = logger.createLogger(process.env.APP_NAME,process.env.LOG_DIR);
var multer = require ( 'multer' )
var path = require ( 'path' );

var storage = multer.diskStorage ( {
	storage:  function ( req, file, cb ) {
		cb ( null, './uploads' )
	},
	filename: function ( req, file, cb ) {
		cb ( null, file.originalname )
	}
} )
var upload = multer ( { storage: storage } )

module.exports = function ( app ) {
	var router = app.loopback.Router ()

	router.get ( '/api/file/download/:fileId', function ( req, res ) {
		var File = app.models.FileStorage
		var fileId = req.params.fileId
		File.readFile ( fileId ).then ( function ( result ) {
			var fileName = result.name;
			var fileData = result.contentBuffer;
			/*var size = result.size;*/
			var mimeType = result.mimeType;
			res.writeHead( 200, {
				'Content-Type':        mimeType,
				'Content-Length':      fileData.length,
				'Content-Disposition': "attachment; filename=" + fileName
			} );
			res.write( fileData );
			res.end();
		} ).fail ( function ( error ) {
			return res.status ( 500 ).json ( { error: error } )
		} )
	} );

	router.post ( '/api/file/upload', upload.any (), function ( req, res ) {
		var File = app.models.FileStorage;
		var file = req.files[ 0 ];
		var mimetype = file.mimetype
		var filename = file.filename
		var size = file.size
		var businessId = req.body.businessId

		File.addFile ( businessId, file.path, mimetype, filename, size ).then ( function ( fileId ) {
			return res.status ( 200 ).json ( { fileId: fileId } )
		} ).fail ( function ( error ) {
			return res.status ( 500 ).json ( { error: error } )
		} )
	} );

	app.use ( router )
};
