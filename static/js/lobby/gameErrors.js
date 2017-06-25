function GameError(message) {
    this.message = message;
}
GameError.prototype = new Error();

function MaxNumberOfPlayersReachedError(message) {
    this.message = message;
}
MaxNumberOfPlayersReachedError.prototype = new GameError();

function UsernameTakenError(message) {
    this.message = message;
}
UsernameTakenError.prototype = new GameError();

function PlayerAlreadyAddedError(message) {
    this.message = message;
}
PlayerAlreadyAddedError.prototype = new GameError();

function GameAlreadyStartedError(message) {
    this.message = message;
}
GameAlreadyStartedError.prototype = new GameError();

module.exports = {
    GameError: GameError,
    MaxNumberOfPlayersReachedError: MaxNumberOfPlayersReachedError,
    UsernameTakenError: UsernameTakenError,
    PlayerAlreadyAddedError: PlayerAlreadyAddedError,
    GameAlreadyStartedError: GameAlreadyStartedError
};