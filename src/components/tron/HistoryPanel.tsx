'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: string;
}

type DateGroup = 'اليوم' | 'أمس' | 'أقدم';

interface GroupedHistory {
  label: DateGroup;
  items: HistoryItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateUrl(url: string, maxLen = 38): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    return display.length > maxLen ? display.slice(0, maxLen) + '…' : display;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '…' : url;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function getDateGroup(iso: string): DateGroup {
  const d = new Date(iso);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (d >= todayStart) return 'اليوم';
  if (d >= yesterdayStart) return 'أمس';
  return 'أقدم';
}

function groupByDate(items: HistoryItem[]): GroupedHistory[] {
  const groupOrder: DateGroup[] = ['اليوم', 'أمس', 'أقدم'];
  const map = new Map<DateGroup, HistoryItem[]>();

  for (const item of items) {
    const group = getDateGroup(item.visitedAt);
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(item);
  }

  return groupOrder
    .filter((g) => map.has(g))
    .map((g) => ({ label: g, items: map.get(g)! }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HistoryPanel() {
  const { setActiveScreen, setBrowserUrl, setBrowserState } = useAppStore();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clearing, setClearing] = useState(false);

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Delete single item ──
  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
      }
    } catch {
      // silently fail
    }
  }, []);

  // ── Clear all ──
  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/history?all=true', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch {
      // silently fail
    } finally {
      setClearing(false);
    }
  }, []);

  // ── Open in browser ──
  const handleOpen = useCallback(
    (url: string) => {
      setBrowserUrl(url);
      setBrowserState({ url, title: '', content: '', isLoading: true, error: null, steps: [] });
      setActiveScreen('browser');
    },
    [setActiveScreen, setBrowserUrl, setBrowserState]
  );

  // ── Filtered & grouped ──
  const filtered = history.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q);
  });

  const grouped = groupByDate(filtered);

  // ── Render ──
  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-4 gap-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="neon-text text-lg font-bold tracking-wide">السجل</h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="tron-button-magenta tron-button text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {clearing ? '⏳' : 'مسح الكل'}
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(0,240,255,0.4)] text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="بحث في السجل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-lg pr-9 pl-3 py-2 text-sm text-[#e0f7fa] placeholder:text-[rgba(0,240,255,0.3)] focus:border-[rgba(0,240,255,0.5)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] outline-none transition-all"
        />
      </div>

      {/* ── History List ── */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100dvh-260px)]">
        {loading ? (
          // Skeleton
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.06)] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <span className="text-5xl mb-4 opacity-40">🕐</span>
            <p className="text-tron-muted text-sm mb-1">لا يوجد سجل تصفح</p>
            <p className="text-tron-dim text-xs">ابدأ بتصفح الويب لتظهر السجلات هنا</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xs font-mono text-[rgba(0,240,255,0.5)] tracking-wider uppercase">
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[rgba(0,240,255,0.12)] to-transparent" />
                  <span className="text-[10px] font-mono text-[rgba(0,240,255,0.25)]">
                    {group.items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1.5">
                  <AnimatePresence>
                    {group.items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="card-glow group rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center gap-3 p-2.5">
                          {/* Icon */}
                          <button
                            onClick={() => handleOpen(item.url)}
                            className="shrink-0 w-8 h-8 rounded-md bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center text-sm transition-all hover:border-[rgba(0,240,255,0.3)] hover:shadow-[0_0_8px_rgba(0,240,255,0.15)]"
                          >
                            🌐
                          </button>

                          {/* Content */}
                          <button
                            onClick={() => handleOpen(item.url)}
                            className="flex-1 min-w-0 text-right"
                          >
                            <p className="text-sm text-[#e0f7fa] font-medium truncate leading-tight">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-[rgba(0,240,255,0.4)] truncate" dir="ltr">
                                {truncateUrl(item.url)}
                              </p>
                              <span className="text-[10px] text-[rgba(0,240,255,0.25)] shrink-0 rtl-numbers" dir="ltr">
                                {formatTime(item.visitedAt)}
                              </span>
                            </div>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[rgba(255,45,85,0.4)] hover:text-[#ff2d55] hover:bg-[rgba(255,45,85,0.1)] transition-all opacity-0 group-hover:opacity-100 text-xs"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
