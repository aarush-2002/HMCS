import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReducedMotionToggle } from './ReducedMotionToggle';

interface ShellProps {
  children: React.ReactNode;
  unreadCount?: number;
  userName?: string;
}

export function Shell({ children, unreadCount = 0, userName = 'Student' }: ShellProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/student', label: 'Feed', hindi: 'फ़ीड', icon: '📋' },
    { path: '/student/new', label: 'New', hindi: 'नई', icon: '➕' },
    { path: '/student/mine', label: 'Mine', hindi: 'मेरी', icon: '📁' },
    { path: '/student/notifications', label: 'Alerts', hindi: 'सूचनाएँ', icon: '🔔' },
  ];

  return (
    <div className="min-h-screen bg-ink text-bone relative">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ember focus:text-ink focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ember"
      >
        Skip to main content
      </a>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-ink-2/80 backdrop-blur-md border-b border-line">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-ember/20 rounded flex items-center justify-center">
              <span className="text-ember text-lg">◫</span>
            </div>
            <div>
              <div className="text-sm font-medium text-bone">HMCS</div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Student Portal</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="group relative text-sm text-bone-dim hover:text-bone transition-colors"
              >
                <span>{item.label}</span>
                <span className="absolute left-0 top-full text-[10px] text-ember devanagari opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" lang="hi">
                  {item.hindi}
                </span>
                {location.pathname === item.path && (
                  <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-ember" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Link
              to="/student/notifications"
              className="relative p-2 text-bone-dim hover:text-bone transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-ember text-ink text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 text-bone-dim hover:text-bone transition-colors">
                <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-ember" />
                </div>
                <span className="hidden md:block text-sm">{userName}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-ink-2 border border-line rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  to="/student/profile"
                  className="block px-4 py-3 text-sm text-bone-dim hover:text-bone hover:bg-ink-3 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  to="/logout"
                  className="block px-4 py-3 text-sm text-bone-dim hover:text-bone hover:bg-ink-3 transition-colors border-t border-line"
                >
                  Sign out
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-bone-dim hover:text-bone transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-ink/95 backdrop-blur-md md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ paddingTop: '64px' }}
          >
            <nav className="flex flex-col items-center justify-center h-full gap-8">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl text-bone hover:text-ember transition-colors"
                >
                  <div>{item.label}</div>
                  <div className="text-sm text-ember devanagari" lang="hi">{item.hindi}</div>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Left Rail */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-16 bg-ink-2/50 border-r border-line flex-col items-center py-8 gap-6 z-30">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="group relative w-10 h-10 flex items-center justify-center text-bone-dim hover:text-bone transition-colors"
            aria-label={item.label}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="absolute left-full ml-3 px-2 py-1 bg-ink-2 border border-line rounded text-xs text-bone opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
              <span className="block text-[10px] text-ember devanagari" lang="hi">{item.hindi}</span>
            </span>
            {location.pathname === item.path && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-ember" />
            )}
          </Link>
        ))}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink-2/95 backdrop-blur-md border-t border-line">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                location.pathname === item.path ? 'text-ember' : 'text-bone-dim hover:text-bone'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="pt-16 md:pl-16 pb-16 md:pb-0">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* Reduced Motion Toggle */}
      <ReducedMotionToggle />
    </div>
  );
}
