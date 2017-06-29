var handlebarsStatic = require('handlebars-static');
var settings = require('../settings');

//use manifest when required
var staticOptions = {};
if (settings.static.useManifest){
    staticOptions.manifest = require(settings.static.manifest);
}
//used to get correct links to static resources
module.exports.static = handlebarsStatic(settings.static.url, staticOptions);