// Genera dist/ desde iconos/*.json: revisa cada icono contra la guía, lo dibuja a mano
// alzada y escribe un módulo por icono, el índice, «todos», el sprite, los SVG sueltos,
// los metadatos y los tipos. No genera nada si un icono incumple la guía.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { revisarIcono } from '../src/reglas.js';
import { RAIZ, dibujar, piezasSvg } from '../src/mano-alzada.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(root, 'dist');
const pascal = (nombre) => nombre.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const comillas = (s) => JSON.stringify(s);

const archivos = (await readdir(resolve(root, 'iconos'))).filter((f) => f.endsWith('.json')).sort();
const iconos = [];
let fallos = 0;
for (const archivo of archivos) {
  const nombre = archivo.slice(0, -5);
  const icono = JSON.parse(await readFile(resolve(root, 'iconos', archivo), 'utf8'));
  const hallazgos = revisarIcono(icono, { nombre });
  for (const h of hallazgos) console[h.nivel === 'error' ? 'error' : 'warn'](`${h.nivel === 'error' ? '✗' : '!'} ${nombre}: ${h.texto}`);
  if (hallazgos.some((h) => h.nivel === 'error')) {
    fallos += 1;
    continue;
  }
  // La semilla es el nombre: el mismo icono da siempre el mismo trazo.
  const interior = piezasSvg(dibujar(icono.formas, { semilla: nombre }));
  iconos.push({ nombre, exportacion: `icono${pascal(nombre)}`, interior, categoria: icono.categoria, etiquetas: icono.etiquetas, autor: icono.autor, licencia: icono.licencia });
}
if (fallos) {
  console.error(`\n${fallos} ${fallos === 1 ? 'icono incumple' : 'iconos incumplen'} la guía: no se genera nada.`);
  process.exit(1);
}

const decorativo = (interior) => `<svg ${RAIZ} width="24" height="24" aria-hidden="true">${interior}</svg>`;

await rm(DIST, { recursive: true, force: true });
await mkdir(resolve(DIST, 'iconos'), { recursive: true });
await mkdir(resolve(DIST, 'svg'), { recursive: true });

for (const i of iconos) {
  await writeFile(resolve(DIST, 'iconos', `${i.nombre}.js`), `/** ${i.nombre} · ${i.etiquetas.join(', ')} */\nexport default ${comillas(decorativo(i.interior))};\n`);
  await writeFile(resolve(DIST, 'svg', `${i.nombre}.svg`), `<svg ${RAIZ}>${i.interior}</svg>\n`);
}

await writeFile(
  resolve(DIST, 'index.js'),
  `// Un export por icono: el empaquetador solo incluye los que importas.\n${iconos.map((i) => `export { default as ${i.exportacion} } from './iconos/${i.nombre}.js';`).join('\n')}\n`,
);
await writeFile(resolve(DIST, 'index.d.ts'), `${iconos.map((i) => `/** ${i.nombre}: ${i.etiquetas.join(', ')} */\nexport declare const ${i.exportacion}: string;`).join('\n') || 'export {};'}\n`);

await writeFile(
  resolve(DIST, 'todos.js'),
  `// Todos los iconos, para elegirlos por nombre en tiempo de ejecución.
/** Interior de cada icono (su trazado). */
export const iconos = {
${iconos.map((i) => `  ${comillas(i.nombre)}: ${comillas(i.interior)},`).join('\n')}
};

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * SVG de un icono. Sin titulo es decorativo (aria-hidden); con titulo, role="img" y su nombre.
 * tamano: ancho y alto en px (null para no ponerlos y dejarlo al CSS).
 */
export function icono(nombre, { titulo, tamano = 24 } = {}) {
  const interior = iconos[nombre];
  if (interior === undefined) throw new Error(\`No existe el icono «\${nombre}».\`);
  const medida = tamano == null ? '' : \` width="\${tamano}" height="\${tamano}"\`;
  const accesible = titulo ? \` role="img" aria-label="\${escapar(titulo)}"\` : ' aria-hidden="true"';
  return \`<svg ${RAIZ}\${medida}\${accesible}>\${interior}</svg>\`;
}
`,
);
await writeFile(
  resolve(DIST, 'todos.d.ts'),
  `export type NombreIcono = ${iconos.map((i) => comillas(i.nombre)).join(' | ') || 'never'};
export declare const iconos: Record<NombreIcono, string>;
export declare function icono(nombre: NombreIcono, opciones?: { titulo?: string; tamano?: number | null }): string;
`,
);

await writeFile(
  resolve(DIST, 'sprite.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg">\n${iconos.map((i) => `  <symbol id="icono-${i.nombre}" viewBox="0 0 24 24" fill="currentColor">${i.interior}</symbol>`).join('\n')}\n</svg>\n`,
);

await writeFile(
  resolve(DIST, 'iconos.json'),
  `${JSON.stringify(iconos.map(({ nombre, exportacion, categoria, etiquetas, autor, licencia }) => ({ nombre, exportacion, categoria, etiquetas, autor, licencia })), null, 2)}\n`,
);

console.log(`✓ ${iconos.length} iconos en dist/`);
