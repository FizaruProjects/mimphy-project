import { useQuery } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabaseService';
import { StudentResult } from '@/types';

/**
 * Custom hook to fetch student results using React Query.
 * 
 * @param studentId - Optional student ID to filter results.
 * @returns An object containing the query status, data, and error.
 */
export const useResults = (studentId?: string) => {
  return useQuery<StudentResult[], Error>({
    queryKey: ['results', studentId || 'all'],
    queryFn: async () => {
      const results = await SupabaseService.getResults(studentId);
      return results;
    },
  });
};
