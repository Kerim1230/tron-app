'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'models' | 'actions';

interface RepoStats {
  stars: number;
  forks: number;
  issues: number;
  prs: number;
  contributors: number;
  languages: Record<string, number>;
}

interface ActivityEvent {
  id: string;
  type: 'push' | 'pr' | 'issue' | 'release';
  message: string;
  time: string;
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface WorkflowInfo {
  id: string;
  name: string;
  status: 'active' | 'disabled';
  icon: string;
}

interface WorkflowRun {
  id: string;
  workflow: string;
  status: 'success' | 'failed' | 'running';
  duration: string;
  time: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'models', label: 'النماذج' },
  { id: 'actions', label: 'الإجراءات' },
];

const MODELS: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'نموذج متعدد الوسائط عالي الأداء من OpenAI', icon: '🧠' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'نموذج سريع واقتصادي من OpenAI', icon: '⚡' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'نموذج تفكير عميق مفتوح المصدر', icon: '🔍' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'نموذج Meta مفتوح المصدر بـ 70 مليار معامل', icon: '🦙' },
  { id: 'mistral-large', name: 'Mistral Large', description: 'نموذج Mistral القوي للغات المتعددة', icon: '🌀' },
];

const WORKFLOWS: WorkflowInfo[] = [
  { id: 'tron-skills', name: 'tron-skills', status: 'active', icon: '⚡' },
  { id: 'docs', name: 'docs', status: 'active', icon: '📚' },
  { id: 'codeql', name: 'codeql', status: 'active', icon: '🛡️' },
  { id: 'agentic', name: 'agentic', status: 'active', icon: '🤖' },
  { id: 'container', name: 'container', status: 'active', icon: '📦' },
  { id: 'deploy', name: 'deploy', status: 'active', icon: '🚀' },
  { id: 'release', name: 'release', status: 'disabled', icon: '🏷️' },
  { id: 'insights', name: 'insights', status: 'active', icon: '📊' },
];

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
};

// ─── Simulated Data ──────────────────────────────────────────────────────────

const SIMULATED_STATS: RepoStats = {
  stars: 12847,
  forks: 3214,
  issues: 156,
  prs: 89,
  contributors: 47,
  languages: {
    TypeScript: 58,
    JavaScript: 22,
    CSS: 10,
    HTML: 6,
    Shell: 4,
  },
};

const SIMULATED_ACTIVITY: ActivityEvent[] = [
  { id: '1', type: 'push', message: 'تحديث واجهة المتصفح الذكي', time: 'منذ 5 دقائق' },
  { id: '2', type: 'pr', message: 'دمج: إضافة نظام المهارات الآلي', time: 'منذ 23 دقيقة' },
  { id: '3', type: 'issue', message: 'مشكلة: خطأ في تحميل النماذج', time: 'منذ ساعة' },
  { id: '4', type: 'push', message: 'إصلاح مشكلة التمرير في لوحة الدردشة', time: 'منذ ساعتين' },
  { id: '5', type: 'release', message: 'إصدار v2.4.0 - تحديث شامل', time: 'منذ 3 ساعات' },
  { id: '6', type: 'pr', message: 'دمج: تحسين أداء الرسوم المتحركة', time: 'منذ 5 ساعات' },
];

const SIMULATED_RUNS: WorkflowRun[] = [
  { id: '1', workflow: 'tron-skills', status: 'success', duration: '2m 34s', time: 'منذ 10 دقائق' },
  { id: '2', workflow: 'codeql', status: 'success', duration: '5m 12s', time: 'منذ 15 دقيقة' },
  { id: '3', workflow: 'deploy', status: 'failed', duration: '1m 08s', time: 'منذ 30 دقيقة' },
  { id: '4', workflow: 'docs', status: 'success', duration: '45s', time: 'منذ ساعة' },
  { id: '5', workflow: 'agentic', status: 'running', duration: '3m 22s', time: 'الآن' },
];

// ─── Helper: Format number with Arabic-style commas ──────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('ar-SA');
}

// ─── Helper: Activity icon ───────────────────────────────────────────────────

function activityIcon(type: ActivityEvent['type']): string {
  switch (type) {
    case 'push': return '⬆️';
    case 'pr': return '🔀';
    case 'issue': return '📋';
    case 'release': return '🏷️';
  }
}

// ─── Helper: Status color for workflow runs ──────────────────────────────────

function runStatusColor(status: WorkflowRun['status']): string {
  switch (status) {
    case 'success': return 'rgba(0,255,136,0.8)';
    case 'failed': return 'rgba(255,45,85,0.8)';
    case 'running': return '#00f0ff';
  }
}

function runStatusLabel(status: WorkflowRun['status']): string {
  switch (status) {
    case 'success': return 'نجاح';
    case 'failed': return 'فشل';
    case 'running': return 'جاري';
  }
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return <span className="rtl-numbers font-mono">{formatNumber(display)}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function GitHubPanel() {
  const { activeScreen } = useAppStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Overview data
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>(SIMULATED_ACTIVITY);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Models state
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [prompt, setPrompt] = useState('');
  const [modelResult, setModelResult] = useState('');
  const [modelLoading, setModelLoading] = useState(false);

  // Actions state
  const [workflowRuns] = useState<WorkflowRun[]>(SIMULATED_RUNS);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState<string | null>(null);

  // ─── Load overview data ──────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'overview') return;

    let cancelled = false;

    async function fetchInsights() {
      setLoadingOverview(true);
      try {
        const res = await fetch('/api/insights?owner=Kerim1230&repo=tron-app');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) {
          setStats(data);
        }
      } catch {
        if (!cancelled) {
          setStats(SIMULATED_STATS);
        }
      } finally {
        if (!cancelled) {
          setLoadingOverview(false);
        }
      }
    }

    fetchInsights();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ─── Call model ─────────────────────────────────────────────────────────

  const handleTryModel = useCallback(async () => {
    if (!prompt.trim() || modelLoading) return;

    setModelLoading(true);
    setModelResult('');

    try {
      const res = await fetch('/api/github-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model: selectedModel }),
      });

      const data = await res.json();
      setModelResult(data.response || data.error || 'لا يوجد رد');
    } catch {
      setModelResult('❌ فشل الاتصال بالنموذج. يرجى المحاولة لاحقاً.');
    } finally {
      setModelLoading(false);
    }
  }, [prompt, selectedModel, modelLoading]);

  // ─── Trigger workflow (simulated) ────────────────────────────────────────

  const handleTriggerWorkflow = useCallback((workflowId: string) => {
    setTriggeringWorkflow(workflowId);
    setTimeout(() => {
      setTriggeringWorkflow(null);
    }, 2000);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(0,240,255,0.1)] shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300
              ${
                activeTab === tab.id
                  ? 'bg-[rgba(0,240,255,0.12)] text-[#00f0ff] border border-[rgba(0,240,255,0.4)] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-[rgba(0,240,255,0.03)] text-[rgba(0,240,255,0.45)] border border-[rgba(0,240,255,0.1)] hover:bg-[rgba(0,240,255,0.06)] hover:text-[rgba(0,240,255,0.7)]'
              }
            `}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="github-tab-glow"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'rgba(0,240,255,0.06)',
                  boxShadow: '0 0 12px rgba(0,240,255,0.15)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}

        {/* Repo name indicator */}
        <div className="mr-auto flex items-center gap-1.5 text-tron-dim text-xs font-mono">
          <span>🐙</span>
          <span className="rtl-numbers">Kerim1230/tron-app</span>
        </div>
      </div>

      {/* ─── Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-5"
            >
              {/* ─── Repo Stats Grid ──────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '⭐', label: 'النجوم', value: stats?.stars ?? 0, color: '#00f0ff' },
                  { icon: '🍴', label: 'الشوك', value: stats?.forks ?? 0, color: '#ff00aa' },
                  { icon: '📋', label: 'المشاكل', value: stats?.issues ?? 0, color: '#ff6b35' },
                  { icon: '🔀', label: 'طلبات الدمج', value: stats?.prs ?? 0, color: '#7b61ff' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    className="card-glow neon-hover rounded-xl p-3 text-center"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="mt-1 text-xl font-bold" style={{ color: item.color }}>
                      {loadingOverview ? (
                        <span className="inline-block w-16 h-7 rounded bg-[rgba(0,240,255,0.06)] animate-pulse" />
                      ) : (
                        <AnimatedCounter value={item.value} />
                      )}
                    </div>
                    <div className="text-tron-muted text-[11px] mt-0.5">{item.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* ─── Language Breakdown ───────────────────────── */}
              <div>
                <h3 className="tron-label mb-3">توزيع اللغات البرمجية</h3>
                <div className="space-y-2.5">
                  {Object.entries(stats?.languages ?? SIMULATED_STATS.languages)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, pct], index) => (
                      <motion.div
                        key={lang}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.25 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#888' }}
                            />
                            <span className="text-tron-cyan">{lang}</span>
                          </div>
                          <span className="text-tron-muted font-mono rtl-numbers">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[rgba(0,240,255,0.06)] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: LANGUAGE_COLORS[lang] || '#888',
                              boxShadow: `0 0 6px ${LANGUAGE_COLORS[lang] || '#888'}40`,
                            }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3 + index * 0.08, duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* ─── Recent Activity ──────────────────────────── */}
              <div>
                <h3 className="tron-label mb-3">النشاط الأخير</h3>
                <div className="space-y-2">
                  {activity.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(0,240,255,0.02)] hover:bg-[rgba(0,240,255,0.04)] transition-colors"
                    >
                      <span className="text-sm shrink-0 mt-0.5">{activityIcon(event.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tron-cyan truncate">{event.message}</p>
                        <span className="text-tron-dim text-[11px]">{event.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ MODELS TAB ═══════════════════ */}
          {activeTab === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* ─── Model Cards ─────────────────────────────── */}
              <div>
                <h3 className="tron-label mb-3">النماذج المتاحة</h3>
                <div className="space-y-2.5">
                  {MODELS.map((model, index) => (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.25 }}
                      className={`card-glow neon-hover rounded-xl p-3 flex items-center gap-3 ${
                        selectedModel === model.id ? 'border-[rgba(0,240,255,0.4)] bg-[rgba(0,240,255,0.06)]' : ''
                      }`}
                    >
                      <span className="text-xl shrink-0">{model.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-tron-cyan text-sm font-semibold">{model.name}</h4>
                        <p className="text-tron-muted text-[11px] mt-0.5 truncate">{model.description}</p>
                      </div>
                      <button
                        onClick={() => setSelectedModel(model.id)}
                        className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                          selectedModel === model.id
                            ? 'bg-[rgba(0,240,255,0.15)] border border-[rgba(0,240,255,0.4)] text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                            : 'bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.15)] text-tron-muted hover:bg-[rgba(0,240,255,0.08)] hover:text-tron-cyan'
                        }`}
                      >
                        تجربة
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ─── Prompt Input ─────────────────────────────── */}
              <div>
                <h3 className="tron-label mb-2">
                  اختبار النموذج: {MODELS.find((m) => m.id === selectedModel)?.name}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTryModel();
                    }}
                    placeholder="أدخل مطالبة لاختبار النموذج..."
                    className="flex-1 bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-tron-cyan placeholder:text-tron-dim focus:border-[rgba(0,240,255,0.5)]"
                    dir="rtl"
                    disabled={modelLoading}
                  />
                  <button
                    onClick={handleTryModel}
                    disabled={!prompt.trim() || modelLoading}
                    className="tron-button px-4 py-2 text-xs gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {modelLoading ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-tron-cyan border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>▶️</span>
                        <span>إرسال</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ─── Result Area ──────────────────────────────── */}
              <AnimatePresence>
                {(modelResult || modelLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="tron-label mb-2">النتيجة</h3>
                    <div
                      className="neon-border rounded-xl p-3 min-h-[80px] max-h-[200px] overflow-y-auto"
                      style={{ background: 'rgba(0,240,255,0.02)' }}
                    >
                      {modelLoading ? (
                        <div className="flex items-center gap-2 text-tron-muted text-sm">
                          <span className="inline-block w-4 h-4 border-2 border-tron-cyan border-t-transparent rounded-full animate-spin" />
                          <span>جاري المعالجة...</span>
                        </div>
                      ) : (
                        <p className="text-tron-cyan text-sm whitespace-pre-wrap leading-relaxed">
                          {modelResult}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══════════════════ ACTIONS TAB ═══════════════════ */}
          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-5"
            >
              {/* ─── Workflow List ────────────────────────────── */}
              <div>
                <h3 className="tron-label mb-3">مسارات العمل</h3>
                <div className="grid grid-cols-2 gap-2">
                  {WORKFLOWS.map((wf, index) => (
                    <motion.div
                      key={wf.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="card-glow neon-hover rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                    >
                      <span className="text-xl">{wf.icon}</span>
                      <span className="text-tron-cyan text-xs font-medium">{wf.name}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            wf.status === 'active'
                              ? 'bg-[rgba(0,255,136,0.8)] shadow-[0_0_6px_rgba(0,255,136,0.5)]'
                              : 'bg-[rgba(0,240,255,0.2)]'
                          }`}
                        />
                        <span className="text-[10px] text-tron-muted">
                          {wf.status === 'active' ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                      {wf.status === 'active' && (
                        <button
                          onClick={() => handleTriggerWorkflow(wf.id)}
                          disabled={triggeringWorkflow === wf.id}
                          className="tron-button text-[10px] px-2 py-0.5 gap-1 disabled:opacity-40"
                        >
                          {triggeringWorkflow === wf.id ? (
                            <span className="inline-block w-2.5 h-2.5 border border-tron-cyan border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>▶</span>
                              <span>تشغيل يدوي</span>
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ─── Trigger Feedback ─────────────────────────── */}
              <AnimatePresence>
                {triggeringWorkflow && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="neon-border rounded-lg p-3 bg-[rgba(0,240,255,0.04)] flex items-center gap-2"
                  >
                    <span className="inline-block w-4 h-4 border-2 border-tron-cyan border-t-transparent rounded-full animate-spin" />
                    <span className="text-tron-cyan text-sm">
                      جاري تشغيل مسار العمل &quot;{triggeringWorkflow}&quot;...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Recent Runs ──────────────────────────────── */}
              <div>
                <h3 className="tron-label mb-3">آخر التشغيلات</h3>
                <div className="space-y-2">
                  {workflowRuns.map((run, index) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-[rgba(0,240,255,0.06)] bg-[rgba(0,240,255,0.02)] hover:bg-[rgba(0,240,255,0.04)] transition-colors"
                    >
                      {/* Status dot */}
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: runStatusColor(run.status),
                          boxShadow: `0 0 6px ${runStatusColor(run.status)}60`,
                        }}
                      />
                      {/* Workflow name + status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-tron-cyan text-sm truncate">{run.workflow}</span>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              color: runStatusColor(run.status),
                              backgroundColor: `${runStatusColor(run.status)}15`,
                            }}
                          >
                            {runStatusLabel(run.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-tron-muted">
                          <span className="rtl-numbers">⏱ {run.duration}</span>
                          <span>·</span>
                          <span>{run.time}</span>
                        </div>
                      </div>
                      {/* Running indicator */}
                      {run.status === 'running' && (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-tron-cyan border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
