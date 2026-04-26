'use client';

import { Client } from 'boardgame.io/react';
import { DuelForMiddleEarth } from '@/game/Game';
import { GameBoard } from '@/components/GameBoard';

const GameClient = Client({
  game: DuelForMiddleEarth,
  board: GameBoard,
  numPlayers: 2,
  debug: true,
});

export default GameClient;
