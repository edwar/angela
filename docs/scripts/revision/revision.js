/**
 * Revisión automática de un pull request que crea o edita componentes de angela.
 *
 * Aplica las reglas que ya existen, sin inventar otras:
 *  - las del laboratorio (docs/src/lib/lab/review.js), sobre el CSS, el JS y los ejemplos
 *    de la documentación de cada componente tocado;
 *  - las de AGENTS.md que se pueden comprobar con código: el CSS nuevo se importa en
 *    angela.css, cada componente se documenta (ejemplos, API y accesibilidad), y su JS
 *    se registra en src/js/index.js y lleva test.
 *
 * Solo cuenta lo que el PR introduce: un aviso que ya estaba en main se muestra aparte,
 * para que editar un componente no herede la culpa de lo anterior.
 *
 * No aprueba ni mezcla: si hay errores, el check falla; si no, queda la revisión visual.
 */

const CSS_DIR = 'packages/angela/src/components/';
const JS_DIR = 'packages/angela/src/js/';
const DOCS_DIR = 'docs/src/data/componentes/';
export const CSS_ENTRY = 'packages/angela/src/angela.css';
export const JS_ENTRY = 'packages/angela/src/js/index.js';

/** Módulos de JS que no son de un componente. */
const JS_INFRA = new Set(['index.js', 'polyfills.js', 'theme.js']);

const fileName = (path, dir, ext) => {
  if (!path.startsWith(dir)) return null;
  const rest = path.slice(dir.length);
  if (rest.includes('/') || !rest.endsWith(ext) || rest.endsWith(`.test${ext}`)) return null;
  return rest.slice(0, -ext.length);
};

/**
 * Qué componentes toca el PR. Los del núcleo se encuentran por el mapa del laboratorio
 * (su slug no coincide con el archivo); los aportados, por convención (slug = archivo).
 * @param {string[]} paths  Archivos cambiados.
 * @param {Record<string, { css: string, js?: string }>} componentSources  Mapa del núcleo (rutas relativas a src/).
 * @returns {{ slugs: string[], css: string | null, js: string | null }[]}
 */
export function touchedComponents(paths, componentSources) {
  const units = new Map();
  const unitFor = (css, js) => {
    const key = css ?? `js:${js}`;
    if (!units.has(key)) units.set(key, { slugs: new Set(), css, js });
    const unit = units.get(key);
    if (js && !unit.js) unit.js = js;
    return unit;
  };
  const core = Object.entries(componentSources).map(([slug, src]) => ({
    slug,
    css: src.css.replace(/^components\//, '').replace(/\.css$/, ''),
    js: src.js?.replace(/\.js$/, '') ?? null,
  }));

  const add = ({ css = null, js = null, slug = null }) => {
    // Una página aportada con el nombre del CSS de uno del núcleo (componentes/disclosure.js para
    // «desplegable») es una segunda página del mismo componente: se revisa con él y se marca.
    const duplicada = slug && !core.some((c) => c.slug === slug) ? core.filter((c) => c.css === slug) : [];
    if (duplicada.length) {
      for (const match of duplicada) {
        const unit = unitFor(match.css, match.js);
        unit.slugs.add(match.slug);
        unit.duplica = [...new Set([...(unit.duplica ?? []), slug])];
      }
      return;
    }
    const matches = core.filter((c) => (css && c.css === css) || (js && c.js === js) || (slug && c.slug === slug));
    if (matches.length) {
      for (const match of matches) unitFor(match.css, match.js).slugs.add(match.slug);
      return;
    }
    const id = css ?? js ?? slug;
    unitFor(id, null).slugs.add(id);
    if (js) unitFor(id, js);
  };

  for (const path of paths) {
    const css = fileName(path, CSS_DIR, '.css');
    if (css) add({ css });
    const js = fileName(path, JS_DIR, '.js');
    if (js && !JS_INFRA.has(`${js}.js`)) add({ js });
    const slug = fileName(path, DOCS_DIR, '.js');
    if (slug) add({ slug });
  }
  return [...units.values()].map((u) => ({ slugs: [...u.slugs], css: u.css, js: u.js, ...(u.duplica && { duplica: u.duplica }) }));
}

const hasCode = (js) =>
  (js ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .trim().length > 0;

const examplesHtml = (entries) =>
  entries.flatMap((entry) => entry?.examples ?? []).map((ex) => ex.code).join('\n\n');

/**
 * Revisa un componente.
 * @param {{ slugs: string[], css: string | null, js: string | null }} unit
 * @param {{
 *   read: (side: 'base' | 'head', path: string) => string | null,
 *   docs: { base: Record<string, any>, head: Record<string, any> },
 *   reviewComponent: (files: { html: string, css: string, js: string, test: string }) => { level: string, id: string, text: string }[],
 *   findEntryFunction: (js: string) => string | null,
 * }} ctx
 */
export function reviewUnit(unit, { read, docs, reviewComponent, findEntryFunction, apiTokens = null, rowToken = null }) {
  const cssPath = unit.css ? `${CSS_DIR}${unit.css}.css` : null;
  // Aunque el PR no toque el JS, si el componente lo tiene se revisa con lo demás.
  if (!unit.js && unit.css && read('head', `${JS_DIR}${unit.css}.js`) != null) unit = { ...unit, js: unit.css };
  const jsPath = unit.js ? `${JS_DIR}${unit.js}.js` : null;
  const side = (s) => ({
    css: cssPath ? read(s, cssPath) : null,
    js: jsPath ? read(s, jsPath) : null,
    test: jsPath ? read(s, jsPath.replace(/\.js$/, '.test.js')) : null,
    docs: unit.slugs.map((slug) => docs[s][slug]).filter(Boolean),
  });
  const base = side('base');
  const head = side('head');
  const title = head.docs[0]?.title ?? base.docs[0]?.title ?? unit.slugs[0];
  // Un CSS con varias páginas (layout.css → Tarjeta y Tabla): cada fila de la tabla, con su título.
  const titulos = Object.fromEntries(unit.slugs.map((slug) => [slug, docs.head[slug]?.title ?? docs.base[slug]?.title ?? title]));
  const nuevo = base.css == null && base.docs.length === 0;

  /** @type {{ level: 'error' | 'warn', id: string, text: string }[]} */
  const findings = [];
  const add = (level, id, text) => findings.push({ level, id, text });

  // Una página que se quita sin CSS propio (p. ej. al dividirla en otras): solo hay que cuidar los enlaces.
  if (head.css == null && base.css == null && head.docs.length === 0 && base.docs.length > 0) {
    const paginas = unit.slugs.map((slug) => `\`${DOCS_DIR}${slug}.js\``).join(', ');
    add('warn', 'elimina', `Se elimina la página ${paginas}: comprueba que nada enlace a ella o añade una redirección en \`docs/astro.config.mjs\`.`);
    return { title, titulos, slugs: unit.slugs, nuevo: false, eliminado: true, findings, previos: [] };
  }

  // Solo se elimina lo que existía.
  if (cssPath && head.css == null && base.css != null) {
    add('warn', 'elimina', `Se elimina \`${cssPath}\`: comprueba que ningún otro componente ni la documentación lo usen.`);
    return { title, titulos, slugs: unit.slugs, nuevo, eliminado: true, findings, previos: [] };
  }

  // --- Reglas del laboratorio: solo lo que el PR introduce. ---
  const files = (s) => ({ html: examplesHtml(s.docs), css: s.css ?? '', js: s.js ?? '', test: s.test ?? '' });
  const key = (h) => `${h.id}\n${h.text}`;
  const antes = new Set(nuevo ? [] : reviewComponent(files(base)).map(key));
  const previos = [];
  for (const h of reviewComponent(files(head))) {
    // Sin archivo de test ya avisa la regla test-js (más abajo), con la ruta exacta.
    if (h.id === 'test' && head.test == null) continue;
    if (antes.has(key(h))) previos.push(h);
    else findings.push(h);
  }

  // --- Reglas de AGENTS.md que se pueden comprobar. ---
  if (cssPath && base.css == null) {
    const entry = read('head', CSS_ENTRY) ?? '';
    if (!entry.includes(`@import "./components/${unit.css}.css";`)) {
      add('error', 'import', `El CSS nuevo no se importa en \`${CSS_ENTRY}\`: añade \`@import "./components/${unit.css}.css";\`.`);
    }
  }

  for (const slug of unit.duplica ?? []) {
    if (read('head', `${DOCS_DIR}${slug}.js`) == null) continue; // el PR la borra: bien
    add('error', 'pagina-duplicada', `\`${DOCS_DIR}${slug}.js\` crea una segunda página de «${title}»: actualiza la que ya existe (\`${DOCS_DIR}${unit.slugs[0]}.js\`, en \`/componentes/${unit.slugs[0]}\`) y borra este archivo.`);
  }

  if (head.docs.length === 0) {
    add('error', 'documentacion', `Falta la documentación: \`${DOCS_DIR}${unit.slugs[0]}.js\` con ejemplos, API y accesibilidad.`);
  }
  for (const entry of head.docs) {
    const faltan = [
      !entry.examples?.length && 'ejemplos',
      !entry.api?.length && 'API',
      !entry.a11y?.length && 'notas de accesibilidad',
    ].filter(Boolean);
    if (faltan.length) add('error', 'documentacion', `La documentación de «${entry.title}» no tiene ${faltan.join(', ')}.`);
  }

  // Lo que el CSS añade para quien lo usa (clases, data-*, variables) tiene su fila en la API.
  if (apiTokens && rowToken && head.css && head.docs.length) {
    const antes = apiTokens(base.css ?? '');
    const ahora = apiTokens(head.css);
    const filas = head.docs.flatMap((entry) => entry.api ?? []).map(([name]) => rowToken(name)).filter(Boolean);
    const documentado = (tipo, nombre) => filas.some((t) => t.tipo === tipo && t.nombre === nombre);
    const faltan = [
      ...[...ahora.clases].filter((n) => !antes.clases.has(n) && !documentado('clases', n)).map((n) => `.${n}`),
      ...[...ahora.atributos.keys()].filter((n) => !antes.atributos.has(n) && !documentado('atributos', n)),
      ...[...ahora.parametros.keys()].filter((n) => !antes.parametros.has(n) && !documentado('parametros', n)),
    ];
    if (faltan.length) {
      add('warn', 'api-sin-documentar', `El CSS añade ${faltan.map((n) => `\`${n}\``).join(', ')} y la API de «${title}» no lo explica: añade su fila.`);
    }
  }

  // Un JS sin efecto ya lo marca «sin-efecto»: pedirle registro y test sería ruido (la solución es quitarlo).
  if (jsPath && hasCode(head.js) && !findings.some((h) => h.id === 'sin-efecto')) {
    const index = read('head', JS_ENTRY) ?? '';
    // Sin función exportada ya avisa la regla «activacion» del laboratorio.
    const fn = findEntryFunction(head.js);
    // La función de activación lleva el nombre del componente: enhanceFlipCard para flip-card.js.
    const pascal = unit.js.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
    if (fn && !fn.toLowerCase().includes(pascal.toLowerCase())) {
      add('warn', 'nombre-js', `La función de \`${jsPath}\` se llama \`${fn}\`: lleva el nombre del componente (\`enhance${pascal}\`), así se sabe de dónde viene en \`angela()\`.`);
    }
    if (fn && !new RegExp(`from\\s+['"]\\./${unit.js}\\.js['"]`).test(index)) {
      add(
        'error',
        'registro',
        `\`${jsPath}\` no está registrado en \`${JS_ENTRY}\`: impórtalo, reexporta \`${fn}\` y llámalo en \`angela()\`. Si no, no se ejecuta en ninguna web.`,
      );
    }
    if (read('head', `${JS_DIR}${unit.js}.test.js`) == null) {
      add('error', 'test-js', `\`${jsPath}\` no tiene test: añade \`${JS_DIR}${unit.js}.test.js\`.`);
    }
  }

  findings.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  return { title, titulos, slugs: unit.slugs, nuevo, eliminado: false, findings, previos };
}

/**
 * @param {{ name: string, ok: boolean }[]} checks  Pasos del CI (tests, tipos, contraste, build).
 * @param {ReturnType<typeof reviewUnit>[]} components
 */
export function verdict(checks, components) {
  const errores = components.reduce((n, c) => n + c.findings.filter((f) => f.level === 'error').length, 0);
  const fallidos = checks.filter((c) => !c.ok);
  return { ok: errores === 0 && fallidos.length === 0, errores, fallidos };
}

const MARKER = '<!-- angela:revision -->';
/** El workflow del comentario sustituye esto por la URL de la preview de Vercel. */
export const PREVIEW = '{{preview}}';

/**
 * El comentario del PR.
 * @param {{
 *   checks: { name: string, ok: boolean }[],
 *   components: ReturnType<typeof reviewUnit>[],
 *   manualChecks: string[],
 *   productionUrl: string,
 *   sha: string,
 * }} input
 */
export function renderComment({ checks, components, manualChecks, productionUrl, sha }) {
  const v = verdict(checks, components);
  const out = [MARKER];

  const visual = components.some((c) => !c.eliminado);
  out.push(
    !v.ok
      ? '## ❌ Cambios necesarios antes de mezclar'
      : visual
        ? '## ✅ Cumple las reglas: falta tu revisión visual'
        : '## ✅ Pasa las comprobaciones',
    '',
    v.ok
      ? visual
        ? 'La revisión automática no encontró nada que incumpla las reglas de angela. Abre la preview, compárala con producción y, si se ve bien, mezcla el PR.'
        : 'No hay componentes que revisar a ojo.'
      : `Hay ${[
          v.errores && `${v.errores} ${v.errores === 1 ? 'regla incumplida' : 'reglas incumplidas'}`,
          v.fallidos.length && `${v.fallidos.length} ${v.fallidos.length === 1 ? 'paso del CI que falla' : 'pasos del CI que fallan'}`,
        ]
          .filter(Boolean)
          .join(' y ')}. Corrígelo y la revisión se repite sola con el siguiente commit.`,
    '',
    '### Comprobaciones',
    '',
    ...checks.map((c) => `- ${c.ok ? '✅' : '❌'} ${c.name}`),
  );

  if (components.length === 0) {
    out.push('', '_El PR no toca ningún componente: solo se pasan las comprobaciones generales._');
  }

  for (const c of components) {
    const errores = c.findings.filter((f) => f.level === 'error');
    const avisos = c.findings.filter((f) => f.level === 'warn');
    const estado = errores.length ? '❌' : avisos.length ? '⚠️' : '✅';
    out.push('', `### ${estado} ${c.title} · ${c.eliminado ? 'se elimina' : c.nuevo ? 'componente nuevo' : 'edición'}`, '');
    if (!c.findings.length) out.push('Sin incumplimientos.');
    for (const f of errores) out.push(`- ❌ ${f.text}`);
    for (const f of avisos) out.push(`- ⚠️ ${f.text}`);
    if (c.previos.length) {
      out.push(
        '',
        `<details><summary>${c.previos.length} ${c.previos.length === 1 ? 'aviso que ya estaba' : 'avisos que ya estaban'} en main (no bloquean)</summary>`,
        '',
        ...c.previos.map((f) => `- ${f.level === 'error' ? '❌' : '⚠️'} ${f.text}`),
        '',
        '</details>',
      );
    }
  }

  const visibles = components.filter((c) => !c.eliminado);
  if (visibles.length) {
    out.push('', '### Revisión visual', '', '| Componente | Preview | Producción |', '| --- | --- | --- |');
    for (const c of visibles) {
      for (const slug of c.slugs) {
        const prod = c.nuevo ? '—' : `[ver](${productionUrl}/componentes/${slug})`;
        out.push(`| ${c.titulos?.[slug] ?? c.title} | [ver](${PREVIEW}/componentes/${slug}) | ${prod} |`);
      }
    }
    out.push('', 'Antes de mezclar:', '', ...manualChecks.map((m) => `- [ ] ${m}`));
  }

  out.push('', `<sub>Revisión automática del commit ${sha.slice(0, 7)}. No aprueba ni despliega: eso lo decides tú al mezclar.</sub>`);
  return out.join('\n');
}
