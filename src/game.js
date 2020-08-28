import Board from './board';
import Deck from './deck';

const RED_COLOR = 'red';
const BLUE_COLOR = 'blue';

class Game {
  constructor() {
    this.playing = false;
    this.players = {}; // { socketId: { color: } }
    this.playersCards = {}; // { socketId: [] }
    this.turns = [];
    this.currentTurn = 0;
    this.board = new Board();
    this.deck = new Deck();
  }

  start() {
    // TODO: check that we have an even number of players
    this.playing = true;
    this.deck.shuffleAll();
    Object.keys(this.players).forEach((playerId) => {
      // TODO: calculate number of cards based on number of players
      this.playersCards[playerId] = this.deck.draw(5);
    });
  }

  addPlayer(playerId) {
    // TODO: maximum number of players
    // if (this.playing) return;
    let color;

    if (Object.keys(this.players).length % 2 === 0) {
      color = RED_COLOR;
    } else {
      color = BLUE_COLOR;
    }
    this.players[playerId] = { color };
  }

  removePlayer(playerId) {
    delete this.players[playerId];

    // TODO: stop game and wait for another player to join
  }

  play(card, tileX, tileY, playerId) {
    // TODO: check if player has card?

    // TODO: check for special card

    // TODO: check if it is player's turn

    const { color } = this.players[playerId];
    this.board.assign(tileX, tileY, color);
  }

  state() {
    console.log(this.players);
    return {
      players: this.players,
      board: this.board.state,
    };
  }

  playerCards(playerId) {
    return this.playersCards[playerId];
  }
}

export default Game;
