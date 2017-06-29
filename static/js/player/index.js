var actions = require('../../../lib/ws/actions');
var utils = require('../utils');
var settings = require('../settings');
var $ = require('jquery');

var socket;
var gameStarted = false;
var isTiltedRight = false;
var isTitledLeft = false;
var tiltCheckInterval = settings.player.tiltCheckInterval;

$(document).ready(docReady);

function docReady() {
    displayLoader('connecting to server');
    handleWebsocket();
    $("#joinLobby").submit(joinLobby);
    window.addEventListener('deviceorientation', handleOrientation);
    changeSpeed();
    $("#jump").click(jump);
    $('#leaveLobby').click(leaveLobby)
}

function leaveLobby() {
    var leave = confirm('Are you sure you want to leave the lobby?');
    if (leave) {
        displayLoader('Leaving lobby');
        socket.send(actions.LEAVE_LOBBY);
    }
    gameStarted = false;
}

function joinLobby(event) {
    event.preventDefault();
    displayLoader('Joining lobby');
    var data = utils.serializeObject($(this));
    gameStarted = false;
    socket.send(actions.JOIN_LOBBY + ' ' + data.lobbyId + ' ' + data.username);
}

function displayLoader(message) {
    $('#nonControls').show();
    $("#loader").show();
    $("#loaderMessage").html(message.toUpperCase());
    $('#setup').hide();
    $('#controls').hide();
}

function displaySetup() {
    $('#nonControls').show();
    $("#loader").hide();
    $('#setup').show();
    $('#controls').hide();
    setJoinLobbyResponse('');
    $("#joinLobby")[0].reset();
    $("#joinLobby input")[0].focus();
}

function displayControls() {
    var controls = $('#controls');
    var jump = $('#jump');
    var leaveLobby = $('#leaveLobby');

    $('#nonControls').hide();
    controls.show();

    jump.height(controls.height()-leaveLobby.outerHeight(true)-10);
}

function setJoinLobbyResponse(message) {
    $('#joinLobbyResponse').html(message);
}

function handleWebsocket() {

    socket = new WebSocket(settings.websocket.url);

    socket.onopen = function () {
        socket.send(actions.IDENTIFY_AS_PLAYER);
    };

    socket.onmessage = function (event) {

        var messageParts = event.data.split(' ');
        var action = messageParts[0];

        if (action === actions.IDENTIFY_AS_PLAYER_ACCEPT) {
            displaySetup();
        }
        else if (action === actions.JOIN_LOBBY_ACCEPT) {
            displayControls();
        }
        else if (action === actions.JOIN_LOBBY_REJECT_NO_SUCH_LOBBY ||
            action == actions.JOIN_LOBBY_REJECT_GAME_ALREADY_STARTED ||
            action === actions.JOIN_LOBBY_REJECT_LOBBY_FULL ||
            action === actions.JOIN_LOBBY_REJECT_USERNAME_TAKEN) {

            var messages = {};

            messages[actions.JOIN_LOBBY_REJECT_NO_SUCH_LOBBY] = 'Invalid lobby. Check to make sure the lobby ID is correct.';
            messages[actions.JOIN_LOBBY_REJECT_LOBBY_FULL] = 'LobbyWebSocket is full. Try and join another lobby.';
            messages[actions.JOIN_LOBBY_REJECT_GAME_ALREADY_STARTED] = 'LobbyWebSocket has already started the game. Try and join another lobby.';
            messages[actions.JOIN_LOBBY_REJECT_USERNAME_TAKEN] = 'Username taken. Someone in the lobby already has the requested username. Change your username and try again.';

            displaySetup();
            setJoinLobbyResponse(messages[action]);
        }
        else if (action === actions.GAME_STARTED) {
            gameStarted = true;
        }
        else if (action === actions.LEAVE_LOBBY_ACCEPT) {
            gameStarted = false;
            displaySetup();
        }
        else if (action === actions.LOBBY_CLOSED || actions.LOBBY_DISCONNECT) {
            gameStarted = false;
            displaySetup();
            alert('The lobby you were in was closed/disconnected.');
        }
    };

    socket.onclose = function () {
        window.location.href = settings.downUrl;
    };
}

function handleOrientation(event) {
    isTiltedRight = false;
    isTitledLeft = false;
    if (event.gamma >= 20) {
        isTiltedRight = true;
    }
    else if (event.gamma <= -20) {
        isTitledLeft = true;
    }
}

function jump() {
    if (gameStarted) {
        socket.send(actions.JUMP);
    }
}

function changeSpeed() {
    if (gameStarted) {
        if (isTiltedRight) {
            socket.send(actions.RIGHT);
        }
        else if (isTitledLeft) {
            socket.send(actions.LEFT);
        }
    }
    setTimeout(changeSpeed, tiltCheckInterval);
}
