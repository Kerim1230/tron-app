'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Globe, Search, Loader2, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrowserStep {
  description: string;
}

interface BrowserResult {
  steps: BrowserStep[];
  result: string;
  links: string[];
}

// ─── Quick Commands ──────────────────────────────────────────────────────────

const QUICK_COMMANDS = [
  { icon: '🔍', label: 'ابحث عن', prefix: 'ابحث عن ' },
  { icon: '📄', label: 'لخّص صفحة', prefix: 'لخّص صفحة ' },
  { icon: '📊', label: 'قارن بين', prefix: 'قارن بين ' },
  { icon: '🌐', label: 'افتح موقع', prefix: 'افتح موقع ' },
] as const;

// ─── Simple Markdown Renderer ────────────────────────────────────────────────

function renderLightMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('## '))
      return <h3 key={i} className="text-tron-cyan font-bold text-sm mt-2 mb-1">{line.slice(3)}</h3>;
    if (line.startsWith('# '))
      return <h2 key={i} className="text-tron-cyan font-bold text-base mt-2 mb-1">{line.slice(2)}</h2>;

    // Table rows
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      return (
        <div key={i} className="flex gap-2 text-xs font-mono">
          {cells.map((cell, j) => (
            <span key={j} className="flex-1 text-tron-muted">{cell}</span>
          ))}
        </div>
      );
    }

    // Divider
    if (line.match(/^[-|]+$/)) return null;

    // Bold + inline code
    const processed = line
      .replace(/\*\*(.*?)\*\*/g, '<b class="text-tron-cyan">$1</b>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-[rgba(0,240,255,0.08)] text-tron-cyan text-xs font-mono">$1</code>');

    if (line.trim() === '') return <br key={i} />;
    if (line.startsWith('- '))
      return (
        <div key={i} className="flex gap-2 mr-2">
          <span className="text-tron-cyan mt-0.5 shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
        </div>
      );
    if (line.startsWith('💡') || line.startsWith('✅') || line.startsWith('📌') || line.startsWith('📋') || line.startsWith('📊') || line.startsWith('🔥') || line.startsWith('📄'))
      return (
        <div key={i} className="flex gap-2 items-start">
          <span className="shrink-0">{line.slice(0, 2)}</span>
          <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
        </div>
      );
    return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step, index, total }: { step: BrowserStep; index: number; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.25 }}
      className="flex items-center gap-2.5"
    >
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.3)] flex items-center justify-center">
          <span className="text-tron-cyan text-xs font-mono">{index + 1}</span>
        </div>
        {index < total - 1 && (
          <div className="w-px h-4 bg-[rgba(0,240,255,0.15)]" />
        )}
      </div>
      <span className="text-sm text-[rgba(224,247,250,0.8)]">{step.description}</span>
    </motion.div>
  );
}

// ─── Main BrowserPanel ───────────────────────────────────────────────────────

export default function BrowserPanel() {
  const { browser, setBrowserUrl, setBrowserState } = useAppStore();

  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<BrowserStep[]>([]);
  const [result, setResult] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // ─── Execute Agent Command ─────────────────────────────────────────────

  const handleExecuteCommand = useCallback(async () => {
    const trimmed = command.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setSteps([]);
    setResult('');
    setLinks([]);

    try {
      const res = await fetch('/api/browser/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });

      const data = await res.json();

      if (data.error) {
        setResult(`⚠️ ${data.error}`);
        return;
      }

      setSteps(data.steps || []);
      setResult(data.result || 'تم التنفيذ بنجاح');
      setLinks(data.links || []);

      // حفظ في السجل
      if (data.links?.length > 0) {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data.links[0], title: trimmed.slice(0, 100) }),
          });
        } catch {
          // فشل حفظ السجل غير حرج
        }
      }
    } catch {
      setResult('❌ فشل الاتصال بالوكيل الذكي. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [command, isLoading]);

  // ─── Navigate to URL ───────────────────────────────────────────────────

  const handleNavigate = useCallback(async () => {
    let url = urlInput.trim();
    if (!url) return;

    // إضافة https:// إذا لم يكن موجوداً
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setBrowserUrl(url);
    setBrowserState({ url, title: '', content: '', isLoading: true, error: null, steps: [] });

    try {
      // محاولة جلب محتوى الصفحة عبر API
      const res = await fetch('/api/browser/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `افتح موقع ${url}` }),
      });

      const data = await res.json();
      setBrowserState({
        url,
        title: url,
        content: data.result || 'تم فتح الصفحة',
        isLoading: false,
        error: null,
        steps: data.steps || [],
      });

      // حفظ في السجل
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, title: url }),
        });
      } catch {
        // فشل حفظ السجل غير حرج
      }

      // حفظ كإشارة مرجعية تلقائياً
      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, title: url, folder: 'عام' }),
        });
      } catch {
        // فشل حفظ الإشارة غير حرج
      }
    } catch {
      setBrowserState({
        url,
        title: url,
        content: '',
        isLoading: false,
        error: 'فشل تحميل الصفحة',
        steps: [],
      });
    }
  }, [urlInput, setBrowserUrl, setBrowserState]);

  // ─── Quick Command Handler ────────────────────────────────────────────

  const handleQuickCommand = (prefix: string) => {
    setCommand(prefix);
    inputRef.current?.focus();
  };

  // ─── Render ────────────────────────────────────────────────────────────

  const hasResult = result || steps.length > 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── URL Bar ── */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tron-muted" />
            <input
              ref={urlInputRef}
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNavigate();
              }}
              placeholder="أدخل عنوان URL..."
              className="w-full h-10 pr-9 pl-3 rounded-xl
                bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.15)]
                text-[#e0f7fa] text-sm placeholder:text-tron-dim
                focus:border-[rgba(0,240,255,0.4)]
                transition-all duration-300"
              dir="ltr"
            />
          </div>
          <motion.button
            onClick={handleNavigate}
            disabled={!urlInput.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center
              bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.4)]
              text-tron-cyan hover:bg-[rgba(0,240,255,0.18)]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ── AI Command Input ── */}
      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tron-magenta" />
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteCommand();
              }}
              placeholder="أمر ذكي: ابحث عن... لخّص... قارن..."
              disabled={isLoading}
              className="w-full h-10 pr-9 pl-3 rounded-xl
                bg-[rgba(255,0,170,0.04)] border border-[rgba(255,0,170,0.15)]
                text-[#e0f7fa] text-sm placeholder:text-tron-dim
                focus:border-[rgba(255,0,170,0.4)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300"
              dir="rtl"
            />
          </div>
          <motion.button
            onClick={handleExecuteCommand}
            disabled={isLoading || !command.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center border
              transition-all duration-300
              ${isLoading || !command.trim()
                ? 'bg-[rgba(255,0,170,0.03)] border-[rgba(255,0,170,0.1)] text-tron-dim cursor-not-allowed'
                : 'bg-[rgba(255,0,170,0.1)] border-[rgba(255,0,170,0.4)] text-tron-magenta hover:bg-[rgba(255,0,170,0.18)]'
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Quick Commands ── */}
      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => handleQuickCommand(cmd.prefix)}
              className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium
                bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.15)]
                text-tron-cyan
                hover:bg-[rgba(0,240,255,0.12)] hover:border-[rgba(0,240,255,0.3)]
                transition-all duration-300 cursor-pointer"
            >
              <span className="ml-1">{cmd.icon}</span>
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="tron-divider mx-4" />

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {!hasResult && !isLoading ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center animate-pulse-glow">
                <Globe className="w-10 h-10 text-tron-cyan" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border border-[rgba(0,240,255,0.08)] animate-ping" />
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <p className="neon-text text-base font-bold mb-1">المتصفح الذكي</p>
              <p className="text-tron-muted text-xs">اكتب أمراً أو أدخل رابطاً للبدء</p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── Steps ── */}
            <AnimatePresence>
              {steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-tron-cyan" />
                    <span className="tron-label">خطوات التنفيذ</span>
                  </div>
                  {steps.map((step, i) => (
                    <StepIndicator key={i} step={step} index={i} total={steps.length} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Loading Indicator ── */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.1)]"
              >
                <Loader2 className="w-5 h-5 text-tron-cyan animate-spin" />
                <span className="text-tron-muted text-sm">جاري التنفيذ...</span>
              </motion.div>
            )}

            {/* ── Result ── */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="neon-border rounded-xl p-4 bg-[rgba(0,240,255,0.03)]"
              >
                <div className="text-sm text-[rgba(224,247,250,0.9)] leading-relaxed whitespace-pre-wrap">
                  {renderLightMarkdown(result)}
                </div>
              </motion.div>
            )}

            {/* ── Links ── */}
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-2"
              >
                <span className="tron-label">الروابط</span>
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-tron-cyan hover:text-tron-magenta
                      bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.1)]
                      rounded-lg px-3 py-2 truncate transition-colors"
                    dir="ltr"
                  >
                    🔗 {link}
                  </a>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
