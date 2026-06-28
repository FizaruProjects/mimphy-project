import { useQuery } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabaseService';
import { TeacherProfile } from '@/types';

/**
 * Custom hook to fetch teachers using React Query.
 */
export const useTeachers = () => {
  return useQuery<TeacherProfile[], Error>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const teachers = await SupabaseService.getTeachers();
      return teachers;
    },
  });
};
