var Player = require('./player');
var errors = require('./gameErrors');
var utils = require('../utils');
var assets = require('./assets');
var merge = require('lodash.merge');
var World = require('./world');
var Tiles = require("./tiles");
var settings = require('../settings');

var minTrackLength = settings.game.minTrackLength;
var maxTrackLength = settings.game.maxTrackLength;
var tilesInY = settings.game.tilesInY;

/**
 * Create a new game.
 * @param {int} options.numberOfPlayers - The number of players to be in the game.
 * @param {string} options.divId - The ID of the div element within which the game will be drawn. Make sure to set the width and height of the div to the size of the game screen you want before creating the game. Also, the div must have a CSS position property of relative.
 * @constructor
 */
function Game(options) {

    var div = $('div#' + options.divId);

    console.assert(options.numberOfPlayers <= 4 && options.numberOfPlayers >= 1, 'The game must have between 1 and 4 players.');
    console.assert(div.length > 0, 'No div element with the given ID was found. You must provide a valid ID.');
    console.assert(div.length < 2, 'Multiple div elements with the given ID were found. You must provide a unique ID.');

    /**
     * Map of player ids to the player objects.
     * @type {object.<string, Player>}
     * @private
     */
    this._players = {};

    /**
     * The number of players to be in the game.
     * @type {int}
     */
    this.numberOfPlayers = options.numberOfPlayers;

    /**
     * Whether the game has started.
     * @type {boolean}
     */
    this.started = false;

    /**
     * The DIV element within which the game will be drawn.
     * @type {HTMLDivElement}
     * @private
     */
    this._div = div[0];

    /**
     * The height of the entire game screen.
     * @type {number}
     * @private
     */
    this._height = div.height();

    /**
     * The width of the entire game screen.
     * @type {number}
     * @private
     */
    this._width = div.width();

    /**
     * The canvas element showing the instructions for the game.
     * @type {HTMLCanvasElement}
     * @private
     */
    this._instruction = $('<canvas/>')[0];

    /**
     * Number of seconds to count down until game starts.
     * @type {number}
     */
    this.startCountdown = 5;
}

/**
 * Get the number of players currently in the game.
 * @returns {Number}
 */
Game.prototype.currentNumberOfPlayers = function () {
    return this._playersArray().length;
};

/**
 * Add a player to the game.
 * @param {string} id
 * @param {string} username
 * //todo: add throws documentations
 */
Game.prototype.addPlayer = function (id, username) {

    if (this.started) {
        throw new errors.GameAlreadyStartedError();
    }

    if (this.currentNumberOfPlayers() >= this.numberOfPlayers) {
        throw new errors.MaxNumberOfPlayersReachedError();
    }

    this._playersArray().forEach(function (player) {
        if (player.id === id) {
            throw new errors.PlayerAlreadyAddedError();
        }
        else if (player.username === username) {
            throw new errors.UsernameTakenError();
        }
    });

    this._players[id] = new Player({id: id, username: username});
};

/**
 * Start the game.
 */
Game.prototype.start = function () {

    console.assert(this.currentNumberOfPlayers() === this.numberOfPlayers, 'The game can only be started when the correct number of players have been added.');

    var self = this;
    this.started = true;
    assets.load(function (loadedAssets) {

        //empty out game div
        var div = $(this._div);
        div.empty();

        //create random sized tiles in order to generate a world which will then be copied to use player specific tiles
        var tiles = new Tiles({spriteSheet: loadedAssets.tiles});
        var trackLength = utils.randomInt(minTrackLength, maxTrackLength);
        var generatedWorld = new World({
            tiles: tiles,
            height: tilesInY,
            trackLength: trackLength
        });

        self._playersArray().forEach(function (player, index) {
            self._initializePlayer(player, index, generatedWorld, loadedAssets.tiles, loadedAssets.player);
            player.drawBackground(loadedAssets.background);
            player.drawBorder();
            player.drawForeground();
            player.drawUsername();
            player.drawPlayer();
            player.drawSpeed();
            player.drawDistance();
        });
        self._startCountdown(self.startCountdown);
    });
};

/**
 * Begins the countdown until the game starts.
 * @param {number} currentCount - Number of seconds till the game starts.
 * @private
 */
Game.prototype._startCountdown = function (currentCount) {
    var players = this._playersArray();
    if (currentCount === 0) {
        players.forEach(function (player) {
            player.clearNotification();
        });
        this._drawFrame(1, players);
    }
    else {
        players.forEach(function (player) {
            player.drawNotification('Get Ready: ' + currentCount.toString());
        });
        setTimeout(this._startCountdown.bind(this, currentCount - 1), 1000);
    }
};

/**
 * Function that draws the frames of the game.
 * @param {int} frame - Frame number from 1-60. This is necessary because in order to make the game
 * animate smoothly, not all players are redrawn in every frame.
 * @param {Player []} players - Array of players. This is provided because we need the array of players to remain
 * in constant order, and the _playersArray function may not do that.
 * @private
 */
Game.prototype._drawFrame = function (frame, players) {

    /**
     * @param {Player} player
     */
    function drawHelper(player) {
        var oldX = player.x;
        player.move();

        if (player.x !== oldX) {
            player.drawForeground();
            player.drawDistance();
        }
        player.drawPlayer();
    }

    if (frame % 2 == 0) {
        drawHelper(players[0]);
        if (this.numberOfPlayers > 2)
            drawHelper(players[2]);
    }
    else {
        if (this.numberOfPlayers > 1)
            drawHelper(players[1]);
        if (this.numberOfPlayers > 3)
            drawHelper(players[3]);
    }

    //updating player ranks
    if (frame % 4 == 0) {
        var rankedPlayers = this._playerRanks(players);
        rankedPlayers.forEach(function (player, i) {
            player.drawRank(i + 1);
        })
    }

    var newFrame = frame === 60 ? 1 : frame + 1;

    window.requestAnimationFrame(this._drawFrame.bind(this, newFrame, players));
};

/**
 * Returns an array of players ranked from 1st to last place in the game.
 * @param {Player []} players
 * @private
 * @returns {Player []}
 */
Game.prototype._playerRanks = function (players) {

    /**
     * Sorting function to determine ranks.
     * @param {Player} a
     * @param {Player} b
     */
    function sort(a, b) {
        var aCompleted = a.status === Player.status.COMPLETED;
        var bCompleted = b.status === Player.status.COMPLETED;

        if (aCompleted) {
            if (!bCompleted) {
                return -1;
            }
            else {
                if (a.finishTime < b.finishTime) {
                    return -1
                }
                else {
                    return 1;
                }
            }
        }
        else {
            if (bCompleted) {
                return 1;
            }
            else {
                if (a.x > b.x) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        }
    }

    return players.slice(0).sort(sort);
};

/**
 * Sets up a player once the game is about to begin.
 * @param {Player} player
 * @param {int} playerNumber - Is this player 1, player 2, etc. This must be zero-indexed.
 * @param {World} generatedWorld - The generated world which will then be copied to use player specific tiles.
 * @param {HTMLImageElement} tileSprite
 * @param {HTMLImageElement} playerSprite
 * @private
 */
Game.prototype._initializePlayer = function (player, playerNumber, generatedWorld, tileSprite, playerSprite) {

    var self = this;

    //height of player screen
    var height = this.numberOfPlayers >= 2 ? Math.floor(this._height / 2) : this._height;

    //tilesize for player screen
    var tileSize = Math.floor(height / tilesInY);

    //width of player screen
    var width = self._width;

    //number of pixels to shift player screen down
    var top = 0;

    //number of pixels to shift player screen right
    var left = 0;

    if (self.numberOfPlayers === 2) {

        //2nd player is displayed on bottom half of game screen
        if (playerNumber === 1) {
            top = height;
        }
    }
    else if (self.numberOfPlayers === 3) {

        //first 2 players take up half of the top half of game screen
        if (playerNumber <= 1) {
            width = Math.floor(width / 2);
        }

        //2nd player gets pushed to the left
        if (playerNumber === 1) {
            left = width;
        }

        //3rd player gets pushed down
        if (playerNumber === 2) {
            top = height;
        }
    }
    else if (self.numberOfPlayers === 4) {

        //all players only get a quarter of screen
        width = Math.floor(width / 2);

        //2nd and 4th player get pushed to left
        if (playerNumber === 1 || playerNumber === 3) {
            left = width;
        }

        //3rd and 4th player get pushed down
        if (playerNumber === 2 || playerNumber === 3) {
            top = height;
        }
    }

    player.setScreenSize(width, height);
    player.setScreenPosition(left, top);

    //player will start out at start flag
    player.x = generatedWorld.startX;
    player.y = generatedWorld.startY;

    //add player canvases to game div
    var div = $(this._div);
    player.canvasTypes.forEach(function (canvasType) {
        div.append($(player[canvasType]));
    });

    //create the player animation sprites
    var playerSprites = [];
    var playerSpriteHeight = playerSprite.height / 4;
    var playerSpriteWidth = playerSprite.width;
    for (var i = 0; i < 4; i++) {

        /**
         * @type {HTMLCanvasElement}
         */
        var canvas = $('<canvas/>')[0];
        utils.setCanvasSize(canvas, tileSize, tileSize * 2);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(playerSprite, 0, playerSpriteHeight * i, playerSpriteWidth, playerSpriteHeight, 0, 0, tileSize, tileSize * 2);
        playerSprites.push(canvas);
    }
    player.sprites = playerSprites;

    //copy world to use player specific tiles
    var tiles = new Tiles({
        spriteSheet: tileSprite,
        size: tileSize
    });
    player.world = generatedWorld.copy(tiles);
};

/**
 * Remove a player from the game.
 * @param {string} id
 * //todo:add throws documentation
 */
Game.prototype.removePlayer = function (id) {

    if (this.started) {
        throw new errors.GameAlreadyStartedError();
    }
    delete this._players[id];
};

/**
 * Get an array of the usernames of the players in the game.
 * @returns {string []}
 */
Game.prototype.playerUsernames = function () {
    var usernames = [];
    this._playersArray().forEach(function (player) {
        usernames.push(player.username);
    });
    return usernames;
};

/**
 * Increase the speed of a player.
 * @param {string} id - The id of the player whose speed is to be increased.
 */
Game.prototype.increaseSpeed = function (id) {
    var player = this._players[id];
    if (player) {
        player.increaseSpeed();
    }
};

/**
 * Decrease the speed of a player.
 * @param {string} id - The id of the player whose speed is to be decreased.
 */
Game.prototype.decreaseSpeed = function (id) {
    var player = this._players[id];
    if (player) {
        player.decreaseSpeed();
    }
};

/**
 * Make a player jump.
 * @param {string} id - The id of the player who is to jump.
 */
Game.prototype.jump = function (id) {
    var player = this._players[id];
    if (player) {
        player.jump();
    }
};

/**
 * Get an array of the players in the game.
 * @returns {Player []}
 * @private
 */
Game.prototype._playersArray = function () {
    var players = [];
    for (var playerId in this._players) {
        if (this._players.hasOwnProperty(playerId)) {
            players.push(this._players[playerId]);
        }
    }
    return players;
};

module.exports = Game;
