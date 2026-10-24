import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Pause } from 'lucide-react';

export function ReducedMotionToggle() {
  const [reduceEffects, setReduceEffects] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('hmcs-reduce-effects');
    if (stored === 'true') {
      setReduceEffects(true);
      document.documentElement.classList.add('reduce-motion');
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && stored === null) {
      setReduceEffects(true);
      document.documentElement.classList.add('reduce-motion');
    }
  }, []);

  const toggleReduceEffects = () => {
    const newValue = !reduceEffects;
    setReduceEffects(newValue);
    localStorage.setItem('hmcs-reduce-effects', String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  return (
    <button
      onClick={toggleReduceEffects}
      className="fixed bottom-6 left-6 z-50 p-3 bg-ink-2/80 backdrop-blur-md border border-line rounded-full text-bone-dim hover:text-bone hover:border-ember transition-all group"
      aria-label={reduceEffects ? 'Enable motion effects' : 'Reduce motion effects'}
      title={reduceEffects ? 'Enable motion effects' : 'Reduce motion effects'}
    >
      {reduceEffects ? (
        <Pause className="w-5 h-5" />
      ) : (
        <Sparkles className="w-5 h-5" />
      )}
      
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-3 py-1.5 bg-ink-2 border border-line rounded text-xs text-bone opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {reduceEffects ? 'Enable effects' : 'Reduce effects'}
      </span>
    </button>
  );
}
