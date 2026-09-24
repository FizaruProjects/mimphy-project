import React from 'react';
import { ConceptDifficulty } from '@/lib/conceptMapping';
import { X, BookOpen, Users, HelpCircle, CheckCircle2, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

interface Props {
  concept: ConceptDifficulty | null;
  onClose: () => void;
}

export const DifficultyDetailModal: React.FC<Props> = ({ concept, onClose }) => {
  if (!concept) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide backdrop-blur-md">
                {concept.category}
              </span>
              <span className="text-red-100 text-xs font-semibold">
                Materi: {concept.topic}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {concept.concept}
            </h3>
            <p className="text-red-100 text-xs">
              Detail Analisis &amp; Pemetaan Kesulitan Siswa
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-red-50 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-100 dark:border-red-900/40">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 block mb-1">Siswa Kesulitan</span>
              <span className="text-2xl font-extrabold text-red-700 dark:text-red-300 font-mono">
                {concept.frequency} <span className="text-xs font-normal">siswa</span>
              </span>
              <span className="text-[10px] text-red-500 block mt-0.5">{concept.percentage}% dari responden</span>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">Rata-rata Performa</span>
              <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                {concept.avgPerformance}%
              </span>
              <span className="text-[10px] text-amber-500 block mt-0.5">Akurasi Asesmen</span>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Jumlah Soal</span>
              <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                {concept.totalQuestions} <span className="text-xs font-normal">soal</span>
              </span>
              <span className="text-[10px] text-indigo-500 block mt-0.5">Dalam asesmen</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Kelas Terdampak</span>
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                {Object.keys(concept.affectedClasses).length} <span className="text-xs font-normal">kelas</span>
              </span>
              <span className="text-[10px] text-emerald-500 block mt-0.5">Memiliki kesulitan</span>
            </div>
          </div>

          {/* Breakdown: Persepsi vs Performa Asesmen */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
              Persepsi Siswa vs Performa Asesmen Diagnostik
            </h4>
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                  Materi yang Dirasa Sulit (Persepsi)
                </span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {concept.perceivedCount} Siswa
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Berdasarkan pernyataan &amp; feedback eksplisit siswa.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                  Performa Terbukti Rendah (Asesmen)
                </span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {concept.provenCount} Siswa
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Berdasarkan jawaban salah pada butir soal asesmen.
                </p>
              </div>
            </div>
          </div>

          {/* Related Indicators List */}
          {concept.indicators && concept.indicators.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-indigo-500" />
                Indikator Pembelajaran Terkait
              </h4>
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                {concept.indicators.map((ind, idx) => (
                  <div key={idx} className="flex items-start text-xs text-slate-700 dark:text-slate-200">
                    <ChevronRight className="w-4 h-4 mr-1.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown per Class */}
          {Object.keys(concept.affectedClasses).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center">
                <Users className="w-4 h-4 mr-2 text-emerald-500" />
                Sebaran Siswa Kesulitan Per Kelas
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(concept.affectedClasses).map(([className, count]) => (
                  <div 
                    key={className}
                    className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{className}</span>
                    <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold font-mono">
                      {count} siswa
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation / Pedagogical Action Note */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Rekomendasi Tindakan Guru:</span>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Berikan penjelasan tambahan atau contoh simulasi interaktif mengenai <strong>{concept.concept}</strong> pada sesi remedial atau penguatan materi sebelum lanjut ke sub-bab berikutnya.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors text-xs"
          >
            Tutup Detail
          </button>
        </div>

      </div>
    </div>
  );
};
