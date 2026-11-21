/**
 * Pestañas: comportamiento sobre marcado nativo con clase (ver components/tabs.css).
 *
 *   <div class="tabs">
 *     <div class="tablist" role="tablist" focusgroup="tablist nomemory" aria-label="…">
 *       <button type="button" role="tab" id="t-1" aria-selected="true" focusgroupstart>…</button>
 *     </div>
 *     <div role="tabpanel" aria-labelledby="t-1">…</div>
 *   </div>
 *
 * - Usa `focusgroup` nativo cuando existe (roles y flechas los pone el navegador).
 * - Si no existe, añade roles tablist/tab y navegación con flechas, Inicio y Fin (tabindex itinerante).
 * - La selección sigue al foco. Paneles ocultos con hidden="until-found" (buscables con Ctrl+F).
 * - Emite en el .tabs el evento "tabchange" con { tab, panel }.
 * - Escucha en la raíz (delegación) y prepara con un MutationObserver las pestañas que se monten
 *   después (frameworks).
 */

const SELECTOR = '.tabs';

const hasFocusgroup = () => typeof HTMLElement !== 'undefined' && 'focusGroup' in HTMLElement.prototype;

function hasFocusable(el) {
  return !!el.querySelector(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"], summary',
  );
}

const tablistOf = (tabs) => tabs.querySelector(':scope > [focusgroup], :scope > .tablist');
const tabsOf = (tabs) => {
  const list = tablistOf(tabs);
  return list ? [...list.querySelectorAll(':scope > button')] : [];
};
const panelsOf = (tabs) => [...tabs.querySelectorAll(':scope > [role="tabpanel"]')];

/** El .tabs al que pertenece una pestaña (un botón de su fila), o null. */
function containerOfTab(tab) {
  const list = tab?.parentElement;
  const tabs = list?.parentElement;
  if (!tabs?.matches(SELECTOR) || tablistOf(tabs) !== list || tab.localName !== 'button') return null;
  return tabs;
}

/**
 * Selecciona una pestaña: la marca, muestra su panel y oculta el resto.
 * @param {HTMLButtonElement} tab Botón de la fila de un .tabs.
 * @param {{ focus?: boolean, silent?: boolean }} [options] focus: lleva el foco a la pestaña;
 *   silent: no emite tabchange ni desplaza la fila (para cambios desde fuera o al preparar).
 * @returns {void}
 */
export function selectTab(tab, { focus = false, silent = false } = {}) {
  const container = containerOfTab(tab);
  if (!container) return;
  const tabs = tabsOf(container);
  const previous = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
  for (const t of tabs) {
    const isSelected = t === tab;
    t.setAttribute('aria-selected', String(isSelected));
    t.toggleAttribute('focusgroupstart', isSelected);
    if (!hasFocusgroup()) t.tabIndex = isSelected ? 0 : -1;
  }
  let current;
  for (const panel of panelsOf(container)) {
    if (panel.getAttribute('aria-labelledby') === tab.id) {
      current = panel;
      panel.hidden = false;
      // El panel solo entra en el orden de tabulación si no tiene nada enfocable dentro.
      if (hasFocusable(panel)) panel.removeAttribute('tabindex');
      else panel.tabIndex = 0;
    } else {
      // En navegadores sin soporte equivale a hidden: oculto, pero no buscable.
      panel.hidden = 'until-found';
      panel.removeAttribute('tabindex');
    }
  }
  // Solo al cambiar: en la carga, scrollIntoView movería el punto de partida del Tab.
  if (!silent) tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest', container: 'nearest' });
  if (focus) tab.focus();
  if (!silent && previous !== tab) {
    container.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: { tab, panel: current } }));
  }
}

/** Pone roles (si hace falta) y el estado inicial. Se puede llamar de nuevo si cambian los hijos. */
function prepare(container) {
  const list = tablistOf(container);
  const tabs = tabsOf(container);
  if (!list || !tabs.length) return;
  if (!hasFocusgroup()) {
    list.setAttribute('role', 'tablist');
    for (const t of tabs) t.setAttribute('role', 'tab');
  }
  const selected = tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0];
  selectTab(selected, { silent: true });
  container.dataset.tabsReady = '';
}

function handleKeydown(event, tab) {
  const container = containerOfTab(tab);
  const tabs = tabsOf(container).filter((t) => !t.disabled);
  const index = tabs.indexOf(tab);
  if (index < 0) return;
  const rtl = getComputedStyle(tablistOf(container)).direction === 'rtl';
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
  let next;
  if (event.key === forward) next = (index + 1) % tabs.length;
  else if (event.key === backward) next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault();
  selectTab(tabs[next], { focus: true });
}

/** Una sola activación por raíz aunque la llamen angela() y un componente de React a la vez. */
const activas = new WeakMap();

/**
 * Activa las pestañas (.tabs) de la raíz, también las que se monten después.
 * @param {Document | HTMLElement} [root] Dónde buscar y escuchar.
 * @returns {() => void} Limpieza: deja de escuchar (el estado de las pestañas se queda como está).
 */
export function enhanceTabs(root = globalThis.document) {
  if (typeof window === 'undefined' || !root) return () => {};

  // Cada llamada devuelve su propia limpieza, que solo cuenta una vez.
  const unaVez = (soltar) => {
    let hecho = false;
    return () => {
      if (hecho) return;
      hecho = true;
      soltar();
    };
  };

  const activa = activas.get(root);
  if (activa) {
    activa.usos++;
    return unaVez(activa.soltar);
  }

  const onClick = (event) => {
    const tab = event.target.closest?.('button');
    if (containerOfTab(tab)) selectTab(tab);
  };
  const onFocusin = (event) => {
    if (containerOfTab(event.target)) selectTab(event.target);
  };
  const onKeydown = (event) => {
    // Con focusgroup nativo, las flechas las pone el navegador.
    if (!hasFocusgroup() && containerOfTab(event.target)) handleKeydown(event, event.target);
  };
  // Ctrl+F encuentra texto en un panel oculto: se selecciona su pestaña.
  const onBeforematch = (event) => {
    const panel = event.target.closest?.('[role="tabpanel"]');
    const container = panel?.parentElement;
    if (!container?.matches(SELECTOR)) return;
    const tab = tabsOf(container).find((t) => t.id === panel.getAttribute('aria-labelledby'));
    if (tab) selectTab(tab);
  };

  const prepareAll = () => root.querySelectorAll(`${SELECTOR}:not([data-tabs-ready])`).forEach(prepare);
  const observer = new MutationObserver((records) => {
    for (const { target } of records) {
      // Pestañas o paneles nuevos dentro de unas ya preparadas (un framework que pinta más).
      const container = target.closest?.(SELECTOR);
      if (container?.hasAttribute('data-tabs-ready') && (target === container || target === tablistOf(container))) {
        prepare(container);
      }
    }
    prepareAll();
  });

  prepareAll();
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener('click', onClick);
  root.addEventListener('focusin', onFocusin);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('beforematch', onBeforematch, true);

  const estado = {
    usos: 1,
    soltar: () => {
      if (--estado.usos > 0) return;
      activas.delete(root);
      observer.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('focusin', onFocusin);
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('beforematch', onBeforematch, true);
    },
  };
  activas.set(root, estado);
  return unaVez(estado.soltar);
}
