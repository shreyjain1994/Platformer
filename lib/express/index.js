var express = require('express');
var settings = require('../../settings');
var log = require('../../config/logging');
var app = express();

//router is necessary so that the game can be mounted on a subdirectory
var router = express.Router();

require('../../config/views')(app);
require('../../config/static')(app);

router.get('/', function (req, res) {
    res.render('lobby', {layout:false})
});

router.get('/player', function (req, res) {
    res.render('player', {layout:false})
});

router.get('/down', function (req, res) {
    res.render('down', {layout:false})
});

//mount on subdirectory if necessary
app.use(settings.path, router);

function onAppListening() {
    log.info('Express server listening at %s.', settings.url);
}

//in production mode, server can only be accessed through nginx
if (process.env.NODE_ENV === 'production') {
    app.listen(settings.port, 'localhost', onAppListening);
}
else {
    app.listen(settings.port, onAppListening);
}
