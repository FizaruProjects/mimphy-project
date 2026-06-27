import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StudentProfile, StudentResult, QuizPacket, Question, LearningStyle, AbilityLevel } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { User, BookOpen, BrainCircuit, Award, Calendar, Download, Printer, Search, X, ChevronDown, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell } from 'recharts';
import html2pdf from 'html2pdf.js';

interface Props {
    onBack?: () => void;
}

export const TeacherStudentReport: React.FC<Props> = ({ onBack }) => {
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [results, setResults] = useState<StudentResult[]>([]);
    const [packets, setPackets] = useState<QuizPacket[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [s, r, p] = await Promise.all([
                SupabaseService.getStudents(),
                SupabaseService.getResults(),
                SupabaseService.getPackets()
            ]);
            setStudents(s);
            setResults(r);
            setPackets(p);
        };
        fetchData();
    }, []);

    const handlePrint = () => {
        // Add print-mode class to body
        document.body.classList.add('print-mode');
        window.print();
        // Remove class after print dialog closes (or immediately, as print() blocks in some browsers)
        // We use a small timeout to ensure the print dialog has opened
        setTimeout(() => {
            document.body.classList.remove('print-mode');
        }, 500);
    };

    const handleDownloadPDF = () => {
        if (!selectedStudent) return;
        const element = document.getElementById('printable-area');
        if (!element) return;

        const opt = {
            margin:       [10, 10, 10, 10], // Top, Right, Bottom, Left
            filename:     `Rapor_${selectedStudent.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // @ts-ignore
        html2pdf().set(opt).from(element).save();
    };

    // Derived Data
    const uniqueClasses = useMemo(() => {
        const classes = new Set(students.map(s => s.className));
        return Array.from(classes).sort();
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (selectedClass === 'all') return students;
        return students.filter(s => s.className === selectedClass);
    }, [students, selectedClass]);

    const selectedStudent = useMemo(() => {
        return students.find(s => s.id === selectedStudentId);
    }, [students, selectedStudentId]);

    const studentResults = useMemo(() => {
        if (!selectedStudentId) return [];
        return results.filter(r => r.studentId === selectedStudentId).sort((a, b) => b.timestamp - a.timestamp);
    }, [results, selectedStudentId]);

    // Competency Analysis
    const competencyData = useMemo(() => {
        if (studentResults.length === 0) return [];

        const topicStats: Record<string, { total: number; correct: number }> = {};

        studentResults.forEach(result => {
            const packet = packets.find(p => p.id === result.packetId);
            if (!packet) return;

            // We need detailed answers to map to topics. 
            // If result.answers is just boolean[], we assume it maps to packet.questions by index.
            result.answers.forEach((isCorrect, index) => {
                const question = packet.questions[index];
                if (!question) return;

                const topic = question.topic || 'Umum';
                if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
                
                topicStats[topic].total += 1;
                if (isCorrect) topicStats[topic].correct += 1;
            });
        });

        return Object.keys(topicStats).map(topic => ({
            subject: topic,
            A: Math.round((topicStats[topic].correct / topicStats[topic].total) * 100),
            fullMark: 100
        }));
    }, [studentResults, packets]);

    // Difficulty Analysis
    const difficultyStats = useMemo(() => {
        if (studentResults.length === 0) return [];
        
        const stats: Record<string, { total: number; correct: number }> = {};
        
        studentResults.forEach(result => {
            const packet = packets.find(p => p.id === result.packetId);
            if (!packet) return;

            result.answers.forEach((isCorrect, index) => {
                const question = packet.questions[index];
                if (!question) return;

                const diff = question.difficulty;
                if (!stats[diff]) stats[diff] = { total: 0, correct: 0 };
                
                stats[diff].total += 1;
                if (isCorrect) stats[diff].correct += 1;
            });
        });

        return Object.keys(stats).map(diff => ({
            name: diff,
            score: Math.round((stats[diff].correct / stats[diff].total) * 100)
        }));
    }, [studentResults, packets]);

    // Average Score
    const averageScore = useMemo(() => {
        if (studentResults.length === 0) return 0;
        return Math.round(studentResults.reduce((acc, curr) => acc + curr.score, 0) / studentResults.length);
    }, [studentResults]);

    return (
        <div className="space-y-6">
            <style>{`
                @media print {
                    body.print-mode {
                        visibility: hidden;
                        height: auto;
                        overflow: visible;
                    }
                    body.print-mode #printable-area {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                        z-index: 9999;
                        background: white;
                    }
                    /* Ensure charts and colors print correctly */
                    body.print-mode * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide non-printable elements inside the printable area if any */
                    body.print-mode .no-print {
                        display: none !important;
                    }
                    /* Reset shadows and borders for print */
                    body.print-mode .print\\:shadow-none { box-shadow: none !important; }
                    body.print-mode .print\\:border-none { border: none !important; }
                    body.print-mode .print\\:rounded-none { border-radius: 0 !important; }
                    
                    @page { size: A4 landscape; margin: 15mm; }
                }
            `}</style>
            {/* Header / Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                    <Award className="w-8 h-8 mr-3 text-red-600" />
                    Rapor Kompetensi Siswa
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Pilih Kelas</label>
                        <div className="relative">
                            <select 
                                className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white appearance-none focus:ring-2 focus:ring-red-200 outline-none"
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedStudentId(null); // Reset student when class changes
                                }}
                            >
                                <option value="all">Semua Kelas</option>
                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Pilih Siswa</label>
                        <div className="relative">
                            <select 
                                className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white appearance-none focus:ring-2 focus:ring-red-200 outline-none disabled:opacity-50"
                                value={selectedStudentId || ''}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                disabled={filteredStudents.length === 0}
                            >
                                <option value="">-- Pilih Siswa --</option>
                                {filteredStudents.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {selectedStudent ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Action Bar */}
                    <div className="flex justify-end space-x-3">
                        <button 
                            onClick={handleDownloadPDF}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download PDF
                        </button>
                        <button 
                            onClick={() => handlePrint()}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            <Printer className="w-4 h-4 mr-2" /> Cetak Rapor
                        </button>
                    </div>

                    {/* Printable Area */}
                    <div id="printable-area" ref={componentRef} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 text-slate-900 print:shadow-none print:border-none print:rounded-none">
                        
                        {/* Report Header */}
                        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 mb-2">RAPOR KOMPETENSI</h1>
                                <p className="text-slate-500 font-medium">Laporan Hasil Belajar Mimphy Catalyze</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500">Tanggal Cetak</div>
                                <div className="font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                        </div>

                        {/* Student Info Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-2xl print:bg-slate-50 break-inside-avoid">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Siswa</div>
                                <div className="text-xl font-bold text-slate-800">{selectedStudent.name}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kelas</div>
                                <div className="text-xl font-bold text-slate-800">{selectedStudent.className}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gaya Belajar Dominan</div>
                                <div className="text-xl font-bold text-slate-800 flex items-center">
                                    <BrainCircuit className="w-5 h-5 mr-2 text-orange-500" />
                                    {selectedStudent.learningStyle || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rata-rata Nilai</div>
                                <div className={`text-xl font-black ${averageScore >= 80 ? 'text-green-600' : averageScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {averageScore}
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:grid-cols-2 break-inside-avoid">
                            {/* Radar Chart: Competency by Topic */}
                            <div className="border rounded-2xl p-4 break-inside-avoid">
                                <h3 className="font-bold text-lg mb-4 text-center">Penguasaan Materi</h3>
                                <div className="h-64">
                                    {competencyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                                <Radar name="Siswa" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data materi</div>
                                    )}
                                </div>
                            </div>

                            {/* Bar Chart: Performance by Difficulty */}
                            <div className="border rounded-2xl p-4 break-inside-avoid">
                                <h3 className="font-bold text-lg mb-4 text-center">Analisis Kesulitan Soal</h3>
                                <div className="h-64">
                                    {difficultyStats.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={difficultyStats} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" domain={[0, 100]} />
                                                <YAxis dataKey="name" type="category" width={80} />
                                                <Tooltip cursor={{fill: 'transparent'}} />
                                                <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                                    {difficultyStats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.score >= 70 ? '#22c55e' : entry.score >= 50 ? '#eab308' : '#ef4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data kesulitan</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detailed History Table */}
                        <div className="mb-8 break-inside-avoid">
                            <h3 className="font-bold text-lg mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2" /> Riwayat Pengerjaan Kuis
                            </h3>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-300">
                                        <th className="p-3 font-bold text-slate-700">Tanggal</th>
                                        <th className="p-3 font-bold text-slate-700">Paket Soal</th>
                                        <th className="p-3 font-bold text-slate-700 text-center">Nilai</th>
                                        <th className="p-3 font-bold text-slate-700 text-center">Predikat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentResults.map((r, idx) => {
                                        const packetName = packets.find(p => p.id === r.packetId)?.name || 'Paket Terhapus';
                                        return (
                                            <tr key={idx} className="border-b border-slate-200">
                                                <td className="p-3 text-slate-600">{new Date(r.timestamp).toLocaleDateString('id-ID')}</td>
                                                <td className="p-3 font-medium text-slate-800">{packetName}</td>
                                                <td className="p-3 text-center font-bold">{r.score}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        r.score >= 85 ? 'bg-green-100 text-green-700' :
                                                        r.score >= 70 ? 'bg-blue-100 text-blue-700' :
                                                        r.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {r.score >= 85 ? 'Sangat Baik' : r.score >= 70 ? 'Baik' : r.score >= 50 ? 'Cukup' : 'Perlu Bimbingan'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {studentResults.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-slate-400 italic">Belum ada riwayat pengerjaan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 break-inside-avoid print:bg-white print:border-slate-200">
                            <h3 className="font-bold text-lg mb-3 text-blue-800 print:text-slate-800 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2" /> Rekomendasi Pengembangan
                            </h3>
                            <ul className="list-disc ml-5 space-y-2 text-sm text-blue-900 print:text-slate-700">
                                {averageScore < 70 && (
                                    <li>Perlu meningkatkan pemahaman konsep dasar fisika. Disarankan untuk mengulang materi modul level Dasar.</li>
                                )}
                                {competencyData.some(c => c.A < 60) && (
                                    <li>Fokus belajar pada topik: <strong>{competencyData.filter(c => c.A < 60).map(c => c.subject).join(', ')}</strong>.</li>
                                )}
                                {selectedStudent.learningStyle === LearningStyle.VISUAL && (
                                    <li>Gunakan lebih banyak diagram, grafik, dan video simulasi untuk membantu pemahaman.</li>
                                )}
                                {selectedStudent.learningStyle === LearningStyle.AUDITORY && (
                                    <li>Disarankan berdiskusi dengan teman atau mendengarkan penjelasan audio/video.</li>
                                )}
                                {selectedStudent.learningStyle === LearningStyle.KINESTHETIC && (
                                    <li>Perbanyak latihan soal dan eksperimen virtual (jika tersedia) untuk memperkuat ingatan.</li>
                                )}
                                {studentResults.length > 0 && studentResults[0].score > 90 && (
                                    <li>Pertahankan prestasi! Cobalah tantangan soal dengan tingkat kesulitan Sulit (HOTS) untuk pengayaan.</li>
                                )}
                            </ul>
                        </div>

                        {/* Footer Signature Area for Print */}
                        <div className="hidden print:flex justify-between mt-16 pt-8 break-inside-avoid">
                            <div className="text-center">
                                <p className="mb-20">Orang Tua/Wali</p>
                                <p className="font-bold border-t border-black pt-1 w-48 mx-auto">.........................</p>
                            </div>
                            <div className="text-center">
                                <p className="mb-20">Guru Mata Pelajaran</p>
                                <p className="font-bold border-t border-black pt-1 w-48 mx-auto">.........................</p>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                    <Search className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Pilih siswa untuk melihat rapor kompetensi</p>
                </div>
            )}
        </div>
    );
};
