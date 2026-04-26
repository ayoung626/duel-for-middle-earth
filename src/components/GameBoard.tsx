'use client';

import React, { useState } from 'react';
import { GameState } from '@/game/types';
import { clsx } from 'clsx';
import { calculateCardCost } from '@/game/Game';

interface GameBoardProps {
  G: GameState;
  ctx: any;
  moves: any;
  playerID: string | null;
}

const isCardAvailable = (pyramid: GameState['pyramid'], rowIndex: number, colIndex: number) => {
    const nextRow = pyramid[rowIndex + 1];
    if (!nextRow) return true;
    
    // In a standard pyramid layout (2 -> 3 -> 4 -> 5 -> 6):
    // Card(0, i) is covered by (1, i) and (1, i+1)
    const covers = [];
    if (nextRow[colIndex]) covers.push(nextRow[colIndex]);
    if (nextRow[colIndex + 1]) covers.push(nextRow[colIndex + 1]);
    
    return !covers.some(c => c.cardId !== null);
};

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

export const GameBoard: React.FC<GameBoardProps> = ({ G, ctx, moves, playerID }) => {
  const currentPlayer = ctx.currentPlayer === '0' ? 'SAURON' : 'FELLOWSHIP';
  const [selectedCard, setSelectedCard] = useState<{rowIndex: number, colIndex: number, cardId: string} | null>(null);

  const handleCardClick = (rowIndex: number, colIndex: number, cardId: string, available: boolean) => {
    if (available) {
      setSelectedCard({ rowIndex, colIndex, cardId });
    }
  };

  const handleTake = () => {
    if (selectedCard) {
      moves.takeCard({ rowIndex: selectedCard.rowIndex, colIndex: selectedCard.colIndex });
      setSelectedCard(null);
    }
  };

  const handleDiscard = () => {
    if (selectedCard) {
      moves.discardCard({ rowIndex: selectedCard.rowIndex, colIndex: selectedCard.colIndex });
      setSelectedCard(null);
    }
  };

  const renderCardDetails = (cardId: string) => {
    const card = G.cardPool[cardId];
    if (!card) return null;
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-1">
        <div className="text-[10px] uppercase font-bold opacity-80 mb-1">{card.name}</div>
        
        {/* Cost */}
        {(card.cost.coins > 0 || card.cost.skills.length > 0) && (
          <div className="flex gap-1 mb-2 bg-black/20 p-1 rounded-sm w-full justify-center flex-wrap">
            {card.cost.coins > 0 && <span className="text-[10px] bg-yellow-500 text-yellow-950 px-1 rounded-sm font-bold">{card.cost.coins}C</span>}
            {card.cost.skills.map((s, i) => <span key={i} className="text-[8px] bg-stone-300 text-stone-900 px-1 rounded-sm font-bold">{s.substring(0,3)}</span>)}
          </div>
        )}

        {/* Bonus */}
        <div className="flex gap-1 flex-wrap justify-center mt-auto">
          {card.bonus?.coins ? <span className="text-[10px] bg-yellow-400 text-yellow-950 px-1 rounded-sm font-bold">+{card.bonus.coins}C</span> : null}
          {card.bonus?.skills?.map((s, i) => <span key={i} className="text-[8px] bg-stone-200 text-stone-800 px-1 rounded-sm font-bold">+{s.substring(0,3)}</span>)}
          {card.bonus?.quest ? <span className="text-[10px] bg-blue-400 text-blue-950 px-1 rounded-sm font-bold">+{card.bonus.quest} Q</span> : null}
          {card.bonus?.race ? <span className="text-[10px] bg-green-400 text-green-950 px-1 rounded-sm font-bold">{card.bonus.race}</span> : null}
          {card.bonus?.placement ? <span className="text-[8px] bg-red-400 text-red-950 px-1 rounded-sm font-bold leading-tight">PLACE</span> : null}
        </div>
      </div>
    );
  };

  const selectedFullCard = selectedCard ? G.cardPool[selectedCard.cardId] : null;
  const currentCost = selectedFullCard ? calculateCardCost(selectedFullCard, G.players[currentPlayer].skills) : 0;
  const canAfford = selectedFullCard ? G.players[currentPlayer].coins >= currentCost : false;

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-4 flex flex-col gap-4 font-serif select-none">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-stone-800 p-4 rounded-lg border border-stone-700 shadow-xl">
        <div className="flex gap-8">
          <div className={clsx("p-2 rounded transition-all", currentPlayer === 'FELLOWSHIP' ? 'bg-yellow-900/30 border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'opacity-50')}>
            <h2 className="text-yellow-500 font-bold">FELLOWSHIP</h2>
            <p className="text-xl font-mono">{G.players.FELLOWSHIP.coins} <span className="text-xs font-serif">coins</span></p>
          </div>
          <div className={clsx("p-2 rounded transition-all", currentPlayer === 'SAURON' ? 'bg-red-900/30 border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'opacity-50')}>
            <h2 className="text-red-500 font-bold">SAURON</h2>
            <p className="text-xl font-mono">{G.players.SAURON.coins} <span className="text-xs font-serif">coins</span></p>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-stone-300">DUEL FOR MIDDLE-EARTH</h1>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Chapter {G.currentChapter}</p>
        </div>
        <div className="text-right text-stone-400">
          <p className="text-xs uppercase">Turn {ctx.turn}</p>
          {ctx.gameover ? (
            <div className="text-right">
              <p className="text-sm font-bold text-yellow-500 uppercase">{ctx.gameover.winner} WINS!</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest">{ctx.gameover.reason}</p>
            </div>
          ) : (
            <p className="text-sm font-bold text-green-600">In Progress</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Left Sidebar - Quest Track */}
        <div className="col-span-2 bg-stone-800 rounded-lg border border-stone-700 p-4 flex flex-col items-center shadow-inner">
          <h3 className="text-[10px] font-bold mb-4 text-stone-500 uppercase tracking-widest">Quest of the Ring</h3>
          <div 
            className="relative h-full w-12 bg-stone-950 rounded-full border border-stone-700 flex flex-col justify-between py-6 items-center shadow-2xl cursor-pointer hover:border-stone-500 transition-colors"
            onClick={() => moves.advanceQuest()}
            title="Click to advance on the Quest Track"
          >
            {[...Array(13)].map((_, i) => (
              <div key={i} className="relative w-8 h-8 flex items-center justify-center">
                <div className="w-1 h-1 bg-stone-700 rounded-full" />
                {G.questTrack.fellowship === i && (
                  <div className="absolute w-8 h-8 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.6)] z-20 flex items-center justify-center text-stone-950 font-black text-xs border-2 border-stone-900 animate-pulse">F</div>
                )}
                {G.questTrack.sauron === i && (
                  <div className="absolute w-8 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] z-10 flex items-center justify-center text-white font-black text-xs border-2 border-stone-900">S</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center - Map & Pyramid Area */}
        <div className="col-span-7 flex flex-col gap-4">
          {/* Map Visualization */}
          <div className="h-48 bg-stone-800 rounded-lg border border-stone-700 p-4 relative overflow-hidden shadow-inner">
             <div className="grid grid-cols-7 gap-2 h-full">
                {Object.values(G.map).map(region => (
                  <div 
                    key={region.id} 
                    onClick={() => moves.placeUnit(region.id)}
                    className="border border-stone-700/50 rounded bg-stone-900/40 p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-stone-700/50 active:scale-95"
                  >
                    <span className="text-[10px] font-bold text-stone-500 uppercase leading-none mb-2">{region.name}</span>
                    <div className="flex gap-2">
                        {region.units.FELLOWSHIP > 0 && <span className="w-4 h-4 bg-yellow-600 rounded-sm text-[10px] flex items-center justify-center font-bold">{region.units.FELLOWSHIP}</span>}
                        {region.units.SAURON > 0 && <span className="w-4 h-4 bg-red-800 rounded-sm text-[10px] flex items-center justify-center font-bold">{region.units.SAURON}</span>}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Pyramid Area */}
          <div className="flex-1 bg-stone-950/50 rounded-lg border border-stone-800 p-8 flex flex-col items-center relative overflow-hidden">
            <div className="flex flex-col gap-[-20px] items-center">
                {G.pyramid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4 mb-[-40px] relative" style={{ zIndex: rowIndex }}>
                        {row.map((card, colIndex) => {
                            if (!card.cardId) return <div key={colIndex} className="w-24 h-32 invisible" />;
                            
                            const available = isCardAvailable(G.pyramid, rowIndex, colIndex);
                            const actualCard = G.cardPool[card.cardId];
                            
                            return (
                                <div 
                                    key={colIndex}
                                    onClick={() => handleCardClick(rowIndex, colIndex, card.cardId!, available)}
                                    className={clsx(
                                        "w-24 h-32 rounded-lg border-2 shadow-2xl flex flex-col items-center justify-center text-center p-1 cursor-pointer transition-all active:scale-95",
                                        available ? "hover:scale-105" : "opacity-80 grayscale-[0.5] cursor-not-allowed",
                                        card.isFaceUp && actualCard ? getCardColorClass(actualCard.type) : "bg-[repeating-linear-gradient(45deg,#1c1917,#1c1917_10px,#292524_10px,#292524_20px)] border-stone-700"
                                    )}
                                >
                                    {card.isFaceUp ? renderCardDetails(card.cardId) : <div className="text-stone-700 font-bold text-2xl">?</div>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Player Hand / Landmarks */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="flex-1 bg-stone-800 rounded-lg border border-stone-700 p-4 shadow-inner">
            <h3 className="text-[10px] font-bold mb-3 text-stone-500 uppercase tracking-widest">Game Log</h3>
            <div className="text-[11px] space-y-2 h-64 overflow-y-auto text-stone-400 font-mono pr-2 scrollbar-thin scrollbar-thumb-stone-700 flex flex-col-reverse">
              {[...G.log].reverse().map((entry, i) => (
                <div key={i} className="border-b border-stone-700/30 pb-1 italic leading-tight">
                  <span className="opacity-30 mr-2">{G.log.length - i}</span> {entry}
                </div>
              ))}
            </div>
          </div>
          <div className="h-48 bg-stone-800 rounded-lg border border-stone-700 p-4 shadow-inner overflow-hidden">
             <h3 className="text-[10px] font-bold mb-3 text-stone-500 uppercase tracking-widest">Hand</h3>
             <div className="flex flex-wrap gap-2 overflow-y-auto h-full pb-4">
                {G.players[currentPlayer].cards.map((cId, i) => {
                    const c = G.cardPool[cId];
                    if (!c) return null;
                    return (
                      <div key={i} className={clsx("w-12 h-16 border rounded text-[8px] flex items-center justify-center p-1 text-center font-bold", getCardColorClass(c.type))}>
                          {c.name.substring(0, 10)}
                      </div>
                    )
                })}
             </div>
          </div>
        </div>
      </div>

      {/* Selected Card Modal */}
      {selectedCard && selectedFullCard && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
          <div 
            className="bg-stone-800 border-2 border-stone-600 rounded-xl p-8 flex flex-col items-center max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className={clsx("w-48 h-64 border-4 rounded-lg shadow-2xl flex flex-col items-center justify-center mb-8 p-4", getCardColorClass(selectedFullCard.type))}>
               <div className="text-sm uppercase mb-2 font-bold">{selectedFullCard.name}</div>
               {/* Show large cost / bonus for modal */}
               <div className="flex flex-col gap-4 w-full h-full bg-black/20 rounded p-2 text-center items-center justify-center">
                  <div>
                    <div className="text-[10px] uppercase opacity-70 mb-1">Cost</div>
                    {selectedFullCard.cost.coins === 0 && selectedFullCard.cost.skills.length === 0 ? (
                      <div className="text-xs font-bold">Free</div>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        {selectedFullCard.cost.coins > 0 && <span className="bg-yellow-500 text-yellow-950 px-2 py-1 rounded text-xs font-bold">{selectedFullCard.cost.coins} Coins</span>}
                        {selectedFullCard.cost.skills.map((s, i) => <span key={i} className="bg-stone-300 text-stone-900 px-2 py-1 rounded text-xs font-bold">{s}</span>)}
                      </div>
                    )}
                  </div>
                  {selectedFullCard.chainingSymbol && (
                    <div className="text-[10px] bg-stone-900 text-stone-200 px-2 py-1 rounded-full uppercase">
                       Chain: {selectedFullCard.chainingSymbol}
                    </div>
                  )}
               </div>
            </div>
            <div className="flex gap-4 w-full">
              <button 
                className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 py-3 rounded font-bold uppercase tracking-widest transition-colors border border-stone-500 flex flex-col items-center justify-center leading-tight"
                onClick={handleDiscard}
              >
                Discard
                <span className="text-[10px] font-normal text-stone-400 mt-1">Gain {G.currentChapter} Coin{G.currentChapter > 1 ? 's' : ''}</span>
              </button>
              <button 
                className={clsx(
                  "flex-1 py-3 rounded font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)] border flex flex-col items-center justify-center leading-tight",
                  canAfford 
                    ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-100 border-yellow-500" 
                    : "bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed"
                )}
                disabled={!canAfford}
                onClick={handleTake}
              >
                {canAfford ? 'Take' : 'Cannot Afford'}
                <span className={clsx("text-[10px] font-normal mt-1", canAfford ? "text-yellow-300" : "text-red-500")}>
                  Cost: {currentCost} Coin{currentCost !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
            <button className="mt-6 text-xs text-stone-500 uppercase tracking-widest hover:text-stone-300" onClick={() => setSelectedCard(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
