var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    app_js_path = 'js/src/',
    app_js = [
      'data.js',
      'ko-custom-binding.js',
      'ko-viewmodel.js',
      'locationobjects.js',
      'google-map.js'
    ];

app_js.forEach(function(currentValue, index, app_js){
  app_js[index] = app_js_path + currentValue;
});

gulp.task('concat-js', function(){
  console.log(app_js);
  return gulp.src(app_js)
    .pipe(concat('*.js'))
    .pipe(rename('newportmesa.js'))
    .pipe(gulp.dest('js/'));
});

gulp.task('styles', function() {
    gulp.src('scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
				.pipe(autoprefixer())
        .pipe(gulp.dest('css/'));
});

gulp.task('watch', function(){
  gulp.watch('scss/**/*.scss', ['styles']);
  gulp.watch(app_js, ['concat-js']);
});

gulp.task('default', [ 'watch' ]);
