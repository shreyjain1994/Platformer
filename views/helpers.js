var settings = require('../settings');
var utils = require('../lib/utils');

var args = [settings.static.url];
if (settings.static.useManifest){
    args.push(require(settings.static.manifest))
}

module.exports.static = utils.staticLinks.apply(null, args);