import { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { GameState, Side, RaceSymbol, Card, SkillSymbol, PlayerState, RaceTile, Landmark } from './types';
import { INITIAL_STATE, CHAPTER_1_CARDS, CHAPTER_2_CARDS, CHAPTER_3_CARDS, ALL_LANDMARKS } from './constants';

const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createChapterSetup = (chapter: number, currentCardPool: Record<string, Card>): GameState['pyramid'] => {
  let cardsToUse = CHAPTER_1_CARDS;
  if (chapter === 2) cardsToUse = CHAPTER_2_CARDS;
  if (chapter === 3) cardsToUse = CHAPTER_3_CARDS;
  const shuffledCards = shuffle(cardsToUse);
  const selectedCards = shuffledCards.slice(0, 20);
  selectedCards.forEach((card: Card) => { currentCardPool[card.id] = card; });
  const pyramid: GameState['pyramid'] = [];
  let cardIndex = 0;

  if (chapter === 3) {
    const layout = [
      { count: 2, faceUp: true }, { count: 3, faceUp: false }, { count: 4, faceUp: true },
      { count: 3, faceUp: false, hasGap: true }, { count: 4, faceUp: true },
      { count: 3, faceUp: false }, { count: 2, faceUp: true },
    ];
    layout.forEach((rowConfig, rowIndex) => {
      const row: GameState['pyramid'][0] = [];
      for (let i = 0; i < rowConfig.count; i++) {
        if (rowConfig.hasGap && i === 1) {
          row.push({ id: `p-${rowIndex}-${i}`, cardId: null, isFaceUp: false, isAvailable: false });
          continue;
        }
        const cardId = selectedCards[cardIndex++].id;
        row.push({ id: `p-${rowIndex}-${i}`, cardId, isFaceUp: rowConfig.faceUp, isAvailable: rowIndex === 6 });
      }
      pyramid.push(row);
    });
  } else {
    const rows = chapter === 2 ? [6, 5, 4, 3, 2] : [2, 3, 4, 5, 6];
    rows.forEach((count, rowIndex) => {
      const row: GameState['pyramid'][0] = [];
      for (let i = 0; i < count; i++) {
        const cardId = selectedCards[cardIndex++].id;
        row.push({ id: `p-${rowIndex}-${i}`, cardId, isFaceUp: rowIndex % 2 === 0, isAvailable: rowIndex === 4 });
      }
      pyramid.push(row);
    });
  }
  return pyramid;
};

export const isCardAvailable = (pyramid: GameState['pyramid'], rowIndex: number, colIndex: number, chapter: number) => {
  const rowBelow = pyramid[rowIndex + 1];
  if (!rowBelow) return true;
  if (chapter === 3) {
    if (rowIndex === 2) {
      if (colIndex <= 1) return rowBelow[0].cardId === null;
      if (colIndex >= 2) return rowBelow[2].cardId === null;
    }
    if (rowIndex === 3) {
      if (colIndex === 0) return rowBelow[0].cardId === null && rowBelow[1].cardId === null;
      if (colIndex === 1) return true;
      if (colIndex === 2) return rowBelow[2].cardId === null && rowBelow[3].cardId === null;
    }
  }
  const currentRowSize = pyramid[rowIndex].length;
  const nextRowSize = rowBelow.length;
  if (nextRowSize > currentRowSize) {
    const left = rowBelow[colIndex];
    const right = rowBelow[colIndex + 1];
    return (!left || left.cardId === null) && (!right || right.cardId === null);
  } else {
    const left = rowBelow[colIndex - 1];
    const right = rowBelow[colIndex];
    return (!left || left.cardId === null) && (!right || right.cardId === null);
  }
};

export const calculateCardCost = (card: Card, player: PlayerState, cardPool: Record<string, Card>) => {
  if (card.chainsFrom && player.cards.some(cId => cardPool[cId]?.chainingSymbol === card.chainsFrom)) return 0;
  let missingSkills = 0;
  const playerSkillsCopy = [...player.skills];
  const hasElfWild = player.tiles.includes('t-elf-3');
  let elfWildUsed = false;
  const remainingRequired: SkillSymbol[] = [];
  for (const skill of card.cost.skills) {
    const idx = playerSkillsCopy.indexOf(skill);
    if (idx !== -1) playerSkillsCopy.splice(idx, 1);
    else remainingRequired.push(skill);
  }
  const wildSkillsCopy = [...player.wildSkills];
  for (const req of remainingRequired) {
    const wIdx = wildSkillsCopy.findIndex(w => w.includes(req));
    if (wIdx !== -1) wildSkillsCopy.splice(wIdx, 1);
    else if (hasElfWild && !elfWildUsed) elfWildUsed = true;
    else missingSkills++;
  }
  return card.cost.coins + missingSkills;
};

export const calculateLandmarkCost = (landmark: Landmark, player: PlayerState) => {
  let costPlus = player.tiles.includes('t-dwa-2') ? 0 : player.builtLandmarks.length;
  const pSkills = [...player.skills], wSkills = [...player.wildSkills], req = [...landmark.cost];
  let missing = 0;
  
  for (const s of req) {
      const idx = pSkills.indexOf(s);
      if (idx !== -1) pSkills.splice(idx, 1);
      else { 
        const wi = wSkills.findIndex(w => w.includes(s)); 
        if (wi !== -1) wSkills.splice(wi, 1); 
        else missing++;
      }
  }
  
  for (let i = 0; i < costPlus; i++) { 
    if (pSkills.length > 0) pSkills.pop(); 
    else if (wSkills.length > 0) wSkills.pop(); 
    else missing++;
  } 
  return missing;
};

export const canAffordLandmark = (landmark: Landmark, player: PlayerState) => {
  const coinCost = calculateLandmarkCost(landmark, player);
  return player.coins >= coinCost;
};

const updateAvailableLandmarks = (G: GameState) => {
    const unbuiltAvailable = G.availableLandmarks.filter(id => {
        const l = G.landmarks.find(landmark => landmark.id === id);
        return l && l.builtBy === null;
    });

    if (unbuiltAvailable.length < 3) {
        const notYetAvailable = G.landmarks.filter(l => !G.availableLandmarks.includes(l.id));
        const needed = 3 - unbuiltAvailable.length;
        const toAdd = notYetAvailable.slice(0, needed);
        toAdd.forEach(l => G.availableLandmarks.push(l.id));
    }
};

const resolveConflict = (region: GameState['map'][string], playerSide: Side, amount: number) => {
  const enemySide = playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';
  for (let i = 0; i < amount; i++) {
    if (region.units[enemySide] > 0) {
      region.units[enemySide]--;
    } else {
      region.units[playerSide]++;
    }
  }
};

const advanceQuestTrack = (G: GameState, side: Side, amount: number) => {
  const sideKey = side.toLowerCase() as 'fellowship' | 'sauron';
  const oldVal = G.questTrack[sideKey];
  const newVal = Math.min(14, oldVal + amount);
  G.questTrack[sideKey] = newVal;

  const player = G.players[side];
  
  if (oldVal < 3 && newVal >= 3) {
    player.coins += 1;
    G.log.push(`${side} reached Ring space 3: gained 1 coin`);
  }
  if (oldVal < 6 && newVal >= 6) {
    if (!G.pendingPlacement) G.pendingPlacement = Object.keys(G.map);
    G.pendingPlacementCount++;
    G.log.push(`${side} reached Ring space 6: deploy 1 unit`);
  }
  if (oldVal < 9 && newVal >= 9) {
    G.extraTurn = true;
    G.log.push(`${side} reached Ring space 9: extra turn`);
  }
  if (oldVal < 12 && newVal >= 12) {
    if (G.landmarks.some(l => l.builtBy !== null && l.builtBy !== side)) {
      G.pendingLandmarkRemoval = true;
      G.log.push(`${side} reached Ring space 12: remove enemy landmark`);
    } else {
      G.log.push(`${side} reached Ring space 12: no enemy landmark to remove`);
    }
  }
};

const checkChapterEnd = (G: GameState) => {
  if (G.pyramid.every(row => row.every(slot => slot.cardId === null)) && G.currentChapter < 3) {
    G.currentChapter++;
    G.pyramid = createChapterSetup(G.currentChapter, G.cardPool);
    G.log.push(`*** CHAPTER ${G.currentChapter} HAS BEGUN ***`);
    updateAvailableLandmarks(G);
  }
};

export const DuelForMiddleEarth: Game<GameState> = {
  name: 'duel-for-middle-earth',
  setup: () => {
    const state = JSON.parse(JSON.stringify(INITIAL_STATE)) as GameState;
    state.pyramid = createChapterSetup(1, state.cardPool);
    state.landmarks = shuffle([...ALL_LANDMARKS]);
    updateAvailableLandmarks(state);
    Object.keys(state.raceTiles).forEach(race => {
      state.raceTiles[race as RaceSymbol] = shuffle(state.raceTiles[race as RaceSymbol]);
    });
    return state;
  },
  moves: {
    takeCard: ({ G, ctx, events }, { rowIndex, colIndex }: { rowIndex: number, colIndex: number }) => {
      if (G.pendingPlacement || G.pendingRemovalCount > 0 || G.pendingMovementsCount > 0 || G.pendingRacePick || G.pendingLandmarkRemoval) return INVALID_MOVE;
      const pyramidSlot = G.pyramid[rowIndex][colIndex];
      if (!pyramidSlot || pyramidSlot.cardId === null || !isCardAvailable(G.pyramid, rowIndex, colIndex, G.currentChapter)) return INVALID_MOVE;
      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const player = G.players[playerSide];
      const card = G.cardPool[pyramidSlot.cardId];
      const totalCost = calculateCardCost(card, player, G.cardPool);
      if (player.coins < totalCost) return INVALID_MOVE;

      if (card.chainsFrom && player.tiles.includes('t-hob-2') && player.cards.some(cId => G.cardPool[cId]?.chainingSymbol === card.chainsFrom)) {
          player.coins += 3;
          G.log.push(`${playerSide} gained 3 coins from Hobbit Feast`);
      }
      player.coins -= totalCost;
      if (card.bonus?.coins) player.coins += card.bonus.coins;
      if (card.bonus?.skills) player.skills.push(...card.bonus.skills);
      if (card.bonus?.wildSkills) player.wildSkills.push(...card.bonus.wildSkills);
      
      let triggerRaceTile = false;
      if (card.bonus?.race) {
          const race = card.bonus.race;
          const isDuplicate = player.races.includes(race);
          const uniqueBefore = new Set(player.races.filter(r => r !== 'EAGLE')).size;
          player.races.push(race);
          const uniqueAfter = new Set(player.races.filter(r => r !== 'EAGLE')).size;

          if (isDuplicate) {
              G.pendingRacePick = 'DUPLICATE';
              G.pendingRaceSelectionPool = G.raceTiles[race].splice(0, 2);
              triggerRaceTile = true;
          } else if (uniqueAfter === 3 && uniqueBefore < 3) {
              G.pendingRacePick = 'UNIQUE_3';
              const pool: RaceTile[] = [];
              const ownedRaces = Array.from(new Set(player.races.filter(r => r !== 'EAGLE')));
              ownedRaces.forEach(r => { if (G.raceTiles[r].length > 0) pool.push(G.raceTiles[r].splice(0, 1)[0]); });
              G.pendingRaceSelectionPool = pool;
              triggerRaceTile = true;
          }
          if (player.tiles.includes('t-dwa-3')) G.pendingMovementsCount += 2;
      }
      if (card.bonus?.quest) {
          advanceQuestTrack(G, playerSide, card.bonus.quest);
      }
      if (card.bonus?.removeEnemyCoins) {
          const enemy = G.players[playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP'];
          const removed = Math.min(enemy.coins, card.bonus.removeEnemyCoins);
          enemy.coins -= removed;
          G.log.push(`${playerSide} removed ${removed} coins`);
      }
      if (card.type === 'YELLOW') {
          if (player.tiles.includes('t-hum-2')) { advanceQuestTrack(G, playerSide, 1); }
          if (player.tiles.includes('t-elf-1')) G.extraTurn = true;
      }
      player.cards.push(card.id);
      G.log.push(`${playerSide} took ${card.name}`);
      pyramidSlot.cardId = null;
      if (rowIndex > 0) {
        G.pyramid[rowIndex - 1].forEach((p, i) => { if (p.cardId && !p.isFaceUp && isCardAvailable(G.pyramid, rowIndex-1, i, G.currentChapter)) p.isFaceUp = true; });
      }
      checkChapterEnd(G);

      if (card.bonus?.placement) {
        let count = card.bonus.placementCount || 1;
        if (player.tiles.includes('t-hum-3')) count++;
        if (!G.pendingPlacement) G.pendingPlacement = [];
        G.pendingPlacement = Array.from(new Set([...G.pendingPlacement, ...(player.tiles.includes('t-elf-2') ? Object.keys(G.map) : card.bonus.placement)]));
        G.pendingPlacementCount += count;
      }
      if (card.bonus?.removeEnemyUnits) G.pendingRemovalCount += card.bonus.removeEnemyUnits;
      if (card.bonus?.movements) G.pendingMovementsCount += card.bonus.movements;
      if (card.type === 'BLUE' && player.tiles.includes('t-hob-1')) { 
          if (!G.pendingPlacement) G.pendingPlacement = Object.keys(G.map);
          else G.pendingPlacement = Object.keys(G.map);
          G.pendingPlacementCount++; 
      }

      const hasFollowUp = G.pendingPlacementCount > 0 || G.pendingRemovalCount > 0 || G.pendingMovementsCount > 0 || triggerRaceTile || G.pendingLandmarkRemoval;
      if (!hasFollowUp) {
          if (G.extraTurn) { G.extraTurn = false; G.log.push(`${playerSide} extra turn!`); }
          else events.endTurn();
      }
    },

    discardCard: ({ G, ctx, events }, { rowIndex, colIndex }: { rowIndex: number, colIndex: number }) => {
      if (G.pendingPlacement || G.pendingRemovalCount > 0 || G.pendingMovementsCount > 0 || G.pendingRacePick || G.pendingLandmarkRemoval) return INVALID_MOVE;
      const pyramidSlot = G.pyramid[rowIndex][colIndex];
      if (!pyramidSlot || pyramidSlot.cardId === null || !isCardAvailable(G.pyramid, rowIndex, colIndex, G.currentChapter)) return INVALID_MOVE;
      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const gain = G.currentChapter * (G.players[playerSide].tiles.includes('t-hum-1') ? 2 : 1);
      G.players[playerSide].coins += gain;
      G.log.push(`${playerSide} discarded for ${gain} coins`);
      G.discardPile.push(pyramidSlot.cardId);
      pyramidSlot.cardId = null;
      if (rowIndex > 0) {
        G.pyramid[rowIndex - 1].forEach((p, i) => { if (p.cardId && !p.isFaceUp && isCardAvailable(G.pyramid, rowIndex-1, i, G.currentChapter)) p.isFaceUp = true; });
      }
      checkChapterEnd(G);
      events.endTurn();
    },

    selectRaceTile: ({ G, ctx, events }, tileId: string) => {
      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const player = G.players[playerSide];
      const tileIdx = G.pendingRaceSelectionPool.findIndex(t => t.id === tileId);
      if (tileIdx === -1) return INVALID_MOVE;
      const tile = G.pendingRaceSelectionPool.splice(tileIdx, 1)[0];
      
      // Return non-selected to top
      G.pendingRaceSelectionPool.reverse().forEach(t => { G.raceTiles[t.race].unshift(t); });
      G.pendingRaceSelectionPool = [];
      G.pendingRacePick = null;
      player.tiles.push(tile.id);
      G.log.push(`${playerSide} picked ${tile.name} tile`);

      if (tile.effectType === 'IMMEDIATE') {
          switch(tile.id) {
              case 't-ent-1': G.extraTurn = true; break;
              case 't-ent-2': if (G.landmarks.some(l => l.builtBy !== null && l.builtBy !== playerSide)) G.pendingLandmarkRemoval = true; break;
              case 't-wiz-1': advanceQuestTrack(G, playerSide, 2); break;
              case 't-wiz-2': if (G.discardPile.length > 0) G.pendingDiscardTake = true; break;
              case 't-wiz-3': G.pendingPlacement = Object.keys(G.map); G.pendingPlacementCount = 2; break;
              case 't-ent-3': G.entChoicesCount = 3; break;
          }
      }
      const hasFollowUp = G.pendingPlacementCount > 0 || G.pendingRemovalCount > 0 || G.pendingMovementsCount > 0 || G.entChoicesCount > 0 || G.pendingDiscardTake || G.pendingLandmarkRemoval;
      if (!hasFollowUp) {
          if (G.extraTurn) { G.extraTurn = false; G.log.push(`${playerSide} extra turn!`); }
          else events.endTurn();
      }
    },

    placeUnit: ({ G, ctx, events }, regionId: string) => {
      if (!G.pendingPlacement || !G.pendingPlacement.includes(regionId)) return INVALID_MOVE;
      const region = G.map[regionId];
      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const enemySide = playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';
      
      const totalUnits = G.pendingPlacementCount;
      for (let i = 0; i < totalUnits; i++) {
          if (region.units[enemySide] > 0) {
            region.units[enemySide]--;
          } else {
            region.units[playerSide]++;
          }
      }

      G.log.push(`${playerSide} placed ${totalUnits} unit(s) in ${region.name}`);
      G.pendingPlacementCount = 0;
      G.pendingPlacement = null;

      const hasFollowUp = G.pendingRemovalCount > 0 || G.pendingMovementsCount > 0 || !!G.pendingRacePick || G.pendingDiscardTake || G.pendingGreyRemoval || G.entChoicesCount > 0 || G.pendingLandmarkRemoval;

      if (!hasFollowUp) {
        if (G.extraTurn) {
            G.extraTurn = false;
            G.log.push(`${playerSide} takes an extra turn!`);
        } else {
            events.endTurn();
        }
      }
    },

    buildLandmark: ({ G, ctx, events }, landmarkId: string) => {
      if (G.pendingPlacementCount > 0 || G.pendingRemovalCount > 0 || G.pendingMovementsCount > 0 || G.pendingRacePick || G.pendingLandmarkRemoval) return INVALID_MOVE;
      if (!G.availableLandmarks.includes(landmarkId)) return INVALID_MOVE;

      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const player = G.players[playerSide];
      const landmark = G.landmarks.find(l => l.id === landmarkId && l.builtBy === null);
      if (!landmark) return INVALID_MOVE;

      const coinCost = calculateLandmarkCost(landmark, player);
      if (player.coins < coinCost) return INVALID_MOVE;

      // Deduct coins for missing skills
      player.coins -= coinCost;

      landmark.builtBy = playerSide;
      player.builtLandmarks.push(landmark.id);
      G.map[landmark.regionId].hasFortress[playerSide] = true;
      if (player.tiles.includes('t-dwa-1')) G.extraTurn = true;
      G.log.push(`${playerSide} built ${landmark.name}`);

      let follow = false;
      switch(landmark.id) {
          case 'l-barad-dur': if (G.discardPile.length > 0) { G.pendingDiscardTake = true; follow = true; } break;
          case 'l-minas-tirith': resolveConflict(G.map.GONDOR, playerSide, 1); advanceQuestTrack(G, playerSide, 2); break;
          case 'l-erebor': player.coins += 5; G.pendingMovementsCount++; follow = true; break;
          case 'l-isengard': advanceQuestTrack(G, playerSide, 1); G.pendingGreyRemoval = true; follow = true; break;
          case 'l-helms-deep': resolveConflict(G.map.ROHAN, playerSide, 3); break;
          case 'l-bree': resolveConflict(G.map.ARNOR, playerSide, 2); G.pendingMovementsCount += 2; follow = true; break;
          case 'l-grey-havens': G.pendingRacePick = 'GREY_HAVENS_CHOOSE_RACE'; follow = true; break;
      }
      if (G.pendingLandmarkRemoval) follow = true;
      if (!follow) { if (G.extraTurn) { G.extraTurn = false; } else events.endTurn(); }
    },

    greyHavensChooseRace: ({ G }, race: RaceSymbol) => {
        if (G.pendingRacePick !== 'GREY_HAVENS_CHOOSE_RACE') return INVALID_MOVE;
        G.pendingRaceSelectionPool = G.raceTiles[race].splice(0, 2);
        G.pendingRacePick = 'GREY_HAVENS_PICK_TILE';
    },

    entChoice: ({ G, ctx, events }, choice: 'KILL' | 'STEAL' | 'MOVE') => {
        if (G.entChoicesCount <= 0) return INVALID_MOVE;
        const enemySide = ctx.currentPlayer === '0' ? 'FELLOWSHIP' : 'SAURON';
        if (choice === 'KILL') G.pendingRemovalCount++;
        else if (choice === 'STEAL') G.players[enemySide].coins = Math.max(0, G.players[enemySide].coins - 1);
        else G.pendingMovementsCount++;
        G.entChoicesCount--;
        if (G.entChoicesCount === 0 && G.pendingRemovalCount === 0 && G.pendingMovementsCount === 0) events.endTurn();
    },

    removeUnit: ({ G, events }, { regionId, side }: { regionId: string, side: Side }) => {
      if (G.pendingRemovalCount <= 0) return INVALID_MOVE;
      const region = G.map[regionId];
      if (!region || region.units[side] <= 0) return INVALID_MOVE;
      region.units[side]--;
      G.pendingRemovalCount--;
      if (G.pendingRemovalCount === 0 && G.pendingMovementsCount === 0 && G.entChoicesCount === 0 && !G.pendingLandmarkRemoval) events.endTurn();
    },

    moveUnit: ({ G, ctx, events }, { fromRegionId, toRegionId }: { fromRegionId: string, toRegionId: string }) => {
      if (G.pendingMovementsCount <= 0) return INVALID_MOVE;
      const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
      const from = G.map[fromRegionId], to = G.map[toRegionId];
      if (!from || !to || fromRegionId === toRegionId || from.units[playerSide] <= 0 || !from.adjacent.includes(toRegionId)) return INVALID_MOVE;
      from.units[playerSide]--;
      const enemySide = playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';
      if (to.units[enemySide] > 0) to.units[enemySide]--; else to.units[playerSide]++;
      G.pendingMovementsCount--;
      if (G.pendingMovementsCount === 0 && G.pendingRemovalCount === 0 && G.entChoicesCount === 0 && !G.pendingLandmarkRemoval) events.endTurn();
    },

    takeDiscardCard: ({ G, ctx, events }, cardId: string) => {
        if (!G.pendingDiscardTake) return INVALID_MOVE;
        const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
        const player = G.players[playerSide];
        const cardIdx = G.discardPile.indexOf(cardId);
        if (cardIdx === -1 || !G.cardPool[cardId]) return INVALID_MOVE;
        G.discardPile.splice(cardIdx, 1);
        player.cards.push(cardId);
        G.pendingDiscardTake = false;
        G.log.push(`${playerSide} retrieved ${G.cardPool[cardId].name} from discard`);
        if (G.pendingPlacementCount === 0 && G.pendingRemovalCount === 0 && G.pendingMovementsCount === 0 && !G.pendingRacePick && !G.pendingLandmarkRemoval) {
            if (G.extraTurn) { G.extraTurn = false; } else events.endTurn();
        }
    },

    removeGreyCard: ({ G, ctx, events }, cardId: string) => {
        if (!G.pendingGreyRemoval) return INVALID_MOVE;
        const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
        const enemySide = playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';
        const enemy = G.players[enemySide];
        const cardIdx = enemy.cards.indexOf(cardId);
        if (cardIdx === -1 || !G.cardPool[cardId] || G.cardPool[cardId].type !== 'GREY') return INVALID_MOVE;
        enemy.cards.splice(cardIdx, 1);
        G.discardPile.push(cardId);
        G.pendingGreyRemoval = false;
        G.log.push(`${playerSide} removed ${G.cardPool[cardId].name} from ${enemySide}`);
        if (G.pendingPlacementCount === 0 && G.pendingRemovalCount === 0 && G.pendingMovementsCount === 0 && !G.pendingRacePick && !G.pendingLandmarkRemoval && !G.pendingDiscardTake && G.entChoicesCount === 0) {
            if (G.extraTurn) { G.extraTurn = false; } else events.endTurn();
        }
    },

     removeLandmark: ({ G, ctx, events }, landmarkId: string) => {
         if (!G.pendingLandmarkRemoval) return INVALID_MOVE;
         const playerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
         const enemySide = playerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';
         const landmark = G.landmarks.find(l => l.id === landmarkId);
         if (!landmark || landmark.builtBy !== enemySide) return INVALID_MOVE;
         
          landmark.builtBy = null;
          const availableIdx = G.availableLandmarks.indexOf(landmarkId);
          if (availableIdx !== -1) G.availableLandmarks.splice(availableIdx, 1);
          const player = G.players[enemySide];
          const landmarkIdx = player.builtLandmarks.indexOf(landmarkId);
          if (landmarkIdx !== -1) player.builtLandmarks.splice(landmarkIdx, 1);
          G.map[landmark.regionId].hasFortress[enemySide] = false;
         G.pendingLandmarkRemoval = false;
         G.log.push(`${playerSide} removed ${enemySide} landmark: ${landmark.name}`);
         
         if (G.pendingPlacementCount === 0 && G.pendingRemovalCount === 0 && G.pendingMovementsCount === 0 && !G.pendingRacePick && !G.pendingDiscardTake && !G.pendingGreyRemoval && G.entChoicesCount === 0) {
             if (G.extraTurn) { G.extraTurn = false; } else events.endTurn();
         }
     },

    skipPendingActions: ({ G, events }) => {
      G.pendingPlacement = null; G.pendingPlacementCount = 0; G.pendingRemovalCount = 0;
      G.pendingMovementsCount = 0; G.entChoicesCount = 0; G.pendingRacePick = null; G.pendingLandmarkRemoval = false;
      G.pendingGreyRemoval = false; G.pendingDiscardTake = false;
      events.endTurn();
    },
  },

  endIf: ({ G }) => {
    if (!G || !G.questTrack) return undefined;
    if (G.questTrack.fellowship >= 14) return { winner: 'FELLOWSHIP', reason: 'Quest of the Ring' };
    if (G.questTrack.sauron >= 14) return { winner: 'SAURON', reason: 'Quest of the Ring' };
    for (const side of ['FELLOWSHIP', 'SAURON'] as Side[]) {
      const player = G.players[side];
      let races = new Set(player.races);
      if (player.tiles.includes('t-hob-3')) races.add('EAGLE');
      if (races.size >= 6) return { winner: side, reason: 'Support of the Races' };
    }
    if (G.map) {
      for (const side of ['FELLOWSHIP', 'SAURON'] as Side[]) {
        if (Object.values(G.map).filter(r => r.units[side] > 0 || r.hasFortress[side]).length === 7) return { winner: side, reason: 'Conquering Middle-earth' };
      }
    }
    // End of Chapter 3 with no cards remaining: determine winner by regional presence
    if (G.currentChapter === 3 && G.pyramid.every(row => row.every(slot => slot.cardId === null))) {
      const fellowshipRegions = Object.values(G.map).filter(r => r.units.FELLOWSHIP > 0 || r.hasFortress.FELLOWSHIP).length;
      const sauronRegions = Object.values(G.map).filter(r => r.units.SAURON > 0 || r.hasFortress.SAURON).length;
      if (fellowshipRegions > sauronRegions) return { winner: 'FELLOWSHIP', reason: 'Regional Presence' };
      if (sauronRegions > fellowshipRegions) return { winner: 'SAURON', reason: 'Regional Presence' };
      return { winner: 'TIE', reason: 'Equal Regional Presence' };
    }
    return undefined;
  },
};
