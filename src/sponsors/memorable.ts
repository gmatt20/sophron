import { randomUUID } from 'node:crypto';
import type { RunCli } from './cli.js';
import { runCli } from './cli.js';
import type { ProceduralMemoryService, ReflectionMoment, ReflectionStrategy } from './contracts.js';

const strategies: Record<ReflectionStrategy, string> = {
  'compare-beliefs': 'Compare the current belief with an older belief, then ask what changed.',
  'ask-what-changed': 'Ask what changed between the earlier and current situation.',
  'challenge-assumption': 'Gently test an assumption that appears repeatedly.',
  'surface-contradiction': 'Name a contradiction without judging it, then invite reflection.',
  'find-pattern': 'Point out a pattern across reflections and ask what it might mean.',
  'offer-gentle-reframe': 'Offer one tentative alternative interpretation, then ask if it fits.',
  'offer-one-next-step':
    'When the user asks for advice or is ready to act, offer one concrete next step, then ask one question.',
};

const moments = new Set<ReflectionMoment>([
  'exploring',
  'revisiting-belief',
  'repeated-pattern',
  'feeling-stuck',
  'asking-for-advice',
  'ready-to-act',
]);

export class MemorableProceduralMemoryService implements ProceduralMemoryService {
  constructor(private readonly run: RunCli = runCli) {}

  async recall(context: ReflectionMoment): Promise<string[]> {
    if (!moments.has(context)) return [];
    try {
      const output = await this.run('memorable', [
        'recall',
        '--single',
        `sophron reflection ${context}`,
      ]);
      const slug = output.match(/procedures\/[\w/-]+/)?.[0];
      if (!slug) return [];
      const procedure = await this.run('memorable', ['show', slug]);
      const strategy = procedure.match(/SOPHRON_STRATEGY:([a-z-]+)/)?.[1] as
        ReflectionStrategy | undefined;
      return strategy && Object.hasOwn(strategies, strategy) ? [strategies[strategy]] : [];
    } catch {
      return [];
    }
  }

  async learn(input: {
    context: ReflectionMoment;
    strategy: ReflectionStrategy;
    outcome?: 'helpful' | 'unhelpful';
  }): Promise<void> {
    if (
      input.outcome !== 'helpful' ||
      !moments.has(input.context) ||
      !Object.hasOwn(strategies, input.strategy)
    )
      return;
    try {
      const trace = {
        session_id: randomUUID(),
        task_description: `sophron reflection ${input.context}`,
        harness: 'sophron',
        tool_calls: [
          {
            name: 'guidance',
            input: { command: `SOPHRON_STRATEGY:${input.strategy} ${strategies[input.strategy]}` },
            result: { ok: true },
          },
        ],
      };
      await this.run('memorable', ['ingest', '-'], JSON.stringify(trace));
    } catch {
      // Sponsor failure must not interrupt a local reflection.
    }
  }
}
