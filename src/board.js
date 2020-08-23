class Board {
    constructor() {
        // suits: S, H, C, D
        this.boardArray = [
            [ {card: '2H'}, {card: '3H'} ],
            [ {card: '2S'}, {card: '3S'} ]
        ];
    }

    assign(x, y, color) {
        const tile = this.boardArray[x][y];
        if(tile.color) return false;
        tile.color = color;
    }
}

export default Board;