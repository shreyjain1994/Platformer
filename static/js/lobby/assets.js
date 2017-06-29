var staticLinks = require('../static');
var IMGLoader = require('imgloader');
var utils = require('../utils');

var manifest = [
    {id: 'background', src: staticLinks('images/background.png')},
    {id: 'player', src: staticLinks('images/player.png')},
    {id: 'tiles', src: staticLinks('images/tiles.png')}
];

var loader = new IMGLoader(manifest);

//start loading assets as soon as module loads
loader.load(utils.noop);

module.exports.load = loader.load.bind(loader);