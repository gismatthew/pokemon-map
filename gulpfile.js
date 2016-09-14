const fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
// var rename = require('gulp-rename');
var browserify = require('gulp-browserify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-minify-html');
var jsonminify = require('gulp-jsonminify');
var connect = require('gulp-connect');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var jshint = require('gulp-jshint');
var lazypipe = require('lazypipe');

var env = process.env.NODE_ENV || 'development';
var outputDir;
var sassStyle;

if(env === 'development') {
  outputDir = 'builds/development/';
  sassStyle = 'expanded';
} else {
  outputDir = 'builds/production/';
  sassStyle = 'compressed';
}

var mvt_bg = 'http://gis1test.usask.ca:8888/data/osm2vectortiles.json';

var htmlSources = ['builds/development/*.html'];
var jsonSources = [outputDir + 'js/*.json'];
var jsSources = [

  'builds/components/js/default.js',
  'builds/components/js/dataBroker.js',
  'builds/components/js/layerBroker.js',
  'builds/components/js/initMap.js',
  'builds/components/js/initUi.js'

  /* put individual js here instead of using wildcard
    to process them in the pre-defined order */
];
var sassSources = [
  'builds/components/sass/main.scss',
  'builds/components/sass/*.css',
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/bootstrap/dist/css/bootstrap-theme.min.css',
  'node_modules/bootstrap-select/dist/css/bootstrap-select.min.css',
  'node_modules/mapbox-gl/dist/mapbox-gl.css',
  'node_modules/mapbox-gl-draw/dist/mapbox-gl-draw.css',
  'node_modules/bootstrap-toggle/css/bootstrap2-toggle.min.css'
];

var imgSources = [
  'builds/development/img/*.jpg',
  'builds/development/img/*.jpeg',
  'builds/development/img/*.png'
  // 'node_modules/bootstrap-colorpicker/dist/img/**/*'
];


gulp.task('html', function() {
  gulp.src(htmlSources)
  .pipe(gulpif(env === 'production', minifyHTML()))
  .pipe(gulpif(env === 'production', gulp.dest(outputDir)))
  // .pipe(connect.reload())
  .pipe(livereload());
});

gulp.task('js', function() {
  gulp.src(jsSources)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
  // .pipe(jshint.reporter('fail'))
    .pipe(concat('script.js'))
    .pipe(browserify().on('error', function(e){
      // print the error (can replace with gulp-util)
      console.log(e.message);
      // end this stream
      this.emit('end');
    }))
    .pipe(gulpif(env === 'production', uglify()))
    .pipe(gulp.dest(outputDir + 'js/'))
    .pipe(livereload());
});

gulp.task('img', function() {
  gulp.src(imgSources)
      .pipe(gulpif(env === 'production', gulp.dest('builds/production/img/')))
});

var font_fix = lazypipe()
  .pipe(replace)
  .pipe(replace, '../font', '../fonts')

gulp.task('sass', function() {
  gulp.src(sassSources)
    .pipe(gulpif('*fontello.css', font_fix()))
      // .pipe(gulpif('builds/components/sass/main.scss', compass({
      //   sass: 'builds/components/sass',
      //   image: outputDir + 'img',
      //   style: sassStyle
      // })))
    .pipe(sass({
      outputStyle: sassStyle,
      precison: 3,
      errLogToConsole: true
      // ,includePaths: [bootstrapSass + 'assets/stylesheets']
    }))
    .pipe(concat('main.css'))
    .pipe(gulp.dest(outputDir + 'css'))
    .pipe(livereload());
});

// fix mvt location and paths
var mvt_fix = lazypipe()
  .pipe(replace)
  .pipe(replace, 'mbtiles://{osm2vectortiles}', mvt_bg)
  .pipe(replace, 'sprites/', 'gl-styles/sprites/')
  .pipe(replace, 'glyphs/', 'gl-styles/glyphs/');

gulp.task('gl-styles', function() {
  fs.stat(outputDir + 'gl-styles/styles', function(err, stat) {
    if(err == null){
        console.log('Style folder exists. Skipping...');
    }else{
      if(err.code === 'ENOENT'){
        gulp.src([
          'node_modules/tileserver-gl-styles/**'
        ])
        .pipe(gulpif('*.json', mvt_fix()))
        .pipe(gulp.dest(outputDir + 'gl-styles'));
      }
    }
  });
});

gulp.task('fonts', function() {
  gulp.src([
    'builds/components/fonts/*',
    'node_modules/bootstrap/fonts/*'
  ])
  .pipe(gulp.dest(outputDir + 'fonts'));
});

gulp.task('connect', function() {
  console.log('outputDir');
  connect.server({
    root: outputDir,
    port: 8084
  })
});

gulp.task('default', [ 'html', 'js', 'img', 'sass', 'fonts', 'gl-styles', 'connect', 'watch' ]);
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('builds/development/*.html', [ 'html' ]);
  gulp.watch(jsSources, [ 'js' ]);
  gulp.watch('builds/components/sass/*.scss', [ 'sass' ]);
});
