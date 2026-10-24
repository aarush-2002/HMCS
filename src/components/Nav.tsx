import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { label: 'Report', hindi: 'शिकायत', href: '#chapter-01' },
    { label: 'Support', hindi: 'समर्थन', href: '#chapter-02' },
    { label: 'Resolve', hindi: 'समाधान', href: '#chapter-03' },
    { label: 'Daybreak', hindi: 'जवाबदेही', href: '#chapter-04' },
  ];

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-ink/80 backdrop-blur-md' : 'bg-transparent'
        } ${hidden && !mobileOpen ? '-translate-y-full' : 'translate-y-0'}`}
        style={{ height: 'var(--nav-h)' }}
      >
        <div className="max-w-[1400px] mx-auto px-[var(--pad)] h-full flex items-center justify-between">
          {/* Brand */}
          <a href="#" className="flex items-center gap-3 group">
            <svg width="32" height="32" viewBox="0 0 64 64" className="text-bone group-hover:text-ember transition-colors">
              <rect x="4" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="34" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="4" y="34" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="34" y="34" width="26" height="26" fill="var(--ember)" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div>
              <div className="text-lg font-medium text-bone">HMCS</div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Hostel Complaint System</div>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="group relative text-sm text-bone-dim hover:text-bone transition-colors"
              >
                <span>{link.label}</span>
                <span className="absolute left-0 top-full text-[10px] text-ember devanagari opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" lang="hi">
                  {link.hindi}
                </span>
              </a>
            ))}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-bone transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-bone transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-bone transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-ink md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ paddingTop: 'var(--nav-h)' }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl text-bone hover:text-ember transition-colors"
                >
                  <div>{link.label}</div>
                  <div className="text-sm text-ember devanagari" lang="hi">{link.hindi}</div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
