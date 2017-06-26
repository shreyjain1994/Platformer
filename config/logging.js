/**
 * This file exposes a bunyan logger object.
 */

var bunyan = require('bunyan');
var settings = require('../settings');
var SyslogStream = require('bunyan-syslog-unixdgram');

var options = {
    name: settings.logging.name,
    streams: []
};

//console stream
if (settings.logging.console.use){
    options.streams.push({
        level:settings.logging.console.level,
        stream: process.stdout
    });
}

//syslog stream
if (settings.logging.syslog.use){
    options.streams.push({
        level:settings.logging.syslog.level,
        type:'raw',
        stream: new SyslogStream({
            name: settings.logging.name
        })
    });
}

/**
 * @type {Logger}
 */
var log = bunyan.createLogger(options);
module.exports = log;