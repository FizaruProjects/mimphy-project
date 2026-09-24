import React, { useState, useMemo, useRef } from 'react';
import { StudentResult, QuizPacket } from '@/types';
import { 
  analyzeDifficultyData, 
  DifficultyAnalysisFilters, 
  ConceptDifficulty 
} from '@/lib/conceptMapping';
import { DifficultyWordCloud } from '@/components/DifficultyWordCloud';
import { DifficultyDetailModal } from './DifficultyDetailModal';
import { 
  Cloud, 
  Filter, 
  Download, 
  BarChart2, 
  Info, 
  AlertCircle, 
  FileSpreadsheet, 
  Sparkles, 
  Table as TableIcon, 
  Calendar, 
  BookOpen, 
  Users, 
  RefreshCw 
} from 'lucide-react';

interface Props {
  results: StudentResult[];
  packets: QuizPacket[];
  onRefresh?: () => void;
}

export const DifficultyAnalyticsCard: React.FC<Props> = ({ results, packets, onRefresh }) => {
  // Filters State
  const [filters, setFilters] = useState<DifficultyAnalysisFilters>({
    className: 'all',
    topic: 'all',
    packetId: 'all',
    timeRange: 'all'
  });

  // Active View Tab: Word Cloud vs Performa Table
  const [activeView, setActiveView] = useState<'cloud' | 'table'>('cloud');

  // Selected concept for detail modal
  const [selectedConcept, setSelectedConcept] = useState<ConceptDifficulty | null>(null);

  // Compute Analysis Result
  const analysis = useMemo(() => {
    return analyzeDifficultyData(results, packets, filters);
  }, [results, packets, filters]);

  // Handle Export Word Cloud PNG
  const handleExportPNG = () => {
    if (!analysis.concepts || analysis.concepts.length === 0) {
      alert("Tidak ada data visualisasi untuk diunduh.");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e1b4b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Pemetaan Materi Sulit - Mimphy Analytics', 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`Berdasarkan ${analysis.totalRespondents} siswa • ${analysis.totalConceptsIdentified} materi teridentifikasi`, 40, 75);

    // Draw Word Cloud Items on Canvas
    const items = analysis.concepts.slice(0, 20);
    const startY = 140;
    const startX = 60;
    let currX = startX;
    let currY = startY;

    items.forEach((item) => {
      const fontSize = Math.min((item.fontSize || 18) + 6, 36);
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.fillStyle = item.color || '#ef4444';
      
      const textWidth = ctx.measureText(item.concept).width;
      
      if (currX + textWidth + 30 > canvas.width - 40) {
        currX = startX;
        currY += 50;
      }
      
      if (currY < canvas.height - 40) {
        ctx.fillText(item.concept, currX, currY);
        currX += textWidth + 35;
      }
    });

    // Trigger Image Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Pemetaan_Materi_Sulit_${Date.now()}.png`;
    link.click();
  };

  // Handle Export Analysis CSV
  const handleExportCSV = () => {
    if (!analysis.concepts || analysis.concepts.length === 0) {
      alert("Tidak ada data analisis untuk diunduh.");
      return;
    }

    let csv = 'Materi / Konsep,Kategori,Frekuensi (Siswa),Persentase Responden (%),Rata-rata Performa (%),Jumlah Soal,Indikator Terkait\n';
    
    analysis.concepts.forEach(item => {
      const escapedConcept = `"${item.concept.replace(/"/g, '""')}"`;
      const escapedIndicators = `"${(item.indicators || []).join('; ').replace(/"/g, '""')}"`;
      csv += `${escapedConcept},${item.category},${item.frequency},${item.percentage},${item.avgPerformance},${item.totalQuestions},${escapedIndicators}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analisis_Kesulitan_Materi_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6 transition-colors">
      
      {/* Header Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                Pemetaan Materi Sulit
                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Word Cloud
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Materi yang paling sering dianggap sulit berdasarkan respons siswa.
              </p>
            </div>
          </div>
        </div>

        {/* Statistical Overview Header */}
        <div className="flex items-center space-x-3 text-xs bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <div className="text-center px-2">
            <span className="block font-extrabold text-slate-900 dark:text-white text-sm font-mono">{analysis.totalRespondents}</span>
            <span className="text-[10px] text-slate-400">Siswa</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-center px-2">
            <span className="block font-extrabold text-red-600 dark:text-red-400 text-sm font-mono">{analysis.totalConceptsIdentified}</span>
            <span className="text-[10px] text-slate-400">Materi Teridentifikasi</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-center px-2">
            <span className="block font-extrabold text-indigo-600 dark:text-indigo-400 text-sm font-mono">{analysis.totalResponsesAnalyzed}</span>
            <span className="text-[10px] text-slate-400">Respons Dianalisis</span>
          </div>
        </div>
      </div>

      {/* Limited Data Warning Banner (Requirement #13) */}
      {analysis.isDataLimited && analysis.totalRespondents > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong>Data masih terbatas:</strong> Hanya {analysis.totalRespondents} siswa yang memberikan respons sejauh ini. Hasil analisis akan lebih akurat seiring bertambahnya partisipan.
            </span>
          </div>
        </div>
      )}

      {/* Filters & Controls Bar (Requirement #7) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        
        {/* Filter Dropdowns Group */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
          {/* Filter Kelas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kelas</label>
            <select
              value={filters.className}
              onChange={(e) => setFilters({ ...filters, className: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 font-semibold"
            >
              <option value="all">Semua Kelas</option>
              {analysis.availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Filter Materi */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Materi</label>
            <select
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 font-semibold"
            >
              <option value="all">Semua Materi</option>
              {analysis.availableTopics.map(top => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          {/* Filter Periode / Paket */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Paket Soal</label>
            <select
              value={filters.packetId}
              onChange={(e) => setFilters({ ...filters, packetId: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 font-semibold truncate"
            >
              <option value="all">Semua Paket</option>
              {analysis.availablePackets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Rentang Waktu */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rentang Waktu</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 font-semibold"
            >
              <option value="all">Semua Waktu</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="semester">Semester Ini</option>
            </select>
          </div>
        </div>

        {/* View Toggle & Export Actions */}
        <div className="flex items-center space-x-2 border-t lg:border-t-0 border-slate-200 dark:border-slate-700 pt-3 lg:pt-0">
          
          {/* View Toggle Buttons */}
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('cloud')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center transition-all ${
                activeView === 'cloud' 
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 mr-1.5" /> Word Cloud
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center transition-all ${
                activeView === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 mr-1.5" /> Tabel
            </button>
          </div>

          {/* Export Dropdown / Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExportPNG}
              className="p-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 rounded-lg font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
              title="Export Word Cloud PNG"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-red-500" /> PNG
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 rounded-lg font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center"
              title="Export Analisis CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-500" /> CSV
            </button>
          </div>

        </div>

      </div>

      {/* Main Visualization Container */}
      {analysis.concepts.length === 0 ? (
        /* Empty State (Requirement #12) */
        <div className="min-h-[260px] flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">
            <Cloud className="w-10 h-10 stroke-1" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-base">
              Belum ada data kesulitan materi.
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Data akan muncul secara otomatis setelah siswa menyelesaikan asesmen diagnostik.
            </p>
          </div>
        </div>
      ) : activeView === 'cloud' ? (
        /* Word Cloud View */
        <DifficultyWordCloud
          concepts={analysis.concepts}
          totalRespondents={analysis.totalRespondents}
          onSelectConcept={(c) => setSelectedConcept(c)}
        />
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Materi / Konsep</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Siswa Kesulitan</th>
                <th className="px-4 py-3">Persentase</th>
                <th className="px-4 py-3">Performa Asesmen</th>
                <th className="px-4 py-3">Jumlah Soal</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {analysis.concepts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {c.concept}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400">
                    {c.frequency} siswa
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    {c.percentage}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${c.avgPerformance < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {c.avgPerformance}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {c.totalQuestions}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedConcept(c)}
                      className="px-2.5 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold rounded hover:bg-red-200 transition-colors text-[11px]"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <DifficultyDetailModal
        concept={selectedConcept}
        onClose={() => setSelectedConcept(null)}
      />

    </div>
  );
};
