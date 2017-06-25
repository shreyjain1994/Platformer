var WebSocketServer = require('ws').Server;
var settings = require('../../settings/index');
var log = require('../../config/logging');
var shortid = require('shortid');
var actions = require('./actions');
var Player = require('./player');
var Lobby = require('./lobby');

var options = {
    port: settings.websocket.port
};

//in production mode, server should only be accessible through nginx
if (process.env.NODE_ENV === 'production') {
    options.host = 'localhost'
}

var server = new WebSocketServer(options, function () {
    log.info('Websocket server listening at %s.', settings.websocket.url);
});

/**
 * @type {object.<string, WebSocket>}
 */
var connections = {};

/**
 * @type {object.<string, PlayerWebSocket>}
 */
var players = {};

/**
 * @type {object.<string, LobbyWebSocket>}
 */
var lobbies = {};

server.on('connection', function (ws) {

    ws.id = shortid.generate();
    ws.isPlayer = false;
    ws.isLobby = false;

    connections[ws.id] = ws;
    log.debug('WS connection from %s', ws.id);

    ws.on('message', function (message) {

        var messageParts = message.split(' ');
        var action = messageParts[0];

        //if provided, this represents the id of the websocket the sender of the message
        //wants to interact with
        var id = messageParts[1];

        var username = messageParts[2];
        var player;
        var lobby;

        if (ws.isPlayer) {

            player = players[ws.id];

            if (action === actions.JOIN_LOBBY) {

                log.debug('WS player %s wants to join lobby %s as username %s', player.id, id, username);
                lobby = lobbies[id];
                if (player.status === Player.status.NOT_IN_LOBBY) {
                    if (lobby && lobby.status === Lobby.status.OPEN) {
                        player.requestLobby(lobby.id);
                        lobby.send(actions.JOIN_LOBBY, player.id, username);
                    }
                    else if (lobby && lobby.status === Lobby.status.STARTED) {
                        player.send(actions.JOIN_LOBBY_REJECT_GAME_ALREADY_STARTED)
                    }
                    else {
                        player.send(actions.JOIN_LOBBY_REJECT_NO_SUCH_LOBBY)
                    }
                }
            }

            else if (action === actions.LEAVE_LOBBY) {

                lobby = lobbies[player.lobbyId];
                if (player.status === Player.status.IN_LOBBY && lobby) {
                    log.debug('WS player %s leaving lobby %s', player.id, lobby.id);
                    lobby.send(actions.LEAVE_LOBBY, player.id);
                    lobby.removePlayer(player.id);
                }

                //this is outside the if statement so players who have requested
                //to join a lobby, and have not received a response in a while, can
                //request a leave lobby, in order to be able to request a join lobby again.
                //If this was inside the if statement, players who are waiting for a join
                //lobby request response, would be stuck waiting for however long a response
                //takes without any recourse
                player.leaveLobby();
                player.send(actions.LEAVE_LOBBY_ACCEPT);
            }

            else if (action === actions.LEFT ||
                action === actions.RIGHT ||
                action === actions.JUMP) {
                lobby = lobbies[player.lobbyId];

                if (player.status === Player.status.IN_LOBBY &&
                    lobby &&
                    lobby.status === Lobby.status.STARTED) {
                    lobby.send(action, player.id);
                }
            }
        }
        else if (ws.isLobby) {

            lobby = lobbies[ws.id];

            if (action === actions.JOIN_LOBBY_ACCEPT) {
                player = players[id];

                //ensure lobby can only contact players that requested to join it
                if (player && player.status === Player.status.REQUESTED_LOBBY && player.lobbyId === lobby.id) {
                    log.debug('WS lobby %s accepted player %s', lobby.id, player.id);
                    player.joinLobby(lobby.id);
                    lobby.addPlayer(player);
                    player.send(actions.JOIN_LOBBY_ACCEPT);
                }
            }
            else if (action === actions.JOIN_LOBBY_REJECT_GAME_ALREADY_STARTED ||
                action === actions.JOIN_LOBBY_REJECT_LOBBY_FULL ||
                action === actions.JOIN_LOBBY_REJECT_USERNAME_TAKEN) {
                player = players[id];

                //ensure lobby can only contact players that requested to join it
                if (player && player.status === Player.status.REQUESTED_LOBBY && player.lobbyId === lobby.id) {
                    log.debug('WS lobby %s rejected player %s for reason %s', lobby.id, player.id, action);
                    player.leaveLobby();
                    player.send(action);
                }
            }
            else if (action === actions.GAME_STARTED) {
                log.debug('WS lobby %s started game', lobby.id);
                lobby.start();
            }

            else if (action === actions.LOBBY_CLOSED) {
                log.debug('WS lobby %s was closed', lobby.id);
                lobby.close();
            }

            else if (action === actions.LOBBY_OPEN) {
                log.debug('WS lobby %s was opened', lobby.id);
                lobby.open();
            }

        }
        else {
            if (action === actions.IDENTIFY_AS_PLAYER) {
                log.debug('WS connection %s identified as a player', ws.id);
                ws.isPlayer = true;
                player = new Player(ws, ws.id);
                players[ws.id] = player;
                player.send(actions.IDENTIFY_AS_PLAYER_ACCEPT, player.id);
            }
            else if (action === actions.IDENTIFY_AS_LOBBY) {
                log.debug('WS connection %s identified as a lobby', ws.id);
                ws.isLobby = true;
                lobby = new Lobby(ws, ws.id);
                lobbies[ws.id] = lobby;
                lobby.send(actions.IDENTIFY_AS_LOBBY_ACCEPT, lobby.id);
            }
            else {
                badWebsocket(ws);
            }
        }
    });

    ws.on('close', function () {

        log.debug('WS disconnection from %s', ws.id);

        var player;
        var lobby;

        if (ws.isPlayer) {
            player = players[ws.id];
            lobby = lobbies[player.lobbyId];

            //inform lobby of player disconnect if player is in lobby
            if (lobby && player.status === Player.IN_LOBBY) {
                lobby.send(actions.PLAYER_DISCONNECT, player.id);
                lobby.removePlayer(player.id);
            }

            delete players[player.id];
        }
        else if (ws.isLobby) {
            lobby = lobbies[ws.id];
            lobby.disconnect();
            delete lobbies[lobby.id];
        }

        delete connections[ws.id];
    });
});

/**
 * Function to run when a websocket connection is not displaying expected behaviour and is most
 * likely just a security risk to the server.
 * @param {WebSocket} ws
 */
function badWebsocket(ws) {
    //todo:complete
}