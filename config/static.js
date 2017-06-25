/**
 * This file exposes a single function which sets up handling of static files for an express application.
 */

var settings = require('../settings');
var express = require('express');

function setup(app) {
    if (settings.static.use) {
        app.use(settings.static.path, express.static(settings.static.root))
    }
}

module.exports = setup;