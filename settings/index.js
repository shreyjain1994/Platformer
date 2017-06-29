var Settings = require('settings');

/**
 * @type {AppSettings}
 */
module.exports = new Settings({
    common:require('./default'),
    development:require('./development'),
    production:require('./production')
});

