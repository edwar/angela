/**
 * Persistencia local del laboratorio. Todo vive solo en este navegador.
 * Cada acceso va en try/catch: con los datos del sitio bloqueados el laboratorio funciona igual,
 * solo que no recuerda nada.
 */

const PREFIX = 'angela-lab:';
const SETTINGS = `${PREFIX}ajustes`;
const SECRETS = `${PREFIX}secretos`;

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

/**
 * Borrador de cada punto de partida ('' = componente nuevo). Se guarda solo mientras escribes.
 */
export const drafts = {
  get: (slug) => read(local(), `${PREFIX}borrador:${slug || 'nuevo'}`),
  /** @param {string} slug @param {LabFiles} files */
  set: (slug, files) => write(local(), `${PREFIX}borrador:${slug || 'nuevo'}`, { ...files, updatedAt: Date.now() }),
  clear: (slug) => write(local(), `${PREFIX}borrador:${slug || 'nuevo'}`, null),
};

/**
 * Credenciales: la clave de la IA y el token de GitHub.
 * Con "recordar" van a localStorage; si no, a sessionStorage y se borran al cerrar la pestaña.
 * Nunca salen de este navegador salvo hacia la API que tú configuras y hacia github.com.
 */
function secretStore(name) {
  const key = `${SECRETS}:${name}`;
  return {
    get: () => read(session(), key) ?? read(local(), key),
    remembered: () => read(local(), key) != null,
    set(value, remember) {
      write(local(), key, null);
      write(session(), key, null);
      if (!value) return true;
      return write(remember ? local() : session(), key, value);
    },
    clear() {
      write(local(), key, null);
      write(session(), key, null);
    },
  };
}

export const aiKey = secretStore('ia');
export const githubToken = secretStore('github');

/**
 * Ajustes sin secretos (la URL, el modelo, el formato…). Se guardan siempre en este navegador.
 * @typedef {{ aiUrl: string, aiModel: string, aiFormat: 'anthropic'|'openai', aiHeader: string, remember: boolean }} Settings
 */
const DEFAULTS = {
  aiUrl: 'https://api.anthropic.com/v1/messages',
  aiModel: 'claude-opus-5',
  aiFormat: 'anthropic',
  // Recordar por defecto: son claves propias en el navegador propio, y tener que pegarlas
  // en cada pestaña hacía pensar que no se guardaban.
  remember: true,
};

export const settings = {
  /** @returns {Settings} */
  get: () => ({ ...DEFAULTS, ...read(local(), SETTINGS, {}) }),
  set: (value) => write(local(), SETTINGS, { ...settings.get(), ...value }),
};

/** Nombre → identificador seguro ("Tarjeta de producto" → "tarjeta-de-producto"). */
export function toComponentId(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
