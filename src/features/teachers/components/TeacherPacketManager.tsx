
import React, { useState, useEffect } from 'react';
import { QuizPacket, Question, DifferentiationMode } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { Eye, Edit, Trash2, X, Save, ArrowUp, ArrowDown, AlertTriangle, Layers, BrainCircuit, CheckCircle } from 'lucide-react';

interface Props {
    packets: QuizPacket[];
    onRefresh: () => void;
}

export const TeacherPacketManager: React.FC<Props> = ({ packets, onRefresh }) => {
    const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
    const [selectedPacket, setSelectedPacket] = useState<QuizPacket | null>(null);
    const [editData, setEditData] = useState<QuizPacket | null>(null);
    const [resultsStatus, setResultsStatus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchStatuses = async () => {
            const statusMap: Record<string, boolean> = {};
            for (const p of packets) {
                statusMap[p.id] = await SupabaseService.hasPacketResults(p.id);
            }
            setResultsStatus(statusMap);
        };
        if (packets.length > 0) {
            fetchStatuses();
        }
    }, [packets]);

    // --- ACTIONS ---
    
    const handleView = (packet: QuizPacket) => {
        setSelectedPacket(packet);
        setView('detail');
    };

    const handleEdit = (packet: QuizPacket) => {
        setSelectedPacket(packet);
        setEditData(JSON.parse(JSON.stringify(packet)));
        setView('edit');
    };

    const handleDelete = async (packetId: string) => {
        const hasRes = await SupabaseService.hasPacketResults(packetId);
        if (hasRes) {
            if (!confirm("PERINGATAN: Siswa sudah mengerjakan paket ini. Menghapus paket akan menghilangkan referensi di riwayat nilai siswa. Lanjutkan?")) return;
        } else {
            if (!confirm("Apakah Anda yakin ingin menghapus paket soal ini?")) return;
        }
        await SupabaseService.deletePacket(packetId);
        onRefresh();
    };

    const handleSaveEdit = async () => {
        if (!editData) return;
        
        if (!editData.name.trim()) {
            alert("Nama paket tidak boleh kosong.");
            return;
        }
        if (editData.questions.length === 0) {
            alert("Paket harus memiliki minimal 1 soal.");
            return;
        }

        const hasResults = await SupabaseService.hasPacketResults(editData.id);
        if (hasResults) {
            if (!confirm("PERHATIAN: Paket ini sudah dikerjakan oleh siswa. Mengubah soal atau kunci jawaban dapat mempengaruhi integritas data nilai yang sudah ada. Tetap simpan?")) return;
        }

        await SupabaseService.updatePacket(editData);
        alert("Paket soal berhasil diperbarui.");
        onRefresh();
        setView('list');
    };

    // --- EDIT HELPERS ---

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if (!editData) return;
        const newQuestions = [...editData.questions];
        if (direction === 'up' && index > 0) {
            [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
        } else if (direction === 'down' && index < newQuestions.length - 1) {
            [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
        }
        setEditData({ ...editData, questions: newQuestions });
    };

    const removeQuestion = (index: number) => {
        if (!editData) return;
        if (!confirm("Hapus soal ini dari paket?")) return;
        const newQuestions = editData.questions.filter((_, i) => i !== index);
        setEditData({ ...editData, questions: newQuestions });
    };

    const updateQuestionField = (index: number, field: keyof Question, value: any) => {
        if (!editData) return;
        const newQuestions = [...editData.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setEditData({ ...editData, questions: newQuestions });
    };

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        if (!editData) return;
        const newQuestions = [...editData.questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[optIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setEditData({ ...editData, questions: newQuestions });
    };

    // --- RENDERERS ---

    if (view === 'list') {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="font-semibold text-lg mb-6 text-slate-800 dark:text-white">Daftar Paket Soal Saya</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="px-6 py-3 rounded-tl-lg">Nama Paket</th>
                                <th className="px-6 py-3">Mode Diferensiasi</th>
                                <th className="px-6 py-3 text-center">Jml Soal</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 rounded-tr-lg text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {packets.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500">Belum ada paket soal. Buat di menu "Buat Paket".</td></tr>
                            )}
                            {packets.map(p => {
                                const hasRes = resultsStatus[p.id] || false;
                                return (
                                    <tr key={p.id} className="hover:bg-purple-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center w-fit px-2 py-1 rounded-full text-xs font-bold ${p.differentiationMode === DifferentiationMode.STYLE ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                                                {p.differentiationMode === DifferentiationMode.STYLE ? <BrainCircuit className="w-3 h-3 mr-1"/> : <Layers className="w-3 h-3 mr-1"/>}
                                                {p.differentiationMode === DifferentiationMode.STYLE ? 'Gaya Belajar' : 'Level Konten'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-400">{p.questions.length}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${hasRes ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                                {hasRes ? 'Aktif' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <button onClick={() => handleView(p)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Lihat Detail"><Eye className="w-4 h-4"/></button>
                                            <button onClick={() => handleEdit(p)} className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title="Edit Paket"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Hapus Paket"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (view === 'detail' && selectedPacket) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in transition-colors">
                <div className="flex justify-between items-start mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div>
                        <h3 className="font-bold text-xl text-purple-900 dark:text-purple-400">{selectedPacket.name}</h3>
                        <div className="flex gap-2 mt-2">
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-300">ID: {selectedPacket.id}</span>
                            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-bold">{selectedPacket.questions.length} Soal</span>
                        </div>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-6 h-6"/></button>
                </div>

                <div className="space-y-6">
                    {selectedPacket.questions.map((q, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border dark:border-slate-600 px-2 py-0.5 rounded text-xs">Soal No. {idx + 1}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{q.topic} • {q.difficulty}</span>
                            </div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-3">{q.text}</p>
                            {q.imageUrl && <img src={q.imageUrl} className="h-32 object-contain rounded border dark:border-slate-600 mb-3" />}
                            <div className="grid gap-2">
                                {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className={`text-sm px-3 py-2 rounded flex items-center ${oIdx === q.correctIndex ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-bold border border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border dark:border-slate-600 text-slate-700 dark:text-slate-300'}`}>
                                        <span className="w-6">{String.fromCharCode(65 + oIdx)}.</span>
                                        {opt}
                                        {oIdx === q.correctIndex && <CheckCircle className="w-4 h-4 ml-auto"/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'edit' && editData) {
        const hasResults = resultsStatus[editData.id] || false;
        
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in transition-colors">
                {/* Header Edit */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center">
                        <Edit className="w-5 h-5 mr-2 text-orange-500"/> Edit Paket Soal
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => setView('list')} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold text-sm">Batal</button>
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold text-sm flex items-center shadow-lg shadow-green-200 dark:shadow-none">
                            <Save className="w-4 h-4 mr-2"/> Simpan Perubahan
                        </button>
                    </div>
                </div>

                {hasResults && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 p-4 rounded-xl mb-6 flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <strong>Peringatan:</strong> Paket ini sudah dikerjakan oleh siswa. 
                            Mengubah isi soal, kunci jawaban, atau menghapus soal dapat menyebabkan ketidaksesuaian data pada riwayat nilai siswa. 
                            Perubahan akan dicatat.
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Paket</label>
                    <input 
                        className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-medium"
                        value={editData.name}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                    />
                </div>

                <div className="space-y-8">
                    {editData.questions.map((q, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-600 relative group transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                                <button onClick={() => moveQuestion(idx, 'down')} disabled={idx === editData.questions.length - 1} className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                                <button onClick={() => removeQuestion(idx)} className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 ml-2"><Trash2 className="w-4 h-4"/></button>
                            </div>

                            <span className="inline-block bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded mb-3">No. {idx + 1}</span>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Pertanyaan</label>
                                    <textarea 
                                        className="w-full p-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-100 outline-none"
                                        rows={2}
                                        value={q.text}
                                        onChange={e => updateQuestionField(idx, 'text', e.target.value)}
                                    />
                                </div>
                                
                                <div className="grid gap-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Pilihan Jawaban (Klik radio untuk set Kunci)</label>
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input 
                                                type="radio" 
                                                name={`key-${idx}`} 
                                                checked={q.correctIndex === oIdx}
                                                onChange={() => updateQuestionField(idx, 'correctIndex', oIdx)}
                                                className="w-4 h-4 text-purple-600 accent-purple-600 cursor-pointer"
                                            />
                                            <span className="text-xs font-mono font-bold w-4 text-slate-600 dark:text-slate-400">{String.fromCharCode(65 + oIdx)}</span>
                                            <input 
                                                className={`flex-1 p-2 border dark:border-slate-600 rounded-lg text-sm outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-white ${q.correctIndex === oIdx ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800 font-medium' : ''}`}
                                                value={opt}
                                                onChange={e => updateOption(idx, oIdx, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {editData.questions.length === 0 && (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                        Paket ini tidak memiliki soal. Silakan hapus paket ini atau tambahkan soal baru melalui menu "Buat Paket".
                    </div>
                )}
            </div>
        );
    }

    return null;
};
