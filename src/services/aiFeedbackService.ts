import { supabase } from '@/lib/supabaseClient';
import { AIFeedback } from '@/types';

export interface AIFeedbackPayload {
  score: number;
  abilityLevel: string; // 'Rendah' | 'Sedang' | 'Tinggi'
  packetName: string;
  testTopic: string;
  masteredIndicators: string[];
  unmasteredIndicators: string[];
  indicatorStats: Array<{ indicator: string; correct: number; total: number }>;
  availableModuleTitles?: string[];
}

/**
 * Fallback Feedback Generator
 * Menghasilkan feedback terstruktur berbasis template jika Gemini API / Supabase Edge Function tidak tersedia,
 * mengalami timeout, atau terkena rate limit.
 */
export function generateFallbackFeedback(payload: AIFeedbackPayload): AIFeedback {
  const { score, abilityLevel, packetName, testTopic, masteredIndicators, unmasteredIndicators, availableModuleTitles = [] } = payload;
  const isHigh = abilityLevel === 'Tinggi' || score >= 85;
  const isLow = abilityLevel === 'Rendah' || score < 60;

  // 1. Ringkasan Hasil
  let summary = `Kamu telah menyelesaikan asesmen diagnostik "${packetName}" (${testTopic}) dengan nilai ${score}/100 dan masuk dalam kategori kemampuan ${abilityLevel}.`;
  if (isHigh) {
    summary += " Hasil yang sangat mengagumkan! Kamu memiliki pemahaman konsep awal yang sangat kuat.";
  } else if (isLow) {
    summary += " Kerja bagus telah mencoba yang terbaik! Ini awal yang baik untuk mengidentifikasi materi yang perlu diperkuat.";
  } else {
    summary += " Pencapaian yang solid! Kamu sudah memahami sebagian besar konsep dasar dengan baik.";
  }

  // 2. Kekuatan Siswa
  const strengths: string[] = [];
  if (masteredIndicators.length > 0) {
    strengths.push(`Menguasai indikator: ${masteredIndicators.slice(0, 3).join(', ')}.`);
  } else {
    strengths.push("Memiliki ketelitian dalam mencoba menyelesaikan soal-soal asesmen hingga akhir.");
  }
  if (score >= 50) {
    strengths.push("Mampu menerapkan penalaran logika fisika pada soal-soal tingkat dasar dan sedang.");
  } else {
    strengths.push("Semangat belajar yang baik dalam mengukur kemampuan awal.");
  }

  // 3. Indikator yang Perlu Diperbaiki
  const areasToImprove: string[] = [];
  if (unmasteredIndicators.length > 0) {
    areasToImprove.push(`Perlu pendalaman lebih lanjut pada indikator: ${unmasteredIndicators.slice(0, 3).join(', ')}.`);
  } else {
    areasToImprove.push("Pertahankan ketelitian dan coba tingkatkan pemahaman pada soal-soal pengayaan (HOTS).");
  }
  if (isLow) {
    areasToImprove.push("Perlu meninjau kembali konsep dasar dan definisi konsep fisika utama.");
  } else if (!isHigh) {
    areasToImprove.push("Perlu memperbanyak latihan variasi rumus dan perhitungan analitis.");
  }

  // 4. Saran Belajar Konkret
  const studyAdvice: string[] = [];
  if (isLow) {
    studyAdvice.push("Fokus membaca ulang ringkasan materi dasar dan gunakan contoh visual/analogi sederhana.");
    studyAdvice.push("Kerjakan soal-soal latihan secara bertahap mulai dari tingkat dasar sebelum mencoba soal yang lebih rumit.");
  } else if (isHigh) {
    studyAdvice.push("Tingkatkan kemampuan analitis dengan mencoba soal-soal tantangan bertipe HOTS.");
    studyAdvice.push("Coba jelaskan kembali konsep materi ini kepada teman sejawat untuk memperkuat pemahaman.");
  } else {
    studyAdvice.push("Tinjau kembali bagian indikator yang salah dan tulis ulang langkah penyelesaiannya secara urut.");
    studyAdvice.push("Luangkan waktu 15-20 menit setiap hari untuk berlatih soal-soal bertema " + testTopic + ".");
  }

  // 5. Rekomendasi Modul yang Sesuai
  const recommendedModules: string[] = [];
  if (availableModuleTitles.length > 0) {
    recommendedModules.push(...availableModuleTitles.slice(0, 2));
  } else {
    if (isLow) {
      recommendedModules.push(`Modul Pembelajaran Dasar ${testTopic}`);
      recommendedModules.push(`Panduan & Contoh Soal Dasar ${testTopic}`);
    } else if (isHigh) {
      recommendedModules.push(`Modul Pengayaan & Problem Solving HOTS ${testTopic}`);
    } else {
      recommendedModules.push(`Modul Latihan Terarah ${testTopic}`);
      recommendedModules.push(`Rangkuman Rumus & Aplikasi ${testTopic}`);
    }
  }

  return {
    summary,
    strengths,
    areasToImprove,
    studyAdvice,
    recommendedModules,
    generatedBy: 'fallback',
    createdAt: Date.now()
  };
}

/**
 * Panggil Gemini API untuk menghasilkan AI Feedback Asesmen Diagnostik.
 * Menggunakan Supabase Edge Function 'generate-ai-feedback' untuk menjaga kerahasiaan API Key.
 * Jika terjadi kegagalan (network error, API Key/kuota tidak ada, timeout, dll),
 * fungsi ini akan otomatis mengembalikan fallback feedback berbasis template.
 */
export async function generateAIFeedback(payload: AIFeedbackPayload): Promise<AIFeedback> {
  // Setup 10-second timeout to ensure quick UX
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase.functions.invoke('generate-ai-feedback', {
      body: payload
    });

    clearTimeout(timeoutId);

    if (error) {
      console.warn("[AIFeedbackService] Supabase Edge Function error or key missing, fallback applied:", error.message || error);
      return generateFallbackFeedback(payload);
    }

    if (data && data.success && data.feedback) {
      const fb = data.feedback;
      return {
        summary: fb.summary || "Feedback pembelajaran berhasil dihasilkan.",
        strengths: Array.isArray(fb.strengths) ? fb.strengths : [fb.strengths].filter(Boolean),
        areasToImprove: Array.isArray(fb.areasToImprove) ? fb.areasToImprove : [fb.areasToImprove].filter(Boolean),
        studyAdvice: Array.isArray(fb.studyAdvice) ? fb.studyAdvice : [fb.studyAdvice].filter(Boolean),
        recommendedModules: Array.isArray(fb.recommendedModules) ? fb.recommendedModules : [fb.recommendedModules].filter(Boolean),
        generatedBy: 'gemini',
        createdAt: Date.now()
      };
    }

    console.warn("[AIFeedbackService] Edge function response format invalid, fallback applied.");
    return generateFallbackFeedback(payload);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn("[AIFeedbackService] Failed to generate AI feedback via API, fallback applied:", err?.message || err);
    return generateFallbackFeedback(payload);
  }
}
