import { GameState, Region, Card } from './types';

export const REGIONS: Record<string, Region> = {
  LINDON: { id: 'LINDON', name: 'Lindon', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  ARNOR: { id: 'ARNOR', name: 'Arnor', units: { FELLOWSHIP: 2, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  ENEDWAITH: { id: 'ENEDWAITH', name: 'Enedwaith', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  GONDOR: { id: 'GONDOR', name: 'Gondor', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  ROHAN: { id: 'ROHAN', name: 'Rohan', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  RHOVANION: { id: 'RHOVANION', name: 'Rhovanion', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  MORDOR: { id: 'MORDOR', name: 'Mordor', units: { FELLOWSHIP: 0, SAURON: 2 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
};

export const CHAPTER_1_CARDS: Card[] = [
  // Grey (Skills) - 8 cards
  { id: 'c1-1', name: 'Courage', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['COURAGE'] } },
  { id: 'c1-2', name: 'Courage', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['COURAGE'] } },
  { id: 'c1-3', name: 'Strength', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['STRENGTH'] } },
  { id: 'c1-4', name: 'Strength', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['STRENGTH'] } },
  { id: 'c1-5', name: 'Ruse', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['RUSE'] } },
  { id: 'c1-6', name: 'Ruse', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['RUSE'] } },
  { id: 'c1-7', name: 'Leadership', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['LEADERSHIP'] } },
  { id: 'c1-8', name: 'Knowledge', type: 'GREY', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { skills: ['KNOWLEDGE'] } },

  // Yellow (Coins) - 4 cards
  { id: 'c1-9', name: 'Gold', type: 'YELLOW', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { coins: 2 } },
  { id: 'c1-10', name: 'Gold', type: 'YELLOW', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { coins: 2 } },
  { id: 'c1-11', name: 'Gold', type: 'YELLOW', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { coins: 2 } },
  { id: 'c1-12', name: 'Gold', type: 'YELLOW', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { coins: 2 } },

  // Red (Military) - 3 cards
  { id: 'c1-13', name: 'Lindon/Arnor', type: 'RED', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { placement: ['LINDON', 'ARNOR'] }, chainingSymbol: 'DAGGER' },
  { id: 'c1-14', name: 'Gondor/Rohan', type: 'RED', chapter: 1, cost: { coins: 0, skills: ['RUSE'] }, bonus: { placement: ['GONDOR', 'ROHAN'] }, chainingSymbol: 'BOW' },
  { id: 'c1-15', name: 'Enedwaith/Rhovanion', type: 'RED', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { placement: ['ENEDWAITH', 'RHOVANION'] }, chainingSymbol: 'HELMET' },

  // Blue (Quest) - 4 cards
  { id: 'c1-16', name: 'Quest', type: 'BLUE', chapter: 1, cost: { coins: 0, skills: [] }, bonus: { quest: 1 } },
  { id: 'c1-17', name: 'Quest', type: 'BLUE', chapter: 1, cost: { coins: 0, skills: ['STRENGTH'] }, bonus: { quest: 1 }, chainingSymbol: 'HORSE' },
  { id: 'c1-18', name: 'Quest', type: 'BLUE', chapter: 1, cost: { coins: 0, skills: ['COURAGE'] }, bonus: { quest: 1 }, chainingSymbol: 'BACKPACK' },
  { id: 'c1-19', name: 'Quest', type: 'BLUE', chapter: 1, cost: { coins: 1, skills: [] }, bonus: { quest: 1 }, chainingSymbol: 'FISH' },

  // Green (Race) - 4 cards
  { id: 'c1-20', name: 'Dwarf', type: 'GREEN', chapter: 1, cost: { coins: 0, skills: ['LEADERSHIP'] }, bonus: { race: 'DWARF' }, chainingSymbol: 'ANVIL' },
  { id: 'c1-21', name: 'Elf', type: 'GREEN', chapter: 1, cost: { coins: 0, skills: ['KNOWLEDGE'] }, bonus: { race: 'ELF' }, chainingSymbol: 'HARP' },
  { id: 'c1-22', name: 'Hobbit', type: 'GREEN', chapter: 1, cost: { coins: 0, skills: ['LEADERSHIP'] }, bonus: { race: 'HOBBIT' }, chainingSymbol: 'POT' },
  { id: 'c1-23', name: 'Human', type: 'GREEN', chapter: 1, cost: { coins: 0, skills: ['KNOWLEDGE'] }, bonus: { race: 'HUMAN' }, chainingSymbol: 'HORSESHOE' },
];

export const INITIAL_STATE: GameState = {
  questTrack: {
    fellowship: 0,
    sauron: 0,
  },
  map: REGIONS,
  players: {
    FELLOWSHIP: {
      side: 'FELLOWSHIP',
      coins: 3,
      skills: [],
      races: [],
      cards: [],
    },
    SAURON: {
      side: 'SAURON',
      coins: 2,
      skills: [],
      races: [],
      cards: [],
    },
  },
  currentChapter: 1,
  pyramid: [],
  cardPool: {},
  landmarks: [],
  log: ['Game started'],
};

