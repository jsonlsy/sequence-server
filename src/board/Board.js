import boardMap from './boardMap';

class Board {
  constructor() {
    this.state = []; // [{ cardCode: , color:, partOfSequence }]
    this.cardMap = {};
    boardMap.forEach((row, rowIndex) => {
      this.state[rowIndex] = [];
      row.forEach((cardCode, colIndex) => {
        if (this.cardMap[cardCode]) {
          this.cardMap[cardCode].push([rowIndex, colIndex]);
        } else {
          this.cardMap[cardCode] = [[rowIndex, colIndex]];
        }
        this.state[rowIndex][colIndex] = { cardCode };
      });
    });
    this.size = this.state.length;
  }

  checkCard(cardCode, rowIndex, colIndex) {
    const indexes = this.cardMap[cardCode];
    let valid = false;
    if (indexes) {
      indexes.forEach(([row, col]) => {
        valid = valid || ((row === rowIndex) && (col === colIndex));
      });
    }
    return valid;
  }

  assign(rowIndex, colIndex, color) {
    const tile = this.state[rowIndex][colIndex];
    if (tile.color) return false;
    tile.color = color;
    return true;
  }

  unassign(rowIndex, colIndex) {
    const tile = this.state[rowIndex][colIndex];
    if (!tile.color) return false;

    // if assigning existing color to tile creates a sequence -> this move would break a sequence
    const nSequenceCreated = this.checkSequence(rowIndex, colIndex);
    console.log(nSequenceCreated);
    if (nSequenceCreated > 0) return false;

    delete tile.color;
    return true;
  }

  checkSequence(rowIndex, colIndex) {
    const lastPlayedTile = this.state[rowIndex][colIndex];
    const lastPlayedColor = lastPlayedTile.color;
    let nSequenceCreated = 0;
    // sequence \
    const topLeftSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x - 1, (y) => y - 1);
    const bottomRightSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x + 1, (y) => y + 1);
    if ((topLeftSequence + bottomRightSequence) >= 4) {
      nSequenceCreated += 1;
    }

    // sequence /
    const topRightSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x + 1, (y) => y - 1);
    const bottomLeftSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x - 1, (y) => y + 1);
    if ((topRightSequence + bottomLeftSequence) >= 4) {
      nSequenceCreated += 1;
    }

    // sequence |
    const topSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x, (y) => y - 1);
    const bottomSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x, (y) => y + 1);
    if ((topSequence + bottomSequence) >= 4) {
      nSequenceCreated += 1;
    }

    // sequence -
    const leftSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x - 1, (y) => y);
    const rightSequence = this.directionSequence(rowIndex, colIndex, lastPlayedColor, (x) => x + 1, (y) => y);
    if ((leftSequence + rightSequence) >= 4) {
      nSequenceCreated += 1;
    }

    return nSequenceCreated;
  }

  directionSequence(rowIndex, colIndex, color, rowStep, colStep) {
    let sequence = 0;
    let x = rowStep(rowIndex);
    let y = colStep(colIndex);
    while (x >= 0 && y >= 0 && x < this.size && y < this.size) {
      const tile = this.state[x][y];
      if (!tile.cardCode || tile.color === color) {
        sequence += 1;
      } else {
        break;
      }
      x = rowStep(x);
      y = colStep(y);
    }
    // if sequence is greater than 5, no new sequence being created in this direction
    return sequence < 5 ? sequence : 0;
  }
}

export default Board;
