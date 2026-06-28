import React, { useEffect, useState, useRef } from 'react';

/**
 * Props for the AnimatedCounter component.
 */
export interface AnimatedCounterProps {
  /**
   * The target numeric value to animate to.
   */
  value: number;
  
  /**
   * The duration of the animation in milliseconds.
   * @default 1000
   */
  duration?: number;
  
  /**
   * Optional CSS class name for styling the counter.
   */
  className?: string;
}

/**
 * A lightweight, performant animated counter component that transitions
 * smoothly from 0 to the target `value` using `requestAnimationFrame`.
 * 
 * @example
 * <AnimatedCounter value={150} duration={1200} className="text-2xl font-bold" />
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 1000, 
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimestampRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  
  useEffect(() => {
    // If the value hasn't changed from the current display value, do nothing.
    if (value === displayValue) return;
    
    startValueRef.current = displayValue;
    startTimestampRef.current = null;
    
    let animationFrameId: number;
    
    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const step = (timestamp: number) => {
      if (!startTimestampRef.current) {
        startTimestampRef.current = timestamp;
      }
      
      const progress = Math.min((timestamp - startTimestampRef.current) / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      const currentVal = Math.round(startValueRef.current + (value - startValueRef.current) * easedProgress);
      
      setDisplayValue(currentVal);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        // Ensure final value is exactly the target
        setDisplayValue(value);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};
