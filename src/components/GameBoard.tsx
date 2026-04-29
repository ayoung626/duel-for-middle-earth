'use client';

import React, { useState } from 'react';
import { GameState, RaceSymbol, SkillSymbol, Side, Landmark, Card } from '@/game/types';
import { clsx } from 'clsx';
import { calculateCardCost, isCardAvailable, canAffordLandmark, calculateLandmarkCost } from '@/game/Game';
import { TowerControl as Tower, Castle, Coins, Shield, Sword, Anchor, Mountain, Map, Trees, Skull } from 'lucide-react';

interface GameBoardProps {
  G: GameState;
  ctx: any;
  moves: any;
  playerID: string | null;
}

const getCardColorClass = (type: string) => {
  switch (type) {
    case 'GREY': return 'bg-stone-300 border-stone-400 text-stone-900';
    case 'YELLOW': return 'bg-yellow-400 border-yellow-500 text-yellow-950';
    case 'RED': return 'bg-red-600 border-red-700 text-red-50';
    case 'BLUE': return 'bg-blue-600 border-blue-700 text-blue-50';
    case 'GREEN': return 'bg-green-600 border-green-700 text-green-50';
    case 'PURPLE': return 'bg-purple-600 border-purple-700 text-purple-50';
    default: return 'bg-stone-800 border-stone-600 text-stone-100';
  }
};

const getRegionIcon = (regionId: string) => {
  switch(regionId) {
    case 'LINDON': return <Anchor size={12} />;
    case 'ARNOR': return <Map size={12} />;
    case 'ENEDWAITH': return <Trees size={12} />;
    case 'GONDOR': return <Castle size={12} />;
    case 'ROHAN': return <Sword size={12} />;
    case 'RHOVANION': return <Mountain size={12} />;
    case 'MORDOR': return <Skull size={12} />;
    default: return <Shield size={12} />;
  }
}

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
  
  const isMapAction = isPendingPlacement || isPendingRemoval || isPendingMovement;
  const isModalAction = !!G.pendingRacePick || G.pendingDiscardTake || G.pendingGreyRemoval || G.entChoicesCount > 0;
  const hasAnyPending: boolean = !!(isMapAction || isModalAction);

  const handleCardClick = (rowIndex: number, colIndex: number, cardId: string, available: boolean) => {
    if (hasAnyPending) return;
    if (available) setSelectedCard({ rowIndex, colIndex, cardId });
  };

  const handleRegionClick = (regionId: string) => {
    if (isPendingPlacement && G.pendingPlacement!.includes(regionId)) {
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

  const renderPlayerPanel = (side: Side) => {
    const p = G.players[side];
    const skills: Record<SkillSymbol, number> = { RUSE: 0, COURAGE: 0, STRENGTH: 0, KNOWLEDGE: 0, LEADERSHIP: 0 };
    p.skills.forEach(s => skills[s]++);
    const chains = Array.from(new Set(p.cards.map(cId => G.cardPool[cId]?.chainingSymbol).filter(Boolean)));
    const isActive = currentPlayerSide === side;

    return (
      <div className={clsx(
        "p-3 rounded-xl border-2 w-64 shadow-xl transition-all flex flex-col gap-2",
        side === 'FELLOWSHIP' ? "bg-yellow-950/20 border-yellow-700/50" : "bg-red-950/20 border-red-900/50",
        isActive ? "ring-2 ring-white/20 scale-105" : "opacity-60"
      )}>
        <div className="flex justify-between items-center">
           <h2 className={clsx("font-black tracking-widest text-sm", side === 'FELLOWSHIP' ? "text-yellow-500" : "text-red-600")}>{side}</h2>
           <div className="flex items-center gap-1 text-lg font-mono font-bold">
              <Coins className="text-yellow-500" size={16} />
              {p.coins}
           </div>
        </div>

        <div className="grid grid-cols-5 gap-0.5">
           {Object.entries(skills).map(([s, count]) => (
             <div key={s} className="bg-black/40 rounded flex flex-col items-center py-0.5 border border-stone-700/50">
                <span className="text-[6px] uppercase text-stone-500 font-bold">{s.substring(0,1)}</span>
                <span className="text-[10px] font-bold text-stone-100">{count}</span>
             </div>
           ))}
        </div>

        <div className="bg-black/30 p-1 rounded-lg border border-stone-800 min-h-8 flex flex-wrap gap-1 content-start">
           {chains.map(c => (
             <span key={c || 'none'} className="bg-stone-700 text-[6px] px-1 py-0.5 rounded text-stone-200 border border-stone-600 uppercase font-black">{c ? c.substring(0,3) : ''}</span>
           ))}
        </div>

        <div className="flex flex-wrap gap-1 min-h-4">
           {p.tiles.map(tId => (
             <span key={tId} className="bg-green-900 text-[6px] px-1.5 rounded-full font-bold uppercase text-green-100 border border-green-600">
               {tId.split('-').pop()}
             </span>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-stone-900 text-stone-100 p-2 flex flex-col gap-2 font-serif select-none overflow-hidden relative">
      
      {/* Horizontal Quest Track */}
      <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700 flex flex-col items-center shadow-lg shrink-0">
        <h3 className="text-[8px] font-bold mb-1 text-stone-500 uppercase tracking-[0.2em]">Quest of the Ring</h3>
        <div className="flex justify-between w-full max-w-4xl px-8 relative h-3 items-center bg-stone-950/50 rounded-full border border-stone-700/50">
          {[...Array(13)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative h-full justify-center">
              <div className="w-0.5 h-1.5 bg-stone-700 rounded-full" />
              <span className={clsx("text-[7px] absolute -bottom-3 font-mono", (i === 12) ? "text-yellow-500 font-bold" : "text-stone-600")}>{i}</span>
              {G.questTrack.fellowship === i && (
                 <div className="absolute -top-1 w-5 h-5 bg-yellow-500 rounded-full z-20 flex items-center justify-center text-stone-950 font-black text-[9px] shadow-lg border border-stone-900">F</div>
              )}
              {G.questTrack.sauron === i && (
                 <div className="absolute -top-1 w-5 h-5 bg-red-600 rounded-full z-10 flex items-center justify-center text-white font-black text-[9px] shadow-lg border border-stone-900">S</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 relative">
        
        {/* Map-based Action Banner (Non-blocking) */}
        {isMapAction && !isModalAction && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-600 border border-red-400 px-8 py-3 rounded-full shadow-2xl z-50 animate-bounce pointer-events-none flex flex-col items-center">
              <h2 className="font-black tracking-widest text-xs uppercase text-white shadow-sm">
                  {isPendingPlacement && `DEPLOY ${G.pendingPlacementCount} UNITS`}
                  {isPendingRemoval && `REMOVE ${G.pendingRemovalCount} ENEMY UNITS`}
                  {isPendingMovement && `MANEUVER ${G.pendingMovementsCount} TROOPS`}
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

        {/* Map Sidebar */}
        <div className="col-span-3 bg-stone-800/40 p-2 rounded-xl border border-stone-700/50 flex flex-col gap-1 overflow-y-auto scrollbar-hide shadow-inner">
           {Object.values(G.map).map(region => {
             const isHighlighted = (isPendingPlacement && G.pendingPlacement?.includes(region.id)) || 
                                    (isPendingRemoval && region.units[enemySide] > 0) ||
                                    (isPendingMovement && (!moveSourceRegionId ? region.units[currentPlayerSide] > 0 : region.id !== moveSourceRegionId));

             return (
              <div key={region.id} className="flex items-center gap-2">
                 <div className="flex flex-col gap-0.5 w-5 shrink-0">
                    {G.landmarks.filter(l => l.regionId === region.id && l.builtBy !== null).map(l => (
                      <div key={l.id} className={clsx("p-1 rounded", l.builtBy === 'FELLOWSHIP' ? "text-yellow-500 bg-yellow-500/10" : "text-red-600 bg-red-600/10")}>
                        <Tower size={12} />
                      </div>
                    ))}
                 </div>

                 <div 
                   onClick={() => handleRegionClick(region.id)}
                   className={clsx(
                     "flex-1 p-1.5 rounded-lg border transition-all cursor-pointer relative bg-stone-900/60 border-stone-700/50",
                     isHighlighted ? "ring-2 ring-red-500 bg-red-900/20" : moveSourceRegionId === region.id ? "ring-2 ring-yellow-400 bg-yellow-900/20" : "hover:bg-stone-800/80"
                   )}
                 >
                    <div className="flex justify-between items-center mb-0.5">
                       <div className="flex items-center gap-1">
                          <span className="opacity-40">{getRegionIcon(region.id)}</span>
                          <span className="text-[8px] font-black uppercase tracking-tight text-stone-300">{region.name}</span>
                       </div>
                       <div className="flex gap-0.5">
                          {region.hasFortress.FELLOWSHIP && <Castle size={8} className="text-yellow-500" />}
                          {region.hasFortress.SAURON && <Castle size={8} className="text-red-600" />}
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <div className="flex items-center gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-yellow-600" />
                          <span className="text-[9px] font-mono font-black leading-none">{region.units.FELLOWSHIP}</span>
                       </div>
                       <div className="flex items-center gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-red-800" />
                          <span className="text-[9px] font-mono font-black leading-none">{region.units.SAURON}</span>
                       </div>
                    </div>
                 </div>
              </div>
             );
           })}
           
           <div className="mt-4 pt-4 border-t border-stone-700/50">
              <h4 className="text-[8px] font-bold text-stone-500 uppercase tracking-widest text-center mb-2">Available Landmarks</h4>
              <div className="flex flex-col gap-1">
                {G.availableLandmarks.map(id => {
                  const l = G.landmarks.find(landmark => landmark.id === id);
                  if (!l || l.builtBy !== null) return null;
                  return (
                    <button 
                        key={l.id} 
                        disabled={hasAnyPending}
                        onClick={() => setSelectedLandmark(l)} 
                        className={clsx(
                            "p-2 bg-stone-900/60 border border-stone-700 rounded-lg text-left transition-all",
                            hasAnyPending ? "opacity-30 cursor-not-allowed" : "hover:bg-stone-800"
                        )}
                    >
                       <div className="text-[9px] font-black uppercase text-yellow-500">{l.name}</div>
                       <div className="text-[7px] text-stone-500 leading-tight">{l.description.substring(0, 40)}...</div>
                    </button>
                  )
                })}
              </div>
           </div>
        </div>

        {/* Pyramid Center */}
        <div className="col-span-9 flex flex-col items-center justify-center p-4 bg-stone-950/20 rounded-2xl border border-stone-800/40 shadow-inner h-full relative overflow-hidden">
          <div className="flex flex-col items-center origin-center scale-[0.9] lg:scale-100 xl:scale-110">
              {G.pyramid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3 mb-[-32px] relative" style={{ zIndex: rowIndex }}>
                      {row.map((slot, colIndex) => {
                          if (!slot.cardId) return <div key={colIndex} className="w-20 h-28 invisible" />;
                          const available = isCardAvailable(G.pyramid, rowIndex, colIndex, G.currentChapter);
                          const card = G.cardPool[slot.cardId];
                          if (!card) return null;
                          const bonus = card.bonus;
                          
                          return (
                              <div 
                                key={colIndex} 
                                onClick={() => handleCardClick(rowIndex, colIndex, slot.cardId!, available)} 
                                className={clsx(
                                  "w-20 h-28 rounded-lg border-2 shadow-xl flex flex-col items-center justify-center text-center p-1.5 cursor-pointer transition-all",
                                  available ? "hover:scale-110 border-white/20 z-50 ring-2 ring-white/5" : "opacity-80 grayscale-[0.6] border-stone-800 scale-95",
                                  slot.isFaceUp ? getCardColorClass(card.type) : "bg-[repeating-linear-gradient(45deg,#1c1917,#1c1917_10px,#292524_10px,#292524_20px)]"
                                )}
                              >
                                  {slot.isFaceUp ? (
                                    <div className="flex flex-col items-center justify-center h-full w-full">
                                       <span className="text-[8px] font-black uppercase leading-tight line-clamp-2">{card.name}</span>
                                       <div className="mt-auto flex flex-wrap gap-0.5 justify-center">
                                          {bonus?.coins && <span className="bg-yellow-500 text-yellow-950 px-0.5 rounded text-[7px] font-bold">+{bonus.coins}C</span>}
                                          {bonus?.race && <span className="bg-black/30 px-0.5 rounded text-[7px] font-bold">{String(bonus.race).substring(0,3)}</span>}
                                       </div>
                                    </div>
                                  ) : <div className="text-stone-800 font-bold text-3xl opacity-10">?</div>}
                              </div>
                          );
                      })}
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom Separation - Players */}
      <div className="flex justify-between items-center shrink-0 pt-1 border-t border-stone-800">
         {renderPlayerPanel('FELLOWSHIP')}
         <div className="text-center opacity-10">
            <h1 className="text-lg font-black tracking-[0.3em] text-stone-600 uppercase">Middle-earth</h1>
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
                        <button key={r} onClick={() => moves.greyHavensChooseRace(r)} className="bg-stone-900 border border-stone-700 p-4 rounded-xl font-bold hover:bg-stone-700 transition-all uppercase tracking-widest text-xs">{r}</button>
                      ))}
                   </div>
                </div>
              )}
              {(G.pendingRacePick === 'DUPLICATE' || G.pendingRacePick === 'UNIQUE_3' || G.pendingRacePick === 'GREY_HAVENS_PICK_TILE') && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-green-500">Acquire Race Tile</h2>
                   <div className="flex gap-3 justify-center">
                      {G.pendingRaceSelectionPool.map(tile => (
                        <button key={tile.id} onClick={() => moves.selectRaceTile(tile.id)} className="bg-stone-900 border-2 border-stone-700 p-4 rounded-2xl w-48 hover:border-green-500 transition-all text-left">
                          <div className="font-black text-yellow-500 text-sm uppercase mb-1">{tile.name}</div>
                          <div className="text-[10px] opacity-60 leading-tight italic">{tile.description}</div>
                        </button>
                      ))}
                   </div>
                </div>
              )}
              {G.pendingDiscardTake && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Take a Card from Discard</h2>
                   <div className="flex flex-wrap gap-2 justify-center max-h-96 overflow-y-auto">
                      {G.discardPile.map(cId => (
                        <div key={cId} onClick={() => moves.takeDiscardCard(cId)} className={clsx("w-20 h-28 rounded border-2 cursor-pointer hover:scale-105 transition-transform", getCardColorClass(G.cardPool[cId].type))}>
                           <div className="flex flex-col items-center justify-center h-full p-1 text-center">
                              <span className="text-[8px] font-black uppercase">{G.cardPool[cId].name}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
              {G.pendingGreyRemoval && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Remove Enemy Grey Card</h2>
                   <div className="flex gap-2 justify-center flex-wrap">
                      {G.players[enemySide].cards.filter(cId => G.cardPool[cId].type === 'GREY').map(cId => (
                        <button key={cId} onClick={() => moves.removeGreyCard(cId)} className="bg-stone-300 border-2 border-stone-400 p-2 rounded text-stone-900 font-bold text-[8px] hover:bg-red-200">
                          {G.cardPool[cId].name}
                        </button>
                      ))}
                   </div>
                </div>
              )}
              {G.entChoicesCount > 0 && (
                <div>
                   <h2 className="text-xl font-black mb-6 uppercase tracking-widest">Ent Choice ({G.entChoicesCount})</h2>
                   <div className="flex gap-3 justify-center">
                      <button onClick={() => moves.entChoice('KILL')} className="bg-red-800 p-3 rounded-lg font-bold text-[10px]">KILL</button>
                      <button onClick={() => moves.entChoice('STEAL')} className="bg-yellow-700 p-3 rounded-lg font-bold text-[10px]">STEAL</button>
                      <button onClick={() => moves.entChoice('MOVE')} className="bg-blue-800 p-3 rounded-lg font-bold text-[10px]">MOVE</button>
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
            <div className={clsx("w-48 h-64 border-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center mb-8 p-4 relative", getCardColorClass(selectedFullCard.type))}>
               <div className="text-lg uppercase mb-3 font-black text-center">{selectedFullCard.name}</div>
               <div className="flex flex-col gap-3 w-full h-full bg-black/30 rounded-xl p-3 text-center items-center justify-center border border-white/5">
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    {selectedFullCard.cost.coins > 0 && <div className="bg-yellow-500 text-yellow-950 px-2 py-1 rounded text-xs font-black flex items-center gap-1"><Coins size={12}/>{selectedFullCard.cost.coins}</div>}
                    {selectedFullCard.cost.skills.map((s, i) => <div key={i} className="bg-stone-100 text-stone-900 px-2 py-1 rounded text-[9px] font-black uppercase">{s.substring(0,3)}</div>)}
                    {selectedFullCard.cost.coins === 0 && selectedFullCard.cost.skills.length === 0 && <div className="text-white font-black uppercase tracking-widest text-sm">FREE</div>}
                  </div>
               </div>
            </div>
            <div className="flex gap-3 w-full">
              <button className="flex-1 bg-stone-700 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-stone-600 transition-all" onClick={() => { moves.discardCard({ rowIndex: selectedCard.rowIndex, colIndex: selectedCard.colIndex }); setSelectedCard(null); }}>Discard</button>
              <button className={clsx("flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all", canAffordCard ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-50" : "bg-stone-800 text-stone-600 opacity-50 cursor-not-allowed")} disabled={!canAffordCard} onClick={() => { moves.takeCard({ rowIndex: selectedCard.rowIndex, colIndex: selectedCard.colIndex }); setSelectedCard(null); }}>{canAffordCard ? 'Acquire' : 'No Gold'}</button>
            </div>
            <button className="mt-6 text-[10px] text-stone-500 uppercase tracking-widest font-bold hover:text-stone-300" onClick={() => setSelectedCard(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Landmark Modal */}
      {selectedLandmark && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedLandmark(null)}>
          <div className="bg-stone-800 border-2 border-stone-600 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-full text-center mb-6">
               <Tower className="mx-auto mb-4 text-yellow-500" size={48} />
               <h2 className="text-2xl font-black uppercase tracking-widest text-yellow-500">{selectedLandmark.name}</h2>
               <p className="text-xs text-stone-400 mt-2 italic">{selectedLandmark.description}</p>
            </div>
            
            <div className="w-full bg-black/30 rounded-xl p-4 mb-8 border border-white/5">
                <div className="text-[10px] uppercase opacity-60 mb-2 tracking-widest">Required Skills</div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                   {selectedLandmark.cost.map((s, i) => (
                     <div key={i} className="bg-stone-100 text-stone-900 px-3 py-1 rounded font-black text-[10px] uppercase">{s}</div>
                   ))}
                   {[...Array(G.players[currentPlayerSide].builtLandmarks.length)].map((_, i) => (
                     <div key={`extra-${i}`} className="bg-red-900 text-red-100 px-3 py-1 rounded font-black text-[10px] uppercase border border-red-700">ANY +1</div>
                   ))}
                </div>
            </div>

            <div className="flex gap-3 w-full">
              <button className="flex-1 bg-stone-700 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-stone-600 transition-all" onClick={() => setSelectedLandmark(null)}>Cancel</button>
              <button 
                disabled={!canAffordLandmark(selectedLandmark, G.players[currentPlayerSide])}
                className={clsx(
                  "flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all",
                  canAffordLandmark(selectedLandmark, G.players[currentPlayerSide]) ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-50 shadow-lg shadow-yellow-900/20" : "bg-stone-800 text-stone-600 opacity-50 cursor-not-allowed"
                )}
                onClick={() => { moves.buildLandmark(selectedLandmark.id); setSelectedLandmark(null); }}
              >
                Build ({calculateLandmarkCost(selectedLandmark, G.players[currentPlayerSide])} C)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
