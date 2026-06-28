import { useQuery } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabaseService';
import { Question } from '@/types';

/**
 * Custom hook to fetch questions using React Query.
 * 
 * @param teacherId - Optional teacher ID to filter questions by author.
 * @returns An object containing the query status, data, and error.
 */
export const useQuestions = (teacherId?: string) => {
  return useQuery<Question[], Error>({
    queryKey: ['questions', teacherId || 'all'],
    queryFn: async () => {
      const questions = await SupabaseService.getQuestions(teacherId);
      return questions;
    },
  });
};
