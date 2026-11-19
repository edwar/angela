// Verifica el contraste WCAG de la paleta.
//   pnpm check:contrast                     → valores por defecto + barrido de todos los tonos
//   pnpm check:contrast --brand 20 0.19     → prueba un tono/croma concreto para la marca
import { auditPalette, roles, MAX_CHROMA } from '../src/palette.js';

const args = process.argv.slice(2);
const overrides = {};
for (let i = 0; i < args.length; i++) {
  const role = args[i].replace(/^--/, '');
  if (role in roles) {
    overrides[role] = { h: Number(args[i + 1]), c: Number(args[i + 2]) };
    i += 2;
  }
}

const report = (label, failures) => {
  if (!failures.length) return 0;
  console.log(`\n✗ ${label}`);
  for (const f of failures) console.log(`  ${f.fg} sobre ${f.bg}: ${f.ratio.toFixed(2)} (mínimo ${f.min})`);
  return failures.length;
};

let total = 0;
for (const mode of ['light', 'dark']) {
  total += report(`${mode} · valores ${Object.keys(overrides).length ? 'indicados' : 'por defecto'}`, auditPalette(mode, overrides));
}

// Barrido: cualquier tono 0–360 y croma 0–MAX_CHROMA debe pasar.
if (!Object.keys(overrides).length) {
  for (const mode of ['light', 'dark']) {
    const worst = new Map();
    for (let h = 0; h < 360; h += 5) {
      for (const c of [0, MAX_CHROMA / 4, MAX_CHROMA / 2, (3 * MAX_CHROMA) / 4, MAX_CHROMA]) {
        const o = {};
        for (const k of Object.keys(roles)) o[k] = { h, c: k === 'neutral' ? Math.min(c, 0.03) : c };
        for (const f of auditPalette(mode, o)) {
          const key = `${f.fg}|${f.bg}`;
          if (!worst.has(key) || f.ratio < worst.get(key).ratio) worst.set(key, { ...f, h, c });
        }
      }
    }
    total += report(`${mode} · barrido de tonos`, [...worst.values()]);
  }
}

if (total) {
  console.log(`\n${total} pares no cumplen WCAG AA.`);
  process.exit(1);
}
console.log('✓ Todos los pares cumplen WCAG AA (texto ≥ 4.5:1, controles y bordes ≥ 3:1) en claro y oscuro.');
