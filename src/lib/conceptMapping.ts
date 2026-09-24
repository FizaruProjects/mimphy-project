import { StudentResult, QuizPacket, Question } from '@/types';

export interface ConceptDifficulty {
  id: string;
  concept: string;               // Display name, e.g., "Persamaan Bernoulli"
  topic: string;                 // Main Topic, e.g. "Fluida Dinamis"
  frequency: number;             // Total number of unique students having difficulty
  percentage: number;            // (frequency / totalRespondents) * 100
  provenCount: number;           // Students who got questions wrong (Performa Asesmen)
  perceivedCount: number;        // Students who cited it in feedback (Persepsi Siswa)
  avgPerformance: number;        // Average score/accuracy % on questions in this concept (0-100%)
  totalQuestions: number;        // Number of related questions
  indicators: string[];          // List of related indicator statements
  sampleQuestionTexts: string[]; // Snippets of related questions
  affectedClasses: Record<string, number>; // Map of className -> student count
  category: 'Materi' | 'Konsep' | 'Indikator';
  fontSize?: number;             // Computed normalized font size
  color?: string;                // Visual color tag
}

export interface DifficultyAnalysisFilters {
  className: string;  // 'all' or specific class name
  topic: string;      // 'all' or specific topic
  packetId: string;   // 'all' or specific packet ID
  timeRange: string;  // '7d' | '30d' | 'semester' | 'all'
}

export interface DifficultyAnalysisResult {
  concepts: ConceptDifficulty[];
  totalRespondents: number;
  totalResponsesAnalyzed: number;
  totalConceptsIdentified: number;
  isDataLimited: boolean; // True if respondents < 5
  availableTopics: string[];
  availableClasses: string[];
  availablePackets: { id: string; name: string }[];
}

// Built-in Alias Mapping for Physics terms & concepts
const CONCEPT_ALIASES: Record<string, string> = {
  // Fluida Dinamis
  'bernoulli': 'Persamaan Bernoulli',
  'persamaan bernoulli': 'Persamaan Bernoulli',
  'hukum bernoulli': 'Persamaan Bernoulli',
  'asas bernoulli': 'Persamaan Bernoulli',
  'penerapan bernoulli': 'Persamaan Bernoulli',
  
  'kontinuitas': 'Persamaan Kontinuitas',
  'persamaan kontinuitas': 'Persamaan Kontinuitas',
  'asas kontinuitas': 'Persamaan Kontinuitas',
  
  'venturi': 'Efek Venturi / Venturimeter',
  'efek venturi': 'Efek Venturi / Venturimeter',
  'venturimeter': 'Efek Venturi / Venturimeter',
  'pipa venturi': 'Efek Venturi / Venturimeter',
  
  'debit': 'Debit Fluida',
  'debit fluida': 'Debit Fluida',
  'laju aliran': 'Debit Fluida',
  'laju volume': 'Debit Fluida',
  
  'torricelli': 'Asas Torricelli',
  'asas torricelli': 'Asas Torricelli',
  'teorema torricelli': 'Asas Torricelli',
  'kebocoran tangki': 'Asas Torricelli',
  
  'viskositas': 'Viskositas Fluida',
  'kekentalan': 'Viskositas Fluida',
  'hukum stokes': 'Viskositas Fluida',
  
  'tekanan': 'Tekanan Fluida',
  'tekanan fluida': 'Tekanan Fluida',
  'tekanan hidrostatis': 'Tekanan Fluida',
  
  'kecepatan aliran': 'Kecepatan Aliran Fluida',
  'kelajuan fluida': 'Kecepatan Aliran Fluida',
  
  'luas penampang': 'Luas Penampang Pipa',
  'penampang': 'Luas Penampang Pipa',

  // Listrik & Gelombang (Support generic topics)
  'hukum ohm': 'Hukum Ohm',
  'kirchhoff': 'Hukum Kirchhoff',
  'gelombang': 'Gelombang Mekanik',
  'gelombang berjalan': 'Gelombang Berjalan',
  'gelombang stasioner': 'Gelombang Stasioner'
};

const INDONESIAN_STOP_WORDS = new Set([
  'saya', 'aku', 'yang', 'dan', 'di', 'ke', 'dari', 'itu', 'ini', 'sulit', 'susah', 
  'belum', 'tidak', 'paham', 'mengerti', 'memahami', 'perlu', 'pada', 'materi', 
  'konsep', 'soal', 'masih', 'kurang', 'adalah', 'akan', 'dapat', 'dengan', 
  'untuk', 'bisa', 'harus', 'sangat', 'terlalu', 'bagian', 'mengenai', 'tentang'
]);

/**
 * Normalizes text to a structured concept label.
 */
export function normalizeConceptTerm(rawText: string, defaultTopic?: string): { concept: string; category: 'Materi' | 'Konsep' | 'Indikator' } {
  if (!rawText || !rawText.trim()) {
    return { concept: defaultTopic || 'Konsep Fisika Umum', category: 'Materi' };
  }

  const cleanLower = rawText.trim().toLowerCase();

  // 1. Check exact alias map
  if (CONCEPT_ALIASES[cleanLower]) {
    return { concept: CONCEPT_ALIASES[cleanLower], category: 'Konsep' };
  }

  // 2. Check substring match in alias map
  for (const [aliasKey, normalizedName] of Object.entries(CONCEPT_ALIASES)) {
    if (cleanLower.includes(aliasKey)) {
      return { concept: normalizedName, category: 'Konsep' };
    }
  }

  // 3. Clean up common Bloom taxonomy prefixes
  let cleaned = rawText.trim();
  const prefixesToRemove = [
    /^Menganalisis\s+/i,
    /^Menentukan\s+/i,
    /^Menghitung\s+/i,
    /^Memahami\s+/i,
    /^Menjelaskan\s+/i,
    /^Mengidentifikasi\s+/i,
    /^Menerapkan\s+/i,
    /^Menerapkan konsep\s+/i,
    /^Konsep\s+/i,
    /^Persamaan\s+/i
  ];

  let strippedPrefix = false;
  for (const prefix of prefixesToRemove) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '');
      strippedPrefix = true;
      break;
    }
  }

  // Format capitalized title
  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return {
      concept: cleaned,
      category: strippedPrefix ? 'Indikator' : 'Konsep'
    };
  }

  return { concept: defaultTopic || 'Konsep Fisika', category: 'Materi' };
}

/**
 * Preprocesses free text feedback into key physics concepts.
 */
export function extractConceptsFromFreeText(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const extracted: string[] = [];

  // Check known aliases in text
  for (const [aliasKey, normalizedName] of Object.entries(CONCEPT_ALIASES)) {
    if (lowerText.includes(aliasKey) && !extracted.includes(normalizedName)) {
      extracted.push(normalizedName);
    }
  }

  // If no known physics alias matched, extract non-stopwords
  if (extracted.length === 0) {
    const tokens = lowerText
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !INDONESIAN_STOP_WORDS.has(w));
    
    if (tokens.length > 0) {
      const phrase = tokens.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      extracted.push(phrase);
    }
  }

  return extracted;
}

/**
 * Analyzes student results, diagnostic tests, and question indicators to map difficulty.
 */
export function analyzeDifficultyData(
  results: StudentResult[],
  packets: QuizPacket[],
  filters: DifficultyAnalysisFilters
): DifficultyAnalysisResult {
  // 1. Filter results based on criteria
  const now = Date.now();
  const filteredResults = results.filter(r => {
    // Filter Class
    if (filters.className !== 'all' && r.className !== filters.className) {
      return false;
    }
    // Filter Packet
    if (filters.packetId !== 'all' && r.packetId !== filters.packetId) {
      return false;
    }
    // Filter Time Range
    if (filters.timeRange !== 'all') {
      const msDiff = now - r.timestamp;
      const daysDiff = msDiff / (1000 * 60 * 60 * 24);
      if (filters.timeRange === '7d' && daysDiff > 7) return false;
      if (filters.timeRange === '30d' && daysDiff > 30) return false;
      if (filters.timeRange === 'semester' && daysDiff > 180) return false;
    }
    return true;
  });

  // Collect available options for dropdowns
  const availableTopicsSet = new Set<string>();
  const availableClassesSet = new Set<string>();
  const availablePacketsMap = new Map<string, string>();

  packets.forEach(p => {
    availablePacketsMap.set(p.id, p.name);
    p.questions.forEach(q => {
      if (q.topic) availableTopicsSet.add(q.topic);
    });
  });

  results.forEach(r => {
    if (r.className) availableClassesSet.add(r.className);
  });

  // Packets lookup map
  const packetMap = new Map<string, QuizPacket>();
  packets.forEach(p => packetMap.set(p.id, p));

  // Data aggregators per Concept
  interface ConceptAcc {
    id: string;
    concept: string;
    topic: string;
    strugglingStudents: Set<string>; // Unique studentIds having difficulty
    provenStudents: Set<string>;     // Struggled in test questions
    perceivedStudents: Set<string>;  // Struggled in feedback
    totalQuestions: Set<string>;     // Unique question IDs
    correctAnswersCount: number;     // Number of correct student answers on these questions
    totalAnswersCount: number;       // Number of total student answers on these questions
    indicators: Set<string>;
    questionTexts: Set<string>;
    affectedClasses: Record<string, Set<string>>; // className -> Set of studentIds
    category: 'Materi' | 'Konsep' | 'Indikator';
  }

  const conceptAccMap = new Map<string, ConceptAcc>();

  const getOrCreateAcc = (conceptName: string, topicName: string, category: 'Materi' | 'Konsep' | 'Indikator'): ConceptAcc => {
    const key = conceptName.toLowerCase();
    if (!conceptAccMap.has(key)) {
      conceptAccMap.set(key, {
        id: `concept_${key.replace(/[^a-z0-9]/g, '_')}`,
        concept: conceptName,
        topic: topicName,
        strugglingStudents: new Set<string>(),
        provenStudents: new Set<string>(),
        perceivedStudents: new Set<string>(),
        totalQuestions: new Set<string>(),
        correctAnswersCount: 0,
        totalAnswersCount: 0,
        indicators: new Set<string>(),
        questionTexts: new Set<string>(),
        affectedClasses: {},
        category
      });
    }
    return conceptAccMap.get(key)!;
  };

  let totalResponsesAnalyzed = 0;

  // 2. Process Assessment Answers (Proven Difficulty)
  filteredResults.forEach(r => {
    const pkt = packetMap.get(r.packetId);
    if (!pkt || !pkt.questions) return;

    totalResponsesAnalyzed += r.answers.length;

    r.answers.forEach((isCorrect, idx) => {
      const q = pkt.questions[idx];
      if (!q) return;

      // Check topic filter if applied
      if (filters.topic !== 'all' && q.topic !== filters.topic) {
        return;
      }

      // Determine concept label from indicator or topic
      const rawConcept = q.indicator || q.topic;
      const { concept, category } = normalizeConceptTerm(rawConcept, q.topic);
      const acc = getOrCreateAcc(concept, q.topic, category);

      acc.totalQuestions.add(q.id || `q_${idx}`);
      if (q.indicator) acc.indicators.add(q.indicator);
      if (q.text) acc.questionTexts.add(q.text.slice(0, 80));

      acc.totalAnswersCount += 1;
      if (isCorrect) {
        acc.correctAnswersCount += 1;
      } else {
        // Student answered INCORRECTLY -> Experienced difficulty
        acc.strugglingStudents.add(r.studentId);
        acc.provenStudents.add(r.studentId);

        // Record class breakdown
        if (!acc.affectedClasses[r.className]) {
          acc.affectedClasses[r.className] = new Set<string>();
        }
        acc.affectedClasses[r.className].add(r.studentId);
      }
    });

    // 3. Process AI Feedback / Areas to improve (Perceived Difficulty)
    if (r.aiFeedback && Array.isArray(r.aiFeedback.areasToImprove)) {
      r.aiFeedback.areasToImprove.forEach(areaText => {
        const extracted = extractConceptsFromFreeText(areaText);
        extracted.forEach(conceptName => {
          const { concept, category } = normalizeConceptTerm(conceptName, pkt.questions[0]?.topic || 'Fisika');
          
          if (filters.topic === 'all' || concept.toLowerCase().includes(filters.topic.toLowerCase())) {
            const acc = getOrCreateAcc(concept, pkt.questions[0]?.topic || 'Fisika', category);
            acc.strugglingStudents.add(r.studentId);
            acc.perceivedStudents.add(r.studentId);

            if (!acc.affectedClasses[r.className]) {
              acc.affectedClasses[r.className] = new Set<string>();
            }
            acc.affectedClasses[r.className].add(r.studentId);
          }
        });
      });
    }
  });

  // Calculate unique student respondents count
  const uniqueStudentsSet = new Set(filteredResults.map(r => r.studentId));
  const totalRespondents = uniqueStudentsSet.size;

  // 4. Build final concepts list & normalize frequencies
  const conceptsList: ConceptDifficulty[] = Array.from(conceptAccMap.values())
    .map(acc => {
      const freq = acc.strugglingStudents.size;
      const percentage = totalRespondents > 0 ? Math.round((freq / totalRespondents) * 100) : 0;
      const avgPerf = acc.totalAnswersCount > 0 
        ? Math.round((acc.correctAnswersCount / acc.totalAnswersCount) * 100)
        : 100;

      const affectedClassesCount: Record<string, number> = {};
      Object.entries(acc.affectedClasses).forEach(([cls, studentSet]) => {
        affectedClassesCount[cls] = studentSet.size;
      });

      return {
        id: acc.id,
        concept: acc.concept,
        topic: acc.topic,
        frequency: freq,
        percentage,
        provenCount: acc.provenStudents.size,
        perceivedCount: acc.perceivedStudents.size,
        avgPerformance: avgPerf,
        totalQuestions: acc.totalQuestions.size,
        indicators: Array.from(acc.indicators),
        sampleQuestionTexts: Array.from(acc.questionTexts).slice(0, 5),
        affectedClasses: affectedClassesCount,
        category: acc.category
      };
    })
    .filter(c => c.frequency > 0) // Only show concepts where at least 1 student struggled
    .sort((a, b) => b.frequency - a.frequency);

  // 5. Size Normalization (Min fontSize = 14px, Max fontSize = 42px)
  if (conceptsList.length > 0) {
    const maxFreq = Math.max(...conceptsList.map(c => c.frequency), 1);
    const minFreq = Math.min(...conceptsList.map(c => c.frequency), 1);
    const fontMin = 14;
    const fontMax = 40;

    // Palette of harmonious colors for dark/light themes
    const colors = [
      '#ef4444', // Red (High frequency)
      '#f97316', // Orange
      '#f59e0b', // Amber
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#10b981', // Emerald
    ];

    conceptsList.forEach((c, idx) => {
      let weight = 0.5;
      if (maxFreq > minFreq) {
        weight = (c.frequency - minFreq) / (maxFreq - minFreq);
      } else {
        weight = 0.8;
      }
      c.fontSize = Math.round(fontMin + weight * (fontMax - fontMin));
      c.color = colors[idx % colors.length];
    });
  }

  return {
    concepts: conceptsList,
    totalRespondents,
    totalResponsesAnalyzed,
    totalConceptsIdentified: conceptsList.length,
    isDataLimited: totalRespondents < 5,
    availableTopics: Array.from(availableTopicsSet).sort(),
    availableClasses: Array.from(availableClassesSet).sort(),
    availablePackets: Array.from(availablePacketsMap.entries()).map(([id, name]) => ({ id, name }))
  };
}
