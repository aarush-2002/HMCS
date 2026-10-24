import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const stages = [
  {
    id: 'hero',
    elements: [
      { type: 'bougainvillea', position: 'bottom-left', scale: 1.2 },
      { type: 'neem-branch', position: 'top-right', scale: 0.8 },
    ],
  },
  {
    id: 'chapter-01',
    elements: [
      { type: 'bicycle', position: 'bottom-right', scale: 1.0 },
      { type: 'potted-plants', position: 'bottom-left', scale: 0.9 },
    ],
  },
  {
    id: 'chapter-02',
    elements: [
      { type: 'laundry-line', position: 'top-left', scale: 1.1 },
      { type: 'jaali-wall', position: 'bottom-right', scale: 1.0 },
    ],
  },
  {
    id: 'chapter-03',
    elements: [
      { type: 'neem-branch', position: 'top-left', scale: 0.9 },
      { type: 'potted-plants', position: 'bottom-right', scale: 1.1 },
    ],
  },
  {
    id: 'chapter-04',
    elements: [
      { type: 'bougainvillea', position: 'bottom-right', scale: 1.0 },
      { type: 'bicycle', position: 'bottom-left', scale: 0.8 },
    ],
  },
];

interface ForegroundElementProps {
  type: string;
  position: string;
  scale: number;
}

function ForegroundElement({ type, position, scale }: ForegroundElementProps) {
  const positionClasses: Record<string, string> = {
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
  };

  // Placeholder SVG shapes for foreground elements
  const renderElement = () => {
    switch (type) {
      case 'bougainvillea':
        return (
          <svg width="300" height="400" viewBox="0 0 300 400" className="text-pink-400/30">
            <circle cx="150" cy="200" r="120" fill="currentColor" />
            <circle cx="100" cy="150" r="80" fill="currentColor" />
            <circle cx="200" cy="180" r="90" fill="currentColor" />
          </svg>
        );
      case 'neem-branch':
        return (
          <svg width="400" height="200" viewBox="0 0 400 200" className="text-green-600/20">
            <path d="M 0 100 Q 100 50, 200 100 T 400 100" stroke="currentColor" strokeWidth="8" fill="none" />
            <ellipse cx="100" cy="80" rx="30" ry="50" fill="currentColor" />
            <ellipse cx="200" cy="90" rx="35" ry="55" fill="currentColor" />
            <ellipse cx="300" cy="85" rx="32" ry="52" fill="currentColor" />
          </svg>
        );
      case 'bicycle':
        return (
          <svg width="250" height="200" viewBox="0 0 250 200" className="text-bone-dim/30">
            <circle cx="60" cy="140" r="50" stroke="currentColor" strokeWidth="4" fill="none" />
            <circle cx="190" cy="140" r="50" stroke="currentColor" strokeWidth="4" fill="none" />
            <path d="M 60 140 L 125 80 L 190 140 M 125 80 L 125 50 L 140 50" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        );
      case 'potted-plants':
        return (
          <svg width="200" height="250" viewBox="0 0 200 250" className="text-green-700/25">
            <rect x="60" y="180" width="80" height="60" fill="currentColor" />
            <ellipse cx="100" cy="150" rx="60" ry="80" fill="currentColor" />
            <ellipse cx="80" cy="130" rx="40" ry="60" fill="currentColor" />
            <ellipse cx="120" cy="140" rx="45" ry="65" fill="currentColor" />
          </svg>
        );
      case 'laundry-line':
        return (
          <svg width="400" height="150" viewBox="0 0 400 150" className="text-bone-dim/20">
            <line x1="0" y1="50" x2="400" y2="50" stroke="currentColor" strokeWidth="2" />
            <rect x="50" y="60" width="40" height="60" fill="currentColor" />
            <rect x="120" y="65" width="45" height="55" fill="currentColor" />
            <rect x="200" y="60" width="50" height="60" fill="currentColor" />
            <rect x="280" y="65" width="40" height="55" fill="currentColor" />
          </svg>
        );
      case 'jaali-wall':
        return (
          <svg width="300" height="300" viewBox="0 0 300 300" className="text-bone-dim/15">
            <pattern id="jaali" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="8" fill="currentColor" />
            </pattern>
            <rect width="300" height="300" fill="url(#jaali)" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} pointer-events-none`}
      style={{ transform: `scale(${scale})` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      {renderElement()}
    </motion.div>
  );
}

export function ForegroundStages() {
  const [activeStage, setActiveStage] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 2;

      for (const stage of stages) {
        const element = document.getElementById(stage.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          const bottom = top + rect.height;

          if (scrollY >= top && scrollY < bottom) {
            setActiveStage(stage.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentStage = stages.find(s => s.id === activeStage);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-x-clip">
      <AnimatePresence mode="wait">
        {currentStage && (
          <motion.div
            key={currentStage.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentStage.elements.map((element, idx) => (
              <ForegroundElement
                key={`${currentStage.id}-${idx}`}
                type={element.type}
                position={element.position}
                scale={element.scale}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
