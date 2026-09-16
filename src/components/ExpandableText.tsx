import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  buttonClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLength = 150,
  className = "",
  buttonClassName = "text-red-600 dark:text-red-400 font-bold hover:underline",
  expandLabel = "baca selengkapnya...",
  collapseLabel = "tampilkan lebih sedikit"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > maxLength;

  if (!isLong) {
    return <span className={className}>{text}</span>;
  }

  const displayText = isExpanded ? text : `${text.slice(0, maxLength).trim()}...`;

  return (
    <span className={className}>
      <span>{displayText}</span>{' '}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={`inline-flex items-center text-xs ml-1 focus:outline-none transition-colors cursor-pointer ${buttonClassName}`}
        type="button"
        aria-expanded={isExpanded}
      >
        <span>{isExpanded ? collapseLabel : expandLabel}</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-0.5 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-0.5 flex-shrink-0" />
        )}
      </button>
    </span>
  );
};
