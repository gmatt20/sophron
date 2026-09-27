import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { VaultInfo } from '@shared/contracts';

/**
 * Ultra-simple JSON-backed vault preference store.
 * Persistence is intentionally minimal — this is not the source of truth for
 * note content; it just remembers the folder the user picked.
 */
class VaultStore {
  private cached: VaultInfo | null = null;
  private readonly file = join(app.getPath('userData'), 'vault.json');

  get(): VaultInfo | null {
    if (this.cached) return this.cached;
    if (!existsSync(this.file)) return null;
    try {
      this.cached = JSON.parse(readFileSync(this.file, 'utf8')) as VaultInfo;
      return this.cached;
    } catch {
      return null;
    }
  }

  set(info: VaultInfo): void {
    this.cached = info;
    writeFileSync(this.file, JSON.stringify(info, null, 2), 'utf8');
  }
}

export const vaultStore = new VaultStore();
