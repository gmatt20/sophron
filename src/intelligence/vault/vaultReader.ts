import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep, basename } from 'node:path';
import { config } from '../config.js';

/** A single Markdown note read from the vault. The vault is never modified. */
export interface VaultNote {
  /** Vault-relative path with POSIX separators, e.g. "learning/graphs.md". */
  path: string;
  /** Base filename, e.g. "graphs.md". */
  filename: string;
  /** Note body with any frontmatter block stripped off. */
  content: string;
  /** File modified time as an ISO string. */
  modified: string;
  /** Best-effort ISO date: frontmatter `date` if present, else the mtime. */
  date: string;
  /** Best-effort frontmatter key/values (string-valued only). */
  frontmatter: Record<string, string>;
}

/** Directories we never descend into. */
const IGNORED_DIRS = new Set(['.git', '.obsidian', 'node_modules', '.trash']);

/**
 * Split a leading `---` YAML frontmatter block from the body and pull out
 * simple `key: value` pairs. Intentionally minimal — enough to recover a date,
 * not a full YAML parser.
 */
function parseFrontmatter(raw: string): { body: string; frontmatter: Record<string, string> } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    return { body: raw, frontmatter: {} };
  }

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (kv) {
      frontmatter[kv[1].toLowerCase()] = kv[2].trim();
    }
  }

  return { body: raw.slice(match[0].length), frontmatter };
}

/** Turn an OS path separator into POSIX so vault paths are stable across platforms. */
function toPosix(p: string): string {
  return p.split(sep).join('/');
}

async function parseNote(vaultRoot: string, absolutePath: string): Promise<VaultNote> {
  const [raw, stats] = await Promise.all([readFile(absolutePath, 'utf8'), stat(absolutePath)]);
  const { body, frontmatter } = parseFrontmatter(raw);
  const modified = stats.mtime.toISOString();

  return {
    path: toPosix(relative(vaultRoot, absolutePath)),
    filename: basename(absolutePath),
    content: body.trim(),
    modified,
    date: frontmatter.date ?? modified,
    frontmatter,
  };
}

/** Recursively collect absolute paths of every `.md` file under a directory. */
async function collectMarkdownPaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && !entry.isFile()) continue;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      paths.push(...(await collectMarkdownPaths(join(dir, entry.name))));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      paths.push(join(dir, entry.name));
    }
  }

  return paths;
}

/**
 * Read every Markdown note under the vault, recursively. Read-only.
 * Defaults to the configured vault path.
 */
export async function readVault(vaultPath: string = config.vaultPath): Promise<VaultNote[]> {
  const paths = await collectMarkdownPaths(vaultPath);
  const notes = await Promise.all(paths.map((p) => parseNote(vaultPath, p)));
  // Newest first — a stable, useful default ordering.
  return notes.sort((a, b) => b.modified.localeCompare(a.modified));
}

/**
 * Read a single note by its vault-relative path (used by the read_note tool).
 * Throws if the resolved path escapes the vault.
 */
export async function readNoteByPath(
  relativePath: string,
  vaultPath: string = config.vaultPath,
): Promise<VaultNote> {
  const absolute = join(vaultPath, relativePath);
  const normalizedRoot = toPosix(vaultPath);
  if (!toPosix(absolute).startsWith(normalizedRoot)) {
    throw new Error(`Refusing to read outside the vault: ${relativePath}`);
  }
  return parseNote(vaultPath, absolute);
}
