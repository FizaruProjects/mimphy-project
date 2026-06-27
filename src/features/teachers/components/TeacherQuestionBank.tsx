
import React, { useState } from 'react';
import { Question, Difficulty } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { generateQuestionAI } from '@/lib/geminiService';
import { Plus, Save, Wand2, Loader2, X, Image as ImageIcon, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  questions: Question[];
  onRefresh: () => void;
  teacherId: string;
  subject?: string; // NEW: Subject prop
}

export const TeacherQuestionBank: React.FC<Props> = ({ questions, onRefresh, teacherId, subject }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qTopic, setQTopic] = useState('');
  const [qIndicator, setQIndicator] = useState(''); // NEW: Indicator state
  const [qDifficulty, setQDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [qText, setQText] = useState('');
  const [qImage, setQImage] = useState<string | null>(null);
  const [qOptions, setQOptions] = useState(['', '', '', '', '']); 
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleGenerateAI = async () => {
    if (!qTopic) {
        alert("Harap isi topik terlebih dahulu");
        return;
    }
    setIsGenerating(true);
    const aiData = await generateQuestionAI(qTopic, qDifficulty);
    setIsGenerating(false);
    
    if (aiData) {
        setQText(aiData.text);
        const aiOptions = aiData.options || [];
        const filledOptions = [...aiOptions];
        while (filledOptions.length < 5) filledOptions.push('');
        
        setQOptions(filledOptions.slice(0, 5));
        setQCorrect(aiData.correctIndex);
        setQExplanation(aiData.explanation);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            if (file.size > 500000) { 
                alert("Ukuran gambar terlalu besar. Mohon gunakan gambar di bawah 500KB.");
                return;
            }
            const base64 = await readFileAsBase64(file);
            setQImage(base64);
        } catch (err) {
            alert("Gagal memproses gambar.");
        }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQTopic('');
    setQIndicator(''); // Reset Indicator
    setQDifficulty(Difficulty.MEDIUM);
    setQText('');
    setQImage(null);
    setQOptions(['', '', '', '', '']); 
    setQCorrect(0);
    setQExplanation('');
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setQTopic(q.topic);
    setQIndicator(q.indicator || ''); // Set Indicator
    setQDifficulty(q.difficulty);
    setQText(q.text);
    setQImage(q.imageUrl || null);
    
    const paddedOptions = [...q.options];
    while (paddedOptions.length < 5) paddedOptions.push('');
    setQOptions(paddedOptions);
    
    setQCorrect(q.correctIndex);
    setQExplanation(q.explanation);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id: string) => {
      if(confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
          await SupabaseService.deleteQuestion(id);
          onRefresh();
          // If we were editing this specific question, cancel the edit
          if (editingId === id) {
              resetForm();
          }
      }
  };

  // Helper to generate UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSaveQuestion = async () => {
    // Validation
    if (!qText) {
        alert("Pertanyaan tidak boleh kosong!");
        return;
    }
    if (qOptions.some(o => !o.trim())) {
        alert("Semua 5 pilihan jawaban harus diisi!");
        return;
    }
    
    try {
        const idToUse = editingId ? editingId : generateUUID();

        const newQ: Question = {
            id: idToUse,
            teacherId: teacherId, // Save relationship
            topic: qTopic,
            indicator: qIndicator, // Save Indicator
            difficulty: qDifficulty,
            text: qText,
            imageUrl: qImage || undefined,
            options: qOptions,
            correctIndex: qCorrect,
            explanation: qExplanation
        };

        await SupabaseService.saveQuestion(newQ);
        onRefresh(); 
        
        resetForm();
        alert(editingId ? "Soal berhasil diperbarui!" : "Soal berhasil disimpan!");
    } catch (error: any) {
        console.error("Error saving question:", error);
        alert(`Gagal menyimpan soal: ${error.message || "Terjadi kesalahan"}`);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-slate-700 transition-colors">
        <h3 className="font-semibold text-lg mb-4 flex items-center justify-between text-stone-800 dark:text-white">
          <span className="flex items-center">
             {editingId ? <Pencil className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" /> : <Plus className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />}
             {editingId ? 'Edit Soal' : 'Tambah Soal Baru'}
             {subject && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">{subject}</span>}
          </span>
          {editingId && (
            <button 
                onClick={resetForm}
                className="text-xs bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 px-2 py-1 rounded flex items-center hover:bg-stone-200 dark:hover:bg-slate-600"
            >
                <RotateCcw className="w-3 h-3 mr-1" /> Batal Edit
            </button>
          )}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Topik</label>
                <input 
                    className="w-full p-2 border rounded-lg text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400" 
                    placeholder="Contoh: Hukum Newton"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Indikator Soal</label>
                <input 
                    className="w-full p-2 border rounded-lg text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400" 
                    placeholder="Contoh: Menghitung percepatan"
                    value={qIndicator}
                    onChange={e => setQIndicator(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Tingkat Kesulitan</label>
                <select 
                    className="w-full p-2 border rounded-lg text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as Difficulty)}
                >
                    <option value={Difficulty.EASY}>Mudah</option>
                    <option value={Difficulty.MEDIUM}>Sedang</option>
                    <option value={Difficulty.HARD}>Sulit</option>
                </select>
              </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Pertanyaan</label>
            <textarea 
                className="w-full p-2 border rounded-lg text-sm min-h-[80px] bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Tulis pertanyaan di sini..."
                value={qText}
                onChange={e => setQText(e.target.value)}
            />
            <button 
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="absolute top-0 right-0 m-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded-md flex items-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
                {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Wand2 className="w-3 h-3 mr-1"/>}
                Buat dengan AI
            </button>
          </div>
          
          {qText && (
            <div className="p-3 bg-stone-50 dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-700">
                <p className="text-xs font-bold text-stone-500 mb-1">Preview:</p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qText}</ReactMarkdown>
                </div>
            </div>
          )}

          {/* Image Upload Section */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Gambar Soal (Opsional)</label>
            <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-stone-50 dark:bg-slate-700 border border-stone-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-medium text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-600 transition-colors flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {qImage ? 'Ganti Gambar' : 'Pilih Gambar'}
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                    />
                </label>
                {qImage && (
                    <div className="relative group">
                        <img src={qImage} alt="Preview" className="h-12 w-12 object-cover rounded border border-stone-200 dark:border-slate-600" />
                        <button 
                            onClick={() => setQImage(null)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400">Pilihan Jawaban (Pilih radio button untuk kunci)</label>
            {qOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                    <input 
                        type="radio" 
                        name="correctOpt" 
                        checked={qCorrect === idx} 
                        onChange={() => setQCorrect(idx)}
                        className="text-red-600 dark:text-red-400 dark:bg-slate-700 border-stone-300 dark:border-slate-600 focus:ring-red-500"
                    />
                    <input 
                        className="flex-1 p-2 border rounded-lg text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
                        placeholder={`Pilihan ${idx + 1}`}
                        value={opt}
                        onChange={e => {
                            const newOpts = [...qOptions];
                            newOpts[idx] = e.target.value;
                            setQOptions(newOpts);
                        }}
                    />
                </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1">Pembahasan</label>
            <textarea 
                className="w-full p-2 border rounded-lg text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Jelaskan jawaban yang benar..."
                value={qExplanation}
                onChange={e => setQExplanation(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSaveQuestion}
            className={`w-full text-white py-2 rounded-lg font-medium transition-colors flex justify-center items-center ${
                editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
            }`}
          >
            <Save className="w-4 h-4 mr-2" /> {editingId ? 'Update Soal' : 'Simpan Soal'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="font-semibold text-lg text-stone-700 dark:text-slate-200">Daftar Soal Tersimpan ({questions.length})</h3>
         <div className="h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-600">
            {questions.length === 0 && <p className="text-stone-400 dark:text-slate-500 text-center py-10">Belum ada soal tersimpan.</p>}
            {questions.map(q => (
                <div key={q.id} className={`bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm transition-colors relative group ${editingId === q.id ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-stone-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                            <span className="bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full w-fit">{q.topic}</span>
                            {q.indicator && <span className="text-[10px] text-stone-500 dark:text-slate-400 italic">{q.indicator}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                q.difficulty === Difficulty.HARD ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                q.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>{q.difficulty}</span>
                            
                            {/* Action Buttons */}
                            <button 
                                onClick={() => handleEditQuestion(q)}
                                className="p-1.5 bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 rounded text-stone-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-500 transition-colors"
                                title="Edit Soal"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 rounded text-stone-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500 transition-colors"
                                title="Hapus Soal"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {q.imageUrl && (
                            <img src={q.imageUrl} alt="Soal" className="w-16 h-16 object-cover rounded bg-stone-100 dark:bg-slate-900 border dark:border-slate-700" />
                        )}
                        <div className="font-medium text-sm text-stone-800 dark:text-slate-200 line-clamp-2 flex-1 prose prose-sm dark:prose-invert max-w-none">
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
