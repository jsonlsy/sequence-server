import Board from './board';

const RED_COLOR = 'red';
const BLUE_COLOR = 'blue';

class Game {
  constructor() {
    this.playing = false;
    this.players = {};
    this.turns = [];
    this.currentTurn = 0;
    this.board = new Board();
  }

  start() {
    this.playing = true;
  }

  addPlayer(playerId) {
    if (this.playing) return;
    let color;

    if (Object.keys(this.players).length % 2 === 0) {
      color = RED_COLOR;
    } else {
      color = BLUE_COLOR;
    }
    this.players[playerId] = color;
  }

  removePlayer(playerId) {
    delete this.players[playerId];

    // TODO: stop game and wait for another player to join
  }

  play(card, tileX, tileY, playerId) {
    // TODO: check if player has card?

    // TODO: check for special card

    const color = this.players[playerId];
    this.board.assign(tileX, tileY, color);
  }

  state() {
    return {
      players: this.players,
      board: this.board.boardArray,
    };
  }
}

export default Game;
