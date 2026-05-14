import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = 'home' | 'browser' | 'chat' | 'skills' | 'bookmarks' | 'history' | 'github';

interface BrowserStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
}

interface BrowserState {
  url: string;
  title: string;
  content: string;
  steps: BrowserStep[];
  isLoading: boolean;
  error: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  steps: string; // JSON string
  icon: string;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface AppStore {
  // State
  activeScreen: Screen;
  browser: BrowserState;
  chatMessages: ChatMessage[];
  chatModel: string;
  chatLoading: boolean;
  skills: Skill[];

  // Actions
  setActiveScreen: (screen: Screen) => void;
  setBrowserUrl: (url: string) => void;
  setBrowserState: (partial: Partial<BrowserState>) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setChatModel: (model: string) => void;
  setChatLoading: (loading: boolean) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, partial: Partial<Skill>) => void;
}

// ─── Default Skills ──────────────────────────────────────────────────────────

const defaultSkills: Skill[] = [
  {
    id: 'skill-google-search',
    name: 'بحث جوجل',
    description: 'البحث في جوجل تلقائياً',
    steps: JSON.stringify([
      'فتح متصفح جوجل',
      'إدخال كلمة البحث',
      'عرض النتائج',
    ]),
    icon: '🔍',
  },
  {
    id: 'skill-summarize-page',
    name: 'تلخيص صفحة',
    description: 'تلخيص محتوى صفحة ويب',
    steps: JSON.stringify([
      'فتح الصفحة المطلوبة',
      'استخراج المحتوى',
      'تلخيص النص',
    ]),
    icon: '📄',
  },
  {
    id: 'skill-post-tweet',
    name: 'نشر تغريدة',
    description: 'كتابة ونشر تغريدة',
    steps: JSON.stringify([
      'فتح تويتر',
      'كتابة التغريدة',
      'نشر التغريدة',
    ]),
    icon: '🐦',
  },
];

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set) => ({
  // State
  activeScreen: 'home',
  browser: {
    url: '',
    title: '',
    content: '',
    steps: [],
    isLoading: false,
    error: null,
  },
  chatMessages: [],
  chatModel: 'deepseek/deepseek-chat-v3-0324:free',
  chatLoading: false,
  skills: defaultSkills,

  // Actions
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  setBrowserUrl: (url) =>
    set((state) => ({
      browser: { ...state.browser, url },
    })),

  setBrowserState: (partial) =>
    set((state) => ({
      browser: { ...state.browser, ...partial },
    })),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),

  clearChat: () => set({ chatMessages: [] }),

  setChatModel: (model) => set({ chatModel: model }),

  setChatLoading: (loading) => set({ chatLoading: loading }),

  addSkill: (skill) =>
    set((state) => ({
      skills: [...state.skills, skill],
    })),

  removeSkill: (id) =>
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
    })),

  updateSkill: (id, partial) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
    })),
}));
