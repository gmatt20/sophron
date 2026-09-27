import type { ExternalContextService } from './contracts.js';

const endpoint = 'https://gbrain.io/mcp';
const protocolVersion = '2025-11-25';

type JsonRpc = { id?: number; result?: unknown; error?: unknown };
type ToolResult = { isError?: boolean; content?: { type?: string; text?: string }[] };

function snippets(result: ToolResult | undefined, label: string): string[] {
  if (result?.isError || !Array.isArray(result?.content)) return [];
  return result.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .slice(0, 3)
    .map((block) => `[GBrain ${label}] ${block.text!.trim().slice(0, 500)}`)
    .filter((value) => value !== `[GBrain ${label}] `);
}

async function readResponse(response: Response, id: number): Promise<JsonRpc> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty GBrain response');
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  const events = response.headers.get('content-type')?.includes('text/event-stream');

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 64_000) throw new Error('GBrain response too large');
    text += decoder.decode(chunk.value, { stream: true }).replace(/\r\n/g, '\n');
    if (events) {
      let boundary: number;
      while ((boundary = text.indexOf('\n\n')) !== -1) {
        const event = text.slice(0, boundary);
        text = text.slice(boundary + 2);
        const data = event
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (!data) continue;
        const message: JsonRpc = JSON.parse(data);
        if (message.id === id) {
          await reader.cancel();
          return message;
        }
      }
    }
  }

  if (events) throw new Error('Missing GBrain result');
  const message: JsonRpc = JSON.parse(text);
  if (message.id !== id) throw new Error('Mismatched GBrain result');
  return message;
}

export class GBrainExternalContextService implements ExternalContextService {
  constructor(
    private readonly token: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async getRelevantContext(query: string): Promise<string[]> {
    // The caller supplies a short topic, never a transcript or raw local note.
    if (!this.token || !query.trim() || query.length > 120 || /[\r\n]/.test(query)) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    let session: string | null = null;
    let version = protocolVersion;

    const post = async (message: object, id?: number): Promise<unknown> => {
      const response = await this.request(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          ...(session ? { 'MCP-Session-Id': session } : {}),
          ...(session || id !== 1 ? { 'MCP-Protocol-Version': version } : {}),
        },
        body: JSON.stringify(message),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`GBrain HTTP ${response.status}`);
      if (id === undefined) return undefined;
      if (id === 1) session = response.headers.get('MCP-Session-Id');
      const rpc = await readResponse(response, id);
      if (rpc.error || !rpc.result) throw new Error('GBrain request failed');
      return rpc.result;
    };

    try {
      const initialized = (await post(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion,
            capabilities: {},
            clientInfo: { name: 'sophron', version: '0.1.0' },
          },
        },
        1,
      )) as { protocolVersion?: string };
      version = initialized.protocolVersion ?? protocolVersion;
      if (!['2025-11-25', '2025-06-18', '2025-03-26'].includes(version)) return [];
      await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
      const [memory, calendar] = await Promise.allSettled([
        post(
          {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: { name: 'search', arguments: { query: query.trim(), limit: 3 } },
          },
          2,
        ),
        post(
          {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: { name: 'gcal_list_events', arguments: { query: query.trim() } },
          },
          3,
        ),
      ]);
      return [
        ...snippets(
          memory.status === 'fulfilled' ? (memory.value as ToolResult) : undefined,
          'memory',
        ),
        ...snippets(
          calendar.status === 'fulfilled' ? (calendar.value as ToolResult) : undefined,
          'calendar',
        ),
      ];
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}
