import { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { GameState, Side, RaceSymbol } from './types';
import { INITIAL_STATE } from './constants';

export const DuelForMiddleEarth: Game<GameState> = {
  name: 'duel-for-middle-earth',

  setup: () => INITIAL_STATE,

  turn: {
    moveLimit: 1,
  },

  moves: {
    takeCard: (G, ctx, cardId: string) => {
      // Logic for taking a card from the pyramid
      // 1. Check if card is available
      // 2. Check if player can afford it
      // 3. Deduct costs
      // 4. Apply bonuses
      // 5. Update pyramid (reveal covered cards)
      // 6. Check for end of chapter
    },

    discardCard: (G, ctx, cardId: string) => {
      // Logic for discarding a card for coins
      const player = G.players[ctx.currentPlayer === '0' ? 'FELLOWSHIP' : 'SAURON'];
      player.coins += G.currentChapter;
      // Update pyramid visibility...
    },

    takeLandmark: (G, ctx, landmarkId: string) => {
      // Logic for taking a landmark tile
    },
  },

  endIf: (G, ctx) => {
    // Check Victory Conditions
    
    // 1. Quest of the Ring
    if (G.questTrack.fellowship >= 12) return { winner: 'FELLOWSHIP', reason: 'Quest of the Ring' };
    if (G.questTrack.sauron >= G.questTrack.fellowship + 3) return { winner: 'SAURON', reason: 'Quest of the Ring (Caught)' };

    // 2. Support of the Races (6 different symbols)
    for (const side of ['FELLOWSHIP', 'SAURON'] as Side[]) {
      if (G.players[side].races.size >= 6) return { winner: side, reason: 'Support of the Races' };
    }

    // 3. Conquering Middle-earth (presence in all 7 regions)
    for (const side of ['FELLOWSHIP', 'SAURON'] as Side[]) {
      const presenceCount = Object.values(G.map).filter(r => r.units[side] > 0 || r.hasFortress[side]).length;
      if (presenceCount === 7) return { winner: side, reason: 'Conquering Middle-earth' };
    }

    return undefined;
  },
};
