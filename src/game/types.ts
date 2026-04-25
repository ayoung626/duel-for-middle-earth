export type Side = 'FELLOWSHIP' | 'SAURON';

export type CardType = 'GREY' | 'YELLOW' | 'BLUE' | 'GREEN' | 'RED' | 'PURPLE';

export type SkillSymbol = 'RUSE' | 'COURAGE' | 'STRENGTH' | 'KNOWLEDGE' | 'LEADERSHIP';
export type RaceSymbol = 'DWARF' | 'ELF' | 'HOBBIT' | 'HUMAN' | 'ENT' | 'WIZARD';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  chapter: number;
  cost: {
    coins: number;
    skills: SkillSymbol[];
  };
  bonus?: {
    coins?: number;
    skills?: SkillSymbol[];
    quest?: number;
    military?: number;
    race?: RaceSymbol;
  };
  chainingSymbol?: string;
}

export interface Region {
  id: string;
  name: string;
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
  cost: {
    skills: SkillSymbol[];
  };
}

export interface PlayerState {
  side: Side;
  coins: number;
  skills: SkillSymbol[];
  races: Set<RaceSymbol>;
  cards: string[]; // Card IDs
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
  landmarks: Landmark[];
  log: string[];
}
