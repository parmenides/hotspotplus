/**
 * Created by rezanazari on 3/9/18.
 */
var Q = require ( 'q' );
var fs = require ( 'fs' );
var Dropbox = require ( 'dropbox' );
var logger = require ( './logger' );
var util = require ( './utility' );
var log = logger.createLogger (  );

module.exports.uploadFile = function ( filePath, fileName, dropboxToken ) {
	return Q.promise ( function ( resolve, reject ) {
		var dbx = new Dropbox ( { accessToken: dropboxToken } );
		fs.readFile ( filePath, { encoding: 'utf8' },
			function read ( error, file ) {
				if ( error ) {
					return reject ( error );
				}
				dbx.filesUpload ( { path: '/' + fileName, contents: file } ).then ( function () {
					return resolve ( { status: true } );
				} ).catch ( function ( error ) {
					return reject ( error );
				} );
			} );
	} );
};

process.on ( 'uncaughtException', function ( error ) {
	console.error ( 'Something bad happened here....' );
	console.error ( error );
	console.error ( error.stack );
	log.error ( error );
	log.error ( error.stack );
	util.sendMessage ( error, { fileName: 'copy-to-dropbox.js', source: 'services' } );
} );