/**
 * Registro del JS de un componente en @angela-ui/angela/js.
 *
 * angela() solo ejecuta los módulos que src/js/index.js importa y llama. Un módulo que
 * se sube sin registrarse no corre nunca en la web, así que el pull request del
 * laboratorio lo registra: lo importa, lo reexporta y lo llama dentro de angela().
 *
 * Para eso el módulo tiene que exportar una función de activación que reciba la raíz y
 * devuelva su limpieza, como el resto de angela:
 *
 *   export function enhanceSpotlight(root = globalThis.document) { …; return () => {…}; }
 */

const stripComments = (js) => js.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

/**
 * La función que angela() debe llamar: la exportada que empieza por enhance, init o define;
 * si no hay ninguna así, la primera función exportada. Las async no valen (devuelven una
 * promesa, no la limpieza).
 * @param {string} js
 * @returns {string | null}
 */
export function findEntryFunction(js) {
  const code = stripComments(js);
  const names = [
    ...code.matchAll(/\bexport\s+function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g),
    ...code.matchAll(/\bexport\s+(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g),
  ]
    .sort((a, b) => a.index - b.index)
    .map((m) => m[1]);
  return names.find((name) => /^(enhance|init|define)[A-Z]/.test(name)) ?? names[0] ?? null;
}

/**
 * Añade el módulo a src/js/index.js: import, reexport y llamada dentro de angela().
 * @param {string} indexJs  Contenido actual de index.js.
 * @param {string} file     Nombre del módulo (p. ej. "spotlight.js").
 * @param {string} fn       Función de activación.
 * @returns {{ status: 'added', code: string } | { status: 'present' } | { status: 'unknown' }}
 *   present: ya estaba registrado; unknown: index.js no tiene la forma esperada (se hace a mano).
 */
export function registerJsModule(indexJs, file, fn) {
  const from = `'./${file}'`;
  if (indexJs.includes(from) || indexJs.includes(`"./${file}"`)) return { status: 'present' };

  const lines = indexJs.split('\n');
  const lastIndex = (re) => lines.reduce((found, line, i) => (re.test(line) ? i : found), -1);

  const lastImport = lastIndex(/^import\s.+\sfrom\s+['"]\.\/[\w-]+\.js['"];\s*$/);
  const lastExport = lastIndex(/^export\s+(\{[^}]*\}|\*)\s+from\s+['"]\.\/[\w-]+\.js['"];\s*$/);
  const open = lines.findIndex((line) => /^\s*const cleanups = \[\s*$/.test(line));
  const close = open === -1 ? -1 : lines.findIndex((line, i) => i > open && /^\s*\];\s*$/.test(line));
  if (lastImport === -1 || lastExport === -1 || close === -1) return { status: 'unknown' };

  const indent = lines[open + 1]?.match(/^\s*/)?.[0] || '    ';
  // De abajo arriba, para no mover los índices que faltan por usar.
  lines.splice(close, 0, `${indent}${fn}(root),`);
  lines.splice(lastExport + 1, 0, `export { ${fn} } from ${from};`);
  lines.splice(lastImport + 1, 0, `import { ${fn} } from ${from};`);
  return { status: 'added', code: lines.join('\n') };
}
