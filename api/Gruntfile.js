module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    obfuscator: {
      options: {
        // global options for the obfuscator

      },
      task1: {
        options: {
          exclude: ['aggregates.js', 'datasources.json'],
          compact: true,
          controlFlowFlattening: false,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: false,
          deadCodeInjectionThreshold: 0.4,
          debugProtection: false,
          debugProtectionInterval: false,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: true,
          stringArray: true,
          stringArrayEncoding: 'base64',
          stringArrayThreshold: 0.75,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
        },
        files: {
          'build/': [
            'common/**/*.js',
            'modules/**/*.js',
            'templates/**/*.js',
            'services/**/*.js',
          ],
        },
      },
    },
    copy: {
      main: {
        expand: true,
        src: [
          'common/**/*',
          'server/**/*',
          'services/**/*',
          'templates/**/*',
          'package.json',
          'log/',
          'uploads/',
          './*.json',
          './*.js',
          './*.sh',
          'modules/**/*',
        ],
        dest: 'build/',
      },
    },
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-obfuscator');
  grunt.loadNpmTasks('grunt-contrib-copy');


  // Default task(s).
  grunt.registerTask('default', [ 'copy:main', 'obfuscator' ]);

};
