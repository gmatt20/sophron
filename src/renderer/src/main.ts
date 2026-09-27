import './index.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main class="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-8">
      <div class="max-w-md text-center space-y-4">
        <p class="text-sm uppercase tracking-widest text-neutral-500">Sophron</p>
        <h1 class="text-3xl font-semibold">Foundation ready</h1>
        <p class="text-neutral-400">
          Electron + TypeScript + Tailwind is wired up. The reflection engine
          lands here next.
        </p>
      </div>
    </main>
  `;
}
