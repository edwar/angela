/**
 * Interfaz del laboratorio: asistente de IA, editor de tres archivos, vista previa aislada,
 * revisión automática y propuesta al proyecto por pull request.
 *
 * Regla de oro: nada del editor ni de la IA se inserta en esta página como HTML ni se ejecuta
 * aquí. Todo se muestra con textContent o se ejecuta dentro del iframe aislado (ver preview.js).
 */
import { components } from '../../data/components.js';
import {
  angelaCss,
  angelaJs,
  angelaTests,
  angelaVocabulary,
  bundleAngelaCss,
  buildPreviewDocument,
  sourcesFor,
  riskyPatterns,
  splitComponents,
} from './preview.js';
import { aiKey, drafts, githubToken, settings, toComponentId } from './storage.js';
import { getRenderedScheme } from '@angela-ui/angela/js/theme';
import { selectTab } from '@angela-ui/angela/js/tabs';
import { createCodeEditor } from './editor.js';
import { reviewComponent } from './review.js';
import { cssBuildError } from './css-build.js';
import { buildDocsEntry, componentTitle, mergeDocsEntry, serializeDocsEntry } from './docs-entry.js';
import { guessFormat } from './ai.js';
import { diffStats, lineDiff, withContext } from './diff.js';

const FILES = ['html', 'css', 'js', 'test'];
const TAB_FILES = { html: 'HTML', css: 'CSS', js: 'JavaScript', test: 'Test' };
const LANGUAGE_NAMES = { html: 'HTML', css: 'CSS', js: 'JavaScript', test: 'JavaScript (Vitest)' };

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
// Exporta una función de activación: angela() la llama en la web, y aquí también.
//
// export function enhanceNota(root = globalThis.document) {
//   if (typeof window === 'undefined' || !root) return () => {};
//   const onClick = (event) => { /* event.target.closest('.nota') … */ };
//   root.addEventListener('click', onClick);
//   return () => root.removeEventListener('click', onClick);
// }
`,
  test: `// @vitest-environment happy-dom
//
// Test del módulo de la pestaña JavaScript: Vitest en un DOM simulado (happy-dom).
// Se sube con el pull request y lo ejecuta la revisión del PR: un componente con JS no pasa
// sin su test. Importa desde './componente.js': al proponer, se cambia por el nombre real.
//
// import { afterEach, describe, expect, it } from 'vitest';
// import { enhanceNota } from './componente.js';
//
// let limpiar;
// afterEach(() => {
//   limpiar?.();
//   document.body.innerHTML = '';
// });
//
// describe('nota', () => {
//   it('marca la nota al pulsarla', () => {
//     document.body.innerHTML = '<article class="nota"></article>';
//     limpiar = enhanceNota(document);
//     document.querySelector('.nota').click();
//     expect(document.querySelector('.nota').hasAttribute('data-activa')).toBe(true);
//   });
// });
`,
};

const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

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
    consoleList: $('lab-console-list'),
    consoleCount: $('lab-console-count'),
    consoleClear: $('lab-console-clear'),
    ideCursor: $('lab-ide-cursor'),
    ideLang: $('lab-ide-lang'),
    ideSaved: $('lab-ide-saved'),
    reviewList: $('lab-review-list'),
    reviewCount: $('lab-review-count'),
    aiState: $('lab-ai-state'),
    aiForm: $('lab-ai-form'),
    aiPrompt: $('lab-ai-prompt'),
    aiSubmit: $('lab-ai-submit'),
    aiCancel: $('lab-ai-cancel'),
    aiProgress: $('lab-ai-progress'),
    proposal: $('lab-proposal'),
    proposalSummary: $('lab-proposal-summary'),
    proposalChanges: $('lab-proposal-changes'),
    proposalWarnings: $('lab-proposal-warnings'),
    proposalWarningList: $('lab-proposal-warning-list'),
    proposalCode: Object.fromEntries(FILES.map((f) => [f, $(`lab-proposal-${f}`)])),
    proposalTry: $('lab-proposal-try'),
    proposalDiscard: $('lab-proposal-discard'),
    proposalApply: $('lab-proposal-apply'),
    settings: $('lab-settings'),
    settingsForm: $('lab-settings-form'),
    aiUrl: $('lab-ai-url'),
    aiFormat: $('lab-ai-format'),
    aiModel: $('lab-ai-model'),
    aiKeyInput: $('lab-ai-key'),
    ghToken: $('lab-gh-token'),
    aiKeyState: $('lab-ai-key-state'),
    aiTest: $('lab-ai-test'),
    ghTokenState: $('lab-gh-token-state'),
    remember: $('lab-remember'),
    forget: $('lab-forget'),
    propose: $('lab-propose'),
    proposeOpen: $('lab-propose-open'),
    proposeForm: $('lab-propose-form'),
    proposeKind: $('lab-propose-kind'),
    proposeName: $('lab-propose-name'),
    proposeSummary: $('lab-propose-summary'),
    proposeWarnings: $('lab-propose-warnings'),
    proposeWarningsText: $('lab-propose-warnings-text'),
    proposeStep: $('lab-propose-step'),
    proposeA11y: $('lab-propose-a11y'),
    proposeParts: $('lab-propose-parts'),
    proposePartsField: $('lab-propose-parts-field'),
    partsState: $('lab-parts-state'),
    motionNotice: $('lab-motion-notice'),
    motionToggle: $('lab-motion-toggle'),
    proposeSend: $('lab-propose-send'),
    proposeError: $('lab-propose-error'),
    proposeErrorText: $('lab-propose-error-text'),
    proposeErrorRecover: $('lab-propose-error-recover'),
    proposeErrorLink: $('lab-propose-error-link'),
    done: $('lab-done'),
    doneTitle: $('lab-done-title'),
    doneLink: $('lab-done-link'),
    prOpen: $('lab-pr-open'),
    pr: $('lab-pr'),
    prForm: $('lab-pr-form'),
    prRef: $('lab-pr-ref'),
    prSend: $('lab-pr-send'),
    prStep: $('lab-pr-step'),
    prDraft: $('lab-pr-draft'),
    prDraftTitle: $('lab-pr-draft-title'),
    prDraftText: $('lab-pr-draft-text'),
    proposeLead: $('lab-propose-lead'),
    proposeOpenText: $('lab-propose-open-text'),
    proposeTitle: $('lab-propose-title'),
    proposePartsTitle: $('lab-propose-parts-title'),
    proposeNameField: $('lab-propose-name-field'),
    proposeSummaryField: $('lab-propose-summary-field'),
    prError: $('lab-pr-error'),
    prErrorText: $('lab-pr-error-text'),
    prState: $('lab-pr-state'),
    prStateTitle: $('lab-pr-state-title'),
    prStateText: $('lab-pr-state-text'),
    prStateLink: $('lab-pr-state-link'),
    aiReviewRun: $('lab-ai-review-run'),
    aiReviewCancel: $('lab-ai-review-cancel'),
    aiReviewProgress: $('lab-ai-review-progress'),
    aiReviewStatus: $('lab-ai-review-status'),
    aiReviewSetup: $('lab-ai-review-setup'),
    aiReviewOk: $('lab-ai-review-ok'),
    aiReviewOkTitle: $('lab-ai-review-ok-title'),
    aiReviewOkSummary: $('lab-ai-review-ok-summary'),
    aiReviewCheckedBox: $('lab-ai-review-checked-box'),
    aiReviewChecked: $('lab-ai-review-checked'),
    aiReviewChanges: $('lab-ai-review-changes'),
    aiReviewChangesTitle: $('lab-ai-review-changes-title'),
    aiReviewSummary: $('lab-ai-review-summary'),
    aiReviewIssues: $('lab-ai-review-issues'),
    aiReviewApi: $('lab-ai-review-api'),
    aiReviewApiList: $('lab-ai-review-api-list'),
    aiReviewAfter: $('lab-ai-review-after'),
    aiReviewWarnings: $('lab-ai-review-warnings'),
    aiReviewWarningList: $('lab-ai-review-warning-list'),
    aiReviewDiff: $('lab-ai-review-diff'),
    aiReviewReject: $('lab-ai-review-reject'),
    aiReviewTry: $('lab-ai-review-try'),
    aiReviewAccept: $('lab-ai-review-accept'),
    imagenesAbrir: $('lab-imagenes-abrir'),
    imagenes: $('lab-imagenes'),
    imagenesTamano: $('lab-imagenes-tamano'),
    imagenesCategoria: $('lab-imagenes-categoria'),
    imagenesRejilla: $('lab-imagenes-rejilla'),
    resetOpen: $('lab-reset-open'),
    reset: $('lab-reset'),
    resetDesc: $('lab-reset-desc'),
    resetLoss: $('lab-reset-loss'),
    resetList: $('lab-reset-list'),
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
    /** Pull request abierto del que se trajo el código: al proponer se actualiza. */
    pr: null,
    /** Pull request traído que espera confirmación porque sustituiría un borrador. */
    prPendiente: null,
    /** Respuesta del parser del build para un CSS: { css, error }. */
    cssBuild: null,
    findings: [],
    ignoreReducedMotion: false,
  };

  // Si el sistema pide menos movimiento, la animación del componente no se ve aquí.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const abort = new AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, { signal: abort.signal });
  const setStatus = (text) => (el.status.textContent = text);

  const sources = () => sourcesFor(state.slug);
  const componentInfo = () => components.find((c) => c.slug === state.slug) ?? null;

  function original(slug) {
    const component = components.find((c) => c.slug === slug);
    const src = sourcesFor(slug);
    if (!component || !src.css) return { ...STARTER };
    return {
      html: component.examples.map((ex) => `<!-- ${ex.title} -->\n${ex.code}`).join('\n\n'),
      css: angelaCss[src.css] ?? '',
      js: src.js ? (angelaJs[src.js] ?? '') : STARTER.js,
      test: src.js ? (angelaTests[src.js] ?? STARTER.test) : STARTER.test,
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
        ignoreReducedMotion: state.ignoreReducedMotion,
        // Las imágenes de ejemplo del sitio (/img/…) también en local, donde el sitio va por http.
        imageOrigin: location.origin,
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

  on(el.scheme, 'click', () => {
    state.scheme = state.scheme === 'light' ? 'dark' : 'light';
    el.scheme.setAttribute('aria-pressed', String(state.scheme === 'dark'));
    el.scheme.dataset.scheme = state.scheme;
    render();
  });
  on(el.consoleClear, 'click', clearConsole);

  /* ---------- Editor ---------- */

  const vocabulary = angelaVocabulary();
  const editors = Object.fromEntries(
    FILES.map((f) => [
      f,
      createCodeEditor(el.code[f], {
        language: f === 'test' ? 'js' : f,
        value: '',
        label: el.code[f].dataset.label,
        describedBy: 'lab-code-hint',
        vocabulary,
        onChange(value) {
          state.files[f] = value;
          if (state.trying) setTrying(false);
          // El «todo cumple» era de otro código: deja de valer en cuanto cambia.
          el.aiReviewOk.hidden = true;
          el.ideSaved.textContent = 'Guardando…';
          saveDraft();
          renderSoon();
          reviewSoon();
          renderParts();
          renderMotionNotice();
        },
        onCursor({ line, column, selected }) {
          if (activeFile() !== f) return;
          el.ideCursor.textContent = `Lín. ${line}, col. ${column}${selected ? ` (${selected} seleccionados)` : ''}`;
        },
      }),
    ]),
  );

  // Se guarda solo: no hay botón de guardar.
  const saveDraft = debounce(() => {
    el.ideSaved.textContent = drafts.set(state.slug, state.files) ? 'Guardado' : 'Sin guardar';
  }, 600);

  const activeFile = () => el.tabs.querySelector('[role="tab"][aria-selected="true"]')?.dataset.file ?? 'html';

  function fileName(file) {
    const src = sources();
    if (file === 'css') return src.css?.split('/').pop() ?? 'componente.css';
    if (file === 'js') return src.js ?? 'componente.js';
    if (file === 'test') return (src.js ?? 'componente.js').replace(/\.js$/, '.test.js');
    return `${state.slug || 'componente'}.html`;
  }

  function showFileStatus() {
    const file = activeFile();
    el.ideLang.textContent = LANGUAGE_NAMES[file];
    editors[file].refresh();
    editors[file].reportCursor();
  }

  // Las pestañas ocultas miden cero: al mostrarse, el editor recalcula su tamaño.
  on(el.tabs, 'tabchange', () => requestAnimationFrame(showFileStatus));

  function fillEditor() {
    for (const f of FILES) editors[f].setValue(state.files[f]);
    for (const f of FILES) {
      const name = el.tabs.querySelector(`[data-name="${f}"]`);
      if (name) name.textContent = fileName(f);
    }
  }

  function pickFiles(value) {
    if (!value) return {};
    return Object.fromEntries(FILES.filter((f) => typeof value[f] === 'string').map((f) => [f, value[f]]));
  }

  function load(slug) {
    state.slug = components.some((c) => c.slug === slug) ? slug : '';
    state.pr = null;
    renderPrState();
    el.base.value = state.slug;
    const draft = drafts.get(state.slug);
    state.files = { ...original(state.slug), ...pickFiles(draft) };
    discardProposal({ silent: true });
    el.aiReviewOk.hidden = true;
    el.aiReviewStatus.textContent = '';
    fillEditor();
    showFileStatus();
    el.ideSaved.textContent = '';
    renderReview();
    renderParts();
    renderMotionNotice();
    render();
    const url = new URL(location.href);
    if (state.slug) url.searchParams.set('componente', state.slug);
    else url.searchParams.delete('componente');
    url.searchParams.delete('pr');
    history.replaceState(null, '', url);
    setStatus(draft ? 'Recuperado lo que tenías escrito en este navegador.' : '');
  }

  on(el.base, 'change', () => {
    el.done.hidden = true;
    load(el.base.value);
  });

  /* ---------- Revisión ---------- */

  const TONES = { error: 'danger', warn: 'warning' };

  function renderReview() {
    const { css } = state.files;
    const cssBuild = state.cssBuild?.css === css ? state.cssBuild.error : null;
    // El parser del build es asíncrono: al tener su respuesta para este CSS, se vuelve a pintar.
    if (state.cssBuild?.css !== css) {
      cssBuildError(css).then((error) => {
        if (state.files.css !== css) return;
        state.cssBuild = { css, error };
        renderReview();
      });
    }
    const hallazgos = reviewComponent({ ...state.files, cssBuild });
    state.findings = hallazgos;
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

  /* ---------- Ajustes ---------- */

  /**
   * Los campos de clave se dejan vacíos (no se vuelve a mostrar un secreto guardado),
   * así que debajo se dice si hay una y dónde: vacío no significa "sin configurar".
   */
  /** Pinta una línea de estado con su tono. El texto dice qué pasa: el color solo acompaña. */
  function setState(node, level, text) {
    node.textContent = text;
    const tone = { ok: 'success', warn: 'warning', error: 'danger' }[level];
    if (tone) {
      node.dataset.tone = tone;
      delete node.dataset.muted;
    } else {
      delete node.dataset.tone;
      node.dataset.muted = '';
    }
  }

  function describeSecret(store, input, state, textos) {
    const hay = Boolean(store.get());
    input.value = '';
    input.placeholder = hay ? textos.reemplazar : '';
    setState(
      state,
      null,
      !hay
        ? textos.sin
        : store.remembered()
          ? `${textos.hay} en este navegador.`
          : `${textos.hay} solo en esta pestaña: se borrará al cerrarla.`,
    );
  }

  /**
   * Comprueba el token contra GitHub y lo cuenta. Es gratis y sin efectos, así que se hace
   * al abrir los ajustes y cada vez que se escribe uno: saber que hay un token no basta,
   * hace falta saber que sirve.
   */
  async function checkToken(token) {
    if (!token) return;
    setState(el.ghTokenState, null, 'Comprobando el token con GitHub…');
    try {
      const { verifyToken } = await import('./github.js');
      const resultado = await verifyToken(token, { signal: abort.signal });
      setState(el.ghTokenState, resultado.level, resultado.text);
    } catch {
      setState(el.ghTokenState, 'error', 'No se pudo comprobar el token.');
    }
  }
  const checkTokenSoon = debounce(checkToken, 500);

  const TEXTOS_CLAVE = {
    sin: 'Todavía no hay ninguna clave guardada.',
    hay: 'Hay una clave guardada',
    reemplazar: 'Hay una guardada. Escribe aquí para reemplazarla.',
  };
  const TEXTOS_TOKEN = {
    sin: 'Todavía no hay ningún token guardado.',
    hay: 'Hay un token guardado',
    reemplazar: 'Hay uno guardado. Escribe aquí para reemplazarlo.',
  };

  function fillSettings() {
    const value = settings.get();
    el.aiUrl.value = value.aiUrl;
    el.aiFormat.value = value.aiFormat;
    el.aiModel.value = value.aiModel;
    el.remember.checked = value.remember;
    describeSecret(aiKey, el.aiKeyInput, el.aiKeyState, TEXTOS_CLAVE);
    describeSecret(githubToken, el.ghToken, el.ghTokenState, TEXTOS_TOKEN);
    el.forget.hidden = !(aiKey.get() || githubToken.get());
    checkToken(githubToken.get());
  }

  // Al pegar o escribir un token, se comprueba solo: no hay que guardar para saber si sirve.
  on(el.ghToken, 'input', () => {
    const token = el.ghToken.value.trim();
    if (token) checkTokenSoon(token);
    else describeSecret(githubToken, el.ghToken, el.ghTokenState, TEXTOS_TOKEN);
  });

  on(el.aiTest, 'click', async () => {
    const key = el.aiKeyInput.value.trim() || aiKey.get();
    if (!key) {
      setState(el.aiKeyState, 'error', 'Escribe primero la clave de la API.');
      return;
    }
    el.aiTest.disabled = true;
    setState(el.aiKeyState, null, 'Probando la conexión…');
    try {
      const { testConnection } = await import('./ai.js');
      const resultado = await testConnection({
        url: el.aiUrl.value.trim(),
        apiKey: key,
        model: el.aiModel.value.trim(),
        format: el.aiFormat.value,
        signal: abort.signal,
      });
      setState(el.aiKeyState, resultado.level, resultado.text);
    } catch {
      setState(el.aiKeyState, 'error', 'No se pudo probar la conexión.');
    } finally {
      el.aiTest.disabled = false;
    }
  });

  function refreshAiState() {
    const { aiModel, aiUrl } = settings.get();
    el.aiState.textContent = aiKey.get()
      ? `Usando ${aiModel} en ${new URL(aiUrl).host}. La clave se queda en tu navegador.`
      : 'Configura en Ajustes la URL de tu API y su clave para pedir código a la IA.';
    // La revisión con IA avisa desde el principio de que necesita el agente configurado.
    el.aiReviewSetup.hidden = aiConfigured();
  }

  // Al cambiar la URL, adivinamos el formato para no obligar a elegirlo.
  on(el.aiUrl, 'change', () => {
    if (el.aiUrl.value.trim()) el.aiFormat.value = guessFormat(el.aiUrl.value);
  });

  for (const trigger of document.querySelectorAll('[data-preset]')) {
    on(trigger, 'click', () => {
      const preset = JSON.parse(trigger.dataset.preset);
      el.aiUrl.value = preset.url;
      el.aiFormat.value = preset.format;
      el.aiModel.value = preset.model;
      el.aiKeyInput.focus();
    });
  }

  on(el.settingsForm, 'submit', () => {
    const remember = el.remember.checked;
    settings.set({
      aiUrl: el.aiUrl.value.trim() || settings.get().aiUrl,
      aiFormat: el.aiFormat.value,
      aiModel: el.aiModel.value.trim() || settings.get().aiModel,
      remember,
    });
    // Una clave vacía conserva la que había, pero puede cambiar dónde se guarda.
    aiKey.set(el.aiKeyInput.value.trim() || aiKey.get() || '', remember);
    githubToken.set(el.ghToken.value.trim() || githubToken.get() || '', remember);
    el.aiKeyInput.value = '';
    el.ghToken.value = '';
    refreshAiState();
    const donde = remember ? 'en este navegador' : 'solo en esta pestaña';
    const guardadas = [aiKey.get() && 'la clave de la IA', githubToken.get() && 'el token de GitHub'].filter(Boolean);
    setStatus(guardadas.length ? `Ajustes guardados. Se guarda ${guardadas.join(' y ')} ${donde}.` : 'Ajustes guardados.');
  });

  on(el.forget, 'click', () => {
    aiKey.clear();
    githubToken.clear();
    el.settings.close();
    fillSettings();
    refreshAiState();
    setStatus('Claves eliminadas de este navegador.');
  });

  on(el.settings, 'toggle', (event) => {
    if (event.newState === 'open') fillSettings();
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
    el.aiReviewRun.disabled = busy;
    el.aiSubmit.textContent = busy ? 'Pensando…' : 'Generar código';
    el.aiCancel.hidden = !busy;
    el.aiProgress.hidden = !busy;
  }

  on(el.aiCancel, 'click', () => state.request?.abort());

  on(el.aiForm, 'submit', async (event) => {
    event.preventDefault();
    const key = aiKey.get();
    if (!key) {
      el.settings.showModal();
      return;
    }
    const instruction = el.aiPrompt.value.trim();
    if (!instruction) return;

    state.request = new AbortController();
    setBusy(true);
    el.aiState.textContent = 'Preparando una propuesta. Puede tardar un poco.';
    try {
      // Carga diferida: el módulo solo se descarga si alguien usa el asistente.
      const { proposeChange } = await import('./ai.js');
      const { aiUrl, aiModel, aiFormat } = settings.get();
      const info = componentInfo();
      const proposal = await proposeChange({
        url: aiUrl,
        apiKey: key,
        model: aiModel,
        format: aiFormat,
        instruction,
        component: info ? { title: info.title } : null,
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
    el.aiReviewOk.hidden = true;
    // Si la IA no trae test (o no lo cambia), se queda el del editor.
    state.proposal = { html: proposal.html, css: proposal.css, js: proposal.js, test: proposal.test ?? state.files.test };
    el.proposalSummary.textContent = proposal.resumen;
    el.proposalChanges.replaceChildren(
      ...proposal.cambios.map((text) => Object.assign(document.createElement('li'), { textContent: text })),
    );
    const warnings = [...new Set([...proposal.advertencias, ...riskyPatterns(`${proposal.html}\n${proposal.js}`)])];
    el.proposalWarnings.hidden = warnings.length === 0;
    el.proposalWarningList.replaceChildren(
      ...warnings.map((text) => Object.assign(document.createElement('li'), { textContent: text })),
    );
    for (const f of FILES) el.proposalCode[f].textContent = state.proposal[f];
    el.proposal.hidden = false;
    setTrying(true);
    el.proposal.scrollIntoView({ block: 'nearest' });
  }

  function setTrying(trying) {
    state.trying = trying && Boolean(state.proposal);
    el.proposalTry.setAttribute('aria-pressed', String(state.trying));
    el.aiReviewTry.setAttribute('aria-pressed', String(state.trying));
    render();
  }

  function discardProposal({ silent = false } = {}) {
    state.proposal = null;
    state.trying = false;
    el.proposal.hidden = true;
    el.aiReviewChanges.hidden = true;
    el.proposalTry.setAttribute('aria-pressed', 'false');
    el.aiReviewTry.setAttribute('aria-pressed', 'false');
    if (!silent) render();
  }

  on(el.proposalTry, 'click', () => setTrying(!state.trying));
  on(el.proposalDiscard, 'click', () => {
    discardProposal();
    setStatus('Propuesta descartada.');
  });
  on(el.proposalApply, 'click', () => {
    if (!state.proposal) return;
    state.files = { ...state.proposal };
    fillEditor();
    drafts.set(state.slug, state.files);
    discardProposal();
    renderReview();
    setStatus('Propuesta aplicada al editor.');
  });

  /* ---------- Revisión con IA ---------- */

  const aiConfigured = () => Boolean(aiKey.get() && settings.get().aiUrl && settings.get().aiModel);

  function setReviewing(busy) {
    el.aiReviewRun.disabled = busy;
    el.aiSubmit.disabled = busy;
    el.aiReviewRun.lastChild.textContent = busy ? ' Revisando…' : ' Revisar con IA';
    el.aiReviewCancel.hidden = !busy;
    el.aiReviewProgress.hidden = !busy;
  }

  const li = (text) => Object.assign(document.createElement('li'), { textContent: text });

  /** Un bloque de código como texto: lo que propone la IA nunca se interpreta como HTML. */
  function codeBlock(text, label) {
    const pre = document.createElement('pre');
    pre.className = 'lab-code';
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', label);
    pre.append(Object.assign(document.createElement('code'), { textContent: text || '(vacío)' }));
    return pre;
  }

  /** Diff de un archivo: cada línea lleva su signo, así no depende del color. */
  function diffBlock(file, before, after) {
    const diff = lineDiff(before, after);
    const { added, removed } = diffStats(diff);
    const section = document.createElement('section');
    const title = document.createElement('h5');
    title.className = 'heading';
    title.dataset.size = 'sm';
    title.textContent = `${TAB_FILES[file]} · ${added} ${added === 1 ? 'línea añadida' : 'líneas añadidas'}, ${removed} ${removed === 1 ? 'quitada' : 'quitadas'}`;
    const pre = document.createElement('pre');
    pre.className = 'lab-diff';
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', `Cambios en ${TAB_FILES[file]}`);
    for (const line of withContext(diff)) {
      const row = document.createElement('span');
      row.dataset.kind = line.kind;
      row.textContent =
        line.kind === 'skip'
          ? `   … ${line.count} ${line.count === 1 ? 'línea sin cambios' : 'líneas sin cambios'}`
          : `${{ add: '+', del: '−', same: ' ' }[line.kind]}  ${line.text}`;
      pre.append(row);
    }
    section.append(title, pre);
    return section;
  }

  function showReviewOk(result) {
    discardProposal({ silent: true });
    // Solo hay tranquilidad completa si la revisión automática tampoco marca errores.
    const errores = state.findings.filter((h) => h.level === 'error').length;
    const pendiente = errores > 0;
    el.aiReviewOk.dataset.tone = pendiente ? 'warning' : 'success';
    el.aiReviewOk.querySelector('[data-when="cumple"]').toggleAttribute('hidden', pendiente);
    el.aiReviewOk.querySelector('[data-when="pendiente"]').toggleAttribute('hidden', !pendiente);
    el.aiReviewOkTitle.textContent = pendiente
      ? `La IA no propone cambios, pero la revisión automática aún marca ${errores} ${errores === 1 ? 'error' : 'errores'}`
      : 'Todo sigue las normas de angela';
    el.aiReviewOkSummary.textContent = pendiente
      ? `${result.resumen} Revisa los errores de arriba antes de proponerlo.`
      : result.resumen;
    el.aiReviewChecked.replaceChildren(...result.revisado.map(li));
    el.aiReviewCheckedBox.hidden = result.revisado.length === 0;
    el.aiReviewOk.hidden = false;
    el.aiReviewOk.focus();
  }

  function showReviewChanges(result) {
    discardProposal({ silent: true });
    el.aiReviewOk.hidden = true;
    // La revisión con IA no toca el test: se conserva el del editor.
    state.proposal = { ...state.files, ...result.archivos };

    const n = result.problemas.length;
    el.aiReviewChangesTitle.textContent = n
      ? `La IA propone ${n} ${n === 1 ? 'cambio' : 'cambios'} para cumplir las normas`
      : 'La IA propone cambios para cumplir las normas';
    el.aiReviewSummary.textContent = result.resumen;

    el.aiReviewIssues.replaceChildren(
      ...result.problemas.map((p, index) => {
        const item = document.createElement('li');
        const regla = document.createElement('p');
        const id = p.reglaId && p.reglaId !== 'DESIGN' ? `${p.reglaId} · ` : '';
        regla.append(Object.assign(document.createElement('strong'), { textContent: `${index + 1}. ${id}${p.regla}` }));
        regla.append(` · ${TAB_FILES[p.archivo]} `);
        if (p.inventada) {
          // Lo dice el texto de la etiqueta, no solo su color.
          const badge = Object.assign(document.createElement('span'), { className: 'badge', textContent: 'Regla que no existe en angela' });
          badge.dataset.tone = 'danger';
          regla.append(badge);
        }
        const motivo = document.createElement('p');
        motivo.textContent = p.motivo;
        const pair = document.createElement('div');
        pair.className = 'lab-ai-review-pair';
        for (const [caption, code] of [
          ['Lo que había', p.antes],
          ['Lo que propone', p.despues],
        ]) {
          const figure = document.createElement('figure');
          figure.append(Object.assign(document.createElement('figcaption'), { textContent: caption }), codeBlock(code, `${caption}: ${p.regla}`));
          pair.append(figure);
        }
        item.append(regla, motivo, pair);
        return item;
      }),
    );

    const { clases, propiedades, funciones } = result.apiQuitada;
    const rotos = [
      ...clases.map((c) => `Clase .${c}`),
      ...propiedades.map((v) => `Propiedad ${v}`),
      ...funciones.map((f) => `Función ${f}()`),
    ];
    el.aiReviewApi.hidden = rotos.length === 0;
    el.aiReviewApiList.replaceChildren(...rotos.map(li));
    if (rotos.length) el.aiReviewChangesTitle.textContent = 'La IA propone cambios que rompen el componente: revísalos con cuidado';

    // La propuesta pasa también por la revisión automática: así se ve si de verdad mejora.
    const antes = state.findings.length;
    const despues = reviewComponent(result.archivos).length;
    el.aiReviewAfter.textContent =
      despues === 0
        ? 'Con estos cambios, la revisión automática no encuentra nada.'
        : `Con estos cambios, la revisión automática encuentra ${despues} ${despues === 1 ? 'aviso' : 'avisos'} (ahora ${antes}).`;

    const warnings = [...new Set([...result.advertencias, ...riskyPatterns(`${result.archivos.html}\n${result.archivos.js}`)])];
    el.aiReviewWarnings.hidden = warnings.length === 0;
    el.aiReviewWarningList.replaceChildren(...warnings.map(li));

    el.aiReviewDiff.replaceChildren(
      ...FILES.filter((f) => state.proposal[f] !== state.files[f]).map((f) => diffBlock(f, state.files[f], state.proposal[f])),
    );

    el.aiReviewChanges.hidden = false;
    el.aiReviewChanges.focus();
  }

  on(el.aiReviewRun, 'click', async () => {
    el.aiReviewSetup.hidden = true;
    if (!aiConfigured()) {
      el.aiReviewSetup.hidden = false;
      el.aiReviewSetup.focus();
      return;
    }

    el.aiReviewOk.hidden = true;
    discardProposal({ silent: true });
    state.request = new AbortController();
    setReviewing(true);
    el.aiReviewStatus.textContent = 'Revisando el componente contra las reglas de angela. Puede tardar un poco.';
    try {
      const { reviewWithAi } = await import('./ai.js');
      const { aiUrl, aiModel, aiFormat } = settings.get();
      const info = componentInfo();
      const result = await reviewWithAi({
        url: aiUrl,
        apiKey: aiKey.get(),
        model: aiModel,
        format: aiFormat,
        component: info ? { title: info.title } : null,
        files: { ...state.files },
        findings: state.findings,
        signal: state.request.signal,
      });
      el.aiReviewStatus.textContent = '';
      if (result.cambia) showReviewChanges(result);
      else showReviewOk(result);
      render();
    } catch (error) {
      el.aiReviewStatus.textContent = error?.message || 'Algo salió mal al revisar.';
    } finally {
      state.request = null;
      setReviewing(false);
    }
  });

  on(el.aiReviewCancel, 'click', () => state.request?.abort());
  on(el.aiReviewTry, 'click', () => setTrying(!state.trying));

  on(el.aiReviewReject, 'click', () => {
    discardProposal();
    el.aiReviewStatus.textContent = 'Cambios rechazados: tu código sigue como estaba.';
    el.aiReviewRun.focus();
  });

  on(el.aiReviewAccept, 'click', () => {
    if (!state.proposal) return;
    state.files = { ...state.proposal };
    fillEditor();
    drafts.set(state.slug, state.files);
    discardProposal();
    renderReview();
    renderParts();
    renderMotionNotice();
    el.aiReviewStatus.textContent = 'Cambios aceptados y aplicados al editor. Vuelve a revisar si quieres confirmarlo.';
    el.aiReviewRun.focus();
  });

  /* ---------- Insertar imagen ---------- */

  /** Medidas de cada tamaño: las mismas que tienen los archivos en /img. */
  const TAMANOS = { '': [720, 480], 360: [360, 240], cuadrada: [320, 320] };

  /** Filtra la rejilla por categoría y, en modo avatar, deja solo las que tienen versión cuadrada. */
  function filtrarImagenes() {
    const tamano = el.imagenesTamano.value;
    const categoria = el.imagenesCategoria.value;
    for (const item of el.imagenesRejilla.children) {
      const avatar = tamano === 'cuadrada';
      item.hidden = (categoria && item.dataset.categoria !== categoria) || (avatar && !item.hasAttribute('data-cuadrada'));
      item.dataset.variante = avatar ? 'cuadrada' : '';
      const img = item.querySelector('img');
      const src = avatar && img.dataset.cuadrada ? img.dataset.cuadrada : img.dataset.normal;
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    }
  }

  on(el.imagenesTamano, 'change', filtrarImagenes);
  on(el.imagenesCategoria, 'change', filtrarImagenes);
  on(el.imagenesAbrir, 'click', () => {
    filtrarImagenes();
    el.imagenes.showModal();
  });

  on(el.imagenesRejilla, 'click', (event) => {
    const boton = event.target.closest('button[data-id]');
    if (!boton) return;
    const tamano = el.imagenesTamano.value;
    const [ancho, alto] = TAMANOS[tamano];
    // URL completa: el código sigue funcionando si se copia a otro proyecto.
    const src = new URL(`/img/${boton.dataset.id}${tamano ? `-${tamano}` : ''}.webp`, location.origin).href;
    const alt = boton.dataset.alt.replaceAll('"', '&quot;');
    el.imagenes.close();
    // Siempre en el HTML: se cambia a su pestaña si estaba en otra.
    const pestana = el.tabs.querySelector('[role="tab"][data-file="html"]');
    if (activeFile() !== 'html') selectTab(pestana);
    editors.html.insert(`<img src="${src}" alt="${alt}" width="${ancho}" height="${alto}">`);
    editors.html.focus();
    setStatus(`Imagen insertada: ${boton.dataset.alt}.`);
  });

  /* ---------- Restablecer el código ---------- */

  const lineas = (n) => `${n} ${n === 1 ? 'línea' : 'líneas'}`;

  /**
   * Cuenta, antes de confirmar, qué se va a perder exactamente: es una acción definitiva,
   * así que el diálogo describe el estado real, no un aviso genérico.
   */
  function describeReset() {
    const info = componentInfo();
    const destino = info ? `al código original de «${info.title}»` : 'a la plantilla de componente nuevo';
    const base = original(state.slug);
    const perdidas = FILES.filter((f) => state.files[f] !== base[f]).map((f) => {
      const { added, removed } = diffStats(lineDiff(base[f], state.files[f]));
      const partes = [added && `${lineas(added)} ${added === 1 ? 'añadida' : 'añadidas'}`, removed && `${lineas(removed)} ${removed === 1 ? 'quitada' : 'quitadas'}`]
        .filter(Boolean)
        .join(' y ');
      return `Tus cambios en ${TAB_FILES[f]}${partes ? `: ${partes}` : ''}.`;
    });
    if (drafts.get(state.slug)) perdidas.push('El borrador que se guarda en este navegador.');
    if (state.proposal) perdidas.push('La propuesta de la IA que aún no has aplicado.');

    el.resetDesc.textContent = perdidas.length
      ? `El editor vuelve ${destino} y se descarta todo lo que hayas cambiado.`
      : `El editor ya está ${destino.replace(/^al /, 'en el ').replace(/^a la /, 'en la ')}: no hay nada que perder.`;
    el.resetLoss.hidden = perdidas.length === 0;
    el.resetList.replaceChildren(...perdidas.map(li));
  }

  on(el.resetOpen, 'click', () => {
    describeReset();
    // Si se cierra con Esc o fuera, no debe quedar el valor de una confirmación anterior.
    el.reset.returnValue = '';
    el.reset.showModal();
  });

  on(el.reset, 'close', () => {
    if (el.reset.returnValue !== 'restablecer') return;
    const info = componentInfo();
    drafts.clear(state.slug);
    load(state.slug);
    setStatus(info ? `Código restablecido: vuelves al original de «${info.title}».` : 'Código restablecido: vuelves a la plantilla de componente nuevo.');
    el.ideSaved.textContent = 'Restablecido';
  });

  /* ---------- Traer un pull request ---------- */

  /** El componente de angela cuyo CSS es el del PR (el slug no siempre coincide: boton → button.css). */
  const slugForFile = (id) => components.find((c) => sourcesFor(c.slug).css === `components/${id}.css`)?.slug ?? '';

  /** Qué pasará al proponer: se actualiza el PR (es tuyo) o se abre otro que parte de él. */
  function prDestino(pr) {
    if (pr.mio === true) return `Al proponer se actualiza el pull request #${pr.number}, sin abrir otro.`;
    if (pr.mio === false) {
      return `Es de ${pr.autor}: al proponer se abrirá uno nuevo a tu nombre que parte de #${pr.number} y lo menciona.`;
    }
    return `Si el pull request #${pr.number} es tuyo, al proponer se actualiza; si no, se abre uno nuevo a tu nombre que parte de él.`;
  }

  // Los textos del paso 4 tal como vienen en la página: son los de abrir un pull request nuevo.
  const PROPONER = {
    lead: el.proposeLead.textContent.trim().replace(/\s+/g, ' '),
    open: el.proposeOpenText.textContent,
    title: el.proposeTitle.textContent,
    send: el.proposeSend.textContent,
  };

  function renderPrState() {
    el.prState.hidden = !state.pr;
    // El paso 4 y su diálogo dicen lo que va a pasar: actualizar el PR o abrir uno.
    const actualiza = state.pr?.mio === true;
    el.proposeOpenText.textContent = actualiza ? `Actualizar el pull request #${state.pr.number}` : PROPONER.open;
    el.proposeTitle.textContent = actualiza ? `Actualizar el pull request #${state.pr.number}` : PROPONER.title;
    el.proposeSend.textContent = actualiza ? 'Subir los cambios' : PROPONER.send;
    // Al actualizar no se crea archivo ni pull request y la página conserva su título: el nombre
    // y el resumen no se usan. Desactivados, tampoco cuentan para validar el formulario.
    for (const [campo, control] of [
      [el.proposeNameField, el.proposeName],
      [el.proposeSummaryField, el.proposeSummary],
    ]) {
      campo.hidden = actualiza;
      control.disabled = actualiza;
    }
    el.proposeLead.textContent = !state.pr
      ? PROPONER.lead
      : actualiza
        ? `Sube tus cambios al pull request #${state.pr.number}: un commit nuevo en su rama, que vuelve a pasar la revisión del proyecto.`
        : state.pr.mio === false
          ? `Abre un pull request nuevo a tu nombre con tus cambios. Parte de #${state.pr.number}, de ${state.pr.autor}, y lo menciona para que se sepa de dónde viene.`
          : `Sube tus cambios: al pull request #${state.pr.number} si es tuyo o, si no, a uno nuevo a tu nombre que parte de él. Lo decide tu token de GitHub.`;
    if (!state.pr) return;
    el.prStateTitle.textContent = `Trabajas sobre el pull request #${state.pr.number}`;
    el.prStateText.textContent = `«${state.pr.title}». ${prDestino(state.pr)}`;
    el.prStateLink.href = state.pr.url;
  }

  /** El código que pone en el editor un pull request (lo que falta, de su componente o la plantilla). */
  function filesFromPr(pr, slug) {
    const base = original(slug);
    return {
      html: pr.files.html || (slug ? base.html : ''),
      css: pr.files.css,
      js: pr.files.js || STARTER.js,
      test: pr.files.test || STARTER.test,
    };
  }

  /**
   * Con token se sabe de antemano si el PR se puede actualizar o se abrirá otro; sin él, se
   * decide al proponer (proposeComponent hace la misma comprobación).
   */
  async function checkPrOwner(pr) {
    const token = githubToken.get();
    if (!token || pr.mio != null) return;
    try {
      const { canUpdatePullRequest, currentLogin } = await import('./github.js');
      const login = await currentLogin(token, { signal: abort.signal });
      if (!login) return;
      pr.mio = canUpdatePullRequest(login, pr);
      if (state.pr !== pr) return;
      renderPrState();
      if (el.propose.open) el.proposeKind.textContent = prDestino(pr);
    } catch {
      // Sin cuenta no pasa nada: se decide al proponer.
    }
  }

  /** Pone en el editor el código de un pull request y, si sigue abierto, lo deja como destino. */
  function applyPullRequest(pr, { conservarBorrador = false } = {}) {
    const slug = slugForFile(pr.id);
    load(slug);
    const borrador = conservarBorrador && drafts.get(slug);
    if (!borrador) state.files = filesFromPr(pr, slug);
    state.pr = pr.abierto && pr.head ? { ...pr, mio: null } : null;
    // Queda como borrador: al recargar con ?pr= se sigue desde aquí, no desde uno anterior.
    if (!borrador) drafts.set(slug, state.files);
    fillEditor();
    showFileStatus();
    renderReview();
    renderParts();
    renderMotionNotice();
    render();
    renderPrState();
    const url = new URL(location.href);
    url.searchParams.set('pr', String(pr.number));
    history.replaceState(null, '', url);
    if (state.pr) checkPrOwner(state.pr);
    // Qué pasará al proponer lo dice el aviso del pull request (y se corrige al saber de quién es).
    const que = borrador ? `Sigues con tus cambios sobre el pull request #${pr.number}.` : `Código del pull request #${pr.number} en el editor.`;
    const cerrado = state.pr ? [] : [`Está ${pr.estado}: al proponer se abrirá uno nuevo.`];
    setStatus([que, ...cerrado, ...(borrador ? [] : pr.avisos)].join(' '));
  }

  on(el.prOpen, 'click', () => {
    state.prPendiente = null;
    el.prDraft.hidden = true;
    el.prError.hidden = true;
    el.prStep.textContent = '';
    el.prSend.textContent = 'Traer el código';
    el.pr.showModal();
  });
  on(el.prRef, 'input', () => {
    // Otro número: la confirmación del borrador era para el anterior.
    state.prPendiente = null;
    el.prDraft.hidden = true;
    el.prSend.textContent = 'Traer el código';
  });

  on(el.prForm, 'submit', async (event) => {
    event.preventDefault();
    if (!el.prRef.reportValidity()) return;
    if (state.prPendiente) {
      applyPullRequest(state.prPendiente);
      state.prPendiente = null;
      el.pr.close();
      return;
    }
    el.prSend.disabled = true;
    el.prError.hidden = true;
    el.prStep.textContent = 'Leyendo el pull request…';
    try {
      const { fetchPullRequest } = await import('./github.js');
      const pr = await fetchPullRequest(el.prRef.value, { token: githubToken.get(), signal: abort.signal });
      el.prStep.textContent = '';
      // Si el borrador de ese componente tiene otro código que el del PR, se pide confirmación.
      const slug = slugForFile(pr.id);
      const borrador = drafts.get(slug);
      const delPr = filesFromPr(pr, slug);
      if (borrador && FILES.some((f) => typeof borrador[f] === 'string' && borrador[f] !== delPr[f])) {
        state.prPendiente = pr;
        if (state.pr?.number === pr.number) {
          // Es el mismo PR: el borrador son tus cambios encima, aún sin proponer.
          el.prDraftTitle.textContent = 'Perderás tus cambios';
          el.prDraftText.textContent = `Tienes cambios sobre el pull request #${pr.number} que aún no has propuesto. Si lo vuelves a traer, el editor vuelve a su código y se pierden.`;
          el.prSend.textContent = 'Traer y descartar mis cambios';
        } else {
          const info = components.find((c) => c.slug === slug);
          el.prDraftTitle.textContent = 'Se sustituirá tu borrador';
          el.prDraftText.textContent = `Tienes un borrador ${info ? `de «${info.title}»` : 'de componente nuevo'} en este navegador. Si traes el pull request #${pr.number}, el editor lo sustituye.`;
          el.prSend.textContent = 'Sustituir mi borrador';
        }
        el.prDraft.hidden = false;
        return;
      }
      applyPullRequest(pr);
      el.pr.close();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      el.prStep.textContent = '';
      el.prErrorText.textContent = error.message;
      el.prError.hidden = false;
      el.prError.focus();
    } finally {
      el.prSend.disabled = false;
    }
  });

  /* ---------- Proponer al proyecto ---------- */

  /**
   * Nombre del archivo en el repositorio. Al partir de un componente de angela es el suyo
   * (el slug de la documentación no coincide: «boton» se guarda en button.css); si es nuevo,
   * sale del nombre que escriba quien aporta.
   */
  function componentFileId() {
    if (state.pr) return state.pr.id;
    const css = sources().css;
    if (css) return css.split('/').pop().replace(/\.css$/, '');
    return toComponentId(el.proposeName.value);
  }

  /** Las piezas que define el CSS actual: una, o varias si lleva marcadores @componente. */
  const currentParts = () => splitComponents(state.files.css, componentFileId() || 'componente');

  /**
   * El aviso solo aparece cuando se dan las dos cosas: el sistema pide menos movimiento
   * y el componente tiene animación condicionada a esa preferencia.
   */
  function renderMotionNotice() {
    const condicionada = /prefers-reduced-motion/.test(state.files.css);
    el.motionNotice.hidden = !(reducedMotion.matches && condicionada);
    if (el.motionNotice.hidden && state.ignoreReducedMotion) {
      state.ignoreReducedMotion = false;
      el.motionToggle.setAttribute('aria-pressed', 'false');
    }
  }

  on(el.motionToggle, 'click', () => {
    state.ignoreReducedMotion = !state.ignoreReducedMotion;
    el.motionToggle.setAttribute('aria-pressed', String(state.ignoreReducedMotion));
    el.motionToggle.textContent = state.ignoreReducedMotion
      ? 'Volver a respetar mi preferencia'
      : 'Ver el movimiento igualmente';
    render();
  });

  on(reducedMotion, 'change', renderMotionNotice);

  /** Avisa bajo el editor cuando el CSS define más de un componente. */
  function renderParts() {
    const parts = currentParts().filter((p) => p.declared);
    el.partsState.textContent =
      parts.length > 1
        ? `Este CSS define ${parts.length} componentes que se usan juntos: ${parts.map((p) => p.id).join(', ')}.`
        : '';
  }

  /** Lista, en el diálogo, los archivos que va a crear o modificar el pull request. */
  function renderProposeParts() {
    const parts = currentParts();
    el.propose.dataset.parts = parts.length;
    el.proposePartsTitle.textContent =
      state.pr?.mio === true
        ? 'Archivos que se van a actualizar'
        : componentInfo()
          ? 'Archivos que se van a modificar'
          : 'Archivos que se van a crear';
    el.proposeParts.replaceChildren(
      ...parts.map(({ id: parteId }) => {
        const item = document.createElement('li');
        const ruta = document.createElement('code');
        ruta.textContent = `packages/angela/src/components/${parteId}.css`;
        item.append(ruta);
        return item;
      }),
    );
  }

  function validateProposeName() {
    const id = componentFileId();
    el.proposeName.setCustomValidity(id ? '' : 'Escribe un nombre con al menos una letra o número.');
    // El nombre decide el archivo de un componente nuevo: la lista se pone al día al escribir.
    renderProposeParts();
    return id;
  }
  on(el.proposeName, 'input', validateProposeName);
  // Al salir del campo se ve el nombre tal como quedará: «carousel» → «Carousel».
  on(el.proposeName, 'change', () => (el.proposeName.value = componentTitle(el.proposeName.value)));

  on(el.proposeOpen, 'click', () => {
    const info = componentInfo();
    // Del pull request vienen el nombre, el resumen y las notas de su página; si no, de la
    // página del componente de partida: lo que quede es lo que tendrá.
    const pagina = state.pr?.docs ?? info;
    el.proposeName.value = pagina ? pagina.title : '';
    el.proposeSummary.value = state.pr?.docs?.summary ?? '';
    el.proposeA11y.value = pagina ? pagina.a11y.join('\n') : '';
    el.proposeStep.textContent = '';
    showProposeError(null);
    el.done.hidden = true;
    if (state.pr) checkPrOwner(state.pr);
    el.proposeKind.textContent = state.pr
      ? prDestino(state.pr)
      : info
      ? `Partes de «${info.title}», así que se propondrá como un cambio sobre ese componente.`
      : 'Se comprobará en el repositorio si el componente ya existe, para proponerlo como nuevo o como un cambio.';
    const errores = state.findings.filter((h) => h.level === 'error').length;
    const bloqueo = state.findings.find((h) => h.bloquea);
    el.proposeWarnings.hidden = state.findings.length === 0;
    el.proposeWarningsText.textContent = bloqueo
      ? `No se puede proponer todavía: ${bloqueo.text}`
      : errores
      ? `Hay ${errores} ${errores === 1 ? 'cosa' : 'cosas'} que corregir en la revisión. Puedes proponerlo igual, pero es probable que te lo pidan antes de mezclarlo.`
      : `Hay ${state.findings.length} ${state.findings.length === 1 ? 'aviso' : 'avisos'} por revisar. Irán anotados en el pull request.`;
    renderProposeParts();
    validateProposeName();
    el.propose.showModal();
  });

  /**
   * Muestra (o quita) el error arriba del modal, donde se ve aunque el cuerpo tenga scroll.
   * Si los archivos ya se subieron, da el enlace para abrir el pull request a mano.
   */
  function showProposeError(error) {
    el.proposeError.hidden = !error;
    if (!error) return;
    el.proposeErrorText.textContent = error.message || 'Algo falló por el camino.';
    const compareUrl = error.cause?.compareUrl;
    el.proposeErrorRecover.hidden = !compareUrl;
    if (compareUrl) el.proposeErrorLink.href = compareUrl;
    el.proposeError.scrollIntoView({ block: 'nearest' });
    el.proposeError.focus();
  }

  /** Tras abrir el pull request: se cierra el modal, se avisa con el enlace y el laboratorio empieza de cero. */
  function proposalSent({ url, nuevo, partes, actualizado, continua }) {
    const numero = state.pr?.number;
    el.propose.close();
    drafts.clear(state.slug);
    load('');
    const que = partes > 1 ? `${partes} componentes` : nuevo ? 'componente nuevo' : 'cambio';
    el.doneTitle.textContent = actualizado
      ? `Pull request #${numero} actualizado`
      : `Pull request abierto (${continua ? `continúa #${continua}` : que})`;
    el.doneLink.href = url;
    el.done.hidden = false;
    el.done.scrollIntoView({ block: 'nearest' });
    el.done.focus();
  }

  /**
   * Página de documentación que acompaña al pull request. Si parte de un componente que ya
   * existe, se pone al día la suya (ejemplos por título, API y notas) sin perder lo escrito a
   * mano; si es nuevo, se genera.
   */
  function docsForProposal(id) {
    const a11y = el.proposeA11y.value
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean);
    const info = componentInfo();
    // La página del pull request (o la del componente en main) se pone al día, no se rehace.
    const pagina = state.pr?.docs ?? info;
    if (pagina) {
      const { entry, resumen } = mergeDocsEntry(pagina, {
        html: state.files.html,
        css: state.files.css,
        oldCss: state.pr?.docs ? state.pr.files.css : original(info.slug).css,
        a11y,
      });
      return { slug: pagina.slug, content: serializeDocsEntry(entry), actualiza: true, resumen, entry };
    }
    return {
      slug: id,
      content: buildDocsEntry({
        id,
        title: el.proposeName.value.trim(),
        summary: el.proposeSummary.value.trim(),
        files: { ...state.files },
        a11y,
        // Si el conjunto define varias piezas, la página dice con cuáles se usa.
        relatedTo: currentParts()
          .filter((p) => p.declared && p.id !== id)
          .map((p) => p.id),
      }),
    };
  }

  on(el.proposeForm, 'submit', async (event) => {
    event.preventDefault();
    const token = githubToken.get();
    if (!token) {
      el.propose.close();
      el.settings.showModal();
      setStatus('Añade tu token de GitHub en Ajustes para abrir el pull request.');
      return;
    }
    el.proposeName.value = componentTitle(el.proposeName.value);
    const id = validateProposeName();
    if (!id) {
      el.proposeName.reportValidity();
      return;
    }
    // Lo que rompería el build (CSS que no se puede leer) no sale del laboratorio.
    const cssBuild = await cssBuildError(state.files.css);
    const bloqueo = reviewComponent({ ...state.files, cssBuild }).find((h) => h.bloquea);
    if (bloqueo) {
      showProposeError(new Error(`Corrígelo antes de proponerlo: ${bloqueo.text}`));
      return;
    }

    el.proposeSend.disabled = true;
    showProposeError(null);
    state.request = new AbortController();
    try {
      const { proposeComponent } = await import('./github.js');
      const result = await proposeComponent({
        token,
        id,
        name: el.proposeName.value.trim(),
        summary: el.proposeSummary.value.trim(),
        parts: currentParts().map(({ id: parteId, css }) => ({ id: parteId, css })),
        docs: docsForProposal(id),
        files: { ...state.files },
        jsFile: state.pr?.jsFile ?? sources().js ?? null,
        findings: state.findings,
        pr: state.pr,
        onStep: (text) => (el.proposeStep.textContent = text),
        signal: state.request.signal,
      });
      proposalSent(result);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      el.proposeStep.textContent = '';
      showProposeError(error);
    } finally {
      state.request = null;
      el.proposeSend.disabled = false;
    }
  });

  /* ---------- Arranque ---------- */

  state.scheme = getRenderedScheme();
  el.scheme.setAttribute('aria-pressed', String(state.scheme === 'dark'));
  el.scheme.dataset.scheme = state.scheme;
  refreshAiState();
  // Un enlace con ?pr=58 trae ese pull request. Al recargar, lo escrito encima (el borrador)
  // se conserva: solo se recupera a qué pull request va.
  const prInicial = new URLSearchParams(location.search).get('pr');
  load(new URLSearchParams(location.search).get('componente') ?? '');
  if (prInicial) {
    setStatus(`Trayendo el pull request #${prInicial}…`);
    import('./github.js')
      .then(({ fetchPullRequest }) => fetchPullRequest(prInicial, { token: githubToken.get(), signal: abort.signal }))
      .then((pr) => applyPullRequest(pr, { conservarBorrador: true }))
      .catch((error) => error?.name !== 'AbortError' && setStatus(error.message));
  }

  return () => {
    abort.abort();
    state.request?.abort();
    state.port?.close();
    for (const editor of Object.values(editors)) editor.destroy();
  };
}
