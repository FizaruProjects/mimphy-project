import { useQuery } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabaseService';
import { StudentResult } from '@/types';

/**
 * Aggregated statistics for a specific student.
 */
export interface StudentStats {
    totalPackets: number;
    avgScore: number;
    unlockedAchievementsCount: number;
    availablePacketsCount: number;
}

/**
 * Custom hook to fetch and aggregate student dashboard statistics using React Query.
 * 
 * @param studentId - The ID of the student to fetch stats for.
 * @returns A standard useQuery result containing the aggregated StudentStats.
 */
export const useStudentStats = (studentId: string | undefined) => {
    return useQuery<StudentStats, Error>({
        queryKey: ['studentStats', studentId],
        queryFn: async () => {
            if (!studentId) throw new Error("Student ID is required");

            const [allResults, students, packets] = await Promise.all([
                SupabaseService.getResults(),
                SupabaseService.getStudents(),
                SupabaseService.getPackets()
            ]);

            // 1. Calculate Results & Averages
            const myResultsFiltered = allResults.filter(r => r.studentId === studentId);
            const bestResultsMap = new Map<string, StudentResult>();
            myResultsFiltered.forEach(r => {
                const existing = bestResultsMap.get(r.packetId);
                if (!existing || r.score > existing.score) {
                    bestResultsMap.set(r.packetId, r);
                }
            });
            
            const bestResults = Array.from(bestResultsMap.values());
            const totalPackets = bestResults.length;
            const avgScore = totalPackets > 0 
                ? Math.round(bestResults.reduce((a, b) => a + b.score, 0) / totalPackets) 
                : 0;

            // 2. Count Unlocked Achievements
            const me = students.find(s => s.id === studentId);
            const unlockedAchievementsCount = me?.unlockedAchievements?.length || 0;

            // 3. Count Available Packets
            const availablePacketsCount = packets.length;

            return {
                totalPackets,
                avgScore,
                unlockedAchievementsCount,
                availablePacketsCount
            };
        },
        enabled: !!studentId, // Only execute if studentId is truthy
    });
};
