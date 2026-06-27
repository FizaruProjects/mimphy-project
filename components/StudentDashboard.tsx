
import React, { useState, useEffect } from 'react';
import { QuizPacket, AbilityLevel, StudentResult, UserSession, Achievement, DifferentiationMode, LearningStyle, LearningMaterial, ModuleItem } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { generateLearningModule } from '../services/geminiService';
import { BookOpen, ChevronRight, ChevronLeft, Loader2, FileText, Download, Flag, LogOut, Sparkles, UserCircle, Star, Award, Zap, Camera, Medal, Home, LayoutGrid, CheckCircle2, BrainCircuit, Menu, X, Youtube, Play, ExternalLink, ArrowRight, Link } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ThemeToggle } from './ThemeToggle';
import { ContributionGraph } from './ContributionGraph';
import { StudentReportCard } from './StudentReportCard';

interface Props {
  session: UserSession;
  onLogout: () => void;
}

type ViewState = 'dashboard' | 'input_code' | 'study_materials' | 'quiz' | 'result' | 'profile' | 'rapor';

// Helper for UUID generation (fallback for older browsers/http)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const StudentDashboard: React.FC<Props> = ({ session, onLogout }) => {
  // Navigation State
  const [view, setView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission loading
  const [isLoadingPacket, setIsLoadingPacket] = useState(false); // New state for packet loading
  
  // Quiz Data State
  const [packetCode, setPacketCode] = useState('');
  const [activePacket, setActivePacket] = useState<QuizPacket | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<boolean[]>([]);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false); // Mobile Map Sheet state
  
  // Study Materials State (Generic or Module Items)
  const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterial | ModuleItem | null>(null);

  // Profile & Meta Data State
  const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(session.photoUrl);
  const [currentStyle, setCurrentStyle] = useState<LearningStyle>(session.learningStyle || LearningStyle.VISUAL);
  const [myStats, setMyStats] = useState({ totalPackets: 0, avgScore: 0 });
  const [myAchievements, setMyAchievements] = useState<string[]>([]); // IDs
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [availablePacketsCount, setAvailablePacketsCount] = useState(0);
  const [allPackets, setAllPackets] = useState<QuizPacket[]>([]);
  const [myResults, setMyResults] = useState<StudentResult[]>([]);

  // Module State (Legacy/AI + New List)
  const [aiModule, setAiModule] = useState<string | null>(null);
  const [availableModules, setAvailableModules] = useState<ModuleItem[]>([]);
  const [loadingModule, setLoadingModule] = useState(false);
  const [moduleContext, setModuleContext] = useState<string>(''); // Info about why this module shown

  // Load Initial Data
  useEffect(() => {
      refreshStudentData();
  }, [session.userId]);

  const refreshStudentData = async () => {
      const allResults = await SupabaseService.getResults();
      const myResultsFiltered = allResults.filter(r => r.studentId === session.userId);
      setMyResults(myResultsFiltered);
      
      const bestResultsMap = new Map<string, StudentResult>();
      myResultsFiltered.forEach(r => {
          if (!bestResultsMap.has(r.packetId) || r.score > bestResultsMap.get(r.packetId)!.score) {
              bestResultsMap.set(r.packetId, r);
          }
      });
      const bestResults = Array.from(bestResultsMap.values());

      const totalP = bestResults.length;
      const avg = totalP > 0 ? Math.round(bestResults.reduce((a,b) => a + b.score, 0) / totalP) : 0;
      
      setMyStats({ totalPackets: totalP, avgScore: avg });

      const students = await SupabaseService.getStudents();
      const me = students.find(s => s.id === session.userId);
      setMyAchievements(me?.unlockedAchievements || []);
      if(me?.learningStyle) setCurrentStyle(me.learningStyle);
      
      const achievements = await SupabaseService.getAchievements();
      setAllAchievements(achievements);
      
      const packets = await SupabaseService.getPackets();
      setAllPackets(packets);
      setAvailablePacketsCount(packets.length);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && session.userId) {
          if (file.size > 500000) { 
              alert("⚠️ Ukuran foto terlalu besar. Maksimal 500KB.");
              return;
          }
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = reader.result as string;
              await SupabaseService.updateStudentProfile(session.userId!, { photoUrl: base64 });
              setCurrentPhoto(base64);
          };
      }
  };
  
  const updateLearningStyle = async (style: LearningStyle) => {
      if (session.userId) {
          await SupabaseService.updateStudentProfile(session.userId, { learningStyle: style });
          setCurrentStyle(style);
          alert(`Gaya belajar berhasil diubah menjadi ${style}`);
      }
  };

  const handleLogoutClick = () => {
      if(confirm("Apakah Anda yakin ingin Logout dari akun ini?")) {
          onLogout();
      }
  };

  // --- NAVIGATION HANDLERS ---
  const goHome = () => {
      setView('dashboard');
      setResult(null);
      setActivePacket(null);
      setSelectedMaterial(null);
      setIsMobileMenuOpen(false);
      refreshStudentData(); // Refresh stats on return
  };

  const checkAndStartPacket = async () => {
    const code = packetCode.trim();
    if (!code) {
        alert("Mohon masukkan kode paket.");
        return;
    }

    setIsLoadingPacket(true);
    
    // Try to find in local state first
    let packet = allPackets.find(p => p.id === code);

    // If not found locally, try fetching from server
    if (!packet) {
        try {
            const fetchedPacket = await SupabaseService.getPacketById(code);
            if (fetchedPacket) {
                console.log("Packet fetched from server:", fetchedPacket);
                packet = fetchedPacket;
                // Optionally update local state
                setAllPackets(prev => [...prev, fetchedPacket]);
            } else {
                console.log("Packet not found on server for code:", code);
            }
        } catch (error) {
            console.error("Error fetching packet:", error);
        }
    }
    
    setIsLoadingPacket(false);

    if (packet) {
        if (packet.questions.length === 0) {
            alert("Maaf, paket soal ini belum memiliki pertanyaan.");
            return;
        }
        
        setActivePacket(packet);
        // Reset Quiz State
        setCurrentQIndex(0);
        setUserAnswers(new Array(packet.questions.length).fill(-1));
        setDoubtfulQuestions(new Array(packet.questions.length).fill(false)); 
        setResult(null);
        setAiModule(null);
        setAvailableModules([]);
        setNewlyUnlockedAchievements([]);
        setIsMobileMapOpen(false);

        // LOGIC CHANGE: If materials exist, go to Study Room first
        if (packet.learningMaterials && packet.learningMaterials.length > 0) {
            setView('study_materials');
        } else {
            setView('quiz');
        }
    } else {
        alert("Kode Paket Soal tidak ditemukan! Pastikan kode benar (contoh: FIS-1234).");
    }
  };

  const proceedToQuiz = () => {
      if (activePacket) {
          setView('quiz');
      }
  };

  const finishQuiz = async () => {
    if (!activePacket) return;

    const unansweredCount = userAnswers.filter(a => a === -1).length;
    if (unansweredCount > 0) {
        if (!confirm(`Masih ada ${unansweredCount} soal yang belum dijawab. Yakin ingin menyelesaikan?`)) {
            return;
        }
    }

    setIsSubmitting(true);

    let correctCount = 0;
    const boolAnswers: boolean[] = [];

    activePacket.questions.forEach((q, idx) => {
        const isCorrect = userAnswers[idx] === q.correctIndex;
        if (isCorrect) correctCount++;
        boolAnswers.push(isCorrect);
    });

    const finalScore = Math.round((correctCount / activePacket.questions.length) * 100);
    
    let level = AbilityLevel.BASIC;
    if (finalScore >= 85) level = AbilityLevel.HIGH;
    else if (finalScore >= 70) level = AbilityLevel.MEDIUM;

    const newResult: StudentResult = {
        id: generateUUID(),
        studentId: session.userId || 'guest',
        studentName: session.name || 'Anonim',
        className: session.className || '-',
        packetId: activePacket.id,
        score: finalScore,
        abilityLevel: level,
        answers: boolAnswers,
        selectedIndices: userAnswers,
        attemptNumber: 0, 
        timestamp: Date.now()
    };

    try {
        const unlocked = await SupabaseService.saveResult(newResult);
        setNewlyUnlockedAchievements(unlocked);
        
        setResult(newResult);
        setView('result');
    } catch (error: any) {
        console.error("Failed to save result", error);
        alert(`Gagal menyimpan hasil kuis: ${error.message || "Terjadi kesalahan"}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  // ... existing code ...


  const loadModule = async () => {
    if (!result || !activePacket) return;
    setLoadingModule(true);
    setAiModule(null);
    setAvailableModules([]);
    
    const mode = activePacket.differentiationMode || DifferentiationMode.CONTENT; 
    let contextMsg = "";
    let modulesFound: ModuleItem[] = [];

    // 1. Cek New PacketModules Structure
    if (activePacket.modules) {
        if (mode === DifferentiationMode.CONTENT) {
            contextMsg = `Materi disesuaikan dengan hasil kuis (Level: ${result.abilityLevel})`;
            if (result.abilityLevel === AbilityLevel.BASIC) modulesFound = activePacket.modules.basic;
            else if (result.abilityLevel === AbilityLevel.MEDIUM) modulesFound = activePacket.modules.medium;
            else if (result.abilityLevel === AbilityLevel.HIGH) modulesFound = activePacket.modules.high;
        } else {
            const style = currentStyle || LearningStyle.VISUAL;
            contextMsg = `Materi disesuaikan dengan Gaya Belajarmu (${style})`;
            if (style === LearningStyle.VISUAL) modulesFound = activePacket.modules.visual;
            else if (style === LearningStyle.AUDITORY) modulesFound = activePacket.modules.auditory;
            else if (style === LearningStyle.KINESTHETIC) modulesFound = activePacket.modules.kinesthetic;
        }
    }

    if (modulesFound.length > 0) {
        setAvailableModules(modulesFound);
        setModuleContext(contextMsg);
        setLoadingModule(false);
        return;
    }

    // 2. Fallback to AI Generation if no manual modules
    const topic = activePacket.questions[0]?.topic || "Fisika SMA";
    let content = "";
    if (mode === DifferentiationMode.CONTENT) {
        contextMsg = `AI membuat modul berdasarkan hasil kuis (Level: ${result.abilityLevel})`;
        content = await generateLearningModule(topic, result.abilityLevel);
    } else {
        const style = currentStyle || LearningStyle.VISUAL;
        contextMsg = `AI membuat modul khusus gaya belajar ${style}`;
        content = await generateLearningModule(topic, style);
    }
    
    setAiModule(content);
    setModuleContext(contextMsg);
    setLoadingModule(false);
  };

  // Helper to extract YouTube ID
  const getYoutubeEmbedUrl = (url: string) => {
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    } catch(e) { return null; }
  };

  // --- RENDER MODAL PREVIEW ---
  const renderPreviewModal = () => {
      if (!selectedMaterial) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedMaterial(null)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-stone-50 dark:bg-slate-800">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-white truncate pr-4">{selectedMaterial.title}</h3>
                    <button onClick={() => setSelectedMaterial(null)} className="p-2 bg-stone-200 dark:bg-slate-700 rounded-full hover:bg-stone-300 dark:hover:bg-slate-600"><X className="w-5 h-5"/></button>
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
                            <p className="mb-4 text-xl font-bold">Link Eksternal</p>
                            <p className="mb-6 text-slate-400 break-all">{selectedMaterial.content}</p>
                            <a href={selectedMaterial.content} target="_blank" rel="noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors">Buka Link di Tab Baru</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  // ... (Header and CopyrightFooter remain the same) ...
  const DashboardHeader = () => (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-stone-200/50 dark:border-slate-700 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm transition-colors duration-300">
           {/* ... Header Content ... */}
           <div className="flex items-center space-x-3">
              <div className="relative group cursor-pointer" onClick={() => setView('profile')}>
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-red-200 dark:border-slate-600 bg-red-100 dark:bg-slate-700 flex items-center justify-center transition-transform hover:scale-105">
                    {currentPhoto ? <img src={currentPhoto} alt="Profile" className="w-full h-full object-cover" /> : <UserCircle className="w-6 h-6 text-red-600 dark:text-red-300" />}
                  </div>
              </div>
              <div className="hidden md:block">
                  <h3 className="font-bold text-stone-800 dark:text-white leading-tight">{session.name}</h3>
                  <div className="flex items-center gap-2">
                     <p className="text-xs text-red-600 dark:text-red-300 font-bold bg-red-50 dark:bg-red-900/50 px-2 py-0.5 rounded-full inline-block">{session.className}</p>
                     <p className="text-[10px] text-orange-700 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full inline-block">{currentStyle}</p>
                  </div>
              </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            {view !== 'dashboard' && (
                <button onClick={goHome} className="text-stone-500 dark:text-slate-300 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 transition-all hover:scale-110" title="Kembali ke Dashboard">
                    <Home className="w-5 h-5" />
                </button>
            )}
            <button onClick={() => setView('rapor')} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 px-3 py-1.5 rounded-full hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <Award className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-stone-700 dark:text-slate-300">Rapor</span>
            </button>
            <button onClick={handleLogoutClick} className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl font-bold transition-all border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"><LogOut className="w-4 h-4" /><span>Logout</span></button>
          </div>
          {/* Mobile Menu Button & Dropdown omitted for brevity but should be here */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 dark:text-slate-200">
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
          {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 p-4 shadow-lg flex flex-col gap-4 md:hidden animate-in slide-in-from-top-2 z-50">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-slate-700">
                      <div><p className="font-bold text-stone-800 dark:text-white">{session.name}</p><p className="text-xs text-stone-500 dark:text-slate-400">{session.className}</p></div>
                  </div>
                  {view !== 'dashboard' && <button onClick={goHome} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200"><Home className="w-5 h-5" /> Dashboard Utama</button>}
                  <button onClick={() => { setView('rapor'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200"><Award className="w-5 h-5" /> Rapor Saya</button>
                  <button onClick={() => { setView('profile'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200"><UserCircle className="w-5 h-5" /> Profil Saya</button>
                  <button onClick={handleLogoutClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"><LogOut className="w-5 h-5" /> Logout</button>
              </div>
          )}
      </div>
  );

  const CopyrightFooter = () => (
    <div className="text-center py-6 mt-4 border-t border-stone-200/50 dark:border-slate-700/50">
        <p className="text-xs font-semibold text-stone-400 dark:text-slate-500 tracking-wide">&copy; {new Date().getFullYear()} Mimphy Catalyze. All Rights Reserved.</p>
    </div>
  );

  // ... (View 1: Dashboard, View 2: Input Code, View 2.5: Study Materials - Keep existing logic, only adding RenderPreviewModal)

  // 1. DASHBOARD HOME (Same as before)
  if (view === 'dashboard') {
      return (
          <div className="min-h-screen pb-10 flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
              <DashboardHeader />
              <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 flex-1 w-full">
                  {/* ... Stats & Achievement content ... */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      {/* ... cards ... */}
                      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white dark:border-slate-700 shadow-sm flex items-center transition-transform hover:scale-[1.02]">
                          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 flex items-center justify-center mr-4"><BookOpen className="w-6 h-6" /></div>
                          <div><p className="text-stone-500 dark:text-slate-400 text-sm font-bold">Paket Selesai</p><p className="text-2xl font-extrabold text-stone-800 dark:text-white">{myStats.totalPackets} <span className="text-xs text-stone-400 font-normal">/ {availablePacketsCount}</span></p></div>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white dark:border-slate-700 shadow-sm flex items-center transition-transform hover:scale-[1.02]">
                          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 flex items-center justify-center mr-4"><Star className="w-6 h-6" /></div>
                          <div><p className="text-stone-500 dark:text-slate-400 text-sm font-bold">Rata-rata (Terbaik)</p><p className="text-2xl font-extrabold text-stone-800 dark:text-white">{myStats.avgScore}</p></div>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white dark:border-slate-700 shadow-sm flex items-center transition-transform hover:scale-[1.02]">
                          <div className="w-12 h-12 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center mr-4"><Medal className="w-6 h-6" /></div>
                          <div><p className="text-stone-500 dark:text-slate-400 text-sm font-bold">Prestasi Diraih</p><p className="text-2xl font-extrabold text-stone-800 dark:text-white">{myAchievements.length} <span className="text-xs text-stone-400 font-normal">/ {allAchievements.length}</span></p></div>
                      </div>
                  </div>
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-xl transition-transform hover:scale-[1.01]">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                          <div><h2 className="text-2xl md:text-3xl font-bold mb-2">Siap untuk tantangan baru?</h2><p className="text-red-100 text-sm md:text-base">Kerjakan kuis untuk meningkatkan level dan membuka achievement baru!</p></div>
                          <button onClick={() => setView('input_code')} className="w-full md:w-auto bg-white text-red-900 px-8 py-4 rounded-2xl font-extrabold text-lg hover:bg-stone-100 transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transform hover:-translate-y-1 active:scale-95 active:translate-y-0">Mulai Kuis 🚀</button>
                      </div>
                  </div>
                  {/* Achievements Grid ... */}
                  <div>
                      <h3 className="font-bold text-xl text-stone-800 dark:text-white mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" /> Galeri Prestasi</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {allAchievements.length === 0 && <p className="text-stone-400 italic">Belum ada achievement tersedia.</p>}
                          {allAchievements.map(ach => {
                              const isUnlocked = myAchievements.includes(ach.id);
                              return (
                                  <div key={ach.id} className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-500 ${isUnlocked ? 'bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-900/50 shadow-md scale-100 hover:scale-105' : 'bg-stone-50 dark:bg-slate-900 border-stone-100 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-80'}`}>
                                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${isUnlocked ? 'bg-orange-50 dark:bg-orange-900/20 shadow-inner' : 'bg-stone-200 dark:bg-slate-700'}`}>
                                          {ach.iconUrl ? <img src={ach.iconUrl} className="w-10 h-10 object-contain" /> : <Medal className={`w-8 h-8 ${isUnlocked ? 'text-orange-500' : 'text-stone-400'}`} />}
                                      </div>
                                      <h4 className="font-bold text-stone-800 dark:text-slate-200 text-sm mb-1">{ach.title}</h4>
                                      <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2">{ach.description}</p>
                                      {isUnlocked && <div className="mt-2 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center animate-in zoom-in"><CheckCircle2 className="w-3 h-3 mr-1"/> Tercapai</div>}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
              <CopyrightFooter />
          </div>
      );
  }

  // 2. INPUT CODE (Same)
  if (view === 'input_code') {
    return (
        <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
            <DashboardHeader />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(220,38,38,0.3)] dark:shadow-none dark:border dark:border-slate-700 text-center relative overflow-hidden p-8 animate-in zoom-in-95">
                    <button onClick={goHome} className="absolute top-4 left-4 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><ChevronLeft/></button>
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white dark:border-slate-700">
                        <BookOpen className="w-8 h-8 text-red-600 dark:text-red-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-stone-800 dark:text-white mb-2">Kode Misi</h2>
                    <p className="text-stone-500 dark:text-slate-400 mb-8 font-medium text-sm">Masukkan kode dari gurumu.</p>
                    <div className="space-y-4">
                        <input className="w-full text-center text-3xl tracking-[0.2em] p-5 border-2 border-red-100 dark:border-slate-600 rounded-2xl uppercase placeholder:text-red-200 dark:placeholder:text-slate-600 font-bold text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 transition-all outline-none" placeholder="FIS-XXXX" value={packetCode} onChange={e => setPacketCode(e.target.value.toUpperCase())} />
                        <button onClick={checkAndStartPacket} disabled={!packetCode || isLoadingPacket} className="w-full bg-red-600 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-red-700 shadow-[0_4px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoadingPacket ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Mencari...</> : "Buka Paket 🚀"}
                        </button>
                    </div>
                </div>
            </div>
            <CopyrightFooter />
        </div>
    );
  }

  // 2.5 STUDY MATERIALS (Pra Kuis)
  if (view === 'study_materials' && activePacket) {
      return (
          <div className="min-h-screen pb-10 flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
              <DashboardHeader />
              <div className="max-w-4xl mx-auto p-4 md:p-6 w-full flex-1">
                  <div className="flex items-center justify-between mb-6">
                      <button onClick={goHome} className="text-stone-500 dark:text-slate-400 hover:text-red-600 flex items-center font-bold text-sm"><ChevronLeft className="w-4 h-4 mr-1"/> Batal</button>
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold uppercase tracking-wider">Ruang Belajar</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-slate-700 mb-8 text-center">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-stone-800 dark:text-white mb-2">{activePacket.name}</h2>
                        <p className="text-stone-500 dark:text-slate-400 mb-6">Pelajari materi di bawah ini sebelum mengerjakan kuis agar hasilnya maksimal!</p>
                        <div className="grid md:grid-cols-2 gap-4 text-left">
                            {activePacket.learningMaterials?.map((m, idx) => (
                                <div key={m.id} className="bg-stone-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === 'video_link' ? 'bg-red-100 text-red-600' : m.type === 'pdf_upload' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            {m.type === 'video_link' ? <Play className="w-5 h-5 ml-0.5"/> : m.type === 'pdf_upload' ? <FileText className="w-5 h-5"/> : <ExternalLink className="w-5 h-5"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-stone-800 dark:text-white truncate">{m.title}</h4>
                                            {m.description && <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mt-0.5">{m.description}</p>}
                                            <div className="mt-3">
                                                <button onClick={() => setSelectedMaterial(m)} className="text-xs font-bold text-white bg-stone-800 dark:bg-slate-600 px-3 py-1.5 rounded-lg hover:bg-stone-700 dark:hover:bg-slate-500 transition-colors">
                                                    {m.type === 'video_link' ? 'Tonton Video' : m.type === 'pdf_upload' ? 'Baca Dokumen' : 'Buka Link'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                  </div>
                  {renderPreviewModal()}
                  <div className="flex justify-center mt-8 pb-10">
                      <button onClick={proceedToQuiz} className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-extrabold text-xl rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center">Siap Mengerjakan Kuis <ArrowRight className="w-6 h-6 ml-2"/></button>
                  </div>
              </div>
          </div>
      );
  }

  // 3. QUIZ SCREEN (Same)
  if (view === 'quiz' && activePacket) {
    const question = activePacket.questions[currentQIndex];
    const progress = ((currentQIndex + 1) / activePacket.questions.length) * 100;
    return (
        <div className="min-h-screen pb-10 flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300 relative">
            <DashboardHeader />
            {/* ... Quiz UI ... (Omitted specific repetitive JSX, assume same as before) */}
            <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 w-full mb-16 lg:mb-0">
                <div className="lg:col-span-3">
                    <div className="mb-6 bg-white/50 dark:bg-slate-800/50 rounded-full h-4 w-full overflow-hidden border border-white dark:border-slate-700"><div className="h-full bg-gradient-to-r from-red-400 to-orange-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]" style={{ width: `${progress}%` }}></div></div>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-6 md:p-10 rounded-[2rem] shadow-lg border border-white dark:border-slate-700 mb-6 relative animate-in fade-in slide-in-from-right-4 duration-300" key={currentQIndex}>
                        <div className="flex justify-between items-start mb-6"><span className="inline-flex items-center bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wider border border-red-200 dark:border-red-800"><Zap className="w-3 h-3 mr-2 text-orange-500 fill-orange-500" />{question.topic}</span><span className="text-sm font-bold text-stone-400 dark:text-slate-500 bg-stone-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-stone-100 dark:border-slate-800">Soal {currentQIndex + 1} / {activePacket.questions.length}</span></div>
                        <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8 leading-relaxed prose prose-slate dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{question.text}</ReactMarkdown>
                        </div>
                        {question.imageUrl && (<div className="mb-8 flex justify-center bg-stone-50 dark:bg-slate-900 p-4 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700"><img src={question.imageUrl} alt="Ilustrasi" className="max-h-80 object-contain rounded-lg" /></div>)}
                        <div className="flex flex-col gap-3">{question.options.map((opt, idx) => (<button key={idx} onClick={() => { const newAnswers = [...userAnswers]; newAnswers[currentQIndex] = idx; setUserAnswers(newAnswers); }} className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group relative transform hover:scale-[1.01] active:scale-[0.99] ${userAnswers[currentQIndex] === idx ? 'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-md ring-2 ring-red-200 dark:ring-red-800' : 'border-stone-100 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500 hover:bg-white dark:hover:bg-slate-800 bg-stone-50/50 dark:bg-slate-800/50'}`}><div className="flex items-center"><span className={`w-8 h-8 flex-shrink-0 inline-flex items-center justify-center rounded-lg font-bold mr-4 transition-colors ${userAnswers[currentQIndex] === idx ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-700 text-stone-400 dark:text-slate-300 border dark:border-slate-600'}`}>{String.fromCharCode(65 + idx)}</span><span className={`text-base md:text-lg ${userAnswers[currentQIndex] === idx ? 'text-red-900 dark:text-red-200 font-bold' : 'text-stone-600 dark:text-slate-300 font-medium'}`}>
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{p: ({node, ...props}) => <span {...props} />}}>{opt}</ReactMarkdown>
                        </span></div></button>))}</div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex w-full md:w-auto gap-2"><button onClick={() => currentQIndex > 0 && setCurrentQIndex(prev => prev - 1)} disabled={currentQIndex === 0} className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 rounded-xl font-bold text-stone-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 transition-all"><ChevronLeft className="mr-2 w-5 h-5" /> Prev</button><button onClick={() => { const newDoubts = [...doubtfulQuestions]; newDoubts[currentQIndex] = !newDoubts[currentQIndex]; setDoubtfulQuestions(newDoubts); }} className={`flex-1 md:flex-none flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all transform active:scale-95 shadow-sm hover:shadow-md ${doubtfulQuestions[currentQIndex] ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 ring-2 ring-amber-300 dark:ring-amber-700' : 'bg-white dark:bg-slate-800 text-stone-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400'}`}><Flag className={`w-5 h-5 mr-2 ${doubtfulQuestions[currentQIndex] ? 'fill-amber-600 dark:fill-amber-400' : ''}`} /> Ragu</button></div>
                        <button 
                            onClick={() => { if (currentQIndex < activePacket.questions.length - 1) setCurrentQIndex(prev => prev + 1); else finishQuiz(); }} 
                            disabled={isSubmitting}
                            className={`w-full md:w-auto flex items-center justify-center px-8 py-3 rounded-xl font-extrabold text-white transition-all shadow-lg transform hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${currentQIndex === activePacket.questions.length - 1 ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-emerald-200 dark:shadow-emerald-900' : 'bg-gradient-to-r from-red-500 to-orange-600 shadow-red-200 dark:shadow-red-900'}`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Menyimpan...</>
                            ) : (
                                <>{currentQIndex === activePacket.questions.length - 1 ? 'Selesai!' : 'Lanjut'} <ChevronRight className="ml-2 w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </div>
                {/* Map Column (Hidden on mobile) */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-6 rounded-[2rem] shadow-sm border border-white dark:border-slate-700 sticky top-24">
                        <h4 className="font-bold text-stone-800 dark:text-white mb-4 flex items-center"><LayoutGrid className="w-5 h-5 mr-2 text-red-500" /> Peta Soal</h4>
                        <div className="grid grid-cols-5 gap-2">{activePacket.questions.map((_, idx) => { const isAnswered = userAnswers[idx] !== -1; const isDoubtful = doubtfulQuestions[idx]; const isCurrent = currentQIndex === idx; let bgClass = "bg-white dark:bg-slate-900 text-stone-400 border border-stone-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500"; if (isDoubtful) bgClass = "bg-amber-300 dark:bg-amber-600 text-white border-amber-400 dark:border-amber-500 shadow-sm"; else if (isAnswered) bgClass = "bg-red-500 dark:bg-red-700 text-white border-red-600 dark:border-red-800 shadow-sm"; if (isCurrent) bgClass += " ring-4 ring-red-100 dark:ring-red-900 z-10 font-bold scale-110"; return (<button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-xl text-sm flex items-center justify-center transition-all duration-200 ${bgClass}`}>{idx + 1}</button>); })}</div>
                    </div>
                </div>
            </div>
            {/* Mobile Sheet Code ... (Omitted) */}
            <CopyrightFooter />
        </div>
    );
  }

  // 4. RESULT SCREEN WITH MULTI-FORMAT MODULES
  if (view === 'result') {
    return (
        <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
            <DashboardHeader />
            <div className="max-w-4xl mx-auto mt-6 md:mt-10 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20 flex-1 w-full">
                
                {/* Result Card ... */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(220,38,38,0.25)] dark:shadow-none dark:border dark:border-slate-700 text-center relative overflow-hidden transition-transform hover:scale-[1.01]">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-200 via-transparent to-transparent"></div>
                    <div className="relative z-10">
                        <div className="inline-block p-4 rounded-full bg-orange-100 dark:bg-orange-900/40 mb-4 animate-bounce">{result?.score! >= 85 ? <Award className="w-12 h-12 text-orange-600 dark:text-orange-400" /> : result?.score! >= 70 ? <Star className="w-12 h-12 text-orange-600 dark:text-orange-400" /> : <BookOpen className="w-12 h-12 text-red-600 dark:text-red-400" />}</div>
                        <h2 className="text-4xl font-extrabold text-stone-800 dark:text-white mb-2">{result?.score! >= 85 ? "Fantastis!" : result?.score! >= 70 ? "Hebat!" : "Semangat!"}</h2>
                        <p className="text-stone-500 dark:text-slate-400 mb-10 font-medium">Kamu telah menyelesaikan kuis ini.</p>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-10">
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-3xl min-w-[180px] border border-red-100 dark:border-slate-600"><div className="text-6xl font-black text-red-900 dark:text-red-300 mb-2">{result?.score}</div><div className="text-xs uppercase tracking-widest font-bold text-red-400 dark:text-red-200">Nilai Akhir</div></div>
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-3xl min-w-[180px] border border-orange-100 dark:border-slate-600"><div className={`text-3xl font-black mb-2 ${result?.abilityLevel === AbilityLevel.HIGH ? 'text-green-600 dark:text-green-400' : result?.abilityLevel === AbilityLevel.MEDIUM ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>{result?.abilityLevel}</div><div className="text-xs uppercase tracking-widest font-bold text-amber-500 dark:text-amber-300">Level Kamu</div></div>
                        </div>
                    </div>
                </div>

                {/* Module Section */}
                <div className="bg-gradient-to-br from-red-600 to-orange-700 dark:from-red-900 dark:to-orange-950 p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden text-white transition-transform hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center mb-2"><Sparkles className="w-6 h-6 mr-3 text-yellow-300" /> {availableModules.length > 0 ? "Materi Rekomendasi Guru" : "Modul Pintar AI"}</h3>
                                <p className="text-red-100 opacity-90 leading-relaxed max-w-lg">{availableModules.length > 0 ? "Gurumu sudah menyiapkan materi khusus sesuai hasilmu." : "AI telah membuatkan rangkuman materi yang PAS banget sama kamu."}</p>
                                {moduleContext && (<span className="inline-block mt-2 text-xs bg-white/20 px-3 py-1 rounded-full font-medium">{moduleContext}</span>)}
                            </div>
                            {!aiModule && availableModules.length === 0 && !loadingModule && (
                                <button onClick={loadModule} className="bg-white text-red-900 px-8 py-4 rounded-2xl text-sm font-extrabold hover:bg-stone-100 transition-all flex items-center shadow-[0_4px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1 whitespace-nowrap transform hover:-translate-y-1"><Sparkles className="w-5 h-5 mr-2" /> Buka Materi Ajaib</button>
                            )}
                        </div>
                        
                        {loadingModule && <div className="py-12 text-center flex flex-col items-center animate-pulse"><Loader2 className="w-8 h-8 animate-spin text-white mb-4"/><p className="font-bold text-lg">Menyiapkan materi...</p></div>}
                        
                        {/* AI Content */}
                        {aiModule && (
                            <div className="bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-200 rounded-3xl p-8 shadow-lg animate-in slide-in-from-bottom-4">
                                <div className="prose prose-stone dark:prose-invert prose-lg max-w-none"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{aiModule}</ReactMarkdown></div>
                            </div>
                        )}

                        {/* Teacher Modules List */}
                        {availableModules.length > 0 && (
                            <div className="grid gap-4 animate-in slide-in-from-bottom-4">
                                {availableModules.map(m => (
                                    <div key={m.id} className="bg-white/10 border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-colors">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === 'video_link' ? 'bg-red-500 text-white' : m.type === 'pdf_upload' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                                            {m.type === 'video_link' ? <Youtube className="w-6 h-6"/> : m.type === 'pdf_upload' ? <FileText className="w-6 h-6"/> : <Link className="w-6 h-6"/>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-lg">{m.title}</h4>
                                            <p className="text-sm text-red-200">{m.type === 'video_link' ? 'Video Pembelajaran' : m.type === 'pdf_upload' ? 'Dokumen PDF' : 'Link Eksternal'}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedMaterial(m)}
                                            className="px-4 py-2 bg-white text-red-900 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                                        >
                                            Buka
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {renderPreviewModal()}
                <button onClick={goHome} className="w-full py-4 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors font-bold flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800 active:scale-95"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Menu Utama</button>
            </div>
            <CopyrightFooter />
        </div>
    );
  }

  // 5. PROFILE
  if (view === 'profile') {
      return (
          <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
              <DashboardHeader />
              <div className="max-w-2xl mx-auto p-6 w-full flex-1">
                  <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm border border-stone-200 dark:border-slate-700">
                      <button onClick={goHome} className="mb-6 text-stone-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center font-bold text-sm"><ChevronLeft className="w-4 h-4 mr-1"/> Kembali</button>
                      
                      <div className="flex flex-col items-center mb-8">
                          <div className="relative group mb-4">
                              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-50 dark:border-slate-700 shadow-lg">
                                  {currentPhoto ? <img src={currentPhoto} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-stone-200 dark:text-slate-600"/>}
                              </div>
                              <label className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                                  <Camera className="w-6 h-6"/>
                                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
                              </label>
                          </div>
                          <h2 className="text-2xl font-bold text-stone-800 dark:text-white">{session.name}</h2>
                          <p className="text-stone-500 dark:text-slate-400">{session.className}</p>
                      </div>

                      <div className="space-y-6">
                          {/* Contribution Graph */}
                          <div className="mb-6">
                             <ContributionGraph 
                                data={myResults.map(r => ({ date: new Date(r.timestamp).toISOString(), count: 1 }))}
                                title="Aktivitas Belajar"
                                colorClass="bg-green-500"
                             />
                          </div>

                          {/* Edit Profile Section */}
                          <div className="bg-stone-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-stone-100 dark:border-slate-700">
                              <h3 className="font-bold text-stone-800 dark:text-white mb-4 flex items-center"><UserCircle className="w-5 h-5 mr-2"/> Edit Profil</h3>
                              <form onSubmit={async (e) => {
                                  e.preventDefault();
                                  const form = e.target as HTMLFormElement;
                                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                                  const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                                  
                                  if (!name) { alert("Nama tidak boleh kosong"); return; }
                                  
                                  const updates: any = { name };
                                  if (password) {
                                      updates.passwordHash = btoa(password);
                                  }
                                  
                                  if (session.userId) {
                                      await SupabaseService.updateStudentProfile(session.userId, updates);
                                      alert("Profil berhasil diperbarui! Silakan login ulang untuk melihat perubahan nama.");
                                  }
                              }} className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-bold text-stone-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                      <input name="name" type="text" defaultValue={session.name} className="w-full px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-800 dark:text-white focus:ring-2 focus:ring-red-400 outline-none" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-stone-700 dark:text-slate-300 mb-1">Password Baru (Opsional)</label>
                                      <input name="password" type="password" placeholder="Kosongkan jika tidak ingin mengubah" className="w-full px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-800 dark:text-white focus:ring-2 focus:ring-red-400 outline-none" />
                                  </div>
                                  <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none">Simpan Perubahan</button>
                              </form>
                          </div>

                          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/40">
                              <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center"><BrainCircuit className="w-5 h-5 mr-2"/> Preferensi Gaya Belajar</h3>
                              <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">Pilih gaya belajar yang paling cocok untukmu. Sistem akan menyesuaikan materi (jika tersedia) berdasarkan pilihan ini.</p>
                              <div className="space-y-3">
                                  {[LearningStyle.VISUAL, LearningStyle.AUDITORY, LearningStyle.KINESTHETIC].map(style => (
                                      <button key={style} onClick={() => updateLearningStyle(style)} className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between ${currentStyle === style ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-md' : 'border-transparent bg-orange-100/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-orange-200'}`}>
                                          <span className="font-bold text-stone-700 dark:text-slate-200">{style}</span>
                                          {currentStyle === style && <CheckCircle2 className="w-5 h-5 text-orange-500"/>}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              <CopyrightFooter />
          </div>
      );
  }

  // 6. RAPOR VIEW (NEW)
  if (view === 'rapor') {
      return (
          <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
              <DashboardHeader />
              <div className="w-full flex-1">
                  <StudentReportCard 
                      studentId={session.userId!} 
                      onBack={goHome}
                  />
              </div>
              <CopyrightFooter />
          </div>
      );
  }

  return <div>Loading...</div>;
};
