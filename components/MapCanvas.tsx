import React, { useState } from 'react';
import { Location, Decoration } from '../types';

interface MapCanvasProps {
  backgroundUrl: string | null;
  locations: Location[];
  decorations: Decoration[];
  onLocationSelect: (loc: Location) => void;
  selectedLocationId?: string;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ 
  backgroundUrl, 
  locations, 
  decorations,
  onLocationSelect,
  selectedLocationId 
}) => {
  const [activeDecorationId, setActiveDecorationId] = useState<string | null>(null);

  if (!backgroundUrl) {
    return (
      <div className="w-full h-96 bg-pink-50 rounded-3xl flex items-center justify-center border-4 border-pink-200 border-dashed animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="text-center z-10">
          <div className="text-4xl mb-4 animate-bounce">🍥</div>
          <span className="text-pink-400 font-bold text-lg">正在繪製吉依卡娃風格地圖...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white ring-4 ring-pink-100 transition-all hover:ring-pink-200 bg-white">
      {/* Background Map */}
      <img 
        src={backgroundUrl} 
        alt="Map Background" 
        className="w-full h-full object-cover"
      />

      {/* Decorations (Characters) */}
      {decorations.map((deco) => (
        <div
          key={deco.id}
          className="absolute z-10 cursor-pointer group"
          style={{ 
            left: `${deco.x}%`, 
            top: `${deco.y}%`,
            transform: `translate(-50%, -50%) rotate(${deco.rotation}deg) scale(${deco.scale})`
          }}
          onClick={() => setActiveDecorationId(activeDecorationId === deco.id ? null : deco.id)}
        >
          {/* Chat Bubble */}
          <div className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 
            bg-white border-2 border-gray-800 rounded-2xl whitespace-nowrap z-20
            transition-all duration-300 origin-bottom
            ${activeDecorationId === deco.id || 'group-hover:scale-100 scale-0'}
            shadow-[2px_2px_0px_rgba(0,0,0,0.1)]
          `}>
            <p className="text-xs font-bold text-gray-800">{deco.message}</p>
            {/* Bubble arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] w-2 h-2 bg-white border-b-2 border-r-2 border-gray-800 rotate-45"></div>
          </div>

          {/* Character Image */}
          <img 
            src={deco.imageUrl} 
            alt={deco.name}
            className="w-24 h-24 object-contain filter drop-shadow-md transition-transform hover:scale-110"
            style={{ mixBlendMode: 'multiply' }} 
          />
        </div>
      ))}

      {/* Locations */}
      {locations.map((loc) => (
        <button
          key={loc.id}
          onClick={() => onLocationSelect(loc)}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 z-20
            ${selectedLocationId === loc.id ? 'scale-125 z-30' : 'hover:scale-110'}
          `}
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
        >
          <div className="relative flex flex-col items-center">
            {/* Tooltip/Label */}
            <div className={`
              mb-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 whitespace-nowrap shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-pink-100
              ${selectedLocationId === loc.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
              transition-all duration-200
            `}>
              {loc.name}
            </div>
            
            {/* Marker Pin */}
            <div className={`
              w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-[0_4px_0_rgba(0,0,0,0.1)]
              ${selectedLocationId === loc.id ? 'bg-pink-400 text-white animate-bounce' : 'bg-white text-pink-500 hover:bg-pink-50'}
              border-2 border-pink-200 transition-colors
            `}>
              <span className="text-xl md:text-2xl filter drop-shadow-sm">{loc.emoji}</span>
            </div>

            {/* Shadow/Pin Point */}
            <div className="w-3 h-1.5 bg-gray-400/30 rounded-full blur-[1px] mt-1"></div>
          </div>
        </button>
      ))}
    </div>
  );
};