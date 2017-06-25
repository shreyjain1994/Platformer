var settings = require('../settings');
var utils = require('../lib/utils');

module.exports.static = utils.staticLinks(settings.static.url);