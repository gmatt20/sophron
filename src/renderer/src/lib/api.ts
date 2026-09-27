/**
 * Thin re-export so components import from `@renderer/lib/api` rather than
 * reaching into `window.sophron` directly. Makes it trivial to swap for a
 * mock in Storybook / tests.
 */
export const api = window.sophron;
