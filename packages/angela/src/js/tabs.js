/**
 * <angela-tabs>: comportamiento de pestañas sobre marcado nativo (ver components/tabs.css).
 *
 * - Usa `focusgroup` nativo cuando existe (roles y flechas los pone el navegador).
 * - Si no existe, añade roles tablist/tab y navegación con flechas, Inicio y Fin (tabindex itinerante).
 * - La selección sigue al foco. Paneles ocultos con hidden="until-found" (buscables con Ctrl+F).
 * - Emite el evento "tabchange" con { tab, panel }.
 */

const hasFocusgroup = () => typeof HTMLElement !== 'undefined' && 'focusGroup' in HTMLElement.prototype;

function hasFocusable(el) {
  return !!el.querySelector(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"], summary',
  );
}

export function defineTabs(tagName = 'angela-tabs') {
  if (typeof customElements === 'undefined' || customElements.get(tagName)) return;

  class AngelaTabs extends HTMLElement {
    #observer;
    #onKeydown = (event) => this.#handleKeydown(event);
    #onClick = (event) => {
      const tab = event.target.closest('button');
      if (tab && this.tabs.includes(tab)) this.select(tab);
    };
    #onFocusin = (event) => {
      if (this.tabs.includes(event.target)) this.select(event.target, { focus: false });
    };
    #onBeforematch = (event) => {
      const panel = event.target.closest('[role="tabpanel"]');
      const tab = panel && this.tabs.find((t) => t.id === panel.getAttribute('aria-labelledby'));
      if (tab) this.select(tab, { focus: false });
    };

    get tablist() {
      return this.querySelector(':scope > [focusgroup], :scope > .tablist');
    }

    get tabs() {
      return this.tablist ? [...this.tablist.querySelectorAll(':scope > button')] : [];
    }

    get panels() {
      return [...this.querySelectorAll(':scope > [role="tabpanel"]')];
    }

    connectedCallback() {
      this.#setup();
      // Los frameworks pueden insertar los hijos después de conectar el elemento.
      this.#observer = new MutationObserver(() => this.#setup());
      this.#observer.observe(this, { childList: true });
    }

    disconnectedCallback() {
      this.#observer?.disconnect();
      const list = this.tablist;
      list?.removeEventListener('keydown', this.#onKeydown);
      list?.removeEventListener('click', this.#onClick);
      list?.removeEventListener('focusin', this.#onFocusin);
      this.removeEventListener('beforematch', this.#onBeforematch, true);
      this.#bound = null;
    }

    #bound = null;

    #setup() {
      const list = this.tablist;
      if (!list || this.#bound === list) return;
      this.#bound = list;

      if (!hasFocusgroup()) {
        list.setAttribute('role', 'tablist');
        this.tabs.forEach((t) => t.setAttribute('role', 'tab'));
        list.addEventListener('keydown', this.#onKeydown);
      }
      list.addEventListener('click', this.#onClick);
      list.addEventListener('focusin', this.#onFocusin);
      this.addEventListener('beforematch', this.#onBeforematch, true);

      const selected = this.tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? this.tabs[0];
      if (selected) this.select(selected, { focus: false, silent: true });
    }

    /**
     * Selecciona una pestaña.
     * @param {HTMLButtonElement} tab
     * @param {{ focus?: boolean, silent?: boolean }} options
     */
    select(tab, { focus = false, silent = false } = {}) {
      const previous = this.tabs.find((t) => t.getAttribute('aria-selected') === 'true');
      for (const t of this.tabs) {
        const isSelected = t === tab;
        t.setAttribute('aria-selected', String(isSelected));
        t.toggleAttribute('focusgroupstart', isSelected);
        if (!hasFocusgroup()) t.tabIndex = isSelected ? 0 : -1;
      }
      let current;
      for (const panel of this.panels) {
        const isCurrent = panel.getAttribute('aria-labelledby') === tab.id;
        if (isCurrent) {
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
        this.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: { tab, panel: current } }));
      }
    }

    #handleKeydown(event) {
      const tabs = this.tabs.filter((t) => !t.disabled);
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      const rtl = getComputedStyle(this.tablist).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
      let next;
      if (event.key === forward) next = (index + 1) % tabs.length;
      else if (event.key === backward) next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      this.select(tabs[next], { focus: true });
    }
  }

  customElements.define(tagName, AngelaTabs);
}
