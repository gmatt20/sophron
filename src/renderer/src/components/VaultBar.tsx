import { useEffect } from 'react';
import { api } from '../lib/api';
import { useSession } from '../state/session';

export function VaultBar() {
  const vault = useSession((s) => s.vault);
  const setVault = useSession((s) => s.setVault);

  useEffect(() => {
    api.vault.get().then(setVault).catch(() => undefined);
  }, [setVault]);

  const pick = async () => {
    const next = await api.vault.pick();
    if (next) setVault(next);
  };

  return (
    <div className="no-drag flex items-center gap-3 text-[11px] text-bone-300">
      <button
        onClick={pick}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink-700 hover:border-ink-600 bg-ink-900/60 hover:bg-ink-850 transition-colors duration-200 ease-out-soft"
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="opacity-70 group-hover:opacity-100">
          <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3l1.5 2h4.5A2.5 2.5 0 0 1 17 8.5v6A2.5 2.5 0 0 1 14.5 17h-9A2.5 2.5 0 0 1 3 14.5v-8Z" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="tracking-wide">
          {vault ? vault.name : 'Choose vault'}
        </span>
      </button>
      {vault && (
        <span className="text-bone-400/60 font-mono truncate max-w-[280px]" title={vault.path}>
          {vault.path}
        </span>
      )}
    </div>
  );
}
