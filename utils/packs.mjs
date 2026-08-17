/**
 * Compila y extrae los compendios del sistema con la CLI oficial de Foundry.
 *
 * Fuente de la verdad: JSON legibles en packs/_source/<nombre-del-pack>/
 * Binarios LevelDB (lo que carga Foundry): packs/<ruta declarada en system.json>
 *
 * USO (con Foundry CERRADO, LevelDB bloquea la base mientras corre):
 *   npm run pack             # compila todas las fuentes a LevelDB
 *   npm run pack -- <name>   # compila solo un pack (ej: advantages-es)
 *   npm run unpack           # extrae todos los packs con datos a JSON fuente
 *   npm run unpack -- <name> # extrae solo un pack
 */
import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'packs', '_source');

const system = JSON.parse(readFileSync(path.join(ROOT, 'system.json'), 'utf8'));
const packs = system.packs.map(p => ({
  name: p.name,
  packDir: path.join(ROOT, p.path),
  sourceDir: path.join(SOURCE_DIR, p.name)
}));

const [command, ...names] = process.argv.slice(2);
const selected = names.length ? packs.filter(p => names.includes(p.name)) : packs;

if (names.length && selected.length !== names.length) {
  const known = packs.map(p => p.name).join(', ');
  console.error(`Pack desconocido. Packs declarados en system.json: ${known}`);
  process.exit(1);
}

function hasFiles(dir, extension = null) {
  if (!existsSync(dir)) return false;
  const files = readdirSync(dir);
  return extension ? files.some(f => f.endsWith(extension)) : files.length > 0;
}

// Nombre de fichero estable por documento: <slug-del-nombre>_<id>.json.
// Debe coincidir con el convenio de las fuentes existentes para que
// `unpack` sobreescriba en vez de duplicar.
function slugify(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function transformName(doc) {
  return `${slugify(doc.name)}_${doc._id}.json`;
}

if (command === 'pack') {
  for (const pack of selected) {
    if (!hasFiles(pack.sourceDir, '.json')) {
      if (names.length) console.warn(`— ${pack.name}: sin fuentes en ${path.relative(ROOT, pack.sourceDir)}, saltado`);
      continue;
    }
    await compilePack(pack.sourceDir, pack.packDir, { log: true });
    console.log(`✓ ${pack.name} compilado en ${path.relative(ROOT, pack.packDir)}`);
  }
} else if (command === 'unpack') {
  for (const pack of selected) {
    if (!hasFiles(pack.packDir)) {
      if (names.length) console.warn(`— ${pack.name}: sin datos en ${path.relative(ROOT, pack.packDir)}, saltado`);
      continue;
    }
    await extractPack(pack.packDir, pack.sourceDir, { log: true, transformName });
    console.log(`✓ ${pack.name} extraído a ${path.relative(ROOT, pack.sourceDir)}`);
  }
} else {
  console.error('Uso: node utils/packs.mjs <pack|unpack> [nombre-de-pack...]');
  process.exit(1);
}
