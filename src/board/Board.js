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
  }

  assign(rowIndex, colIndex, color) {
    const tile = this.state[rowIndex][colIndex];
    if (tile.color) return false;
    tile.color = color;
    return true;
  }
}

export default Board;
