import { Deck } from 'cards/src/deck';
import { spades, hearts, diamonds, clubs } from 'cards/src/suits';
import { Card } from 'cards/src/card';
import { ace, two, three, four, five, six, seven, eight, nine, ten, jack, queen, king } from 'cards/src/ranks';

const suits = [ spades, hearts, diamonds, clubs ];
const ranks = [ ace, two, three, four, five, six, seven, eight, nine, ten, jack, queen, king ];

const generateCards = () => {
  let cards = [];
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      cards = cards.concat([new Card(suit, rank), new Card(suit, rank)]);
    });
  });
  return cards;
};

class SequenceDeck extends Deck {
  constructor() {
    super(generateCards());
  }
}

export default SequenceDeck;
