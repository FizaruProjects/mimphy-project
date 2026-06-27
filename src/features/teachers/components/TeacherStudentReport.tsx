import React, { useState, useMemo, useEffect } from 'react';
import { StudentProfile } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { Award, Search, ChevronDown } from 'lucide-react';
import { StudentReportCard } from '@/features/students/components/StudentReportCard';

interface Props {
    onBack?: () => void;
}

export const TeacherStudentReport: React.FC<Props> = ({ onBack }) => {
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const [students, setStudents] = useState<StudentProfile[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const s = await SupabaseService.getStudents();
            setStudents(s);
        };
        fetchData();
    }, []);

    // Derived Data
    const uniqueClasses = useMemo(() => {
        const classes = new Set(students.map(s => s.className));
        return Array.from(classes).sort();
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (selectedClass === 'all') return students;
        return students.filter(s => s.className === selectedClass);
    }, [students, selectedClass]);

    return (
        <div className="space-y-6">
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
            {selectedStudentId ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StudentReportCard 
                        studentId={selectedStudentId} 
                        isTeacherView={true} 
                        onBack={() => setSelectedStudentId(null)} 
                    />
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

