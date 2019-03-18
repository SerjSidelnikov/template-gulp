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
const commonjs = require(`rollup-plugin-commonjs`);
const babel = require(`rollup-plugin-babel`);
const resolve = require(`rollup-plugin-node-resolve`);
const uglify = require(`gulp-uglify`);

gulp.task(`style`, () => gulp.src(`frontend/scss/style.scss`, {sourcemaps: true})
  .pipe(plumber())
  .pipe(sass())
  .pipe(postcss([
    autoprefixer({
      browsers: [
        `> 1%`,
      ]
    }),
    mqpacker({sort: true})
  ]))
  .pipe(minify())
  .pipe(rename(`style.css`))
  .pipe(gulp.dest(`build/css`, {sourcemaps: true}))
);

gulp.task(`pug`, () => gulp.src(`frontend/pug/pages/*.pug`)
  .pipe(plumber())
  .pipe(pug({pretty: true}))
  .pipe(gulp.dest(`build`))
);

gulp.task(`scripts`, () => gulp.src(`frontend/js/main.js`, {sourcemaps: true})
  .pipe(plumber())
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
  .pipe(gulp.dest(`build/js`, {sourcemaps: true}))
);

gulp.task(`imagemin`, () => gulp.src(`build/images/**/*.{jpg,jpeg,png,gif,svg}`)
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true}),
    imagemin.svgo(),
  ]))
  .pipe(gulp.dest(`build/images`))
);

gulp.task(`copy`, () => gulp.src([
  `frontend/fonts/**/*.{woff,woff2}`,
  `frontend/images/**/*.*`], {base: `frontend`, since: gulp.lastRun(`copy`)})
  .pipe(gulp.dest(`build`))
);

gulp.task(`clean`, () => del(`build`));

gulp.task(`watch`, () => {
  gulp.watch(`frontend/pug/**/*.*`, gulp.series(`pug`));
  gulp.watch(`frontend/scss/**/*.*`, gulp.series(`style`));
  gulp.watch(`frontend/js/**/*.*`, gulp.series(`scripts`));
  gulp.watch(`frontend/images/**/*.*`, gulp.series(`copy`));
});

gulp.task(`serve`, () => {
  server.init({
    server: `build`,
  });

  server.watch(`build/**/*.*`).on(`change`, server.reload);
});

gulp.task(`build`, gulp.series(`clean`, gulp.parallel(`copy`, `pug`, `style`, `scripts`)));
gulp.task(`prod`, gulp.series(`clean`, gulp.parallel(`copy`, `pug`, `style`, `scripts`), `imagemin`));
gulp.task(`dev`, gulp.series(`build`, gulp.parallel(`watch`, `serve`)));
