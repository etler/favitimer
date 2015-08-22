var
  gulp = require('gulp'),
  inline = require('gulp-inline'),
  uglify = require('gulp-uglify'),
  minifyCss = require('gulp-minify-css');

gulp.task('inline', function () {
  return gulp
    .src('source/index.html')
    .pipe(inline({
      base: 'source/',
      js: uglify(),
      css: minifyCss()
    }))
    .pipe(gulp.dest('public/'));
});

gulp.task('copy', function () {
  return gulp
    .src('source/static/*')
    .pipe(gulp.dest('public/'));
});

gulp.task('default', ['copy', 'inline']);

gulp.task('watch', ['default'], function () {
  gulp.watch('source/static/*', function(event) {
      gulp.run('copy');
  });

  gulp.watch('source/*', function(event) {
      gulp.run('inline');
  });
});
