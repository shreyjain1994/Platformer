"use strict";

var utils = require('../../../lib/utils');
var merge = require('lodash.merge');

/**
 * Create a world for a player.
 * @param {number} [options.height=8] - The number of tiles in the y-direction of the world.
 * @param {number} [options.maxGroundHeight=4] - The max number of tiles the ground can be comprised of in the y-direction. I.e. A value of 4 would mean the ground can be a max of 4 tiles high.
 * @param {number} [options.minGroundHeight=2] - The min number of tiles the ground has to be comprised of in the y-direction. I.e. A value of 2 would mean the ground will be atleast 2 tiles high.
 * @param {number} [options.tilesBeforeStart=10] - The number of tiles to have before the start flag.
 * @param {number} [options.tilesAfterFinish=50] - The number of tiles to have after the finish flag.
 * @param {number} [options.trackLength=200} - The number of tiles from the start to finish flag.
 * @param {Tiles} options.tiles - The tiles to be used in the creation of the world.
 * @constructor
 */
function World(options) {

    var defaultOptions = {
        height: 8,
        maxGroundHeight: 4,
        minGroundHeight: 2,
        trackLength: 200,
        tilesBeforeStart: 10,
        tilesAfterFinish: 50
    };

    options = merge({}, defaultOptions, options);

    //check to ensure provided parameters are valid
    console.assert(options.trackLength >= 2, 'The track cannot be less than 2 tiles wide.');
    console.assert(options.maxGroundHeight <= options.height && options.minGroundHeight <= options.height, 'The height of the ground cannot be greater than the height of the world.');
    console.assert(options.maxGroundHeight >= options.minGroundHeight, 'The maximum height of the ground cannot be less than the minimum height of the ground.');
    console.assert(options.height >= 1 && options.maxGroundHeight >= 1 && options.minGroundHeight >= 1, 'The world/ground cannot have a height less than 1 tile high.');
    console.assert(options.tilesBeforeStart >= 0, "There cannot be a negative number of tiles before the start flag.");
    console.assert(options.tilesAfterFinish >= 0, "There cannot be a negative number of tiles after the finish flag.");

    /**
     *
     * @type {{height?: number, maxGroundHeight?: number, minGroundHeight?: number, tilesBeforeStart?: number, tilesAfterFinish?: number, trackLength?: number, tiles: Tiles}}
     * @private
     */
    this._options = options;

    /**
     * The number of tiles from the start to finish flag.
     * @type {number}
     */
    this.trackLength = options.trackLength;

    /**
     * The number of tiles in the x-direction of the world. This includes tiles before the start flag and after the finish flag.
     * @type {number}
     */
    this.width = options.tilesBeforeStart + this.trackLength + options.tilesAfterFinish;

    /**
     * The parts of the world that are fixed in position. i.e. ground, crates.
     * @type {Tile [][]}
     */
    this.base = utils.create2DArray(this.width);

    /**
     * The number of tiles in the y-direction of the world.
     * @type {number}
     */
    this.height = options.height;

    /**
     * The x-coordinate of the start flag in the world base.
     * @type {number}
     */
    this.startX = options.tilesBeforeStart;

    /**
     * The y-coordinate of the start flag in the world base.
     * @type {number}
     */
    this.startY = options.minGroundHeight;

    /**
     * The x-coordinate of the finish flag in the world base.
     * @type {number}
     */
    this.finishX = options.tilesBeforeStart + this.trackLength - 1;

    /**
     * The y-coordinate of the finish flag in the world base.
     * This value is determined by the generate function.
     * @type {number}
     */
    this.finishY = 0;

    /**
     * The tiles used in the creation of the world.
     * @type {Tiles}
     */
    this.tiles = options.tiles;

    this.generate();
}

/**
 * Function used to actually generate the world. This can be used to continuously generate new worlds.
 */
World.prototype.generate = function () {

    //todo:fix this function to work with defaultOptions/extreme options such as very small trackSize

    //all values here assuming 0-indexing
    var width = this.width - 1;
    var maxGroundHeight = this._options.maxGroundHeight - 1;
    var minGroundHeight = this._options.minGroundHeight - 1;
    var tiles = this._options.tiles;
    var currentY = minGroundHeight;
    var currentX = 0;

    this.base = utils.create2DArray(width + 1);
    var world = this.base;

    var r, r2; //random number
    var i; //temp counter

    //before start flag
    while (currentX < this.startX) {
        addFlat();
    }

    //start flag
    world[currentX][currentY + 1] = tiles.START;

    //starting of the track is a series of flat ground
    r = utils.randomInt(5, 15);
    for (i = 0; i <= r; i++) {
        addFlat();
    }

    //middle of track is varying
    r = utils.randomInt(15, 20);
    while (currentX < this.finishX - r) {

        r2 = utils.randomInt(1, 2);

        if (r2 === 1)
            createFlat();
        else if (r2 === 2)
            createJump();
    }

    //ending of track is a series of flat ground
    while (currentX <= this.finishX) {
        addFlat();
    }

    //finish flag
    world[currentX - 1][currentY + 1] = tiles.FINISH;
    this.finishY = currentY + 1;

    //after finish flag
    while (currentX <= width) {
        addFlat();
    }

    //creates a small sequence of flat land with obstacles
    function createFlat() {

        var i;
        var r;

        r = utils.randomInt(2, 4);
        for (i = 1; i < r; i++)
            addFlat()

        createObstacles();

        r = utils.randomInt(2, 4);
        for (i = 1; i < r; i++)
            addFlat()
    }

    //adds a sequence of obstacles
    function createObstacles() {

        var i, j, r, r2;

        r = utils.randomInt(1, 2);

        //1-2...-2-1
        if (r == 1) {
            addOneCrate();
            r = utils.randomInt(1, 3);
            for (i = 1; i <= r; i++) {
                addTwoCrates();
            }
            addOneCrate();
        }

        //1-space...-1-space...
        else {
            r = utils.randomInt(3, 5);
            for (i = 1; i <= r; i++) {
                addOneCrate();
                r2 = utils.randomInt(0, 2);
                for (j = 1; j < r2; j++) {
                    addFlat();
                }
            }
        }

    }

    //a jump over lava
    function createJump() {

        var r;

        addFlat();
        addJumpLeft();
        addLava();
        addLava();
        addLava();

        r = utils.randomInt(1, 2);

        if (r == 1 && currentY < maxGroundHeight) {
            currentY++;
            addJumpRight();
        }
        else if (r == 2 && currentY > minGroundHeight) {
            currentY--;
            addJumpRight();
        }
        else
            addJumpRight();
    }

    function addFlat() {

        var i;
        for (i = 0; i < currentY; i++) {
            world[currentX][i] = tiles.DIRT_MIDDLE;
        }
        world[currentX][currentY] = tiles.GRASS_MIDDLE;
        currentX++;
    }

    function addLava() {
        world[currentX][0] = tiles.LAVA;
        currentX++;
    }

    function addJumpLeft() {

        var i;
        world[currentX][0] = tiles.GROUND_LEFT;
        for (i = 1; i < currentY; i++) {
            world[currentX][i] = tiles.DIRT_LEFT;
        }
        world[currentX][currentY] = tiles.GRASS_LEFT;
        currentX++;
    }

    function addJumpRight() {
        var i;
        world[currentX][0] = tiles.GROUND_RIGHT;
        for (i = 1; i < currentY; i++) {
            world[currentX][i] = tiles.DIRT_RIGHT;
        }
        world[currentX][currentY] = tiles.GRASS_RIGHT;
        currentX++;
    }

    function addTwoCrates() {
        world[currentX][currentY + 1] = tiles.CRATE;
        world[currentX][currentY + 2] = tiles.CRATE;
        addFlat();
    }

    function addOneCrate() {
        world[currentX][currentY + 1] = tiles.CRATE;
        addFlat();
    }
};

/**
 * Creates a copy of this world with new tiles. This is needed in order to create identical worlds with different sized tiles.
 * @param {Tiles} newTiles - The new tiles to use in the copied world.
 * @returns {World}
 */
World.prototype.copy = function (newTiles) {

    var newWorld = new World(this._options);
    newWorld.tiles = newTiles;
    newWorld.finishY = this.finishY;
    newWorld.base = utils.create2DArray(this.width);

    for (var i = 0; i < this.base.length; i++) {
        for (var j = 0; j < this.base[i].length; j++) {
            newWorld.base[i][j] = newTiles[this.base[i][j].name];
        }
    }

    return newWorld;
};

module.exports = World;
