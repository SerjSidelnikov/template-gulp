const del = require(`del`);
const gulp = require(`gulp`);
const pug = require(`gulp-pug`);
const sass = require(`gulp-sass`);
const plumber = require(`gulp-plumber`);
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const server = require(`browser-sync`).create();
const mqpacker = require(`css-mqpacker`);
const minify = require(`gulp-csso`);
const rename = require(`gulp-rename`);
const imagemin = require(`gulp-imagemin`);
const rollup = require(`gulp-better-rollup`);
const sourcemaps = require(`gulp-sourcemaps`);
const mocha = require(`gulp-mocha`);
const commonjs = require(`rollup-plugin-commonjs`);
const babel = require(`rollup-plugin-babel`);
const resolve = require(`rollup-plugin-node-resolve`);
const uglify = require(`gulp-uglify`);

gulp.task(`style`, () => {
  return gulp.src(`frontend/scss/style.scss`).
  pipe(plumber()).
  pipe(sourcemaps.init()).
  pipe(sass()).
  pipe(postcss([
    autoprefixer({
      browsers: [
        `last 1 version`,
        `last 2 Chrome versions`,
        `last 2 Firefox versions`,
        `last 2 Opera versions`,
        `last 2 Edge versions`
      ]
    }),
    mqpacker({sort: true})
  ])).
  pipe(gulp.dest(`build/css`)).
  pipe(server.stream()).
  pipe(minify()).
  pipe(rename(`style.min.css`)).
  pipe(sourcemaps.write(``)).
  pipe(gulp.dest(`build/css`));
});

gulp.task(`pug`, () => gulp.src(`frontend/pug/pages/*.pug`)
  .pipe(plumber())
  .pipe(pug({pretty: true}))
  .pipe(gulp.dest(`build`))
  .pipe(server.stream()));

gulp.task(`scripts`, () => {
  return gulp.src(`frontend/js/main.js`)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(rollup({
      plugins: [
        resolve({browser: true}),
        commonjs(),
        babel({
          babelrc: false,
          exclude: `node_modules/**`,
          presets: [`@babel/env`]
        })
      ]
    }, `iife`))
    .pipe(uglify())
    .pipe(sourcemaps.write(``))
    .pipe(gulp.dest(`build/js`));
});

gulp.task(`imagemin`, [`copy`], () => {
  return gulp.src(`build/images/**/*.{jpg,jpeg,png,gif,svg}`).
  pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true}),
    imagemin.svgo(),
  ])).
  pipe(gulp.dest(`build/images`));
});

gulp.task(`copy`, [`pug`, `scripts`, `style`], () => {
  return gulp.src([
    `frontend/fonts/**/*.{woff,woff2}`,
    `frontend/images/**/*.*`
  ], {base: `frontend`}).
  pipe(gulp.dest(`build`));
});

gulp.task(`clean`, () => {
  return del(`build`);
});

gulp.task(`js-watch`, [`scripts`], (done) => {
  server.reload();
  done();
});

gulp.task(`serve`, [`assemble`], () => {
  server.init({
    server: `./build`,
    notify: false,
    open: true,
    port: 3502,
    ui: false
  });

  gulp.watch(`frontend/scss/**/*.{scss,sass}`, [`style`]);
  gulp.watch(`frontend/pug/**/*.pug`, [`pug`]);
  gulp.watch(`frontend/js/**/*.js`, [`js-watch`]);
  gulp.watch(`frontend/images/**/*.*`, [`copy`]);
});

gulp.task(`assemble`, [`clean`], () => {
  gulp.start(`copy`, `style`);
});

gulp.task(`build`, [`assemble`], () => {
  gulp.start(`imagemin`);
});

gulp.task(`test`, () => {
  return gulp.src([`frontend/js/**/*.test.js`])
    .pipe(rollup({
      plugins: [
        commonjs()
      ]}, `cjs`))
    .pipe(gulp.dest(`build/test`))
    .pipe(mocha({
      reporter: `spec`
    }));
});
