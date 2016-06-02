var express = require('express');
var app = express();
var path = require("path");
var WebSocketServer = require('ws').Server;
var wss_port = 10101;
var app_port = 10100;
var wss = new WebSocketServer({port: wss_port});
app.use(express.static("/student/jainshre/www/public"));
var connections = {};
var connectionIDCounter = 10000;
var sendData;
var data;

/**
 * Handles get requests to base url.
 */
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/room.html'));
});

/**
 * Handles get requests to the control.
 */
app.get('/control', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/control.html'));
});

app.get('/down', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/down.html'));
});

/**
 * Sets the port that the app is listening on.
 */
app.listen(app_port, function () {
});

/**
 * Takes action when server goes down.
 */
wss.on('close', function () {
    for (var id in connections) {
        connections[id].send("down");
    }
});

/**
 * Handles the interaction with the clients.
 */
wss.on('connection', function (ws) {

    //gives each connection an id and stores it
    ws.id = connectionIDCounter++;
    ws.started = false;
    connections[ws.id] = ws;

    /**
     * Responds to messages from the clients.
     */
    ws.on('message', function (message) {

        //responds to the jump, left and right commands
        if (message == "jump" || message == "left" || message == "right") {
            if (ws.started == true) {
                if (ws.room_id && connections[ws.room_id])
                    connections[ws.room_id].send(message + "\n" + ws.player_number);
            }
            return;
        }

        sendData = {};
        data = JSON.parse(message);
        console.log(data["type"]);

        //handles the controller
        if (ws.protocol == "control") {

            //control wants to connect to room
            if (data["type"] == "player_connect") {

                //room doesn't exist - sends control error message
                if (!connections[data["room_id"]] || connections[data["room_id"]].protocol != "room") {
                    sendData["type"] = "player_connect_reject";
                    sendData["reason"] = "no_such_room";
                    sendData["room_id"] = data["room_id"];
                    ws.send(JSON.stringify(sendData))
                }

                //room exists - allows room to decide whether to accept player
                else {
                    sendData["type"] = "player_connect";
                    sendData["username"] = data["username"];
                    sendData["player_id"] = ws.id;
                    connections[data["room_id"]].send(JSON.stringify(sendData))
                }

            }

        }

        //handles the room
        else if (ws.protocol == "room") {

            //room has decided the number of players and is given the
            // game room number
            if (data["type"] == "room_connect") {
                sendData["type"] = "room_connect";
                sendData["room_id"] = ws.id;
                ws.send(JSON.stringify(sendData));
            }

            //room has rejected the player joining
            else if (data["type"] == "player_connect_reject") {
                sendData["type"] = "player_connect_reject";
                sendData["reason"] = data["reason"];
                sendData["room_id"] = ws.id;
                if (connections[data["player_id"]])
                    connections[data["player_id"]].send(JSON.stringify(sendData));
            }

            //room has accepted the player joining
            else if (data["type"] == "player_connect_accept") {
                sendData["type"] = "player_connect_accept";
                sendData["room_id"] = ws.id;
                if (connections[data["player_id"]]) {
                    connections[data["player_id"]].room_id = ws.id;
                    connections[data["player_id"]].player_number = data["player_number"];
                    connections[data["player_id"]].send(JSON.stringify(sendData));
                }
            }

            //the room has the necessary players to start the game.
            else if (data["type"] == "start_game") {

                //tells each controller to prepare to start the game.
                for (var i = 0; i < data["player_ids"].length; i++) {
                    if (connections[data["player_ids"][i]])
                        connections[data["player_ids"][i]].started = true;
                }
            }

            //updates the player numbers for the players in the room -
            // used when a player leaves the room
            else if (data["type"] == "update_player_number") {
                for (var j = 0; j < data["player_ids"].length; j++) {
                    if (connections[data["player_ids"][j]]) {
                        connections[data["player_ids"][j]].player_number = parseInt(data["player_ids"].indexOf(data["player_ids"][j]));
                    }
                }
            }
        }
    });

    //removes the connection info from the pool
    ws.on('close', function () {

        sendData = {};

        //controller disconnecting - notifies appropriate room
        if (ws.protocol == "control") {
            if (ws.room_id) {
                sendData["type"] = "player_disconnect";
                sendData["player_id"] = ws.id;
                if (connections[ws.room_id]) {
                    connections[ws.room_id].send(JSON.stringify(sendData));
                }
            }
        }

        //room disconnecting - notifies all players in room
        if (ws.protocol == "room") {
            for (var id in connections) {
                if (connections[id].protocol == "control" && connections[id].room_id && connections[id].room_id == ws.id) {
                    sendData = {};
                    sendData["type"] = "room_disconnect";
                    connections[id].send(JSON.stringify(sendData));
                }
            }
        }
        delete connections[ws.id];
    });
});