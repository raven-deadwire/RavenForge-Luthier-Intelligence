import test from 'node:test';
import assert from 'node:assert/strict';
import { priceWithChanges, sanitizeConfiguration, withPageNames } from '../src/pricing.js';

test('runtime neck, headstock and pickguard options retain request pricing and page names', () => {
  for (const model of ['EDDA', 'EMBLA', 'ASKR', 'GRAMR']) {
    const quote = priceWithChanges({ model, selections: {} }, { changes: [
      { category: 'neck_finish', option: 'neck_body' },
      { category: 'color_headstock', option: 'head_natural' }
    ] });
    assert.equal(quote.selections.neck_finish, 'neck_body');
    assert.equal(quote.selections.color_headstock, 'head_natural');
    assert.equal(quote.price_on_request, true);
    assert.deepEqual(quote.not_applied, []);
    assert.equal(sanitizeConfiguration({ model, selections: quote.selections }).selections.neck_finish, 'neck_body');
    for (const [language, title, label] of [['ko', '넥 색상', '바디 색상 매칭'], ['en', 'Neck colour', 'Match body colour'], ['de', 'Halsfarbe', 'An Korpusfarbe anpassen']]) {
      const line = withPageNames(quote, language).lines.find(item => item.category === 'neck_finish');
      assert.equal(line.page_title, title);
      assert.equal(line.page_label, label);
    }
  }
  for (const model of ['EDDA', 'GRAMR']) {
    const quote = priceWithChanges({ model, selections: {} }, { changes: [
      { category: 'pickguard', option: model === 'EDDA' ? 'pg_add' : 'pg_standard' },
      { category: 'pickguard_material', option: 'pg_aluminium' },
      { category: 'pickguard_colour', option: 'pg_white' },
      { category: 'pickguard_finish', option: 'pg_gloss' }
    ] });
    assert.equal(quote.selections.pickguard_material, 'pg_aluminium');
    assert.equal(quote.selections.pickguard_colour, 'pg_white');
    assert.equal(quote.selections.pickguard_finish, 'pg_gloss');
    assert.equal(quote.price_on_request, true);
    assert.deepEqual(quote.not_applied, []);
  }
});
