/**
 * This file exposes a single function which sets up handlebars views for the express application.
 */

var path = require('path');
var exphbs = require('express-handlebars');

var helpers = require('../views/helpers');
var views = path.join(__dirname, '../views');
var layouts = path.join(views, 'layouts');

function setup(app) {

    app.set('views', views);

    var hbs = exphbs.create({
        layoutsDir: layouts,
        defaultLayout: 'main',
        extname: '.hbs',
        helpers: helpers
    });

    app.engine('.hbs', hbs.engine);
    app.set('view engine', '.hbs');
}

module.exports = setup;