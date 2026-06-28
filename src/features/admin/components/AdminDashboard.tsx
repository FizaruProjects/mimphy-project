import React, { useState, useEffect, useMemo } from 'react';
import { SupabaseService } from '@/lib/supabaseService';
import { TeacherProfile, StudentProfile, QuizPacket, Question, StudentResult, AbilityLevel, LearningStyle } from '@/types';
import { Users, BookOpen, BarChart3, Shield, Key, Power, UserCheck, UserX, Search, AlertCircle, X, AlertTriangle, Lock, LogOut, GraduationCap, School, Plus, BrainCircuit, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, PieChart, Pie, Cell } from 'recharts';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ContributionGraph } from '@/components/ContributionGraph';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useDebounce } from '@/hooks/useDebounce';
import { useTeachers } from '@/hooks/useTeachers';
import { useStudents } from '@/hooks/useStudents';
import { useQuestions } from '@/hooks/useQuestions';
import { useQuizPackets } from '@/hooks/useQuizPackets';
import { useResults } from '@/hooks/useResults';

interface Props {
    onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'students' | 'analytics'>('overview');
    
    const { data: teachers = [], refetch: refetchTeachers } = useTeachers();
    const { data: students = [], refetch: refetchStudents } = useStudents();
    const { data: questions = [], refetch: refetchQuestions } = useQuestions();
    const { data: packets = [], refetch: refetchPackets } = useQuizPackets();
    const { data: results = [], refetch: refetchResults } = useResults();

    const [filterTime, setFilterTime] = useState<'all' | 'month' | 'week'>('all');
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Modal State
    const [resetTarget, setResetTarget] = useState<{id: string, name: string, type: 'teacher'|'student'} | null>(null);
    // const [newPassword, setNewPassword] = useState(''); // Deprecated for Supabase
    
    // Create User Modal State
    const [showCreateModal, setShowCreateModal] = useState<'teacher' | 'student' | null>(null);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        email: '',
        password: '',
        className: '',
        schoolName: '',
        subject: '', // NEW: Mata Pelajaran
        learningStyle: LearningStyle.VISUAL
    });

    const refreshData = async () => {
        refetchTeachers();
        refetchStudents();
        refetchQuestions();
        refetchPackets();
        refetchResults();
    };

    // Toggle logic for both teachers and students
    const handleToggleStatus = async (id: string, currentStatus: boolean, type: 'teacher' | 'student') => {
        const action = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
        const role = type === 'teacher' ? 'guru' : 'siswa';
        if(window.confirm(`Yakin ingin ${action} ${role} ini?`)) {
            if (type === 'teacher') await SupabaseService.updateTeacherStatus(id, !currentStatus);
            else await SupabaseService.updateStudentStatus(id, !currentStatus);
            refreshData(); 
        }
    };

    const initiateReset = (id: string, name: string, type: 'teacher' | 'student') => {
        // setNewPassword('');
        setResetTarget({ id, name, type });
    };

    const executeReset = async () => {
        if (!resetTarget) return;

        let success = false;
        if (resetTarget.type === 'teacher') {
            success = await SupabaseService.resetTeacherPassword(resetTarget.id);
        } else {
            success = await SupabaseService.resetStudentPassword(resetTarget.id);
        }

        if (success) {
            alert(`SUKSES!\nLink reset password untuk ${resetTarget.name} telah dikirim ke email mereka.`);
        } else {
            alert("GAGAL: Gagal mengirim email reset password atau data tidak ditemukan.");
        }
        setResetTarget(null); 
    };

    const handleCreateUser = async () => {
        if (!createFormData.name || !createFormData.email || !createFormData.password) {
            alert("Mohon lengkapi data wajib (Nama, Email, Password).");
            return;
        }

        let res;
        if (showCreateModal === 'teacher') {
            if (!createFormData.subject) {
                alert("Mohon lengkapi mata pelajaran untuk guru.");
                return;
            }
            res = await SupabaseService.registerTeacher(createFormData.name, createFormData.email, createFormData.password, createFormData.subject);
        } else {
             if (!createFormData.className || !createFormData.schoolName) {
                alert("Mohon lengkapi data sekolah dan kelas untuk siswa.");
                return;
            }
            res = await SupabaseService.registerStudent(
                createFormData.name, 
                createFormData.email, 
                createFormData.className.toUpperCase(), 
                createFormData.schoolName, 
                createFormData.password, 
                createFormData.learningStyle
            );
        }

        if (res.success) {
            alert(res.message);
            setShowCreateModal(null);
            setCreateFormData({ name: '', email: '', password: '', className: '', schoolName: '', subject: '', learningStyle: LearningStyle.VISUAL });
            refreshData();
        } else {
            alert(res.message);
        }
    };

    const filteredTeachers = useMemo(() => {
        if (!debouncedSearchTerm) return teachers;
        const lowerTerm = debouncedSearchTerm.toLowerCase();
        return teachers.filter(t => 
            t.name.toLowerCase().includes(lowerTerm) || 
            t.email.toLowerCase().includes(lowerTerm)
        );
    }, [teachers, debouncedSearchTerm]);

    const filteredStudents = useMemo(() => {
        if (!debouncedSearchTerm) return students;
        const lowerTerm = debouncedSearchTerm.toLowerCase();
        return students.filter(s => 
            s.name.toLowerCase().includes(lowerTerm) || 
            s.email.toLowerCase().includes(lowerTerm) ||
            s.className.toLowerCase().includes(lowerTerm)
        );
    }, [students, debouncedSearchTerm]);

    const studentLevelData = useMemo(() => {
        const high = results.filter(r => r.abilityLevel === AbilityLevel.HIGH).length;
        const med = results.filter(r => r.abilityLevel === AbilityLevel.MEDIUM).length;
        const basic = results.filter(r => r.abilityLevel === AbilityLevel.BASIC).length;
        return [
            { name: 'Tinggi', value: high, color: '#22c55e' },
            { name: 'Sedang', value: med, color: '#eab308' },
            { name: 'Dasar', value: basic, color: '#ef4444' }
        ];
    }, [results]);

    const avgScorePerTeacher = useMemo(() => {
        return teachers.map(t => {
            const teacherPacketIds = packets.filter(p => p.teacherId === t.id).map(p => p.id);
            const teacherResults = results.filter(r => teacherPacketIds.includes(r.packetId));
            
            const avg = teacherResults.length > 0 
                ? Math.round(teacherResults.reduce((acc, curr) => acc + curr.score, 0) / teacherResults.length) 
                : 0;

            return {
                name: t.name,
                avgScore: avg,
                students: teacherResults.length
            };
        }).sort((a,b) => b.avgScore - a.avgScore);
    }, [teachers, packets, results]);

    return (
        <DashboardLayout
            session={{ role: 'admin', userId: 'admin', name: 'Administrator' }}
            onLogout={onLogout}
            activeTab={activeTab}
            setActiveTab={setActiveTab as any}
            brandName="Mimphy Admin"
            tabs={[
                { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
                { id: 'teachers', label: 'Guru', icon: School },
                { id: 'students', label: 'Siswa', icon: GraduationCap },
                { id: 'analytics', label: 'Analitik', icon: BookOpen },
            ]}
        >
            <div className="space-y-6 relative transition-colors duration-300">
                {/* --- CUSTOM CONFIRMATION MODAL --- */}
                {resetTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 border border-white dark:border-slate-700">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                    <AlertTriangle className="w-6 h-6 text-orange-400 mr-2" />
                                    Reset Password
                                </h3>
                                <button onClick={() => setResetTarget(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 bg-stone-50 dark:bg-slate-700 p-2 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-slate-600 dark:text-slate-300 mb-4 font-medium">
                                    Anda akan mengirimkan link reset password ke email pengguna ini.
                                </p>
                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 p-4 rounded-xl font-bold text-slate-800 dark:text-orange-100 text-center mb-4 flex flex-col items-center">
                                    <Mail className="w-8 h-8 mb-2 text-orange-500" />
                                    {resetTarget.name}
                                </div>
                                <p className="text-xs text-slate-400 text-center">
                                    Pengguna akan menerima email instruksi untuk membuat password baru.
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button 
                                    onClick={() => setResetTarget(null)}
                                    className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={executeReset}
                                    className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 dark:shadow-none transition-all"
                                >
                                    Kirim Email
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CREATE USER MODAL --- */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 border border-white dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                    <Plus className="w-6 h-6 text-red-500 mr-2" />
                                    Tambah {showCreateModal === 'teacher' ? 'Guru' : 'Siswa'} Baru
                                </h3>
                                <button onClick={() => setShowCreateModal(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 bg-stone-50 dark:bg-slate-700 p-2 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium"
                                        placeholder="Nama Lengkap"
                                        value={createFormData.name}
                                        onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                                    />
                                </div>

                                {showCreateModal === 'teacher' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium"
                                            placeholder="Contoh: Fisika, Matematika, Biologi"
                                            value={createFormData.subject}
                                            onChange={(e) => setCreateFormData({...createFormData, subject: e.target.value})}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium"
                                        placeholder="Email"
                                        value={createFormData.email}
                                        onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium"
                                        placeholder="Password"
                                        value={createFormData.password}
                                        onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                                    />
                                </div>

                                {showCreateModal === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Sekolah</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium"
                                                placeholder="Nama Sekolah"
                                                value={createFormData.schoolName}
                                                onChange={(e) => setCreateFormData({...createFormData, schoolName: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium"
                                                placeholder="Kelas (misal: XII IPA 1)"
                                                value={createFormData.className}
                                                onChange={(e) => setCreateFormData({...createFormData, className: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Gaya Belajar</label>
                                            <div className="relative">
                                                <BrainCircuit className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <select 
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:border-red-400 outline-none text-slate-800 dark:text-white font-medium appearance-none"
                                                    value={createFormData.learningStyle}
                                                    onChange={(e) => setCreateFormData({...createFormData, learningStyle: e.target.value as any})}
                                                >
                                                    <option value={LearningStyle.VISUAL}>Visual (Gambar/Grafik)</option>
                                                    <option value={LearningStyle.AUDITORY}>Auditori (Mendengar/Cerita)</option>
                                                    <option value={LearningStyle.KINESTHETIC}>Kinestetik (Praktek/Aktivitas)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex space-x-3 mt-8">
                                <button 
                                    onClick={() => setShowCreateModal(null)}
                                    className="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleCreateUser}
                                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all"
                                >
                                    Buat Akun
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-slate-500 dark:text-slate-400 font-bold">Total Siswa</h3>
                                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-2xl">
                                    <GraduationCap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                            <p className="text-4xl font-black text-slate-800 dark:text-white">
                                <AnimatedCounter value={students.length} />
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-2 flex items-center bg-green-50 dark:bg-green-900/30 w-fit px-2 py-1 rounded-full">
                                <UserCheck className="w-3 h-3 mr-1" /> <AnimatedCounter value={students.filter(s => s.isActive).length} /> Aktif
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-slate-500 dark:text-slate-400 font-bold">Total Guru</h3>
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-2xl">
                                    <School className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <p className="text-4xl font-black text-slate-800 dark:text-white">
                                <AnimatedCounter value={teachers.length} />
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-2">Membuat <AnimatedCounter value={questions.length} /> soal</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-slate-500 dark:text-slate-400 font-bold">Partisipasi Kuis</h3>
                                <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-2xl">
                                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <p className="text-4xl font-black text-slate-800 dark:text-white">
                                <AnimatedCounter value={results.length} />
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-2">Kali pengerjaan</p>
                        </div>
                    </div>

                    {/* Contribution Graphs */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <ContributionGraph 
                            data={results.map(r => ({ date: new Date(r.timestamp).toISOString(), count: 1 }))}
                            title="Aktivitas Siswa (Pengerjaan Kuis)"
                            colorClass="bg-green-500"
                        />
                        <ContributionGraph 
                            data={[
                                ...questions.map(q => ({ date: new Date(q.createdAt || Date.now()).toISOString(), count: 1 })),
                                ...packets.map(p => ({ date: new Date(p.createdAt).toISOString(), count: 1 }))
                            ]}
                            title="Aktivitas Guru (Pembuatan Konten)"
                            colorClass="bg-blue-500"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-white">Distribusi Level Siswa</h3>
                             <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={studentLevelData} 
                                            cx="50%" cy="50%" 
                                            innerRadius={60} 
                                            outerRadius={80} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                        >
                                            {studentLevelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-white">Performa Rata-rata Guru</h3>
                            <div className="h-64">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={avgScorePerTeacher}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.3} />
                                        <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <YAxis domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                                        <Bar dataKey="avgScore" name="Rata-rata Nilai" fill="#dc2626" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: TEACHERS */}
            {activeTab === 'teachers' && (
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Manajemen Guru</h3>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input 
                                    className="w-full pl-10 pr-4 py-3 border-none bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none shadow-sm font-medium text-slate-800 dark:text-slate-200" 
                                    placeholder="Cari guru..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setShowCreateModal('teacher')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 sm:py-2 rounded-xl flex justify-center items-center font-bold text-sm transition-colors shadow-lg shadow-red-200 dark:shadow-none whitespace-nowrap w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Tambah Guru
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Nama</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Mata Pelajaran</th>
                                    <th className="px-6 py-4">Bergabung</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {filteredTeachers.map(t => (
                                    <tr key={t.id} className="hover:bg-red-50/30 dark:hover:bg-slate-700 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{t.name}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{t.email}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{t.subject || '-'}</td>
                                        <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{new Date(t.joinedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                {t.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <button onClick={() => initiateReset(t.id, t.name, 'teacher')} className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title="Reset Password"><Key className="w-4 h-4" /></button>
                                            <button onClick={() => handleToggleStatus(t.id, t.isActive, 'teacher')} className={`p-2 rounded-lg ${t.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}><Power className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CONTENT: STUDENTS */}
            {activeTab === 'students' && (
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Manajemen Siswa</h3>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input 
                                    className="w-full pl-10 pr-4 py-3 border-none bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none shadow-sm font-medium text-slate-800 dark:text-slate-200" 
                                    placeholder="Cari siswa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setShowCreateModal('student')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 sm:py-2 rounded-xl flex justify-center items-center font-bold text-sm transition-colors shadow-lg shadow-red-200 dark:shadow-none whitespace-nowrap w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Tambah Siswa
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Nama</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Kelas</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {filteredStudents.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada data siswa.</td></tr>
                                )}
                                {filteredStudents.map(s => (
                                    <tr key={s.id} className="hover:bg-red-50/30 dark:hover:bg-slate-700 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{s.name}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{s.email}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-500 font-mono text-xs">{s.className}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                {s.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <button onClick={() => initiateReset(s.id, s.name, 'student')} className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title="Reset Password"><Key className="w-4 h-4" /></button>
                                            <button onClick={() => handleToggleStatus(s.id, s.isActive, 'student')} className={`p-2 rounded-lg ${s.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}><Power className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CONTENT: ANALYTICS */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white">Tren Kualitas Pengajaran (Detail)</h3>
                         <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={avgScorePerTeacher}>
                                    <defs>
                                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#fca5a5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <Tooltip contentStyle={{borderRadius: '12px', backgroundColor: '#1e293b', border: 'none', color: '#fff'}} />
                                    <Area type="monotone" dataKey="avgScore" stroke="#dc2626" fillOpacity={1} fill="url(#colorAvg)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
};
