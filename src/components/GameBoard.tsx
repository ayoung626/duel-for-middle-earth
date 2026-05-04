'use client';

import React, { useState } from 'react';
import { GameState, RaceSymbol, SkillSymbol, Side, Landmark, Card } from '@/game/types';
import { clsx } from 'clsx';
import { calculateCardCost, isCardAvailable, canAffordLandmark, calculateLandmarkCost } from '@/game/Game';
import { 
  TowerControl as Tower, Castle, Coins, Shield, Sword, Anchor, Mountain, Map as MapIcon, Trees, Skull,
  Ship, Bug, PawPrint, TreePine, Leaf, FlaskConical, Hammer, Volume2, Globe, Sprout, Feather,
  Heart, Hand, VenetianMask, BookOpen, Crown, ArrowRight, Target, Backpack, Fish, Anvil, Music, Soup, Magnet, Archive, Flame, Tent, Axe, ScrollText, Clover, Circle
} from 'lucide-react';
import { FaRing, FaMale, FaUndo, FaDragon, FaHorse } from 'react-icons/fa';
import { GiSmokingPipe, GiVisoredHelm } from 'react-icons/gi';

const MAP_COORDS: Record<string, { x: number, y: number }> = {
  LINDON: { x: 20, y: 25 },
  ARNOR: { x: 45, y: 15 },
  ENEDWAITH: { x: 35, y: 45 },
  RHOVANION: { x: 75, y: 25 },
  ROHAN: { x: 60, y: 45 },
  GONDOR: { x: 50, y: 65 },
  MORDOR: { x: 80, y: 60 },
};

const MAP_CONNECTIONS: [string, string][] = [
  ['LINDON', 'ARNOR'],
  ['ARNOR', 'ENEDWAITH'],
  ['ARNOR', 'RHOVANION'],
  ['ENEDWAITH', 'RHOVANION'],
  ['ENEDWAITH', 'ROHAN'],
  ['ENEDWAITH', 'GONDOR'],
  ['RHOVANION', 'ROHAN'],
  ['ROHAN', 'GONDOR'],
  ['ROHAN', 'MORDOR'],
  ['GONDOR', 'MORDOR']
];

interface GameBoardProps {
  G: GameState;
  ctx: any;
  moves: any;
  playerID: string | null;
}

const getCardColorClass = (type: string) => {
  switch (type) {
    case 'GREY': return 'bg-stone-400 border-stone-500 text-stone-900';
    case 'YELLOW': return 'bg-yellow-400 border-yellow-500 text-yellow-950';
    case 'RED': return 'bg-red-600 border-red-700 text-red-50';
    case 'BLUE': return 'bg-blue-600 border-blue-700 text-blue-50';
    case 'GREEN': return 'bg-green-600 border-green-700 text-green-50';
    case 'PURPLE': return 'bg-purple-600 border-purple-700 text-purple-50';
    default: return 'bg-stone-800 border-stone-600 text-stone-100';
  }
};

const getRegionIcon = (regionId: string, size = 12, className = "") => {
  switch(regionId) {
    case 'LINDON': return <Ship size={size} className={className} />;
    case 'ARNOR': return <GiVisoredHelm size={size} className={className} />;
    case 'ENEDWAITH': return <FaDragon size={size} className={className} />;
    case 'GONDOR': return <TreePine size={size} className={className} />;
    case 'ROHAN': return <FaHorse size={size} className={className} />;
    case 'RHOVANION': return <Leaf size={size} className={className} />;
    case 'MORDOR': return <Skull size={size} className={className} />;
    default: return <Shield size={size} className={className} />;
  }
};

const getRaceIcon = (race: RaceSymbol, size = 12, className = "") => {
  switch(race) {
    case 'ELF': return <FlaskConical size={size} className={className} />;
    case 'DWARF': return <Hammer size={size} className={className} />;
    case 'HUMAN': return <FaMale size={size} className={className} />;
    case 'HOBBIT': return <GiSmokingPipe size={size} className={className} />;
    case 'WIZARD': return <Globe size={size} className={className} />;
    case 'ENT': return <Sprout size={size} className={className} />;
    case 'EAGLE': return <Feather size={size} className={className} />;
    default: return null;
  }
};

const getSkillIcon = (skill: SkillSymbol, size = 12) => {
  switch(skill) {
    case 'COURAGE': return <Heart size={size} className="text-red-500 fill-red-500" />;
    case 'STRENGTH': return <Hand size={size} className="text-blue-500 fill-blue-500" />;
    case 'RUSE': return <VenetianMask size={size} className="text-stone-900 fill-stone-900" />;
    case 'KNOWLEDGE': return <BookOpen size={size} className="text-green-600 fill-green-600" />;
    case 'LEADERSHIP': return <Crown size={size} className="text-purple-600 fill-purple-600" />;
    default: return null;
  }
};

const getChainIcon = (symbol: string, size = 12, className = "") => {
  switch(symbol) {
    case 'DAGGER': return <Sword size={size} className={className} />;
    case 'BOW': return <Target size={size} className={className} />;
    case 'HELMET': return <GiVisoredHelm size={size} className={className} />;
    case 'HORSE': return <FaHorse size={size} className={className} />;
    case 'BACKPACK': return <Backpack size={size} className={className} />;
    case 'FISH': return <Fish size={size} className={className} />;
    case 'ANVIL': return <Anvil size={size} className={className} />;
    case 'HARP': return <Music size={size} className={className} />;
    case 'POT': return <Soup size={size} className={className} />;
    case 'HORSESHOE': return <Magnet size={size} className={className} />;
    case 'CHEST': return <Archive size={size} className={className} />;
    case 'FIRE': return <Flame size={size} className={className} />;
    case 'SLEEPING_BAG': return <Tent size={size} className={className} />;
    case 'ARMOR': return <Shield size={size} className={className} />;
    case 'AXE': return <Axe size={size} className={className} />;
    case 'SCROLL': return <ScrollText size={size} className={className} />;
    case 'ACORN': return <Clover size={size} className={className} />;
    default: return <span className="text-[6px]">{symbol}</span>;
  }
};

const getBonusIcon = (space: number) => {
   if (space === 3) return <Coins size={8} />;
   if (space === 6) return <Sword size={8} />;
   if (space === 9) return <FaUndo size={8} />;
   if (space === 12) return <Castle size={8} className="text-red-500" />;
   return null;
};

export const GameBoard: React.FC<GameBoardProps> = ({ G, ctx, moves }) => {
  const currentPlayerSide = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
  const enemySide = currentPlayerSide === 'FELLOWSHIP' ? 'SAURON' : 'FELLOWSHIP';

  const [selectedCard, setSelectedCard] = useState<{rowIndex: number, colIndex: number, cardId: string} | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [moveSourceRegionId, setMoveSourceRegionId] = useState<string | null>(null);

  const selectedFullCard = selectedCard ? G.cardPool[selectedCard.cardId] : null;
  const currentCost = selectedFullCard ? calculateCardCost(selectedFullCard, G.players[currentPlayerSide], G.cardPool) : 0;
  const canAffordCard = selectedFullCard ? G.players[currentPlayerSide].coins >= currentCost : false;

   const isPendingPlacement = G.pendingPlacement !== null;
   const isPendingRemoval = G.pendingRemovalCount > 0;
   const isPendingMovement = G.pendingMovementsCount > 0;
   const isPendingLandmarkRemoval = G.pendingLandmarkRemoval;
   
   const isMapAction = isPendingPlacement || isPendingRemoval || isPendingMovement || isPendingLandmarkRemoval;
  const isModalAction = !!G.pendingRacePick || G.pendingDiscardTake || G.pendingGreyRemoval || G.entChoicesCount > 0;
  const hasAnyPending: boolean = !!(isMapAction || isModalAction);

  const handleCardClick = (rowIndex: number, colIndex: number, cardId: string, available: boolean) => {
    if (hasAnyPending) return;
    if (available) setSelectedCard({ rowIndex, colIndex, cardId });
  };

   const handleRegionClick = (regionId: string) => {
     if (isPendingLandmarkRemoval) {
       // Handled by modal, not map click
     } else if (isPendingPlacement && G.pendingPlacement!.includes(regionId)) {
       moves.placeUnit(regionId);
     } else if (isPendingRemoval) {
       if (G.map[regionId].units[enemySide] > 0) moves.removeUnit({ regionId, side: enemySide });
     } else if (isPendingMovement) {
       if (!moveSourceRegionId) {
         if (G.map[regionId].units[currentPlayerSide] > 0) setMoveSourceRegionId(regionId);
       } else {
         if (regionId === moveSourceRegionId) setMoveSourceRegionId(null);
         else { moves.moveUnit({ fromRegionId: moveSourceRegionId, toRegionId: regionId }); setMoveSourceRegionId(null); }
       }
     }
   };

  const renderCardEffect = (card: Card) => {
      if (card.type === 'BLUE') {
          return (
              <div className="flex gap-0.5 justify-center mt-1">
                  {Array.from({ length: card.bonus?.quest || 0 }).map((_, i) => <FaRing key={i} size={14} className="text-yellow-400 drop-shadow shadow-black" />)}
              </div>
          );
      }
      if (card.type === 'RED') {
          return (
              <div className="flex gap-1 justify-center items-center mt-1 font-black bg-black/20 rounded p-0.5 w-fit mx-auto shadow-inner">
                  {card.bonus?.placement?.[0] && getRegionIcon(card.bonus.placement[0], 12, "text-red-200")}
                  {card.bonus?.placementCount && <span className="text-[8px] text-red-200 opacity-90 px-0.5">{'<'}{card.bonus.placementCount}{'>'}</span>}
                  {card.bonus?.placement?.[1] && getRegionIcon(card.bonus.placement[1], 12, "text-red-200")}
              </div>
          );
      }
      if (card.type === 'GREEN') {
          return (
              <div className="flex justify-center mt-1">
                  {card.bonus?.race && getRaceIcon(card.bonus.race, 18, "text-green-950 drop-shadow-md")}
              </div>
          );
      }
      if (card.type === 'YELLOW') {
          return (
              <div className="flex justify-center items-center gap-1 mt-1 font-black text-sm text-yellow-950 drop-shadow-sm">
                  <Coins size={16} className="fill-yellow-600" /> <span className="text-[12px]">x</span> {card.bonus?.coins || 0}
              </div>
          );
      }
      if (card.type === 'GREY') {
          if (card.bonus?.wildSkills) {
               return (
                   <div className="flex justify-center items-center mt-1 bg-stone-200 rounded-full px-1.5 py-0.5 shadow-inner w-fit mx-auto border border-stone-300">
                       {card.bonus.wildSkills[0].map((s, i) => (
                           <React.Fragment key={i}>
                               {i > 0 && <span className="text-[8px] font-black text-stone-400 mx-0.5">/</span>}
                               {getSkillIcon(s, 12)}
                           </React.Fragment>
                       ))}
                   </div>
               );
          }
          return (
              <div className="flex justify-center gap-1 mt-1 bg-stone-200 rounded-full px-1.5 py-0.5 shadow-inner w-fit mx-auto border border-stone-300">
                  {card.bonus?.skills?.map((s, i) => (
                      <div key={i}>{getSkillIcon(s, 12)}</div>
                  ))}
              </div>
          );
      }
      if (card.type === 'PURPLE') {
          return (
              <div className="flex justify-center gap-1.5 mt-1 text-purple-200 flex-wrap px-1">
                  {Array.from({ length: card.bonus?.movements || 0 }).map((_, i) => <ArrowRight key={`m${i}`} size={12} className="drop-shadow text-blue-300" />)}
                  {Array.from({ length: card.bonus?.removeEnemyUnits || 0 }).map((_, i) => <Skull key={`k${i}`} size={12} className="text-red-400 drop-shadow" />)}
                  {Array.from({ length: card.bonus?.removeEnemyCoins || 0 }).map((_, i) => (
                      <div key={`c${i}`} className="relative drop-shadow">
                          <Coins size={12} className="text-yellow-500 opacity-60"/>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-500 font-black">X</div>
                      </div>
                  ))}
              </div>
          );
      }
      return null;
  };

  const renderCardCost = (card: Card) => {
      if (card.cost.coins === 0 && card.cost.skills.length === 0) return null;
      return (
          <div className="flex justify-center items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5 w-fit mx-auto border border-white/10 shadow-lg">
              {card.cost.coins > 0 && <div className="bg-yellow-500 text-yellow-950 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black border border-yellow-700 shadow-inner">{card.cost.coins}</div>}
              {card.cost.skills.map((s, i) => (
                  <div key={i} className="bg-stone-200 rounded-full w-4 h-4 flex items-center justify-center p-[1px] border border-stone-400 shadow-inner">
                      {getSkillIcon(s, 10)}
                  </div>
              ))}
          </div>
      );
  };

  const renderPlayerPanel = (side: Side) => {
    const p = G.players[side];
    const chains = Array.from(new Set(p.cards.map(cId => G.cardPool[cId]?.chainingSymbol).filter(Boolean)));
    const isActive = currentPlayerSide === side;

    return (
      <div className={clsx(
        "p-3 rounded-xl border-2 w-72 shadow-xl transition-all flex flex-col gap-2 relative",
        side === 'FELLOWSHIP' ? "bg-yellow-950/30 border-yellow-700/50" : "bg-red-950/30 border-red-900/50",
        isActive ? "ring-2 ring-white/20 scale-105" : "opacity-60"
      )}>
        <div className="flex justify-between items-center border-b border-white/10 pb-1">
           <h2 className={clsx("font-black tracking-widest text-sm flex items-center gap-2", side === 'FELLOWSHIP' ? "text-yellow-500" : "text-red-500")}>
             {side === 'FELLOWSHIP' ? <Shield size={14}/> : <Skull size={14}/>} {side}
           </h2>
           <div className="flex items-center gap-1 text-lg font-mono font-black bg-black/40 px-2 py-0.5 rounded-full border border-yellow-900/50">
              {p.coins} <Coins className="text-yellow-500" size={14} />
           </div>
        </div>

        <div className="flex justify-between items-start mt-1 gap-2">
           {/* Left side: Races & Tiles */}
           <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex flex-wrap gap-1 bg-black/20 p-1 rounded-lg border border-white/5 min-h-[26px]">
                 {p.races.map((r, i) => (
                   <div key={i} className="bg-stone-800 p-1 rounded-full border border-stone-600 shadow-inner">
                     {getRaceIcon(r as RaceSymbol, 10, "text-stone-300")}
                   </div>
                 ))}
                 {p.races.length === 0 && <span className="text-[6px] text-stone-500 uppercase font-black m-auto tracking-widest">Races</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                 {p.tiles.map(tId => {
                   let r: RaceSymbol = 'HUMAN';
                   if (tId.includes('ent')) r = 'ENT';
                   if (tId.includes('wiz')) r = 'WIZARD';
                   if (tId.includes('elf')) r = 'ELF';
                   if (tId.includes('hum')) r = 'HUMAN';
                   if (tId.includes('dwa')) r = 'DWARF';
                   if (tId.includes('hob')) r = tId === 't-hob-3' ? 'EAGLE' : 'HOBBIT';
                   return (
                     <div key={tId} className="bg-green-900 p-1.5 rounded-lg border border-green-500 text-green-100 flex items-center justify-center shadow-lg shadow-green-900/50">
                       {getRaceIcon(r, 14)}
                     </div>
                   );
                 })}
              </div>
           </div>
           
           {/* Right side: Chains */}
           <div className="flex flex-col gap-1 w-20 shrink-0">
               <div className="flex flex-wrap justify-end gap-1 bg-black/20 p-1 rounded-lg border border-white/5 min-h-[26px]">
                 {chains.map(c => (
                   <div key={c || 'none'} className="bg-stone-700 p-1 rounded border border-stone-500 text-stone-200 shadow-sm">
                     {getChainIcon(c as string, 10)}
                   </div>
                 ))}
                 {chains.length === 0 && <span className="text-[6px] text-stone-500 uppercase font-black m-auto tracking-widest text-right">Chains</span>}
               </div>
           </div>
        </div>

         {/* Skills (grouped by card + wild skills) */}
         <div className="flex flex-wrap gap-2 mt-auto justify-center bg-black/30 p-1.5 rounded-lg border border-white/5 min-h-[28px]">
            {p.cards.map((cId, ci) => {
              const card = G.cardPool[cId];
              if (!card?.bonus?.skills?.length && !card?.bonus?.wildSkills?.length) return null;
              return (
                <div key={ci} className={clsx(
                  "flex gap-0.5 px-1 py-0.5 rounded border border-white/10 bg-white/5",
                  card.type === 'GREY' ? "border-stone-500" : getCardColorClass(card.type).split(' ')[0]
                )}>
                  {card.bonus?.skills?.map((s, si) => (
                    <div key={si} className="bg-stone-200 rounded-full w-5 h-5 flex items-center justify-center shadow-inner border border-stone-400">
                      {getSkillIcon(s as SkillSymbol, 14)}
                    </div>
                  ))}
                  {card.bonus?.wildSkills?.map((w, wi) => (
                    <div key={`w${wi}`} className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-full w-5 h-5 flex items-center justify-center shadow-inner border border-purple-500" title={`Wild: ${w.join('/')}`}>
                      <span className="text-[8px] font-black text-white">?</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {p.wildSkills.length > 0 && (
              <div className="flex gap-0.5 px-1 py-0.5 rounded border border-purple-500 bg-purple-900/30">
                {p.wildSkills.map((w, wi) => (
                  <div key={`pw${wi}`} className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-full w-5 h-5 flex items-center justify-center shadow-inner border border-purple-500" title={`Wild: ${w.join('/')}`}>
                    <span className="text-[8px] font-black text-white">?</span>
                  </div>
                ))}
              </div>
            )}
            {p.cards.length === 0 && <span className="text-[6px] text-stone-500 uppercase font-black m-auto tracking-widest">Skills</span>}
         </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-stone-900 text-stone-100 p-2 flex flex-col gap-2 font-serif select-none overflow-hidden relative">
      
      {/* 29-Slot Sliding Quest Track */}
      <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700 flex flex-col items-center shadow-lg shrink-0">
        <h3 className="text-[8px] font-bold mb-1 text-stone-500 uppercase tracking-[0.2em]">Quest of the Ring</h3>
        <div className="flex w-full max-w-4xl gap-0.5 justify-center">
          {Array.from({ length: 29 }).map((_, i) => {
             const isPiece3 = i >= 14;
             const piece3Space = i - 14;
             
             const isPiece2 = i >= G.questTrack.fellowship && i <= G.questTrack.fellowship + 14;
             const piece2Space = i - G.questTrack.fellowship;
             
             const isNazgul = isPiece2 && piece2Space === G.questTrack.sauron;
             const isFrodoSam = isPiece2 && piece2Space === 14;
             const isMountDoom = i === 28;

             return (
                <div key={i} className="flex-1 flex flex-col gap-0.5 items-center min-w-[14px]">
                   {/* Piece 2 (Sauron Track) */}
                   <div className={clsx(
                       "w-full h-5 rounded-t transition-all relative flex items-center justify-center border-t border-x border-b border-b-stone-900", 
                       isPiece2 ? "bg-red-950/60 border-red-900/50" : "border-transparent"
                    )}>
                       {isPiece2 && (
                           <>
                               <div className="opacity-40 text-red-400">{getBonusIcon(piece2Space)}</div>
                               {isNazgul && <div className="absolute inset-0 bg-red-600 shadow-[0_0_8px_red] rounded z-20 flex items-center justify-center text-white text-[8px] font-black border border-red-400">S</div>}
                               {isFrodoSam && <div className="absolute inset-0 bg-yellow-500 shadow-[0_0_8px_yellow] rounded-t z-20 flex items-center justify-center text-stone-900 text-[8px] font-black border-t border-x border-yellow-300">F</div>}
                           </>
                       )}
                   </div>

                   {/* Piece 3 (Fellowship Track) */}
                   <div className={clsx(
                       "w-full h-5 rounded-b transition-all relative flex items-center justify-center border-b border-x", 
                       isPiece3 ? "bg-stone-800 border-stone-700" : "border-transparent"
                    )}>
                       {isPiece3 && (
                           <>
                               <div className="opacity-40 text-stone-400">{getBonusIcon(piece3Space)}</div>
                               {isMountDoom && <div className="absolute inset-0 bg-orange-600 rounded flex items-center justify-center text-white text-[7px] font-black border border-orange-400 animate-pulse">DOOM</div>}
                           </>
                       )}
                   </div>
                </div>
             );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 relative">
        
        {/* Map-based Action Banner (Non-blocking) */}
         {isMapAction && !isModalAction && (
           <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-600 border border-red-400 px-8 py-3 rounded-full shadow-2xl z-50 pointer-events-none flex flex-col items-center">
              <h2 className="font-black tracking-widest text-xs uppercase text-white shadow-sm">
                   {isPendingPlacement && `DEPLOY ${G.pendingPlacementCount} UNIT${G.pendingPlacementCount > 1 ? 'S' : ''}`}
                   {isPendingRemoval && `REMOVE ${G.pendingRemovalCount} ENEMY UNITS`}
                   {isPendingMovement && `MANEUVER ${G.pendingMovementsCount} TROOPS`}
                   {isPendingLandmarkRemoval && `DESTROY ENEMY LANDMARK`}
              </h2>
              <p className="text-[7px] uppercase font-bold text-red-100 opacity-80 mt-0.5">Click the map to execute actions</p>
              <button 
                onClick={(e) => { e.stopPropagation(); moves.skipPendingActions(); }} 
                className="mt-2 bg-white/20 hover:bg-white/30 text-white text-[7px] px-3 py-1 rounded-full pointer-events-auto font-black uppercase tracking-tighter"
              >
                  Skip Actions
              </button>
          </div>
        )}

        {/* Visual Map Area */}
        <div className="col-span-5 bg-[#c8b696] rounded-xl border-4 border-[#5c4a3d] flex flex-col relative shadow-inner overflow-hidden" style={{ backgroundImage: 'radial-gradient(#8b7355 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
           <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
               {MAP_CONNECTIONS.map(([a, b]) => (
                   <line key={`${a}-${b}`} x1={`${MAP_COORDS[a].x}%`} y1={`${MAP_COORDS[a].y}%`} x2={`${MAP_COORDS[b].x}%`} y2={`${MAP_COORDS[b].y}%`} stroke="#5c4a3d" strokeWidth="4" strokeLinecap="round" />
               ))}
           </svg>
           
             {Object.values(G.map).map(region => {
               const isHighlighted = (isPendingPlacement && G.pendingPlacement?.includes(region.id)) || 
                                      (isPendingRemoval && region.units[enemySide] > 0) ||
                                      (isPendingMovement && (!moveSourceRegionId ? region.units[currentPlayerSide] > 0 : G.map[moveSourceRegionId].adjacent.includes(region.id)));

             const coords = MAP_COORDS[region.id];

             return (
              <div key={region.id} className="absolute flex items-center gap-1 -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${coords.x}%`, top: `${coords.y}%` }}>
                 <div 
                   onClick={() => handleRegionClick(region.id)}
                   className={clsx(
                     "w-24 p-1 rounded border-2 transition-all cursor-pointer relative shadow-lg",
                     isHighlighted ? "ring-4 ring-red-600 bg-[#e8d6b6] border-red-800 scale-110 z-20" : moveSourceRegionId === region.id ? "ring-4 ring-yellow-400 bg-[#e8d6b6] border-yellow-700 scale-110 z-20" : "bg-[#dfcdab] border-[#8b7355] hover:bg-[#e8d6b6] hover:scale-105"
                   )}
                 >
                    <div className="flex justify-between items-center mb-1 border-b border-[#a89375] pb-0.5">
                       <div className="flex items-center gap-1 text-[#4a3928]">
                          {getRegionIcon(region.id)}
                          <span className="text-[7px] font-black uppercase tracking-tight">{region.name}</span>
                       </div>
                       <div className="flex gap-0.5">
                          {region.hasFortress.FELLOWSHIP && <Castle size={8} className="text-yellow-600 drop-shadow-sm" />}
                          {region.hasFortress.SAURON && <Castle size={8} className="text-red-600 drop-shadow-sm" />}
                       </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                       <div className="flex items-center gap-1 bg-stone-900 px-1 rounded-sm shadow-inner">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          <span className="text-[8px] font-mono font-black text-yellow-100">{region.units.FELLOWSHIP}</span>
                       </div>
                       <div className="flex items-center gap-1 bg-stone-900 px-1 rounded-sm shadow-inner">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          <span className="text-[8px] font-mono font-black text-red-100">{region.units.SAURON}</span>
                       </div>
                    </div>
                 </div>
              </div>
             );
           })}
           
           {/* Floating Landmarks */}
           <div className="absolute bottom-2 left-2 right-2 bg-stone-900/80 backdrop-blur-sm p-2 rounded-xl border border-stone-600 z-30 flex flex-col gap-1 shadow-2xl">
              <h4 className="text-[7px] font-black text-stone-400 uppercase tracking-widest mb-1 pl-1">Available Landmarks</h4>
              <div className="flex gap-2 justify-center">
                {G.availableLandmarks.map(id => {
                  const l = G.landmarks.find(landmark => landmark.id === id);
                  if (!l || l.builtBy !== null) return null;
                  
                  const cost = calculateLandmarkCost(l, G.players[currentPlayerSide]);
                  const canAfford = canAffordLandmark(l, G.players[currentPlayerSide]);

                  return (
                    <button 
                        key={l.id} 
                        disabled={hasAnyPending || !canAfford}
                        onClick={() => setSelectedLandmark(l)} 
                        className={clsx(
                            "flex-1 p-1.5 bg-stone-800 border rounded transition-all text-left flex flex-col justify-between",
                            hasAnyPending ? "opacity-30 border-stone-700 cursor-not-allowed" : canAfford ? "border-yellow-600 hover:bg-stone-700 shadow-md" : "border-stone-700 opacity-60 hover:bg-stone-800"
                        )}
                    >
                       <div className="flex justify-between items-start mb-1">
                           <div className="text-[8px] font-black uppercase text-yellow-500">{G.map[l.regionId]?.name}: {l.name}</div>
                           <div className="flex gap-0.5 flex-wrap justify-end w-12">
                              {l.cost.map((s, i) => (
                                 <div key={i} className="bg-stone-200 rounded-full w-2.5 h-2.5 flex items-center justify-center p-[1px] shadow-sm">
                                    {getSkillIcon(s, 6)}
                                 </div>
                              ))}
                           </div>
                       </div>
                       <div className="text-[5px] text-stone-400 leading-tight line-clamp-2">{l.description}</div>
                    </button>
                  )
                })}
              </div>
           </div>
        </div>

        {/* Pyramid Center */}
         <div className="col-span-7 flex flex-col items-center p-2 bg-stone-950/40 rounded-2xl border border-stone-800/40 shadow-inner h-full relative overflow-y-auto">
           <div className="flex flex-col items-center mx-auto pt-4 pb-8">
              {G.pyramid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3 mb-[-24px] relative" style={{ zIndex: rowIndex }}>
                      {row.map((slot, colIndex) => {
                          if (!slot.cardId) return <div key={colIndex} className="w-20 h-28 invisible" />;
                          const available = isCardAvailable(G.pyramid, rowIndex, colIndex, G.currentChapter);
                          const card = G.cardPool[slot.cardId];
                          if (!card) return null;
                          
                          return (
                              <div 
                                key={colIndex} 
                                onClick={() => handleCardClick(rowIndex, colIndex, slot.cardId!, available)} 
                                className={clsx(
                                  "w-20 h-28 rounded-lg border-2 shadow-xl flex flex-col text-center p-1 cursor-pointer transition-all relative overflow-hidden",
                                  available ? "hover:scale-110 border-white/20 z-50 ring-2 ring-white/5" : "opacity-80 grayscale-[0.6] border-stone-800 scale-95",
                                  slot.isFaceUp ? getCardColorClass(card.type) : "bg-[repeating-linear-gradient(45deg,#1c1917,#1c1917_10px,#292524_10px,#292524_20px)]"
                                )}
                              >
                                  {slot.isFaceUp ? (
                                    <>
                                       {card.chainsFrom && (
                                          <div className="absolute bottom-0.5 left-0.5 bg-black/50 p-0.5 rounded shadow">
                                             {getChainIcon(card.chainsFrom, 8, "text-stone-300 drop-shadow")}
                                          </div>
                                       )}
                                       {card.chainingSymbol && (
                                          <div className="absolute top-0.5 right-0.5 bg-black/50 p-0.5 rounded shadow">
                                             {getChainIcon(card.chainingSymbol, 8, "text-stone-300 drop-shadow")}
                                          </div>
                                       )}
                                       <div className="pt-1.5 flex-none">
                                          {renderCardEffect(card)}
                                       </div>
                                       <div className="flex-1 flex flex-col justify-center items-center">
                                          {renderCardCost(card)}
                                       </div>
                                    </>
                                  ) : <div className="text-stone-800 font-bold text-3xl opacity-10 flex items-center justify-center h-full">?</div>}
                              </div>
                          );
                      })}
                  </div>
              ))}
          </div>
        </div>
      </div>

       {/* Bottom Separation - Players */}
       <div className="flex justify-between items-start shrink-0 pt-1 border-t border-stone-800 gap-2">
          {renderPlayerPanel('FELLOWSHIP')}
          <div className="flex-1 max-w-md mx-2 mt-1">
             <div className="bg-stone-900/60 rounded-lg border border-stone-700 p-1.5 h-24 overflow-y-auto">
                <div className="flex flex-col gap-0.5">
                   {G.log.slice(-6).reverse().map((entry, i) => (
                      <div key={i} className="text-[8px] text-stone-400 font-mono leading-tight truncate">{entry}</div>
                   ))}
                </div>
             </div>
          </div>
          {renderPlayerPanel('SAURON')}
       </div>

      {/* MODAL OVERLAYS (Only for self-contained choices) */}
      {isModalAction && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-md">
           <div className="bg-stone-800 border-2 border-stone-600 p-6 rounded-3xl shadow-2xl max-w-lg w-full text-center">
              {G.pendingRacePick === 'GREY_HAVENS_CHOOSE_RACE' && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Grey Havens: Choose a Race</h2>
                   <div className="grid grid-cols-3 gap-3">
                      {(['DWARF', 'ELF', 'HOBBIT', 'HUMAN', 'ENT', 'WIZARD'] as RaceSymbol[]).map(r => (
                        <button key={r} onClick={() => moves.greyHavensChooseRace(r)} className="bg-stone-900 border border-stone-700 p-4 rounded-xl font-bold hover:bg-stone-700 transition-all uppercase tracking-widest text-xs flex flex-col items-center gap-2">
                           {getRaceIcon(r, 24, "text-stone-300")} {r}
                        </button>
                      ))}
                   </div>
                </div>
              )}
              {(G.pendingRacePick === 'DUPLICATE' || G.pendingRacePick === 'UNIQUE_3' || G.pendingRacePick === 'GREY_HAVENS_PICK_TILE') && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-green-500">Acquire Race Tile</h2>
                   <div className="flex gap-3 justify-center">
                      {G.pendingRaceSelectionPool.map(tile => (
                        <button key={tile.id} onClick={() => moves.selectRaceTile(tile.id)} className="bg-stone-900 border-2 border-stone-700 p-4 rounded-2xl w-48 hover:border-green-500 transition-all text-left flex items-start gap-3">
                          <div className="bg-stone-800 p-2 rounded-lg border border-stone-600 shadow-inner">
                             {getRaceIcon(tile.race, 24, "text-stone-300")}
                          </div>
                          <div>
                             <div className="font-black text-yellow-500 text-sm uppercase mb-1">{tile.name}</div>
                             <div className="text-[10px] opacity-60 leading-tight italic">{tile.description}</div>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>
              )}
              {G.pendingDiscardTake && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Take a Card from Discard</h2>
                   <div className="flex flex-wrap gap-2 justify-center max-h-96 overflow-y-auto p-4">
                       {G.discardPile.filter(cId => G.cardPool[cId]).map(cId => {
                         const card = G.cardPool[cId];
                         return (
                           <div key={cId} onClick={() => moves.takeDiscardCard(cId)} className={clsx("w-20 h-28 rounded-lg border-2 shadow-xl flex flex-col text-center p-1 cursor-pointer transition-all relative overflow-hidden hover:scale-110 ring-2 ring-white/5 z-10", getCardColorClass(card.type))}>
                              {card.chainsFrom && (
                                <div className="absolute bottom-0.5 left-0.5 bg-black/50 p-0.5 rounded shadow">
                                   {getChainIcon(card.chainsFrom, 8, "text-stone-300 drop-shadow")}
                                </div>
                              )}
                              {card.chainingSymbol && (
                                <div className="absolute top-0.5 right-0.5 bg-black/50 p-0.5 rounded shadow">
                                   {getChainIcon(card.chainingSymbol, 8, "text-stone-300 drop-shadow")}
                                </div>
                              )}
                              <div className="pt-1.5 flex-none">
                                 {renderCardEffect(card)}
                              </div>
                              <div className="flex-1 flex flex-col justify-center items-center">
                                 {renderCardCost(card)}
                              </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}
              {G.pendingGreyRemoval && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-red-500">Remove Enemy Grey Card</h2>
                   <div className="flex gap-2 justify-center flex-wrap p-4">
                       {G.players[enemySide].cards.filter(cId => G.cardPool[cId]?.type === 'GREY').map(cId => {
                         const card = G.cardPool[cId];
                         return (
                            <div key={cId} onClick={() => moves.removeGreyCard(cId)} className={clsx("w-20 h-28 rounded-lg border-2 shadow-xl flex flex-col text-center p-1 cursor-pointer transition-all relative overflow-hidden hover:scale-110 hover:border-red-500 ring-2 ring-red-500/20 z-10", getCardColorClass(card.type))}>
                                <div className="pt-1.5 flex-none">
                                   {renderCardEffect(card)}
                                </div>
                                <div className="flex-1 flex flex-col justify-center items-center">
                                   {renderCardCost(card)}
                                </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
              )}
              {G.entChoicesCount > 0 && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-green-500">Ent Conclave ({G.entChoicesCount} Remaining)</h2>
                   <div className="flex gap-4 justify-center">
                      <button onClick={() => moves.entChoice('KILL')} className="bg-stone-900 border-2 border-red-900 hover:border-red-500 p-6 rounded-2xl flex flex-col items-center gap-2 transition-all">
                         <Skull size={32} className="text-red-500" />
                         <span className="font-black text-xs uppercase tracking-widest text-red-200">Kill 1 Enemy Unit</span>
                      </button>
                      <button onClick={() => moves.entChoice('STEAL')} className="bg-stone-900 border-2 border-yellow-900 hover:border-yellow-500 p-6 rounded-2xl flex flex-col items-center gap-2 transition-all">
                         <Coins size={32} className="text-yellow-500" />
                         <span className="font-black text-xs uppercase tracking-widest text-yellow-200">Steal 1 Coin</span>
                      </button>
                      <button onClick={() => moves.entChoice('MOVE')} className="bg-stone-900 border-2 border-blue-900 hover:border-blue-500 p-6 rounded-2xl flex flex-col items-center gap-2 transition-all">
                         <ArrowRight size={32} className="text-blue-500" />
                         <span className="font-black text-xs uppercase tracking-widest text-blue-200">Maneuver 1 Troop</span>
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Selected Card Modal */}
      {selectedCard && selectedFullCard && !hasAnyPending && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedCard(null)}>
          <div className="bg-stone-800 border-2 border-stone-600 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={clsx("w-56 h-80 border-4 rounded-2xl shadow-2xl flex flex-col p-2 relative overflow-hidden mb-8", getCardColorClass(selectedFullCard.type))}>
               {selectedFullCard.chainsFrom && (
                  <div className="absolute bottom-2 left-2 bg-black/50 p-1.5 rounded-lg shadow-lg">
                     {getChainIcon(selectedFullCard.chainsFrom, 16, "text-stone-300 drop-shadow-md")}
                  </div>
               )}
               {selectedFullCard.chainingSymbol && (
                  <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg shadow-lg">
                     {getChainIcon(selectedFullCard.chainingSymbol, 16, "text-stone-300 drop-shadow-md")}
                  </div>
               )}
               <div className="flex-none flex flex-col justify-center transform scale-150 pt-12 pb-4">
                  {renderCardEffect(selectedFullCard)}
               </div>
               <div className="flex-1 flex items-center justify-center transform scale-125 mb-4">
                  {renderCardCost(selectedFullCard)}
               </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <button className="flex-1 bg-stone-700 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-stone-600 transition-all shadow-lg" onClick={() => { moves.discardCard({ rowIndex: selectedCard.rowIndex, colIndex: selectedCard.colIndex }); setSelectedCard(null); }}>Discard</button>
              <button className={clsx("flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg", canAffordCard ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-50 shadow-yellow-900/50" : "bg-stone-800 text-stone-600 opacity-50 cursor-not-allowed")} disabled={!canAffordCard} onClick={() => { moves.takeCard({ rowIndex: selectedCard.rowIndex, colIndex: selectedCard.colIndex }); setSelectedCard(null); }}>{canAffordCard ? `Acquire (${currentCost} C)` : 'Not Enough Gold'}</button>
            </div>
            <button className="mt-6 text-[10px] text-stone-500 uppercase tracking-widest font-bold hover:text-stone-300 transition-colors" onClick={() => setSelectedCard(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Landmark Modal */}
      {selectedLandmark && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedLandmark(null)}>
          <div className="bg-stone-800 border-2 border-stone-600 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-full text-center mb-6">
               <Tower className="mx-auto mb-4 text-yellow-500" size={48} />
                <h2 className="text-2xl font-black uppercase tracking-widest text-yellow-500 mb-2">{G.map[selectedLandmark.regionId]?.name}: {selectedLandmark.name}</h2>
               <div className="bg-black/30 p-3 rounded-xl border border-stone-700 shadow-inner">
                  <p className="text-xs text-stone-300 leading-relaxed italic">{selectedLandmark.description}</p>
               </div>
            </div>
            
            <div className="w-full bg-stone-900 rounded-xl p-4 mb-8 border border-stone-700 shadow-inner">
                <div className="text-[10px] uppercase text-stone-500 font-black mb-3 tracking-widest text-center">Required Skills to Build</div>
                <div className="flex flex-wrap gap-2 justify-center">
                   {selectedLandmark.cost.map((s, i) => (
                     <div key={i} className="bg-stone-200 rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-stone-400">
                        {getSkillIcon(s, 20)}
                     </div>
                   ))}
                   {[...Array(G.players[currentPlayerSide].builtLandmarks.length)].map((_, i) => (
                     <div key={`extra-${i}`} className="bg-red-950 rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-red-800 text-[10px] font-black text-red-200">
                        ANY
                     </div>
                   ))}
                </div>
            </div>

            <div className="flex gap-3 w-full">
              <button className="flex-1 bg-stone-700 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-stone-600 transition-all shadow-lg" onClick={() => setSelectedLandmark(null)}>Cancel</button>
              <button 
                disabled={!canAffordLandmark(selectedLandmark, G.players[currentPlayerSide])}
                className={clsx(
                  "flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg",
                  canAffordLandmark(selectedLandmark, G.players[currentPlayerSide]) ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-50 shadow-yellow-900/50" : "bg-stone-800 text-stone-600 opacity-50 cursor-not-allowed"
                )}
                onClick={() => { moves.buildLandmark(selectedLandmark.id); setSelectedLandmark(null); }}
              >
                Build ({calculateLandmarkCost(selectedLandmark, G.players[currentPlayerSide])} C)
              </button>
            </div>
          </div>
        </div>
        )}

       {/* Landmark Removal Modal */}
       {G.pendingLandmarkRemoval && (
         <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-stone-800 border-2 border-stone-600 rounded-3xl p-8 flex flex-col items-center max-w-2xl w-full shadow-2xl">
             <Tower className="mx-auto mb-4 text-red-500" size={48} />
             <h2 className="text-2xl font-black uppercase tracking-widest text-red-500 mb-6">Remove Enemy Landmark</h2>
             <div className="grid grid-cols-3 gap-3 w-full">
               {G.landmarks.filter(l => l.builtBy === enemySide).map(l => (
                 <button key={l.id} onClick={() => moves.removeLandmark(l.id)} className="bg-stone-900 border-2 border-stone-700 p-4 rounded-xl hover:border-red-500 transition-all text-left">
                   <div className="font-black text-yellow-500 text-sm uppercase mb-1">{G.map[l.regionId]?.name}: {l.name}</div>
                   <div className="text-[10px] text-stone-400">{l.description}</div>
                 </button>
               ))}
             </div>
           </div>
         </div>
       )}

       {/* Game Over Screen */}
       {ctx.gameover && (
         <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-lg">
            <div className="text-center">
               <div className={clsx(
                 "text-6xl font-black mb-4 uppercase tracking-widest",
                 ctx.gameover.winner === 'FELLOWSHIP' ? "text-yellow-500" : "text-red-500"
               )}>
                 {ctx.gameover.winner} Wins!
               </div>
               <div className="text-xl text-stone-300 mb-8">{ctx.gameover.reason}</div>
               <div className="text-sm text-stone-500">Game Over</div>
            </div>
         </div>
       )}
     </div>
   );
};
