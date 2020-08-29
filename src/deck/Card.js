import { Card } from 'cards/src/card';

class SequenceCard extends Card {
  equalsCard(card) {
    return (this.rank.shortName === card.rank.shortName) && (this.suit.name === card.suit.name);
  }

  getCode() {
    return `${this.rank.shortName}${this.suit.name}`;
  }
}

export default SequenceCard;
