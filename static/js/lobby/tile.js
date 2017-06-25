"use strict";

/**
 * A tile represents a square 2D piece that comes together with other tiles to represent a world.
 * @param {HTMLCanvasElement} options.canvas - A canvas element with the tile image drawn on it.
 * @param {string} options.name - A human-readable identifier for the tile. i.e. cloud, ground, etc.
 * @param {boolean} options.isDeath - Whether touching the tile will cause death.
 * @param {boolean} options.isSolid - Whether the tile is solid, and a player can stand on it.
 * @constructor
 */
function Tile(options) {

    /**
     * A canvas element with the tile image drawn on it.
     * @type {HTMLCanvasElement}
     */
    this.canvas = options.canvas;

    /**
     * A human-readable identifier for the tile. i.e. cloud, ground, etc.
     * @type {string}
     */
    this.name = options.name;

    /**
     * Whether touching the tile will cause death.
     * @type {boolean}
     */
    this.isDeath = options.isDeath;

    /**
     * Whether the tile is solid, and a player can stand on it.
     * @type {boolean}
     */
    this.isSolid = options.isSolid;
}

module.exports = Tile;