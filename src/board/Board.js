import boardMap from './boardMap';

class Board {
  constructor() {
    this.state = []; // [{ cardCode: , color: }]
    this.cardMap = {};
    boardMap.forEach((row, rowIndex) => {
      this.state[rowIndex] = [];
      row.forEach((cardCode, colIndex) => {
        this.cardMap[cardCode] = [rowIndex, colIndex];
        this.state[rowIndex][colIndex] = { cardCode };
      });
    });
    this.size = this.state.length;
  }

  assign(rowIndex, colIndex, color) {
    const tile = this.state[rowIndex][colIndex];
    if (tile.color) return false;
    tile.color = color;
    this.checkWinner(rowIndex, colIndex);
    return true;
  }

  checkWinner(rowIndex, colIndex) {
    const lastPlayedTile = this.state[rowIndex][colIndex];
    const lastPlayedColor = lastPlayedTile.color;

    // sequence \
    const topLeftSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x - 1, (y) => y - 1);
    const bottomRightSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x + 1, (y) => y + 1);
    if ((topLeftSequence + bottomRightSequence) >= 4) {
      this.winner = lastPlayedColor;
      return;
    }

    // sequence /
    const topRightSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x + 1, (y) => y - 1);
    const bottomLeftSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x - 1, (y) => y + 1);
    if ((topRightSequence + bottomLeftSequence) >= 4) {
      this.winner = lastPlayedColor;
      return;
    }

    // sequence |
    const topSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x, (y) => y - 1);
    const bottomSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x, (y) => y + 1);
    if ((topSequence + bottomSequence) >= 4) {
      this.winner = lastPlayedColor;
      return;
    }

    // sequence -
    const leftSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x - 1, (y) => y);
    const rightSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x + 1, (y) => y);
    if ((leftSequence + rightSequence) >= 4) {
      this.winner = lastPlayedColor;
    }
  }

  directionSequence(rowIndex, colIndex, color, rowStep, colStep) {
    let sequence = 0;
    let x = rowStep(rowIndex);
    let y = colStep(colIndex);
    while (x >= 0 && y >= 0 && x < this.size && y < this.size && sequence < 5) {
      const tile = this.state[x][y];
      if (!tile.cardCode || tile.color === color) {
        sequence += 1;
      } else {
        break;
      }
      x = rowStep(x);
      y = colStep(y);
    }
    return sequence;
  }
}

export default Board;
