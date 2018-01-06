'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const minify = require('gulp-csso');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const del = require('del');
const rollup = require('gulp-better-rollup');
const sourcemaps = require('gulp-sourcemaps');
const server = require('browser-sync').create();

gulp.task('style', function() {
  return gulp.src('frontend/scss/style.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([
      mqpacker({sort: true}),
      autoprefixer({browsers: ['last 2 versions']})
    ]))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task('pug', function() {
  return gulp.src('frontend/pug/pages/*.pug')
    .pipe(plumber())
    .pipe(pug({pretty: true}))
    .pipe(gulp.dest('build'))
    .pipe(server.stream());
});

gulp.task('copy', function() {
  return gulp.src([
    'frontend/image/**'
  ], {
    base: 'frontend',
    since: gulp.lastRun('copy')
  })
    .pipe(gulp.dest('build'));
});

gulp.task('images', function() {
  return gulp.src('build/image/**/*.{png,jpg,gif}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest('build/image'));
});

gulp.task('uglify', function() {
  return gulp.src('frontend/js/main.js')
    .pipe(sourcemaps.init())
    .pipe(rollup({}, 'iife'))
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify())
    .pipe(rename('script.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'));
});

gulp.task('clean', function() {
  return del('build');
});

gulp.task('watch', function() {
  gulp.watch('frontend/scss/**/*.*', gulp.series('style'));

  gulp.watch('frontend/pug/**/*.pug', gulp.series('pug'));
});

gulp.task('serve', function() {
  server.init({
    server: 'build'
  });

  server.watch('build/**/*.*').on('change', server.reload);
});

gulp.task('build', gulp.series('clean', gulp.parallel('style', 'pug', 'copy', 'images', 'uglify')));

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
