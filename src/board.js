import boardMap from './boardMap';

class Board {
  constructor() {
    this.state = []; // [{ card: , color: }]
    this.cardMap = {};
    boardMap.forEach((row, rowIndex) => {
      this.state[rowIndex] = [];
      row.forEach((card, colIndex) => {
        this.cardMap[card] = [rowIndex, colIndex];
        this.state[rowIndex][colIndex] = { card };
      });
    });
  }

  assign(x, y, color) {
    const tile = this.state[x][y];
    if (tile.color) return false;
    tile.color = color;
    return true;
  }
}

export default Board;
