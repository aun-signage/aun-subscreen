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
  ],
  vendorStylesheets: [
    "bower_components/twitter/dist/css/bootstrap.min.css"
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

gulp.task('vendor-stylesheets', function() {
  return gulp.src(paths.vendorStylesheets)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('../public/css'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.vendorScripts, ['vendor-scripts']);
  gulp.watch(paths.vendorStylesheets, ['vendor-stylesheets']);
});

gulp.task('build', ['scripts', 'vendor-scripts', 'vendor-stylesheets']);

gulp.task('default', ['watch']);
