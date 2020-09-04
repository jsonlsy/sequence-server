import Board from './board/Board';
import Deck from './deck/Deck';

const RED_COLOR = 'red';
const BLUE_COLOR = 'blue';
const MAX_PLAYERS = 12;
const NUM_CARDS_TO_DEAL = {
  2: 7,
  4: 6,
  8: 4,
  10: 3,
  12: 3,
};

class Game {
  constructor() {
    this.players = {}; // { socketId: { color:, name: } }
    this.init();
  }

  init() {
    this.started = false;
    this.paused = false;
    this.playerCardsMap = {}; // { socketId: [] }
    this.removedPlayers = []; // [ { card:, turn:, color: }]
    this.turns = [];
    this.currentTurn = 0;
    this.board = new Board();
    this.deck = new Deck();
    this.winner = undefined;
    this.numSequence = {};
    this.numSequence[RED_COLOR] = 0;
    this.numSequence[BLUE_COLOR] = 0;
  }

  start() {
    const nPlayers = Object.keys(this.players).length;
    if (nPlayers % 2 || nPlayers > MAX_PLAYERS) return;

    if (this.started) return;

    this.started = true;
    this.deck.shuffleAll();
    Object.keys(this.players).forEach((playerId) => {
      const numCards = NUM_CARDS_TO_DEAL[nPlayers];
      this.playerCardsMap[playerId] = this.deck.draw(numCards);
      this.turns.push(playerId);
    });
  }

  addPlayer(playerId, name) {
    const nPlayers = Object.keys(this.players).length;
    if (nPlayers === MAX_PLAYERS
      || (this.started && !this.removedPlayers.length)) return;

    let color;
    if (nPlayers % 2 === 0) {
      color = RED_COLOR;
    } else {
      color = BLUE_COLOR;
    }

    if (this.paused) {
      const removedPlayer = this.removedPlayers.shift();
      color = removedPlayer.color;
      this.playerCardsMap[playerId] = removedPlayer.cards;
      this.turns[removedPlayer.turn] = playerId;
      if (!this.removedPlayers.length) this.paused = false;
    }

    this.players[playerId] = { color, name };
  }

  removePlayer(playerId) {
    if (!this.players[playerId]) return;

    if (this.started) {
      this.paused = true;
      this.removedPlayers.push({
        cards: this.playerCardsMap[playerId],
        turn: this.turns.indexOf(playerId),
        color: this.players[playerId].color,
      });

      delete this.playerCardsMap[playerId];
      delete this.turns[playerId];
    }

    delete this.players[playerId];
  }

  play(cardCode, rowIndex, colIndex, playerId) {
    // TODO: check if it is player's turn
    if (this.paused || this.winner) return false;

    let cardPlayed;
    let cardIndex;
    let valid;
    this.playerCardsMap[playerId].forEach((playerCard, i) => {
      if (!cardPlayed && playerCard.getCode() === cardCode) {
        cardPlayed = playerCard;
        cardIndex = i;
        valid = this.isValidPlay(cardPlayed, rowIndex, colIndex);
      }
    });
    if (valid) {
      // apply changes to board
      let boardChanged;
      const { color } = this.players[playerId];
      if (cardPlayed.isRemove()) {
        boardChanged = this.board.unassign(rowIndex, colIndex);
      } else {
        boardChanged = this.board.assign(rowIndex, colIndex, color);
      }

      if (boardChanged) {
        if (!cardPlayed.isRemove()) {
          // check for any sequence created and update winner if necessary
          this.numSequence[color] += this.board.checkSequence(rowIndex, colIndex);
          if (this.numSequence[color] >= 2) {
            this.winner = color;
          }
        }

        // discard and draw new card
        const [newCard] = this.deck.draw(1);
        this.playerCardsMap[playerId][cardIndex] = newCard;
        this.deck.discard(cardPlayed);

        // finish turn
        this.currentTurn = (this.currentTurn + 1) % Object.keys(this.players).length;
      }

      return boardChanged;
    }
    return false;
  }

  state() {
    return {
      players: this.players,
      board: this.board.state,
      winner: this.winner,
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

  isValidPlay(card, rowIndex, colIndex) {
    return this.board.checkCard(card.getCode(), rowIndex, colIndex)
      || card.isWildcard() || card.isRemove();
  }
}

export default Game;
