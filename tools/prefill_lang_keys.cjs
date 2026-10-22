#!/usr/bin/env node
// Writes the English text of every [data-lang-key] element into index.html.
//
// switchLanguage() fills these elements from the `translations` object, so
// before the script runs (slow connections, crawlers, script errors) they used
// to be empty. This copies translations.en into the static markup; the runtime
// still replaces it with the visitor's language. tools/build_language_pages.cjs
// uses the same helpers to fill de.html and ko.html.
//
//   node tools/prefill_lang_keys.cjs          rewrite index.html
//   node tools/prefill_lang_keys.cjs --check  exit 1 when index.html is stale
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const INDEX = path.join(__dirname, '..', 'index.html');

function loadTranslations(text) {
  const marker = 'const translations = ';
  const start = text.indexOf(marker);
  const end = text.indexOf('\n        };', start);
  if (start < 0 || end < 0) throw new Error('translations object not found in index.html');
  return vm.runInNewContext(`(${text.slice(start + marker.length, end + '\n        }'.length)})`);
}

// Returns { text, changed } with every [data-lang-key] element holding strings[key].
function prefill(text, strings) {
  // Blank out <script> bodies so template strings inside them are left alone;
  // the replacement keeps offsets identical to the original text.
  const markup = text.replace(/<script\b[\s\S]*?<\/script>/g, m => ' '.repeat(m.length));
  const element = /(<(\w+)\b[^>]*\bdata-lang-key="(\w+)"[^>]*>)([\s\S]*?)(<\/\2>)/g;
  let out = '';
  let last = 0;
  let changed = 0;
  for (const m of markup.matchAll(element)) {
    const [, open, tag, key, inner] = m;
    const value = strings[key];
    if (typeof value !== 'string' || inner === value) continue;
    // Skip keys whose content nests the same tag; the lazy match would cut it short.
    if (new RegExp(`<${tag}\\b`, 'i').test(value) || new RegExp(`<${tag}\\b`, 'i').test(inner)) continue;
    const at = m.index + open.length;
    out += text.slice(last, at) + value;
    last = at + inner.length;
    changed += 1;
  }
  return { text: out + text.slice(last), changed };
}

module.exports = { loadTranslations, prefill };

if (require.main === module) {
  const check = process.argv.includes('--check');
  const text = fs.readFileSync(INDEX, 'utf8');
  const { text: out, changed } = prefill(text, loadTranslations(text).en);
  if (check) {
    if (changed) {
      console.error(`${changed} [data-lang-key] elements in index.html differ from translations.en. Run node tools/prefill_lang_keys.cjs and commit the result.`);
      process.exit(1);
    }
    console.log('index.html [data-lang-key] text matches translations.en.');
  } else {
    if (changed) fs.writeFileSync(INDEX, out);
    console.log(`Prefilled ${changed} [data-lang-key] elements with English text.`);
  }
}
