import { useQuery } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabaseService';
import { QuizPacket } from '@/types';

/**
 * Custom hook to fetch quiz packets using React Query.
 * 
 * @param teacherId - Optional teacher ID. If provided, fetches only packets for that teacher.
 *                    If omitted, fetches all packets (e.g., for Admin).
 * @returns An object containing the query status, data, and error.
 */
export const useQuizPackets = (teacherId?: string) => {
  return useQuery<QuizPacket[], Error>({
    queryKey: ['packets', teacherId || 'all'],
    queryFn: async () => {
      const packets = await SupabaseService.getPackets(teacherId);
      return packets;
    },
    // The query will automatically be cached for 5 minutes (as configured in App.tsx)
  });
};
