module.exports = function(grunt) {
  grunt.initConfig({
    less: {
      production: {
        options: {
          paths: ['assets/css'],
          compress: true
        },
        files: {
          'public/css/application.css': 'assets/css/application.less'
        }
      }
    },
    concat: {
      dist: {
        src: [
          'bower_components/jquery/jquery.min.js',
          'bower_components/bootstrap/dist/js/bootstrap.min.js',
          'bower_components/lodash/dist/lodash.min.js',
          'assets/js/knockout-3.0.0.js',
          'assets/js/knockout.mapping-latest.js',
          'assets/js/aun-subscreen.js'
        ],
        dest: 'public/js/application.js'
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: "bower_components/fontawesome/fonts/",
          src: '*',
          dest: 'public/fonts/'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', [
    'less:production',
    'concat',
    'copy'
  ]);
};
