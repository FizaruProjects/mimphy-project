
import React, { useState } from 'react';
import { Question, QuizPacket, DifferentiationMode, LearningMaterial, MaterialType, PacketModules, ModuleItem } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { FileText, Image as ImageIcon, Layers, BrainCircuit, Youtube, Link, Upload, Trash2, Plus, PlayCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  questions: Question[];
  packets: QuizPacket[];
  onRefresh: () => void;
  teacherId: string;
  subject?: string; // NEW: Subject prop
}

export const TeacherPacketCreator: React.FC<Props> = ({ questions, packets, onRefresh, teacherId, subject }) => {
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [packetName, setPacketName] = useState('');
  const [diffMode, setDiffMode] = useState<DifferentiationMode>(DifferentiationMode.CONTENT);
  
  // NEW: State untuk Modul Diferensiasi
  const [diffModules, setDiffModules] = useState<PacketModules>({
      basic: [], medium: [], high: [],
      visual: [], auditory: [], kinesthetic: []
  });

  // State Form Input Modul
  const [modCategory, setModCategory] = useState<string>('basic'); // default keys of PacketModules
  const [modTitle, setModTitle] = useState('');
  const [modType, setModType] = useState<MaterialType>('document_link');
  const [modUrl, setModUrl] = useState('');
  const [modFile, setModFile] = useState<File | null>(null);

  // General Learning Materials (Pra-Kuis)
  const [generalMaterials, setGeneralMaterials] = useState<LearningMaterial[]>([]);
  // Reuse existing state logic for general materials input if needed, 
  // but for clarity let's focus on differentiation logic first.

  // Helper to read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleAddDiffModule = async () => {
      if (!modTitle) {
          alert("Judul materi wajib diisi.");
          return;
      }

      let content = "";
      if (modType === 'pdf_upload') {
          if (!modFile) {
              alert("Silakan pilih file PDF.");
              return;
          }
          try {
            content = await readFileAsBase64(modFile);
          } catch (e) {
              alert("Gagal membaca file.");
              return;
          }
      } else {
          if (!modUrl) {
              alert("Silakan masukkan URL.");
              return;
          }
          content = modUrl;
      }

      const newItem: ModuleItem = {
          id: Date.now().toString(),
          title: modTitle,
          type: modType,
          content: content
      };

      setDiffModules(prev => ({
          ...prev,
          [modCategory]: [...prev[modCategory as keyof PacketModules], newItem]
      }));

      // Reset Form
      setModTitle('');
      setModUrl('');
      setModFile(null);
  };

  const removeDiffModule = (category: keyof PacketModules, id: string) => {
      setDiffModules(prev => ({
          ...prev,
          [category]: prev[category].filter(m => m.id !== id)
      }));
  };

  const handleCreatePacket = async () => {
    if (!packetName || selectedQIds.length === 0) return;
    
    const packetQuestions = questions.filter(q => selectedQIds.includes(q.id));
    
    // Generate Code based on Subject
    let prefix = 'FIS';
    if (subject) {
        prefix = subject.substring(0, 3).toUpperCase();
    }
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newPacket: QuizPacket = {
        id: code,
        teacherId: teacherId, 
        name: packetName,
        questions: packetQuestions,
        modules: diffModules, // Save the new complex structure
        learningMaterials: generalMaterials, // General materials
        createdAt: Date.now(),
        differentiationMode: diffMode
    };
    
    try {
        console.log("Saving packet:", newPacket);
        await SupabaseService.savePacket(newPacket);
        onRefresh();
        // Reset All
        setSelectedQIds([]);
        setPacketName('');
        setDiffModules({ basic: [], medium: [], high: [], visual: [], auditory: [], kinesthetic: [] });
        setGeneralMaterials([]);
        alert(`Paket berhasil dibuat! KODE: ${code}`);
    } catch (e: any) {
        console.error("Error creating packet:", e);
        alert(`Gagal menyimpan paket: ${e.message || "Terjadi kesalahan"}. Cek konsol untuk detail.`);
    }
  };

  // Helper render inputs
  const renderModuleInput = () => (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-stone-200 dark:border-slate-600 mt-2">
          <div className="space-y-3">
              <input 
                  className="w-full p-2 text-xs border rounded bg-stone-50 dark:bg-slate-900 dark:border-slate-600 text-stone-800 dark:text-white"
                  placeholder="Judul Materi (Contoh: Video Pembahasan)"
                  value={modTitle}
                  onChange={e => setModTitle(e.target.value)}
              />
              
              <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setModType('pdf_upload')} className={`text-xs py-2 rounded border flex flex-col items-center justify-center ${modType === 'pdf_upload' ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300' : 'bg-stone-50 dark:bg-slate-800 dark:border-slate-600 text-stone-500'}`}>
                      <Upload className="w-3 h-3 mb-1"/> Upload PDF
                  </button>
                  <button onClick={() => setModType('document_link')} className={`text-xs py-2 rounded border flex flex-col items-center justify-center ${modType === 'document_link' ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300' : 'bg-stone-50 dark:bg-slate-800 dark:border-slate-600 text-stone-500'}`}>
                      <Link className="w-3 h-3 mb-1"/> Link GDrive/Web
                  </button>
                  <button onClick={() => setModType('video_link')} className={`text-xs py-2 rounded border flex flex-col items-center justify-center ${modType === 'video_link' ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300' : 'bg-stone-50 dark:bg-slate-800 dark:border-slate-600 text-stone-500'}`}>
                      <Youtube className="w-3 h-3 mb-1"/> Link Video
                  </button>
              </div>

              {modType === 'pdf_upload' ? (
                  <input type="file" accept="application/pdf" onChange={e => setModFile(e.target.files?.[0] || null)} className="w-full text-xs text-stone-500" />
              ) : (
                  <input 
                      className="w-full p-2 text-xs border rounded bg-stone-50 dark:bg-slate-900 dark:border-slate-600 text-stone-800 dark:text-white"
                      placeholder={modType === 'video_link' ? "URL Youtube/Drive Video..." : "URL Dokumen (Google Drive/Website)..."}
                      value={modUrl}
                      onChange={e => setModUrl(e.target.value)}
                  />
              )}

              <button onClick={handleAddDiffModule} className="w-full bg-stone-800 dark:bg-slate-600 text-white py-2 rounded text-xs font-bold hover:bg-stone-700 flex items-center justify-center">
                  <Plus className="w-3 h-3 mr-1" /> Tambahkan ke {diffMode === 'content' ? (modCategory === 'basic' ? 'Level Dasar' : modCategory === 'medium' ? 'Level Sedang' : 'Level Tinggi') : modCategory}
              </button>
          </div>
      </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-slate-700 h-fit transition-colors">
            <h3 className="font-semibold text-lg mb-4 text-stone-800 dark:text-white">Buat Paket Soal</h3>
            
            {/* Basic Info */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Nama Paket</label>
                <input 
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="Contoh: Ujian Tengah Semester 1"
                    value={packetName}
                    onChange={e => setPacketName(e.target.value)}
                />
            </div>

            {/* Differentiation Mode Selector */}
            <div className="mb-6 pb-6 border-b border-stone-100 dark:border-slate-700">
                <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-2">Mode Diferensiasi (Untuk Modul Pasca-Kuis)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                        onClick={() => { setDiffMode(DifferentiationMode.CONTENT); setModCategory('basic'); }}
                        className={`p-3 rounded-lg border-2 text-left flex flex-col transition-all ${diffMode === DifferentiationMode.CONTENT ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-stone-200 dark:border-slate-600 hover:bg-stone-50 dark:hover:bg-slate-700'}`}
                    >
                        <div className="flex items-center font-bold text-sm text-stone-800 dark:text-white mb-1">
                            <Layers className="w-4 h-4 mr-2 text-red-600 dark:text-red-400"/> Konten
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400">Modul berdasarkan level kemampuan (Dasar, Sedang, Lanjut).</p>
                    </button>
                    
                    <button 
                        onClick={() => { setDiffMode(DifferentiationMode.STYLE); setModCategory('visual'); }}
                        className={`p-3 rounded-lg border-2 text-left flex flex-col transition-all ${diffMode === DifferentiationMode.STYLE ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-stone-200 dark:border-slate-600 hover:bg-stone-50 dark:hover:bg-slate-700'}`}
                    >
                        <div className="flex items-center font-bold text-sm text-stone-800 dark:text-white mb-1">
                            <BrainCircuit className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400"/> Gaya Belajar
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400">Modul berdasarkan preferensi siswa (Visual, Auditori, Kinestetik).</p>
                    </button>
                </div>
            </div>

            {/* DYNAMIC MODULE INPUT SECTION */}
            <div className="mb-6 bg-stone-50 dark:bg-slate-900/50 p-4 rounded-lg border border-stone-200 dark:border-slate-600">
                <h4 className="font-bold text-sm text-stone-700 dark:text-slate-300 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" /> Manajemen Materi Terarah
                </h4>
                
                {/* Category Tabs */}
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2 border-b border-stone-200 dark:border-slate-700">
                    {diffMode === DifferentiationMode.CONTENT ? (
                        <>
                            {['basic', 'medium', 'high'].map(cat => (
                                <button key={cat} onClick={() => setModCategory(cat)} 
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${modCategory === cat ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-400 border dark:border-slate-600'}`}>
                                    {cat === 'basic' ? 'Dasar' : cat === 'medium' ? 'Sedang' : 'Tinggi'}
                                </button>
                            ))}
                        </>
                    ) : (
                        <>
                            {['visual', 'auditory', 'kinesthetic'].map(cat => (
                                <button key={cat} onClick={() => setModCategory(cat)} 
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${modCategory === cat ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-400 border dark:border-slate-600'}`}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* Input Form for Selected Category */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-stone-500 dark:text-slate-400 mb-2">Input Materi untuk: <span className="text-red-600 dark:text-red-400 uppercase">{modCategory}</span></p>
                    {renderModuleInput()}
                </div>

                {/* List of Added Modules for Selected Category */}
                <div className="space-y-2">
                    {diffModules[modCategory as keyof PacketModules].length === 0 && <p className="text-xs text-stone-400 italic text-center py-2">Belum ada materi di kategori ini.</p>}
                    {diffModules[modCategory as keyof PacketModules].map((m) => (
                        <div key={m.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-stone-200 dark:border-slate-600">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {m.type === 'video_link' ? <Youtube className="w-4 h-4 text-red-500 flex-shrink-0"/> : 
                                 m.type === 'pdf_upload' ? <FileText className="w-4 h-4 text-red-500 flex-shrink-0"/> : 
                                 <Link className="w-4 h-4 text-orange-500 flex-shrink-0"/>}
                                <div className="truncate">
                                    <p className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate">{m.title}</p>
                                    <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate max-w-[200px]">{m.type === 'pdf_upload' ? 'File PDF' : m.content}</p>
                                </div>
                            </div>
                            <button onClick={() => removeDiffModule(modCategory as keyof PacketModules, m.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-3 h-3"/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-700 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-stone-600 dark:text-slate-400">Soal Terpilih:</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-lg">{selectedQIds.length}</span>
                </div>
                <button 
                    onClick={handleCreatePacket}
                    disabled={selectedQIds.length === 0 || !packetName}
                    className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    Buat & Simpan Paket
                </button>
            </div>

            <h4 className="font-medium text-stone-700 dark:text-slate-300 mb-2 mt-6">Daftar Paket Aktif</h4>
            <div className="space-y-3">
                {packets.map(p => (
                    <div key={p.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-red-900 dark:text-red-200">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-red-600 dark:text-red-300 font-mono bg-white dark:bg-slate-800 px-1 rounded border dark:border-slate-600">{p.id}</span>
                                <span className="text-xs text-red-600 dark:text-red-300">• {p.questions.length} Soal</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center ${p.differentiationMode === DifferentiationMode.STYLE ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                    {p.differentiationMode === DifferentiationMode.STYLE ? <BrainCircuit className="w-3 h-3 mr-1"/> : <Layers className="w-3 h-3 mr-1"/>}
                                    {p.differentiationMode === DifferentiationMode.STYLE ? 'Gaya Belajar' : 'Level Konten'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-slate-700 transition-colors">
            <h3 className="font-semibold text-lg mb-4 text-stone-800 dark:text-white">Pilih Soal untuk Paket</h3>
            <div className="h-[400px] md:h-[600px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-600">
                {questions.map(q => (
                    <div 
                        key={q.id} 
                        onClick={() => {
                            if (selectedQIds.includes(q.id)) {
                                setSelectedQIds(selectedQIds.filter(id => id !== q.id));
                            } else {
                                setSelectedQIds([...selectedQIds, q.id]);
                            }
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedQIds.includes(q.id) 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30 ring-1 ring-red-500' 
                            : 'border-stone-200 dark:border-slate-700 hover:border-stone-300 dark:hover:border-slate-500'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-stone-500 dark:text-slate-400">{q.topic}</span>
                            <span className="text-xs text-stone-400 dark:text-slate-500">{q.difficulty}</span>
                        </div>
                        <div className="flex gap-2 items-start">
                            {q.imageUrl && <ImageIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                            <div className="text-sm text-stone-800 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{p: ({node, ...props}) => <span {...props} />}}>{q.text}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
