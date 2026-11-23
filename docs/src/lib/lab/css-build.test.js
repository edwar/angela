import { createRequire } from 'node:module';
import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cssBuildError, cssBuildResult } from './css-build.js';
import { reviewComponent } from './review.js';

const raiz = new URL('../../../../', import.meta.url);

describe('parser del build en el laboratorio', () => {
  it('usa la misma versión de lightningcss que el build del sitio', () => {
    // Ninguno de los dos exporta su package.json: se lee desde la carpeta del paquete.
    const version = (entrada, nombre) => {
      const carpeta = entrada.slice(0, entrada.lastIndexOf(`/${nombre}/`) + nombre.length + 2);
      return JSON.parse(readFileSync(`${carpeta}package.json`, 'utf8')).version;
    };
    const require = createRequire(new URL('docs/package.json', raiz));
    const build = version(createRequire(require.resolve('vite')).resolve('lightningcss'), 'lightningcss');
    const wasm = version(require.resolve('lightningcss-wasm'), 'lightningcss-wasm');
    expect(wasm, 'Sube lightningcss-wasm a la versión que usa Vite').toBe(build);
  });

  it('marca lo que rompe el build aunque la revisión propia no lo vea', async () => {
    const rompen = [
      '.a::{color:red}',
      '.a >> .b{color:red}',
      '.a, {color:red}',
      '.a:not(){color:red}',
      '.a[data-x{color:red}',
      '@media screen and and (hover:hover){.a{color:red}}',
      '@supports display: grid {.a{}}',
      '@layer a b{}',
      '@keyframes {to{opacity:1}}',
      '@property x{syntax:"*"}',
    ];
    for (const css of rompen) {
      const cssBuild = await cssBuildError(css);
      expect(cssBuild, css).toMatch(/^Línea \d+: el build no puede leerlo/);
      const hallazgo = reviewComponent({ html: '', css, js: '', cssBuild }).find((h) => h.id === 'sintaxis');
      expect(hallazgo, css).toMatchObject({ level: 'error', bloquea: true });
    }
  });

  it('acepta el CSS de angela y del sitio', async () => {
    const archivos = globSync(['packages/angela/src/components/*.css', 'docs/src/demos/**/*.css'], { cwd: raiz });
    expect(archivos.length).toBeGreaterThan(20);
    for (const archivo of archivos) {
      expect(await cssBuildError(readFileSync(new URL(archivo, raiz), 'utf8')), archivo).toBeNull();
    }
  });
});

describe('la animación con línea de tiempo, tal como la deja el build', () => {
  const regla = async (css) => {
    const { minificado } = await cssBuildResult(css);
    return reviewComponent({ html: '', css, js: '', cssMinificado: minificado }).find((h) => h.id === 'linea-de-tiempo');
  };

  it('marca el shorthand que el minificador junta con view() (lo que rompió imagen-revelada)', async () => {
    const css = '@layer angela.components { .reveal-image { animation: reveal-image linear both; animation-timeline: view(); } }';
    expect(await regla(css)).toMatchObject({ level: 'error' });
  });

  it('no marca las propiedades sueltas ni el CSS de angela', async () => {
    const sueltas = '.a { animation-name: x; animation-timing-function: linear; animation-fill-mode: both; animation-timeline: view(); }';
    expect(await regla(sueltas)).toBeUndefined();
    for (const archivo of globSync('packages/angela/src/components/*.css', { cwd: raiz })) {
      expect(await regla(readFileSync(new URL(archivo, raiz), 'utf8')), archivo).toBeUndefined();
    }
  });
});
