'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepResult {
  step: string;
  status: 'done' | 'running' | 'pending';
  result?: string;
}

type PanelMode = 'list' | 'create' | 'edit' | 'run';

// ─── Emoji Picker Options ─────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🔍', '📄', '🐦', '⚡', '🛡️', '📊', '🤖', '📧'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSteps(stepsJson: string): string[] {
  try {
    return JSON.parse(stepsJson) as string[];
  } catch {
    return [];
  }
}

function generateId(): string {
  return `skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SkillsPanel() {
  const skills = useAppStore((s) => s.skills);
  const addSkill = useAppStore((s) => s.addSkill);
  const removeSkill = useAppStore((s) => s.removeSkill);
  const updateSkill = useAppStore((s) => s.updateSkill);

  // Panel mode
  const [mode, setMode] = useState<PanelMode>('list');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('🔍');
  const [formSteps, setFormSteps] = useState<string[]>(['']);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Runner state
  const [runningSkillId, setRunningSkillId] = useState<string | null>(null);
  const [runSteps, setRunSteps] = useState<StepResult[]>([]);
  const [runProgress, setRunProgress] = useState(0);
  const [runCurrentIndex, setRunCurrentIndex] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Reset form ───────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormName('');
    setFormDescription('');
    setFormIcon('🔍');
    setFormSteps(['']);
    setEditingId(null);
  }, []);

  // ─── Start create mode ────────────────────────────────────────────────────

  const startCreate = useCallback(() => {
    resetForm();
    setMode('create');
  }, [resetForm]);

  // ─── Start edit mode ──────────────────────────────────────────────────────

  const startEdit = useCallback(
    (id: string) => {
      const skill = skills.find((s) => s.id === id);
      if (!skill) return;
      setFormName(skill.name);
      setFormDescription(skill.description);
      setFormIcon(skill.icon);
      setFormSteps(parseSteps(skill.steps));
      setEditingId(id);
      setMode('edit');
    },
    [skills]
  );

  // ─── Cancel form ──────────────────────────────────────────────────────────

  const cancelForm = useCallback(() => {
    resetForm();
    setMode('list');
  }, [resetForm]);

  // ─── Save skill (create or update) ────────────────────────────────────────

  const saveSkill = useCallback(async () => {
    if (!formName.trim()) return;

    const stepsToSave = formSteps.filter((s) => s.trim() !== '');
    const stepsJson = JSON.stringify(stepsToSave);

    if (editingId) {
      // Update
      updateSkill(editingId, {
        name: formName.trim(),
        description: formDescription.trim(),
        icon: formIcon,
        steps: stepsJson,
      });
      try {
        await fetch('/api/skills', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formName.trim(),
            description: formDescription.trim(),
            icon: formIcon,
            steps: stepsJson,
          }),
        });
      } catch {
        // Silently fail — local state is already updated
      }
    } else {
      // Create
      const newSkill = {
        id: generateId(),
        name: formName.trim(),
        description: formDescription.trim(),
        icon: formIcon,
        steps: stepsJson,
      };
      addSkill(newSkill);
      try {
        await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSkill),
        });
      } catch {
        // Silently fail — local state is already updated
      }
    }

    resetForm();
    setMode('list');
  }, [formName, formDescription, formIcon, formSteps, editingId, addSkill, updateSkill, resetForm]);

  // ─── Delete skill ─────────────────────────────────────────────────────────

  const deleteSkill = useCallback(
    async (id: string) => {
      removeSkill(id);
      try {
        await fetch('/api/skills', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      } catch {
        // Silently fail
      }
    },
    [removeSkill]
  );

  // ─── Run skill ────────────────────────────────────────────────────────────

  const runSkill = useCallback(
    (id: string) => {
      const skill = skills.find((s) => s.id === id);
      if (!skill) return;

      const steps = parseSteps(skill.steps);
      if (steps.length === 0) return;

      setRunningSkillId(id);
      setRunSteps(
        steps.map((step, i) => ({
          step,
          status: i === 0 ? ('running' as const) : ('pending' as const),
        }))
      );
      setRunProgress(0);
      setRunCurrentIndex(0);
      setMode('run');
    },
    [skills]
  );

  // Auto-advance runner
  useEffect(() => {
    if (mode !== 'run') return;

    const totalSteps = runSteps.length;
    if (runCurrentIndex >= totalSteps) return;

    // After delay, mark current as done and move to next
    runnerTimerRef.current = setTimeout(() => {
      const fakeResults = [
        'تم بنجاح ✓',
        'اكتملت العملية',
        'تم التحميل',
        'جاهز',
        'تم التنفيذ',
      ];

      const currentIndex = runCurrentIndex;
      const nextIndex = currentIndex + 1;
      const isLast = nextIndex >= totalSteps;

      setRunSteps((prev) =>
        prev.map((s, i) => {
          if (i === currentIndex) {
            return {
              ...s,
              status: 'done' as const,
              result: fakeResults[Math.floor(Math.random() * fakeResults.length)],
            };
          }
          if (i === nextIndex && !isLast) {
            return { ...s, status: 'running' as const };
          }
          return s;
        })
      );

      setRunProgress(Math.round((nextIndex / totalSteps) * 100));
      setRunCurrentIndex(nextIndex);
    }, 1200 + Math.random() * 800);

    return () => {
      if (runnerTimerRef.current) {
        clearTimeout(runnerTimerRef.current);
      }
    };
  }, [mode, runCurrentIndex, runSteps.length]);

  const cancelRun = useCallback(() => {
    if (runnerTimerRef.current) {
      clearTimeout(runnerTimerRef.current);
    }
    setRunningSkillId(null);
    setRunSteps([]);
    setRunProgress(0);
    setRunCurrentIndex(0);
    setMode('list');
  }, []);

  // ─── Step editor helpers ──────────────────────────────────────────────────

  const updateFormStep = useCallback((index: number, value: string) => {
    setFormSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }, []);

  const addFormStep = useCallback(() => {
    setFormSteps((prev) => [...prev, '']);
  }, []);

  const removeFormStep = useCallback((index: number) => {
    setFormSteps((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // ─── Export skills ────────────────────────────────────────────────────────

  const exportSkills = useCallback(() => {
    const data = JSON.stringify(skills, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tron-skills.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [skills]);

  // ─── Import skills ────────────────────────────────────────────────────────

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            imported.forEach((skill: { id?: string; name?: string; description?: string; steps?: string; icon?: string }) => {
              if (skill.name) {
                addSkill({
                  id: skill.id || generateId(),
                  name: skill.name,
                  description: skill.description || '',
                  steps: skill.steps || '[]',
                  icon: skill.icon || '⚡',
                });
              }
            });
          }
        } catch {
          // Invalid JSON — ignore
        }
      };
      reader.readAsText(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addSkill]
  );

  // ─── Get running skill info ──────────────────────────────────────────────

  const runningSkill = skills.find((s) => s.id === runningSkillId);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Header Row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,240,255,0.1)] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="neon-text text-lg font-bold animate-text-glow-pulse">
            المهارات
          </h2>
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.25)] text-tron-cyan text-xs font-mono">
            {skills.length}
          </span>
        </div>

        {mode === 'list' && (
          <button
            onClick={startCreate}
            className="tron-button text-xs gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>إنشاء مهارة</span>
          </button>
        )}
      </div>

      {/* ─── Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {/* ─── LIST MODE ──────────────────────────────────────────────── */}
          {mode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-3"
            >
              {skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3 opacity-40">⚡</span>
                  <p className="text-tron-muted text-sm">
                    لا توجد مهارات بعد
                  </p>
                  <p className="text-tron-dim text-xs mt-1">
                    أنشئ مهارة جديدة للبدء
                  </p>
                </div>
              ) : (
                skills.map((skill, index) => {
                  const steps = parseSteps(skill.steps);
                  return (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.3 }}
                      className="card-glow neon-hover rounded-xl p-4"
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 mt-0.5">
                          {skill.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-tron-cyan font-semibold text-sm truncate">
                            {skill.name}
                          </h3>
                          {skill.description && (
                            <p className="text-tron-muted text-xs mt-0.5 truncate">
                              {skill.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="tron-label">
                              {steps.length} خطوة
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(0,240,255,0.08)]">
                        <button
                          onClick={() => runSkill(skill.id)}
                          className="tron-button text-xs gap-1 flex-1 py-1.5"
                          title="تشغيل"
                        >
                          <span>▶️</span>
                          <span>تشغيل</span>
                        </button>
                        <button
                          onClick={() => startEdit(skill.id)}
                          className="tron-button text-xs gap-1 flex-1 py-1.5"
                          title="تعديل"
                        >
                          <span>✏️</span>
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="tron-button-magenta tron-button text-xs gap-1 flex-1 py-1.5"
                          title="حذف"
                        >
                          <span>🗑️</span>
                          <span>حذف</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ─── CREATE / EDIT MODE ─────────────────────────────────────── */}
          {(mode === 'create' || mode === 'edit') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* Section label */}
              <div className="tron-label">
                {mode === 'create' ? 'إنشاء مهارة جديدة' : 'تعديل المهارة'}
              </div>

              {/* Skill name */}
              <div>
                <label className="block text-tron-muted text-xs mb-1.5">
                  اسم المهارة
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="أدخل اسم المهارة..."
                  className="w-full bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-tron-cyan placeholder:text-tron-dim focus:border-[rgba(0,240,255,0.5)]"
                  dir="rtl"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-tron-muted text-xs mb-1.5">
                  الوصف
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر للمهارة..."
                  className="w-full bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-tron-cyan placeholder:text-tron-dim focus:border-[rgba(0,240,255,0.5)]"
                  dir="rtl"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-tron-muted text-xs mb-1.5">
                  الأيقونة
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-all duration-200 ${
                        formIcon === emoji
                          ? 'border-[rgba(0,240,255,0.5)] bg-[rgba(0,240,255,0.12)] neon-glow'
                          : 'border-[rgba(0,240,255,0.1)] bg-[rgba(0,240,255,0.02)] hover:border-[rgba(0,240,255,0.3)] hover:bg-[rgba(0,240,255,0.06)]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steps editor */}
              <div>
                <label className="block text-tron-muted text-xs mb-1.5">
                  الخطوات
                </label>
                <div className="space-y-2">
                  <AnimatePresence>
                    {formSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-tron-dim text-xs font-mono w-5 text-center shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) =>
                            updateFormStep(index, e.target.value)
                          }
                          placeholder={`الخطوة ${index + 1}...`}
                          className="flex-1 bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.15)] rounded-lg px-3 py-2 text-sm text-tron-cyan placeholder:text-tron-dim focus:border-[rgba(0,240,255,0.5)]"
                          dir="rtl"
                        />
                        {formSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFormStep(index)}
                            className="shrink-0 w-7 h-7 rounded-md border border-[rgba(255,0,170,0.2)] bg-[rgba(255,0,170,0.05)] text-tron-magenta text-xs flex items-center justify-center hover:bg-[rgba(255,0,170,0.12)] hover:border-[rgba(255,0,170,0.4)] transition-all duration-200"
                            title="حذف الخطوة"
                          >
                            ✕
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={addFormStep}
                  className="mt-2 tron-button text-xs gap-1"
                >
                  <span className="text-sm leading-none">+</span>
                  <span>إضافة خطوة</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveSkill}
                  disabled={!formName.trim()}
                  className="tron-button flex-1 py-2 text-sm gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span>💾</span>
                  <span>حفظ</span>
                </button>
                <button
                  onClick={cancelForm}
                  className="tron-button-magenta tron-button flex-1 py-2 text-sm gap-1.5"
                >
                  <span>✕</span>
                  <span>إلغاء</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── RUN MODE ───────────────────────────────────────────────── */}
          {mode === 'run' && runningSkill && (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* Runner header */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{runningSkill.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-tron-cyan font-semibold text-sm truncate">
                    {runningSkill.name}
                  </h3>
                  <p className="text-tron-dim text-xs">جاري التنفيذ...</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="tron-label">التقدم</span>
                  <span className="tron-label rtl-numbers">
                    {runProgress}%
                  </span>
                </div>
                <div className="h-2 bg-[rgba(0,240,255,0.06)] rounded-full overflow-hidden border border-[rgba(0,240,255,0.1)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(0,240,255,0.4), rgba(0,240,255,0.8))',
                      boxShadow:
                        '0 0 8px rgba(0,240,255,0.5), 0 0 16px rgba(0,240,255,0.2)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${runProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Steps list */}
              <div className="space-y-2">
                {runSteps.map((stepResult, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className={`rounded-lg p-3 border transition-all duration-300 ${
                      stepResult.status === 'done'
                        ? 'border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.04)]'
                        : stepResult.status === 'running'
                          ? 'border-[rgba(0,240,255,0.4)] bg-[rgba(0,240,255,0.06)] neon-glow animate-pulse-glow'
                          : 'border-[rgba(0,240,255,0.08)] bg-[rgba(0,240,255,0.02)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Status indicator */}
                      <span className="text-sm shrink-0">
                        {stepResult.status === 'done' ? (
                          '✅'
                        ) : stepResult.status === 'running' ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-tron-cyan border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="inline-block w-3.5 h-3.5 rounded-full border border-[rgba(0,240,255,0.2)]" />
                        )}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-tron-dim text-xs font-mono">
                            {index + 1}.
                          </span>
                          <span
                            className={`text-sm ${
                              stepResult.status === 'done'
                                ? 'text-[rgba(0,255,136,0.8)]'
                                : stepResult.status === 'running'
                                  ? 'text-tron-cyan'
                                  : 'text-tron-muted'
                            }`}
                          >
                            {stepResult.step}
                          </span>
                        </div>
                        {stepResult.result && (
                          <p className="text-tron-muted text-xs mt-1 mr-6">
                            {stepResult.result}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Complete / Cancel */}
              {runProgress >= 100 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-3"
                >
                  <div className="neon-border rounded-lg p-4 bg-[rgba(0,255,136,0.03)]">
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-[rgba(0,255,136,0.8)] text-sm font-semibold">
                      تم تنفيذ المهارة بنجاح!
                    </p>
                  </div>
                  <button
                    onClick={cancelRun}
                    className="tron-button w-full py-2 text-sm"
                  >
                    عودة
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={cancelRun}
                  className="tron-button-magenta tron-button w-full py-2 text-sm gap-1.5"
                >
                  <span>⏹</span>
                  <span>إيقاف</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Import/Export Footer ──────────────────────────────────────────── */}
      {mode === 'list' && (
        <div className="shrink-0 px-4 py-3 border-t border-[rgba(0,240,255,0.1)] flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="tron-button text-xs flex-1 py-1.5 gap-1"
          >
            <span>📥</span>
            <span>استيراد</span>
          </button>
          <button
            onClick={exportSkills}
            className="tron-button text-xs flex-1 py-1.5 gap-1"
          >
            <span>📤</span>
            <span>تصدير</span>
          </button>

          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            aria-label="استيراد مهارات من ملف JSON"
          />
        </div>
      )}
    </div>
  );
}
