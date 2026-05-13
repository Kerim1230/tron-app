'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import HomePanel from '@/components/tron/HomePanel';
import BrowserPanel from '@/components/tron/BrowserPanel';
import ChatPanel from '@/components/tron/ChatPanel';
import SkillsPanel from '@/components/tron/SkillsPanel';
import BookmarksPanel from '@/components/tron/BookmarksPanel';
import HistoryPanel from '@/components/tron/HistoryPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = 'home' | 'browser' | 'chat' | 'skills' | 'bookmarks' | 'history';

// ─── Constants ───────────────────────────────────────────────────────────────

const screenTitles: Record<Screen, string> = {
  home: 'TRON',
  browser: 'المتصفح الذكي',
  chat: 'المساعد الذكي',
  skills: 'المهارات',
  bookmarks: 'الإشارات المرجعية',
  history: 'السجل',
};

const navTabs: { id: Screen; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'الرئيسية' },
  { id: 'browser', icon: '🌐', label: 'المتصفح' },
  { id: 'chat', icon: '💬', label: 'الدردشة' },
  { id: 'skills', icon: '⚡', label: 'المهارات' },
];

const moreItems: { id: Screen; icon: string; label: string }[] = [
  { id: 'bookmarks', icon: '🔖', label: 'الإشارات المرجعية' },
  { id: 'history', icon: '📜', label: 'السجل' },
];

// ─── Panel Animation Variants ────────────────────────────────────────────────

const panelVariants = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)' },
};

const panelTransition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1] as const,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { activeScreen, setActiveScreen } = useAppStore();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isMoreScreen = activeScreen === 'bookmarks' || activeScreen === 'history';

  // Close more menu on outside click
  useEffect(() => {
    if (!moreMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  const handleTabClick = useCallback(
    (screen: Screen) => {
      setActiveScreen(screen);
      setMoreMenuOpen(false);
    },
    [setActiveScreen]
  );

  const handleMoreClick = useCallback(() => {
    setMoreMenuOpen((prev) => !prev);
  }, []);

  const isMoreActive = isMoreScreen;

  const renderPanel = () => {
    switch (activeScreen) {
      case 'home':
        return <HomePanel />;
      case 'browser':
        return <BrowserPanel />;
      case 'chat':
        return <ChatPanel />;
      case 'skills':
        return <SkillsPanel />;
      case 'bookmarks':
        return <BookmarksPanel />;
      case 'history':
        return <HistoryPanel />;
    }
  };

  return (
    <div className="tron-grid min-h-screen md:flex md:items-center md:justify-center md:p-6">
      {/* ── Phone Frame Container ── */}
      <div
        className="
          relative flex flex-col overflow-hidden bg-[#0a0a0f]
          h-dvh w-full
          md:h-[812px] md:w-[375px] md:rounded-[40px]
          md:border-2 md:border-[rgba(0,240,255,0.2)]
          md:shadow-[0_0_15px_rgba(0,240,255,0.15),0_0_30px_rgba(0,240,255,0.08),0_0_60px_rgba(0,240,255,0.04),inset_0_0_30px_rgba(0,240,255,0.02)]
        "
      >
        {/* ── Notch (desktop only) ── */}
        <div
          className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[28px] bg-[#0a0a0f] rounded-b-[20px] z-50"
          style={{
            borderLeft: '1px solid rgba(0,240,255,0.1)',
            borderRight: '1px solid rgba(0,240,255,0.1)',
            borderBottom: '1px solid rgba(0,240,255,0.1)',
          }}
        />

        {/* ── Status Bar (desktop only) ── */}
        <div className="hidden md:flex items-center justify-between px-6 pt-2 pb-0 text-[11px] text-[rgba(0,240,255,0.5)] font-mono z-40"
          style={{ direction: 'ltr' }}
        >
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>●●●●</span>
            <span>WiFi</span>
            <span>🔋</span>
          </div>
        </div>

        {/* ── Header Bar ── */}
        <header className="relative flex items-center justify-center px-5 py-3 md:pt-5">
          <h1 className="neon-text text-base font-bold tracking-[0.2em] animate-text-glow-pulse select-none">
            {screenTitles[activeScreen as Screen]}
          </h1>
          {/* Neon glow line below header */}
          <div
            className="absolute bottom-0 left-4 right-4 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,240,255,0.35), rgba(0,240,255,0.15), transparent)',
            }}
          />
        </header>

        {/* ── Screen Content ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={panelTransition}
              className="min-h-full"
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Bottom Navigation ── */}
        <nav className="relative shrink-0 px-1 pb-1 pt-2 md:pb-4">
          {/* More popup overlay (closes on click) */}
          <AnimatePresence>
            {moreMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-40 md:absolute md:inset-auto md:bottom-full md:left-1 md:right-1 md:mb-2"
                onClick={() => setMoreMenuOpen(false)}
              >
                {/* Popup menu card */}
                <motion.div
                  ref={moreMenuRef}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden neon-glow"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(13,13,24,0.98) 0%, rgba(10,10,15,0.98) 100%)',
                    border: '1px solid rgba(0,240,255,0.15)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {moreItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-200
                        ${
                          activeScreen === item.id
                            ? 'bg-[rgba(0,240,255,0.1)] text-[#00f0ff]'
                            : 'text-[rgba(0,240,255,0.5)] hover:bg-[rgba(0,240,255,0.05)] hover:text-[#00f0ff]'
                        }
                      `}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                      {activeScreen === item.id && (
                        <span className="mr-auto w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Neon divider above nav */}
          <div
            className="absolute top-0 left-4 right-4 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,240,255,0.12), transparent)',
            }}
          />

          {/* Tab bar */}
          <div className="flex items-center justify-around">
            {navTabs.map((tab) => {
              const isActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl
                    transition-all duration-300 min-w-[56px]
                    ${
                      isActive
                        ? 'text-[#00f0ff]'
                        : 'text-[rgba(0,240,255,0.35)] hover:text-[rgba(0,240,255,0.65)]'
                    }
                  `}
                >
                  {/* Active background glow */}
                  {isActive && (
                    <motion.div
                      layoutId="tron-active-tab"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'rgba(0,240,255,0.06)',
                        boxShadow:
                          '0 0 8px rgba(0,240,255,0.15), 0 0 16px rgba(0,240,255,0.08)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="text-xl relative z-10 leading-none">
                    {tab.icon}
                  </span>
                  <span className="text-[10px] font-medium relative z-10 leading-tight">
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* More button */}
            <button
              ref={moreButtonRef}
              onClick={handleMoreClick}
              className={`
                relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl
                transition-all duration-300 min-w-[56px]
                ${
                  isMoreActive || moreMenuOpen
                    ? 'text-[#00f0ff]'
                    : 'text-[rgba(0,240,255,0.35)] hover:text-[rgba(0,240,255,0.65)]'
                }
              `}
            >
              {/* Active background glow for More */}
              {(isMoreActive || moreMenuOpen) && (
                <motion.div
                  layoutId="tron-active-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(0,240,255,0.06)',
                    boxShadow:
                      '0 0 8px rgba(0,240,255,0.15), 0 0 16px rgba(0,240,255,0.08)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="text-xl relative z-10 leading-none">☰</span>
              <span className="text-[10px] font-medium relative z-10 leading-tight">
                المزيد
              </span>
            </button>
          </div>

          {/* Home indicator (desktop only) */}
          <div className="hidden md:flex justify-center mt-1">
            <div className="w-[134px] h-[5px] rounded-full bg-[rgba(0,240,255,0.25)]" />
          </div>
        </nav>
      </div>
    </div>
  );
}
