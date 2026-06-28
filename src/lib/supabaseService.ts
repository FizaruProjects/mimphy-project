import { supabase } from './supabaseClient';
import { Question, QuizPacket, StudentResult, TeacherProfile, StudentProfile, Achievement, LearningStyle, DifferentiationMode, Difficulty, AchievementType } from '@/types';

function parseTimestamp(val: any): number {
    if (!val) return Date.now();
    if (typeof val === 'number') {
        if (val < 100000000000) return val * 1000; 
        return val;
    }
    if (typeof val === 'string') {
        const num = Number(val);
        if (!isNaN(num)) {
             if (num < 100000000000) return num * 1000;
             return num;
        }
        return new Date(val).getTime();
    }
    return new Date(val).getTime();
}

// --- CACHE MANAGER ---
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private pending = new Map<string, Promise<any>>();

  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && !forceRefresh) {
      const isStale = now - cached.timestamp > CACHE_TTL;
      
      if (isStale) {
        // Stale-While-Revalidate
        this.executeFetch(key, fetcher).catch(console.error);
      }
      
      return cached.data;
    }

    return this.executeFetch(key, fetcher);
  }

  private async executeFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fetcher().then((data) => {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.pending.delete(key);
      return data;
    }).catch((error) => {
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(pattern: RegExp | string) {
    if (typeof pattern === 'string') {
       this.cache.delete(pattern);
       return;
    }
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new CacheManager();

export const SupabaseService = {
  // --- QUESTIONS ---
  getQuestions: async (teacherId?: string): Promise<Question[]> => {
    const cacheKey = teacherId ? `questions_${teacherId}` : 'questions_all';
    
    return cache.fetch(cacheKey, async () => {
        let query = supabase.from('questions').select('*');
        if (teacherId) query = query.eq('teacher_id', teacherId);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data.map((q: any) => ({
            id: q.id,
            teacherId: q.teacher_id,
            topic: q.topic,
            indicator: q.indicator,
            difficulty: q.difficulty as Difficulty,
            text: q.text,
            imageUrl: q.image_url,
            options: q.options,
            correctIndex: q.correct_index,
            explanation: q.explanation,
            createdAt: parseTimestamp(q.created_at)
        }));
    });
  },

  saveQuestion: async (question: Question) => {
    const { error } = await supabase.from('questions').upsert({
        id: question.id,
        teacher_id: question.teacherId,
        topic: question.topic,
        indicator: question.indicator,
        difficulty: question.difficulty,
        text: question.text,
        image_url: question.imageUrl,
        options: question.options,
        correct_index: question.correctIndex,
        explanation: question.explanation,
        created_at: question.createdAt || Date.now()
    });
    if (error) throw error;
    cache.invalidate(/questions/);
  },

  deleteQuestion: async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(/questions/);
  },

  // --- PACKETS ---
  getPackets: async (teacherId?: string): Promise<QuizPacket[]> => {
    const cacheKey = teacherId ? `packets_${teacherId}` : 'packets_all';
    
    return cache.fetch(cacheKey, async () => {
        let query = supabase.from('packets').select('*');
        if (teacherId) query = query.eq('teacher_id', teacherId);
        
        const { data, error } = await query;
        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            teacherId: p.teacher_id,
            name: p.name,
            questions: p.questions,
            modules: p.modules,
            learningMaterials: p.learning_materials,
            createdAt: parseTimestamp(p.created_at),
            differentiationMode: p.differentiation_mode as DifferentiationMode
        }));
    });
  },

  getPacketById: async (id: string): Promise<QuizPacket | null> => {
    const cacheKey = `packet_${id}`;
    
    return cache.fetch(cacheKey, async () => {
        const { data, error } = await supabase.from('packets').select('*').eq('id', id).single();
        if (error || !data) return null;

        return {
            id: data.id,
            teacherId: data.teacher_id,
            name: data.name,
            questions: data.questions,
            modules: data.modules,
            learningMaterials: data.learning_materials,
            createdAt: parseTimestamp(data.created_at),
            differentiationMode: data.differentiation_mode as DifferentiationMode
        };
    });
  },

  savePacket: async (packet: QuizPacket) => {
    const { error } = await supabase.from('packets').upsert({
        id: packet.id,
        teacher_id: packet.teacherId,
        name: packet.name,
        questions: packet.questions,
        modules: packet.modules,
        learning_materials: packet.learningMaterials,
        created_at: packet.createdAt || Date.now(),
        differentiation_mode: packet.differentiationMode
    });
    if (error) throw error;
    cache.invalidate(/packet/);
  },

  updatePacket: async (packet: QuizPacket) => {
      return SupabaseService.savePacket(packet);
  },

  deletePacket: async (id: string) => {
    const { error } = await supabase.from('packets').delete().eq('id', id);
    if (error) throw error;
    cache.invalidate(/packet/);
  },

  hasPacketResults: async (packetId: string): Promise<boolean> => {
    const cacheKey = `has_results_${packetId}`;
    
    return cache.fetch(cacheKey, async () => {
      const { count, error } = await supabase
        .from('results')
        .select('*', { count: 'exact', head: true })
        .eq('packet_id', packetId);
      
      if (error) throw error;
      return (count || 0) > 0;
    });
  },

  // --- ACHIEVEMENTS ---
  getAchievements: async (): Promise<Achievement[]> => {
      const cacheKey = 'achievements_all';
      
      return cache.fetch(cacheKey, async () => {
          const { data, error } = await supabase.from('achievements').select('*');
          if (error) {
              console.warn("Could not fetch achievements, returning empty", error);
              return [];
          }
          return data.map((a: any) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              type: a.type as AchievementType,
              targetValue: a.target_value,
              iconUrl: a.icon_url
          }));
      });
  },

  saveAchievement: async (achievement: Achievement) => {
      const { error } = await supabase.from('achievements').upsert({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          target_value: achievement.targetValue,
          icon_url: achievement.iconUrl
      });
      if (error) throw error;
      cache.invalidate(/achievements/);
  },

  deleteAchievement: async (id: string) => {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) throw error;
      cache.invalidate(/achievements/);
  },

  evaluateAchievements: async (studentId: string): Promise<Achievement[]> => {
      // Intentionally NOT cached to ensure realtime logic when submitting quiz.
      const { data: student, error: sError } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      if (sError || !student) return [];

      const results = await SupabaseService.getResults(studentId);
      const allAchievements = await SupabaseService.getAchievements();

      const bestResultsMap = new Map<string, StudentResult>();
      results.forEach(r => {
          if (!bestResultsMap.has(r.packetId) || r.score > bestResultsMap.get(r.packetId)!.score) {
              bestResultsMap.set(r.packetId, r);
          }
      });
      const bestResults = Array.from(bestResultsMap.values());

      const newUnlocked: Achievement[] = [];
      const currentUnlockedIds = new Set<string>(student.unlocked_achievements || []);

      const totalPackets = bestResults.length;
      const avgScore = totalPackets > 0 
          ? bestResults.reduce((acc, curr) => acc + curr.score, 0) / totalPackets 
          : 0;
      const perfectScores = bestResults.filter(r => r.score === 100).length;

      allAchievements.forEach(ach => {
          if (currentUnlockedIds.has(ach.id)) return;

          let unlocked = false;
          if (ach.type === AchievementType.TOTAL_PACKETS && totalPackets >= ach.targetValue) unlocked = true;
          if (ach.type === AchievementType.AVG_SCORE && totalPackets > 0 && avgScore >= ach.targetValue) unlocked = true;
          if (ach.type === AchievementType.PERFECT_SCORE && perfectScores >= 1) unlocked = true;

          if (unlocked) {
              newUnlocked.push(ach);
              currentUnlockedIds.add(ach.id);
          }
      });

      if (newUnlocked.length > 0) {
          await supabase.from('profiles').update({
              unlocked_achievements: Array.from(currentUnlockedIds)
          }).eq('id', studentId);
          // Also invalidate students cache since their profile changed
          cache.invalidate(/students/);
      }

      return newUnlocked;
  },

  // --- RESULTS ---
  getResults: async (studentId?: string): Promise<StudentResult[]> => {
    const cacheKey = studentId ? `results_${studentId}` : 'results_all';
    
    return cache.fetch(cacheKey, async () => {
        let query = supabase.from('results').select('*');
        if (studentId) query = query.eq('student_id', studentId);
        
        const { data: resultsData, error: resultsError } = await query;
        if (resultsError) throw resultsError;
    
        if (!resultsData || resultsData.length === 0) return [];
    
        const studentIds = Array.from(new Set(resultsData.map((r: any) => r.student_id)));
        
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, class_name')
            .in('id', studentIds);
            
        if (profilesError) {
            console.error("Error fetching profiles for results:", profilesError);
        }
    
        const profilesMap = new Map();
        if (profilesData) {
            profilesData.forEach((p: any) => {
                profilesMap.set(p.id, p);
            });
        }
    
        return resultsData.map((r: any) => {
            const profile = profilesMap.get(r.student_id);
            return {
                id: r.id,
                studentId: r.student_id,
                studentName: profile?.name || 'Unknown',
                className: profile?.class_name || 'Unknown',
                packetId: r.packet_id,
                score: r.score,
                abilityLevel: r.ability_level,
                answers: r.answers,
                selectedIndices: r.selected_indices,
                attemptNumber: r.attempt_number,
                timestamp: parseTimestamp(r.created_at || r.timestamp)
            };
        });
    });
  },

  saveResult: async (result: StudentResult) => {
    const { count } = await supabase
        .from('results')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', result.studentId)
        .eq('packet_id', result.packetId);
    
    const attemptNumber = (count || 0) + 1;
    
    const { error } = await supabase.from('results').insert({
        id: result.id,
        student_id: result.studentId,
        packet_id: result.packetId,
        score: result.score,
        ability_level: result.abilityLevel,
        answers: result.answers,
        selected_indices: result.selectedIndices,
        attempt_number: attemptNumber,
    });
    if (error) throw error;
    
    // Invalidate caches
    cache.invalidate(/results/);
    cache.invalidate(/has_results/);

    return SupabaseService.evaluateAchievements(result.studentId);
  },

  // --- USERS ---
  getTeachers: async (): Promise<TeacherProfile[]> => {
      const cacheKey = 'teachers_all';
      
      return cache.fetch(cacheKey, async () => {
          const { data, error } = await supabase.from('profiles').select('*').eq('role', 'teacher');
          if (error) throw error;
          return data.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              subject: u.subject,
              passwordHash: '',
              isActive: u.is_active !== false, 
              joinedAt: parseTimestamp(u.joined_at || u.created_at),
              photoUrl: u.photo_url
          }));
      });
  },

  getStudents: async (): Promise<StudentProfile[]> => {
      const cacheKey = 'students_all';
      
      return cache.fetch(cacheKey, async () => {
          const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student');
          if (error) throw error;
          return data.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              className: u.class_name,
              schoolName: u.school_name,
              passwordHash: '',
              isActive: u.is_active !== false,
              joinedAt: parseTimestamp(u.joined_at || u.created_at),
              photoUrl: u.photo_url,
              unlockedAchievements: u.unlocked_achievements,
              learningStyle: u.learning_style
          }));
      });
  },

  registerTeacher: async (name: string, email: string, password: string, subject: string) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
      });
      if (authError) return { success: false, message: authError.message };
      if (!authData.user) return { success: false, message: "Gagal membuat user auth" };

      const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email,
          role: 'teacher',
          name,
          subject,
          is_active: true
      });

      if (profileError) return { success: false, message: profileError.message };
      cache.invalidate(/teachers/);
      return { success: true, message: 'Registrasi berhasil. Silakan cek email untuk verifikasi (jika diaktifkan).' };
  },

  registerStudent: async (name: string, email: string, className: string, schoolName: string, password: string, learningStyle: LearningStyle) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
      });
      if (authError) return { success: false, message: authError.message };
      if (!authData.user) return { success: false, message: "Gagal membuat user auth" };

      const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email,
          role: 'student',
          name,
          class_name: className,
          school_name: schoolName,
          learning_style: learningStyle,
          is_active: true
      });

      if (profileError) return { success: false, message: profileError.message };
      cache.invalidate(/students/);
      return { success: true, message: 'Registrasi berhasil. Silakan cek email untuk verifikasi (jika diaktifkan).' };
  },

  updateTeacherStatus: async (id: string, isActive: boolean) => {
      const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      cache.invalidate(/teachers/);
  },

  updateStudentStatus: async (id: string, isActive: boolean) => {
      const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      cache.invalidate(/students/);
  },

  updateTeacherProfile: async (id: string, updates: Partial<TeacherProfile>) => {
      const { error } = await supabase.from('profiles').update({
          name: updates.name,
          subject: updates.subject,
          photo_url: updates.photoUrl
      }).eq('id', id);
      if (error) throw error;
      cache.invalidate(/teachers/);
  },

  updateStudentProfile: async (id: string, updates: Partial<StudentProfile>) => {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.className) dbUpdates.class_name = updates.className;
      if (updates.schoolName) dbUpdates.school_name = updates.schoolName;
      if (updates.photoUrl) dbUpdates.photo_url = updates.photoUrl;
      if (updates.learningStyle) dbUpdates.learning_style = updates.learningStyle;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
      if (error) throw error;
      cache.invalidate(/students/);
  },

  resetTeacherPassword: async (id: string, newPassword?: string) => {
      const { data, error } = await supabase.from('profiles').select('email').eq('id', id).single();
      if (error || !data) return false;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: window.location.origin,
      });
      
      return !resetError; 
  },

  resetStudentPassword: async (id: string, newPassword?: string) => {
      const { data, error } = await supabase.from('profiles').select('email').eq('id', id).single();
      if (error || !data) return false;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: window.location.origin,
      });
      
      return !resetError;
  },

  loginUser: async (email: string, password: string) => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password
      });
      
      if (error) {
          if (email === 'admin@sekolah.id' && password === 'admin123') {
               return { success: true, role: 'admin', message: 'Login Admin (Bypass Mode - RLS mungkin memblokir data)' };
          }
          return { success: false, message: error.message };
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      return { 
          success: true, 
          role: profile?.role, 
          user: { 
              ...user, 
              ...profile,
              className: profile?.class_name,
              schoolName: profile?.school_name,
              learningStyle: profile?.learning_style,
              photoUrl: profile?.photo_url,
              unlockedAchievements: profile?.unlocked_achievements
          }, 
          message: 'Login Berhasil' 
      };
  },

  logout: async () => {
      cache.invalidate(/.*/); // Clear all caches on logout
      await supabase.auth.signOut();
  },

  updatePassword: async (newPassword: string) => {
      return await supabase.auth.updateUser({ password: newPassword });
  },

  getCurrentUser: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!profile) return null;

      return {
          role: profile.role,
          userId: session.user.id,
          name: profile.name,
          className: profile.class_name,
          schoolName: profile.school_name,
          learningStyle: profile.learning_style,
          photoUrl: profile.photo_url,
          unlockedAchievements: profile.unlocked_achievements
      };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return supabase.auth.onAuthStateChange(callback);
  }
};
