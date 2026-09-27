# Optional sponsor context

`createSponsorServices()` exposes `proceduralMemory` and `externalContext` without coupling either provider to `reflect()`. With no options, both return empty arrays and `learn()` does nothing.

```ts
import { createSponsorServices, type ReflectionContext } from '../sponsors/index.js';

const sponsors = createSponsorServices({
  enableMemorable: true,
  gbrainToken: process.env.GBRAIN_MCP_TOKEN,
});
const [proceduralMemory, externalContext] = await Promise.all([
  sponsors.proceduralMemory.recall('asking-for-advice'),
  sponsors.externalContext.getRelevantContext('upcoming meeting'),
]);
const optionalContext: ReflectionContext = { proceduralMemory, externalContext };
// Pass optionalContext to the local intelligence layer; it owns the final response.
```

## Memorable

Install and sign in to the [Memorable CLI](https://www.memorable.sh/docs/cli), initialize its local store, and explicitly run `memorable enable`. The app never enables storage or signs in on the user's behalf. After the user marks a response helpful, call:

```ts
await sponsors.proceduralMemory.learn({
  context: 'asking-for-advice',
  strategy: 'offer-one-next-step',
  outcome: 'helpful',
});
```

Only predefined reflection moments and strategies are sent to Memorable. `learn()` sends one generic, successful guidance action through `memorable ingest -`; no transcript, note, vault path, or private context is included. Unhelpful or unknown outcomes are not recorded. `recall()` accepts only known moments, resolves a procedure with `memorable recall --single` and `memorable show`, and returns only a recognized strategy. The strategy `offer-one-next-step` supports concise advice at the moment the user asks for it or is ready to act; the local intelligence layer still decides the wording and keeps the response to one question.

## GBrain

For an existing [gbrain.io workspace](https://gbrain.io/docs/tools/assistants), create a dedicated client in **Clients**. Grant that client **Read** access to the workspace memory and Google Calendar, then add a connection for this app. Put its one-time connection token in the main process environment as `GBRAIN_MCP_TOKEN`; keep it out of chat, Git, and the renderer. The adapter talks directly to `https://gbrain.io/mcp` over read-only MCP calls (`search` and `gcal_list_events`). It does not use the separate open-source `gbrain` CLI or need a source ID.

Pass a short, deliberately chosen search topic to `getRelevantContext()`, never a transcript or raw note. Each returned text block is limited to 500 characters. The vault is never uploaded or indexed by this adapter. The workspace client permissions control what the remote calls can read; grant only the data the user has approved.

Both services are optional. A missing Memorable binary, absent GBrain token, timeout, malformed output, or provider error returns `[]` and leaves local reflection to continue. Their output is reference data, not instructions to the local model. The GBrain MCP path is stub-tested but cannot be live-verified without the user's read-only connection.

## Check

The runnable tests use a stubbed Memorable CLI and GBrain MCP responses, so they need no accounts or sponsor binaries:

```bash
node node_modules/esbuild/bin/esbuild src/sponsors/sponsors.test.ts --bundle --platform=node --format=esm --outfile=out/sponsors.test.mjs
node --test out/sponsors.test.mjs
```
