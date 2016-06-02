var socket;
var numberOfPlayers;
var connected_number;
var usernames = [];
var player_id = [];
var sendData;
var data;
var stringData;
var started;
var wss_port = 10101; //port that the ws is listening on
var app_port = 10100; //port that the app is listening on

$(document).ready(doc_ready);

/**
 * Attaches the event handlers once the document is ready.
 */
function doc_ready() {

    handle_sockets();
    $("#single").click(handle_single);
    $("#multi").click(handle_multi);
    $("#back").click(handle_back);
    $("#create").click(handle_create);

}

/**
 * Handles the interaction with the server.
 */
function handle_sockets() {

    socket = new WebSocket("ws://cslinux.utm.utoronto.ca:" + wss_port, "room");

    /**
     * Reacts to a message received from the server.
     * @param event The received message.
     */
    socket.onmessage = function (event) {

        //game has begun - only responds to jump,left,right messages
        if (started) {
            stringData = event.data.split("\n");

            if (stringData[0] == "jump")
                game.players[parseInt(stringData[1])].jump();
            else if (stringData[0] == "right")
                game.players[parseInt(stringData[1])].increaseSpeed();
            else if (stringData[0] == "left")
                game.players[parseInt(stringData[1])].decreaseSpeed();

            //tells any other connecting players that the room is full
            else{
                data = JSON.parse(event.data);
                sendData["type"] = "player_connect_reject";
                sendData["reason"] = "room_full";
                sendData["player_id"] = data["player_id"];
                socket.send(JSON.stringify(sendData));
            }

        }

        //game hasn't begun yet - responds to setup messages
        else {
            sendData = {};
            data = JSON.parse(event.data);

            //display has connected and has been given a room number - no response
            if (data["type"] == "room_connect") {
                $("#room_number").html("Connect at:" +
                    " http://cslinux.utm.utoronto.ca:10100/control<br><br>Connect to" +
                    " the" +
                    " following game room: " + data["room_id"]);
                $("#connection").html("Awaiting connection from " + (numberOfPlayers - connected_number) + " player(s).")
            }

            //player is attempting to join this game room - gives response
            else if (data["type"] == "player_connect") {

                //max players connected - rejects player
                if (connected_number == numberOfPlayers) {
                    sendData["type"] = "player_connect_reject";
                    sendData["reason"] = "room_full";
                    sendData["player_id"] = data["player_id"];
                    socket.send(JSON.stringify(sendData));
                }

                //username taken - rejects player
                else if ($.inArray(data["username"].toLowerCase(), usernames) > -1) {
                    sendData["type"] = "player_connect_reject";
                    sendData["reason"] = "username_taken";
                    sendData["player_id"] = data["player_id"];
                    socket.send(JSON.stringify(sendData));
                }

                //accepts player
                else {
                    sendData["type"] = "player_connect_accept";
                    sendData["player_id"] = data["player_id"];
                    sendData["player_number"] = usernames.length;
                    socket.send(JSON.stringify(sendData));

                    usernames.push(data["username"].toLowerCase());
                    player_id.push(data["player_id"]);

                    connected_number++;
                    handle_player_connect_disconnect();

                    //game is ready to begin
                    if (connected_number == numberOfPlayers) {
                        started = true;
                        $("#wrapper").hide();
                        $("body").css('background-image', 'none');
                        gameReady();
                    }
                }
            }

            //player has disconnected from the room
            else if (data["type"] == "player_disconnect") {
                var index = player_id.indexOf(data["player_id"]);
                player_id.splice(index, 1);
                usernames.splice(index, 1);
                connected_number--;
                handle_player_connect_disconnect();
                sendData["type"] = "update_player_number";
                sendData["player_ids"] = player_id;
                socket.send(JSON.stringify(sendData));
            }
        }

        if (event.data == "down"){
            window.location.href = "http://cslinux.utm.utoronto.ca:" + app_port + "/down";
        }
    }
}

/**
 * Sends a room_connect request to the server for a single player game.
 */
function handle_single() {
    $("#single").slideUp();
    $("#multi").slideUp();
    $("hr").slideDown();
    var sendData = {};
    sendData["type"] = "room_connect";
    socket.send(JSON.stringify(sendData));
    numberOfPlayers = 1;
    connected_number = 0;
}

/**
 * Displays the mutli-player game options.
 */
function handle_multi() {
    $("#single").hide();
    $("#multi").hide();
    $("#multi_menu").show();
}

/**
 * Brings the user back to the menu where they can select whether they want
 * a multi or a single player game.
 */
function handle_back() {
    $("#multi_menu").hide();
    $("#single").show();
    $("#multi").show();
}

/**
 * Sends a room_connect request to the server for a multi player game.
 */
function handle_create() {
    $("#multi_menu").slideUp();
    $("hr").slideDown();
    var sendData = {};
    sendData["type"] = "room_connect";
    socket.send(JSON.stringify(sendData));
    numberOfPlayers = $("#player_number").val();
    connected_number = 0;
}

/**
 * Updates the room setup screen whenever a player joins or leaves the room.
 */
function handle_player_connect_disconnect() {
    $("#connection").html("Awaiting connection from " + (numberOfPlayers - connected_number) + " player(s).");

    //updates the connected player list
    var connected_info = "<br>User(s) Connected:";
    for (var i in usernames) {
        connected_info += "<br>";
        connected_info += usernames[i];
    }
    $("#connected").html(connected_info);
}