
import XLSX from 'xlsx-js-style';
import { QuizPacket, StudentResult, Question } from '@/types';

export const ExportService = {
  /**
   * Mengunduh data hasil kuis ke dalam format Excel (.xlsx)
   * Terdiri dari 3 Sheet: Rekap Nilai, Rincian Jawaban Per Siswa, Data Mentah Horizontal
   */
  downloadExcel: (packet: QuizPacket, results: StudentResult[], startDate: number | null, endDate: number | null) => {
    
    // Filter results berdasarkan tanggal (jika ada)
    const filteredResults = results.filter(r => {
        const time = r.timestamp;
        const start = startDate ? startDate : 0;
        const end = endDate ? endDate : Date.now();
        return time >= start && time <= end;
    });

    if (filteredResults.length === 0) {
        alert("Tidak ada data hasil siswa pada rentang waktu yang dipilih.");
        return;
    }

    const wb = XLSX.utils.book_new();

    // Helper: Convert index to Char
    const indexToChar = (idx: number) => {
        if (idx < 0) return 'KS'; // Kosong
        return String.fromCharCode(65 + idx); // 0->A, 1->B...
    };

    // --- SHEET 1: REKAP NILAI SISWA ---
    // Kolom: No, Nama, Kelas, Jumlah Benar, Jumlah Salah, Total Skor, Nilai Akhir
    const rekapData = filteredResults.map((r, idx) => {
        const correctCount = r.answers.filter(Boolean).length;
        const wrongCount = r.answers.length - correctCount;
        
        return {
            'No': idx + 1,
            'Nama Siswa': r.studentName,
            'Kelas': r.className,
            'Jumlah Benar': correctCount,
            'Jumlah Salah': wrongCount,
            'Total Skor': r.score, // Asumsi 0-100
            'Nilai Akhir': r.score, // Sama dengan skor jika tidak ada pembobotan
            'Level': r.abilityLevel,
            'Tanggal': new Date(r.timestamp).toLocaleDateString('id-ID'),
        };
    });

    const wsRekap = XLSX.utils.json_to_sheet(rekapData);
    wsRekap['!cols'] = [{wch: 5}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Nilai");


    // --- SHEET 2: RINCIAN JAWABAN PER SISWA (DETAIL) ---
    // Format: Nama | S1 Jwb | S1 Kunci | S1 Status | S2 Jwb | ...
    const detailData: any[] = [];
    
    filteredResults.forEach(res => {
        const row: any = {
            'Nama Siswa': res.studentName,
            'Kelas': res.className
        };

        packet.questions.forEach((q, idx) => {
            const studentAnsIdx = res.selectedIndices ? res.selectedIndices[idx] : -1;
            const keyIdx = q.correctIndex;
            const isCorrect = studentAnsIdx === keyIdx;

            const qNum = idx + 1;
            row[`S${qNum} Jawaban`] = indexToChar(studentAnsIdx);
            row[`S${qNum} Kunci`] = indexToChar(keyIdx);
            row[`S${qNum} Status`] = isCorrect ? 1 : 0;
        });
        detailData.push(row);
    });

    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, wsDetail, "Rincian Jawaban");


    // --- SHEET 3: DATA MENTAH HORIZONTAL (WITH HIGHLIGHT) ---
    // Baris = Siswa, Kolom = S1, S2, S3... Isi = A/B/C...
    const rawData: any[] = [];
    
    filteredResults.forEach(res => {
        const row: any = {
            'Nama Siswa': res.studentName,
        };

        packet.questions.forEach((q, idx) => {
            const studentAnsIdx = res.selectedIndices ? res.selectedIndices[idx] : -1;
            row[`S${idx + 1}`] = indexToChar(studentAnsIdx);
        });
        rawData.push(row);
    });

    // Enforce Header Order to ensure S1, S2, S3... are in correct sequence
    const headers = ['Nama Siswa', ...packet.questions.map((_, i) => `S${i + 1}`)];
    const wsRaw = XLSX.utils.json_to_sheet(rawData, { header: headers });

    // Apply Styles
    const range = XLSX.utils.decode_range(wsRaw['!ref'] || "A1:A1");
    
    // Iterate over rows (skipping header row 0)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Iterate over columns (skipping 'Nama Siswa' column 0)
        for (let C = range.s.c + 1; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
            const cell = wsRaw[cellAddress];
            
            if (cell && cell.v) {
                // Determine question index based on column index
                // Column 0 is Name, so Column 1 is Q1 (index 0)
                const qIndex = C - 1;
                
                if (qIndex < packet.questions.length) {
                    const question = packet.questions[qIndex];
                    const correctChar = indexToChar(question.correctIndex);
                    const studentChar = cell.v.toString();

                    if (studentChar === correctChar) {
                        // Correct: Green
                        cell.s = {
                            fill: { fgColor: { rgb: "C6EFCE" } },
                            font: { color: { rgb: "006100" } }
                        };
                    } else {
                        // Incorrect: Red
                        cell.s = {
                            fill: { fgColor: { rgb: "FFC7CE" } },
                            font: { color: { rgb: "9C0006" } }
                        };
                    }
                }
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, wsRaw, "Data Mentah Horizontal");

    // --- DOWNLOAD ---
    const fileName = `Analisis_Fisika_${packet.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
};
