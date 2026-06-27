
import React, { useState, useMemo, useEffect } from 'react';
import { StudentResult, AbilityLevel, QuizPacket, LearningStyle, StudentProfile } from '../types';
import { ExportService } from '../services/exportService';
import { SupabaseService } from '../services/supabaseService';
import { RefreshCw, Users, Filter, FileSpreadsheet, Download, X, Calendar, BrainCircuit, BarChart3, Eye, Ear, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  results: StudentResult[];
  packets: QuizPacket[];
}

export const TeacherResults: React.FC<Props> = ({ results, packets }) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterPacket, setFilterPacket] = useState<string>('all');
  const [groupingMode, setGroupingMode] = useState<'ability' | 'style'>('ability');
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPacketId, setExportPacketId] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Load all students to map learning styles
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
        const students = await SupabaseService.getStudents();
        setAllStudents(students);
    };
    fetchStudents();
  }, []);

  // Helper to get style
  const getStudentStyle = (studentId: string): LearningStyle => {
      const student = allStudents.find(s => s.id === studentId);
      return student?.learningStyle || LearningStyle.VISUAL; // Default fallback
  };

  // Get unique classes from results for the filter dropdown
  const uniqueClasses = useMemo(() => {
    const classes = new Set(results.map(r => r.className));
    return Array.from(classes).sort();
  }, [results]);

  // Filter results based on selected class AND selected packet
  const filteredResults = useMemo(() => {
      return results.filter(r => {
          const matchClass = filterClass === 'all' || r.className === filterClass;
          const matchPacket = filterPacket === 'all' || r.packetId === filterPacket;
          return matchClass && matchPacket;
      });
  }, [results, filterClass, filterPacket]);

  // Group students by ability level
  const groupedByAbility = useMemo(() => {
      return {
          [AbilityLevel.HIGH]: filteredResults.filter(r => r.abilityLevel === AbilityLevel.HIGH),
          [AbilityLevel.MEDIUM]: filteredResults.filter(r => r.abilityLevel === AbilityLevel.MEDIUM),
          [AbilityLevel.BASIC]: filteredResults.filter(r => r.abilityLevel === AbilityLevel.BASIC),
      };
  }, [filteredResults]);

  // Group students by Learning Style
  const groupedByStyle = useMemo(() => {
      return {
          [LearningStyle.VISUAL]: filteredResults.filter(r => getStudentStyle(r.studentId) === LearningStyle.VISUAL),
          [LearningStyle.AUDITORY]: filteredResults.filter(r => getStudentStyle(r.studentId) === LearningStyle.AUDITORY),
          [LearningStyle.KINESTHETIC]: filteredResults.filter(r => getStudentStyle(r.studentId) === LearningStyle.KINESTHETIC),
      };
  }, [filteredResults, allStudents]);

  // Chart Data Dynamic
  const chartData = useMemo(() => {
      if (groupingMode === 'ability') {
          return [
            { name: 'Tinggi', count: filteredResults.filter(r => r.abilityLevel === AbilityLevel.HIGH).length, color: '#22c55e' },
            { name: 'Sedang', count: filteredResults.filter(r => r.abilityLevel === AbilityLevel.MEDIUM).length, color: '#eab308' },
            { name: 'Dasar', count: filteredResults.filter(r => r.abilityLevel === AbilityLevel.BASIC).length, color: '#ef4444' },
          ];
      } else {
          return [
            { name: 'Visual', count: groupedByStyle[LearningStyle.VISUAL].length, color: '#3b82f6' },
            { name: 'Auditori', count: groupedByStyle[LearningStyle.AUDITORY].length, color: '#a855f7' },
            { name: 'Kinestetik', count: groupedByStyle[LearningStyle.KINESTHETIC].length, color: '#f97316' },
          ];
      }
  }, [filteredResults, groupingMode, groupedByStyle]);

  const handleExport = () => {
      if (!exportPacketId) {
          alert("Silakan pilih paket soal terlebih dahulu.");
          return;
      }

      const packet = packets.find(p => p.id === exportPacketId);
      if (!packet) return;

      const start = dateRange.start ? new Date(dateRange.start).getTime() : null;
      const end = dateRange.end ? new Date(dateRange.end).setHours(23, 59, 59) : null;
      const resultsForExport = results.filter(r => r.packetId === exportPacketId);

      ExportService.downloadExcel(packet, resultsForExport, start, end);
      setShowExportModal(false);
  };

  return (
    <div className="space-y-6 relative">
        
        {/* EXPORT MODAL */}
        {showExportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white dark:border-slate-700 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-stone-800 dark:text-white flex items-center">
                            <FileSpreadsheet className="w-6 h-6 mr-2 text-green-600" />
                            Export Data Excel
                        </h3>
                        <button onClick={() => setShowExportModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-600 dark:text-slate-300 mb-2">Pilih Paket Soal</label>
                            <select 
                                className="w-full p-3 border rounded-xl bg-stone-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-green-200"
                                value={exportPacketId}
                                onChange={e => setExportPacketId(e.target.value)}
                            >
                                <option value="">-- Pilih Paket --</option>
                                {packets.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.questions.length} Soal)</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 mb-1">Dari Tanggal</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
                                    <input 
                                        type="date" 
                                        className="w-full pl-9 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-stone-800 dark:text-white"
                                        value={dateRange.start}
                                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 mb-1">Sampai Tanggal</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/>
                                    <input 
                                        type="date" 
                                        className="w-full pl-9 p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-stone-800 dark:text-white"
                                        value={dateRange.end}
                                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-100 dark:border-green-900 text-xs text-green-800 dark:text-green-300 mt-2">
                            <p><strong>Info:</strong> File Excel akan berisi 3 Sheet:</p>
                            <ul className="list-disc ml-4 mt-1 space-y-1">
                                <li>Rekap Nilai Siswa</li>
                                <li>Analisis Butir Soal (Validitas)</li>
                                <li>Data Mentah Jawaban</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                        <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-200 font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                        <button 
                            onClick={handleExport}
                            disabled={!exportPacketId}
                            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 dark:shadow-none"
                        >
                            <Download className="w-4 h-4 mr-2" /> Unduh .xlsx
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Filter Section */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center space-x-2 text-stone-600 dark:text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span className="text-sm">Data diperbarui otomatis setiap 5 detik</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center space-x-2 bg-stone-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-600">
                    <Filter className="w-4 h-4 text-stone-400 dark:text-slate-300" />
                    <span className="text-sm font-bold text-stone-600 dark:text-slate-200">Filter:</span>
                </div>

                {/* Filter Kelas */}
                <select 
                    className="p-2 border dark:border-slate-600 rounded-lg text-sm min-w-[150px] outline-none focus:ring-2 focus:ring-red-100 bg-white dark:bg-slate-900 text-stone-800 dark:text-white"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                >
                    <option value="all">Semua Kelas</option>
                    {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>

                {/* Filter Paket Soal */}
                <select 
                    className="p-2 border dark:border-slate-600 rounded-lg text-sm min-w-[200px] outline-none focus:ring-2 focus:ring-red-100 bg-white dark:bg-slate-900 text-stone-800 dark:text-white"
                    value={filterPacket}
                    onChange={(e) => setFilterPacket(e.target.value)}
                >
                    <option value="all">Semua Paket Soal</option>
                    {packets.map(pkt => (
                        <option key={pkt.id} value={pkt.id}>
                            {pkt.id} - {pkt.name}
                        </option>
                    ))}
                </select>

                {/* EXPORT BUTTON */}
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-sm font-bold transition-colors border border-green-200 dark:border-green-800"
                >
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
                </button>
            </div>
        </div>

        {/* Statistics Section */}
        <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-slate-700 col-span-2 transition-colors">
                <h3 className="font-semibold text-lg mb-6 flex items-center justify-between text-stone-800 dark:text-white">
                    <span>
                        Distribusi {groupingMode === 'ability' ? 'Kemampuan' : 'Gaya Belajar'}
                    </span>
                    {(filterClass !== 'all' || filterPacket !== 'all') && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                            {filterClass !== 'all' ? filterClass : 'Semua Kelas'} &bull; {filterPacket !== 'all' ? filterPacket : 'Semua Paket'}
                        </span>
                    )}
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.3} />
                            <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis allowDecimals={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{borderRadius: '8px', backgroundColor: '#1e293b', border: 'none', color: '#fff'}} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-slate-700 transition-colors">
                <h3 className="font-semibold text-lg mb-4 text-stone-800 dark:text-white">Ringkasan</h3>
                <div className="space-y-4">
                    <div className="bg-stone-50 dark:bg-slate-700/50 p-4 rounded-lg border border-stone-100 dark:border-slate-600">
                        <p className="text-sm text-stone-500 dark:text-slate-400 font-medium">Total Siswa</p>
                        <p className="text-3xl font-black text-stone-800 dark:text-white">{filteredResults.length}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/40">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Rata-rata Nilai</p>
                        <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
                            {filteredResults.length > 0 
                                ? Math.round(filteredResults.reduce((a, b) => a + b.score, 0) / filteredResults.length) 
                                : 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Groups Toggle & Display */}
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-xl text-stone-800 dark:text-white flex items-center">
                        <Users className="w-6 h-6 mr-2 text-red-600" />
                        Rekomendasi Kelompok Belajar
                    </h3>
                    <p className="text-stone-500 dark:text-slate-400 text-sm">Siswa dikelompokkan secara otomatis.</p>
                </div>
                
                {/* MODE TOGGLE */}
                <div className="flex bg-stone-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button 
                        onClick={() => setGroupingMode('ability')}
                        className={`px-4 py-2 text-sm font-bold rounded-md flex items-center transition-all ${groupingMode === 'ability' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-white shadow-sm' : 'text-stone-500 dark:text-slate-400'}`}
                    >
                        <BarChart3 className="w-4 h-4 mr-2"/> Hasil Belajar
                    </button>
                    <button 
                        onClick={() => setGroupingMode('style')}
                        className={`px-4 py-2 text-sm font-bold rounded-md flex items-center transition-all ${groupingMode === 'style' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-white shadow-sm' : 'text-stone-500 dark:text-slate-400'}`}
                    >
                        <BrainCircuit className="w-4 h-4 mr-2"/> Gaya Belajar
                    </button>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                {/* CONDITIONAL RENDERING BASED ON MODE */}
                
                {groupingMode === 'ability' ? (
                    <>
                        {/* High Ability Group */}
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/40 p-4">
                            <div className="flex items-center justify-between mb-4 border-b border-green-200 dark:border-green-900/40 pb-2">
                                <h4 className="font-bold text-green-800 dark:text-green-400 flex items-center"><Users className="w-4 h-4 mr-2"/> Kelompok Mahir</h4>
                                <span className="bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {groupedByAbility[AbilityLevel.HIGH].length} Siswa
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-green-200">
                                {groupedByAbility[AbilityLevel.HIGH].map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-green-100 dark:border-green-900/30 hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.studentName}</div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{r.className}</span>
                                            <span className="font-mono font-bold text-green-600 dark:text-green-400">{r.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Medium Ability Group */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/40 p-4">
                            <div className="flex items-center justify-between mb-4 border-b border-yellow-200 dark:border-yellow-900/40 pb-2">
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center"><Users className="w-4 h-4 mr-2"/> Kelompok Sedang</h4>
                                <span className="bg-white dark:bg-slate-800 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {groupedByAbility[AbilityLevel.MEDIUM].length} Siswa
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-yellow-200">
                                {groupedByAbility[AbilityLevel.MEDIUM].map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-yellow-100 dark:border-yellow-900/30 hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.studentName}</div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{r.className}</span>
                                            <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">{r.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Basic Ability Group */}
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/40 p-4">
                            <div className="flex items-center justify-between mb-4 border-b border-red-200 dark:border-red-900/40 pb-2">
                                <h4 className="font-bold text-red-800 dark:text-red-400 flex items-center"><Users className="w-4 h-4 mr-2"/> Kelompok Dasar</h4>
                                <span className="bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {groupedByAbility[AbilityLevel.BASIC].length} Siswa
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-200">
                                {groupedByAbility[AbilityLevel.BASIC].map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-red-100 dark:border-red-900/30 hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.studentName}</div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{r.className}</span>
                                            <span className="font-mono font-bold text-red-600 dark:text-red-400">{r.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Visual Group */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/40 p-4">
                            <div className="flex items-center justify-between mb-4 border-b border-blue-200 dark:border-blue-900/40 pb-2">
                                <h4 className="font-bold text-blue-800 dark:text-blue-400 flex items-center"><Eye className="w-4 h-4 mr-2"/> Kelompok Visual</h4>
                                <span className="bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {groupedByStyle[LearningStyle.VISUAL].length} Siswa
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-200">
                                {groupedByStyle[LearningStyle.VISUAL].map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.studentName}</div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{r.className}</span>
                                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{r.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Auditory Group */}
                        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-900/40 p-4">
                            <div className="flex items-center justify-between mb-4 border-b border-purple-200 dark:border-purple-900/40 pb-2">
                                <h4 className="font-bold text-purple-800 dark:text-purple-400 flex items-center"><Ear className="w-4 h-4 mr-2"/> Kelompok Auditori</h4>
                                <span className="bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {groupedByStyle[LearningStyle.AUDITORY].length} Siswa
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-200">
                                {groupedByStyle[LearningStyle.AUDITORY].map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900/30 hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.studentName}</div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{r.className}</span>
                                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{r.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kinesthetic Group */}
                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-900/40 p-4">
                            <div className="flex items-center justify-between mb-4 border-b border-orange-200 dark:border-orange-900/40 pb-2">
                                <h4 className="font-bold text-orange-800 dark:text-orange-400 flex items-center"><Activity className="w-4 h-4 mr-2"/> Kelompok Kinestetik</h4>
                                <span className="bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {groupedByStyle[LearningStyle.KINESTHETIC].length} Siswa
                                </span>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200">
                                {groupedByStyle[LearningStyle.KINESTHETIC].map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-orange-100 dark:border-orange-900/30 hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.studentName}</div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{r.className}</span>
                                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{r.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* Existing Table View */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-8 transition-colors">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200">
                Detail Riwayat Pengerjaan
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 whitespace-nowrap">Waktu</th>
                            <th className="px-6 py-3 whitespace-nowrap">Nama Siswa</th>
                            <th className="px-6 py-3 whitespace-nowrap">Kelas</th>
                            <th className="px-6 py-3 whitespace-nowrap">Paket Soal</th>
                            <th className="px-6 py-3 whitespace-nowrap">Nilai</th>
                            <th className="px-6 py-3 whitespace-nowrap">Kemampuan</th>
                            <th className="px-6 py-3 whitespace-nowrap">Gaya Belajar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredResults.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Tidak ada data hasil kuis yang cocok dengan filter.</td></tr>
                        )}
                        {filteredResults.sort((a,b) => b.timestamp - a.timestamp).map(r => {
                            const style = getStudentStyle(r.studentId);
                            return (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{r.studentName}</td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{r.className}</td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs"><span className="bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded">{r.packetId}</span></td>
                                    <td className="px-6 py-3 font-bold dark:text-white">{r.score}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            r.abilityLevel === AbilityLevel.HIGH ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                            r.abilityLevel === AbilityLevel.MEDIUM ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}>
                                            {r.abilityLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex w-fit items-center gap-1 ${
                                            style === LearningStyle.VISUAL ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                            style === LearningStyle.AUDITORY ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                            'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                        }`}>
                                            {style === LearningStyle.VISUAL && <Eye className="w-3 h-3"/>}
                                            {style === LearningStyle.AUDITORY && <Ear className="w-3 h-3"/>}
                                            {style === LearningStyle.KINESTHETIC && <Activity className="w-3 h-3"/>}
                                            {style}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
