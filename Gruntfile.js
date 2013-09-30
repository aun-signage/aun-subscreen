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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.registerTask('default', ['less:production']);
};
