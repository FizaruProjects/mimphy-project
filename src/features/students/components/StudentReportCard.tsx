import React, { useMemo, useRef, useState, useEffect } from 'react';
import { SupabaseService } from '@/lib/supabaseService';
import { Printer, BookOpen, Award, UserCircle, School, BrainCircuit, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import { StudentProfile } from '@/types';

interface Props {
  studentId: string;
  onBack?: () => void;
  isTeacherView?: boolean; // If true, enables editing/inputting grades (future) or just viewing
}

export const StudentReportCard: React.FC<Props> = ({ studentId, onBack, isTeacherView = false }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [student, setStudent] = useState<StudentProfile | undefined>(undefined);
  const [reportData, setReportData] = useState<Map<string, { 
      teacherName: string, 
      topics: Map<string, {
          indicators: Map<string, { total: number, correct: number }>
      }> 
  }>>(new Map());

  useEffect(() => {
      const fetchData = async () => {
          const allStudents = await SupabaseService.getStudents();
          const s = allStudents.find(s => s.id === studentId);
          setStudent(s);

          if (s) {
              const allResults = await SupabaseService.getResults();
              const myResults = allResults.filter(r => r.studentId === studentId);
              const allPackets = await SupabaseService.getPackets();
              const allTeachers = await SupabaseService.getTeachers();

              // Structure: Subject -> { teacherName, topics: Map<TopicName, { indicators: Map<IndicatorName, Stats> }> }
              const data = new Map<string, { 
                  teacherName: string, 
                  topics: Map<string, {
                      indicators: Map<string, { total: number, correct: number }>
                  }> 
              }>();

              myResults.forEach(result => {
                  const packet = allPackets.find(p => p.id === result.packetId);
                  if (!packet) return;

                  const teacher = allTeachers.find(t => t.id === packet.teacherId);
                  const subjectName = teacher?.subject || 'Umum';
                  const teacherName = teacher?.name || 'Guru';

                  if (!data.has(subjectName)) {
                      data.set(subjectName, { teacherName, topics: new Map() });
                  }
                  const subjectData = data.get(subjectName)!;

                  result.answers.forEach((isCorrect, idx) => {
                      const question = packet.questions[idx];
                      if (question) {
                          const topic = question.topic || 'Topik Umum';
                          const indicator = question.indicator || 'Indikator Umum';

                          if (!subjectData.topics.has(topic)) {
                              subjectData.topics.set(topic, { indicators: new Map() });
                          }
                          const topicData = subjectData.topics.get(topic)!;

                          if (!topicData.indicators.has(indicator)) {
                              topicData.indicators.set(indicator, { total: 0, correct: 0 });
                          }
                          const stats = topicData.indicators.get(indicator)!;
                          
                          stats.total += 1;
                          if (isCorrect) stats.correct += 1;
                      }
                  });
              });
              setReportData(data);
          }
      };
      fetchData();
  }, [studentId]);

  const handlePrint = () => {
      if (componentRef.current) {
          const printContent = componentRef.current.innerHTML;
          const originalContents = document.body.innerHTML;
          
          // Create a temporary container for printing to avoid messing up React state
          const printWindow = window.open('', '', 'height=600,width=800');
          if (printWindow) {
              printWindow.document.write('<html><head><title>Rapor Siswa</title>');
              // Add Tailwind CDN for styling in print window
              printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
              printWindow.document.write('</head><body >');
              printWindow.document.write(printContent);
              printWindow.document.write('</body></html>');
              printWindow.document.close();
              printWindow.print();
          }
      }
  };

  if (!student) return <div className="p-8 text-center text-red-500">Data siswa tidak ditemukan. ID: {studentId}</div>;

  return (
    <div className="bg-stone-50 dark:bg-slate-900 min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button onClick={onBack} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
                </button>
                <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg font-bold hover:bg-blue-700 transition-colors flex items-center">
                    <Printer className="w-4 h-4 mr-2" /> Cetak / Export PDF
                </button>
            </div>

            {/* Printable Area */}
            <div ref={componentRef} className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[2rem] shadow-sm border border-stone-200 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
                
                {/* Report Header */}
                <div className="text-center border-b-2 border-stone-100 dark:border-slate-700 pb-8 mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Award className="w-12 h-12 text-orange-500 mr-3" />
                        <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white uppercase tracking-wider">Laporan Kompetensi Siswa</h1>
                    </div>
                    <p className="text-stone-500 dark:text-slate-400 font-medium">Semester Ganjil {new Date().getFullYear()}/{new Date().getFullYear()+1}</p>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-6 mb-10 bg-stone-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-stone-100 dark:border-slate-600 print:bg-transparent print:border-stone-300">
                    <div>
                        <p className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-1">Nama Siswa</p>
                        <p className="text-lg font-bold text-stone-800 dark:text-white flex items-center">
                            <UserCircle className="w-5 h-5 mr-2 text-stone-400" /> {student.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-1">Kelas</p>
                        <p className="text-lg font-bold text-stone-800 dark:text-white flex items-center">
                            <School className="w-5 h-5 mr-2 text-stone-400" /> {student.className}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-1">Sekolah</p>
                        <p className="text-lg font-bold text-stone-800 dark:text-white">{student.schoolName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-1">Gaya Belajar</p>
                        <p className="text-lg font-bold text-stone-800 dark:text-white flex items-center">
                            <BrainCircuit className="w-5 h-5 mr-2 text-stone-400" /> {student.learningStyle || '-'}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {reportData.size === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-stone-400 italic">Belum ada data hasil kuis yang terekam.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Array.from(reportData.entries()).map(([subject, data]) => (
                            <div key={subject} className="break-inside-avoid mb-8">
                                <div className="flex items-center justify-between mb-6 border-b-2 border-red-100 dark:border-red-900/30 pb-2">
                                    <h2 className="text-2xl font-black text-red-700 dark:text-red-400 uppercase tracking-tight">{subject}</h2>
                                    <span className="text-sm font-bold text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-700 px-3 py-1 rounded-full">Guru: {data.teacherName}</span>
                                </div>

                                <div className="space-y-8">
                                    {Array.from(data.topics.entries()).map(([topic, topicData]) => (
                                        <div key={topic} className="bg-stone-50 dark:bg-slate-700/20 rounded-xl p-6 border border-stone-100 dark:border-slate-700 print:bg-transparent print:border-stone-200">
                                            <h3 className="font-bold text-lg text-stone-800 dark:text-white mb-4 flex items-center border-b border-stone-200 dark:border-slate-600 pb-2">
                                                <BookOpen className="w-5 h-5 mr-2 text-stone-400" /> {topic}
                                            </h3>
                                            
                                            <div className="grid gap-4">
                                                {Array.from(topicData.indicators.entries()).map(([indicator, stats]) => {
                                                    const percentage = Math.round((stats.correct / stats.total) * 100);
                                                    const isMastered = percentage >= 70;
                                                    
                                                    return (
                                                        <div key={indicator} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border border-stone-200 dark:border-slate-600 shadow-sm print:shadow-none print:border-stone-300">
                                                            <div className="flex-1 mr-6">
                                                                <p className="text-sm font-bold text-stone-700 dark:text-slate-300 mb-2">{indicator}</p>
                                                                <div className="w-full bg-stone-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden print:border print:border-stone-300">
                                                                    <div className={`h-full rounded-full ${isMastered ? 'bg-green-500' : 'bg-orange-500'} print:bg-black`} style={{ width: `${percentage}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 min-w-[120px] justify-end">
                                                                <div className="text-right">
                                                                    <span className="block text-xs font-bold text-stone-500 dark:text-slate-400">{stats.correct}/{stats.total} Benar</span>
                                                                    <span className={`block text-lg font-black ${isMastered ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{percentage}%</span>
                                                                </div>
                                                                {isMastered ? (
                                                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="w-8 h-8 text-orange-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Signature Area */}
                <div className="mt-20 pt-8 border-t border-stone-200 dark:border-slate-700 grid grid-cols-3 gap-8 text-center break-inside-avoid print:mt-12">
                    <div>
                        <p className="text-sm text-stone-500 mb-20 font-bold">Mengetahui,<br/>Orang Tua/Wali</p>
                        <div className="border-b border-stone-400 w-2/3 mx-auto"></div>
                    </div>
                    <div>
                        <p className="text-sm text-stone-500 mb-20 font-bold">Kepala Sekolah</p>
                        <div className="border-b border-stone-400 w-2/3 mx-auto"></div>
                    </div>
                    <div>
                        <p className="text-sm text-stone-500 mb-20 font-bold">Wali Kelas</p>
                        <div className="border-b border-stone-400 w-2/3 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
