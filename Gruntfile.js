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
          'assets/js/knockout-3.0.0rc.js',
          'assets/js/aun-subscreen.js'
        ],
        dest: 'public/js/application.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', [
    'less:production',
    'concat'
  ]);
};
