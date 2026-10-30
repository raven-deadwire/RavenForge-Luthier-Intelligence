import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { PDF_BUTTON_LABELS, SYSTEM_PROMPT } from '../src/prompt.js';

test('the prompt names the PDF button as the page shows it in every language', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(new URL('../../../assets/configurator-ui.js', import.meta.url), 'utf8'), context);
  const pageCopy = context.window.RF_CONFIG_I18N;
  assert.ok(pageCopy, 'assets/configurator-ui.js no longer sets window.RF_CONFIG_I18N');
  assert.deepEqual(Object.keys(PDF_BUTTON_LABELS).sort(), Object.keys(pageCopy).sort());
  for (const [language, label] of Object.entries(PDF_BUTTON_LABELS)) {
    assert.equal(label, pageCopy[language].savePDF, language);
    assert.ok(SYSTEM_PROMPT.includes(`${language} "${label}"`), language);
  }
});
