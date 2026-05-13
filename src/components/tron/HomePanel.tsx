'use client';

import { useAppStore } from '@/store/useAppStore';

export default function HomePanel() {
  const { setActiveScreen } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* شعار TRON */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-2 border-[rgba(0,240,255,0.3)] flex items-center justify-center animate-pulse-glow">
          <span className="text-4xl neon-text font-bold">T</span>
        </div>
        <div className="absolute -inset-4 rounded-full border border-[rgba(0,240,255,0.08)] animate-grid-fade" />
      </div>

      <h2 className="neon-text text-2xl font-bold tracking-[0.3em] mb-2 animate-text-glow-pulse">
        TRON
      </h2>
      <p className="text-tron-muted text-sm mb-8">المتصفح الذكي</p>

      {/* أزرار الوصول السريع */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {[
          { icon: '🌐', label: 'تصفح الويب', screen: 'browser' as const },
          { icon: '💬', label: 'مساعد ذكي', screen: 'chat' as const },
          { icon: '⚡', label: 'المهارات', screen: 'skills' as const },
          { icon: '🔖', label: 'الإشارات', screen: 'bookmarks' as const },
        ].map((item) => (
          <button
            key={item.screen}
            className="card-glow p-4 flex flex-col items-center gap-2 neon-hover"
            onClick={() => setActiveScreen(item.screen)}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-tron-muted text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* شريط معلومات */}
      <div className="mt-10 tron-label text-center">
        <span className="rtl-numbers">v1.0.0</span> &bull; SYSTEM ONLINE
      </div>
    </div>
  );
}
