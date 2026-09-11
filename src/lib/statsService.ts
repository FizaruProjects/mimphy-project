import { AbilityLevel } from '@/types';

export interface TestStatistics {
  testId: string;
  participantCount: number;
  mean: number;
  standardDeviation: number;
  lowerThreshold: number; // mean - stdDev
  upperThreshold: number; // mean + stdDev
  completionMethod: 'manual' | 'all_completed';
  completedAt: number;
}

export interface CategorizationResult {
  stats: TestStatistics | null;
  studentCategories: Map<string, AbilityLevel>; // resultId -> AbilityLevel
  warningMessage?: string;
}

/**
 * Menghitung Rata-Rata (Mean)
 * Formula: μ = ΣX / N
 */
export function calculateMean(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const mean = sum / scores.length;
  return Number(mean.toFixed(2));
}

/**
 * Menghitung Standard Deviasi Populasi (σ)
 * Formula: σ = √[Σ(X - μ)² / N]
 */
export function calculatePopulationSD(scores: number[], mean: number): number {
  if (scores.length === 0) return 0;
  const squaredDiffsSum = scores.reduce((acc, score) => {
    const diff = score - mean;
    return acc + diff * diff;
  }, 0);
  const variance = squaredDiffsSum / scores.length;
  const sd = Math.sqrt(variance);
  return Number(sd.toFixed(2));
}

/**
 * Pengkategorian kemampuan siswa berdasarkan Azwar:
 * RENDAH (BASIC): X < μ - σ
 * SEDANG (MEDIUM): μ - σ <= X < μ + σ
 * TINGGI (HIGH): X >= μ + σ
 */
export function categorizeScore(
  score: number,
  lowerThreshold: number,
  upperThreshold: number
): AbilityLevel {
  if (score < lowerThreshold) {
    return AbilityLevel.BASIC; // Rendah
  } else if (score >= upperThreshold) {
    return AbilityLevel.HIGH;  // Tinggi
  } else {
    return AbilityLevel.MEDIUM; // Sedang
  }
}

/**
 * Memproses kalkulasi statistik test dan pengkategorian siswa
 */
export function processTestStatistics(
  testId: string,
  validResults: { id: string; studentId: string; score: number }[],
  completionMethod: 'manual' | 'all_completed' = 'manual'
): CategorizationResult {
  const participantCount = validResults.length;
  const studentCategories = new Map<string, AbilityLevel>();

  // Edge Case 1: Jumlah peserta < 2
  if (participantCount < 2) {
    // Default fallback to BASIC/MEDIUM for single participant without throwing error
    validResults.forEach(r => {
      let cat = AbilityLevel.MEDIUM;
      if (r.score >= 85) cat = AbilityLevel.HIGH;
      else if (r.score < 60) cat = AbilityLevel.BASIC;
      studentCategories.set(r.id, cat);
    });

    return {
      stats: null,
      studentCategories,
      warningMessage: 'Data peserta belum mencukupi untuk menentukan kategori.'
    };
  }

  const scores = validResults.map(r => r.score);
  const mean = calculateMean(scores);
  const sd = calculatePopulationSD(scores, mean);

  // Edge Case 2: Semua nilai siswa sama (SD = 0)
  if (sd === 0) {
    // Jika semua nilai sama, seluruh siswa dikategorikan sebagai SEDANG (atau sesuai nilai aktual tanpa pembagian paksa)
    validResults.forEach(r => {
      studentCategories.set(r.id, AbilityLevel.MEDIUM);
    });

    const lowerThreshold = mean;
    const upperThreshold = mean;

    return {
      stats: {
        testId,
        participantCount,
        mean,
        standardDeviation: 0,
        lowerThreshold,
        upperThreshold,
        completionMethod,
        completedAt: Date.now()
      },
      studentCategories,
      warningMessage: 'Variasi nilai tidak tersedia sehingga kategorisasi tidak dapat dilakukan.'
    };
  }

  const lowerThreshold = Number((mean - sd).toFixed(2));
  const upperThreshold = Number((mean + sd).toFixed(2));

  validResults.forEach(r => {
    const category = categorizeScore(r.score, lowerThreshold, upperThreshold);
    studentCategories.set(r.id, category);
  });

  return {
    stats: {
      testId,
      participantCount,
      mean,
      standardDeviation: sd,
      lowerThreshold,
      upperThreshold,
      completionMethod,
      completedAt: Date.now()
    },
    studentCategories
  };
}
