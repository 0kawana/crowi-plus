'use strict';

var gulp   = require('gulp');
var sass   = require('gulp-sass');
var cssmin = require('gulp-cssmin');
var mocha  = require('gulp-mocha');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');

var stylish = require('jshint-stylish');

var pkg = require('./package.json');


var dirs = {
  cssSrc: './resource/css',
  cssDist: './public/css',
  jsSrc: './resource/js',
  jsDist: './public/js',
};

var tests = {
  watch: ['test/**/*.test.js'],
}

var css = {
  src: dirs.cssSrc + '/' + pkg.name + '.scss',
  main: dirs.cssDist + '/crowi-main.css',
  dist: dirs.cssDist + '/crowi.css',
  watch: ['resource/css/*.scss'],
};

var js = {
  src: [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.js',
    'node_modules/socket.io-client/socket.io.js',
    'bower_components/marked/lib/marked.js',
    'bower_components/jquery.cookie/jquery.cookie.js',
    'bower_components/highlightjs/highlight.pack.js',
    'resource/js/crowi.js'
  ],
  dist: dirs.jsDist + '/crowi.js',
  revealSrc: [
    'bower_components/reveal.js/lib/js/head.min.js',
    'bower_components/reveal.js/lib/js/html5shiv.js',
    'bower_components/reveal.js/js/reveal.js'
  ],
  revealDist: dirs.jsDist + '/crowi-reveal.js',
  clientWatch: ['resource/js/**/*.js'],
  watch: ['test/**/*.test.js','Gruntfile.js', 'app.js', 'lib/**/*.js'],
  lint: ['Gruntfile.js', 'app.js', 'lib/**/*.js'],
  tests: tests.watch,
};

var cssIncludePaths = [
  'bower_components/bootstrap-sass-official/assets/stylesheets',
  'bower_components/fontawesome/scss',
  'bower_components/reveal.js/css'
];

gulp.task('js:concat', function() {
  gulp.src(js.revealSrc)
    .pipe(concat('crowi-reveal.js'))
    .pipe(gulp.dest(dirs.jsDist));

  return gulp.src(js.src)
    .pipe(concat('crowi.js'))
    .pipe(gulp.dest(dirs.jsDist));
});

gulp.task('js:min', ['js:concat'], function() {
  gulp.src(js.revealDist)
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(dirs.jsDist));

  return gulp.src(js.dist)
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(dirs.jsDist));
});

gulp.task('jshint', function() {
  return gulp.src(js.lint)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('test', function() {
  return gulp.src(js.tests)
    .pipe(mocha({
      require: [__dirname + '/test/bootstrap.js'], // 絶対pathじゃないとだめとかなにこのplugin
      globals: ['chai'],
      reporter: 'dot',
    }));
});

gulp.task('css:sass', function() {
  return gulp.src(css.src)
    .pipe(sass({
        outputStyle: 'nesed',
        sourceComments: 'map',
        includePaths: cssIncludePaths
    }).on('error', sass.logError))
    .pipe(rename({suffix: '-main'}))
    .pipe(gulp.dest(dirs.cssDist));
});

gulp.task('css:concat', ['css:sass'], function() {
  return gulp.src([css.main, 'bower_components/highlightjs/styles/tomorrow-night.css'])
    .pipe(concat('crowi.css'))
    .pipe(gulp.dest(dirs.cssDist))
});

gulp.task('css:min', ['css:concat'], function() {
  return gulp.src(css.dist)
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(dirs.cssDist));
});

gulp.task('watch', function() {
  var watchLogger = function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  };

  var cssWatcher = gulp.watch(css.watch, ['css:concat']);
  cssWatcher.on('change', watchLogger);
  var jsWatcher = gulp.watch(js.clientWatch, ['js:concat']);
  jsWatcher.on('change', watchLogger);
  var testWatcher = gulp.watch(js.watch, ['test']);
  testWatcher.on('change', watchLogger);
});

gulp.task('css', ['css:sass', 'css:concat',]);
gulp.task('default', ['css:min', 'js:min',]);
gulp.task('dev', ['css:concat', 'js:concat','jshint', 'test']);

