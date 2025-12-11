import React, { useState, useEffect, useCallback } from 'react';
import { generateLocations, generateMapBackground, generateChiikawaCharacters } from './services/geminiService';
import { Location, Decoration, AppStatus } from './types';
import { MapCanvas } from './components/MapCanvas';

const DEFAULT_ITINERARY = `7/2–7/5 Roth 賽事區
7/2 (四) 景點：台灣 → 德國
7/3 (五) 景點：法蘭克福機場 → Roth
7/4 (六) 景點：Roth（Challenge Roth 報到）
7/5 (日) 景點：Roth（比賽日）
7/6–7/7 Camp 1：Kirchzarten
7/6 (一) Roth → Kirchzarten 營地，戶外泳池放鬆
7/7 (二) Badeparadies Schwarzwald 水上樂園，蒂蒂湖 Titisee 湖邊小鎮
7/8–7/9 Camp 2：Feldberg / Titisee
7/8 (三) Feldberg 山區纜車、短步道健行
7/9 (四) Schluchsee 湖畔活動，Feldberg / Titisee 周邊
7/10–7/13 Camp 3：Colmar（阿爾薩斯）
7/10 (五) 上科尼斯堡城堡 Haut-Koenigsbourg、猴山 Montagne des Singes
7/11 (六) 科爾馬 Colmar（小威尼斯區、聖馬丁大教堂），里博維萊 Riquewihr
7/12 (日) Europa-Park 歐洲樂園一日遊
7/13 (一) 埃居山 Eguisheim
7/14–7/15 返回法蘭克福
7/14 (二) 開車返回法蘭克福
7/15 (三) 法蘭克福機場返台`;

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [locations, setLocations] = useState<Location[]>([]);
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [mapBackground, setMapBackground] = useState<string | null>(null);
  const [itineraryInput, setItineraryInput] = useState(DEFAULT_ITINERARY);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    try {
      setStatus(AppStatus.GENERATING_PLAN);
      setErrorMsg(null);
      setSelectedLocation(null);
      setDecorations([]); // Clear previous decorations
      
      // 1. Generate Locations (Text processing)
      const locs = await generateLocations(itineraryInput);
      setLocations(locs);

      setStatus(AppStatus.GENERATING_ART);
      
      // 2. Generate Map Background & Characters in parallel
      const [bgUrl, chars] = await Promise.all([
        generateMapBackground(itineraryInput),
        generateChiikawaCharacters()
      ]);
      
      setMapBackground(bgUrl);
      setDecorations(chars);

      setStatus(AppStatus.READY);
    } catch (e: any) {
      console.error(e);
      setErrorMsg("生成失敗，請稍後再試 (可能是 API 額度限制)");
      setStatus(AppStatus.ERROR);
    }
  }, [itineraryInput]);

  // Initial load
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#fffcf5] font-sans text-gray-700 pb-20 selection:bg-pink-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <span className="text-3xl group-hover:animate-spin">🍥</span>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-pink-500">
                吉依卡娃旅遊地圖
              </h1>
              <span className="text-xs text-pink-300 font-bold tracking-widest">CHIIKAWA TRAVEL MAP</span>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-2 items-start">
            <div className="relative flex-1 md:w-96">
              <textarea 
                value={itineraryInput}
                onChange={(e) => setItineraryInput(e.target.value)}
                className="w-full h-12 min-h-[3rem] max-h-32 px-4 py-2 rounded-2xl border border-pink-200 bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-300 text-xs placeholder-pink-300 resize-y leading-relaxed"
                placeholder="貼上你的行程表..."
              />
              <div className="absolute top-2 right-2 text-[10px] text-pink-300 pointer-events-none bg-pink-50 pl-2">
                行程輸入
              </div>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={status === AppStatus.GENERATING_PLAN || status === AppStatus.GENERATING_ART}
              className="px-6 py-3 bg-pink-400 hover:bg-pink-500 text-white rounded-2xl font-bold shadow-[0_4px_0_rgb(219,39,119)] hover:shadow-[0_2px_0_rgb(219,39,119)] hover:translate-y-[2px] transition-all active:shadow-none active:translate-y-[4px] disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap disabled:transform-none disabled:shadow-none flex items-center gap-2"
            >
              {status === AppStatus.GENERATING_PLAN ? '分析行程...' : 
               status === AppStatus.GENERATING_ART ? '繪製地圖...' : 
               <><span>✨</span> 生成地圖</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-2xl text-center font-bold border-2 border-red-200 animate-shake">
            {errorMsg}
          </div>
        )}

        {status !== AppStatus.READY && status !== AppStatus.IDLE && !errorMsg && (
          <div className="mb-6 text-center animate-bounce">
            <span className="text-pink-400 font-bold text-lg inline-flex items-center gap-2">
              {status === AppStatus.GENERATING_PLAN ? 
                <>☁️ 小可愛們正在讀你的行程...</> : 
                <>🎨 烏薩奇正在瘋狂畫地圖 (呀哈!)...</>}
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Map Column */}
          <div className="lg:col-span-2 w-full">
            <div className="relative">
              <MapCanvas 
                backgroundUrl={mapBackground} 
                locations={locations}
                decorations={decorations}
                onLocationSelect={setSelectedLocation}
                selectedLocationId={selectedLocation?.id}
              />
              {/* Decorative elements around map */}
              <div className="absolute -top-4 -left-4 text-4xl animate-bounce delay-700 pointer-events-none">🌸</div>
              <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce delay-1000 pointer-events-none">🍄</div>
            </div>
            
            <div className="mt-4 flex justify-center gap-4 text-xs text-pink-400 font-medium bg-white/50 py-2 rounded-full border border-pink-100">
              <span className="flex items-center gap-1">👆 點擊地圖上的景點</span>
              <span className="w-px h-4 bg-pink-200"></span>
              <span className="flex items-center gap-1">🐭 點擊角色聽他們說話</span>
            </div>
          </div>

          {/* Sidebar: Details & List */}
          <div className="w-full flex flex-col gap-4 h-full">
            {selectedLocation ? (
              <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-pink-100 animate-fade-in-up relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-pink-100 animate-wiggle">
                    {selectedLocation.emoji}
                  </div>
                  <button 
                    onClick={() => setSelectedLocation(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-pink-100 hover:text-pink-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-['Zen_Maru_Gothic']">{selectedLocation.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedLocation.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-gray-600 leading-relaxed text-sm bg-pink-50/50 p-4 rounded-xl border border-pink-100 font-medium">
                  {selectedLocation.description}
                </p>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                   <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-bold text-sm hover:bg-pink-200 transition-colors flex items-center gap-2"
                   >
                     <span>📍</span> 在 Google Maps 查看
                   </a>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 rounded-3xl p-8 border-2 border-dashed border-pink-200 flex flex-col items-center justify-center text-center flex-shrink-0 min-h-[250px]">
                <div className="text-6xl mb-4 opacity-50 animate-pulse">🗺️</div>
                <h3 className="text-lg font-bold text-gray-500 mb-2">點擊地圖圖示</h3>
                <p className="text-sm text-gray-400">查看詳細介紹</p>
                <div className="mt-8 flex gap-4 opacity-30">
                   {['✨', '🌸', '🍡'].map((emoji, i) => (
                     <div key={i} className="text-2xl animate-bounce" style={{animationDelay: `${i * 0.2}s`}}>{emoji}</div>
                   ))}
                </div>
              </div>
            )}

            {/* Scrollable Location List */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white/40 rounded-3xl border border-pink-100 p-4">
               <h3 className="text-sm font-bold text-gray-400 mb-3 px-2 flex items-center gap-2">
                 <span>📋</span> 景點列表 ({locations.length})
               </h3>
               <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar flex-1">
                 {locations.map(loc => (
                   <button
                     key={loc.id}
                     onClick={() => setSelectedLocation(loc)}
                     className={`
                       w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group
                       ${selectedLocation?.id === loc.id 
                         ? 'bg-white shadow-md border-pink-200 border ring-2 ring-pink-100' 
                         : 'bg-white/60 hover:bg-white hover:shadow-sm hover:scale-[1.02]'}
                     `}
                   >
                     <span className="text-xl group-hover:scale-110 transition-transform">{loc.emoji}</span>
                     <span className="text-sm font-bold text-gray-700">{loc.name}</span>
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 200, 220, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 180, 200, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 100, 150, 0.6);
        }
      `}</style>
    </div>
  );
};

export default App;