"use strict";

var utils = require('../utils');

var status = {
    ALIVE: 'ALIVE', //player is alive and can move, jump, etc.
    DISCONNECTED: 'DISCONNECTED', //player has disconnected, no controls will work
    DEAD: 'DEAD', //player is dead and waiting to respawn before he can move,jump,etc
    COMPLETED: 'COMPLETED' //player has finished the track
};

/**
 * Create a player.
 * @param {string} options.id
 * @param {string} options.username
 * @constructor
 */
function Player(options) {

    /**
     * The id of the player.
     * @type {string}
     */
    this.id = options.id;

    /**
     * The username of the player.
     * @type {string}
     */
    this.username = options.username;

    /**
     * Name of the canvases that represent a player's game screen. The canvases are named
     * in the order that they are layered. For example, the first canvas in this list is the
     * bottom most canvas.
     * @type {string []}
     */
    this.canvasTypes = ['background', 'foreground', 'player', 'hud', 'notification', 'border'];

    /**
     * The canvas element where the background images will be drawn.
     * @type {HTMLCanvasElement}
     */
    this.background = $('<canvas/>').css('z-index', '0').css('position', 'absolute')[0];

    /**
     * The canvas element where the foreground images will be drawn.
     * @type {HTMLCanvasElement}
     */
    this.foreground = $('<canvas/>').css('z-index', '1').css('position', 'absolute')[0];

    /**
     * The canvas element where the player images will be drawn.
     * @type {HTMLCanvasElement}
     */
    this.player = $('<canvas/>').css('z-index', '2').css('position', 'absolute')[0];

    /**
     * The canvas element where the HUD images will be drawn.
     * @type {HTMLCanvasElement}
     */
    this.hud = $('<canvas/>').css('z-index', '3').css('position', 'absolute')[0];

    /**
     * The canvas element where the notification images will be drawn.
     * @type {HTMLCanvasElement}
     */
    this.notification = $('<canvas/>').css('z-index', '4').css('position', 'absolute')[0];

    /**
     * The canvas element where the player's screen border will be drawn.
     * @type {HTMLCanvasElement}
     */
    this.border = $('<canvas/>').css('z-index', '5').css('position', 'absolute')[0];

    /**
     * The x position of the player. Rather than pixels, this is represented as tiles, with 0 being the start of tile 1.
     * For example, an x value of 1.5 means the back of the player is in the middle of tile 2.
     * @type {number}
     */
    this.x = 0;

    /**
     * The y position of the player. Rather than pixels, this is represented as tiles, with 0 being the bottom most part
     * of the screen. For example, a y value of 2 means the player is on the top of tile 2.
     * @type {number}
     */
    this.y = 0;

    /**
     * The number of seconds it will take for a player to re-spawn upon death.
     * @type {number}
     */
    this.respawnTime = 3;

    /**
     * The speed of the player in the x-direction.
     * @type {number}
     */
    this.speedX = 0;

    /**
     * Maximum speed of player in the x-direction.
     * @type {number}
     */
    this.maxSpeedX = 9;

    /**
     * Tiles that a player will cover per move. This will be multiplied by the speedX to get
     * the actual amount of tile covered. i.e. If the speedX was 3, then a single move would
     * increase the player's x position by (3*0.02)=0.06
     * @type {number}
     */
    this.speedXFactor = 0.02;

    /**
     * The speed of the player in the y-direction.
     * @type {number}
     */
    this.speedY = 0;

    /**
     * Tiles that a player will cover per move. This will be multiplied by the speedY to get
     * the actual amount of tile covered. i.e. If the speedY was 3, then a single move would
     * increase the player's y position by (3*0.02)=0.06
     * @type {number}
     */
    this.speedYFactor = 0.02;

    /**
     * The number of tiles high the player can jump. i.e. if 2, a player can jump at least as high as
     * the height of 2 tiles.
     * @type {number}
     */
    this.jumpHeight = 2;

    /**
     * Speed at which the player jumps in the y-direction.
     * @type {number}
     */
    this.maxSpeedY= this._calculateMaxSpeedY();

    /**
     * The width of this player's game screen.
     * @type {number}
     */
    this.width = 0;

    /**
     * The height of this player's game screen.
     * @type {number}
     */
    this.height = 0;

    /**
     * The world for the player.
     * @type {World}
     */
    this.world = null;

    /**
     * Whether the player is currently jumping.
     * @type {boolean}
     */
    this.jumping = false;

    /**
     * The status of the player. This will help determine what controls are available to the player.
     * @type {string}
     */
    this.status = status.ALIVE;

    /**
     * An array of player animations.
     * @type {HTMLCanvasElement []}
     */
    this.sprites = [];

    /**
     * The current animation to display for the player sprite.
     * @type {number}
     */
    this.currentSprite = 2;

    /**
     * Number of tiles that will be displayed behind the player on the game screen.
     * @type {number}
     */
    this.tilesBehindPlayer = 1;

    /**
     * The milliseconds since epoch at which the player was finished the track.
     * @type {number}
     */
    this.finishTime = null;
}

/**
 * Calculates the jump speed of player so that the player is able to reach his jump height.
 * @private
 * @returns {number}
 */
Player.prototype._calculateMaxSpeedY = function(){

    //these quadratic function values were determined by simplifying the sum of arithmetic
    //sequence formula in order to ensure the player jumps fast enough to reach necessary jump height
    var roots = utils.solveQuadraticEquation(this.speedYFactor/2, this.speedYFactor/2, -this.jumpHeight);

    //taking the ceil of positive root, so player can jump at least to jump height
    //in practice, this will usually result in player jumping a little higher than desired jump height
    if (roots[0]>0){
        return Math.ceil(roots[0]);
    }
    else{
        return Math.ceil(roots[1]);
    }
};

/**
 * Draws the player sprite.
 */
Player.prototype.drawPlayer = function () {
    var ctx = this.player.getContext('2d');
    var s = this.world.tiles.size;
    var y = this.y;
    var height = this.height;
    var width = this.width;
    var sprite = this.sprites[this.currentSprite];
    var tilesBehindPlayer = this.tilesBehindPlayer;

    ctx.clearRect(0, 0, width, height);
    var left = tilesBehindPlayer * s;
    var top = height - y * s - s * 2;
    ctx.drawImage(sprite, left, top, s, s * 2);
};

/**
 * Display a message to the notification screen.
 * @param {string} message - The message to display
 */
Player.prototype.drawNotification = function (message) {
    var ctx = this.notification.getContext('2d');
    var height = this.height;
    var width = this.width;
    var s = this.world.tiles.size;

    ctx.clearRect(0, 0, width, height);

    //creates the opaque look
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#DCDCDC";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    //draw the message
    ctx.fillStyle = "#ffffff";
    ctx.font = Math.ceil(s / 1.5) + "px Impact";
    ctx.textAlign = "center";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#999999";
    ctx.fillText(message, width / 2, height / 4);
    ctx.strokeText(message, width / 2, height / 4);
};

/**
 * Clears the notification screen.
 */
Player.prototype.clearNotification = function () {
    var ctx = this.notification.getContext('2d');
    var height = this.height;
    var width = this.width;
    ctx.clearRect(0, 0, width, height);
};

/**
 * Draw a background on the player screen. This function assumes the background can be tiled horizontally.
 * @param {HTMLImageElement} background - The background image to draw.
 */
Player.prototype.drawBackground = function (background) {

    var height = this.height;
    var width = this.width;
    var ctx = this.background.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    //dimensions the background will actually be drawn at
    var scaledBackgroundHeight = height;
    var scaledBackgroundWidth = Math.floor(background.width * scaledBackgroundHeight / background.height);

    //tile the background on a horizontal axis
    var widthDrawn = 0;
    while (widthDrawn < width) {
        ctx.drawImage(background, widthDrawn, 0, scaledBackgroundWidth, scaledBackgroundHeight);
        widthDrawn += scaledBackgroundWidth
    }
};

/**
 * Respawn the player after the player died.
 */
Player.prototype.respawn = function () {

    //move player to closest non-death tile that player can stand on
    var y = 0;
    var x = Math.ceil(this.x);
    var world = this.world;
    while (!world.base[x][0].isSolid || world.base[x][0].isDeath) {
        x++;
    }
    while (world.base[x][y] && world.base[x][y].isSolid) {
        y++;
    }
    this.x = x;
    this.y = y;

    //reset to starting values
    this.speedX = 0;
    this.speedY = 0;
    this.status = status.ALIVE;
    this.jumping = false;
    this.currentSprite = 2;

    //draw new canvases
    this.drawSpeed();
    this.drawForeground();
};

/**
 * Function to run when the player dies.
 */
Player.prototype.died = function () {

    /**
     * @param {number} secondsTillReSpawn
     */
    function helper(secondsTillReSpawn) {
        if (secondsTillReSpawn === 0) {
            this.clearNotification();
            this.respawn();
        }
        else {
            this.drawNotification('Respawning in: ' + secondsTillReSpawn.toString());
            setTimeout(helper.bind(this, secondsTillReSpawn - 1), 1000);
        }
    }

    this.status = status.DEAD;
    helper.bind(this, this.respawnTime)();
};

/**
 * Draw the speed of the player on the HUD.
 */
Player.prototype.drawSpeed = function () {
    var ctx = this.hud.getContext('2d');
    var s = this.world.tiles.size;
    var speed = this.speedX;
    ctx.clearRect(0, s, 3 * s, s);
    ctx.fillText(speed + " m/s", s / 4, s / 2 + s, 2 * s);
    ctx.strokeText(speed + " m/s", s / 4, s / 2 + s, 2 * s);
};

/**
 * Draws the distance the player still has to travel to finish.
 */
Player.prototype.drawDistance = function () {
    var ctx = this.hud.getContext('2d');
    var s = this.world.tiles.size;
    var distance = Math.floor(this.world.trackLength - (this.x - this.world.startX));
    ctx.clearRect(0, 2 * s, 4 * s, s);
    ctx.fillText(distance + " m", s / 4, s / 2 + 2 * s, 3 * s);
    ctx.strokeText(distance + " m", s / 4, s / 2 + 2 * s, 3 * s);
};

/**
 * Draw the rank of the player.
 * @param {number} rank - The rank the player is in.
 */
Player.prototype.drawRank = function (rank) {

    var rankToWord = {
        1:'1st',
        2:'2nd',
        3:'3rd',
        4:'4th'
    };

    var ctx = this.hud.getContext('2d');
    var s = this.world.tiles.size;
    ctx.clearRect(0, 0, 2 * s + 5, s);

    ctx.fillText(rankToWord[rank], s / 4, s / 2, 2 * s);
    ctx.strokeText(rankToWord[rank], s / 4, s / 2, 2 * s);
};

/**
 * Draw the username of the player on the HUD.
 */
Player.prototype.drawUsername = function () {
    var ctx = this.hud.getContext('2d');
    var s = this.world.tiles.size;
    var username = this.username;
    var width = this.width;
    ctx.font = Math.ceil(s / 1.5) + "px Dosis";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#337ab7";
    ctx.lineWidth = 1;
    ctx.textBaseline = "middle";
    ctx.fillText(username, width - s / 4 - ctx.measureText(username).width, s / 2);
    ctx.strokeText(username, width - s / 4 - ctx.measureText(username).width, s / 2);
};

/**
 * Draw a border on the player screen.
 */
Player.prototype.drawBorder = function () {

    var height = this.height;
    var width = this.width;
    var ctx = this.border.getContext('2d');

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000";
    ctx.strokeRect(0, 0, width, height);
};

/**
 * Draw the foreground.
 */
Player.prototype.drawForeground = function () {

    var ctx = this.foreground.getContext('2d');
    var height = this.height;
    var width = this.width;
    var tileSize = this.world.tiles.size;
    var world = this.world;
    var x = this.x;
    var tilesBehindPlayer = this.tilesBehindPlayer;
    var i, j; //counters

    /** @type {Tile} */
    var tile;

    ctx.clearRect(0, 0, width, height);

    //index of tile to show on leftmost side of player screen
    var lower = Math.floor(x - tilesBehindPlayer);

    //index of tile to show on rightmost side of player screen
    var upper = lower + Math.ceil(width / tileSize);

    //x-pixel that represents the first pixel on the canvas
    var furthestLeft = Math.round((x - tilesBehindPlayer) * tileSize);

    for (i = lower; i <= upper; i++) {
        for (j = 0; j < world.height; j++) {

            tile = world.base[i][j];

            if (tile) {
                var left = tileSize * i - furthestLeft;
                var top = height - ((j + 1) * tileSize);
                ctx.drawImage(tile.canvas, left, top, tileSize, tileSize);
            }
        }
    }
};

/**
 * Increase the speed of the player.
 */
Player.prototype.increaseSpeed = function () {
    //todo:should only be able to change speed when on ground
    if (this.status === status.ALIVE && this.speedX < this.maxSpeedX) {
        this.speedX++;
        this.drawSpeed();
    }
};

/**
 * Decrease the speed of the player.
 */
Player.prototype.decreaseSpeed = function () {
    //todo:should only be able to change speed when on ground
    if (this.status === status.ALIVE && this.speedX > 0) {
        this.speedX--;
        this.drawSpeed();
    }
};

/**
 * Make the player jump.
 */
Player.prototype.jump = function () {

    //don't want player to jump while they are in the air
    if (this.status === status.ALIVE && !this.jumping && this.speedY === 0) {
        this.jumping = true;
        this.speedY = this.maxSpeedY;
    }
};

/**
 * Function to run once the player completes the track.
 */
Player.prototype.completed = function () {
    this.status = status.COMPLETED;
    this.speedX = 0;
    this.speedY = 0;
    this.jumping = false;
    this.drawNotification('Finished');
    this.finishTime = new Date().getTime();
};

/**
 * Make the player move.
 */
Player.prototype.move = function () {

    if (this.status !== status.ALIVE)
        return;

    var x = this.x;
    var base = this.world.base;
    var finishX = this.world.finishX;

    //x position of front of player after potential move
    var xFront = x + 1 + this.speedX * this.speedXFactor;

    //the index of the tile the front of player will touch after potential move
    //the 0.1 is subtracted since it is assumed that the player image ends 10% from the right of full tile
    var xFrontTile = Math.floor(xFront - 0.1);

    //x position of the back of player after potential move
    var xBack = x + this.speedX * this.speedXFactor;

    //the index of the tile the back of the player will touch after potential move
    //the 0.1 is added since it is assumed that the player image starts 10% from the left of full tile
    var xBackTile = Math.floor(xBack + 0.1);

    //y position of player feet after potential move
    var yBottom = this.y + this.speedY * this.speedYFactor;

    //the index of the tile the foot of the player will touch after potential move
    var yBottomTile = Math.floor(yBottom);
    //if player is standing on a tile, then the tile below him actually has an index 1 lower
    if (yBottom === yBottomTile) {
        yBottomTile--;
    }

    //player is finished track
    if (xFrontTile == finishX) {
        this.completed();
        return
    }

    //landed on lava
    if ((base[xFrontTile][yBottomTile] && base[xFrontTile][yBottomTile].isDeath) || (base[xBackTile][yBottomTile] && base[xBackTile][yBottomTile].isDeath)) {
        this.died();
    }

    //landed on solid ground
    else if ((base[xFrontTile][yBottomTile] && base[xFrontTile][yBottomTile].isSolid) || (base[xBackTile][yBottomTile] && base[xBackTile][yBottomTile].isSolid)) {
        this.speedY = 0;
        this.y = (yBottomTile + 1);
        this.jumping = false;
    }

    //no solid tile below player
    else if ((!base[xBackTile][yBottomTile] || !base[xBackTile][yBottomTile].isSolid) && (!base[xFrontTile][yBottomTile] || !base[xFrontTile][yBottomTile].isSolid)) {
        this.speedY--;
        this.y = yBottom;
    }

    if (this.speedX > 0) {

        //crash into crate
        if (base[xFrontTile][yBottomTile + 1] && base[xFrontTile][yBottomTile + 1].isSolid) {
            this.speedX = 0;
            this.x = xBackTile;
        }
        else {
            this.x = xBack;
        }
    }

    //decide player sprite to show
    if (this.currentSprite == 0) {
        this.currentSprite = 1
    }
    else {
        this.currentSprite = 0;
    }
    if (this.speedX === 0) {
        this.currentSprite = 2;
    }
    if (this.jumping) {
        this.currentSprite = 0;
    }
};

/**
 * Sets the width and height for this player's screen.
 * @param {number} width
 * @param {number} height
 */
Player.prototype.setScreenSize = function (width, height) {

    var self = this;
    this.width = width;
    this.height = height;

    this.canvasTypes.forEach(function (canvasType) {
        utils.setCanvasSize(self[canvasType], width, height);
    });
};

/**
 * Sets the position of this player's screen, by setting the position of the canvases.
 * @param left
 * @param top
 */
Player.prototype.setScreenPosition = function (left, top) {

    var self = this;

    this.canvasTypes.forEach(function (canvasType) {
        utils.setCanvasPosition(self[canvasType], left, top);
    });
};

module.exports = Player;
module.exports.status = status;