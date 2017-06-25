"use strict";

var status = {
    NOT_IN_LOBBY:'NOT_IN_LOBBY',
    REQUESTED_LOBBY:'REQUESTED_LOBBY',
    IN_LOBBY:'IN_LOBBY'
};

/**
 * Create a player webSocket.
 * @param {WebSocket} ws - The underlying webSocket object.
 * @param {string} id - The id of the player.
 * @constructor
 */
function PlayerWebSocket(ws, id) {

    /**
     * The underlying webSocket object.
     * @type {WebSocket}
     * @private
     */
    this._ws = ws;

    /**
     * The id of the player.
     * @type {string}
     */
    this.id = id;

    /**
     * The id of the lobby the player is in or has requested to join.
     * @type {string}
     */
    this.lobbyId = null;

    /**
     * The status of the player.
     * @type {string}
     */
    this.status = status.NOT_IN_LOBBY;
}

/**
 * Send a message to the player.
 * @param {...string} messageParts - A variable amount of strings which will be joined by a single space to create the message.
 */
PlayerWebSocket.prototype.send = function (messageParts) {
    var args = Array.prototype.slice.call(arguments);
    this._ws.send(args.join(' '));
};

/**
 * Player has requested to join a lobby.
 * @param {string} id - The id of the lobby that the player has requested to join.
 */
PlayerWebSocket.prototype.requestLobby = function (id) {
    this.lobbyId = id;
    this.status = status.REQUESTED_LOBBY;
};

/**
 * Player has joined a lobby.
 * @param {string} id - The id of the lobby that the player has joined.
 */
PlayerWebSocket.prototype.joinLobby = function (id) {
    this.lobbyId = id;
    this.status = status.IN_LOBBY;
};

/**
 * Player is no longer in a lobby.
 */
PlayerWebSocket.prototype.leaveLobby = function () {
    this.lobbyId = null;
    this.status = status.NOT_IN_LOBBY;
};

module.exports = PlayerWebSocket;
module.exports.status = status;
