"use strict";

var merge = require('lodash.merge');
var actions = require('./actions');

var status = {
    OPEN: 'OPEN', //accepting player connections
    CLOSED: 'CLOSED', //not accepting player connections
    STARTED: 'STARTED' //game has started, so no more player connections
};

/**
 * Create a lobby webSocket.
 * @param {WebSocket} ws - The underlying webSocket object.
 * @param {string} id - The id of the lobby.
 * @constructor
 */
function LobbyWebSocket(ws, id) {

    /**
     * The underlying webSocket object.
     * @type {WebSocket}
     * @private
     */
    this._ws = ws;

    /**
     * The id of the lobby.
     * @type {string}
     */
    this.id = id;

    /**
     * A map from player id to the player websocket object.
     * @type {Object.<string, PlayerWebSocket>}
     * @private
     */
    this._players = {};

    /**
     * Current status of the lobby.
     * @type {string}
     */
    this.status = status.CLOSED;
}

/**
 * Add a player to the lobby.
 * @param {PlayerWebSocket} player
 */
LobbyWebSocket.prototype.addPlayer = function (player) {
    this._players[player.id] = player;
};

/**
 * Remove a player from the lobby.
 * @param {string} id - The id of the player to remove.
 */
LobbyWebSocket.prototype.removePlayer = function (id) {
    delete this._players[id];
};

/**
 * Send a message to all players in the lobby.
 * @param {string} message
 */
LobbyWebSocket.prototype.broadcast = function (message) {
    for (var id in this._players) {
        if (this._players.hasOwnProperty(id)) {
            this._players[id].send(message);
        }
    }
};

/**
 * Send a message to the lobby.
 * @param {...string} messageParts - A variable amount of strings which will be joined by a single space to create the message.
 */
LobbyWebSocket.prototype.send = function (messageParts) {
    var args = Array.prototype.slice.call(arguments);
    this._ws.send(args.join(' '));
};

/**
 * Open the lobby to accept player connections.
 */
LobbyWebSocket.prototype.open = function () {
    this.status = status.OPEN;
    this.send(actions.LOBBY_OPEN_ACCEPT);
};

/**
 * Function to run once the lobby has started the game.
 */
LobbyWebSocket.prototype.start = function () {
    this.status = status.STARTED;
    this.broadcast(actions.GAME_STARTED);
};

/**
 * Close the lobby and inform all players currently in the lobby.
 */
LobbyWebSocket.prototype.close = function () {
    this.broadcast(actions.LOBBY_CLOSED);
    for (var id in this._players) {
        if (this._players.hasOwnProperty(id)) {
            this._players[id].leaveLobby();
        }
    }
    this.send(actions.LOBBY_CLOSED_ACCEPT);
    this._players = {};
    this.status = status.CLOSED;
};

/**
 * Function to run once the lobby is disconnected.
 */
LobbyWebSocket.prototype.disconnect = function () {
    this.broadcast(actions.LOBBY_DISCONNECT);
    for (var id in this._players) {
        if (this._players.hasOwnProperty(id)) {
            this._players[id].leaveLobby();
        }
    }
    this._players = {};
};

module.exports = LobbyWebSocket;
module.exports.status = status;