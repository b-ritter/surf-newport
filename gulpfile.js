var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    source = require('vinyl-source-stream'),
    sourceFile = './_js/main.js',
    destFolder = './_js/build',
    destFile = 'newportmesa.js';
    var browserSync = require('browser-sync').create();

gulp.task('browser-sync', function() {
    browserSync.init({
        port: 8888,
        open: false,
        server: {
          baseDir: ''
        },
        middleware: function (req, res, next) {
            console.log('Adding CORS header for ' + req.method + ': ' + req.url);
            res.setHeader('Access-Control-Allow-Origin', '*');
            next();
        }
    });
});

gulp.task('browserify', function() {
  return browserify(sourceFile)
  .bundle()
  .pipe(source(destFile))
  .pipe(gulp.dest(destFolder));
});

gulp.task('styles', function() {
    gulp.src('scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
				.pipe(autoprefixer())
        .pipe(gulp.dest('css/'));
});

gulp.task('watch', function(){
  gulp.watch('scss/**/*.scss', ['styles']);
});

gulp.task('min', function(){
	return gulp.src('_js/**/*.js')
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest(''));
});



gulp.task('default', [ 'watch' ]);
