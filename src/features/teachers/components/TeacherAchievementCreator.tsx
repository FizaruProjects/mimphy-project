
import React, { useState, useEffect } from 'react';
import { Achievement, AchievementType } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { Medal, Plus, Trash2, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface Props {
    onRefresh?: () => void;
}

export const TeacherAchievementCreator: React.FC<Props> = ({ onRefresh }) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    
    // Form States
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState<AchievementType>(AchievementType.TOTAL_PACKETS);
    const [targetVal, setTargetVal] = useState(1);
    const [iconUrl, setIconUrl] = useState<string>('');

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        const data = await SupabaseService.getAchievements();
        setAchievements(data);
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 200000) { // 200KB limit for icons
                alert("Ukuran ikon maksimal 200KB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => setIconUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!title || !desc || targetVal <= 0) {
            alert("Mohon lengkapi data achievement.");
            return;
        }

        const newAch: Achievement = {
            id: `ACH-${Date.now()}`,
            title,
            description: desc,
            type,
            targetValue: targetVal,
            iconUrl: iconUrl || undefined
        };

        try {
            await SupabaseService.saveAchievement(newAch);
            loadAchievements();
            if(onRefresh) onRefresh();

            // Reset
            setTitle('');
            setDesc('');
            setTargetVal(1);
            setIconUrl('');
            alert("Achievement berhasil dibuat!");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan achievement.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Hapus achievement ini?")) {
            try {
                await SupabaseService.deleteAchievement(id);
                loadAchievements();
            } catch (error) {
                console.error(error);
                alert("Gagal menghapus achievement.");
            }
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* CREATOR FORM */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="font-semibold text-lg mb-4 flex items-center text-slate-800 dark:text-white">
                    <Medal className="w-5 h-5 mr-2 text-yellow-500" /> Buat Achievement Baru
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Achievement</label>
                        <input 
                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-400" 
                            placeholder="Contoh: Sang Juara"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Deskripsi</label>
                        <input 
                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-400" 
                            placeholder="Contoh: Selesaikan 10 Paket Soal"
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tipe Kriteria</label>
                            <select 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-400"
                                value={type}
                                onChange={(e) => setType(e.target.value as AchievementType)}
                            >
                                <option value={AchievementType.TOTAL_PACKETS}>Jumlah Paket Selesai</option>
                                <option value={AchievementType.AVG_SCORE}>Rata-rata Nilai</option>
                                <option value={AchievementType.PERFECT_SCORE}>Dapat Nilai 100</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Target Angka</label>
                            <input 
                                type="number"
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-400" 
                                value={targetVal}
                                onChange={e => setTargetVal(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Icon (Opsional)</label>
                        <div className="flex items-center space-x-4">
                            <label className="cursor-pointer bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center transition-colors">
                                <ImageIcon className="w-4 h-4 mr-2" /> Upload Icon
                                <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                            </label>
                            {iconUrl && <img src={iconUrl} alt="Preview" className="w-10 h-10 object-contain rounded-full border bg-slate-100" />}
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Simpan Achievement
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Daftar Achievement Aktif</h3>
                <div className="space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    {achievements.length === 0 && <p className="text-slate-400 dark:text-slate-500 italic text-center py-10">Belum ada achievement.</p>}
                    {achievements.map(ach => (
                        <div key={ach.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/40 flex items-center justify-center flex-shrink-0">
                                {ach.iconUrl ? <img src={ach.iconUrl} className="w-8 h-8 object-contain" /> : <Medal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 dark:text-white">{ach.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{ach.description}</p>
                                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full mt-1 inline-block font-mono">
                                    Target: {ach.type === AchievementType.PERFECT_SCORE ? 'Nilai 100' : `${ach.targetValue} ${ach.type === AchievementType.TOTAL_PACKETS ? 'Paket' : 'Poin'}`}
                                </span>
                            </div>
                            <button onClick={() => handleDelete(ach.id)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-2">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
