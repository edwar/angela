/**
 * Interfaz del laboratorio: editor de tres pestañas, vista previa aislada, versiones y asistente de IA.
 * Regla de oro: nada del editor ni de la IA se inserta en esta página como HTML ni se ejecuta aquí.
 * Todo se muestra con textContent o se ejecuta dentro del iframe aislado (ver preview.js).
 */
import { components } from '../../data/components.js';
import {
  angelaCss,
  angelaJs,
  angelaVocabulary,
  bundleAngelaCss,
  buildPreviewDocument,
  componentSources,
  riskyPatterns,
} from './preview.js';
import { apiKey, drafts, myComponents, settings, toComponentId, versions } from './storage.js';
import { getRenderedScheme } from 'angela/js/theme';
import { CARET, createCodeEditor } from './editor.js';
import { reviewComponent } from './review.js';

const FILES = ['html', 'css', 'js'];

const STARTER = {
  html: `<article class="nota" data-tone="info">
  <p class="nota-titulo">Componente nuevo</p>
  <p>Escribe aquí el marcado. Usa elementos nativos y atributos data-* para las variantes.</p>
</article>`,
  css: `@layer angela.components {
  :where(.nota) {
    --_borde: var(--tone-border);
  }

  .nota {
    padding: var(--space-4);
    border: 1px solid var(--_borde);
    border-inline-start-width: var(--space-1);
    border-radius: var(--radius-lg);
    background-color: var(--tone-subtle);
    color: var(--color-text);
  }

  .nota-titulo {
    margin: 0 0 var(--space-1);
    font-weight: var(--fw-bold);
    color: var(--tone-text);
  }
}`,
  js: `// JavaScript opcional (módulo ES). Se ejecuta aislado: sin red ni acceso a la página.
`,
};

const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' });

export function startLab() {
  if (typeof window === 'undefined') return () => {};

  const $ = (id) => document.getElementById(id);
  const el = {
    base: $('lab-base'),
    status: $('lab-status'),
    tabs: $('lab-tabs'),
    code: Object.fromEntries(FILES.map((f) => [f, $(`lab-code-${f}`)])),
    frame: $('lab-frame'),
    previewMode: $('lab-preview-mode'),
    scheme: $('lab-scheme'),
    reload: $('lab-reload'),
    consoleList: $('lab-console-list'),
    consoleCount: $('lab-console-count'),
    consoleClear: $('lab-console-clear'),
    save: $('lab-save'),
    copy: $('lab-copy'),
    download: $('lab-download'),
    confirmReset: $('lab-confirm-reset'),
    confirmDelete: $('lab-confirm-delete'),
    confirmDeleteName: $('lab-confirm-delete-name'),
    versions: $('lab-versions'),
    versionsEmpty: $('lab-versions-empty'),
    aiState: $('lab-ai-state'),
    aiForm: $('lab-ai-form'),
    aiPrompt: $('lab-ai-prompt'),
    aiSubmit: $('lab-ai-submit'),
    aiCancel: $('lab-ai-cancel'),
    aiProgress: $('lab-ai-progress'),
    config: $('lab-ai-config'),
    configForm: $('lab-ai-config-form'),
    configKey: $('lab-ai-key'),
    configModel: $('lab-ai-model'),
    configRemember: $('lab-ai-remember'),
    configForget: $('lab-ai-forget'),
    proposal: $('lab-proposal'),
    proposalSummary: $('lab-proposal-summary'),
    proposalChanges: $('lab-proposal-changes'),
    proposalWarnings: $('lab-proposal-warnings'),
    proposalWarningList: $('lab-proposal-warning-list'),
    proposalCode: Object.fromEntries(FILES.map((f) => [f, $(`lab-proposal-${f}`)])),
    proposalTry: $('lab-proposal-try'),
    proposalDiscard: $('lab-proposal-discard'),
    proposalApply: $('lab-proposal-apply'),
    baseMine: $('lab-base-mine'),
    reset: $('lab-reset'),
    uses: $('lab-uses'),
    usesList: $('lab-uses-list'),
    insert: $('lab-insert'),
    insertMine: $('lab-insert-mine'),
    insertMineEmpty: $('lab-insert-mine-empty'),
    saveComponentOpen: $('lab-save-component-open'),
    saveComponent: $('lab-save-component'),
    saveComponentForm: $('lab-save-component-form'),
    componentName: $('lab-component-name'),
    deleteComponent: $('lab-delete-component'),
    confirmDeleteComponent: $('lab-confirm-delete-component'),
    confirmDeleteComponentDesc: $('lab-confirm-delete-component-desc'),
    reviewList: $('lab-review-list'),
    reviewCount: $('lab-review-count'),
  };

  const state = {
    // '' = nuevo, 'boton' = componente de angela, 'mio:tarjeta' = componente propio.
    slug: '',
    files: { ...STARTER },
    uses: [],
    proposal: null,
    trying: false,
    scheme: 'light',
    port: null,
    logs: 0,
    request: null,
  };

  const abort = new AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, { signal: abort.signal });
  const setStatus = (text) => (el.status.textContent = text);

  const MINE_PREFIX = 'mio:';
  const mineId = (slug = state.slug) => (slug.startsWith(MINE_PREFIX) ? slug.slice(MINE_PREFIX.length) : null);
  const sources = () => componentSources[state.slug] ?? {};
  const componentInfo = () => {
    const id = mineId();
    if (id) return { title: myComponents.get(id)?.name ?? id };
    return components.find((c) => c.slug === state.slug) ?? null;
  };

  /**
   * Componentes propios que usa el actual, con sus dependencias primero y sin repetir.
   * Un ciclo (A usa B y B usa A) se corta: cada componente se incluye una sola vez.
   */
  function dependencies(uses = state.uses, seen = new Set([mineId()])) {
    const list = [];
    for (const id of uses) {
      if (seen.has(id)) continue;
      seen.add(id);
      const record = myComponents.get(id);
      if (!record) continue;
      list.push(...dependencies(record.uses ?? [], seen), { id, ...record });
    }
    return list;
  }

  /** ¿Usar `id` dentro del actual crearía un ciclo? */
  function wouldCycle(id) {
    const current = mineId();
    if (!current) return false;
    if (id === current) return true;
    return dependencies([id], new Set()).some((d) => d.id === current);
  }

  function original(slug) {
    const component = components.find((c) => c.slug === slug);
    const src = componentSources[slug];
    if (!component || !src) return { ...STARTER };
    return {
      html: component.examples.map((ex) => `<!-- ${ex.title} -->\n${ex.code}`).join('\n\n'),
      css: angelaCss[src.css] ?? '',
      js: src.js ? (angelaJs[src.js] ?? '') : STARTER.js,
    };
  }

  /* ---------- Vista previa ---------- */

  const baseCssCache = new Map();
  function baseCss() {
    const exclude = sources().css;
    if (!baseCssCache.has(exclude)) baseCssCache.set(exclude, bundleAngelaCss({ exclude }));
    return baseCssCache.get(exclude);
  }

  function clearConsole() {
    el.consoleList.replaceChildren();
    state.logs = 0;
    el.consoleCount.textContent = '0';
    el.consoleCount.dataset.tone = 'neutral';
  }

  function render() {
    const files = state.trying && state.proposal ? state.proposal : state.files;
    clearConsole();
    el.previewMode.hidden = !(state.trying && state.proposal);
    try {
      el.frame.srcdoc = buildPreviewDocument({
        ...files,
        baseCss: baseCss(),
        scheme: state.scheme,
        jsModule: sources().js ?? null,
        dependencies: dependencies().map(({ name, css, js }) => ({ name, css, js })),
      });
    } catch (error) {
      logEntry({ level: 'error', text: `No se pudo preparar la vista previa: ${error.message}` });
    }
  }
  const renderSoon = debounce(render, 400);

  function logEntry({ level, text }) {
    if (typeof text !== 'string') return;
    const safeLevel = ['log', 'info', 'warn', 'error', 'debug'].includes(level) ? level : 'log';
    const item = document.createElement('li');
    item.dataset.level = safeLevel;
    item.textContent = `${safeLevel === 'log' ? '' : `[${safeLevel}] `}${text}`;
    el.consoleList.append(item);
    state.logs += 1;
    el.consoleCount.textContent = String(state.logs);
    if (safeLevel === 'error') el.consoleCount.dataset.tone = 'danger';
    else if (safeLevel === 'warn' && el.consoleCount.dataset.tone !== 'danger') el.consoleCount.dataset.tone = 'warning';
  }

  // Canal privado con cada documento de la vista previa: nadie más puede escribir en él.
  on(el.frame, 'load', () => {
    state.port?.close();
    const channel = new MessageChannel();
    state.port = channel.port1;
    channel.port1.onmessage = (event) => logEntry(event.data ?? {});
    // El documento tiene origen opaco, por eso el destino es '*': solo viaja el puerto.
    el.frame.contentWindow?.postMessage({ type: 'angela-lab' }, '*', [channel.port2]);
  });

  /* ---------- Editor ---------- */

  const LANGUAGE_NAMES = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
  const ideCursor = $('lab-ide-cursor');
  const ideLang = $('lab-ide-lang');
  const ideSaved = $('lab-ide-saved');

  const baseVocabulary = angelaVocabulary();
  const vocabulary = { ...baseVocabulary, origin: {} };
  /** Añade al autocompletado las clases de los componentes propios. */
  function refreshVocabulary() {
    const mineCss = Object.fromEntries(Object.entries(myComponents.all()).map(([id, r]) => [id, r.css ?? '']));
    const mine = angelaVocabulary(mineCss);
    vocabulary.classes = [...new Set([...baseVocabulary.classes, ...mine.classes])].sort();
    vocabulary.origin = Object.fromEntries(
      mine.classes.filter((c) => !baseVocabulary.classes.includes(c)).map((c) => [c, 'mi componente']),
    );
  }
  const editors = Object.fromEntries(
    FILES.map((f) => [
      f,
      createCodeEditor(el.code[f], {
        language: f,
        value: '',
        label: el.code[f].dataset.label,
        describedBy: 'lab-code-hint',
        vocabulary,
        onChange(value) {
          state.files[f] = value;
          if (state.trying) setTrying(false);
          ideSaved.textContent = 'Editando…';
          saveDraft();
          renderSoon();
          reviewSoon();
        },
        onCursor({ line, column, selected }) {
          if (activeFile() !== f) return;
          ideCursor.textContent = `Lín. ${line}, col. ${column}${selected ? ` (${selected} seleccionados)` : ''}`;
        },
      }),
    ]),
  );

  function fillEditor() {
    for (const f of FILES) editors[f].setValue(state.files[f]);
  }

  function showFileStatus() {
    const file = activeFile();
    ideLang.textContent = LANGUAGE_NAMES[file];
    editors[file].refresh();
    editors[file].reportCursor();
  }

  function updateFileNames() {
    for (const f of FILES) {
      const name = el.tabs.querySelector(`[data-name="${f}"]`);
      if (name) name.textContent = fileName(f);
    }
  }

  // Las pestañas ocultas miden cero: al mostrarse, el editor recalcula su tamaño.
  on(el.tabs, 'tabchange', () => requestAnimationFrame(showFileStatus));

  function load(slug) {
    const requested = mineId(slug);
    if (requested) state.slug = myComponents.get(requested) ? slug : '';
    else state.slug = components.some((c) => c.slug === slug) ? slug : '';
    el.base.value = state.slug;
    const mine = mineId() ? myComponents.get(mineId()) : null;
    const draft = mine ? null : drafts.get(state.slug);
    state.files = mine ? { ...STARTER, ...pickFiles(mine) } : { ...original(state.slug), ...pickFiles(draft) };
    state.uses = (mine ? mine.uses : draft?.uses) ?? [];
    el.reset.hidden = Boolean(mine);
    el.deleteComponent.hidden = !mine;
    renderUses();
    renderInsertMine();
    renderReview();
    discardProposal({ silent: true });
    fillEditor();
    updateFileNames();
    showFileStatus();
    ideSaved.textContent = '';
    renderVersions();
    render();
    const url = new URL(location.href);
    if (state.slug) url.searchParams.set('componente', state.slug);
    else url.searchParams.delete('componente');
    history.replaceState(null, '', url);
    setStatus(
      mine
        ? `Editando «${mine.name}». Los cambios se guardan solos.`
        : draft
          ? 'Borrador recuperado de este navegador.'
          : '',
    );
  }

  /** Guarda lo que hay en el editor: en el componente propio o en el borrador. */
  function persist() {
    const id = mineId();
    if (id) {
      const record = myComponents.get(id);
      if (!record) return false;
      const ok = myComponents.save(id, { ...record, ...state.files, uses: state.uses });
      refreshVocabulary();
      return ok;
    }
    return drafts.set(state.slug, { ...state.files, uses: state.uses });
  }

  function pickFiles(value) {
    if (!value) return {};
    return Object.fromEntries(FILES.filter((f) => typeof value[f] === 'string').map((f) => [f, value[f]]));
  }

  const saveDraft = debounce(() => {
    if (persist()) ideSaved.textContent = mineId() ? 'Guardado' : 'Borrador guardado';
    else {
      ideSaved.textContent = 'Sin guardar';
      setStatus('No se pudo guardar el borrador en este navegador.');
    }
  }, 600);

  function activeFile() {
    return el.tabs.querySelector('[role="tab"][aria-selected="true"]')?.dataset.file ?? 'html';
  }

  function fileName(file) {
    const id = mineId();
    if (id) return `${id}.${file}`;
    const src = sources();
    if (file === 'css') return src.css?.split('/').pop() ?? 'componente.css';
    if (file === 'js') return src.js ?? 'componente.js';
    return `${state.slug || 'componente'}.html`;
  }

  on(el.base, 'change', () => load(el.base.value));

  on(el.copy, 'click', async () => {
    const file = activeFile();
    try {
      await navigator.clipboard.writeText(state.files[file]);
      setStatus(`Copiado: ${fileName(file)}.`);
    } catch {
      setStatus('No se pudo copiar. Selecciona el código y cópialo a mano.');
    }
  });

  on(el.download, 'click', () => {
    const file = activeFile();
    const type = { html: 'text/html', css: 'text/css', js: 'text/javascript' }[file];
    const url = URL.createObjectURL(new Blob([state.files[file]], { type }));
    const link = Object.assign(document.createElement('a'), { href: url, download: fileName(file) });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Descargado: ${fileName(file)}.`);
  });

  on(el.confirmReset, 'close', () => {
    if (el.confirmReset.returnValue !== 'confirmar') return;
    el.confirmReset.returnValue = '';
    drafts.clear(state.slug);
    load(state.slug);
    setStatus('Restaurado el código original.');
  });

  on(el.scheme, 'click', () => {
    state.scheme = state.scheme === 'light' ? 'dark' : 'light';
    el.scheme.setAttribute('aria-pressed', String(state.scheme === 'dark'));
    render();
  });
  on(el.reload, 'click', render);
  on(el.consoleClear, 'click', clearConsole);

  /* ---------- Revisión ---------- */

  const TONES = { error: 'danger', warn: 'warning' };

  function renderReview() {
    const hallazgos = reviewComponent(state.files);
    const errores = hallazgos.filter((h) => h.level === 'error').length;
    el.reviewCount.textContent = hallazgos.length ? `${hallazgos.length}` : 'Sin avisos';
    el.reviewCount.dataset.tone = errores ? 'danger' : hallazgos.length ? 'warning' : 'success';

    if (!hallazgos.length) {
      const ok = document.createElement('li');
      ok.className = 'callout';
      ok.dataset.tone = 'success';
      const texto = document.createElement('div');
      const titulo = document.createElement('p');
      titulo.className = 'callout-title';
      titulo.textContent = 'Cumple las reglas que se pueden revisar con código';
      const cuerpo = document.createElement('p');
      cuerpo.textContent = 'Repasa las comprobaciones manuales antes de proponerlo al proyecto.';
      texto.append(titulo, cuerpo);
      ok.append(texto);
      el.reviewList.replaceChildren(ok);
      return;
    }

    el.reviewList.replaceChildren(
      ...hallazgos.map(({ level, text }) => {
        const item = document.createElement('li');
        item.className = 'callout';
        item.dataset.tone = TONES[level];
        const cuerpo = document.createElement('div');
        const etiqueta = document.createElement('p');
        etiqueta.className = 'callout-title';
        etiqueta.textContent = level === 'error' ? 'Hay que corregirlo' : 'Revísalo';
        const detalle = document.createElement('p');
        detalle.textContent = text;
        cuerpo.append(etiqueta, detalle);
        item.append(cuerpo);
        return item;
      }),
    );
  }
  const reviewSoon = debounce(renderReview, 500);

  /* ---------- Mis componentes y reutilización ---------- */

  const sortedMine = () =>
    Object.entries(myComponents.all())
      .map(([id, record]) => ({ id, ...record }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  function renderBaseOptions() {
    const mine = sortedMine();
    el.baseMine.hidden = mine.length === 0;
    el.baseMine.replaceChildren(
      ...mine.map(({ id, name }) => Object.assign(document.createElement('option'), { value: MINE_PREFIX + id, textContent: name })),
    );
    el.base.value = state.slug;
  }

  function renderUses() {
    const used = state.uses.map((id) => ({ id, record: myComponents.get(id) })).filter((u) => u.record);
    el.uses.hidden = used.length === 0;
    el.usesList.replaceChildren(
      ...used.map(({ id, record }) => {
        const item = document.createElement('li');
        item.className = 'lab-use';
        const name = document.createElement('span');
        name.textContent = record.name;
        const remove = button('', { variant: 'ghost', tone: 'neutral' });
        remove.dataset.iconOnly = '';
        remove.setAttribute('aria-label', `Dejar de usar ${record.name}`);
        remove.textContent = '×';
        on(remove, 'click', () => {
          state.uses = state.uses.filter((u) => u !== id);
          persist();
          renderUses();
          render();
          setStatus(`Ya no se cargan los estilos de «${record.name}». Su marcado sigue en el HTML.`);
        });
        item.append(name, remove);
        return item;
      }),
    );
  }

  function renderInsertMine() {
    const available = sortedMine().filter(({ id }) => !wouldCycle(id));
    el.insertMineEmpty.hidden = available.length > 0;
    el.insertMineEmpty.textContent =
      sortedMine().length === 0
        ? 'Aún no tienes componentes propios. Crea uno y pulsa «Guardar como componente».'
        : 'No hay otros componentes propios que puedas insertar aquí.';
    el.insertMine.replaceChildren(
      ...available.map(({ id, name }) => {
        const item = document.createElement('li');
        const b = button(name, { variant: 'soft', tone: 'brand' });
        const record = myComponents.get(id);
        const hasSlot = Boolean(record && slotRange(record.html));
        if (hasSlot) {
          const mark = document.createElement('span');
          mark.className = 'badge';
          mark.dataset.variant = 'outline';
          mark.dataset.tone = 'neutral';
          mark.textContent = 'hueco';
          b.append(' ', mark);
        }
        b.setAttribute('aria-label', `Insertar ${name}${hasSlot ? ', acepta contenido dentro' : ''}`);
        on(b, 'click', () => insertMine(id));
        item.append(b);
        return item;
      }),
    );
  }

  /** Lleva el marcado a la pestaña HTML, en el cursor. */
  /**
   * Hueco de contenido: el primer elemento con data-slot. Devuelve dónde empieza y acaba
   * lo que hay dentro, contando anidamientos del mismo elemento.
   * @returns {{ start: number, end: number } | null}
   */
  function slotRange(html) {
    const open = /<([a-z][\w-]*)\b[^>]*\bdata-slot\b[^>]*>/i.exec(html);
    if (!open) return null;
    const tag = open[1];
    const pairs = new RegExp(`</?${tag}\\b[^>]*>`, 'gi');
    pairs.lastIndex = open.index + open[0].length;
    let depth = 1;
    for (let m = pairs.exec(html); m; m = pairs.exec(html)) {
      depth += m[0][1] === '/' ? -1 : 1;
      if (depth === 0) return { start: open.index + open[0].length, end: m.index };
    }
    return null;
  }

  /** Vuelve a sangrar un bloque desde cero, con `pad` por delante de cada línea. */
  function reindent(text, pad) {
    const lines = text.replaceAll('\t', '  ').split('\n');
    const widths = lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)[0].length);
    const base = widths.length ? Math.min(...widths) : 0;
    return lines.map((l) => (l.trim() ? pad + l.slice(base) : '')).join('\n');
  }

  /**
   * Prepara el marcado que se va a insertar. Si el componente declara un hueco (data-slot),
   * dentro va lo que esté seleccionado; si no hay selección, ahí queda el cursor.
   */
  function withChildren(html, children) {
    const slot = slotRange(html);
    if (!slot) return `${html}\n`;
    const inner = children.trim() ? `\n${reindent(children, '  ')}\n` : `\n  ${CARET}\n`;
    return `${html.slice(0, slot.start)}${inner}${html.slice(slot.end)}\n`;
  }

  function insertSnippet(html) {
    el.insert.close();
    el.tabs.querySelector('[role="tab"][data-file="html"]')?.click();
    // Inmediato (no en un rAF): el texto debe ir al componente que está abierto ahora.
    const hasSlot = Boolean(slotRange(html));
    editors.html.insert(withChildren(html.trim(), editors.html.selection));
    return hasSlot;
  }

  function insertMine(id) {
    const record = myComponents.get(id);
    if (!record || wouldCycle(id)) return;
    if (!state.uses.includes(id)) state.uses = [...state.uses, id];
    const hasSlot = insertSnippet(record.html);
    persist();
    renderUses();
    setStatus(
      hasSlot
        ? `Insertado «${record.name}». El cursor está en su hueco: escribe ahí dentro o inserta otro componente.`
        : `Insertado «${record.name}». Sus estilos y su JS se cargan con este componente.`,
    );
  }

  for (const trigger of document.querySelectorAll('[data-insert-angela]')) {
    on(trigger, 'click', () => {
      const component = components.find((c) => c.slug === trigger.dataset.insertAngela);
      const example = component?.examples[Number(trigger.dataset.insertExample)];
      if (!example) return;
      const hasSlot = insertSnippet(example.code);
      setStatus(`Insertado: ${component.title} · ${example.title}.${hasSlot ? ' El cursor está en su hueco.' : ''}`);
    });
  }

  // Guardar como componente propio.
  const nameError = document.getElementById('lab-component-name-error');
  function validateName() {
    const id = toComponentId(el.componentName.value);
    const message = !id
      ? 'Escribe un nombre con al menos una letra o número.'
      : myComponents.get(id)
        ? 'Ya tienes un componente con ese nombre. Elige otro.'
        : '';
    el.componentName.setCustomValidity(message);
    if (message) nameError.textContent = message;
    return id;
  }

  on(el.saveComponentOpen, 'click', () => {
    const current = componentInfo();
    el.componentName.value = mineId() ? `${current.title} (copia)` : current ? `Mi ${current.title.toLowerCase()}` : '';
    validateName();
    el.saveComponent.showModal();
  });
  on(el.componentName, 'input', validateName);

  // En el submit (síncrono) y no en el close del diálogo: así se guarda justo lo que hay en el editor.
  on(el.saveComponentForm, 'submit', (event) => {
    const id = validateName();
    if (!id || el.componentName.validationMessage) {
      event.preventDefault();
      el.componentName.reportValidity();
      return;
    }
    const name = el.componentName.value.trim();
    if (!myComponents.save(id, { name, ...state.files, uses: [...state.uses] })) {
      setStatus('No se pudo guardar el componente en este navegador.');
      return;
    }
    if (state.slug === '') drafts.clear('');
    refreshVocabulary();
    renderBaseOptions();
    renderInsertMine();
    load(MINE_PREFIX + id);
    setStatus(`Guardado «${name}». Ya puedes insertarlo en otros componentes.`);
  });

  // Eliminar un componente propio (con confirmación).
  on(el.deleteComponent, 'click', () => {
    const id = mineId();
    const record = id && myComponents.get(id);
    if (!record) return;
    const users = sortedMine().filter((r) => (r.uses ?? []).includes(id));
    el.confirmDeleteComponentDesc.textContent =
      `Se elimina «${record.name}» de este navegador. No se puede deshacer.` +
      (users.length ? ` Lo usan ${users.map((u) => `«${u.name}»`).join(', ')}: dejarán de cargar sus estilos.` : '');
  });

  on(el.confirmDeleteComponent, 'close', () => {
    if (el.confirmDeleteComponent.returnValue !== 'confirmar') return;
    el.confirmDeleteComponent.returnValue = '';
    const id = mineId();
    const name = myComponents.get(id)?.name ?? id;
    myComponents.remove(id);
    refreshVocabulary();
    renderBaseOptions();
    renderInsertMine();
    load('');
    setStatus(`Componente «${name}» eliminado.`);
  });

  /* ---------- Versiones ---------- */

  let pendingDelete = null;

  function renderVersions() {
    const list = versions.list(state.slug);
    el.versionsEmpty.hidden = list.length > 0;
    el.versions.replaceChildren(
      ...list.map((version) => {
        const item = document.createElement('li');
        const text = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = version.label;
        const date = document.createElement('span');
        date.className = 'muted';
        date.textContent = dateFormat.format(version.at);
        text.append(name, ' ', date);

        const actions = document.createElement('div');
        actions.className = 'cluster';
        const restore = button('Restaurar', { variant: 'outline', tone: 'neutral' });
        restore.setAttribute('aria-label', `Restaurar ${version.label}, ${date.textContent}`);
        on(restore, 'click', () => {
          versions.add(state.slug, { label: 'Antes de restaurar', ...state.files });
          state.files = { ...state.files, ...pickFiles(version) };
          fillEditor();
          persist();
          renderVersions();
          render();
          setStatus(`Restaurada «${version.label}». El estado anterior quedó guardado como versión.`);
        });
        const remove = button('Eliminar', { variant: 'ghost', tone: 'danger' });
        remove.setAttribute('aria-label', `Eliminar ${version.label}, ${date.textContent}`);
        on(remove, 'click', () => {
          pendingDelete = version.id;
          el.confirmDeleteName.textContent = `${version.label} (${date.textContent})`;
          el.confirmDelete.showModal();
        });
        actions.append(restore, remove);
        item.append(text, actions);
        return item;
      }),
    );
  }

  function button(label, { variant, tone }) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'button';
    b.dataset.variant = variant;
    b.dataset.tone = tone;
    b.dataset.size = 'sm';
    b.textContent = label;
    return b;
  }

  on(el.confirmDelete, 'close', () => {
    if (el.confirmDelete.returnValue === 'confirmar' && pendingDelete) {
      versions.remove(state.slug, pendingDelete);
      renderVersions();
      setStatus('Versión eliminada.');
    }
    el.confirmDelete.returnValue = '';
    pendingDelete = null;
  });

  on(el.save, 'click', () => {
    const list = versions.add(state.slug, { label: 'Guardada a mano', ...state.files });
    renderVersions();
    setStatus(list ? 'Versión guardada en este navegador.' : 'No se pudo guardar la versión en este navegador.');
  });

  /* ---------- Configuración de la IA ---------- */

  function refreshAiState() {
    const key = apiKey.get();
    const model = settings.get().model;
    el.configModel.value = model;
    el.configRemember.checked = apiKey.remembered();
    el.configForget.hidden = !key;
    el.aiState.textContent = key
      ? `Usando ${el.configModel.selectedOptions[0]?.textContent ?? model}. Clave guardada ${
          apiKey.remembered() ? 'en este navegador' : 'solo en esta pestaña'
        }.`
      : 'Configura tu clave de Anthropic para pedir propuestas.';
  }

  on(el.configKey, 'input', () => el.configKey.setCustomValidity(''));
  on(el.configForm, 'submit', (event) => {
    const key = el.configKey.value.trim();
    if (key && !/^sk-ant-[\w-]{10,}$/.test(key)) {
      event.preventDefault();
      el.configKey.setCustomValidity('La clave debe empezar por sk-ant-.');
      el.configKey.reportValidity();
      return;
    }
    const current = apiKey.get();
    if (key || current) apiKey.set(key || current, el.configRemember.checked);
    settings.set({ model: el.configModel.value });
    el.configKey.value = '';
    refreshAiState();
    setStatus(key ? 'Clave guardada.' : 'Ajustes de la IA guardados.');
  });

  on(el.configForget, 'click', () => {
    apiKey.clear();
    el.configKey.value = '';
    el.config.close();
    refreshAiState();
    setStatus('Clave eliminada de este navegador.');
  });

  /* ---------- Asistente ---------- */

  for (const quick of document.querySelectorAll('[data-prompt]')) {
    on(quick, 'click', () => {
      el.aiPrompt.value = quick.dataset.prompt;
      el.aiPrompt.focus();
    });
  }

  function setBusy(busy) {
    el.aiSubmit.disabled = busy;
    el.aiSubmit.textContent = busy ? 'Pidiendo propuesta…' : 'Pedir propuesta';
    el.aiCancel.hidden = !busy;
    el.aiProgress.hidden = !busy;
  }

  on(el.aiCancel, 'click', () => state.request?.abort());

  on(el.aiForm, 'submit', async (event) => {
    event.preventDefault();
    const key = apiKey.get();
    if (!key) {
      el.config.showModal();
      return;
    }
    const instruction = el.aiPrompt.value.trim();
    if (!instruction) return;

    state.request = new AbortController();
    setBusy(true);
    el.aiState.textContent = 'La IA está preparando una propuesta. Puede tardar un poco.';
    try {
      // Carga diferida: el SDK solo se descarga si alguien usa el asistente.
      const { proposeChange } = await import('./ai.js');
      const src = sources();
      const info = componentInfo();
      const proposal = await proposeChange({
        apiKey: key,
        model: settings.get().model,
        instruction,
        component: info ? { title: info.title, cssFile: src.css, jsFile: src.js } : null,
        files: { ...state.files },
        dependencies: dependencies().map(({ name, html, css }) => ({ name, html, css })),
        signal: state.request.signal,
      });
      showProposal(proposal);
      refreshAiState();
    } catch (error) {
      el.aiState.textContent = error?.message || 'Algo salió mal al pedir la propuesta.';
    } finally {
      state.request = null;
      setBusy(false);
    }
  });

  function showProposal(proposal) {
    state.proposal = { html: proposal.html, css: proposal.css, js: proposal.js };
    el.proposalSummary.textContent = proposal.resumen;
    el.proposalChanges.replaceChildren(
      ...proposal.cambios.map((text) => Object.assign(document.createElement('li'), { textContent: text })),
    );
    const warnings = [...new Set([...proposal.advertencias, ...riskyPatterns(`${proposal.html}\n${proposal.js}`)])];
    el.proposalWarnings.hidden = warnings.length === 0;
    el.proposalWarningList.replaceChildren(
      ...warnings.map((text) => Object.assign(document.createElement('li'), { textContent: text })),
    );
    for (const f of FILES) el.proposalCode[f].textContent = proposal[f];
    el.proposal.hidden = false;
    // Una sola acción primaria a la vista: mientras hay propuesta, lo es "Aplicar".
    el.aiSubmit.dataset.variant = 'outline';
    el.aiSubmit.dataset.tone = 'neutral';
    setTrying(true);
    el.proposal.scrollIntoView({ block: 'nearest' });
  }

  function setTrying(trying) {
    state.trying = trying && Boolean(state.proposal);
    el.proposalTry.setAttribute('aria-pressed', String(state.trying));
    render();
  }

  function discardProposal({ silent = false } = {}) {
    state.proposal = null;
    state.trying = false;
    el.proposal.hidden = true;
    el.proposalTry.setAttribute('aria-pressed', 'false');
    delete el.aiSubmit.dataset.variant;
    delete el.aiSubmit.dataset.tone;
    if (!silent) render();
  }

  on(el.proposalTry, 'click', () => setTrying(!state.trying));
  on(el.proposalDiscard, 'click', () => {
    discardProposal();
    setStatus('Propuesta descartada.');
  });
  on(el.proposalApply, 'click', () => {
    if (!state.proposal) return;
    versions.add(state.slug, { label: 'Antes de aplicar la IA', ...state.files });
    state.files = { ...state.proposal };
    fillEditor();
    persist();
    discardProposal();
    renderVersions();
    setStatus('Propuesta aplicada. La versión anterior quedó en Versiones.');
  });

  /* ---------- Arranque ---------- */

  state.scheme = getRenderedScheme();
  el.scheme.setAttribute('aria-pressed', String(state.scheme === 'dark'));
  refreshAiState();
  refreshVocabulary();
  renderBaseOptions();
  load(new URLSearchParams(location.search).get('componente') ?? '');

  return () => {
    abort.abort();
    state.request?.abort();
    state.port?.close();
    for (const editor of Object.values(editors)) editor.destroy();
  };
}
