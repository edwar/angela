/**
 * Interfaz del laboratorio: editor de tres pestañas, vista previa aislada, versiones y asistente de IA.
 * Regla de oro: nada del editor ni de la IA se inserta en esta página como HTML ni se ejecuta aquí.
 * Todo se muestra con textContent o se ejecuta dentro del iframe aislado (ver preview.js).
 */
import { components } from '../../data/components.js';
import { angelaCss, angelaJs, bundleAngelaCss, buildPreviewDocument, componentSources, riskyPatterns } from './preview.js';
import { apiKey, drafts, settings, versions } from './storage.js';
import { getRenderedScheme } from 'angela/js/theme';

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
  };

  const state = {
    slug: '',
    files: { ...STARTER },
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

  const sources = () => componentSources[state.slug] ?? {};
  const componentInfo = () => components.find((c) => c.slug === state.slug) ?? null;

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

  function fillEditor() {
    for (const f of FILES) el.code[f].value = state.files[f];
  }

  function load(slug) {
    state.slug = components.some((c) => c.slug === slug) ? slug : '';
    el.base.value = state.slug;
    state.files = { ...original(state.slug), ...pickFiles(drafts.get(state.slug)) };
    discardProposal({ silent: true });
    fillEditor();
    renderVersions();
    render();
    const url = new URL(location.href);
    if (state.slug) url.searchParams.set('componente', state.slug);
    else url.searchParams.delete('componente');
    history.replaceState(null, '', url);
    setStatus(drafts.get(state.slug) ? 'Borrador recuperado de este navegador.' : '');
  }

  function pickFiles(value) {
    if (!value) return {};
    return Object.fromEntries(FILES.filter((f) => typeof value[f] === 'string').map((f) => [f, value[f]]));
  }

  const saveDraft = debounce(() => {
    if (!drafts.set(state.slug, state.files)) setStatus('No se pudo guardar el borrador en este navegador.');
  }, 600);

  for (const f of FILES) {
    const area = el.code[f];
    let escaped = false;
    on(area, 'input', () => {
      state.files[f] = area.value;
      if (state.trying) setTrying(false);
      saveDraft();
      renderSoon();
    });
    on(area, 'keydown', (event) => {
      if (event.key === 'Escape') {
        escaped = true;
        return;
      }
      if (event.key === 'Tab' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey && !escaped) {
        event.preventDefault();
        area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end');
        area.dispatchEvent(new Event('input', { bubbles: true }));
      }
      escaped = false;
    });
  }

  function activeFile() {
    return el.tabs.querySelector('[role="tab"][aria-selected="true"]')?.dataset.file ?? 'html';
  }

  function fileName(file) {
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
          drafts.set(state.slug, state.files);
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
    drafts.set(state.slug, state.files);
    discardProposal();
    renderVersions();
    setStatus('Propuesta aplicada. La versión anterior quedó en Versiones.');
  });

  /* ---------- Arranque ---------- */

  state.scheme = getRenderedScheme();
  el.scheme.setAttribute('aria-pressed', String(state.scheme === 'dark'));
  refreshAiState();
  load(new URLSearchParams(location.search).get('componente') ?? '');

  return () => {
    abort.abort();
    state.request?.abort();
    state.port?.close();
  };
}
