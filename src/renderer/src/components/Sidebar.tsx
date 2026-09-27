import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { entryStamp } from '../lib/format';
import { useSession } from '../state/session';
import { useTheme, type ThemePref } from '../state/theme';
import { AutoIcon, CloseIcon, FolderIcon, MoonIcon, PenIcon, SunIcon } from './Icons';

export function Sidebar() {
  const entries = useSession((s) => s.entries);
  const activeId = useSession((s) => s.activeId);
  const newEntry = useSession((s) => s.newEntry);
  const selectEntry = useSession((s) => s.selectEntry);
  const deleteEntry = useSession((s) => s.deleteEntry);
  const busy = useSession((s) => s.phase.kind !== 'idle' && s.phase.kind !== 'ready' && s.phase.kind !== 'error');

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-paper-deep border-r border-line">
      {/* Clearance for the macOS traffic lights. */}
      <div className="drag-region h-12 shrink-0" />

      <div className="px-5 pb-5">
        <div className="font-display text-[28px] leading-none text-fg">Sophron</div>
      </div>

      <button
        onClick={newEntry}
        disabled={busy}
        className="no-drag mx-5 mb-4 flex items-center gap-2 text-[12.5px] text-accent-text hover:opacity-80 disabled:opacity-40 transition-opacity"
      >
        <PenIcon />
        New entry
      </button>

      <nav className="no-drag flex-1 overflow-y-auto px-5">
        {entries.length === 0 && (
          <p className="py-3 font-serif italic text-[14px] text-fg-muted">
            Your entries will collect here.
          </p>
        )}
        {entries.map((e) => {
          const active = e.id === activeId;
          return (
            <div key={e.id} className="group relative border-b border-line">
              <button
                onClick={() => selectEntry(e.id)}
                disabled={busy}
                className="w-full text-left py-2.5 pr-5 disabled:cursor-wait"
              >
                <span
                  className={[
                    'block font-serif text-[15px] leading-snug truncate',
                    active ? 'italic text-accent-text' : 'text-fg'
                  ].join(' ')}
                >
                  {e.title}
                </span>
                <span className="block text-[11px] text-fg-muted">{entryStamp(e.updatedAt)}</span>
              </button>
              <button
                onClick={() => deleteEntry(e.id)}
                disabled={busy}
                aria-label={`Delete “${e.title}”`}
                className="absolute right-0 top-3 p-1 rounded text-fg-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-fg transition-opacity"
              >
                <CloseIcon />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="no-drag border-t border-line px-4 py-3 flex items-center gap-2">
        <VaultButton />
        <ThemeButton />
      </div>
    </aside>
  );
}

function VaultButton() {
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
    <button
      onClick={pick}
      title={vault?.path ?? 'Choose an Obsidian vault'}
      className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-fg-muted hover:text-fg hover:bg-paper transition-colors"
    >
      <FolderIcon className="shrink-0" />
      <span className="truncate">{vault ? vault.name : 'Choose vault'}</span>
    </button>
  );
}

const THEME_META: Record<ThemePref, { label: string; Icon: typeof SunIcon }> = {
  system: { label: 'Theme: match system', Icon: AutoIcon },
  light: { label: 'Theme: paper (light)', Icon: SunIcon },
  dark: { label: 'Theme: ink (dark)', Icon: MoonIcon }
};

function ThemeButton() {
  const pref = useTheme((s) => s.pref);
  const cycle = useTheme((s) => s.cycle);
  const [version, setVersion] = useState('');
  const { label, Icon } = THEME_META[pref];

  useEffect(() => {
    api.app.version().then(setVersion).catch(() => setVersion(''));
  }, []);

  return (
    <button
      onClick={cycle}
      title={version ? `${label} · v${version}` : label}
      aria-label={label}
      className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-paper transition-colors"
    >
      <Icon />
    </button>
  );
}
