
/**
 * constants.ts
 * Menyimpan semua nilai konstan yang digunakan di seluruh aplikasi.
 * Tujuannya agar jika ada perubahan key atau nilai default, cukup ubah di satu tempat.
 */

export const STORAGE_KEYS = {
  QUESTIONS: 'fp_questions',
  PACKETS: 'fp_packets',
  RESULTS: 'fp_results',
  MODULES: 'fp_modules',
  TEACHERS: 'fp_users', 
  STUDENTS: 'fp_students',
  ACHIEVEMENTS: 'fp_achievements'
};

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
} as const;

export const DEFAULT_VALUES = {
  PASS_SCORE_HIGH: 85,
  PASS_SCORE_MEDIUM: 70,
  MAX_FILE_SIZE: 500000, // 500KB
};
