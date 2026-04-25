import { GameState, Region } from './types';

export const REGIONS: Record<string, Region> = {
  LINDON: { id: 'LINDON', name: 'Lindon', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  ARNOR: { id: 'ARNOR', name: 'Arnor', units: { FELLOWSHIP: 2, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  ENEDWAITH: { id: 'ENEDWAITH', name: 'Enedwaith', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  GONDOR: { id: 'GONDOR', name: 'Gondor', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  ROHAN: { id: 'ROHAN', name: 'Rohan', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  RHOVANION: { id: 'RHOVANION', name: 'Rhovanion', units: { FELLOWSHIP: 0, SAURON: 0 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
  MORDOR: { id: 'MORDOR', name: 'Mordor', units: { FELLOWSHIP: 0, SAURON: 2 }, hasFortress: { FELLOWSHIP: false, SAURON: false } },
};

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
      races: new Set(),
      cards: [],
    },
    SAURON: {
      side: 'SAURON',
      coins: 2,
      skills: [],
      races: new Set(),
      cards: [],
    },
  },
  currentChapter: 1,
  pyramid: [],
  cardPool: {},
  landmarks: [],
  log: ['Game started'],
};
