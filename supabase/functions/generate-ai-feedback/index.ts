// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  score: number;
  abilityLevel: string; // 'Rendah' | 'Sedang' | 'Tinggi'
  packetName?: string;
  testTopic?: string;
  masteredIndicators?: string[];
  unmasteredIndicators?: string[];
  indicatorStats?: Array<{ indicator: string; correct: number; total: number }>;
  availableModuleTitles?: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY tidak dikonfigurasi pada environment secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: Payload = await req.json();
    const {
      score,
      abilityLevel,
      packetName = "Asesmen Diagnostik",
      testTopic = "Fisika SMA",
      masteredIndicators = [],
      unmasteredIndicators = [],
      indicatorStats = [],
      availableModuleTitles = []
    } = payload;

    const statsFormatted = indicatorStats.map(s => `- Indikator "${s.indicator}": ${s.correct} benar dari ${s.total} soal`).join("\n");

    const prompt = `Bertindaklah sebagai Guru Fisika SMA yang empatik, bijak, dan inspiratif di Indonesia.
Siswa telah menyelesaikan asesmen diagnostik Mimphy dengan data hasil sebagai berikut:

- Topik/Paket: ${packetName} (${testTopic})
- Nilai Akhir Siswa: ${score} / 100
- Kategori Kemampuan Siswa: ${abilityLevel} (PERHATIAN: Kategori ini ditentukan secara mutlak oleh algoritma asesmen Mimphy. Anda TIDAK BOLEH mengubah, menilai ulang, atau membandingkan penetapan kategori ini. Tugas Anda HANYA memberikan feedback pembelajaran berdasarkan hasil ini).
- Indikator yang Dikuasai: ${masteredIndicators.length > 0 ? masteredIndicators.join(", ") : "Belum ada indikator yang dikuasai sepenuhnya"}
- Indikator yang Perlu Diperbaiki: ${unmasteredIndicators.length > 0 ? unmasteredIndicators.join(", ") : "Semua indikator berhasil dijawab dengan baik"}
- Rincian Skor per Indikator:
${statsFormatted || "Tidak ada detail indikator"}
- Modul Rekomendasi yang Tersedia di Sistem: ${availableModuleTitles.length > 0 ? availableModuleTitles.join(", ") : "Modul Penguatan & Modul Latihan"}

Instruksi Khusus:
1. Gunakan bahasa Indonesia yang natural, hangat, positif, konstruktif, dan mudah dipahami siswa SMA.
2. Jangan menggunakan istilah yang menghakimi. Berikan apresiasi atas usaha siswa.
3. Hasilkan output persis dalam format JSON dengan kunci:
   - "summary": String singkat (1-2 kalimat) yang merangkum pencapaian siswa secara positif.
   - "strengths": Array of string (1-3 poin) berisi kekuatan siswa dan indikator yang telah berhasil dikuasai.
   - "areasToImprove": Array of string (1-3 poin) berisi indikator atau materi yang masih membutuhkan latihan/pemahaman lebih lanjut.
   - "studyAdvice": Array of string (2-3 poin) berisi saran belajar konkret dan langkah praktis yang bisa dilakukan siswa SMA.
   - "recommendedModules": Array of string (1-3 poin) berisi rekomendasi modul/topik belajar yang tepat sesuai kebutuhan perbaikan siswa.

Format JSON yang diwajibkan:
{
  "summary": "...",
  "strengths": ["..."],
  "areasToImprove": ["..."],
  "studyAdvice": ["..."],
  "recommendedModules": ["..."]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API Error:", errText);
      return new Response(
        JSON.stringify({ error: `Gemini API Call Failed: ${geminiResponse.statusText}`, details: errText }),
        { status: geminiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Respon dari Gemini kosong.");
    }

    const parsedFeedback = JSON.parse(candidateText);

    return new Response(
      JSON.stringify({
        success: true,
        feedback: parsedFeedback
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Terjadi kesalahan internal pada Edge Function" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
