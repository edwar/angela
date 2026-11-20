// Sin @vitest-environment: corre en Node puro, sin document ni window, como en un servidor.
import { describe, expect, it } from 'vitest';
import { angela } from './index.js';
import { enhanceForms } from './forms.js';
import { enhanceDialogs, enhancePopovers } from './overlays.js';
import { enhanceSpotlight } from './spotlight.js';
import { initThemeToggle } from './theme.js';

describe('seguro en el servidor (SSR)', () => {
  it('no hay DOM en este entorno', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  // Antes, root = document se evaluaba antes de la guarda y lanzaba ReferenceError.
  it.each([
    ['angela()', () => angela()],
    ['enhanceForms()', () => enhanceForms()],
    ['enhanceDialogs()', () => enhanceDialogs()],
    ['enhancePopovers()', () => enhancePopovers()],
    ['enhanceSpotlight()', () => enhanceSpotlight()],
    ['initThemeToggle()', () => initThemeToggle()],
  ])('%s no lanza y devuelve una limpieza que tampoco lanza', (_, call) => {
    const cleanup = call();
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});
