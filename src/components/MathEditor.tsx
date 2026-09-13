import React, { useState, useRef } from 'react';
import { Calculator, Edit2, Sparkles } from 'lucide-react';
import MathEquationModal from './MathEquationModal';
import MathRenderer from './MathRenderer';

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  isSingleLine?: boolean;
  rows?: number;
  className?: string;
  showPreview?: boolean;
  required?: boolean;
  rightAction?: React.ReactNode; // e.g. "Buat dengan AI" button
}

export const MathEditor: React.FC<Props> = ({
  value,
  onChange,
  label,
  placeholder = 'Tulis teks atau persamaan...',
  isSingleLine = false,
  rows = 3,
  className = '',
  showPreview = true,
  required = false,
  rightAction,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLatex, setEditingLatex] = useState('');
  const [editingDisplayMode, setEditingDisplayMode] = useState(false);
  const [editingRange, setEditingRange] = useState<{ start: number; end: number } | null>(null);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Helper to open modal for new equation at cursor position
  const handleOpenNewEquationModal = () => {
    setEditingLatex('');
    setEditingDisplayMode(false);
    setEditingRange(null);
    setIsModalOpen(true);
  };

  // Helper to detect existing equation under cursor/selection and edit it
  const handleOpenEditEquationModal = () => {
    const el = inputRef.current;
    if (!el) {
      handleOpenNewEquationModal();
      return;
    }

    const cursorPos = el.selectionStart || 0;
    const text = value;

    // Search for surrounding $$ ... $$ or $ ... $
    let matchFound = false;

    // 1. Try display math block $$ ... $$
    const displayRegex = /\$\$([\s\S]*?)\$\$/g;
    let match;
    while ((match = displayRegex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (cursorPos >= start && cursorPos <= end) {
        setEditingLatex(match[1].trim());
        setEditingDisplayMode(true);
        setEditingRange({ start, end });
        matchFound = true;
        break;
      }
    }

    // 2. Try inline math $ ... $ if no display math found
    if (!matchFound) {
      const inlineRegex = /\$([^$\n]+)\$/g;
      while ((match = inlineRegex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (cursorPos >= start && cursorPos <= end) {
          setEditingLatex(match[1].trim());
          setEditingDisplayMode(false);
          setEditingRange({ start, end });
          matchFound = true;
          break;
        }
      }
    }

    if (!matchFound) {
      // If cursor wasn't inside any equation, check if there's any equation at all
      const anyMathMatch = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/.exec(text);
      if (anyMathMatch) {
        const isDisp = anyMathMatch[0].startsWith('$$');
        const content = isDisp ? anyMathMatch[1] : anyMathMatch[2];
        const start = anyMathMatch.index;
        const end = start + anyMathMatch[0].length;
        setEditingLatex((content || '').trim());
        setEditingDisplayMode(isDisp);
        setEditingRange({ start, end });
      } else {
        setEditingLatex('');
        setEditingDisplayMode(false);
        setEditingRange(null);
      }
    }

    setIsModalOpen(true);
  };

  // Called when equation modal confirms insert/update
  const handleInsertEquation = (formattedEquation: string) => {
    const el = inputRef.current;
    
    if (editingRange !== null) {
      // Replace existing equation in text
      const newText = value.substring(0, editingRange.start) + formattedEquation + value.substring(editingRange.end);
      onChange(newText);
      setEditingRange(null);
      return;
    }

    if (!el) {
      onChange(value + (value ? ' ' : '') + formattedEquation);
      return;
    }

    const start = el.selectionStart || value.length;
    const end = el.selectionEnd || value.length;
    const newText = value.substring(0, start) + formattedEquation + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursor = start + formattedEquation.length;
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const hasMathInValue = value.includes('$');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Toolbar Row */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="flex items-center space-x-2 ml-auto">
          {rightAction}
          
          {hasMathInValue && (
            <button
              type="button"
              onClick={handleOpenEditEquationModal}
              title="Edit equation under cursor / in text"
              className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-md flex items-center hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit Equation
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenNewEquationModal}
            title="Tambah atau sisipkan persamaan KaTeX"
            className="text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-md flex items-center font-bold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 mr-1" />
            + Equation
          </button>
        </div>
      </div>

      {/* Input / Textarea Field */}
      <div className="relative">
        {isSingleLine ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full p-2.5 border rounded-xl text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 font-sans transition-all"
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full p-2.5 border rounded-xl text-sm bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-red-400 font-sans transition-all resize-y min-h-[70px]"
          />
        )}
      </div>

      {/* Live Preview Box */}
      {showPreview && value.trim() && (
        <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-stone-200 dark:border-slate-700 shadow-inner space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider">
            <span className="flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-amber-500" /> Live Preview:
            </span>
          </div>
          <div className="text-sm text-stone-800 dark:text-slate-200">
            <MathRenderer content={value} />
          </div>
        </div>
      )}

      {/* Equation Builder Modal */}
      <MathEquationModal
        isOpen={isModalOpen}
        initialLatex={editingLatex}
        initialDisplayMode={editingDisplayMode}
        onClose={() => setIsModalOpen(false)}
        onInsert={(formattedEquation) => handleInsertEquation(formattedEquation)}
      />
    </div>
  );
};

export default MathEditor;
