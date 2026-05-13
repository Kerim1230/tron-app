'use client';

export default function HomePanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* TRON Logo */}
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {[
          { icon: '🌐', label: 'تصفح الويب', screen: 'browser' },
          { icon: '💬', label: 'مساعد ذكي', screen: 'chat' },
          { icon: '⚡', label: 'المهارات', screen: 'skills' },
          { icon: '🔖', label: 'الإشارات', screen: 'bookmarks' },
        ].map((item) => (
          <button
            key={item.screen}
            className="card-glow p-4 flex flex-col items-center gap-2 neon-hover"
            onClick={() => {
              // Will be wired up via store in the real component
            }}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-tron-muted text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Decorative data stream */}
      <div className="mt-10 tron-label text-center">
        <span className="rtl-numbers">v1.0.0</span> &bull; SYSTEM ONLINE
      </div>
    </div>
  );
}
