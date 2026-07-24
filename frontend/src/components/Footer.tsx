'use client';

export default function Footer() {
  return (
    <footer className="relative z-50 w-full border-t border-white/10 bg-slate-950/75 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span>STELLA ACADEMY // LEARNING PLATFORM</span>
        </div>
        <div className="text-slate-400 text-center md:text-right text-[11px] font-sans">
          <span>AI Assistance Notice: Content &amp; visual models are created for educational exploration — verify primary sources for formal academic use.</span>
        </div>
      </div>
    </footer>
  );
}
