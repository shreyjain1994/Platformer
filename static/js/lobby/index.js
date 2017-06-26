var actions = require('../../../lib/ws/actions');
var utils = require('../../../lib/utils');
var Game = require('./game');
var errors = require('./gameErrors');
var settings = require('../settings');

//get loading of assets started as soon as possible
var assets = require('./assets');

/**
 * Websocket connection to the game server.
 * @type {WebSocket}
 */
var socket;

/**
 * @type {Game}
 */
var game;

var lobbyId;

$(document).ready(docReady);

function docReady() {
    handleWebsocket();
    $("#createLobby").submit(createLobby);

    if (process.env.NODE_ENV === 'development') {
        $("body").keydown(handleKeys);
    }

    $('#closeLobby').click(closeLobby)
}

if (process.env.NODE_ENV === 'development') {
    function handleKeys(e) {
        var player = game._playersArray()[0];
        if (e.keyCode == 37) { // left
            player.decreaseSpeed();
        }
        else if (e.keyCode == 38) { // up
            player.jump();
        }
        else if (e.keyCode == 39) { // right
            player.increaseSpeed();
        }
    }
}

if (process.env.NODE_ENV === 'development') {
    function createFakeGame() {
        game = new Game({
            numberOfPlayers: 2,
            divId: 'game'
        });
        game.addPlayer('foobar', 'shrey');
        game.addPlayer('foo', 'shrey1');
        //game.addPlayer('foos', 'shrey2');
        game.start();
    }
}

function createLobby(event) {
    event.preventDefault();
    var data = utils.serializeObject($(this));
    var numberOfPlayers = parseInt(data.numberOfPlayers);
    game = new Game({
        numberOfPlayers: numberOfPlayers,
        divId: 'game'
    });
    socket.send(actions.LOBBY_OPEN);
    displayLoader('Opening lobby');
}

//todo:need to allow closing of lobby

function displayLoader(message) {
    $('#nonGame').show();
    $("#loader").show();
    $("#loaderMessage").html(message);
    $('#setup').hide();
    $('#lobby').hide();
    $('#game').hide();
}

function displaySetup() {
    $('#nonGame').show();
    $('#setup').show();
    $('#loader').hide();
    $('#lobby').hide();
    $('#game').hide();
}

function displayLobby() {
    $('#nonGame').show();
    $('#lobby').show();
    $('#setup').hide();
    $('#loader').hide();
    $('#game').hide();
}

function displayGame() {
    $('#nonGame').hide();
    $('#game').show();
}

function updateLobby() {

    var gameType = game.numberOfPlayers == 1 ? 'Single Player' : 'Multi Player';
    var playersMessage = game.playerUsernames().join('<br>');

    $('#gameType').html(gameType);
    $('#currentNumberOfPlayers').html(game.currentNumberOfPlayers());
    $('#maxNumberOfPlayers').html(game.numberOfPlayers);
    $('#playerUrl').html(settings.playerUrl);
    $('#lobbyId').html(lobbyId);
    $('#players').html(playersMessage);
}

function closeLobby() {
    displayLoader('Closing lobby');
    socket.send(actions.LOBBY_CLOSED);
}

function handleWebsocket() {

    socket = new WebSocket(settings.websocket.url);

    socket.onopen = function () {
        socket.send(actions.IDENTIFY_AS_LOBBY);
    };

    socket.onmessage = function (event) {

        var messageParts = event.data.split(' ');
        var action = messageParts[0];
        var id = messageParts[1];
        var username = messageParts[2];

        if (action === actions.LEFT) {
            if (game.started) {
                game.decreaseSpeed(id);
            }
        }
        else if (action === actions.RIGHT) {
            if (game.started) {
                game.increaseSpeed(id);
            }
        }
        else if (action === actions.JUMP) {
            if (game.started) {
                game.jump(id);
            }
        }
        else if (action === actions.IDENTIFY_AS_LOBBY_ACCEPT) {
            displaySetup();
            lobbyId = id;

            if (process.env.NODE_ENV === 'development') {
                createFakeGame();
                displayGame();
            }
        }
        else if (action === actions.LOBBY_OPEN_ACCEPT) {
            displayLobby();
            updateLobby();
        }
        else if (action === actions.JOIN_LOBBY) {
            try {
                game.addPlayer(id, username.toLowerCase());
                updateLobby();
                socket.send(actions.JOIN_LOBBY_ACCEPT + ' ' + id);
                if (game.currentNumberOfPlayers() === game.numberOfPlayers) {
                    socket.send(actions.GAME_STARTED);
                    game.start();
                    displayGame();
                }
            }

            catch (e) {
                if (e instanceof errors.GameAlreadyStartedError) {
                    socket.send(actions.JOIN_LOBBY_REJECT_GAME_ALREADY_STARTED + ' ' + id);
                }
                else if (e instanceof errors.MaxNumberOfPlayersReachedError) {
                    socket.send(actions.JOIN_LOBBY_REJECT_LOBBY_FULL + ' ' + id);
                }
                else if (e instanceof errors.UsernameTakenError) {
                    socket.send(actions.JOIN_LOBBY_REJECT_USERNAME_TAKEN + ' ' + id);
                }
                else {
                    throw e;
                }
            }

        }
        else if (action === actions.LOBBY_CLOSED_ACCEPT) {
            displaySetup();
        }
        else if (action === actions.PLAYER_DISCONNECT || action === actions.LEAVE_LOBBY) {
            //todo: fix so that the player can't be removed if the game already started
            game.removePlayer(id);
            updateLobby();
        }
    };
}
