/**
 * @author: Shrey Jain
 */

var socket;
var speed_check = 250; //how often to update speed (in ms)
var right; //is phone tilted towards right
var left; //is phone tilted towards left
var wss_port = 10101; //port that the websocket is listening on
var app_port = 10100; //port that the app is listening on

$(document).ready(doc_ready);

/**
 * Attaches the event handlers.
 */
function doc_ready() {

    handle_sockets();
    handle_speed();
    $("#join_btn").click(handle_join);
    $("#jump_btn").click(handle_jump);

}

/**
 * Handles the interaction with the server.
 */
function handle_sockets() {

    socket = new WebSocket("ws://cslinux.utm.utoronto.ca:" + wss_port, "control");

    /**
     * Responds the messages from the server.
     * @param event The message the server sent.
     */
    socket.onmessage = function (event) {

        var data = JSON.parse(event.data);

        //the player has been accepted into the room
        if (data["type"] == "player_connect_accept") {
            alert("You've sucessfully joined room " + data["room_id"]);
            room_id = data["room_id"];
            player_id = data["player_id"];
            $("#control_setup").hide();
            $("#jump").show();
        }

        //the player was rejected from the room
        else if (data["type"] == "player_connect_reject") {
            console.log(data["reason"]);

            if (data["reason"] == "room_full") {
                $("#reason").html("Room " + data["room_id"] + " is full. You" +
                    " can go open your own room" +
                    " to play at http://cslinux.utm.utoronto.ca:" + app_port);
            }
            else if (data["reason"] == "username_taken") {
                $("#reason").html("Someone in Room " + data["room_id"] + " has already chosen that display name. Please choose another one.");
            }
            else if (data["reason"] == "no_such_room") {
                $("#reason").html("Room " + data["room_id"] + " doesn't" +
                    " exist. You can go open a room at" +
                    " http://cslinux.utm.utoronto.ca:" + app_port);
            }
        }

        //the room was disconnected
        else if (data["type"] == "room_disconnect") {
            alert("The room that you were in has been disconnected. Go to" +
                " http://cslinux.utm.utoronto.ca:" + app_port + " to start a new room.");

            window.location.href = "http://cslinux.utm.utoronto.ca:" + app_port + "/control";

        }

        if (event.data == "down"){
            window.location.href = "http://cslinux.utm.utoronto.ca:" + app_port + "/down";
        }

    }
}

/**
 * User wants to join a certain lobby. The request is sent to the server.
 */
function handle_join() {
    var sendData = {};
    sendData["type"] = "player_connect";
    sendData["username"] = $("#display_name").val();
    sendData["room_id"] = $("#room_number").val();
    socket.send(JSON.stringify(sendData));
}

/**
 * Sends a jump request to the game.
 */
function handle_jump() {
    socket.send("jump");
}

/**
 * Updates the speed on the game if the phone is tilted.
 */
function handle_speed() {

    if (right)
        socket.send("right");
    else if (left)
        socket.send("left");

    setTimeout(handle_speed, speed_check);
}

/**
 * Updates the position of the controller (whether it is tilted to the left or right or not at all)
 */
window.addEventListener('deviceorientation', function (event) {
    if (event.gamma >= 20) {
        right = true;
        left = false;
    }
    else if (event.gamma <= -20) {
        right = false;
        left = true;
    }
    else {
        left = false;
        right = false;
    }
});
