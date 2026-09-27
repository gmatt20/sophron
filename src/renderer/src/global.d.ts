import type { SophronApi } from '../../preload';

declare global {
  interface Window {
    sophron: SophronApi;
  }
}

export {};
