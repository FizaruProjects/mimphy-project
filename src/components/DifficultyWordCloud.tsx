import React, { useState } from 'react';
import { ConceptDifficulty } from '@/lib/conceptMapping';

interface Props {
  concepts: ConceptDifficulty[];
  totalRespondents: number;
  onSelectConcept: (concept: ConceptDifficulty) => void;
}

export const DifficultyWordCloud: React.FC<Props> = ({ concepts, totalRespondents, onSelectConcept }) => {
  const [hoveredConcept, setHoveredConcept] = useState<ConceptDifficulty | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  if (!concepts || concepts.length === 0) return null;

  return (
    <div 
      className="relative w-full min-h-[320px] md:min-h-[400px] p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/90 text-white shadow-xl overflow-hidden border border-slate-700/60 backdrop-blur-md flex items-center justify-center select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredConcept(null)}
    >
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Floating Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      {/* Word Cloud Flex Container */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 md:gap-5 max-w-4xl mx-auto py-4 px-2">
        {concepts.map((item, idx) => {
          const fontSize = item.fontSize || 18;
          const isHovered = hoveredConcept?.id === item.id;
          
          // Determine opacity based on frequency tier
          const opacity = isHovered ? 1 : Math.max(0.75, (fontSize - 12) / 28);
          
          return (
            <button
              key={item.id || idx}
              onClick={() => onSelectConcept(item)}
              onMouseEnter={() => setHoveredConcept(item)}
              className="group relative transition-all duration-300 ease-out transform focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-xl px-2.5 py-1"
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: fontSize > 28 ? 800 : fontSize > 20 ? 700 : 600,
                color: item.color || '#f87171',
                opacity,
                transform: isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                textShadow: isHovered 
                  ? `0 0 20px ${item.color || '#ef4444'}88, 0 0 10px ${item.color || '#ef4444'}44`
                  : '0 2px 4px rgba(0,0,0,0.4)',
                zIndex: isHovered ? 30 : Math.round(fontSize)
              }}
              title={`${item.concept}: ${item.frequency} siswa`}
            >
              <span className="flex items-center space-x-1.5">
                <span>{item.concept}</span>
                {item.category && (
                  <span 
                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-white/10 text-white/80 border border-white/10 group-hover:border-white/30"
                    style={{ fontSize: '9px', lineHeight: 1 }}
                  >
                    {item.frequency}
                  </span>
                )}
              </span>

              {/* Bottom underline accent on hover */}
              <span 
                className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full transition-all duration-300 scale-x-0 group-hover:scale-x-100" 
                style={{ backgroundColor: item.color || '#ef4444' }}
              />
            </button>
          );
        })}
      </div>

      {/* Interactive Tooltip Card */}
      {hoveredConcept && (
        <div 
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 transition-opacity duration-150"
          style={{ 
            left: `${mousePos.x + 30}px`, 
            top: `${mousePos.y - 15}px`,
          }}
        >
          <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md max-w-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-sm text-red-400">{hoveredConcept.concept}</span>
              <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-800/50 px-2 py-0.5 rounded-full font-bold">
                {hoveredConcept.category}
              </span>
            </div>
            
            <div className="text-xs space-y-1 text-slate-300">
              <p className="flex justify-between">
                <span>Siswa Mengalami Kesulitan:</span>
                <strong className="text-white font-mono">{hoveredConcept.frequency} siswa</strong>
              </p>
              <p className="flex justify-between">
                <span>Persentase Responden:</span>
                <strong className="text-amber-400 font-mono">{hoveredConcept.percentage}%</strong>
              </p>
              <p className="flex justify-between">
                <span>Rata-rata Performa Test:</span>
                <strong className={`font-mono ${hoveredConcept.avgPerformance < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {hoveredConcept.avgPerformance}%
                </strong>
              </p>
            </div>

            {hoveredConcept.indicators && hoveredConcept.indicators.length > 0 && (
              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 italic">
                <span className="font-semibold text-slate-300 not-italic block mb-0.5">Indikator Terkait:</span>
                <p className="line-clamp-2">&bull; {hoveredConcept.indicators[0]}</p>
              </div>
            )}
            
            <div className="pt-1 text-[10px] text-slate-400 font-medium text-center border-t border-slate-800/60 text-red-300">
              Klik untuk melihat detail analisis &amp; performa
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
