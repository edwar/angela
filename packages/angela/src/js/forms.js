/**
 * Validación accesible sobre la validación nativa del navegador.
 *
 * Sincroniza aria-invalid con :user-invalid (el estado visual), enlaza el mensaje de error
 * con aria-describedby solo mientras se muestra, y anuncia el error al salir del campo
 * mediante una única región "polite" para toda la página.
 *
 * Marcado: <input ... data-error="id-del-mensaje"> + <p class="error" id="id-del-mensaje">…</p>
 */

const FIELDS = 'input, select, textarea';

let announcer;
let announceTimer;
let announcedField;

function getAnnouncer() {
  if (!announcer || !announcer.isConnected) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'visually-hidden';
    document.body.append(announcer);
  }
  return announcer;
}

/** Texto tal como lo leería un lector de pantalla. */
function spokenText(node) {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  copy
    .querySelectorAll('[role="img"][aria-label]')
    .forEach((n) => n.replaceWith(`${n.getAttribute('aria-label')}: `));
  return copy.textContent.replace(/\s+/g, ' ').trim();
}

/** Añade o quita el id del error en aria-describedby (sin tocar otros ids, como el de la ayuda). */
function linkError(el, shown) {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
}

function announceError(el) {
  const error = document.getElementById(el.dataset.error);
  if (!error) return;
  const region = getAnnouncer();
  const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
  clearTimeout(announceTimer);
  region.textContent = '';
  announcedField = el;
  // Espera a que el lector anuncie el siguiente campo enfocado para no pisarlo.
  announceTimer = setTimeout(() => {
    region.textContent = label + spokenText(error);
  }, 500);
}

const flagged = new WeakSet();
const announced = new WeakSet();

function syncAria(el, announce = false) {
  if (!el.matches?.(FIELDS)) return;
  const invalid = el.matches(':user-invalid');
  if (invalid) {
    if (announce && !announced.has(el)) {
      announceError(el);
      announced.add(el);
    }
    el.setAttribute('aria-invalid', 'true');
    linkError(el, true);
    flagged.add(el);
  } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
    // Un aria-invalid="true" que no puso este script (p. ej. del servidor) se respeta.
    el.setAttribute('aria-invalid', 'false');
    linkError(el, false);
    flagged.delete(el);
    announced.delete(el);
    if (announcedField === el) {
      clearTimeout(announceTimer);
      if (announcer) announcer.textContent = '';
    }
  }
}

/** Pone aria-invalid="false" a los campos de formulario dentro de `node` (incluido él mismo). */
function initFields(node) {
  const fields = node.matches?.(FIELDS) ? [node] : node.querySelectorAll(FIELDS);
  for (const el of fields) {
    if (!el.hasAttribute('aria-invalid') && (el.form || el.closest('form'))) syncAria(el);
  }
}

/**
 * Activa la validación accesible dentro de `root`.
 * @param {Document|HTMLElement} root
 * @returns {() => void} función para desconectar
 */
export function enhanceForms(root = globalThis.document) {
  // Seguro en el servidor: sin DOM no hay nada que mejorar.
  if (typeof window === 'undefined' || !root) return () => {};
  // Todos empiezan en aria-invalid="false": Firefox y Safari exponen un campo requerido vacío
  // como inválido desde la carga si el atributo no está.
  initFields(root);
  // Los frameworks (React, Angular, Vue…) montan formularios después: modales, rutas, *ngIf.
  // Esos campos también necesitan su aria-invalid="false" inicial.
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) initFields(node);
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });

  const onBlur = (e) => syncAria(e.target, true);
  const onInput = (e) => {
    if (e.target.hasAttribute?.('aria-invalid')) syncAria(e.target);
  };
  const onChange = (e) => syncAria(e.target, true);
  // Un envío fallido dispara 'invalid' en cada campo; el foco va al primero y su error se lee.
  const onInvalid = (e) => {
    announced.add(e.target);
    syncAria(e.target);
  };
  const onReset = (e) => {
    setTimeout(() => [...(e.target.elements ?? [])].forEach((el) => syncAria(el)));
  };

  root.addEventListener('blur', onBlur, true);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange, true);
  root.addEventListener('invalid', onInvalid, true);
  root.addEventListener('reset', onReset, true);

  return () => {
    observer.disconnect();
    root.removeEventListener('blur', onBlur, true);
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onChange, true);
    root.removeEventListener('invalid', onInvalid, true);
    root.removeEventListener('reset', onReset, true);
  };
}
