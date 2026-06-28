import { useQuery } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabaseService';
import { StudentProfile } from '@/types';

/**
 * Custom hook to fetch students using React Query.
 */
export const useStudents = () => {
  return useQuery<StudentProfile[], Error>({
    queryKey: ['students'],
    queryFn: async () => {
      const students = await SupabaseService.getStudents();
      return students;
    },
  });
};
