"use strict";

var merge = require('lodash.merge');
var Tile = require('./tile');
var utils = require('../utils');
var $ = require('jquery');

//tile name to location of tile in sprite-sheet, and other info. i.e. GRASS_LEFT is the first tile in the sprite-sheet
var tiles = {
    GRASS_RIGHT: {index: 0, isDeath: false, isSolid: true},
    GRASS_MIDDLE: {index: 6, isDeath: false, isSolid: true},
    GRASS_LEFT: {index: 7, isDeath: false, isSolid: true},
    CRATE: {index: 12, isDeath: false, isSolid: true},
    START: {index: 14, isDeath: false, isSolid: false},
    FINISH: {index: 13, isDeath: false, isSolid: false},
    LAVA: {index: 5, isDeath: true, isSolid: false},
    DIRT_LEFT: {index: 10, isDeath: false, isSolid: true},
    DIRT_MIDDLE: {index: 9, isDeath: false, isSolid: true},
    DIRT_RIGHT: {index: 8, isDeath: false, isSolid: true},
    GROUND_LEFT: {index: 1, isDeath: false, isSolid: true},
    GROUND_RIGHT: {index: 11, isDeath: false, isSolid: true}
};

/**
 * Create an enumeration of the different tiles.
 * @param {HTMLImageElement} options.spriteSheet - The spriteSheet holding the different tile images.
 * @param {int} [options.size=100] - Number of pixels in height and width a single tile should be.
 * @constructor
 */
function Tiles(options) {

    var defaultOptions = {
        size: 100
    };

    options = merge({}, defaultOptions, options);

    console.assert(options.size >= 1, 'Each tile must be at least 1 pixel in height and weight.');

    //tile size in the sprite image
    var actualTileSize = options.spriteSheet.height;

    //tile size necessary for the game drawings
    var gameTileSize = options.size;

    for (var tileName in tiles) {
        if (tiles.hasOwnProperty(tileName)) {

            var tile = tiles[tileName];

            /** @type {HTMLCanvasElement} */
            var canvas = $('<canvas/>')[0];
            utils.setCanvasSize(canvas, gameTileSize, gameTileSize);

            var ctx = canvas.getContext('2d');
            ctx.drawImage(options.spriteSheet, tile.index * actualTileSize, 0, actualTileSize, actualTileSize, 0, 0, gameTileSize, gameTileSize);
            this[tileName] = new Tile(
                {
                    canvas: canvas,
                    name: tileName,
                    isDeath: tile.isDeath,
                    isSolid: tile.isSolid
                }
            )
        }
    }

    /**
     * The width and height in pixels of the tiles.
     * @type {Number}
     */
    this.size = gameTileSize;
}

module.exports = Tiles;