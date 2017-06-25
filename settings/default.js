var path = require('path');

/**
 * Static file settings for the application.
 * @typedef {object} AppStaticSettings
 * @property {string} host - The host at which the static resources are available.
 * @property {string} path - The URL path at which static resources should be mounted.
 * @property {string} url - The URL at which the root directory of the static resources is located.
 * @property {boolean} use - Whether to use express to serve the static resources.
 * @property {string} root - Path to the directory containing the static resources.
 */

/**
 * Logging settings for the application.
 * @typedef {object} AppLoggingSettings
 * @property {string} name - The name of the logger. It is used in the logging messages, and as the name of the process for rsyslog.
 * @property {object} console - Settings for passing logs to the console.
 * @property {boolean} console.use - Toggle to turn on/off displaying of logs on the console.
 * @property {string} console.level - The minimum bunyan level for which to log messages to the console. Anything lower will not be logged.
 * @property {object} syslog - Settings for passing logs to the syslog.
 * @property {boolean} syslog.use - Toggle to turn on/off passing logs to the syslog server.
 * @property {string} syslog.level - The minimum bunyan level for which to log messages to the syslog. Anything lower will not be logged.
 */

/**
 * Websocket settings for the application.
 * @typedef {object} WebsocketSettings
 * @property {string} path - The URL path at which the websocket application will listen at. This is really only included for nginx purposes. The actual websocket server doesn't utilize this at all.
 * @property {number} port - The port the websocket server will listen at.
 * @property {string} url - The URL link which can be used to connect to the websocket server.
 */

/**
 * All settings for the application.
 * @typedef {Object} AppSettings
 * @property {string} host - The host at which the express and websocket applications are available.
 * @property {string} path - The URL path at which the express application should be mounted.
 * @property {number} port - The port the express server will listen at.
 * @property {string} url - The overall URL at which the express application is listening at.
 * @property {WebsocketSettings} websocket
 * @property {AppStaticSettings} static
 * @property {AppLoggingSettings} logging
 */

/**
 * @type {AppSettings}
 */
module.exports = {
    host:'localhost',
    path:'/',
    port:10100,
    url:'http://localhost:10100/',
    websocket:{
        path:'/websocket',
        port:10101,
        url:'ws://localhost:10101/websocket'
    },
    static: {
        host:'localhost',
        path:'/static',
        url:'http://localhost:10100/static',
        use: true,
        root: path.join(__dirname, '../static')
    },
    logging: {
        name: 'platformer_game',
        console: {
            use: true,
            level:'debug'
        },
        syslog: {
            use: false,
            level:'info'
        }
    }
};
