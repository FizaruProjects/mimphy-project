
import React, { useState, useEffect } from 'react';
import { Question, QuizPacket, StudentResult, UserSession } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { BookOpen, Plus, BarChart3, LogOut, Camera, UserCircle2, Medal, FolderCog, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Import sub-components
import { TeacherQuestionBank } from '@/features/teachers/components/TeacherQuestionBank';
import { TeacherPacketCreator } from '@/features/teachers/components/TeacherPacketCreator';
import { TeacherResults } from '@/features/teachers/components/TeacherResults';
import { TeacherAchievementCreator } from '@/features/teachers/components/TeacherAchievementCreator';
import { TeacherPacketManager } from '@/features/teachers/components/TeacherPacketManager';
import { ContributionGraph } from '@/components/ContributionGraph';
import { TeacherStudentReport } from '@/features/teachers/components/TeacherStudentReport';

interface Props {
    session: UserSession;
    onLogout: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'packets' | 'manage_packets' | 'results' | 'student_report' | 'achievements' | 'profile'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [packets, setPackets] = useState<QuizPacket[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(session.photoUrl);
  const [teacherSubject, setTeacherSubject] = useState<string>(''); // NEW: Subject state

  // Function to refresh data from Storage
  const refreshData = async () => {
    if (!session.userId) return;

    try {
        // Get Teacher Profile for Subject
        const teachers = await SupabaseService.getTeachers();
        const me = teachers.find(t => t.id === session.userId);
        if (me && me.subject) setTeacherSubject(me.subject);

        // Filter questions and packets by Teacher ID
        const q = await SupabaseService.getQuestions(session.userId);
        setQuestions(q);
        
        const p = await SupabaseService.getPackets(session.userId);
        setPackets(p);
        
        // For results, we fetch all but filter in logic if needed
        const allResults = await SupabaseService.getResults();
        const myPacketIds = p.map(pkt => pkt.id);
        const myResults = allResults.filter(r => myPacketIds.includes(r.packetId));
        
        setResults(myResults);
    } catch (error) {
        console.error("Error refreshing data:", error);
    }
  };

  useEffect(() => {
    refreshData(); // Initial load
    const intervalId = setInterval(refreshData, 10000); // Increased interval to reduce load
    return () => clearInterval(intervalId);
  }, [session.userId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && session.userId) {
          if (file.size > 500000) { // Limit 500KB
              alert("Ukuran foto terlalu besar. Maksimal 500KB.");
              return;
          }
          
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = reader.result as string;
              // Save to storage
              await SupabaseService.updateTeacherProfile(session.userId!, { photoUrl: base64 });
              // Update local state
              setCurrentPhoto(base64);
              alert("Foto profil berhasil diperbarui!");
          };
      }
  };

  return (
    <DashboardLayout
        session={session}
        onLogout={onLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
        brandName="Mimphy Guru"
        tabs={[
            { id: 'questions', label: 'Bank Soal', icon: BookOpen },
            { id: 'packets', label: 'Buat Paket', icon: Plus },
            { id: 'manage_packets', label: 'Kelola', icon: FolderCog },
            { id: 'results', label: 'Hasil', icon: BarChart3 },
            { id: 'student_report', label: 'Rapor', icon: BookOpen },
            { id: 'achievements', label: 'Prestasi', icon: Medal },
            { id: 'profile', label: 'Profil', icon: User },
        ]}
    >
      <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-[2.5rem] p-4 lg:p-8 flex-1">
          {activeTab === 'questions' && (
            <TeacherQuestionBank 
                questions={questions} 
                onRefresh={refreshData}
                teacherId={session.userId!} 
                subject={teacherSubject} // Pass subject
            />
          )}

          {activeTab === 'packets' && (
            <TeacherPacketCreator 
                questions={questions} 
                packets={packets} 
                onRefresh={refreshData}
                teacherId={session.userId!} 
                subject={teacherSubject} // Pass subject
            />
          )}

          {activeTab === 'manage_packets' && (
              <TeacherPacketManager 
                  packets={packets}
                  onRefresh={refreshData}
              />
          )}

          {activeTab === 'results' && (
            <TeacherResults 
                results={results} 
                packets={packets}
            />
          )}

          {activeTab === 'student_report' && (
              <TeacherStudentReport />
          )}

          {activeTab === 'achievements' && (
              <TeacherAchievementCreator onRefresh={refreshData} />
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Edit Profil Guru</h2>
                
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-50 dark:border-slate-700 shadow-lg">
                            {currentPhoto ? <img src={currentPhoto} className="w-full h-full object-cover" /> : <UserCircle2 className="w-full h-full text-slate-200 dark:text-slate-600"/>}
                        </div>
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                            <Camera className="w-6 h-6"/>
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
                        </label>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Klik foto untuk mengubah</p>
                </div>

                {/* Contribution Graph */}
                <div className="mb-8">
                    <ContributionGraph 
                        data={[
                            ...questions.map(q => ({ date: new Date(q.createdAt || Date.now()).toISOString(), count: 1 })),
                            ...packets.map(p => ({ date: new Date(p.createdAt).toISOString(), count: 1 }))
                        ]}
                        title="Kontribusi Pembuatan Konten"
                        colorClass="bg-red-500"
                    />
                </div>

                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                    
                    if (!name) { alert("Nama tidak boleh kosong"); return; }
                    
                    const updates: any = { name };
                    if (password) {
                        // In Supabase, password reset is handled differently (Auth API), 
                        // but for now we can't easily update it via profile table unless we built custom logic.
                        // We will skip password update here for Supabase Auth or implement a proper change password flow.
                        alert("Fitur ganti password belum tersedia untuk mode Cloud.");
                    }
                    
                    if (session.userId) {
                        await SupabaseService.updateTeacherProfile(session.userId, updates);
                        alert("Profil berhasil diperbarui! Silakan login ulang untuk melihat perubahan nama.");
                    }
                }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                        <input name="name" type="text" defaultValue={session.name} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-red-400 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password Baru (Opsional)</label>
                        <input name="password" type="password" placeholder="Kosongkan jika tidak ingin mengubah" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-red-400 outline-none" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none">Simpan Perubahan</button>
                </form>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
};
