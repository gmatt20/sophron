import assert from 'node:assert/strict';
import test from 'node:test';
import type { RunCli } from './cli.js';
import { runCli } from './cli.js';
import type { ReflectionMoment } from './contracts.js';
import { GBrainExternalContextService } from './gbrain.js';
import { createSponsorServices } from './index.js';
import { MemorableProceduralMemoryService } from './memorable.js';

test('CLI runner preserves a spaced argument', async () => {
  assert.equal(
    await runCli('node' as 'memorable', [
      '-e',
      'process.stdout.write(process.argv.at(1))',
      'hello world',
    ]),
    'hello world',
  );
});

test('Memorable recalls only known guidance and learns only from helpful feedback', async () => {
  const calls: { args: string[]; stdin?: string }[] = [];
  const run: RunCli = async (_program, args, stdin) => {
    calls.push({ args, stdin });
    if (args[0] === 'recall') return '0.86 procedures/learned-advice [lexical]';
    if (args[0] === 'show') return 'Reference: SOPHRON_STRATEGY:offer-one-next-step';
    return 'stored';
  };
  const memory = new MemorableProceduralMemoryService(run);

  assert.match((await memory.recall('asking-for-advice'))[0], /offer one concrete next step/i);
  await memory.learn({
    context: 'asking-for-advice',
    strategy: 'offer-one-next-step',
    outcome: 'helpful',
  });
  const trace = JSON.parse(calls[2].stdin ?? '{}');
  assert.equal(trace.task_description, 'sophron reflection asking-for-advice');
  assert.equal(trace.tool_calls[0].result.ok, true);
  assert.equal(
    trace.tool_calls[0].input.command.includes('SOPHRON_STRATEGY:offer-one-next-step'),
    true,
  );
  await memory.learn({
    context: 'asking-for-advice',
    strategy: 'offer-one-next-step',
    outcome: 'unhelpful',
  });
  assert.deepEqual(await memory.recall('private raw note' as ReflectionMoment), []);
  assert.equal(calls.length, 3);
});

test('hosted GBrain reads workspace memory and calendar through scoped MCP', async () => {
  const calls: { method: string; name?: string; query?: string; headers: Headers }[] = [];
  const request: typeof fetch = async (_url, init) => {
    const body = JSON.parse(init!.body as string);
    const headers = new Headers(init!.headers);
    calls.push({
      method: body.method,
      name: body.params?.name,
      query: body.params?.arguments?.query,
      headers,
    });
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    const result =
      body.method === 'initialize'
        ? { protocolVersion: '2025-11-25' }
        : {
            content: [
              {
                type: 'text',
                text:
                  body.params.name === 'search'
                    ? 'Past plan: prepare an agenda'
                    : 'Meeting tomorrow',
              },
            ],
          };
    return new Response(`data: ${JSON.stringify({ jsonrpc: '2.0', id: body.id, result })}\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
        ...(body.method === 'initialize' ? { 'MCP-Session-Id': 'session-1' } : {}),
      },
    });
  };
  const context = new GBrainExternalContextService('local-test-token', request);
  assert.deepEqual(await context.getRelevantContext('upcoming meeting'), [
    '[GBrain memory] Past plan: prepare an agenda',
    '[GBrain calendar] Meeting tomorrow',
  ]);
  assert.deepEqual(
    calls.map((call) => call.method),
    ['initialize', 'notifications/initialized', 'tools/call', 'tools/call'],
  );
  assert.deepEqual(
    calls.filter((call) => call.method === 'tools/call').map((call) => [call.name, call.query]),
    [
      ['search', 'upcoming meeting'],
      ['gcal_list_events', 'upcoming meeting'],
    ],
  );
  assert.equal(calls[2].headers.get('MCP-Session-Id'), 'session-1');
  assert.equal(calls[2].headers.get('Authorization'), 'Bearer local-test-token');
});

test('disabled and failing sponsors leave the local path available', async () => {
  const disabled = createSponsorServices();
  assert.deepEqual(await disabled.proceduralMemory.recall('exploring'), []);
  assert.deepEqual(await disabled.externalContext.getRelevantContext('calendar'), []);
  await disabled.proceduralMemory.learn({
    context: 'exploring',
    strategy: 'find-pattern',
    outcome: 'helpful',
  });

  const failure: RunCli = async () => {
    throw new Error('provider offline');
  };
  assert.deepEqual(await new MemorableProceduralMemoryService(failure).recall('exploring'), []);
  await new MemorableProceduralMemoryService(failure).learn({
    context: 'exploring',
    strategy: 'find-pattern',
    outcome: 'helpful',
  });
  assert.deepEqual(
    await new GBrainExternalContextService('token', async () => {
      throw new Error('provider offline');
    }).getRelevantContext('meeting'),
    [],
  );
});
