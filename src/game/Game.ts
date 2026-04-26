import { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { GameState, Side, RaceSymbol, Card, SkillSymbol } from './types';
import { INITIAL_STATE, CHAPTER_1_CARDS } from './constants';

// Helper to shuffle an array
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createChapter1Setup = (): GameState => {
  const state = JSON.parse(JSON.stringify(INITIAL_STATE)) as GameState;

  
  // Shuffle the 23 cards and pick 20
  const shuffledCards = shuffle(CHAPTER_1_CARDS);
  const selectedCards = shuffledCards.slice(0, 20);
  
  // Populate card pool
  selectedCards.forEach((card: Card) => {
    state.cardPool[card.id] = card;
  });

  const rows = [2, 3, 4, 5, 6];
  const pyramid: GameState['pyramid'] = [];
  let cardIndex = 0;

  rows.forEach((count, rowIndex) => {
    const row: GameState['pyramid'][0] = [];
    for (let i = 0; i < count; i++) {
      const isFaceUp = rowIndex % 2 === 0;
      const cardId = selectedCards[cardIndex++].id;

      row.push({
        id: `p-${rowIndex}-${i}`,
        cardId,
        isFaceUp,
        isAvailable: rowIndex === 4,
      });
    }
    pyramid.push(row);
  });

  state.pyramid = pyramid;
  return state;
};

const isCardAvailable = (pyramid: GameState['pyramid'], rowIndex: number, colIndex: number) => {
  const rowBelow = pyramid[rowIndex + 1];
  if (!rowBelow) return true;

  const leftCover = rowBelow[colIndex];
  const rightCover = rowBelow[colIndex + 1];

  const isBlockedByLeft = leftCover && leftCover.cardId !== null;
  const isBlockedByRight = rightCover && rightCover.cardId !== null;

  return !isBlockedByLeft && !isBlockedByRight;
};

// Calculate cost considering missing skills
export const calculateCardCost = (card: Card, playerSkills: SkillSymbol[]) => {
  let missingSkills = 0;
  const playerSkillsCopy = [...playerSkills];
  
  for (const requiredSkill of card.cost.skills) {
    const index = playerSkillsCopy.indexOf(requiredSkill);
    if (index !== -1) {
      playerSkillsCopy.splice(index, 1);
    } else {
      missingSkills++;
    }
  }
  
  // In standard rules, missing symbols cost 1 coin each
  return card.cost.coins + missingSkills;
};

export const DuelForMiddleEarth: Game<GameState> = {
  name: 'duel-for-middle-earth',

  setup: createChapter1Setup,

  turn: {
    moveLimit: 1,
  },

  moves: {
    takeCard: ({ G, ctx }, data: { rowIndex: number, colIndex: number }) => {
      if (!data || typeof data.rowIndex === 'undefined') {
        console.error('takeCard received invalid data:', data);
        return INVALID_MOVE;
      }
      
      const { rowIndex, colIndex } = data;
      if (G.pyramid === undefined || G.pyramid[rowIndex] === undefined) {
        console.error('Invalid pyramid access:', { rowIndex, colIndex });
        return INVALID_MOVE;
      }
      const pyramidSlot = G.pyramid[rowIndex][colIndex];

      if (!pyramidSlot || pyramidSlot.cardId === null) return INVALID_MOVE;
      if (!isCardAvailable(G.pyramid, rowIndex, colIndex)) return INVALID_MOVE;

      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const player = G.players[playerSide];
      const card = G.cardPool[pyramidSlot.cardId];
      
      if (!card) return INVALID_MOVE;

      // Economy Check
      const totalCost = calculateCardCost(card, player.skills);
      if (player.coins < totalCost) return INVALID_MOVE;

      // Deduct Cost
      player.coins -= totalCost;

      // Apply Bonuses
      if (card.bonus?.coins) player.coins += card.bonus.coins;
      if (card.bonus?.skills) player.skills.push(...card.bonus.skills);
      if (card.bonus?.race) player.races.push(card.bonus.race);
      if (card.bonus?.quest) {
        if (playerSide === 'FELLOWSHIP') G.questTrack.fellowship += card.bonus.quest;
        else G.questTrack.sauron += card.bonus.quest;
      }
      if (card.bonus?.placement) {
        G.log.push(`${playerSide} can place a unit in ${card.bonus.placement.join(' or ')}`);
        // TODO: In a more complex version, we'd force the player to make a choice before ending the turn.
        // For now, they can just use the manual map clicking we built earlier.
      }

      player.cards.push(card.id);
      G.log.push(`${playerSide} took ${card.name} for ${totalCost} coins`);

      pyramidSlot.cardId = null;

      if (rowIndex > 0) {
        const prevRow = G.pyramid[rowIndex - 1];
        prevRow.forEach((parentCard, pIndex) => {
            if (parentCard.cardId && !parentCard.isFaceUp) {
                if (isCardAvailable(G.pyramid, rowIndex - 1, pIndex)) {
                    parentCard.isFaceUp = true;
                }
            }
        });
      }
    },

    discardCard: ({ G, ctx }, data: { rowIndex: number, colIndex: number }) => {
      if (!data || typeof data.rowIndex === 'undefined') return INVALID_MOVE;
      const { rowIndex, colIndex } = data;
      const pyramidSlot = G.pyramid[rowIndex][colIndex];
      if (!pyramidSlot || pyramidSlot.cardId === null || !isCardAvailable(G.pyramid, rowIndex, colIndex)) return INVALID_MOVE;

      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const player = G.players[playerSide];
      player.coins += G.currentChapter;
      G.log.push(`${playerSide} discarded a card for ${G.currentChapter} coins`);

      pyramidSlot.cardId = null;

      if (rowIndex > 0) {
        G.pyramid[rowIndex - 1].forEach((parentCard, pIndex) => {
            if (parentCard.cardId && !parentCard.isFaceUp && isCardAvailable(G.pyramid, rowIndex - 1, pIndex)) {
                parentCard.isFaceUp = true;
            }
        });
      }
    },

    placeUnit: ({ G, ctx }, regionId: string) => {
      const region = G.map[regionId];
      if (!region) return INVALID_MOVE;

      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const enemySide = playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';

      // Combat logic: 1 unit removes 1 enemy unit. Fortresses are ignored for this basic unit combat.
      if (region.units[enemySide] > 0) {
        region.units[enemySide]--;
        G.log.push(`${playerSide} defeated an enemy unit in ${region.name}`);
      } else {
        region.units[playerSide]++;
        G.log.push(`${playerSide} placed a unit in ${region.name}`);
      }
    },

    advanceQuest: ({ G, ctx }) => {
      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      if (playerSide === 'FELLOWSHIP') {
        G.questTrack.fellowship++;
        G.log.push(`FELLOWSHIP advanced on the Quest Track to step ${G.questTrack.fellowship}`);
      } else {
        G.questTrack.sauron++;
        G.log.push(`SAURON advanced on the Quest Track to step ${G.questTrack.sauron}`);
      }
    },
  },
  endIf: ({ G, ctx }) => {
    if (!G || !G.questTrack) return undefined;
    
    // Quest of the Ring: First to reach space 12 wins
    if (G.questTrack.fellowship >= 12) return { winner: 'FELLOWSHIP', reason: 'Quest of the Ring' };
    if (G.questTrack.sauron >= 12) return { winner: 'SAURON', reason: 'Quest of the Ring' };

    for (const side of ['FELLOWSHIP', 'SAURON'] as Side[]) {
      const player = G.players?.[side];
      if (player && player.races && player.races.length >= 6) return { winner: side, reason: 'Support of the Races' };
    }

    if (G.map) {
      for (const side of ['FELLOWSHIP', 'SAURON'] as Side[]) {
        const presenceCount = Object.values(G.map).filter(r => r.units[side] > 0 || r.hasFortress[side]).length;
        if (presenceCount === 7) return { winner: side, reason: 'Conquering Middle-earth' };
      }
    }

    return undefined;
  },
};
