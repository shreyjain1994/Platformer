var path = require('path');
var userid = require('userid');
var settings = require('./settings');
var fs = require('fs');
var pump = require('pump');
var del = require('del');
var webpackConfig = require('./webpack.config');
var webpack = require('webpack');

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
var hash = require('gulp-hash');
var imagemin = require('gulp-imagemin');
var gulpWebpack = require('gulp-webpack');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('clean-build', function(){
    return del(['build']);
});

gulp.task('build', ['build-static', 'build-production']);

gulp.task('build-production', ['nginx', 'upstart']);

gulp.task('nginx', ['clean-build'], function (done) {

    var data = {
        port:settings.port,
        host:settings.host,
        path:settings.path,
        websocketPort:settings.websocket.port,
        websocketPath:settings.websocket.path
    };

    pump([
        gulp.src('production/nginx.hbs'),
        handlebars(data),
        rename('platformer'),
        gulp.dest('build/production')
    ], done);
});

gulp.task('upstart', ['clean-build'], function (done) {

    var upstartData = {
        rootDir: __dirname,
        user: userid.username(process.getuid()),
        group: userid.groupname(process.getgid())
    };

    pump([
        gulp.src('production/upstart.hbs'),
        handlebars(upstartData),
        rename('platformer.conf'),
        gulp.dest('build/production')
    ], done);
});

gulp.task('build-static', ['hash']);

gulp.task('css', ['clean-build','bundle-css'],function (done) {

    pump([
        gulp.src('static/css/*.css'),
        cleanCSS(),
        gulp.dest('build/static/css')
    ], done);
});

gulp.task('bundle-css', function(done){

    pump([
        gulp.src(['static/css/*.css', '!static/css/bundle.css']),
        concat('bundle.css'),
        gulp.dest('static/css')
    ], done);
});

gulp.task('hash', ['css', 'images', 'js'], function (done) {

    pump([
        gulp.src('build/static/**/*'),
        hash(),
        gulp.dest('build/static'),
        hash.manifest('manifest.json'),
        gulp.dest('build/static')
    ], done);
});

gulp.task('images', ['clean-build'],function (done) {

    pump([
        gulp.src('static/images/*'),
        imagemin(),
        gulp.dest('build/static/images')
    ], done);
});

gulp.task('js', ['clean-build','webpack'], function (done) {
    pump([
        gulp.src('static/js/**/*.js'),
        uglify(),
        gulp.dest('build/static/js')
    ], done)
});

gulp.task('webpack', function(done){
   pump([
       gulp.src([]),
       gulpWebpack(webpackConfig, webpack),
       gulp.dest('static')
   ], done)
});

/**
 * Development start task. Restarts upon changes to files.
 */
gulp.task('start', ['webpack', 'bundle-css'], function () {

    var options = {
        env: {'NODE_ENV': process.env.NODE_ENV},
        ext: 'js json css', //the file extensions for which nodemon restarts upon changes
        tasks: ['webpack', 'bundle-css'],
        ignore: ['static/**/bundle.*'] //need to ignore changes to this as it is rebuilt every time nodemon restarts
    };
    nodemon(options);
});