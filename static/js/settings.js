module.exports = {
    static: {
        url: STATIC_URL
    },
    websocket: {
        url: WEBSOCKET_URL
    },
    downUrl: DOWN_URL,
    playerUrl: PLAYER_URL,
    game: {
        minTrackLength: 100,
        maxTrackLength: 200,
        tilesInY: 8
    },
    player:{
        tiltCheckInterval:250 //number of milliseconds to wait between speed updates
    }
};