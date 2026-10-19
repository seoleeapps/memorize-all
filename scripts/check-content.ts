import assert from 'node:assert/strict';
import { catalog } from '../src/content/index';
const ids = new Set<string>();
assert.equal(catalog.knowledge.length, 100);
assert.equal(catalog.categories.length, 5);
for (const k of catalog.knowledge) {
  assert.ok(!ids.has(k.id), `Duplicate fact ${k.id}`);
  ids.add(k.id);
  assert.ok(k.source.url.startsWith('https://'));
  if (k.review === 'approved') assert.ok(k.source.checkedAt);
  assert.ok(k.source.usage);
  for (const lang of ['ko', 'en'] as const) {
    assert.ok(k.title[lang].trim());
    assert.ok(k.explanation[lang].trim());
  }
  assert.equal(catalog.questions.filter((q) => q.knowledgeId === k.id).length, 2);
}
assert.equal(new Set(catalog.questions.map((q) => q.id)).size, catalog.questions.length);
for (const q of catalog.questions) {
  assert.ok(ids.has(q.knowledgeId));
  assert.equal(q.options.length, 4);
  assert.equal(q.options.filter((o) => o.id === q.answerId).length, 1);
  assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
  for (const lang of ['ko', 'en'] as const) {
    assert.ok(q.prompt[lang].trim());
    assert.equal(new Set(q.options.map((o) => o.text[lang].trim().toLowerCase())).size, 4);
  }
}
const candidates = catalog.knowledge.filter((k) => k.review !== 'approved');
console.log(
  `Validated ${ids.size} facts, ${catalog.questions.length} variants; ${candidates.length} awaiting editorial approval.`,
);
if (process.argv.includes('--release') && candidates.length) {
  console.error('Release blocked: candidate content must not be published.');
  process.exitCode = 1;
}
