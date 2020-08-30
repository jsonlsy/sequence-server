import Board from './board/Board';
import Deck from './deck/Deck';

const RED_COLOR = 'red';
const BLUE_COLOR = 'blue';

class Game {
  constructor() {
    this.started = false;
    this.paused = false;
    this.players = {}; // { socketId: { color: } }
    this.playerCardsMap = {}; // { socketId: [] }
    this.removedPlayers = []; // [ { card:, turn: }]
    this.turns = [];
    this.currentTurn = 0;
    this.board = new Board();
    this.deck = new Deck();
  }

  start() {
    // TODO: check that we have an even number of players

    if (this.started) return;

    this.started = true;
    this.deck.shuffleAll();
    Object.keys(this.players).forEach((playerId) => {
      // TODO: calculate number of cards based on number of players
      this.playerCardsMap[playerId] = this.deck.draw(5);
      this.turns.push(playerId);
    });
  }

  addPlayer(playerId) {
    // TODO: maximum number of players

    if (this.started && !this.removedPlayers.length) return;
    let color;

    if (Object.keys(this.players).length % 2 === 0) {
      color = RED_COLOR;
    } else {
      color = BLUE_COLOR;
    }
    this.players[playerId] = { color };

    if (this.paused) {
      const removedPlayer = this.removedPlayers.shift();
      this.playerCardsMap[playerId] = removedPlayer.cards;
      this.turns[removedPlayer.turn] = playerId;
      if (!this.removedPlayers.length) this.paused = false;
    }
  }

  removePlayer(playerId) {
    if (!this.players[playerId]) return;

    delete this.players[playerId];

    if (this.started) {
      this.paused = true;
      this.removedPlayers.push({
        cards: this.playerCardsMap[playerId],
        turn: this.turns.indexOf(playerId),
      });
      delete this.playerCardsMap[playerId];
      delete this.turns[playerId];
    }
  }

  play(cardCode, rowIndex, colIndex, playerId) {
    // TODO: check if player has card?

    // TODO: check for special card

    // TODO: check if it is player's turn

    // TODO: check if card is mapped to row and col indexes

    const { color } = this.players[playerId];
    this.board.assign(rowIndex, colIndex, color);
    let cardPlayed;
    this.playerCardsMap[playerId].forEach((playerCard, i) => {
      if (!cardPlayed && playerCard.getCode() === cardCode) {
        cardPlayed = playerCard;
        const [newCard] = this.deck.draw(1);
        this.playerCardsMap[playerId][i] = newCard;
      }
    });
    this.deck.discard(cardPlayed);
    this.currentTurn = (this.currentTurn + 1) % Object.keys(this.players).length;
  }

  state() {
    return {
      players: this.players,
      board: this.board.state,
      winner: this.board.winner,
      status: {
        started: this.started,
        paused: this.paused,
      },
      turn: this.turns[this.currentTurn],
    };
  }

  playerCards(playerId) {
    return this.playerCardsMap[playerId];
  }
}

export default Game;
