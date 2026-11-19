/**
 * Persistencia local del laboratorio. Todo vive solo en este navegador.
 * Cada acceso va en try/catch: con los datos del sitio bloqueados el laboratorio funciona igual,
 * solo que no recuerda nada.
 */

const PREFIX = 'angela-lab:';
const KEY_NAME = `${PREFIX}anthropic-key`;
const SETTINGS = `${PREFIX}ajustes`;
const MAX_VERSIONS = 20;

function read(storage, key, fallback = null) {
  try {
    const raw = storage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(storage, key, value) {
  try {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const local = () => globalThis.localStorage;
const session = () => globalThis.sessionStorage;

/** @typedef {{ html: string, css: string, js: string }} LabFiles */

/** Borrador en curso de un punto de partida ('' = nuevo desde cero). */
export const drafts = {
  get: (slug) => read(local(), `${PREFIX}borrador:${slug || 'nuevo'}`),
  /** @param {string} slug @param {LabFiles} files */
  set: (slug, files) => write(local(), `${PREFIX}borrador:${slug || 'nuevo'}`, { ...files, updatedAt: Date.now() }),
  clear: (slug) => write(local(), `${PREFIX}borrador:${slug || 'nuevo'}`, null),
};

/** Historial de versiones guardadas a mano (o antes de aplicar una propuesta de la IA). */
export const versions = {
  list: (slug) => read(local(), `${PREFIX}versiones:${slug || 'nuevo'}`, []),
  /** @param {string} slug @param {LabFiles & { label: string }} version */
  add(slug, version) {
    const list = [{ id: crypto.randomUUID(), at: Date.now(), ...version }, ...versions.list(slug)].slice(0, MAX_VERSIONS);
    return write(local(), `${PREFIX}versiones:${slug || 'nuevo'}`, list) ? list : null;
  },
  remove(slug, id) {
    const list = versions.list(slug).filter((v) => v.id !== id);
    write(local(), `${PREFIX}versiones:${slug || 'nuevo'}`, list);
    return list;
  },
};

/**
 * Clave de la API. Con "recordar" va a localStorage (persiste); si no, a sessionStorage
 * (se borra al cerrar la pestaña). Nunca sale de este navegador salvo hacia api.anthropic.com.
 */
export const apiKey = {
  get: () => read(session(), KEY_NAME) ?? read(local(), KEY_NAME),
  remembered: () => read(local(), KEY_NAME) != null,
  set(key, remember) {
    apiKey.clear();
    return write(remember ? local() : session(), KEY_NAME, key);
  },
  clear() {
    write(local(), KEY_NAME, null);
    write(session(), KEY_NAME, null);
  },
};

/**
 * "Mis componentes": componentes creados en el laboratorio, con nombre, para reutilizarlos
 * dentro de otros. `uses` guarda los ids de los componentes propios que incluye.
 * @typedef {LabFiles & { name: string, uses: string[], updatedAt: number }} MyComponent
 */
const MINE = `${PREFIX}mis-componentes`;

export const myComponents = {
  /** @returns {Record<string, MyComponent>} */
  all: () => read(local(), MINE, {}),
  /** @returns {MyComponent | null} */
  get: (id) => myComponents.all()[id] ?? null,
  /** @param {string} id @param {Omit<MyComponent, 'updatedAt'>} record */
  save(id, record) {
    const all = myComponents.all();
    all[id] = { ...record, updatedAt: Date.now() };
    return write(local(), MINE, all);
  },
  /** Elimina el componente y lo quita de los que lo usaban. */
  remove(id) {
    const all = myComponents.all();
    delete all[id];
    for (const record of Object.values(all)) record.uses = (record.uses ?? []).filter((u) => u !== id);
    return write(local(), MINE, all);
  },
};

/** Nombre → id seguro ("Tarjeta de producto" → "tarjeta-de-producto"). */
export function toComponentId(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export const settings = {
  get: () => ({ model: 'claude-opus-5-5', ...read(local(), SETTINGS, {}) }),
  set: (value) => write(local(), SETTINGS, { ...settings.get(), ...value }),
};
