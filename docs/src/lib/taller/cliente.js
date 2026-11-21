/**
 * El taller de temas en el navegador: controles ↔ estado ↔ vistas, contraste, CSS y enlace.
 */
import { FUENTES, NOMBRES_ROL, PRESETS, ROLES, aHash, auditoria, cssDelTema, desdeHash, inspirame, nombreToken, normalizar, temaPorDefecto, variables } from './temas.js';
import { SELECTOR_TEMA, guardarTema, leerTemaGuardado, quitarTema } from '../tema-usuario.js';

const numero = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });
const igual = (a, b) => JSON.stringify(normalizar(a)) === JSON.stringify(normalizar(b));

export function iniciarTaller(root = document) {
  const raiz = root.querySelector('[data-taller]');
  if (!raiz) return;
  const form = raiz.querySelector('form');
  const vistas = [...raiz.querySelectorAll('.taller-vista')];
  const css = root.querySelector('[data-css]');
  const resumen = root.querySelector('[data-resumen]');
  const pares = root.querySelector('[data-pares]');
  const estado = root.querySelector('[data-estado]');
  const quitar = root.querySelector('[data-accion="quitar"]');

  let tema = location.hash.length > 1 ? desdeHash(location.hash) : temaPorDefecto();

  /** Del estado a los controles (al elegir un preset, Inspírame o abrir un enlace). */
  const aControles = () => {
    for (const rol of ROLES) {
      form.elements.namedItem(`${rol}-h`).value = String(tema.roles[rol].h);
      form.elements.namedItem(`${rol}-c`).value = String(tema.roles[rol].c);
    }
    form.elements.namedItem('neutro-sigue').checked = tema.neutroSigueMarca;
    for (const nombre of ['forma', 'fuente']) {
      for (const radio of form.querySelectorAll(`input[name="${nombre}"]`)) radio.checked = radio.value === tema[nombre];
    }
  };

  /** De los controles al estado (al mover cualquier control). */
  const deControles = () => {
    const datos = new FormData(form);
    tema = normalizar({
      roles: Object.fromEntries(ROLES.map((rol) => [rol, { h: Number(form.elements.namedItem(`${rol}-h`).value), c: Number(datos.get(`${rol}-c`)) }])),
      neutroSigueMarca: form.elements.namedItem('neutro-sigue').checked,
      forma: String(datos.get('forma')),
      fuente: String(datos.get('fuente')),
    });
  };

  const pintar = () => {
    // Vistas: las variables en la propia zona data-angela-theme, que recalcula la paleta.
    const lista = variables(tema);
    const fuente = FUENTES.find((f) => f.id === tema.fuente);
    for (const vista of vistas) {
      vista.removeAttribute('style');
      for (const [k, v] of lista) vista.style.setProperty(k, v);
      if (fuente.pila) vista.style.fontFamily = 'var(--font-body)';
    }

    // Controles que dependen del estado.
    form.elements.namedItem('neutral-h').disabled = tema.neutroSigueMarca;
    form.elements.namedItem('neutral-h').value = String(tema.roles.neutral.h);
    for (const salida of form.querySelectorAll('output[data-salida]')) {
      const [rol, eje] = salida.dataset.salida.split('-');
      salida.textContent = String(tema.roles[rol][eje]);
    }
    for (const chip of form.querySelectorAll('[data-chip]')) {
      const r = tema.roles[chip.dataset.chip];
      chip.style.background = `oklch(0.6 ${chip.dataset.chip === 'neutral' ? r.c * 3 : r.c} ${r.h})`;
    }
    const preset = PRESETS.find((p) => igual(p.tema, tema));
    for (const radio of form.querySelectorAll('input[name="preset"]')) radio.checked = radio.value === preset?.id;

    // Contraste.
    const filas = auditoria(tema);
    const fallan = filas.filter((f) => !f.cumple);
    const justo = filas.reduce((m, f) => (f.ratio / f.min < m.ratio / m.min ? f : m));
    resumen.textContent = fallan.length
      ? `${fallan.length} de ${filas.length} pares no llegan al mínimo.`
      : `Los ${filas.length} pares cumplen WCAG AA en claro y en oscuro. El más justo: ${nombreToken(justo.fg)} sobre ${nombreToken(justo.bg)} (${
          justo.modo === 'light' ? 'claro' : 'oscuro'
        }), ${numero.format(justo.ratio)}:1 con mínimo ${numero.format(justo.min)}:1.`;
    pares.replaceChildren(
      ...filas.map((f) => {
        const tr = document.createElement('tr');
        const celdas = [nombreToken(f.fg), nombreToken(f.bg), f.modo === 'light' ? 'Claro' : 'Oscuro', `${numero.format(f.ratio)}:1 ${f.cumple ? '✓' : '✗'}`, `${numero.format(f.min)}:1`];
        celdas.forEach((texto, i) => {
          const celda = document.createElement(i === 0 ? 'th' : 'td');
          if (i === 0) celda.scope = 'row';
          if (i >= 3) celda.dataset.numeric = '';
          celda.textContent = texto;
          tr.append(celda);
        });
        return tr;
      }),
    );

    // CSS y enlace.
    css.textContent = cssDelTema(tema);
    const hash = aHash(tema);
    history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);
    quitar.hidden = !leerTemaGuardado();
  };

  form.addEventListener('input', (e) => {
    if (e.target.name === 'preset') {
      tema = structuredClone(PRESETS.find((p) => p.id === e.target.value).tema);
      aControles();
    } else deControles();
    pintar();
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  const avisar = (texto) => {
    estado.textContent = texto;
  };

  root.addEventListener('click', async (e) => {
    const accion = e.target.closest?.('[data-accion]')?.dataset.accion;
    if (!accion) return;
    if (accion === 'inspirame') tema = inspirame();
    if (accion === 'restablecer') tema = temaPorDefecto();
    if (accion === 'inspirame' || accion === 'restablecer') {
      aControles();
      pintar();
      return;
    }
    if (accion === 'enlace') {
      try {
        await navigator.clipboard.writeText(location.href);
        avisar('Enlace copiado: quien lo abra verá este mismo tema.');
      } catch {
        avisar(`No se pudo copiar. El enlace es: ${location.href}`);
      }
    }
    if (accion === 'aplicar') {
      const reglas = variables(tema, { soloCambios: true });
      const fuente = FUENTES.find((f) => f.id === tema.fuente);
      const cuerpo = [...reglas.map(([k, v]) => `${k}: ${v};`), ...(fuente.pila ? ['font-family: var(--font-body);'] : [])].join(' ');
      const ok = guardarTema({ css: `${SELECTOR_TEMA} { ${cuerpo} }`, hash: aHash(tema) });
      avisar(ok ? 'Listo: los ejemplos de toda la documentación usan ahora tu tema (solo en este navegador).' : 'Este navegador no deja guardar el tema.');
      document.dispatchEvent(new CustomEvent('angela-docs:tema'));
      quitar.hidden = !ok;
    }
    if (accion === 'quitar') {
      quitarTema();
      avisar('Los ejemplos vuelven a los colores de angela.');
      document.dispatchEvent(new CustomEvent('angela-docs:tema'));
      quitar.hidden = true;
    }
  });

  aControles();
  pintar();
}

export { NOMBRES_ROL };
