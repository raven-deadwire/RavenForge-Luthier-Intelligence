import fs from 'node:fs';

const target = 'assets/concept-lab.js';
let source = fs.readFileSync(target, 'utf8');
const marker = 'const supplementalEntries =';
const markerAt = source.indexOf(marker);
if (markerAt >= 0) {
  const start = source.indexOf('[', markerAt + marker.length);
  if (start >= 0) {
    let depth = 0;
    let quote = null;
    let escape = false;
    let end = -1;
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
        if (depth === 0) { end = i; break; }
      }
    }
    if (end >= 0) source = `${source.slice(0, start)}[]${source.slice(end + 1)}`;
  }
}
fs.writeFileSync(target, source, 'utf8');
console.log('Concept Lab runtime normalized to generated metadata only.');
