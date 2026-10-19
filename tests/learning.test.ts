import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/content/index';
import {
  advance,
  answer,
  beginSession,
  currentProgress,
  DAY,
  delayedResults,
  finish,
  markUnsure,
  parseBackup,
  reconcile,
  sessionSummary,
  setStudyMode,
} from '../src/core/learning';
import { initialState, State } from '../src/core/model';
import legacyCatalog from './fixtures/legacy-categories-v0.1.1.json';
const t0 = Date.UTC(2026, 9, 4);
const random = () => 0.3;
const start = (state = initialState(), at = t0, id = 's1') =>
  beginSession(state, catalog, at, id, random, 'elements');
function respond(st: State, correct = true, at = t0) {
  const item = st.session!.items[st.session!.cursor];
  const q = catalog.questions.find((q) => q.id === item.questionId)!;
  return answer(
    st,
    catalog,
    correct ? q.answerId : q.options.find((o) => o.id !== q.answerId)!.id,
    null,
    at,
  );
}
test('10 unique facts; translations and question variants do not add facts', () => {
  const st = start();
  assert.equal(st.session!.items.length, 10);
  assert.equal(new Set(st.session!.items.map((i) => i.knowledgeId)).size, 10);
  assert.equal(catalog.knowledge.length, 100);
  assert.equal(catalog.questions.length, 200);
});
test('wrong answer persists selected option, retries once with another question', () => {
  let st = respond(start(), false);
  const item = st.session!.items[0];
  assert.equal(st.attempts[0].grade, 'wrong');
  assert.ok(st.attempts[0].selectedId);
  st = advance(st, catalog, random);
  assert.equal(st.session!.items.length, 11);
  assert.notEqual(st.session!.items[10].questionId, item.questionId);
  while (st.session!.cursor < 10) st = advance(respond(st), catalog, random);
  st = advance(respond(st, false), catalog, random);
  assert.equal(st.session!.items.length, 11);
  assert.equal(st.progress[item.knowledgeId].stage, 'practicing');
});
test('same-session success does not count as long-term recall or postpone review', () => {
  let st = respond(start(), false);
  const id = st.session!.items[0].knowledgeId;
  const due = st.progress[id].dueAt;
  st = advance(st, catalog, random);
  while (st.session!.cursor < 10) st = advance(respond(st), catalog, random);
  st = respond(st, true, t0 + 60_000);
  assert.equal(st.progress[id].dueAt, due);
  assert.equal(st.progress[id].stage, 'practicing');
  assert.equal(st.attempts.at(-1)!.recovered, false);
  assert.deepEqual(delayedResults(st, catalog), { total: 0, correct: 0 });
  assert.deepEqual(sessionSummary(st), { total: 10, correct: 9, retried: 1, recovered: 0 });
});
test('7-day first response can recover past mistake; unsure demotes it', () => {
  let st = respond(start(), false);
  const id = st.session!.items[0].knowledgeId;
  st = { ...st, session: null };
  st = start(st, t0 + 7 * DAY, 's2');
  assert.equal(st.session!.items[0].knowledgeId, id);
  st = respond(st, true, t0 + 7 * DAY);
  assert.equal(st.progress[id].stage, 'remembered');
  assert.equal(st.attempts.at(-1)!.recovered, true);
  assert.deepEqual(delayedResults(st, catalog), { total: 1, correct: 1 });
  st = markUnsure(st);
  assert.equal(st.progress[id].stage, 'practicing');
  assert.equal(st.attempts.at(-1)!.recovered, false);
  assert.deepEqual(delayedResults(st, catalog), { total: 1, correct: 0 });
});
test('double taps are idempotent; unfinished session is not finished', () => {
  const st = respond(start());
  assert.deepEqual(respond(st), st);
  assert.deepEqual(finish(st, t0), st);
});
test('completion records once, language changes preserve identity', () => {
  let st = start();
  while (st.session!.cursor < st.session!.items.length) st = advance(respond(st), catalog, random);
  st = finish(st, t0);
  assert.equal(st.completions.length, 1);
  assert.deepEqual(finish(st, t0), st);
  const en = { ...st, locale: 'en' as const };
  assert.equal(Object.keys(en.progress).length, 10);
  assert.deepEqual(parseBackup(JSON.stringify(en), catalog), en);
});
test('text revision keeps progress; fact revision invalidates progress and active session', () => {
  const st = respond(start());
  const id = st.session!.items[0].knowledgeId;
  const text = { ...catalog, knowledge: catalog.knowledge.map((k) => ({ ...k, textRevision: 2 })) };
  assert.deepEqual(reconcile(st, text), st);
  const corrected = {
    ...catalog,
    knowledge: catalog.knowledge.map((k) => (k.id === id ? { ...k, factRevision: 2 } : k)),
  };
  const next = reconcile(st, corrected);
  assert.equal(next.progress[id], undefined);
  assert.equal(next.session, null);
  assert.equal(next.attempts.length, 1);
  const unattempted = start();
  const pending = unattempted.session!.items[0].knowledgeId;
  assert.equal(
    reconcile(unattempted, {
      ...catalog,
      knowledge: catalog.knowledge.map((k) => (k.id === pending ? { ...k, factRevision: 2 } : k)),
    }).session,
    null,
  );
});
test('every prepared category is available without a purchase or account', () => {
  for (const category of catalog.categories) {
    const facts = catalog.knowledge.filter((k) => k.category === category.id);
    const st = beginSession(initialState(), catalog, t0, category.id, random, category.id);
    assert.equal(st.session?.items.length ?? 0, Math.min(10, facts.length));
  }
});
test('malformed, oversized, newer-schema backups fail without resetting records', () => {
  for (const text of [
    '{',
    '{}',
    JSON.stringify({ ...initialState(), schema: 2 }),
    JSON.stringify({ ...initialState(), interests: ['unknown'] }),
  ])
    assert.throws(() => parseBackup(text, catalog));
  assert.throws(() => parseBackup(' '.repeat(10_000_001), catalog));
});
test('active feedback and option order survive restart', () => {
  const st = respond(start());
  const recovered = parseBackup(JSON.stringify(st), catalog);
  assert.deepEqual(recovered, st);
  assert.deepEqual(respond(recovered), recovered);
});
test('flashcard self grades remain separate from quiz answers', () => {
  let st = start({ ...initialState(), mode: 'card' });
  st = answer(st, catalog, null, 'unsure', t0);
  assert.equal(st.attempts[0].mode, 'card');
  assert.equal(st.attempts[0].selectedId, null);
  assert.equal(st.progress[st.attempts[0].knowledgeId].stage, 'practicing');
});
test('due reviews precede fresh facts; early practice does not mature memory', () => {
  let st = respond(start());
  const k = catalog.knowledge.find((k) => k.id === st.attempts[0].knowledgeId)!;
  st = { ...st, session: null };
  let next = start(st, t0 + DAY, 'day2');
  assert.equal(next.session!.items[0].knowledgeId, k.id);
  next = respond(next, true, t0 + DAY);
  assert.equal(currentProgress(next, k)!.intervalDays, 3);
  assert.equal(currentProgress(next, k)!.stage, 'practicing');
});
test('daily fresh session interleaves selected categories and due-only is empty initially', () => {
  const state = { ...initialState(), interests: ['geography', 'moon', 'elements'] };
  const daily = beginSession(state, catalog, t0, 'mixed', random);
  assert.equal(new Set(daily.session!.items.map((i) => i.knowledgeId.split('.')[0])).size, 3);
  assert.equal(beginSession(state, catalog, t0, 'review', random, undefined, true).session, null);
});

test('backup with feedback but no matching attempt is rejected', () => {
  const st = start();
  st.session!.feedback = { grade: 'correct', selectedId: st.session!.items[0].knowledgeId };
  assert.throws(() => parseBackup(JSON.stringify(st), catalog));
});

test('delayed quiz accuracy excludes flashcard self assessment', () => {
  let st = respond(start());
  st = { ...st, session: null, mode: 'card' };
  st = start(st, t0 + 7 * DAY, 'card-review');
  st = answer(st, catalog, null, 'correct', t0 + 7 * DAY);
  assert.deepEqual(delayedResults(st, catalog), { total: 0, correct: 0 });
  assert.deepEqual(delayedResults(st, catalog, 'card'), { total: 1, correct: 1 });
});

test('changing mode updates an unanswered session without losing its queue or history', () => {
  const initial = start();
  const card = setStudyMode(initial, 'card');
  assert.equal(card.mode, 'card');
  assert.equal(card.session!.mode, 'card');
  assert.deepEqual(card.session!.items, initial.session!.items);
  const graded = advance(answer(card, catalog, null, 'unsure', t0), catalog, random);
  assert.equal(graded.session!.cursor, 1);
  assert.equal(graded.session!.feedback, null);
  assert.equal(graded.session!.items.length, 11);
  assert.equal(graded.attempts[0].mode, 'card');
  const quiz = setStudyMode(graded, 'quiz');
  assert.equal(quiz.session!.mode, 'quiz');
  assert.deepEqual(quiz.attempts, graded.attempts);
  assert.deepEqual(parseBackup(JSON.stringify(quiz), catalog), quiz);
});

test('changing mode after an answer preserves the answer until advancing', () => {
  const answered = respond(start());
  const switched = setStudyMode(answered, 'card');
  assert.equal(switched.session!.mode, 'quiz');
  assert.equal(switched.attempts[0].mode, 'quiz');
  assert.deepEqual(switched.session!.feedback, answered.session!.feedback);
  const next = advance(switched, catalog, random);
  assert.equal(next.session!.mode, 'card');
  assert.equal(next.session!.cursor, 1);
  assert.deepEqual(parseBackup(JSON.stringify(next), catalog), next);
});

test('completed packs can be practiced without creating long-term recall or extending review dates', () => {
  let st = start();
  for (let round = 0; round < 2; round++) {
    while (st.session!.cursor < st.session!.items.length)
      st = advance(respond(st), catalog, random);
    st = finish(st, t0);
    if (!round) st = start(st, t0, 'second-ten');
  }
  assert.equal(Object.keys(st.progress).length, 20);
  const practiced = start(st, t0 + DAY / 2, 'practice');
  assert.ok(practiced.session!.items.every((item) => item.practice));
  const first = practiced.session!.items[0].knowledgeId;
  const before = st.progress[first];
  const answered = respond(practiced, true, t0 + DAY / 2);
  assert.equal(answered.progress[first].dueAt, before.dueAt);
  assert.equal(answered.progress[first].intervalDays, before.intervalDays);
  assert.notEqual(answered.progress[first].stage, 'remembered');
  assert.deepEqual(delayedResults(answered, catalog), { total: 0, correct: 0 });
  assert.equal(answered.progress[first].lastAt, t0 + DAY / 2);
  const advanced = advance(answered, catalog, random);
  assert.deepEqual(parseBackup(JSON.stringify(advanced), catalog), advanced);
  const wrong = respond(advanced, false, t0 + DAY / 2);
  const retry = advance(wrong, catalog, random).session!.items.at(-1)!;
  assert.equal(retry.practice, true);
  assert.equal(retry.retry, true);
});

test('legacy backup with an unanswered quiz follows its saved flashcard preference on reload', () => {
  const saved = { ...start(), mode: 'card' as const };
  const recovered = parseBackup(JSON.stringify(saved), catalog);
  assert.equal(recovered.session!.mode, 'card');
  assert.deepEqual(recovered.session!.items, saved.session!.items);
  assert.deepEqual(recovered.attempts, saved.attempts);
  assert.equal(beginSession(saved, catalog, t0, 'ignored').session!.id, saved.session!.id);
  assert.equal(beginSession(saved, catalog, t0, 'ignored').session!.mode, 'card');
});

const retiredInterests = legacyCatalog.categories
  .map((category) => category.id)
  .filter((id) => !catalog.categories.some((category) => category.id === id));

test('previously valid interests keep progress, history, completion and active feedback on upgrade', () => {
  assert.equal(retiredInterests.length, 11);
  let completed = start({ ...initialState('en'), onboarded: true });
  while (completed.session!.cursor < completed.session!.items.length)
    completed = advance(respond(completed), catalog, random);
  completed = finish(completed, t0);
  for (const retired of retiredInterests) {
    const saved = respond(start({ ...completed, interests: [retired, 'elements'] }, t0 + 1, 'next'));
    const text = JSON.stringify(saved);
    // These inputs passed the exact category list shipped in 0.1.1.
    assert.deepEqual(parseBackup(text, { ...catalog, categories: legacyCatalog.categories }), saved);
    assert.deepEqual(parseBackup(text, catalog), { ...saved, interests: ['elements'] });
    assert.equal(JSON.stringify(saved), text);
  }
});

test('only retired interests restore without resetting records and allow daily learning', () => {
  const saved = {
    ...respond(start({ ...initialState('en'), onboarded: true })),
    session: null,
    interests: retiredInterests.slice(0, 3),
  };
  const restored = parseBackup(JSON.stringify(saved), catalog);
  assert.deepEqual(restored, { ...saved, interests: [] });
  const daily = beginSession(restored, catalog, t0, 'upgraded-daily', random);
  assert.equal(daily.session!.items.length, 10);
  assert.equal(new Set(daily.session!.items.map((item) => item.knowledgeId.split('.')[0])).size, 5);
});

test('retired interests do not permit unknown or duplicate IDs in a backup', () => {
  for (const interests of [
    [retiredInterests[0], 'unknown'],
    [retiredInterests[0], retiredInterests[0]],
    ['elements', 'elements'],
  ])
    assert.throws(() => parseBackup(JSON.stringify({ ...initialState(), interests }), catalog));
});
