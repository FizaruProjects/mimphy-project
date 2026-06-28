import React, { useState, useMemo } from 'react';

interface Props {
  data: { date: string; count: number }[];
  title?: string;
  colorClass?: string; // e.g., 'bg-green-500'
}

export const ContributionGraph: React.FC<Props> = React.memo(({ data, title = "Aktivitas", colorClass = "bg-green-500" }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 1. Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    data.forEach(d => years.add(new Date(d.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  // 2. Map data for O(1) lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      const dateKey = new Date(d.date).toISOString().split('T')[0];
      map.set(dateKey, (map.get(dateKey) || 0) + d.count);
    });
    return map;
  }, [data]);

  // 3. Generate grid cells for the selected year
  const { gridCells, monthLabels } = useMemo(() => {
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);
    
    const cells: (Date | null)[] = [];
    
    // Calculate start offset (day of week of Jan 1st)
    // 0 = Sunday, ... 6 = Saturday
    const startOffset = startOfYear.getDay(); 
    
    // Fill initial empty slots
    for (let i = 0; i < startOffset; i++) {
        cells.push(null);
    }

    // Fill days
    const curr = new Date(startOfYear);
    while (curr <= endOfYear) {
        cells.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
    }

    // Calculate month label positions
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const labels: { label: string; colIndex: number }[] = [];
    
    let currentMonth = -1;
    cells.forEach((date, index) => {
        if (date) {
            const m = date.getMonth();
            if (m !== currentMonth) {
                const colIndex = Math.floor(index / 7);
                // Only add label if this column doesn't already have one (or it's far enough)
                if (!labels.find(l => l.label === months[m])) {
                     labels.push({ label: months[m], colIndex });
                }
                currentMonth = m;
            }
        }
    });

    return { gridCells: cells, monthLabels: labels };
  }, [selectedYear]);

  // Helper to get color intensity
  const getColor = (count: number) => {
    if (count === 0) return 'bg-stone-100 dark:bg-slate-700/50';
    if (count <= 2) return `${colorClass} opacity-40`;
    if (count <= 5) return `${colorClass} opacity-60`;
    if (count <= 8) return `${colorClass} opacity-80`;
    return `${colorClass} opacity-100`;
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-sm w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-stone-800 dark:text-white text-sm">{title}</h3>
          <div className="flex gap-2">
              {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        selectedYear === year 
                        ? 'bg-stone-800 dark:bg-white text-white dark:text-stone-900 font-bold' 
                        : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-600'
                    }`}
                  >
                      {year}
                  </button>
              ))}
          </div>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max">
            {/* Month Labels */}
            <div className="flex text-[10px] text-stone-400 mb-2 relative h-4">
                {monthLabels.map((m, i) => (
                    <div 
                        key={m.label} 
                        style={{ left: `${m.colIndex * 16}px` }} // 12px width + 4px gap = 16px
                        className="absolute"
                    >
                        {m.label}
                    </div>
                ))}
            </div>

            {/* The Grid */}
            <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                {gridCells.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="w-3 h-3" />;

                    const dateStr = date.toISOString().split('T')[0];
                    const count = dataMap.get(dateStr) || 0;

                    return (
                        <div 
                            key={dateStr}
                            className={`w-3 h-3 rounded-sm ${getColor(count)} transition-all hover:scale-125 hover:ring-2 ring-stone-400 dark:ring-slate-500 relative group cursor-pointer`}
                        >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}: {count} Kontribusi
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2 mt-4 text-[10px] text-stone-400 font-medium">
          <span>Less</span>
          <div className="w-3 h-3 bg-stone-100 dark:bg-slate-700/50 rounded-sm"></div>
          <div className={`w-3 h-3 ${colorClass} opacity-40 rounded-sm`}></div>
          <div className={`w-3 h-3 ${colorClass} opacity-60 rounded-sm`}></div>
          <div className={`w-3 h-3 ${colorClass} opacity-80 rounded-sm`}></div>
          <div className={`w-3 h-3 ${colorClass} opacity-100 rounded-sm`}></div>
          <span>More</span>
      </div>
    </div>
  );
});
