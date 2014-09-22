var gulp = require('gulp');
var concat = require('gulp-concat');
var react = require('gulp-react');

var paths = {
  scripts: [
    "js/sock.js",
    "js/app.jsx"
  ],
  vendorScripts: [
    "bower_components/react/react.js",
    "bower_components/sockjs/sockjs.min.js"
  ]
};

gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(react())
    .pipe(concat('all.js'))
    .pipe(gulp.dest('../public/js'));
});

gulp.task('vendor-scripts', function() {
  return gulp.src(paths.vendorScripts)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('../public/js'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.vendorScripts, ['vendor-scripts']);
});

gulp.task('build', ['scripts', 'vendor-scripts']);

gulp.task('default', ['watch']);
