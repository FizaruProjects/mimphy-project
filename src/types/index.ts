
export enum Difficulty {
  EASY = 'Mudah',
  MEDIUM = 'Sedang',
  HARD = 'Sulit'
}

export enum AbilityLevel {
  HIGH = 'Tinggi',
  MEDIUM = 'Sedang',
  BASIC = 'Dasar'
}

// NEW: Mode Diferensiasi
export enum DifferentiationMode {
  CONTENT = 'content',   // Berdasarkan Kemampuan (Basic, Medium, High)
  STYLE = 'style'        // Berdasarkan Gaya Belajar (Visual, Auditory, Kinesthetic)
}

// NEW: Gaya Belajar
export enum LearningStyle {
  VISUAL = 'Visual',
  AUDITORY = 'Auditori',
  KINESTHETIC = 'Kinestetik'
}

export enum AchievementType {
  TOTAL_PACKETS = 'total_packets', // e.g. Finish 5 Packets
  AVG_SCORE = 'avg_score',         // e.g. Average Score > 80
  PERFECT_SCORE = 'perfect_score'  // e.g. Get 100 once
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  targetValue: number;
  iconUrl?: string; // Base64 or emoji
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subject: string; // NEW: Mata Pelajaran
  passwordHash: string;
  isActive: boolean;
  joinedAt: number;
  photoUrl?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  schoolName?: string; // NEW: Nama Sekolah
  className: string;
  passwordHash: string;
  isActive: boolean;
  joinedAt: number;
  photoUrl?: string;
  unlockedAchievements: string[]; // List of Achievement IDs
  learningStyle: LearningStyle;   // NEW: Preferensi Gaya Belajar
}

export interface Question {
  id: string;
  teacherId: string; // Relation to Teacher
  topic: string;
  indicator?: string; // NEW: Indikator Soal
  difficulty: Difficulty;
  text: string;
  imageUrl?: string; 
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt?: number; // NEW: Timestamp for contribution graph
}

// NEW: Tipe Materi Pembelajaran
export type MaterialType = 'pdf_upload' | 'document_link' | 'video_link';

export interface ModuleItem {
  id: string;
  title: string;
  type: MaterialType;
  content: string; // Base64 string for upload, URL for links
}

// NEW: Struktur Modul Terarah Berbasis Diferensiasi
export interface PacketModules {
  // Mode Content
  basic: ModuleItem[];
  medium: ModuleItem[];
  high: ModuleItem[];
  // Mode Style
  visual: ModuleItem[];
  auditory: ModuleItem[];
  kinesthetic: ModuleItem[];
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  content: string; 
}

export interface QuizPacket {
  id: string;
  teacherId: string; // Relation to Teacher
  name: string;
  questions: Question[];
  // modules menggantikan pdfModules lama dengan struktur yang lebih fleksibel
  modules?: PacketModules; 
  learningMaterials?: LearningMaterial[]; // General materials (pra-kuis)
  createdAt: number;
  differentiationMode: DifferentiationMode; // Wajib dipilih guru
  // Legacy support (optional)
  pdfModules?: any; 
}

export interface LearningModule {
  id: string;
  topic: string;
  contentBasic: string;
  contentMedium: string;
  contentHigh: string;
  updatedAt: number;
}

export interface StudentResult {
  id: string;
  studentId: string; // Relation to Student (NEW)
  studentName: string;
  className: string;
  packetId: string;
  score: number;
  abilityLevel: AbilityLevel;
  answers: boolean[]; // True/False array
  selectedIndices: number[]; // NEW: 0=A, 1=B, etc. -1=Empty. Crucial for item analysis.
  attemptNumber: number; // NEW: Urutan percobaan ke-berapa
  timestamp: number;
}

export interface UserSession {
  role: 'student' | 'teacher' | 'admin' | null;
  userId?: string; // ID of the teacher, admin, or student
  name?: string;
  className?: string; // Only for students
  schoolName?: string; // Only for students
  photoUrl?: string; // To display in dashboard
  learningStyle?: LearningStyle; // NEW: Available in session
}
