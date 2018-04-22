'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const minify = require('gulp-csso');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const uglify = require('gulp-uglify');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const server = require('browser-sync').create();
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

gulp.task('style', () => gulp.src('frontend/scss/style.scss')
  .pipe(plumber())
  .pipe(sourcemaps.init())
  .pipe(sass())
  .pipe(postcss([
    autoprefixer({ browsers: ['last 2 versions'] }),
  ]))
  .pipe(minify())
  .pipe(rename('style.min.css'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('build/css'))
  .pipe(server.stream()));

gulp.task('pug', () => gulp.src('frontend/pug/pages/*.pug')
  .pipe(plumber())
  .pipe(pug({ pretty: true }))
  .pipe(gulp.dest('build'))
  .pipe(server.stream()));

gulp.task('copy', () => gulp.src([
  'frontend/image/**',
  'frontend/fonts/**',
  'frontend/vendors/**',
], {
  base: 'frontend',
  since: gulp.lastRun('copy'),
})
  .pipe(gulp.dest('build')));

gulp.task('images', () => gulp.src('build/image/**/*.{png,jpg,gif,svg}')
  .pipe(imagemin([
    imagemin.optipng({ optimizationLevel: 3 }),
    imagemin.jpegtran({ progressive: true }),
    imagemin.svgo(),
  ]))
  .pipe(gulp.dest('build/image')));

gulp.task('webp', () => gulp.src('build/image/**/*.{jpg, png}')
  .pipe(webp({ quality: 90 }))
  .pipe(gulp.dest('build/image')));

gulp.task('js', () => gulp.src('frontend/js/main.js')
  .pipe(sourcemaps.init())
  .pipe(webpackStream({
    output: {
      filename: 'main.js'
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /(node_modules)/,
          loader: 'babel-loader',
          query: {
            presets: ['env']
          }
        }
      ]
    }
  }))
  .pipe(uglify())
  .pipe(rename('script.min.js'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('build/js'))
  .pipe(server.stream()));

gulp.task('clean', () => del('build'));

gulp.task('watch', () => {
  gulp.watch('frontend/scss/**/*.*', gulp.series('style'));

  gulp.watch('frontend/pug/**/*.pug', gulp.series('pug'));

  gulp.watch('frontend/js/**/*.js', gulp.series('js'));
});

gulp.task('serve', () => {
  server.init({
    server: 'build',
  });

  server.watch('build/**/*.*').on('change', server.reload);
});

gulp.task('build', gulp.series('clean', gulp.parallel('style', 'pug', 'copy', 'images', 'webp', 'js')));

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
