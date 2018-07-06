var gulp = require('gulp');
var imageMin = require('gulp-imagemin');
var resize = require('gulp-image-resize');
var rename = require('gulp-rename');
var del = require('del');

gulp.task('clean', function() {
    return del('./images');
});

gulp.task('sm-images', function() {
    gulp.src('./img/*.{jpg, png}') 
        .pipe(resize({
            width: 400,
            quality: 0.5,
            // crop: true,
            // gravity: 'center'
        }))
        .pipe(imageMin())
        .pipe(rename(function (path) { path.basename += "-400w"; }))
        .pipe(gulp.dest('./images'))
});

gulp.task('lg-images', function() {
    gulp.src('./img/*.{jpg, png}') 
        .pipe(resize({
            width: 800,
            quality: 0.5
        }))
        .pipe(imageMin())
        .pipe(rename(function (path) { path.basename += "-800w"; }))
        .pipe(gulp.dest('./images'))
});


gulp.task('default', ['clean', 'sm-images', 'lg-images']);