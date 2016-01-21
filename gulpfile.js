var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    source = require('vinyl-source-stream'),
    sourceFile = './_js/main.js',
    destFolder = './_js',
    destFile = 'newp_app.js';

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
  //gulp.watch('scss/**/*.scss', ['styles']);

  var bundler = watchify(sourceFile);
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .pipe(source(destFile))
      .pipe(gulp.dest(destFolder));
  }

  return rebundle();
});

gulp.task('min', function(){
	return gulp.src('_js/**/*.js')
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest(''));
});



gulp.task('default', [ 'browserify', 'watch' ]);
