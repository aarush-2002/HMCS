import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState('');

  useEffect(() => {
    const jobs = [
      { name: 'type', duration: 200 },
      { name: 'ground', duration: 300 },
      { name: 'hostel', duration: 400 },
      { name: 'lamps', duration: 300 },
      { name: 'trees', duration: 350 },
      { name: 'foreground', duration: 400 },
      { name: 'wordmark', duration: 300 },
      { name: 'mist', duration: 350 },
      { name: 'post', duration: 400 },
    ];

    let elapsed = 0;
    const totalDuration = jobs.reduce((sum, job) => sum + job.duration, 0);

    const runJobs = async () => {
      for (const job of jobs) {
        setCurrentJob(job.name);
        await new Promise(resolve => setTimeout(resolve, job.duration));
        elapsed += job.duration;
        setProgress(Math.round((elapsed / totalDuration) * 100));
      }

      // Fade out
      await new Promise(resolve => setTimeout(resolve, 500));
      onComplete();
    };

    runJobs();
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Brand mark */}
      <div className="mb-8">
        <svg width="64" height="64" viewBox="0 0 64 64" className="text-bone">
          <rect x="4" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="34" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="4" y="34" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="34" y="34" width="26" height="26" fill="var(--ember)" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Hindi text */}
      <div className="text-2xl text-bone-dim mb-12 devanagari" lang="hi">
        आवाज़
      </div>

      {/* Progress bar */}
      <div className="w-64 mb-4">
        <div className="h-px bg-line overflow-hidden">
          <motion.div
            className="h-full bg-ember"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="text-sm text-bone-dim">
        <span className="capitalize">{currentJob}</span>
        <span className="mx-2">·</span>
        <span className="tabular">{progress}%</span>
      </div>

      {/* Tagline */}
      <div className="mt-8 text-xs text-muted uppercase tracking-wider">
        Switching on the lights
      </div>
    </motion.div>
  );
}
