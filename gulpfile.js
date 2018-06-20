var gulp = require('gulp');
var imageMin = require('gulp-imagemin');
var resize = require('gulp-image-resize');
var rename = require('gulp-rename');
var del = require('del');

gulp.task('clean', function() {
    return del('./images');
});

// The main workhorse! We pass it clean so that it won't start running until clean has finished
// gulp.task('reduce-images', ['clean'], function() {
//     gulp.src('./img/*.{jpg, png}') // Pass in your original image source path, and extensions to watch
//         .pipe(resize({ // This plugin resizes the initial images
//             width: 1200, // Currently using pixels; can also use percentages like so: '50%'
//             quality: 0.5 // Adjusts image quality, on a scale of 0 (low) - 1 (high)
//         }))
//         .pipe(imageMin()) // This plugin compresses the resized images
//         .pipe(rename(function (path) { path.basename += "-optimized"; })) // This plugin adds a tag onto the end of the filepath name, so you know it's not the original file
//         .pipe(gulp.dest('./images')) // Then you pass the finished file into a new, ready for build directory
// });


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

// This will call all of our image size tasks, so everything gets the sizes it needs - still having it run clean first to remove the old folder and avoid duplication, then it calls all 3 image resize tasks and runs them simultaneously 
gulp.task('default', ['clean', 'sm-images', 'lg-images']);

// This is how you'll run everything! Just type gulp into the terminal and it'll run all the functions (include 'copy-fixed' if you're on phase 1)
// gulp.task('default', ['clean', 'reduce-images']);