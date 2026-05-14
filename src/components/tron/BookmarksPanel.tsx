'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Bookmark {
  id: string;
  url: string;
  title: string;
  folder: string;
  favicon: string;
  createdAt: string;
}

type FolderFilter = 'الكل' | 'عام' | 'عمل' | 'ترفيه';

const FOLDERS: FolderFilter[] = ['الكل', 'عام', 'عمل', 'ترفيه'];

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `قبل ${diffDays} أيام`;
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

function getFaviconSrc(bookmark: Bookmark): string | null {
  if (bookmark.favicon) return bookmark.favicon;
  try {
    const u = new URL(bookmark.url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookmarksPanel() {
  const { setActiveScreen, setBrowserUrl, setBrowserState } = useAppStore();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('الكل');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('عام');
  const [saving, setSaving] = useState(false);

  // ── Load bookmarks ──
  const loadBookmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/bookmarks');
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // ── Delete bookmark ──
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setBookmarks((prev) => prev.filter((b) => b.id !== id));
        }
      } catch {
        // silently fail
      }
    },
    []
  );

  // ── Open bookmark in browser ──
  const handleOpen = useCallback(
    (url: string) => {
      setBrowserUrl(url);
      setBrowserState({ url, title: '', content: '', isLoading: true, error: null, steps: [] });
      setActiveScreen('browser');
    },
    [setActiveScreen, setBrowserUrl, setBrowserState]
  );

  // ── Add bookmark ──
  const handleAdd = useCallback(async () => {
    if (!newUrl.trim()) return;
    setSaving(true);
    try {
      let finalTitle = newTitle.trim();
      if (!finalTitle) {
        try {
          const u = new URL(newUrl.trim());
          finalTitle = u.hostname;
        } catch {
          finalTitle = newUrl.trim();
        }
      }

      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), title: finalTitle, folder: newFolder }),
      });

      if (res.ok) {
        const created = await res.json();
        setBookmarks((prev) => [created, ...prev]);
        setNewUrl('');
        setNewTitle('');
        setNewFolder('عام');
        setShowAddForm(false);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [newUrl, newTitle, newFolder]);

  // ── Filtered bookmarks ──
  const filtered = bookmarks.filter((b) => {
    const matchFolder = activeFolder === 'الكل' || b.folder === activeFolder;
    const matchSearch =
      !search.trim() ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  // ── Render ──
  return (
    <div className="flex flex-col h-full px-4 pt-2 pb-4 gap-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="neon-text text-lg font-bold tracking-wide">الإشارات المرجعية</h2>
          {bookmarks.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[rgba(0,240,255,0.1)] text-[#00f0ff] border border-[rgba(0,240,255,0.2)]">
              {bookmarks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="tron-button text-sm px-3 py-1.5"
        >
          {showAddForm ? '✕' : '+'}
        </button>
      </div>

      {/* ── Add Bookmark Form ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="card-glow p-4 flex flex-col gap-3">
              <input
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-[#e0f7fa] placeholder:text-[rgba(0,240,255,0.3)] focus:border-[rgba(0,240,255,0.5)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] outline-none transition-all"
                dir="ltr"
              />
              <input
                type="text"
                placeholder="عنوان الإشارة (اختياري)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-[#e0f7fa] placeholder:text-[rgba(0,240,255,0.3)] focus:border-[rgba(0,240,255,0.5)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] outline-none transition-all"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  className="flex-1 bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-[#e0f7fa] focus:border-[rgba(0,240,255,0.5)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] outline-none transition-all"
                >
                  {FOLDERS.filter((f) => f !== 'الكل').map((f) => (
                    <option key={f} value={f} className="bg-[#0d0d18] text-[#e0f7fa]">
                      {f}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdd}
                  disabled={saving || !newUrl.trim()}
                  className="tron-button px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? '⏳' : 'حفظ'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(0,240,255,0.4)] text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="بحث في الإشارات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-lg pr-9 pl-3 py-2 text-sm text-[#e0f7fa] placeholder:text-[rgba(0,240,255,0.3)] focus:border-[rgba(0,240,255,0.5)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] outline-none transition-all"
        />
      </div>

      {/* ── Folder Chips ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {FOLDERS.map((folder) => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border
              ${
                activeFolder === folder
                  ? 'bg-[rgba(0,240,255,0.15)] text-[#00f0ff] border-[rgba(0,240,255,0.4)] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-transparent text-[rgba(0,240,255,0.4)] border-[rgba(0,240,255,0.1)] hover:bg-[rgba(0,240,255,0.05)] hover:text-[rgba(0,240,255,0.7)]'
              }
            `}
          >
            {folder}
          </button>
        ))}
      </div>

      {/* ── Bookmarks List ── */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100dvh-340px)]">
        {loading ? (
          // Skeleton
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.06)] animate-pulse"
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
            <span className="text-5xl mb-4 opacity-40">🔖</span>
            <p className="text-tron-muted text-sm mb-1">لا توجد إشارات مرجعية</p>
            <p className="text-tron-dim text-xs">أضف إشارات مرجعية للوصول السريع</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {filtered.map((bookmark) => {
                const faviconSrc = getFaviconSrc(bookmark);
                return (
                  <motion.div
                    key={bookmark.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="card-glow group rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Favicon */}
                      <button
                        onClick={() => handleOpen(bookmark.url)}
                        className="shrink-0 w-8 h-8 rounded-md bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center transition-all hover:border-[rgba(0,240,255,0.3)] hover:shadow-[0_0_8px_rgba(0,240,255,0.15)]"
                      >
                        {faviconSrc ? (
                          <img
                            src={faviconSrc}
                            alt=""
                            width={16}
                            height={16}
                            className="w-4 h-4 rounded-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`text-sm ${faviconSrc ? 'hidden' : ''}`}>🌐</span>
                      </button>

                      {/* Content */}
                      <button
                        onClick={() => handleOpen(bookmark.url)}
                        className="flex-1 min-w-0 text-right"
                      >
                        <p className="text-sm text-[#e0f7fa] font-medium truncate leading-tight">
                          {bookmark.title}
                        </p>
                        <p className="text-[11px] text-[rgba(0,240,255,0.4)] truncate mt-0.5" dir="ltr">
                          {truncateUrl(bookmark.url)}
                        </p>
                        <p className="text-[10px] text-[rgba(0,240,255,0.25)] mt-0.5">
                          {formatDate(bookmark.createdAt)}
                        </p>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(bookmark.id)}
                        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[rgba(255,45,85,0.4)] hover:text-[#ff2d55] hover:bg-[rgba(255,45,85,0.1)] transition-all opacity-0 group-hover:opacity-100"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
