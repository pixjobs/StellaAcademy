'use client';

interface ConsoleLogsProps {
  logs: string[];
}

export default function ConsoleLogs({ logs }: ConsoleLogsProps) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col h-[280px]">
      <h3 className="text-md font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span> Telemetry Logs
      </h3>
      <div className="flex-1 bg-slate-950/80 p-3 rounded-lg overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1">
        {logs.length === 0 ? (
          <span className="text-slate-600 italic font-sans">Waiting for launch ignition...</span>
        ) : (
          logs.map((entry, idx) => <div key={idx}>{entry}</div>)
        )}
      </div>
    </div>
  );
}
