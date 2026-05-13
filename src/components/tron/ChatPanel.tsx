'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

// ─── Model Definitions ────────────────────────────────────────────────────────

const AI_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'claude-3.5-sonnet', label: 'Claude 3.5' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
  { id: 'llama-3.1-70b', label: 'Llama 3.1' },
] as const;

// ─── Quick Action Definitions ─────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'شرح لي', prefix: 'شرح لي بالتفصيل: ' },
  { label: 'ترجم النص', prefix: 'ترجم النص التالي: ' },
  { label: 'اكتب كود', prefix: 'اكتب كود لـ: ' },
  { label: 'حل مشكلة', prefix: 'ساعدني في حل هذه المشكلة: ' },
] as const;

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────

function renderMarkdown(text: string) {
  // Split into lines and process
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${codeIndex++}`}
            className="my-2 p-3 rounded-md bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] overflow-x-auto"
          >
            <code className="text-sm text-tron-cyan font-mono ltr rtl-numbers" dir="ltr">
              {codeContent.trim()}
            </code>
          </pre>
        );
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-tron-cyan font-bold text-sm mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-tron-cyan font-bold text-base mt-3 mb-1">
          {line.slice(3)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-tron-cyan font-bold text-lg mt-3 mb-1">
          {line.slice(2)}
        </h2>
      );
      continue;
    }

    // Bold + inline code
    const processed = line
      .replace(/\*\*(.*?)\*\*/g, '<b class="text-tron-cyan">$1</b>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-[rgba(0,240,255,0.08)] text-tron-cyan text-xs font-mono">$1</code>');

    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 mr-2">
          <span className="text-tron-cyan mt-1 shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
        </div>
      );
    } else {
      elements.push(
        <span key={`p-${i}`} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    }
  }

  return <>{elements}</>;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start px-4 py-2">
      <div className="w-7 h-7 rounded-full bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)] flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-tron-cyan" />
      </div>
      <div className="neon-border rounded-xl rounded-tr-sm px-4 py-3 bg-[rgba(0,240,255,0.03)]">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-tron-cyan"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────

export default function ChatPanel() {
  const {
    chatMessages,
    chatModel,
    chatLoading,
    addChatMessage,
    setChatModel,
    setChatLoading,
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // ─── Send Message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || chatLoading) return;

    // Add user message
    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: 'user' as const,
      content: trimmed,
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setInputValue('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          model: chatModel,
          history: chatMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(`خطأ في الخادم: ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant' as const,
        content: data.reply || data.message || data.content || 'لم أتمكن من معالجة الطلب.',
        timestamp: Date.now(),
      };
      addChatMessage(assistantMsg);
    } catch (err) {
      const errorMsg = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant' as const,
        content: `حدث خطأ أثناء الاتصال بالمساعد. يرجى المحاولة مرة أخرى.`,
        timestamp: Date.now(),
      };
      addChatMessage(errorMsg);
    } finally {
      setChatLoading(false);
    }
  }, [inputValue, chatLoading, chatModel, chatMessages, addChatMessage, setChatLoading]);

  // ─── Quick Action Click ────────────────────────────────────────────────────

  const handleQuickAction = (prefix: string) => {
    setInputValue(prefix);
    inputRef.current?.focus();
  };

  // ─── Format Time ───────────────────────────────────────────────────────────

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ── Model Selector ── */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {AI_MODELS.map((model) => {
            const isActive = chatModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => setChatModel(model.id)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-300 cursor-pointer
                  ${
                    isActive
                      ? 'bg-[rgba(0,240,255,0.12)] border-[rgba(0,240,255,0.5)] text-tron-cyan animate-pulse-glow'
                      : 'bg-[rgba(0,240,255,0.03)] border-[rgba(0,240,255,0.12)] text-tron-muted hover:bg-[rgba(0,240,255,0.06)] hover:border-[rgba(0,240,255,0.25)]'
                  }
                `}
              >
                {isActive && <Sparkles className="w-3 h-3 inline-block ml-1" />}
                {model.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quick Action Chips ── */}
      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prefix)}
              className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium
                bg-[rgba(255,0,170,0.06)] border border-[rgba(255,0,170,0.2)]
                text-tron-magenta
                hover:bg-[rgba(255,0,170,0.12)] hover:border-[rgba(255,0,170,0.4)]
                transition-all duration-300 cursor-pointer"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="tron-divider mx-4" />

      {/* ── Chat Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {chatMessages.length === 0 && !chatLoading ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center animate-pulse-glow">
                <Bot className="w-10 h-10 text-tron-cyan" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border border-[rgba(0,240,255,0.08)] animate-ping" />
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <p className="neon-text text-base font-bold mb-1">ابدأ محادثة مع المساعد الذكي</p>
              <p className="text-tron-muted text-xs">اختر نموذجًا واكتب رسالتك للبدء</p>
            </motion.div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {chatMessages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm
                        ${
                          isUser
                            ? 'bg-[rgba(255,0,170,0.12)] border border-[rgba(255,0,170,0.25)]'
                            : 'bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)]'
                        }
                      `}
                    >
                      {isUser ? (
                        <User className="w-3.5 h-3.5 text-tron-magenta" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-tron-cyan" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed
                        ${
                          isUser
                            ? 'bg-[rgba(255,0,170,0.08)] border border-[rgba(255,0,170,0.2)] rounded-tl-sm neon-border-magenta'
                            : 'bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.15)] rounded-tr-sm neon-border'
                        }
                      `}
                    >
                      <div className={`${isUser ? 'text-[#e0f7fa]' : 'text-[rgba(224,247,250,0.9)]'}`}>
                        {isUser ? msg.content : renderMarkdown(msg.content)}
                      </div>
                      <div
                        className={`mt-1.5 text-[10px] font-mono ${
                          isUser ? 'text-[rgba(255,0,170,0.4)]' : 'text-[rgba(0,240,255,0.35)]'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            {chatLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="اكتب رسالتك..."
            disabled={chatLoading}
            className="flex-1 h-11 px-4 pr-4 rounded-xl
              bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.15)]
              text-[#e0f7fa] text-sm placeholder:text-tron-dim
              focus:border-[rgba(0,240,255,0.4)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300"
            dir="rtl"
          />

          <motion.button
            onClick={handleSend}
            disabled={chatLoading || !inputValue.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-11 h-11 rounded-xl flex items-center justify-center shrink-0
              border transition-all duration-300 cursor-pointer
              ${
                chatLoading || !inputValue.trim()
                  ? 'bg-[rgba(0,240,255,0.03)] border-[rgba(0,240,255,0.1)] text-tron-dim cursor-not-allowed'
                  : 'bg-[rgba(0,240,255,0.1)] border-[rgba(0,240,255,0.4)] text-tron-cyan hover:bg-[rgba(0,240,255,0.18)] hover:border-[rgba(0,240,255,0.6)] neon-glow'
              }
            `}
          >
            {chatLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 rtl-flip" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
