/**
 * Exposes a single function that creates full links to static resources.
 *
 * Usage:
 *
 * var staticLinks = require('./static');
 * var link = staticLinks('/images/foo.jpeg');
 */

var handlebarsStatic = require('handlebars-static');
var settings = require('./settings');
module.exports = handlebarsStatic(settings.static.url);