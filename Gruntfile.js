'use strict';

module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-browserify');

  grunt.initConfig({
    'browserify': {
      options: {
        browserifyOptions: {
         debug: true
        }
      },
      dev: {
        ignore: ['*.html', 'src/server.js', 'src/saving_files.js'],
        src: ['src/*.js'],
        dest: 'build/bundle.js'
      }
    }
  });

  grunt.registerTask('default', ['browserify']);
};

