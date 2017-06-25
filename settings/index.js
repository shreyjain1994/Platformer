var Settings = require('settings');

/**
 * @private
 * @type {AppSettings}
 */
var defaults = require('./default');

/**
 * @private
 */
var environments = {
    development: require('./development'),
    production: require('./production')
};
/**
 * @private
 * @type {Settings}
 */
var settings = new Settings(defaults, environments);

/**
 * @type {AppSettings}
 */
module.exports = settings.get({node_env: settings.options.env});

module.exports.get = settings.get.bind(settings);

