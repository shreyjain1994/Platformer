var actions = require('../../../lib/ws/actions');
var utils = require('../utils');
var Game = require('./game');
var errors = require('./gameErrors');
var settings = require('../settings');
var $ = require('jquery');

//get loading of assets started as soon as possible
var assets = require('./assets'); //todo:perhaps don't load assets until game starts since otherwise it is pointless burden on client
assets.load(utils.noop);

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

var gameDivId = 'screen';

$(document).ready(docReady);

function docReady() {
    setGameScreenDimensions();
    displayLoader('Connecting to server');
    handleWebsocket();
    if (process.env.NODE_ENV === 'development') {
        $("body").keydown(handleKeys);
    }
    $("#createLobby").submit(createLobby);
    $('.closeLobby').click(closeLobby)
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
            divId: gameDivId,
            onComplete: onGameComplete
        });
        game.addPlayer('foobar', 'shrey');
        game.addPlayer('foo', 'shrey1');
        //game.addPlayer('foos', 'shrey2');
        game.start();
    }
}

/**
 * Function to run once the game is completed.
 */
function onGameComplete(){
    closeLobby();
}

function createLobby(event) {
    event.preventDefault();
    var data = utils.serializeObject($(this));
    var numberOfPlayers = parseInt(data.numberOfPlayers);
    game = new Game({
        numberOfPlayers: numberOfPlayers,
        divId: gameDivId,
        onComplete: onGameComplete
    });
    socket.send(actions.LOBBY_OPEN);
    displayLoader('Opening lobby');
}

function displayLoader(message) {
    $('#nonGame').show();
    $("#loader").show();
    $("#loaderMessage").html(message.toUpperCase());
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
    $('#createLobby')[0].reset();
    $('#createLobby select')[0].focus();
}

function displayLobby() {
    $('#nonGame').show();
    $('#lobby').show();
    $('#setup').hide();
    $('#loader').hide();
    $('#game').hide();
}

function setGameScreenDimensions(){
    var game = $('#game');
    var screen = $('#screen');
    var closeLobbyBtn = $('#game .closeLobby');

    screen.height(game.height() - closeLobbyBtn.outerHeight(true));
    screen.width(game.width());
}

function displayGame() {
    $('#nonGame').hide();
    $('#game').show();
    setGameScreenDimensions();
}

function updateLobby() {

    if (!game){
        return
    }

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
    var close = confirm('Are you sure you want to close the lobby?');
    if (close) {
        displayLoader('Closing lobby');
        socket.send(actions.LOBBY_CLOSED);
    }
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
                //displayGame();
                //createFakeGame();
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
                    displayGame();
                    game.start();
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
            if (game.started){
                game.disconnectPlayer(id)
            }
            else{
                game.removePlayer(id);
                updateLobby();
            }
        }
    };
}
