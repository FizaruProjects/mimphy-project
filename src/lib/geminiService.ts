
import { GoogleGenAI, Type } from "@google/genai";
import { AbilityLevel, LearningStyle } from '@/types';

const getAI = () => {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
        console.error("API Key missing");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateQuestionAI = async (topic: string, difficulty: string) => {
    const ai = getAI();
    const prompt = `Buatkan satu soal fisika pilihan ganda dengan 5 pilihan jawaban (A, B, C, D, E) untuk siswa SMA di Indonesia.
    Topik: ${topic}
    Tingkat Kesulitan: ${difficulty}
    Bahasa: Indonesia
    Format: JSON`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        options: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        correctIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING }
                    },
                    required: ["text", "options", "correctIndex", "explanation"]
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("AI Generation failed", e);
        return null;
    }
};

/**
 * Generate Learning Module
 * @param topic Topik Fisika
 * @param profile Bisa berupa AbilityLevel (untuk Content Differentiation) atau LearningStyle (untuk Style Differentiation)
 */
export const generateLearningModule = async (topic: string, profile: AbilityLevel | LearningStyle) => {
    const ai = getAI();
    let promptTone = "";
    
    // Cek apakah parameter adalah AbilityLevel
    if (Object.values(AbilityLevel).includes(profile as AbilityLevel)) {
        switch (profile) {
            case AbilityLevel.BASIC:
                promptTone = "Jelaskan dengan sangat sederhana, gunakan analogi sehari-hari, dan fokus pada konsep dasar. Berikan semangat.";
                break;
            case AbilityLevel.MEDIUM:
                promptTone = "Jelaskan dengan struktur yang jelas, berikan contoh soal, dan hubungkan dengan rumus.";
                break;
            case AbilityLevel.HIGH:
                promptTone = "Berikan materi pengayaan yang menantang, implikasi lanjut dari konsep ini, dan soal HOTS (Higher Order Thinking Skills).";
                break;
        }
    } 
    // Jika bukan AbilityLevel, asumsikan LearningStyle
    else {
        switch (profile) {
            case LearningStyle.VISUAL:
                promptTone = "Fokus pada deskripsi visual yang kuat. Gunakan kata-kata yang memicu imajinasi gambar, diagram, atau grafik. Sarankan siswa untuk menggambar sketsa konsep ini.";
                break;
            case LearningStyle.AUDITORY:
                promptTone = "Gunakan bahasa yang seperti bercerita atau podcast. Gunakan ritme, rima, atau mnemonik (jembatan keledai) untuk membantu mengingat rumus. Sarankan siswa membaca keras-keras.";
                break;
            case LearningStyle.KINESTHETIC:
                promptTone = "Fokus pada aplikasi nyata dan eksperimen. Berikan contoh aktivitas fisik atau percobaan sederhana yang bisa dilakukan siswa untuk memahami konsep ini.";
                break;
        }
    }

    const prompt = `Bertindaklah sebagai guru fisika terbaik. Buatkan modul belajar singkat (sekitar 300 kata) tentang topik "${topic}" untuk siswa dengan profil "${profile}".
    
    Instruksi Khusus: ${promptTone}
    
    Format output dalam Markdown yang rapi.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text;
    } catch (e) {
        console.error("Module generation failed", e);
        return "Maaf, gagal memuat modul pembelajaran. Silakan coba lagi.";
    }
};

// Helper for teachers to draft all 3 levels at once
export const generateModuleDrafts = async (topic: string) => {
    const ai = getAI();
    const prompt = `Buatkan draf materi ajar fisika topik "${topic}" untuk 3 level kemampuan siswa:
    1. Dasar (Basic): Penjelasan konsep sederhana.
    2. Sedang (Medium): Rumus dan aplikasi standar.
    3. Tinggi (High): Analisis mendalam/HOTS.
    
    Output dalam format JSON dengan keys: basic, medium, high. Gunakan format Markdown untuk isi teksnya.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        basic: { type: Type.STRING },
                        medium: { type: Type.STRING },
                        high: { type: Type.STRING }
                    },
                    required: ["basic", "medium", "high"]
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Draft generation failed", e);
        return null;
    }
};
