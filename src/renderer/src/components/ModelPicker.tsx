import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/**
 * Sidebar control to choose which local Ollama model does the reasoning.
 * Models are discovered from the running Ollama; picking one switches it at
 * runtime. Hidden entirely if no models are found.
 */
export function ModelPicker() {
  const [models, setModels] = useState<string[]>([]);
  const [current, setCurrent] = useState('');

  useEffect(() => {
    let live = true;
    Promise.all([api.models.list(), api.models.get()])
      .then(([list, cur]) => {
        if (!live) return;
        setModels(list);
        setCurrent(cur);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const onChange = async (name: string) => {
    setCurrent(name);
    try {
      await api.models.set(name);
    } catch {
      // keep the optimistic selection; nothing else to do locally
    }
  };

  if (models.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-[12px] text-fg-muted" title="Reasoning model">
      <span className="w-9 text-fg-faint shrink-0">model</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-fg-muted hover:text-fg outline-none cursor-pointer truncate"
      >
        {models.map((m) => (
          <option key={m} value={m} className="bg-paper text-fg">
            {m}
          </option>
        ))}
      </select>
    </label>
  );
}
