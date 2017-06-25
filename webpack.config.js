var settings = require('./settings');
var path = require('path');
var cwd = __dirname;
var webpack = require("webpack");
var util = require('util');
var urljoin = require('url-join');

module.exports = {
    entry:{
        'js/lobby/bundle.js':path.join(cwd, 'static/js/lobby/index.js'),
        'js/player/bundle.js':path.join(cwd, 'static/js/player/index.js')
    },
    output:{
        filename:'[name]',
        path:path.join(cwd, 'static')
    },
    plugins: [
        new webpack.DefinePlugin({
            STATIC_URL:JSON.stringify(settings.static.url),
            WEBSOCKET_URL:JSON.stringify(settings.websocket.url),
            DOWN_URL:JSON.stringify(urljoin(settings.url, 'down')),
            PLAYER_URL:JSON.stringify(urljoin(settings.url, 'player')),
            'process.env.NODE_ENV':JSON.stringify(process.env.NODE_ENV)
        })
    ]
};
