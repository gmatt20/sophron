# Sophron

A local-first Socratic reflection desktop app. You speak about what's on your
mind; Sophron searches your Obsidian/Markdown history, retrieves a relevant past
thought, and asks exactly **one** Socratic question — all running locally.

This repository currently contains the **application foundation** only:
Electron + TypeScript + Tailwind CSS, with ESLint and Prettier configured. The
intelligence layer (QM orchestration, vault retrieval, Ollama reasoning) is
added on top of this shell.

## Stack

- [Electron](https://www.electronjs.org/) desktop shell
- [electron-vite](https://electron-vite.org/) for main / preload / renderer builds
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- ESLint (flat config) + Prettier

## Project structure

```
src/
  main/       Electron main process (window lifecycle)
  preload/    Context-isolated bridge to the renderer
  renderer/   UI (HTML + TypeScript + Tailwind)
```

## Getting started

```bash
npm install
npm run dev        # launch the app with hot reload
```

## Scripts

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Run the app in development with HMR    |
| `npm run build`     | Type-check and build for production    |
| `npm run preview`   | Preview the production build           |
| `npm run typecheck` | Type-check main, preload, and renderer |
| `npm run lint`      | Lint with ESLint                       |
| `npm run format`    | Format the codebase with Prettier      |

## Roadmap

The reflection engine will expose a single contract to the UI:

```ts
reflect(request: { transcript: string }): Promise<ReflectionResult>;
```

The UI never needs to know how reflection is orchestrated internally.
