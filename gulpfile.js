var
  gulp = require('gulp'),
  inline = require('gulp-inline'),
  uglify = require('gulp-uglify'),
  postCSS = require('gulp-postcss'),
  minifyHTML = require('gulp-minify-html'),
  cssnano = require('cssnano'),
  autoprefixer = require('autoprefixer');

gulp.task('inline', function () {
  return gulp
    .src('source/index.html')
    .pipe(inline({
      base: 'source/',
      js: uglify,
      css: postCSS.bind(this, [autoprefixer, cssnano])
    }))
    .pipe(minifyHTML())
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
