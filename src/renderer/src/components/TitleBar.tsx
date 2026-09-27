import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function TitleBar() {
  const [version, setVersion] = useState<string>('');
  useEffect(() => {
    api.app.version().then(setVersion).catch(() => setVersion(''));
  }, []);

  return (
    <header className="drag-region h-11 flex items-center justify-between px-5 border-b border-ink-800/70 bg-ink-950/70 backdrop-blur">
      <div className="w-16" />
      <div className="flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bone-300">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(139,92,246,0.65)]" />
        Sophron
      </div>
      <div className="w-16 text-right text-[10px] text-bone-400/70 font-mono">
        {version && `v${version}`}
      </div>
    </header>
  );
}
