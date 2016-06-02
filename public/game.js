/**
 * Created by Shrey on 2016-03-18.
 */

var world = [];
var game = null;
var frames = 60;
var place_words = ["1st", "2nd", "3rd", "4th"];

/**
 * Generates the world map.
 */
function generate() {

    //all variables assume 0 indexing
    var maxHeight = 3; //max height of ground tiles
    var minHeight = 1;
    var currentY = 1;
    var currentX = 0;

    world = Create2DArray(game.trackLength);

    var option;
    var n;
    var j; //temp counter

    world[0][2] = new Tile(15, "start");
    for (j = 0; j <= randomInt(20, 30); j++) {
        addFlat();
    }

    while (currentX < game.trackLength - 30) {

        option = randomInt(1, 20);

        //level ground
        if (inBetween(option, 1, 10))
            createFlat();

        //jump
        else if (inBetween(option, 11, 20))
            createJump();
    }

    while (currentX < game.trackLength) {
        addFlat();
    }

    world[currentX - 1][currentY + 1] = new Tile(14, "end");

    function createFlat() {

        var i;
        for (i = 1; i < randomInt(2, 4); i++)
            addFlat()

        addObstacles();

        for (i = 1; i < randomInt(2, 4); i++)
            addFlat()
    }

    function addObstacles() {

        var random = randomInt(1, 2);
        var i;

        //1-2...-2-1
        if (random == 1) {
            addOneCrate();
            for (i = 1; i <= randomInt(1, 3); i++) {
                addTwoCrates();
            }
            addOneCrate();
        }

        //1-space...-1-space...
        else {
            for (i = 1; i <= randomInt(3, 5); i++) {
                addOneCrate();
                for (var j = 1; j < randomInt(0, 2); j++) {
                    addFlat();
                }
            }
        }

    }

    function createJump() {
        addFlat();
        addJumpRight();
        addLava();
        addLava();
        addLava();

        var r = randomInt(1, 2);

        if (r == 1 && currentY < maxHeight) {
            currentY++;
            addJumpLeft();
        }
        else if (r == 2 && currentY > minHeight) {
            currentY--;
            addJumpLeft();
        }
        else
            addJumpLeft();
    }

    function addFlat() {
        for (n = 0; n < currentY; n++) {
            world[currentX][n] = new Tile(10, "solid");
        }
        world[currentX][currentY] = new Tile(7, "solid");
        currentX++;
    }

    function addLava() {
        world[currentX][0] = new Tile(6, "death");
        currentX++;
    }

    function addJumpLeft() {
        world[currentX][0] = new Tile(12, "solid");
        for (n = 1; n < currentY; n++) {
            world[currentX][n] = new Tile(9, "solid");
        }
        world[currentX][currentY] = new Tile(1, "solid");
        currentX++;
    }

    function addJumpRight() {
        world[currentX][0] = new Tile(2, "solid");
        for (n = 1; n < currentY; n++) {
            world[currentX][n] = new Tile(11, "solid");
        }
        world[currentX][currentY] = new Tile(8, "solid");
        currentX++;
    }

    function addTwoCrates() {
        world[currentX][currentY + 1] = new Tile(13, "solid");
        world[currentX][currentY + 2] = new Tile(13, "solid");
        addFlat();
    }

    function addOneCrate() {
        world[currentX][currentY + 1] = new Tile(13, "solid");
        addFlat();
    }

}

/**
 * Generates a random number x such that min <= x <= max.
 * @param min The lower bound.
 * @param max The upper bound.
 * @returns {number} The random integer.
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Given the player, checks to see if the player will collide with an object
 * if the player moves in the horizontal direction. If the player will
 * collide, the function will move the player the amount just before
 * collision and return true. Else, it'll return false.
 * @param p The player to be moved.
 */
function collisionDetected(p) {

    var s = game.tileSize;
    var xFront = Math.floor((p.x + s * 0.9 + p.speedX * p.speedFactor) / s);
    var xBack = Math.floor((p.x + p.speedX * p.speedFactor + 0.1 * s) / s);
    var y = Math.floor((p.y + p.speedY - 1) / s);

    if (xFront == game.trackLength) {
        finishNotify(p);
    }

    if (p.speedY == 0) {
        if ((!world[xBack][y] || world[xBack][y].type != "solid") && (!world[xFront][y] || world[xFront][y].type != "solid")) {
            p.speedY = -1;
        }
    }

    else if (p.speedY < 0) {
        if ((world[xFront][y] && world[xFront][y].type == "solid") || (world[xBack][y] && world[xBack][y].type == "solid")) {
            p.speedY = 0;
            p.y = (y + 1) * s;
            p.jumping = false;
        }
        else if ((world[xFront][y] && world[xFront][y].type == "death") || (world[xBack][y] && world[xBack][y].type == "death")) {
            if (p.active) {
                p.active = false;
                p.deadCount = 4;
                notify(p, xFront, "YOU DIED. RESPAWNING IN:");
            }
        }
    }

    if (p.speedX > 0) {
        if (world[xFront][y + 1] && world[xFront][y + 1].type == "solid") {
            p.speedX = 0;
            p.x = xBack * s;
        }
    }
    else if (p.speedX < 0) {
        if (world[xBack][y + 1] && world[xBack][y + 1].type == "solid") {
            p.speedX = 0;
            p.x = xFront * s;
        }
    }
    return false;
}

/**
 * Checks to see if min <= numberToCheck <= max.
 * @param numberToCheck The number to check.
 * @param min The min possible number.
 * @param max The max possible number.
 */
function inBetween(numberToCheck, min, max) {
    return numberToCheck >= min && numberToCheck <= max;
}

function Create2DArray(rows) {
    var arr = [];

    for (var i = 0; i < rows; i++) {
        arr[i] = [];
    }

    return arr;
}

function Tile(source, type) {
    this.src = source;
    this.type = type
}

/**
 * Simple helper function to see if two arrays are identical.
 * @param array1 The first array
 * @param array2 The second array
 * @returns {boolean} Is array1==array2
 */
function arrayAreEqual(array1, array2) {
    for (var i = 0; i < array1.length; i++) {
        if (array1[i] != array2[i])
            return false
    }
    return true
}

/**
 * Given the three parameters of the quadratic equation, returns the nearest
 * positive integer solution.
 * @param a The a value.
 * @param b The b value.
 * @param c The c value.
 */
function solveQuadraticEquation(a, b, c) {

    var root = Math.pow(b, 2) - 4 * a * c;
    var root1 = Math.ceil((-b + Math.sqrt(root)) / (2 * a));
    var root2 = Math.ceil((-b - Math.sqrt(root)) / (2 * a));

    if (root1 > 0)
        return root1;
    else
        return root2;
}

function notify(p, x, message) {

    if (p.deadCount >= 0) {
        var ctx = p.notification;
        var s = game.tileSize;

        //creates the opaque look
        ctx.clearRect(0, 0, game.width, game.height);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#DCDCDC";
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.globalAlpha = 1;

        //adds the text
        ctx.fillStyle = "#ffffff";
        ctx.font = Math.ceil(s / 1.5) + "px Impact";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#999999";
        ctx.fillText(message, game.width / 2, game.height / 4);
        ctx.strokeText(message, game.width / 2, game.height / 4);

        //adds the countdown
        ctx.drawImage(game.rankImage, (p.deadCount + 1) * 128, 0, 128, 128, game.width / 2 - s / 2, game.height / 2 - s / 2, s, s);
        p.deadCount--;
        setTimeout(notify.bind(null, p, x, message), 1000);
    }
    else {
        var y = 0;
        while (world[x][0].type != "solid") {
            x++;
        }

        while (world[x][y]) {
            y++;
        }
        p.x = x * game.tileSize;
        p.y = y * game.tileSize;
        p.speedX = 0;
        p.speedY = 0;
        p.active = true;
        p.notification.clearRect(0, 0, game.width, game.height);
        p.jumping = false;
        drawSpeed(p, p.speedX);
    }

}

function Game(numberOfPlayers) {

    this.players = [];

    this.initialize = function () {

        this.tilesInY = 8;
        this.numberOfPlayers = numberOfPlayers;
        if (this.numberOfPlayers == 1)
            this.height = Math.round(($(window).height() - 10) / this.numberOfPlayers) - ((Math.round(($(window).height() - 10) / this.numberOfPlayers)) % (this.tilesInY * 2));
        else
            this.height = Math.round(($(window).height() - 10) / 2) - ((Math.round(($(window).height() - 10) / 2)) % (this.tilesInY * 2));
        this.tileSize = this.height / this.tilesInY;
        this.width = ($(window).width() - 10) - (($(window).width() - 10) % (this.tileSize));

        if (this.numberOfPlayers > 2)
            this.width = this.width / 2;

        this.trackLength = randomInt(100, 200);
        this.styleCanvas();
        this.places = [];
    };

    /**
     * Styles all the canvases with the appropriate attributes. Also,
     * changes their positions so that they aren't on top of each other.
     */
    this.styleCanvas = function () {

        $("canvas").attr("width", this.width);
        $("canvas").attr("height", this.height);
        $("div").attr("width", this.width);
        $("div").attr("height", this.height);

        if (this.numberOfPlayers > 2) {
            document.getElementById("2player").style.top = (this.height + "px");
            document.getElementById("1player").style.left = (this.width + "px");
            if (this.numberOfPlayers > 3) {
                document.getElementById("3player").style.top = (this.height + "px");
                document.getElementById("3player").style.left = (this.width + "px");
            }
        }
        else {
            for (var i = 1; i < numberOfPlayers; i++) {
                document.getElementById(i + "player").style.top = (i * this.height + "px");
            }
        }
    };

    /**
     * Adds a player to the game list.
     * @param player The player to add.
     */
    this.addPlayer = function (player) {
        this.players.push(player);
    };

    this.addTiles = function (i) {
        this.tiles = i;
    };

    this.addBackgroundImage = function (i) {
        this.background = i;
    };

    this.addPlayerImage = function (i) {
        this.playerImage = i;
    };

    this.addRankImage = function (i) {
        this.rankImage = i;
    };

    this.updatePlaces = function () {
        var temp = [];
        for (var i = 0; i < this.numberOfPlayers; i++) {
            temp.push(this.players[i].x);
            temp.sort(function (a, b) {
                return b - a
            });
        }
        var newPlaces = [];
        for (i = 0; i < this.numberOfPlayers; i++) {
            newPlaces.push(temp.indexOf(this.players[i].x))
        }

        if (!arrayAreEqual(newPlaces, this.places)) {
            this.places = newPlaces;
            drawPlaces(this.places);
        }
    };

    this.getRank = function (p) {
        var temp = [];
        for (var i = 0; i < this.numberOfPlayers; i++) {
            temp.push(this.players[i].x);
            temp.sort(function (a, b) {
                return b - a
            });
        }
        return temp.indexOf(p.x);
    }
}

/**
 * Handles the necessary information for the player.
 * @param number The player number
 * @constructor
 */
function Player(number) {

    /**
     * Does calculations and then initializes the necessary variables.
     */
    this.initialize = function () {
        this.x = game.tileSize;
        this.y = game.tileSize * 2;
        this.previousX = this.x;
        this.previousY = this.y;
        this.speedX = 0;
        this.speedFactor = game.tileSize * 0.02;
        this.jumping = false;
        this.maxJumpSpeed = solveQuadraticEquation(1, 1, -game.tileSize * 2) + 4;
        this.speedY = 0;
        this.active = true;
        this.deadCount = 0;
        this.currentSprite = 2;
    };

    /**
     * Creates the necessary canvas elements for the player. Call as soon as
     * the player is added to the game. DO NOT initialize the game prior to
     * calling this function for all players.
     */
    this.prepareCanvas = function () {

        var insertHTML = '<div id = "' + number + 'player"><canvas id = "' + number + 'background" class = "background"></canvas><canvas id = "' + number + 'foreground" class = "foreground"></canvas><canvas id = "' + number + 'hud" class = "hud"></canvas><canvas id = "' + number + 'p" class = "p"></canvas><canvas id = "' + number + 'notification" class = "notification"></canvas></div>';

        $("body").append(insertHTML);

        this.background = document.getElementById(number + "background").getContext("2d");
        this.foreground = document.getElementById(number + "foreground").getContext("2d");
        this.hud = document.getElementById(number + "hud").getContext("2d");
        this.p = document.getElementById(number + "p").getContext("2d");
        this.notification = document.getElementById(number + "notification").getContext("2d");
    };

    /**
     * Increases the speedX of the character by one.
     */
    this.increaseSpeed = function () {
        if (this.speedX < 9) {
            this.speedX++;
            drawSpeed(this, this.speedX);
        }
    };

    /**
     * Decreases the speedX of the character by one.
     */
    this.decreaseSpeed = function () {
        if (this.speedX > 0) {
            this.speedX--;
            drawSpeed(this, this.speedX);
        }
    };

    this.move = function () {
        if (this.active) {
            collisionDetected(this);
            this.x += this.speedX * this.speedFactor;
            if (this.speedY != 0) {
                this.y += this.speedY;
                this.speedY--;
                this.currentSprite = 2;
            }
            else {
                if (this.currentSprite == 0)
                    this.currentSprite = 1;
                else
                    this.currentSprite = 0;
            }
            if (this.speedX == 0) {
                this.currentSprite = 2;
            }
        }
    };

    /**
     * Makes the player jump.
     */
    this.jump = function () {
        if (!this.jumping && this.speedY == 0) {
            this.jumping = true;
            this.speedY = this.maxJumpSpeed;
        }
    };

    /**
     * Determines if a player moved or not.
     * @returns {boolean} True if player moved. False otherwise.
     */
    this.moved = function () {
        return ((this.x != this.previousX) || (this.y != this.previousY));
    }
}

function drawWorld(p) {
    var ctx = p.foreground;
    var s = game.tileSize;
    var x = Math.round(p.x);
    var i, j;

    ctx.clearRect(0, 0, game.width, game.height);

    var lower = Math.floor((p.x - s) / s);
    var upper = lower + game.width / s + 1;

    if (upper > game.trackLength - 1) {
        for (i = game.trackLength - 1; i <= upper; i++) {
            for (j = 0; j < game.tilesInY; j++) {
                if (world[game.trackLength - 2][j]) {
                    ctx.drawImage(game.tiles, (world[game.trackLength - 2][j].src - 1) * 128, 0, 128, 128, s * (i + 1) - x, game.height - ((j + 1) * s), s, s);
                }
            }
        }
        upper = game.trackLength - 1;
    }

    for (i = lower; i <= upper; i++) {
        for (j = 0; j < game.tilesInY; j++) {
            if (world[i][j]) {
                ctx.drawImage(game.tiles, (world[i][j].src - 1) * 128, 0, 128, 128, s * (i + 1) - x, game.height - ((j + 1) * s), s, s);
            }
        }
    }
}

function drawPlayer(p) {
    var ctx = p.p;
    var s = game.tileSize;
    var y = p.y;

    ctx.clearRect(game.tileSize, 0, game.tileSize, game.height);

    if (p.jumping)
        ctx.drawImage(game.playerImage, 0, 768, 128, 256, s, game.height - y - s * 2, s, s * 2);
    else
        ctx.drawImage(game.playerImage, 0, p.currentSprite * 256, 128, 256, s, game.height - y - s * 2, s, s * 2);
}

function prepareHud(p, number) {

    var ctx = p.hud;
    var s = game.tileSize;
    ctx.font = Math.ceil(s / 1.5) + "px Dosis";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#337ab7";
    ctx.lineWidth = 1;
    ctx.textBaseline = "middle";
    ctx.fillText(usernames[number], game.width-s/4-ctx.measureText(usernames[number]).width, s / 2);
    ctx.strokeText(usernames[number], game.width-s/4-ctx.measureText(usernames[number]).width, s / 2);

}

function finishNotify(p) {
    var ctx = p.notification;
    var s = game.tileSize;

    //creates the opaque look
    ctx.clearRect(0, 0, game.width, game.height);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#DCDCDC";
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.globalAlpha = 1;

    //adds the text
    ctx.font = s + "px Dosis";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#337ab7";
    ctx.lineWidth = 1;
    ctx.textBaseline = "middle";

    ctx.fillText(place_words[game.getRank(p)], game.width / 2, game.height / 2);
    ctx.strokeText(place_words[game.getRank(p)], game.width / 2, game.height / 2);

    p.active = false;
    p.x = (game.trackLength-1) * game.tileSize + 5 - place;
}

function drawPlaces(places) {

    for (var i = 0; i < game.numberOfPlayers; i++) {
        var ctx = game.players[i].hud;
        var s = game.tileSize;
        ctx.clearRect(0, 0, 2*s + 5, s);

        ctx.fillText(place_words[places[i]], s / 4, s / 2, 2*s);
        ctx.strokeText(place_words[places[i]], s / 4, s / 2, 2*s);
    }

}

function drawDistance(){
    for (var i = 0; i < game.numberOfPlayers; i++) {
        var ctx = game.players[i].hud;
        var s = game.tileSize;
        var distance = Math.floor(game.trackLength - game.players[i].x/s);
        ctx.clearRect(0, 2*s, 4*s, s);
        ctx.fillText(distance + " m", s / 4, s / 2 + 2*s, 3*s);
        ctx.strokeText(distance + " m", s / 4, s / 2 + 2*s, 3*s);
    }
}

function drawSpeed(p, speed) {
    var ctx = p.hud;
    var s = game.tileSize;
    ctx.clearRect(0, s, 3*s, s);
    ctx.fillText(speed+" m/s", s / 4, s / 2 + s, 2*s);
    ctx.strokeText(speed+" m/s", s / 4, s / 2 + s, 2*s);
}

function draw() {

    if (frames % 2 == 0) {
        drawHelper(0);
        if (game.numberOfPlayers > 2)
            drawHelper(2);
    }
    else {
        if (game.numberOfPlayers > 1)
            drawHelper(1);
        if (game.numberOfPlayers > 3)
            drawHelper(3);
    }

    if (frames % 4 == 0) {
        game.updatePlaces();
        drawDistance();
    }

    if (frames == 60)
        frames = 1;
    else
        frames++;

    window.requestAnimationFrame(draw);
}

function drawHelper(p) {
    game.players[p].move();
    drawWorld(game.players[p]);
    drawPlayer(game.players[p]);
}

function gameReady() {
    game = new Game(numberOfPlayers);

    //add players to the game
    var player;
    for (var x = 0; x < numberOfPlayers; x++) {
        player = new Player(x);
        player.prepareCanvas();
        game.addPlayer(player);
    }

    game.initialize();

    //initialize the players
    for (x = 0; x < numberOfPlayers; x++) {
        game.players[x].initialize();
    }

    generate();
    informControl();
    loadBackground();
}

function loadBackground() {
    var background = new Image();
    background.src = "images/back.png";
    game.addBackgroundImage(background);
    background.onload = loadTiles;

}

function loadTiles() {
    var tiles = new Image();
    tiles.src = "images/tiles2.png";
    game.addTiles(tiles);
    tiles.onload = loadPlayer;
}

function loadPlayer() {
    var player = new Image();
    player.src = "images/player.png";
    game.addPlayerImage(player);
    player.onload = loadRank;
}

function loadRank() {
    var rank = new Image();
    rank.src = "images/rank.png";
    game.addRankImage(rank);
    rank.onload = drawBackground;
}

function drawBackground() {
    console.log("drawing background");
    for (var j = 0; j < game.numberOfPlayers; j++) {
        game.players[j].background.drawImage(game.background, 0, 0, game.width, game.height);
        game.players[j].notification.rect(0, 0, game.width, game.height);
        game.players[j].notification.stroke();
        prepareHud(game.players[j], j);
        drawSpeed(game.players[j], 0);

    }

    for (j = 0; j < game.numberOfPlayers; j++) {
        game.players[j].active = false;
        game.players[j].deadCount = 4;
        notify(game.players[j], 1, "GET READY");
    }
    window.requestAnimationFrame(draw);
}

function informControl(){
    sendData = {};
    sendData["type"] = "start_game";
    sendData["player_ids"] = player_id;
    socket.send(JSON.stringify(sendData));
}
