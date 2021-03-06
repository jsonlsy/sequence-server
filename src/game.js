import Board from './board/Board';
import Deck from './deck/Deck';

const RED_COLOR = 'red';
const BLUE_COLOR = 'blue';
const MAX_PLAYERS = 12;
const NUM_CARDS_TO_DEAL = {
  2: 7,
  4: 6,
  6: 5,
  8: 4,
  10: 3,
  12: 3,
};

class Game {
  constructor() {
    this.players = {}; // { socketId: { color:, name:, lastMove: { card:, row:, col: } } }
    this.admin = undefined;
    this.score = {};
    this.score[RED_COLOR] = 0;
    this.score[BLUE_COLOR] = 0;
    this.init();
  }

  init() {
    this.started = false;
    this.paused = false;
    this.playerCardsMap = {}; // { socketId: [] }
    this.removedPlayers = []; // [ { cards:, turn:, color:, lastMove: } ]
    this.turns = [];
    this.currentTurn = 0;
    this.board = new Board();
    this.deck = new Deck();
    this.winner = undefined;
    this.numSequence = {};
    this.numSequence[RED_COLOR] = 0;
    this.numSequence[BLUE_COLOR] = 0;
    Object.keys(this.players).forEach((playerId) => {
      delete this.players[playerId].lastMove;
    });
  }

  reset(currentPlayer) {
    if (this.admin !== currentPlayer) return;
    this.init();
  }

  start(currentPlayer) {
    if (this.admin !== currentPlayer) return;

    const nPlayers = Object.keys(this.players).length;
    if (nPlayers % 2 || nPlayers > MAX_PLAYERS) return;

    if (this.started) return;

    this.started = true;
    this.deck.shuffleAll();

    const playersByColor = {};
    playersByColor[RED_COLOR] = [];
    playersByColor[BLUE_COLOR] = [];

    Object.keys(this.players).forEach((playerId) => {
      const numCards = NUM_CARDS_TO_DEAL[nPlayers];
      this.playerCardsMap[playerId] = this.deck.draw(numCards);
      const { color } = this.players[playerId];
      playersByColor[color].push(playerId);
    });

    // re-assign players' color if needed
    // - the 2 teams should have the same number of players
    const teamsDiff = playersByColor[RED_COLOR].length > playersByColor[BLUE_COLOR].length;
    if (teamsDiff !== 0) {
      let fromTeam;
      let toTeam;
      if (teamsDiff > 0) {
        // more red than blue
        fromTeam = RED_COLOR;
        toTeam = BLUE_COLOR;
      } else {
        // more blue than red
        fromTeam = BLUE_COLOR;
        toTeam = RED_COLOR;
      }
      const playersToSwap = playersByColor[fromTeam].splice(-1, teamsDiff);
      playersByColor[toTeam] = playersByColor[toTeam].concat(playersToSwap);
      playersToSwap.forEach((playerToSwap) => {
        this.players[playerToSwap].color = toTeam;
      });
    }

    // determine turns
    // safe to assume each team has half the total number of players after re-assigning
    for (let i = 0; i < nPlayers / 2; i += 1) {
      this.turns.push(playersByColor[RED_COLOR][i]);
      this.turns.push(playersByColor[BLUE_COLOR][i]);
    }

    const nRoundsPlayed = this.score[RED_COLOR] + this.score[BLUE_COLOR];
    this.currentTurn = nRoundsPlayed % nPlayers;
  }

  addPlayer(playerId, name) {
    const allPlayersIds = Object.keys(this.players);
    if (allPlayersIds.length === MAX_PLAYERS
      || (this.started && !this.removedPlayers.length)) return;

    let color;
    let lastMove;

    if (this.paused) {
      const removedPlayer = this.removedPlayers.shift();
      color = removedPlayer.color;
      lastMove = removedPlayer.lastMove;
      this.playerCardsMap[playerId] = removedPlayer.cards;
      this.turns[removedPlayer.turn] = playerId;
      if (!this.removedPlayers.length) this.paused = false;
    }

    if (!color) {
      let nRed = 0;
      let nBlue = 0;
      allPlayersIds.forEach((pId) => {
        if (this.players[pId].color === RED_COLOR) {
          nRed += 1;
        } else {
          nBlue += 1;
        }
      });
      if (nRed <= nBlue) {
        color = RED_COLOR;
      } else {
        color = BLUE_COLOR;
      }
    }

    this.players[playerId] = { color, name, lastMove };
    if (!this.admin) this.admin = playerId;
  }

  removePlayer(playerId) {
    if (!this.players[playerId]) return;

    if (this.started) {
      this.paused = true;
      this.removedPlayers.push({
        cards: this.playerCardsMap[playerId],
        turn: this.turns.indexOf(playerId),
        color: this.players[playerId].color,
        lastMove: this.players[playerId].lastMove,
      });

      delete this.playerCardsMap[playerId];
      delete this.turns[playerId];
    }

    delete this.players[playerId];

    const playersIds = Object.keys(this.players);
    if (this.admin === playerId && playersIds.length) {
      [this.admin] = Object.keys(this.players);
    }
  }

  play(cardCode, rowIndex, colIndex, playerId) {
    // check if it is the player's turn
    if (playerId !== this.turns[this.currentTurn]) return false;

    if (this.paused || this.winner) return false;

    const cardIndex = this.playerCardsIndexOf(playerId, cardCode);
    const cardPlayed = this.playerCardsMap[playerId][cardIndex];
    const valid = this.isValidPlay(cardPlayed, rowIndex, colIndex);

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
        // check for any sequence created and update winner if necessary
        if (!cardPlayed.isRemove()) {
          this.numSequence[color] += this.board.numSequenceCreated(rowIndex, colIndex);
          if (this.numSequence[color] >= 2) {
            this.winner = color;
            this.score[color] += 1;
          }
        }

        // discard and draw new card
        this.discardAndDrawCard(playerId, cardIndex);

        // save move
        this.players[playerId].lastMove = {
          card: cardCode,
          row: rowIndex,
          col: colIndex,
        };

        // finish turn
        this.currentTurn = (this.currentTurn + 1) % Object.keys(this.players).length;
      }

      return boardChanged;
    }
    return false;
  }

  discard(playerId, cardCode) {
    const cardIndex = this.playerCardsIndexOf(playerId, cardCode);
    const cardToDiscard = this.playerCardsMap[playerId][cardIndex];

    if (!cardToDiscard.isRemove() && !cardToDiscard.isWildcard() && !this.board.isCardUsable(cardCode)) {
      this.discardAndDrawCard(playerId, cardIndex);
      return true;
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
      turns: this.turns,
      deck: this.deck.remainingLength,
    };
  }

  playerCards(playerId) {
    return this.playerCardsMap[playerId];
  }

  playerCardsIndexOf(playerId, cardCode) {
    let index;
    this.playerCardsMap[playerId].forEach((playerCard, i) => {
      if (!index && playerCard.getCode() === cardCode) {
        index = i;
      }
    });
    return index;
  }

  isValidPlay(card, rowIndex, colIndex) {
    return this.board.isCardIndexValid(card.getCode(), rowIndex, colIndex)
      || card.isWildcard() || card.isRemove();
  }

  discardAndDrawCard(playerId, cardIndex) {
    const card = this.playerCardsMap[playerId][cardIndex];
    this.playerCardsMap[playerId].splice(cardIndex, 1);
    if (this.deck.remainingLength) {
      const [newCard] = this.deck.draw(1);
      this.playerCardsMap[playerId].push(newCard);
    }
    this.deck.discard(card);
  }
}

export default Game;
