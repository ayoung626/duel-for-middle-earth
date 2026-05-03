export type Side = 'FELLOWSHIP' | 'SAURON';

export type CardType = 'GREY' | 'YELLOW' | 'BLUE' | 'GREEN' | 'RED' | 'PURPLE';

export type SkillSymbol = 'RUSE' | 'COURAGE' | 'STRENGTH' | 'KNOWLEDGE' | 'LEADERSHIP';
export type RaceSymbol = 'DWARF' | 'ELF' | 'HOBBIT' | 'HUMAN' | 'ENT' | 'WIZARD' | 'EAGLE';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  chapter: number;
  cost: {
    coins: number;
    skills: SkillSymbol[];
  };
  chainsFrom?: string;
  bonus?: {
    coins?: number;
    skills?: SkillSymbol[];
    wildSkills?: SkillSymbol[][];
    quest?: number;
    military?: number;
    race?: RaceSymbol;
    placement?: string[];
    placementCount?: number;
    removeEnemyCoins?: number;
    removeEnemyUnits?: number;
    movements?: number;
  };
  chainingSymbol?: string;
}

export interface Region {
  id: string;
  name: string;
  adjacent: string[];
  units: {
    FELLOWSHIP: number;
    SAURON: number;
  };
  hasFortress: {
    FELLOWSHIP: boolean;
    SAURON: boolean;
  };
}

export interface Landmark {
  id: string;
  name: string;
  regionId: string;
  cost: SkillSymbol[];
  builtBy: Side | null;
  description: string;
}

export interface RaceTile {
  id: string;
  race: RaceSymbol;
  name: string;
  description: string;
  effectType: 'IMMEDIATE' | 'PASSIVE';
}

export interface PlayerState {
  side: Side;
  coins: number;
  skills: SkillSymbol[];
  wildSkills: SkillSymbol[][];
  races: RaceSymbol[];
  cards: string[];
  builtLandmarks: string[];
  tiles: string[]; // RaceTile IDs
}

export interface GameState {
  questTrack: {
    fellowship: number;
    sauron: number;
  };
  map: Record<string, Region>;
  players: Record<Side, PlayerState>;
  currentChapter: 1 | 2 | 3;
  pyramid: {
    id: string;
    isFaceUp: boolean;
    isAvailable: boolean;
    cardId: string | null;
  }[][];
  cardPool: Record<string, Card>;
  discardPile: string[];
  landmarks: Landmark[]; // All landmarks in shuffled order
  availableLandmarks: string[]; // IDs of currently available landmarks
  raceTiles: Record<RaceSymbol, RaceTile[]>;
  log: string[];
  pendingPlacement: string[] | null;
  pendingPlacementCount: number;
  pendingRemovalCount: number;
  pendingMovementsCount: number;
  pendingDiscardTake: boolean;
  pendingRacePick: 'DUPLICATE' | 'UNIQUE_3' | 'GREY_HAVENS_CHOOSE_RACE' | 'GREY_HAVENS_PICK_TILE' | null;
  pendingRaceSelectionPool: RaceTile[];
   pendingGreyRemoval: boolean;
   pendingLandmarkRemoval: boolean;
   entChoicesCount: number;
   extraTurn: boolean;
 }
