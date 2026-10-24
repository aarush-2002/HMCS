import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const chapters = [
  { id: 'hero', label: 'Hero' },
  { id: 'chapter-01', label: 'Report' },
  { id: 'chapter-02', label: 'Support' },
  { id: 'chapter-03', label: 'Resolve' },
  { id: 'chapter-04', label: 'Daybreak' },
];

export function SideRail() {
  const [activeChapter, setActiveChapter] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 2;

      for (const chapter of chapters) {
        const element = document.getElementById(chapter.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          const bottom = top + rect.height;

          if (scrollY >= top && scrollY < bottom) {
            setActiveChapter(chapter.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapter = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
      {chapters.map(chapter => (
        <button
          key={chapter.id}
          onClick={() => scrollToChapter(chapter.id)}
          className="group relative flex items-center"
          aria-label={`Go to ${chapter.label}`}
        >
          <motion.div
            className={`w-2 h-2 rounded-full transition-all ${
              activeChapter === chapter.id
                ? 'bg-ember scale-150'
                : 'bg-line hover:bg-bone-dim'
            }`}
            whileHover={{ scale: 1.5 }}
          />
          <span className="absolute right-6 text-xs text-bone-dim opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {chapter.label}
          </span>
        </button>
      ))}
    </div>
  );
}
