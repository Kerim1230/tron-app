'use client';

export default function BrowserPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <span className="text-5xl mb-4">🌐</span>
      <h3 className="neon-text text-lg font-bold mb-2">المتصفح الذكي</h3>
      <p className="text-tron-muted text-sm">تصفح الويب بالذكاء الاصطناعي</p>
      <div className="mt-6 w-full max-w-xs">
        <div className="neon-border rounded-lg p-4">
          <p className="tron-label mb-2">أدخل رابط URL</p>
          <div className="h-8 bg-[rgba(0,240,255,0.03)] rounded border border-[rgba(0,240,255,0.1)]" />
        </div>
      </div>
    </div>
  );
}
