import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const INDEX = path.join(ROOT, 'index.html');
const CONCEPT_JS = path.join(ROOT, 'assets', 'concept-lab.js');
const OUT = path.join(ROOT, 'concepts');

function extractBalancedArray(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) return [];
  const start = source.indexOf('[', markerAt + marker.length);
  if (start < 0) return [];
  let depth = 0;
  let quote = null;
  let escape = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) return vm.runInNewContext(`(${source.slice(start, i + 1)})`, Object.create(null));
    }
  }
  throw new Error(`Unclosed array after ${marker}`);
}

function readInlineEntries() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const match = html.match(/<script\s+type=["']application\/json["']\s+id=["']concept-lab-data["']\s*>([\s\S]*?)<\/script>/i);
  if (!match) return [];
  const raw = match[1].trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.entries || [];
}

function readSupplementalEntries() {
  if (!fs.existsSync(CONCEPT_JS)) return [];
  return extractBalancedArray(fs.readFileSync(CONCEPT_JS, 'utf8'), 'const supplementalEntries =');
}

fs.mkdirSync(OUT, { recursive: true });
const merged = [...readInlineEntries(), ...readSupplementalEntries()];
const seen = new Set();
for (const entry of merged) {
  if (!entry || !entry.id || seen.has(entry.id)) continue;
  seen.add(entry.id);
  const dir = path.join(OUT, entry.id);
  const target = path.join(dir, 'meta.json');
  if (fs.existsSync(target)) continue;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
  console.log(`Migrated ${entry.id} -> ${path.relative(ROOT, target)}`);
}
