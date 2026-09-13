import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { X, Check, AlertCircle, Calculator, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialLatex?: string;
  initialDisplayMode?: boolean;
  onClose: () => void;
  onInsert: (formattedEquation: string, rawLatex: string, isDisplay: boolean) => void;
}

interface SymbolItem {
  display: string;
  latex: string;
  tooltip: string;
}

interface TemplateItem {
  name: string;
  displayLatex: string;
  insertLatex: string;
  tooltip: string;
}

const GREEK_LETTERS: SymbolItem[] = [
  { display: 'α', latex: '\\alpha', tooltip: 'Alpha' },
  { display: 'β', latex: '\\beta', tooltip: 'Beta' },
  { display: 'γ', latex: '\\gamma', tooltip: 'Gamma' },
  { display: 'δ', latex: '\\delta', tooltip: 'Delta (kecil)' },
  { display: 'Δ', latex: '\\Delta', tooltip: 'Delta (besar / Perubahan)' },
  { display: 'ε', latex: '\\epsilon', tooltip: 'Epsilon (Permitivitas)' },
  { display: 'θ', latex: '\\theta', tooltip: 'Theta (Sudut)' },
  { display: 'λ', latex: '\\lambda', tooltip: 'Lambda (Panjang gelombang)' },
  { display: 'μ', latex: '\\mu', tooltip: 'Mu (Mikro / Koefisien gesek)' },
  { display: 'ρ', latex: '\\rho', tooltip: 'Rho (Massa jenis)' },
  { display: 'σ', latex: '\\sigma', tooltip: 'Sigma (Tegangan)' },
  { display: 'φ', latex: '\\phi', tooltip: 'Phi (Fluks)' },
  { display: 'ω', latex: '\\omega', tooltip: 'Omega (Kecepatan sudut)' },
  { display: 'Ω', latex: '\\Omega', tooltip: 'Ohm (Hambatan Listrik)' },
  { display: 'η', latex: '\\eta', tooltip: 'Eta (Efisiensi)' },
  { display: 'π', latex: '\\pi', tooltip: 'Pi' },
  { display: 'τ', latex: '\\tau', tooltip: 'Tau (Torsi)' },
];

const MATH_SYMBOLS: SymbolItem[] = [
  { display: '±', latex: '\\pm', tooltip: 'Plus Minus' },
  { display: '×', latex: '\\times', tooltip: 'Perkalian' },
  { display: '÷', latex: '\\div', tooltip: 'Pembagian' },
  { display: '=', latex: '=', tooltip: 'Sama dengan' },
  { display: '≠', latex: '\\neq', tooltip: 'Tidak sama dengan' },
  { display: '≈', latex: '\\approx', tooltip: 'Mendekati / Aksimasi' },
  { display: '<', latex: '<', tooltip: 'Kurang dari' },
  { display: '>', latex: '>', tooltip: 'Lebih dari' },
  { display: '≤', latex: '\\le', tooltip: 'Kurang dari atau sama dengan' },
  { display: '≥', latex: '\\ge', tooltip: 'Lebih dari atau sama dengan' },
  { display: '∞', latex: '\\infty', tooltip: 'Tak hingga' },
  { display: '∑', latex: '\\sum', tooltip: 'Jumlah / Sigma' },
  { display: '∫', latex: '\\int', tooltip: 'Integral' },
  { display: '∂', latex: '\\partial', tooltip: 'Turunan parsial' },
  { display: '√', latex: '\\sqrt{}', tooltip: 'Akar kuadrat' },
  { display: '°', latex: '^\\circ', tooltip: 'Derajat' },
  { display: '·', latex: '\\cdot', tooltip: 'Titik kali' },
];

const PHYSICS_SYMBOLS: SymbolItem[] = [
  { display: '→', latex: '\\rightarrow', tooltip: 'Arah panah' },
  { display: '⃗v', latex: '\\vec{v}', tooltip: 'Vektor' },
  { display: 'Δt', latex: '\\Delta t', tooltip: 'Selang waktu' },
  { display: 'ρ', latex: '\\rho', tooltip: 'Massa jenis' },
  { display: 'λ', latex: '\\lambda', tooltip: 'Panjang gelombang' },
  { display: 'μ_s', latex: '\\mu_s', tooltip: 'Koefisien gesek statis' },
  { display: 'μ_k', latex: '\\mu_k', tooltip: 'Koefisien gesek kinetis' },
  { display: 'η', latex: '\\eta', tooltip: 'Efisiensi mesin' },
  { display: 'θ', latex: '\\theta', tooltip: 'Sudut deviasi / elevasi' },
  { display: 'ω', latex: '\\omega', tooltip: 'Frekuensi sudut' },
  { display: 'ħ', latex: '\\hbar', tooltip: 'Konstanta Planck tereduksi' },
];

const TEMPLATES: TemplateItem[] = [
  { name: 'Pecahan', displayLatex: '\\frac{a}{b}', insertLatex: '\\frac{a}{b}', tooltip: 'Pecahan / Fraction' },
  { name: 'Akar', displayLatex: '\\sqrt{x}', insertLatex: '\\sqrt{x}', tooltip: 'Akar kuadrat' },
  { name: 'Pangkat', displayLatex: 'x^2', insertLatex: 'x^{2}', tooltip: 'Eksponen / Pangkat' },
  { name: 'Subscript', displayLatex: 'x_1', insertLatex: 'x_{1}', tooltip: 'Indeks / Subscript' },
  { name: 'Pangkat+Sub', displayLatex: 'x_1^2', insertLatex: 'x_{1}^{2}', tooltip: 'Indeks & Pangkat' },
  { name: 'Pecahan Vektor', displayLatex: '\\frac{v^2}{2}', insertLatex: '\\frac{v^2}{2}', tooltip: 'Rumus pecahan kuadrat' },
  { name: 'Integral', displayLatex: '\\int_0^t f(x)\\,dx', insertLatex: '\\int_{0}^{t} f(x)\\,dx', tooltip: 'Integral tentu' },
  { name: 'Sigma', displayLatex: '\\sum_{i=1}^{n} x_i', insertLatex: '\\sum_{i=1}^{n} x_{i}', tooltip: 'Penjumlahan seri' },
  { name: 'Vektor', displayLatex: '\\vec{v}', insertLatex: '\\vec{v}', tooltip: 'Notasi vektor' },
  { name: 'Greek Symbol', displayLatex: '\\delta', insertLatex: '\\delta', tooltip: 'Simbol Delta' },
];

export const MathEquationModal: React.FC<Props> = ({
  isOpen,
  initialLatex = '',
  initialDisplayMode = false,
  onClose,
  onInsert,
}) => {
  const [latex, setLatex] = useState(initialLatex);
  const [isDisplayMode, setIsDisplayMode] = useState(initialDisplayMode);
  const [activeTab, setActiveTab] = useState<'templates' | 'greek' | 'math' | 'physics'>('templates');
  const [previewHtml, setPreviewHtml] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLatex(initialLatex);
    setIsDisplayMode(initialDisplayMode);
  }, [initialLatex, initialDisplayMode, isOpen]);

  // Live KaTeX rendering update
  useEffect(() => {
    if (!latex.trim()) {
      setPreviewHtml('<span class="text-stone-400 dark:text-slate-500 italic">Preview persamaan akan tampil di sini...</span>');
      setHasError(false);
      setErrorMessage('');
      return;
    }

    try {
      const renderedHtml = katex.renderToString(latex, {
        displayMode: isDisplayMode,
        throwOnError: true,
      });
      setPreviewHtml(renderedHtml);
      setHasError(false);
      setErrorMessage('');
    } catch (err: any) {
      // Fallback preview with throwOnError: false for partial rendering
      try {
        const fallbackHtml = katex.renderToString(latex, {
          displayMode: isDisplayMode,
          throwOnError: false,
        });
        setPreviewHtml(fallbackHtml);
      } catch {
        setPreviewHtml('');
      }
      setHasError(true);
      setErrorMessage('Equation tidak valid. Periksa sintaks LaTeX.');
    }
  }, [latex, isDisplayMode]);

  if (!isOpen) return null;

  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLatex(prev => prev + textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = latex.substring(0, start) + textToInsert + latex.substring(end);
    setLatex(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsert = () => {
    const trimmed = latex.trim();
    if (!trimmed) {
      alert('Masukkan sintaks persamaan terlebih dahulu.');
      return;
    }

    const formatted = isDisplayMode ? `\n$$\n${trimmed}\n$$\n` : `$${trimmed}$`;
    onInsert(formatted, trimmed, isDisplayMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-slate-700 flex items-center justify-between bg-stone-50 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Editor Persamaan (Math / KaTeX)</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">Pilih simbol atau ketik sintaks LaTeX secara langsung</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Mode Selector */}
          <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-stone-700 dark:text-slate-300 flex items-center">
              <Info className="w-4 h-4 mr-1.5 text-red-500" /> Mode Persamaan:
            </span>
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-stone-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsDisplayMode(false)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  !isDisplayMode
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Inline ($...$)
              </button>
              <button
                type="button"
                onClick={() => setIsDisplayMode(true)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  isDisplayMode
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Display ($$...$$)
              </button>
            </div>
          </div>

          {/* Symbol Palette & Templates Tabs */}
          <div>
            <div className="flex space-x-1 border-b border-stone-200 dark:border-slate-700 mb-3 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === 'templates'
                    ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
                }`}
              >
                Template Rumus
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('greek')}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === 'greek'
                    ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
                }`}
              >
                Huruf Yunani (Greek)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('math')}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === 'math'
                    ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
                }`}
              >
                Simbol Matematika
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('physics')}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === 'physics'
                    ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
                }`}
              >
                Simbol Fisika SMA
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-stone-50 dark:bg-slate-900/60 p-3 rounded-xl border border-stone-200 dark:border-slate-700 min-h-[110px] flex items-center">
              {activeTab === 'templates' && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertTextAtCursor(tmpl.insertLatex)}
                      title={tmpl.tooltip}
                      className="p-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 rounded-lg text-center text-xs font-mono transition-all hover:shadow-sm text-stone-800 dark:text-slate-200 flex flex-col items-center justify-center gap-1 group"
                    >
                      <span className="font-semibold text-stone-700 dark:text-slate-300 text-[11px] group-hover:text-red-600 dark:group-hover:text-red-400">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 font-normal">
                        {tmpl.displayLatex}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'greek' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5 w-full">
                  {GREEK_LETTERS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertTextAtCursor(item.latex)}
                      title={`${item.tooltip} (${item.latex})`}
                      className="p-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 rounded-lg text-center text-sm font-bold text-stone-800 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-105"
                    >
                      {item.display}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'math' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5 w-full">
                  {MATH_SYMBOLS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertTextAtCursor(item.latex)}
                      title={`${item.tooltip} (${item.latex})`}
                      className="p-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 rounded-lg text-center text-sm font-bold text-stone-800 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-105"
                    >
                      {item.display}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'physics' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 w-full">
                  {PHYSICS_SYMBOLS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertTextAtCursor(item.latex)}
                      title={`${item.tooltip} (${item.latex})`}
                      className="p-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 rounded-lg text-center text-xs font-semibold text-stone-800 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-105"
                    >
                      {item.display}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LaTeX Input Box */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">
              Sintaks LaTeX:
            </label>
            <textarea
              ref={textareaRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Contoh: \frac{1}{2} m v^2 atau E_k = \frac{1}{2} m v^2"
              className="w-full p-3 font-mono text-sm border border-stone-300 dark:border-slate-600 rounded-xl bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 min-h-[90px] resize-y"
            />
          </div>

          {/* Error Banner */}
          {hasError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Preview Box */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1">
              Preview KaTeX (Live):
            </label>
            <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-700 min-h-[70px] flex items-center justify-center overflow-x-auto text-stone-800 dark:text-white">
              <div 
                className="katex-preview text-lg"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-200 dark:shadow-none flex items-center transition-colors"
          >
            <Check className="w-4 h-4 mr-1.5" />
            {initialLatex ? 'Perbarui Equation' : 'Sisipkan Equation'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MathEquationModal;
