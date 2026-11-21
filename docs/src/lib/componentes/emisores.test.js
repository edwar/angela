// @vitest-environment happy-dom
/**
 * Los componentes generados pintan lo mismo que la vista previa, en todos los frameworks:
 * - React y JS sin framework: se compilan y se renderizan (TypeScript y JavaScript).
 * - Vue: se compila con su compilador y se renderiza en el servidor.
 * - Angular y Astro: sus compiladores aceptan las plantillas (no hay runtime aquí).
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { transformWithOxc } from 'vite';
import * as Vue from 'vue';
import { renderToString as vueRenderToString } from 'vue/server-renderer';
import { compileScript, compileTemplate, parse as parseSfc } from 'vue/compiler-sfc';
import { parseTemplate } from '@angular/compiler';
// El React de @angela-ui/react (una sola copia en el monorepo).
import React from '../../../../packages/angela-react/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../../../packages/angela-react/node_modules/react-dom/server.node.js';
import { DEFINICIONES, componenteDe, htmlDe, propsDe, valoresPorDefecto } from '../playground/definiciones.js';
import { emitir } from './emisores.js';

const require = createRequire(import.meta.url);
const astro = await import(createRequire(require.resolve('astro/package.json')).resolve('@astrojs/compiler-rs'));

/* ---------- Comparar HTML ---------- */

/** Atributos ordenados; los ids, reducidos a cuántos hay (cada framework los genera a su modo). */
const IDS = ['id', 'for', 'aria-describedby', 'aria-labelledby', 'data-error', 'commandfor'];
function normal(html) {
  const plantilla = document.createElement('template');
  plantilla.innerHTML = html;
  const salida = [];
  const recorrer = (nodo) => {
    for (const c of nodo.childNodes) {
      if (c.nodeType === 1) {
        // style="" (Vue lo escribe así en el servidor) es lo mismo que no tener style.
        const attrs = [...c.attributes]
          .filter((a) => !(a.name === 'style' && !a.value.trim()))
          .map((a) => `${a.name}=${IDS.includes(a.name) ? a.value.split(/\s+/).length : a.name === 'style' ? a.value.replace(/\s|;$/g, '') : a.value}`)
          .sort()
          .join(' ');
        salida.push(`<${c.localName} ${attrs}>`);
        recorrer(c.content ?? c);
        salida.push(`</${c.localName}>`);
      } else if (c.nodeType === 3 && c.textContent.trim()) salida.push(c.textContent.replace(/\s+/g, ' ').trim());
    }
  };
  recorrer(plantilla.content);
  return salida.join('\n');
}

/** Los slots van como una marca de texto y se sustituyen después por su HTML. */
const marca = (nombre) => `@@${nombre}@@`;
const conSlots = (html, slots) => Object.entries(slots).reduce((h, [n, v]) => h.replaceAll(marca(n), v), html);

/* ---------- Ejecutar el código generado ---------- */

async function modulo(codigo, archivo, dependencias = {}) {
  const { code } = await transformWithOxc(codigo, archivo, { lang: archivo.endsWith('x') ? 'tsx' : 'ts', jsx: { runtime: 'classic' } });
  // import { a, b } from 'x'  →  const { a, b } = dependencias['x'];   export function X → function X
  let fuente = code.replace(/^import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["']([^"']+)["'];?$/gm, (_, nombres, de) =>
    `const {${nombres.replace(/\btype\s+\w+,?/g, '').replace(/\s+as\s+/g, ': ')}} = __dep[${JSON.stringify(de)}];`,
  );
  const exportados = [...fuente.matchAll(/^export\s+(?:function|const)\s+(\w+)/gm)].map((m) => m[1]);
  fuente = fuente.replace(/^export\s+(?=function|const|interface)/gm, '');
  return new Function('__dep', 'React', `${fuente}\nreturn { ${exportados.join(', ')} };`)(dependencias, React);
}

/**
 * En React, autofocus se pone con un ref al montar (autoFocus no llega al DOM en el cliente): en el
 * HTML del servidor no está, en el navegador sí, que es donde el diálogo lo usa al abrirse.
 */
const sinAutofocus = (html) => html.replace(/ autofocus=""/g, '');

async function renderReact(c, props, slots, ts) {
  const fw = emitir(c, props, slots, ts ? 'ts' : 'js').find((f) => f.id === 'react');
  const mod = await modulo(fw.componente.codigo, ts ? 'C.tsx' : 'C.jsx', { react: React });
  const nombrados = Object.fromEntries(Object.keys(slots).map((n) => [n, marca(n)]));
  return conSlots(renderToStaticMarkup(React.createElement(mod[c.nombre], { ...props, ...nombrados })), slots);
}

async function renderVanilla(c, props, slots, ts) {
  const fw = emitir(c, props, slots, ts ? 'ts' : 'js').find((f) => f.id === 'html');
  const mod = await modulo(fw.componente.codigo, ts ? 'c.ts' : 'c.js');
  const funcion = Object.values(mod)[0];
  const caja = document.createElement('div');
  caja.append(funcion({ ...props, ...Object.fromEntries(Object.keys(slots).map((n) => [n, marca(n)])) }));
  return conSlots(caja.innerHTML, slots);
}

async function renderVue(c, props, slots, ts) {
  const fw = emitir(c, props, slots, ts ? 'ts' : 'js').find((f) => f.id === 'vue');
  const { descriptor, errors } = parseSfc(fw.componente.codigo, { filename: 'C.vue' });
  expect(errors).toEqual([]);
  const script = compileScript(descriptor, { id: 'c', inlineTemplate: true });
  const mod = await modulo(script.content.replace(/^export default /m, 'export const Componente = '), ts ? 'c.ts' : 'c.js', { vue: Vue });
  const app = Vue.createSSRApp({
    render: () =>
      Vue.h(mod.Componente, props, Object.fromEntries(Object.keys(slots).map((n) => [n === 'children' ? 'default' : n, () => marca(n)]))),
  });
  return conSlots(await vueRenderToString(app), slots);
}

/* ---------- Combinaciones ---------- */

function combinaciones(def) {
  const base = valoresPorDefecto(def);
  const lista = [base];
  for (const c of def.controles.filter((x) => !x.demo)) {
    if (c.tipo === 'opciones') for (const v of c.valores) lista.push({ ...base, [c.nombre]: v });
    if (c.tipo === 'booleano') lista.push({ ...base, [c.nombre]: !base[c.nombre] });
    if (c.tipo === 'texto' && !c.slot) lista.push({ ...base, [c.nombre]: '' }, { ...base, [c.nombre]: 'Con "comillas" y {llaves} <b> & @' });
    if (c.tipo === 'numero') lista.push({ ...base, [c.nombre]: (c.min ?? 0) + 1 });
    if (c.tipo === 'lista') lista.push({ ...base, [c.nombre]: ['Uno'] });
  }
  return lista;
}

const casos = DEFINICIONES.flatMap((def) => combinaciones(def).map((v, i) => [`${def.slug} #${i}`, def, v]));

describe.each([
  ['React (TS)', (c, p, s) => renderReact(c, p, s, true)],
  ['React (JS)', (c, p, s) => renderReact(c, p, s, false)],
  ['JS sin framework (TS)', (c, p, s) => renderVanilla(c, p, s, true)],
  ['JS sin framework (JS)', (c, p, s) => renderVanilla(c, p, s, false)],
  ['Vue (TS)', (c, p, s) => renderVue(c, p, s, true)],
  ['Vue (JS)', (c, p, s) => renderVue(c, p, s, false)],
])('%s pinta lo mismo que la vista previa', (nombre, render) => {
  it.each(casos)('%s', async (__, def, valores) => {
    const c = componenteDe(def);
    const html = htmlDe(def, valores);
    const esperado = normal(nombre.startsWith('React') ? sinAutofocus(html) : html);
    expect(normal(await render(c, propsDe(def, valores), def.slots(valores)))).toBe(esperado);
  });
});

describe('Angular y Astro: sus compiladores aceptan el código', () => {
  it.each(DEFINICIONES.map((d) => [d.slug, d]))('%s', async (_, def) => {
    const valores = valoresPorDefecto(def);
    const fws = emitir(componenteDe(def), propsDe(def, valores), def.slots(valores), 'ts');
    const plantilla = (codigo) => /template: `\n([\s\S]*?)\n\s*`,/.exec(codigo)[1].replace(/\\`/g, '`').replace(/\\\$\{/g, '${');

    const angular = fws.find((f) => f.id === 'angular');
    for (const codigo of [angular.componente.codigo, angular.uso.codigo]) {
      expect(parseTemplate(plantilla(codigo), 'c.html').errors ?? []).toEqual([]);
      await expect(transformWithOxc(codigo, 'c.ts', { lang: 'ts' })).resolves.toBeTruthy();
    }

    const deAstro = fws.find((f) => f.id === 'astro');
    for (const codigo of [deAstro.componente.codigo, deAstro.uso.codigo]) {
      const r = await astro.transform(codigo, { filename: 'C.astro' });
      expect((r.diagnostics ?? []).filter((d) => d.severity === 'error')).toEqual([]);
    }
  });
});

describe('los ejemplos de uso compilan', () => {
  it.each(DEFINICIONES.map((d) => [d.slug, d]))('%s', async (_, def) => {
    const valores = valoresPorDefecto(def);
    for (const lenguaje of ['ts', 'js']) {
      const fws = emitir(componenteDe(def), propsDe(def, valores), def.slots(valores), lenguaje);
      for (const id of ['react', 'next', 'html']) {
        const { uso } = fws.find((f) => f.id === id);
        await expect(transformWithOxc(uso.codigo, `u.${uso.lenguaje}`, { lang: uso.lenguaje })).resolves.toBeTruthy();
      }
      const vue = fws.find((f) => f.id === 'vue').uso.codigo;
      const { descriptor, errors } = parseSfc(vue, { filename: 'App.vue' });
      expect(errors).toEqual([]);
      expect(compileTemplate({ source: descriptor.template.content, filename: 'App.vue', id: 'a' }).errors).toEqual([]);
    }
  });
});
