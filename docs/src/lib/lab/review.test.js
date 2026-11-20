import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reviewComponent } from './review.js';

const delegacion = (js) => reviewComponent({ html: '', css: '', js }).find((h) => h.id === 'delegacion');
const modulo = (name) => readFileSync(new URL(`../../../../packages/angela/src/js/${name}`, import.meta.url), 'utf8');

describe('regla de delegación', () => {
  it('marca como error escuchar sobre elementos buscados al arrancar, aunque se guarden en una variable', () => {
    // La propuesta que hizo la IA para el spotlight.
    const js = `export function enhanceSpotlight(root = document) {
  if (typeof window === "undefined") return () => {};
  const spotlights = root.querySelectorAll('.spotlight');
  const listeners = [];
  spotlights.forEach((spotlight) => {
    const handler = () => {};
    spotlight.addEventListener('pointermove', handler);
    listeners.push({ spotlight, handler });
  });
  return () => listeners.forEach(({ spotlight, handler }) => spotlight.removeEventListener('pointermove', handler));
}`;
    expect(delegacion(js)).toMatchObject({ level: 'error' });
    expect(delegacion(js).text).toContain('spotlight.addEventListener');
  });

  it('también el patrón clásico y el de un solo elemento', () => {
    expect(delegacion(`document.querySelectorAll('.x').forEach((el) => el.addEventListener('click', f));`)).toBeTruthy();
    expect(delegacion(`const s = document.querySelector('.s');\ns.addEventListener('pointermove', f);`)).toBeTruthy();
  });

  it('no marca la delegación en root, document o window', () => {
    const js = `export function enhanceX(root = document) {
  const meta = document.querySelector('meta');
  const on = (event) => event.target.closest('.x');
  root.addEventListener('click', on);
  window.addEventListener('storage', on);
  return () => root.removeEventListener('click', on);
}`;
    expect(delegacion(js)).toBeUndefined();
  });

  it('acepta un MutationObserver o un custom element', () => {
    expect(delegacion(`const el = document.querySelector('.x');\nel.addEventListener('click', f);\nnew MutationObserver(f);`)).toBeUndefined();
    expect(delegacion(`class T extends HTMLElement { connectedCallback() { this.querySelector('b').addEventListener('click', f); } }`)).toBeUndefined();
  });

  it('ningún módulo de angela incumple la regla', () => {
    for (const name of ['forms.js', 'overlays.js', 'tabs.js', 'theme.js', 'spotlight.js']) {
      expect(delegacion(modulo(name)), name).toBeUndefined();
    }
  });
});
