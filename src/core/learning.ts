import { Catalog, Grade, Knowledge, SessionItem, State, stateSchema } from './model';
export const DAY = 86_400_000;

// Schema 1 backups from 0.1.1 accepted these unpopulated topics. Keep reading
// those backups while removing only the retired selections, never their records.
const retiredSchema1Interests = new Set([
  'history',
  'math',
  'physics',
  'astronomy',
  'nature',
  'beer',
  'games',
  'art',
  'music',
  'literature',
  'food',
]);

export function setStudyMode(state: State, mode: State['mode']): State {
  return {
    ...state,
    mode,
    // Keep answered feedback in its original mode; apply the preference on advance.
    session: state.session && !state.session.feedback ? { ...state.session, mode } : state.session,
  };
}

export function currentProgress(state: State, k: Knowledge) {
  const p = state.progress[k.id];
  return p?.revision === k.factRevision ? p : undefined;
}
export function dueKnowledge(state: State, catalog: Catalog, now: number) {
  return catalog.knowledge
    .filter((k) => {
      const p = currentProgress(state, k);
      return p && p.dueAt <= now;
    })
    .sort((a, b) => currentProgress(state, a)!.dueAt - currentProgress(state, b)!.dueAt);
}
function shuffle<T>(values: T[], random: () => number) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeItem(
  k: Knowledge,
  catalog: Catalog,
  state: State,
  random: () => number,
  retry = false,
): SessionItem {
  const variants = catalog.questions.filter((q) => q.knowledgeId === k.id);
  if (!variants.length) throw new Error('Missing question');
  const last = [...state.attempts].reverse().find((a) => a.knowledgeId === k.id);
  const q = variants.find((q) => q.id !== last?.questionId) ?? variants[0];
  return {
    knowledgeId: k.id,
    revision: k.factRevision,
    questionId: q.id,
    order: shuffle(
      q.options.map((o) => o.id),
      random,
    ),
    retry,
  };
}
export function beginSession(
  state: State,
  catalog: Catalog,
  now: number,
  id: string,
  random = Math.random,
  category?: string,
  reviewOnly = false,
): State {
  if (state.session) return setStudyMode(state, state.mode);
  const pool = catalog.knowledge.filter((k) => !category || k.category === category);
  const due = dueKnowledge(state, catalog, now).filter((k) => pool.includes(k));
  const fresh = pool.filter(
    (k) =>
      !currentProgress(state, k) &&
      (category || !state.interests.length || state.interests.includes(k.category)),
  );
  // Interleave categories so a mixed daily session does not exhaust one category first.
  const groups = catalog.categories.map((c) =>
    shuffle(
      fresh.filter((k) => k.category === c.id),
      random,
    ),
  );
  const interleaved: Knowledge[] = [];
  while (groups.some((g) => g.length))
    for (const group of groups) {
      const k = group.shift();
      if (k) interleaved.push(k);
    }
  let selected = [...due, ...(reviewOnly ? [] : interleaved)].slice(0, 10);
  const practice = !selected.length && !!category && !reviewOnly;
  if (practice)
    selected = shuffle(
      pool.filter((k) => currentProgress(state, k)),
      random,
    ).slice(0, 10);
  if (!selected.length) return state;
  return {
    ...state,
    session: {
      id,
      startedAt: now,
      mode: state.mode,
      cursor: 0,
      feedback: null,
      items: selected.map((k) => ({
        ...makeItem(k, catalog, state, random),
        ...(practice ? { practice: true } : {}),
      })),
    },
  };
}
export function answer(
  state: State,
  catalog: Catalog,
  selectedId: string | null,
  selfGrade: Grade | null,
  now: number,
): State {
  const s = state.session;
  if (!s || s.feedback || s.cursor >= s.items.length) return state;
  const item = s.items[s.cursor];
  const k = catalog.knowledge.find((k) => k.id === item.knowledgeId)!;
  const q = catalog.questions.find((q) => q.id === item.questionId)!;
  let result: Grade;
  if (s.mode === 'card') {
    if (!selfGrade) throw new Error('Self assessment required');
    result = selfGrade;
  } else {
    if (!q.options.some((o) => o.id === selectedId)) throw new Error('Invalid answer');
    result = selectedId === q.answerId ? 'correct' : 'wrong';
  }
  const old = currentProgress(state, k);
  const delayDays = old ? Math.max(0, (now - old.lastAt) / DAY) : 0;
  const previousWrong = state.attempts.some(
    (a) => a.knowledgeId === k.id && a.revision === k.factRevision && a.grade !== 'correct',
  );
  const spaced = !!old && !item.retry && !item.practice && delayDays >= 1;
  let intervalDays = old?.intervalDays ?? 0;
  if (result !== 'correct') intervalDays = 1;
  else if (!old) intervalDays = 1;
  else if (spaced)
    intervalDays = intervalDays < 3 ? 3 : intervalDays < 7 ? 7 : intervalDays < 14 ? 14 : 30;
  // An immediate retry cannot postpone the next review or create long-term mastery.
  const dueAt =
    (item.retry || item.practice) && old && result === 'correct'
      ? old.dueAt
      : now + intervalDays * DAY;
  const remembered = result === 'correct' && !item.retry && !item.practice && delayDays >= 7;
  const stage =
    result !== 'correct'
      ? 'practicing'
      : remembered || old?.stage === 'remembered'
        ? 'remembered'
        : old
          ? 'practicing'
          : 'seen';
  return {
    ...state,
    progress: {
      ...state.progress,
      [k.id]: {
        revision: k.factRevision,
        seenAt: old?.seenAt ?? now,
        lastAt: now,
        dueAt,
        intervalDays,
        stage,
        lapses: (old?.lapses ?? 0) + (result === 'wrong' ? 1 : 0),
      },
    },
    attempts: [
      ...state.attempts,
      {
        knowledgeId: k.id,
        revision: k.factRevision,
        questionId: q.id,
        sessionId: s.id,
        at: now,
        grade: result,
        selectedId,
        mode: s.mode,
        retry: item.retry,
        delayDays,
        recovered: previousWrong && remembered && old?.stage !== 'remembered',
        ...(item.practice ? { practice: true } : {}),
      },
    ],
    session: { ...s, feedback: { grade: result, selectedId } },
  };
}
export function markUnsure(state: State): State {
  const s = state.session;
  if (!s?.feedback || s.feedback.grade !== 'correct') return state;
  const item = s.items[s.cursor];
  const last = state.attempts[state.attempts.length - 1];
  return {
    ...state,
    progress: {
      ...state.progress,
      [item.knowledgeId]: {
        ...state.progress[item.knowledgeId],
        stage: 'practicing',
        intervalDays: 1,
        dueAt: last.at + DAY,
      },
    },
    attempts: [...state.attempts.slice(0, -1), { ...last, grade: 'unsure', recovered: false }],
    session: { ...s, feedback: { ...s.feedback, grade: 'unsure' } },
  };
}
export function advance(state: State, catalog: Catalog, random = Math.random): State {
  const s = state.session;
  if (!s?.feedback) return state;
  const item = s.items[s.cursor];
  let items = s.items;
  if (s.feedback.grade !== 'correct' && !item.retry) {
    const k = catalog.knowledge.find((k) => k.id === item.knowledgeId)!;
    items = [
      ...items,
      {
        ...makeItem(k, catalog, state, random, true),
        ...(item.practice ? { practice: true } : {}),
      },
    ];
  }
  return {
    ...state,
    session: { ...s, mode: state.mode, items, cursor: s.cursor + 1, feedback: null },
  };
}
export function finish(state: State, now: number): State {
  const s = state.session;
  if (!s || s.cursor < s.items.length) return state;
  return {
    ...state,
    session: null,
    completions: [...state.completions, { sessionId: s.id, at: now }],
  };
}
export function sessionSummary(state: State) {
  const attempts = state.attempts.filter((a) => a.sessionId === state.session?.id);
  const first = attempts.filter((a) => !a.retry);
  return {
    total: first.length,
    correct: first.filter((a) => a.grade === 'correct').length,
    retried: attempts.filter((a) => a.retry && a.grade === 'correct').length,
    recovered: first.filter((a) => a.recovered).length,
  };
}
export function delayedResults(state: State, catalog: Catalog, mode: 'quiz' | 'card' = 'quiz') {
  const eligible = state.attempts.filter(
    (a) =>
      a.mode === mode &&
      !a.retry &&
      !a.practice &&
      a.delayDays >= 7 &&
      catalog.knowledge.some((k) => k.id === a.knowledgeId && k.factRevision === a.revision),
  );
  return { total: eligible.length, correct: eligible.filter((a) => a.grade === 'correct').length };
}
export function reconcile(state: State, catalog: Catalog): State {
  const progress = Object.fromEntries(
    Object.entries(state.progress).filter(([id, p]) =>
      catalog.knowledge.some((k) => k.id === id && k.factRevision === p.revision),
    ),
  );
  const sessionValid =
    !state.session ||
    state.session.items.every((item) => {
      const k = catalog.knowledge.find((k) => k.id === item.knowledgeId);
      const q = catalog.questions.find((q) => q.id === item.questionId && q.knowledgeId === k?.id);
      return (
        k &&
        q &&
        item.revision === k.factRevision &&
        (!state.progress[k.id] || state.progress[k.id].revision === k.factRevision) &&
        item.order.length === 4 &&
        new Set(item.order).size === 4 &&
        item.order.every((id) => q.options.some((o) => o.id === id))
      );
    });
  return setStudyMode(
    { ...state, progress, session: sessionValid ? state.session : null },
    state.mode,
  );
}
export function parseBackup(text: string, catalog: Catalog): State {
  if (text.length > 10_000_000) throw new Error('Backup too large');
  const parsed = stateSchema.parse(JSON.parse(text));
  const activeInterests = new Set(catalog.categories.map((category) => category.id));
  if (
    new Set(parsed.interests).size !== parsed.interests.length ||
    parsed.interests.some((id) => !activeInterests.has(id) && !retiredSchema1Interests.has(id))
  )
    throw new Error('Invalid interests');
  if (parsed.session) {
    const session = parsed.session;
    if (
      session.cursor > session.items.length ||
      (session.feedback && session.cursor === session.items.length)
    )
      throw new Error('Invalid session cursor');
    const attempts = parsed.attempts.filter((a) => a.sessionId === session.id);
    if (attempts.length !== session.cursor + (session.feedback ? 1 : 0))
      throw new Error('Incomplete session history');
    for (let i = 0; i < attempts.length; i++) {
      const a = attempts[i],
        item = session.items[i];
      if (
        a.knowledgeId !== item.knowledgeId ||
        a.questionId !== item.questionId ||
        a.revision !== item.revision ||
        a.retry !== item.retry ||
        !!a.practice !== !!item.practice
      )
        throw new Error('Inconsistent session history');
    }
    if (session.feedback) {
      const last = attempts[attempts.length - 1];
      if (last.grade !== session.feedback.grade || last.selectedId !== session.feedback.selectedId)
        throw new Error('Inconsistent feedback');
    }
  }
  return reconcile(
    { ...parsed, interests: parsed.interests.filter((id) => activeInterests.has(id)) },
    catalog,
  );
}
