import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Preloader } from '../components/Preloader';
import { Nav } from '../components/Nav';
import { SideRail } from '../components/SideRail';
import { ForegroundStages } from '../components/ForegroundStages';
import { Atmosphere } from '../components/ui/Atmosphere';
import { ArrowRight } from 'lucide-react';

// Lazy load WorldCanvas
const WorldCanvas = lazy(() => import('../components/WorldCanvas').then(m => ({ default: m.WorldCanvas })));

export default function Landing() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-bone relative overflow-x-clip">
      {/* Preloader */}
      <AnimatePresence>
        {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {/* 3D World Background */}
      <Suspense fallback={null}>
        <WorldCanvas scene="landing" />
      </Suspense>

      {/* Atmosphere layers */}
      <Atmosphere />

      {/* Foreground stages */}
      <ForegroundStages />

      {/* Navigation */}
      <Nav />

      {/* Side rail */}
      <SideRail />

      {/* Content */}
      <div className="relative z-20">
        {/* HERO */}
        <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-[var(--pad)] w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <div className="space-y-8">
              <div className="eyebrow eyebrow-ember">● Chapter 00 — The Night Block</div>
              
              <h1 className="display display-xl">
                <span className="block">Raise it. Back it.</span>
                <span className="block text-ember">See it resolved.</span>
              </h1>

              <p className="body text-bone-dim max-w-md">
                A transparent way for hostel residents to report problems, and for wardens to answer them on time.
              </p>

              {/* Chapter chips */}
              <div className="flex flex-wrap gap-3">
                {['01 Report', '02 Support', '03 Resolve', '04 Daybreak'].map((chip, idx) => (
                  <a
                    key={chip}
                    href={`#chapter-0${idx + 1}`}
                    className="px-4 py-2 rounded-full border border-line text-sm text-bone-dim hover:border-ember hover:text-ember transition-all"
                  >
                    {chip}
                  </a>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-8">
              {/* Hindi text */}
              <div className="text-right">
                <div className="text-6xl text-bone/20 devanagari" lang="hi">
                  आवाज़
                </div>
              </div>

              {/* Peek window */}
              <a
                href="#chapter-03"
                className="block group relative aspect-video rounded-xl border border-line overflow-hidden hover:border-ember transition-all"
              >
                <div className="absolute inset-0 bg-ink-2 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-ember/20 flex items-center justify-center mx-auto mb-2 group-hover:bg-ember/30 transition-colors">
                      <div className="w-0 h-0 border-l-[12px] border-l-ember border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
                    </div>
                    <div className="text-xs text-bone-dim">Warden's window — 03:12</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Giant wordmark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-[20vw] font-bold text-bone/5 tracking-widest">
              HMCS
            </div>
          </div>
        </section>

        {/* CHAPTER 01 — REPORT */}
        <section id="chapter-01" className="min-h-screen flex items-center py-32 relative overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-[var(--pad)] w-full">
            {/* Section head */}
            <div className="flex items-center gap-4 mb-16">
              <div className="text-sm text-ember">01 — The Gate</div>
              <div className="flex-1 h-px bg-line" />
              <div className="text-sm text-bone-dim devanagari" lang="hi">शिकायत</div>
            </div>

            {/* Three-column spread */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="md:col-span-2">
                <h2 className="display display-lg mb-8">
                  A problem written down is a problem on the clock.
                </h2>
              </div>
              <div className="space-y-6">
                <p className="body text-bone-dim">
                  <span className="text-bone font-medium">Every hostel has issues that get lost in corridors and chat groups.</span> HMCS gives each one a record, a priority and a deadline from the moment it is filed.
                </p>
                <p className="body-sm text-bone-dim">
                  Add a title, a category and a photo. One normal complaint a day, one emergency a week, so every report stays meaningful.
                </p>
                <a
                  href="#/student"
                  className="inline-flex items-center gap-2 text-ember hover:gap-3 transition-all"
                >
                  File your first complaint <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Stats band */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: '72h', label: 'normal deadline' },
                { value: '24h', label: 'emergency deadline' },
                { value: '1/day', label: 'normal limit' },
                { value: '1/week', label: 'emergency limit' },
              ].map(stat => (
                <div key={stat.label} className="p-6 rounded-xl border border-line bg-ink-2/50">
                  <div className="text-3xl font-light text-ember tabular mb-2">{stat.value}</div>
                  <div className="text-xs text-bone-dim uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTER 02 — SUPPORT */}
        <section id="chapter-02" className="min-h-screen flex items-center py-32 relative overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-[var(--pad)] w-full">
            {/* Section head */}
            <div className="flex items-center gap-4 mb-16">
              <div className="text-sm text-ember">02 — The Lit Windows</div>
              <div className="flex-1 h-px bg-line" />
              <div className="text-sm text-bone-dim devanagari" lang="hi">समर्थन</div>
            </div>

            {/* Mosaic */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tall card */}
              <div className="md:row-span-2 aspect-[3/4] md:aspect-auto rounded-xl border border-line bg-ink-2/50 p-8 flex flex-col justify-between group hover:border-ember transition-all">
                <div>
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Feed</div>
                  <div className="text-sm text-bone-dim devanagari mb-4" lang="hi">फ़ीड</div>
                  <h3 className="display display-md mb-4">Your hostel, one feed</h3>
                  <p className="body-sm text-bone-dim">See every active complaint in your hostel, sorted by urgency.</p>
                </div>
                <div className="text-xs text-muted">Live view</div>
              </div>

              {/* Stacked cards */}
              <div className="aspect-video rounded-xl border border-line bg-ink-2/50 p-6 flex flex-col justify-between group hover:border-ember transition-all">
                <div>
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Upvote</div>
                  <div className="text-sm text-bone-dim devanagari mb-4" lang="hi">समर्थन</div>
                  <h3 className="text-xl font-medium mb-2">Ten votes make it urgent</h3>
                  <p className="body-sm text-bone-dim">When 10 students upvote, the complaint escalates to emergency.</p>
                </div>
              </div>

              <div className="aspect-video rounded-xl border border-line bg-ink-2/50 p-6 flex flex-col justify-between group hover:border-ember transition-all">
                <div>
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Emergency</div>
                  <div className="text-sm text-bone-dim devanagari mb-4" lang="hi">आपात</div>
                  <h3 className="text-xl font-medium mb-2">Promoted, not ignored</h3>
                  <p className="body-sm text-bone-dim">Emergency complaints get a 24-hour deadline and priority attention.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 03 — RESOLVE */}
        <section id="chapter-03" className="min-h-screen flex items-center py-32 relative overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-[var(--pad)] w-full">
            {/* Section head */}
            <div className="flex items-center gap-4 mb-16">
              <div className="text-sm text-ember">03 — The Warden's Lamp</div>
              <div className="flex-1 h-px bg-line" />
              <div className="text-sm text-bone-dim devanagari" lang="hi">समाधान</div>
            </div>

            {/* Heading and body */}
            <div className="mb-16 max-w-3xl">
              <h2 className="display display-lg mb-6">
                A deadline for every complaint. A witness for every fix.
              </h2>
              <p className="body text-bone-dim">
                Wardens see a prioritised queue. When a fix is reported, students confirm it. Three confirmations within 24 hours close the case, and the history stays forever.
              </p>
            </div>

            {/* Atlas grid */}
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { num: '01', title: 'Submitted', desc: 'received with a deadline', time: 'within 72 h' },
                { num: '02', title: 'Acknowledged', desc: 'a warden has seen it', time: 'within 24 h' },
                { num: '03', title: 'In progress', desc: 'work has started', time: 'within 48 h' },
                { num: '04', title: 'Marked resolved', desc: 'a 24-hour confirmation window opens', time: 'within 24 h' },
                { num: '05', title: 'Confirmed', desc: 'three students agree, then rate', time: 'within 24 h' },
              ].map((step, idx) => (
                <div
                  key={step.num}
                  className={`rounded-xl border border-line bg-ink-2/50 p-6 flex flex-col justify-between ${
                    idx < 2 ? 'md:col-span-2' : 'md:col-span-1'
                  } aspect-video`}
                >
                  <div>
                    <div className="text-3xl font-light text-ember tabular mb-2">{step.num}</div>
                    <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                    <p className="body-sm text-bone-dim">{step.desc}</p>
                  </div>
                  <div className="text-xs text-muted mt-4">{step.time}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTER 04 — DAYBREAK */}
        <section id="chapter-04" className="min-h-screen flex items-center py-32 relative overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-[var(--pad)] w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <div className="space-y-8">
              <div className="eyebrow eyebrow-ember">Chapter 04 — Daybreak</div>

              <p className="body text-bone-dim max-w-md">
                Ratings are out of three stars. Missed deadlines are recorded as separate, traceable events. Nothing is quietly deleted.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#/student"
                  className="inline-flex items-center justify-center px-8 py-4 bg-ember text-ink rounded-full text-base font-medium hover:bg-ember/90 transition-colors"
                >
                  Open the student portal
                </a>
                <a
                  href="#/warden"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm text-bone-dim hover:text-ember transition-colors"
                >
                  Warden login
                </a>
              </div>
            </div>

            {/* Right column — vertical text on desktop */}
            <div className="hidden md:flex items-center justify-center">
              <h2 className="display display-xl text-bone/20" style={{ writingMode: 'vertical-rl' }}>
                Resolved by morning.
              </h2>
            </div>

            {/* Mobile — horizontal */}
            <div className="md:hidden">
              <h2 className="display display-lg text-bone/20">
                Resolved by morning.
              </h2>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-32 border-t border-line relative overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-[var(--pad)]">
            {/* Brand statement */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-4 mb-8">
                <svg width="48" height="48" viewBox="0 0 64 64" className="text-bone">
                  <rect x="4" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="34" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="4" y="34" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="34" y="34" width="26" height="26" fill="var(--ember)" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <p className="display display-md max-w-2xl mx-auto">
                A hostel works best when every voice has a witness.
              </p>
            </div>

            {/* Three columns */}
            <div className="grid md:grid-cols-3 gap-12 mb-16">
              <div>
                <h3 className="text-sm font-medium text-bone mb-4 uppercase tracking-wider">Portal</h3>
                <ul className="space-y-2">
                  <li><a href="#/student" className="text-sm text-bone-dim hover:text-ember transition-colors">Student login</a></li>
                  <li><a href="#/warden" className="text-sm text-bone-dim hover:text-ember transition-colors">Warden login</a></li>
                  <li><a href="#/admin" className="text-sm text-bone-dim hover:text-ember transition-colors">Admin sign-in</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-bone mb-4 uppercase tracking-wider">How it works</h3>
                <ul className="space-y-2">
                  <li><a href="#chapter-01" className="text-sm text-bone-dim hover:text-ember transition-colors">Report</a></li>
                  <li><a href="#chapter-02" className="text-sm text-bone-dim hover:text-ember transition-colors">Support</a></li>
                  <li><a href="#chapter-03" className="text-sm text-bone-dim hover:text-ember transition-colors">Resolve</a></li>
                  <li><a href="#chapter-04" className="text-sm text-bone-dim hover:text-ember transition-colors">Daybreak</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-bone mb-4 uppercase tracking-wider">Policy</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-bone-dim hover:text-ember transition-colors">Limits and deadlines</a></li>
                  <li><a href="#" className="text-sm text-bone-dim hover:text-ember transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-sm text-bone-dim hover:text-ember transition-colors">Photo rules</a></li>
                </ul>
              </div>
            </div>

            {/* Base row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-line">
              <div className="text-xs text-muted">© 2026 HMCS</div>
              <div className="text-lg text-bone-dim devanagari" lang="hi">आवाज़</div>
              <div className="text-xs text-muted">Built for hostel life</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
