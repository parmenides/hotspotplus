module.exports = function ( grunt ) {

	// Project configuration.
	grunt.initConfig ( {
		obfuscator: {
			options: {
				// global options for the obfuscator
			},
			task1:   {
				options: {
					compact: true,
					controlFlowFlattening: true,
					controlFlowFlatteningThreshold: 1,
					deadCodeInjection: true,
					deadCodeInjectionThreshold: 1,
					debugProtection: true,
					debugProtectionInterval: true,
					disableConsoleOutput: true,
					identifierNamesGenerator: 'hexadecimal',
					log: false,
					renameGlobals: false,
					rotateStringArray: true,
					selfDefending: true,
					stringArray: true,
					stringArrayEncoding: 'rc4',
					stringArrayThreshold: 1,
					transformObjectKeys: true,
					unicodeEscapeSequence: false
				},
				files:   {
					'build/': [
						'modules/**/*.js',
						'index.js'
					]
				}
			}
		},
		copy:       {
			main: {
				expand: true,
				src:    [
					'log/',
					'package.json',
					'package-lock.json',
					'modules/**/*',
					'index.js'
				],
				dest:   'build/',
			}
		}
	} );

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks ( 'grunt-contrib-obfuscator' );
	grunt.loadNpmTasks ( 'grunt-contrib-copy' );


	// Default task(s).
	grunt.registerTask ( 'default', [ 'copy:main', 'obfuscator' ] );

};