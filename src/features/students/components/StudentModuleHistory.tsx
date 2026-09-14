import React, { useState, useMemo } from 'react';
import { generateFallbackFeedback } from '@/services/aiFeedbackService';
import { StudentResult, QuizPacket, ModuleItem, AbilityLevel, DifferentiationMode, LearningStyle, MaterialType } from '@/types';
import { BookOpen, FileText, Youtube, ExternalLink, Search, Calendar, Award, Sparkles, X, BrainCircuit, Layers, Filter, CheckCircle2, Link, Clock, Target } from 'lucide-react';

interface Props {
  results: StudentResult[];
  packets: QuizPacket[];
  learningStyle: LearningStyle;
}

export const StudentModuleHistory: React.FC<Props> = ({ results, packets, learningStyle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<ModuleItem | null>(null);

  // Map each result to its associated packet & recommended modules
  const moduleHistoryEntries = useMemo(() => {
    const sortedResults = [...results].sort((a, b) => b.timestamp - a.timestamp);

    return sortedResults.map(res => {
      const packet = packets.find(p => p.id === res.packetId);
      const mode = packet?.differentiationMode || DifferentiationMode.CONTENT;

      let recommendedModules: ModuleItem[] = [];
      let contextMsg = "";

      if (packet && packet.modules) {
        if (mode === DifferentiationMode.CONTENT) {
          const levelStr = String(res.abilityLevel);
          contextMsg = `Modul Level Konten (${res.abilityLevel})`;

          if (levelStr === AbilityLevel.BASIC || levelStr === 'Rendah' || levelStr === 'Dasar') {
            recommendedModules = packet.modules.basic || [];
          } else if (levelStr === AbilityLevel.MEDIUM || levelStr === 'Sedang') {
            recommendedModules = packet.modules.medium || [];
          } else if (levelStr === AbilityLevel.HIGH || levelStr === 'Tinggi') {
            recommendedModules = packet.modules.high || [];
          }
        } else {
          contextMsg = `Modul Gaya Belajar (${learningStyle})`;
          if (learningStyle === LearningStyle.VISUAL) {
            recommendedModules = packet.modules.visual || [];
          } else if (learningStyle === LearningStyle.AUDITORY) {
            recommendedModules = packet.modules.auditory || [];
          } else if (learningStyle === LearningStyle.KINESTHETIC) {
            recommendedModules = packet.modules.kinesthetic || [];
          }
        }
      }

      return {
        result: res,
        packetName: packet?.name || res.packetId,
        differentiationMode: mode,
        recommendedModules,
        contextMsg
      };
    });
  }, [results, packets, learningStyle]);

  // Filter history entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return moduleHistoryEntries;
    const term = searchTerm.toLowerCase();
    return moduleHistoryEntries.filter(entry =>
      entry.packetName.toLowerCase().includes(term) ||
      entry.result.packetId.toLowerCase().includes(term) ||
      String(entry.result.abilityLevel).toLowerCase().includes(term)
    );
  }, [moduleHistoryEntries, searchTerm]);

  // Helper to extract YouTube ID for embed
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    } catch (e) {
      return null;
    }
  };

  // Render Modal Preview for Selected Module Item
  const renderPreviewModal = () => {
    if (!selectedMaterial) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedMaterial(null)}>
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-stone-50 dark:bg-slate-800">
            <h3 className="font-bold text-lg text-stone-800 dark:text-white truncate pr-4">{selectedMaterial.title}</h3>
            <button onClick={() => setSelectedMaterial(null)} className="p-2 bg-stone-200 dark:bg-slate-700 rounded-full hover:bg-stone-300 dark:hover:bg-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 bg-black flex items-center justify-center overflow-auto">
            {selectedMaterial.type === 'video_link' ? (
              getYoutubeEmbedUrl(selectedMaterial.content) ? (
                <iframe
                  src={getYoutubeEmbedUrl(selectedMaterial.content)!}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-white text-center p-8">
                  <Youtube className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <p className="mb-4">Video ini tidak dapat diputar langsung disini.</p>
                  <a href={selectedMaterial.content} target="_blank" rel="noreferrer" className="px-4 py-2 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors">Buka di YouTube/Browser</a>
                </div>
              )
            ) : selectedMaterial.type === 'pdf_upload' ? (
              <iframe src={selectedMaterial.content} className="w-full h-full bg-white"></iframe>
            ) : (
              <div className="text-white text-center p-8">
                <Link className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <p className="mb-4 text-xl font-bold">Link Eksternal Dokumentasi</p>
                <p className="mb-6 text-slate-400 break-all">{selectedMaterial.content}</p>
                <a href={selectedMaterial.content} target="_blank" rel="noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors">Buka Link di Tab Baru</a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-300 w-full flex-1">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-[2.5rem] p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">

          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Riwayat Rekomendasi Modul</h2>
          <p className="text-red-100 text-sm md:text-base max-w-2xl leading-relaxed">
            Semua modul pembelajaran yang pernah direkomendasikan berdasarkan hasil kuis Anda tersimpan disini secara permanen. Anda dapat membaca dan mempelajari kembali materi kapan saja!
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Cari modul berdasarkan paket..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-sm font-medium text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs font-bold text-stone-500 dark:text-slate-400">
          Total Riwayat: <span className="text-red-600 dark:text-red-400 font-extrabold text-sm ml-1">{filteredEntries.length} Paket</span>
        </div>
      </div>

      {/* Module History List */}
      <div className="space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-stone-200 dark:border-slate-700 shadow-sm">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-slate-600" />
            <h3 className="font-bold text-lg text-stone-700 dark:text-slate-300 mb-1">Belum Ada Riwayat Modul</h3>
            <p className="text-stone-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              {searchTerm ? "Tidak ada riwayat modul yang cocok dengan kata kunci pencarian Anda." : "Kerjakan kuis terlebih dahulu untuk mendapatkan modul pembelajaran rekomendasi yang disesuaikan dengan tingkat kemampuan Anda."}
            </p>
          </div>
        ) : (
          filteredEntries.map(({ result, packetName, differentiationMode, recommendedModules, contextMsg }, idx) => {
            const levelStr = String(result.abilityLevel);
            const isHigh = levelStr === AbilityLevel.HIGH || levelStr === 'Tinggi';
            const isMedium = levelStr === AbilityLevel.MEDIUM || levelStr === 'Sedang';

            const displayFeedback = result.aiFeedback || generateFallbackFeedback({
              score: result.score,
              abilityLevel: String(result.abilityLevel || (result.score >= 85 ? 'Tinggi' : result.score < 60 ? 'Rendah' : 'Sedang')),
              packetName: packetName,
              testTopic: 'Fisika SMA',
              masteredIndicators: [],
              unmasteredIndicators: [],
              indicatorStats: []
            });

            return (
              <div key={result.id || idx} className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200 dark:border-slate-700 hover:shadow-md transition-all">
                {/* Card Top Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-stone-100 dark:border-slate-700 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
                        {result.packetId}
                      </span>
                      <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-bold ${differentiationMode === DifferentiationMode.STYLE
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>
                        {differentiationMode === DifferentiationMode.STYLE ? <BrainCircuit className="w-3 h-3 mr-1" /> : <Layers className="w-3 h-3 mr-1" />}
                        {differentiationMode === DifferentiationMode.STYLE ? 'Gaya Belajar' : 'Level Konten'}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-slate-500 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(result.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-stone-800 dark:text-white">{packetName}</h3>
                  </div>

                  <div className="flex items-center gap-4 bg-stone-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-stone-100 dark:border-slate-600 w-fit">
                    <div className="text-center">
                      <div className="text-2xl font-black text-stone-800 dark:text-white">{result.score}</div>
                      <div className="text-[10px] uppercase font-bold text-stone-400 dark:text-slate-400">Nilai</div>
                    </div>
                    <div className="h-8 w-px bg-stone-200 dark:bg-slate-600"></div>
                    <div className="text-center">
                      {result.abilityLevel === 'Menunggu Finalisasi' || !result.abilityLevel ? (
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg flex items-center">
                          <Clock className="w-3 h-3 mr-1 animate-pulse" /> Pending
                        </div>
                      ) : (
                        <div className={`text-base font-extrabold ${isHigh ? 'text-green-600 dark:text-green-400' :
                          isMedium ? 'text-amber-600 dark:text-amber-400' :
                            'text-rose-600 dark:text-rose-400'
                          }`}>
                          {result.abilityLevel}
                        </div>
                      )}
                      <div className="text-[10px] uppercase font-bold text-stone-400 dark:text-slate-400">Kategori</div>
                    </div>
                  </div>
                </div>

                {/* Recommended Modules Content */}
                <div>
                  <h4 className="text-sm font-bold text-stone-700 dark:text-slate-200 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                    Modul Rekomendasi
                    <span className="ml-2 text-xs font-medium text-stone-400 dark:text-slate-400">({contextMsg})</span>
                  </h4>

                  {result.abilityLevel === 'Menunggu Finalisasi' || !result.abilityLevel ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                      <span>Kategorisasi kuis belum difinalisasi oleh guru. Modul rekomendasi akan terbuka secara otomatis setelah guru menekan tombol <strong>Hitung &amp; Kategorisasi</strong>.</span>
                    </div>
                  ) : recommendedModules.length === 0 ? (
                    <div className="bg-stone-50 dark:bg-slate-700/30 p-4 rounded-2xl text-xs text-stone-500 dark:text-slate-400 italic border border-stone-100 dark:border-slate-700">
                      Modul khusus belum diunggah untuk tingkat kemampuan ini. Materi umum kuis dapat dipelajari kembali di Ruang Belajar.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recommendedModules.map(item => (
                        <div key={item.id} className="bg-stone-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-stone-100 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500 transition-colors flex items-center justify-between gap-3 group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'video_link' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                              item.type === 'pdf_upload' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                              {item.type === 'video_link' ? <Youtube className="w-5 h-5" /> : item.type === 'pdf_upload' ? <FileText className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-sm text-stone-800 dark:text-white truncate">{item.title}</h5>
                              <span className="text-[11px] text-stone-400 dark:text-slate-400 capitalize">
                                {item.type === 'video_link' ? 'Video Pembelajaran' : item.type === 'pdf_upload' ? 'Dokumen PDF' : 'Link Eksternal'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedMaterial(item)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-200 border dark:border-slate-600 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-colors flex items-center flex-shrink-0 shadow-sm"
                          >
                            Buka Modul
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved AI Diagnostic Feedback */}
                {displayFeedback && (
                  <div className="mt-6 pt-6 border-t border-stone-100 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-800 dark:text-white flex items-center">
                        <BrainCircuit className="w-4 h-4 mr-2 text-orange-500" />
                        AI Diagnostic Feedback
                        <Sparkles className="w-3.5 h-3.5 ml-1.5 text-amber-500 fill-amber-500" />
                      </h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        displayFeedback.generatedBy === 'gemini'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : 'bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-600'
                      }`}>
                        {displayFeedback.generatedBy === 'gemini' ? '✨ Gemini AI' : '⚡ Diagnostic Mimphy'}
                      </span>
                    </div>

                    {/* Ringkasan */}
                    <div className="bg-orange-50/60 dark:bg-slate-700/40 p-4 rounded-2xl border border-orange-100 dark:border-slate-600 text-xs text-stone-700 dark:text-slate-300 leading-relaxed font-medium">
                      <span className="font-bold text-red-900 dark:text-red-300 block mb-1">Ringkasan:</span>
                      {displayFeedback.summary}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Kekuatan */}
                      {displayFeedback.strengths && displayFeedback.strengths.length > 0 && (
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center mb-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Kekuatan Siswa
                          </span>
                          <ul className="space-y-1 text-emerald-800 dark:text-emerald-200">
                            {displayFeedback.strengths.map((item, i) => (
                              <li key={i} className="flex items-start">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-1.5 flex-shrink-0"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Area Perbaikan */}
                      {displayFeedback.areasToImprove && displayFeedback.areasToImprove.length > 0 && (
                        <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center mb-1.5">
                            <Target className="w-3.5 h-3.5 mr-1 text-amber-600" /> Area yang Perlu Diperbaiki
                          </span>
                          <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                            {displayFeedback.areasToImprove.map((item, i) => (
                              <li key={i} className="flex items-start">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-1.5 flex-shrink-0"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Saran Belajar */}
                    {displayFeedback.studyAdvice && displayFeedback.studyAdvice.length > 0 && (
                      <div className="bg-blue-50/60 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs">
                        <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center mb-1.5">
                          <BookOpen className="w-3.5 h-3.5 mr-1 text-blue-600" /> Saran Belajar Konkret
                        </span>
                        <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                          {displayFeedback.studyAdvice.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">{i + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Render Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
};
