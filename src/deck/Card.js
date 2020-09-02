import { Card } from 'cards/src/card';

class SequenceCard extends Card {
  equalsCard(card) {
    return (this.rank.shortName === card.rank.shortName) && (this.suit.name === card.suit.name);
  }

  getCode() {
    return `${this.rank.shortName}${this.suit.name}`;
  }

  isWildcard() {
    return ['JD', 'JH'].includes(this.getCode());
  }

  isRemove() {
    return ['JC', 'JS'].includes(this.getCode());
  }
}

export default SequenceCard;
