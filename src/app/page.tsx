'use client';

import dynamic from 'next/dynamic';

const GameClient = dynamic(() => import('@/components/GameClient'), { 
  ssr: false,
  loading: () => <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-2xl tracking-widest animate-pulse">Loading Middle-earth...</div>
});

export default function Home() {
  return (
    <main>
      <GameClient />
    </main>
  );
}
