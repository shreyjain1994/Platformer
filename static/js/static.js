/**
 * Exposes a single function that creates full links to static resources.
 *
 * Usage:
 *
 * var staticLinks = require('./static');
 * var link = staticLinks('/images/foo.jpeg');
 */

var utils = require('../../lib/utils');
var settings = require('./settings');

module.exports = utils.staticLinks(settings.static.url);