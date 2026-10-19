import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { catalog } from '../content';
import {
  advance,
  answer,
  beginSession,
  currentProgress,
  delayedResults,
  dueKnowledge,
  finish,
  markUnsure,
  parseBackup,
  sessionSummary,
  setStudyMode,
} from '../core/learning';
import { Knowledge, State } from '../core/model';
import { exportBackup, importBackup } from '../adapters/backup';
import { useLearning } from './useLearning';
import { Button, Card, Choice, Meter, Stat } from './components';
import { KnowledgeVisual } from './KnowledgeVisual';
import { CardTurnIcon, TabIcon, TopicIcon } from './Icons';
import { StudyMode } from './StudyMode';
import { AdPrivacyControls } from './AdPrivacyControls';
import { colors, styles as s } from './theme';
import { router, useLocalSearchParams } from 'expo-router';
void SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'today' | 'explore' | 'collection' | 'settings' | 'learn' | 'pack' | 'detail';
export default function Main({ screen }: { screen: Screen }) {
  const { state, error, busy, commit, load } = useLearning();
  const { width, fontScale } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string; id?: string }>();
  const category = params.category ?? 'geography';
  const detail = catalog.knowledge.find((k) => k.id === params.id) ?? null;
  const [revealedKey, setRevealedKey] = useState('');
  const [sourceKey, setSourceKey] = useState('');
  const [now, setNow] = useState(Date.now);
  const [notice, setNotice] = useState('');
  const [restore, setRestore] = useState<State | null>(null);
  const [filter, setFilter] = useState<'all' | 'practicing' | 'remembered'>('all');
  const [choosing, setChoosing] = useState(false);
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [ioBusy, setIoBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const ko = state?.locale === 'ko';
  const t = (kr: string, en: string) => (ko ? kr : en);
  const go = (next: Screen) => {
    setNotice('');
    router.replace(`/${next}`);
  };
  const loaded = !!state;
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    const sub = AppState.addEventListener('change', (value) => {
      if (value === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [screen, state?.session?.cursor]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (restore) {
        setRestore(null);
        return true;
      }
      if (choosing) {
        setChoosing(false);
        return true;
      }
      if (screen !== 'today') {
        go(screen === 'detail' ? 'collection' : screen === 'pack' ? 'explore' : 'today');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, restore, choosing]);
  const grade = state?.session?.feedback?.grade;
  const announcement = grade
    ? grade === 'correct'
      ? t('정답이에요', 'Correct')
      : t('정답을 확인해 보세요', 'Review the answer')
    : '';
  useEffect(() => {
    if (announcement) AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);
  if (!state)
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
        <View style={[s.scroll, { flex: 1, justifyContent: 'center' }]}>
          <Text style={s.title}>Memorize All</Text>
          {error ? (
            <>
              <Text style={s.body}>
                저장한 기록을 열지 못했어요. / Could not open saved records.
              </Text>
              <Text style={s.muted}>
                기록을 덮어쓰지 않았습니다. / Your data has not been overwritten.
              </Text>
              <Button label="다시 시도 / Retry" onPress={() => void load()} />
            </>
          ) : (
            <ActivityIndicator color={colors.green} accessibilityLabel="Loading" />
          )}
        </View>
      </SafeAreaView>
    );
  const l = state.locale;
  const session = state.session;
  const active = !!session && session.cursor < session.items.length;
  const item = active ? session!.items[session!.cursor] : null;
  const knowledge = item ? catalog.knowledge.find((k) => k.id === item.knowledgeId)! : null;
  const question = item ? catalog.questions.find((q) => q.id === item.questionId)! : null;
  const questionKey = `${session?.id}:${session?.cursor}:${session?.mode}`;
  const revealed = revealedKey === questionKey;
  const due = dueKnowledge(state, catalog, now);
  const learned = catalog.knowledge.filter((k) => currentProgress(state, k));
  const remembered = learned.filter((k) => currentProgress(state, k)?.stage === 'remembered');
  const categoryInfo = catalog.categories.find((c) => c.id === category) ?? catalog.categories[0];
  const pack = catalog.knowledge.filter((k) => k.category === category);
  const start = async (cat?: string, reviewOnly = false) => {
    if (
      await commit((st) =>
        beginSession(
          st,
          catalog,
          Date.now(),
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          Math.random,
          cat,
          reviewOnly,
        ),
      )
    )
      go('learn');
  };
  const selectedInterests = choosing ? draftInterests : state.interests;
  const toggleInterest = (id: string) => {
    const toggle = (ids: string[]) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 3 ? [...ids, id] : ids;
    if (choosing) setDraftInterests(toggle(draftInterests));
    else void commit((st) => ({ ...st, interests: toggle(st.interests) }));
  };
  const modePicker = (
    <StudyMode
      mode={state.mode}
      locale={l}
      disabled={busy}
      onChange={(mode) => {
        if (mode === state.mode) return;
        void commit((st) => setStudyMode(st, mode)).then((ok) => {
          if (ok) {
            setRevealedKey('');
            setSourceKey('');
          }
        });
      }}
    />
  );
  const source = (k: Knowledge) => (
    <View style={{ gap: 6 }}>
      <Text style={s.muted}>
        {k.source.label}
        {k.source.checkedAt ? ` · ${k.source.checkedAt}` : ''}
      </Text>
      <Button
        secondary
        label={t('출처 확인 ↗', 'View source ↗')}
        onPress={() =>
          void Linking.openURL(k.source.url).catch(() =>
            setNotice(
              t(
                '출처를 열 수 없어요. 연결을 확인해 주세요.',
                'Could not open the source. Check your connection.',
              ),
            ),
          )
        }
      />
      <Text style={s.muted}>
        {t('학습용 설명입니다. 원문에서 더 알아보세요.', 'Explore the source to learn more.')}
      </Text>
    </View>
  );
  const interestScreen = !state.onboarded || choosing;
  let body: React.ReactNode;
  if (interestScreen)
    body = (
      <>
        <View style={s.spread}>
          <Text style={s.heading}>Memorize All</Text>
          <Button
            secondary
            label={ko ? 'English' : '한국어'}
            onPress={() => void commit((st) => ({ ...st, locale: ko ? 'en' : 'ko' }))}
          />
        </View>
        <Text style={s.title}>{t('무엇이 궁금하세요?', 'What sparks your curiosity?')}</Text>
        <Text style={s.body}>
          {t(
            '지금 배우고 싶은 분야를 1~3개 골라 주세요.',
            'Choose 1–3 topics you would like to explore.',
          )}
        </Text>
        <Button
          label={t(
            choosing ? '관심 분야 저장' : `${selectedInterests.length}개 분야로 시작`,
            choosing ? 'Save interests' : 'Start learning',
          )}
          disabled={!selectedInterests.length || busy}
          onPress={() =>
            void commit((st) => ({ ...st, onboarded: true, interests: selectedInterests })).then(
              (ok) => {
                if (ok) setChoosing(false);
              },
            )
          }
        />
        {choosing && (
          <Button secondary label={t('취소', 'Cancel')} onPress={() => setChoosing(false)} />
        )}
        <View style={s.grid}>
          {catalog.categories
            .filter((c) => catalog.knowledge.some((k) => k.category === c.id))
            .map((c) => (
              <View key={c.id} style={{ flexBasis: '45%', flexGrow: 1 }}>
                <Choice
                  label={`${c.mark}  ${c.title[l]}${selectedInterests.includes(c.id) ? ' ✓' : ''}`}
                  selected={selectedInterests.includes(c.id)}
                  disabled={
                    busy || (!selectedInterests.includes(c.id) && selectedInterests.length >= 3)
                  }
                  onPress={() => toggleInterest(c.id)}
                />
              </View>
            ))}
        </View>
        <Card>
          <Text style={s.heading}>
            {t('작게 배우고, 오래 기억해요', 'Small discoveries. Lasting memories.')}
          </Text>
          <Text style={s.body}>
            {t('질문 → 짧은 해설 → 시간 두고 복습', 'Recall → Understand → Revisit')}
          </Text>
          <Text style={s.muted}>
            {t(
              '가입 없이 시작해요. 학습 기록은 이 기기에 저장됩니다.',
              'No account needed. Your learning stays on this device.',
            )}
          </Text>
        </Card>
        <Text style={s.muted}>
          {t('5개 분야, 한국어와 영어 지식 100개', '5 topics, 100 facts in Korean and English')}
        </Text>
      </>
    );
  else if (screen === 'today')
    body = (
      <>
        <Text style={s.title}>{t('오늘', 'Today')}</Text>
        <Button
          label={
            session
              ? t('이어서 학습하기', 'Continue learning')
              : t('오늘의 10개 시작', 'Start today’s 10')
          }
          disabled={busy}
          testID="start-daily"
          onPress={() => void start()}
        />
        <View style={s.hero}>
          <Text style={[s.heading, { color: '#FFF' }]}>
            {t('나의 작은 지식 도감', 'Your growing collection')}
          </Text>
          <View style={s.row}>
            <Stat light value={learned.length} label={t('수집한 지식', 'facts collected')} />
            <Stat light value={due.length} label={t('복습할 지식', 'due for review')} />
          </View>
        </View>
        {due.length > 0 && !session && (
          <Button
            secondary
            label={t(
              `복습 ${Math.min(10, due.length)}개만 먼저`,
              `Review ${Math.min(10, due.length)} due facts first`,
            )}
            onPress={() => void start(undefined, true)}
          />
        )}
        <View style={s.row}>
          {[
            [
              learned.filter((k) => currentProgress(state, k)?.stage === 'seen').length,
              t('처음 봄', 'Discovered'),
            ],
            [
              learned.filter((k) => currentProgress(state, k)?.stage === 'practicing').length,
              t('연습 중', 'Practicing'),
            ],
            [remembered.length, t('오래 기억함', 'Remembered')],
          ].map(([value, label], index) => (
            <View key={label} style={{ flex: 1, minWidth: 80, gap: 6 }}>
              <View
                style={{
                  height: 4,
                  backgroundColor: [colors.line, colors.gold, colors.green][index],
                  borderRadius: 2,
                }}
              />
              <Text style={s.heading}>{value}</Text>
              <Text style={s.muted}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={s.spread}>
          <Text style={s.muted}>{t('관심 분야', 'Your interests')}</Text>
          <Button
            secondary
            label={t('바꾸기', 'Edit')}
            onPress={() => {
              setDraftInterests(state.interests);
              setChoosing(true);
            }}
          />
        </View>
        <Text style={s.body}>
          {catalog.categories
            .filter((c) => selectedInterests.includes(c.id))
            .map((c) => c.title[l])
            .join(' · ')}
        </Text>
      </>
    );
  else if (screen === 'explore')
    body = (
      <>
        <Text style={s.title}>{t('호기심 따라 탐색', 'Follow your curiosity')}</Text>
        <Text style={s.muted}>
          {t(
            '5개 분야에서 새로운 지식을 발견해 보세요.',
            'Discover something new across 5 topics.',
          )}
        </Text>
        <View style={s.grid}>
          {catalog.categories.map((c) => {
            const count = catalog.knowledge.filter((k) => k.category === c.id).length;
            return (
              <View
                key={c.id}
                style={[s.tile, (width < 350 || fontScale > 1.2) && { flexBasis: '100%' }]}
              >
                <TopicIcon topic={c.id} />
                <Text style={[s.heading, { fontSize: 18, lineHeight: 26 }]}>{c.title[l]}</Text>
                <Text style={s.muted}>
                  {count
                    ? t(`입문 · ${count}개`, `Introduction · ${count} facts`)
                    : t('지식 없음', 'No facts')}
                </Text>
                {count > 0 && (
                  <Button
                    secondary
                    label={t('묶음 보기', 'View pack')}
                    onPress={() => {
                      router.push({ pathname: '/pack', params: { category: c.id } });
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </>
    );
  else if (screen === 'pack' && !pack.length)
    body = (
      <>
        <Text style={s.heading}>{t('묶음을 찾을 수 없어요', 'Pack not found')}</Text>
        <Button label={t('탐색으로', 'Back to Explore')} onPress={() => go('explore')} />
      </>
    );
  else if (screen === 'pack')
    body = (
      <>
        <Button secondary label={t('← 탐색', '← Explore')} onPress={() => go('explore')} />
        <View style={s.row}>
          <TopicIcon topic={categoryInfo.id} />
          <Text style={s.muted}>{t('입문 묶음', 'Introduction')}</Text>
        </View>
        <Text style={s.title}>{categoryInfo.title[l]}</Text>
        <Text style={s.body}>
          {t(
            `${pack.length}개 지식으로 완성하는 첫 번째 묶음`,
            `Your first collection of ${pack.length} facts`,
          )}
        </Text>
        <Meter
          value={pack.filter((k) => currentProgress(state, k)).length}
          total={pack.length}
          label={t('발견한 지식', 'Discovered')}
        />
        {modePicker}
        <Button
          label={
            session
              ? t('진행 중인 학습 이어서', 'Resume current session')
              : pack.every((k) => currentProgress(state, k))
                ? t('이 묶음 다시 연습', 'Practice this pack again')
                : t('이 묶음 학습하기', 'Study this pack')
          }
          disabled={busy}
          onPress={() => void start(category)}
        />
        {pack.every((k) => currentProgress(state, k)) && (
          <Text style={s.muted}>
            {t(
              '모두 발견했어요! 다시 연습은 지연 복습 정답률에 포함하지 않아요.',
              'All discovered! Extra practice is excluded from delayed review accuracy.',
            )}
          </Text>
        )}
        {pack.map((k) => (
          <Card key={k.id}>
            <Text style={s.body}>{k.title[l]}</Text>
            <Text style={s.muted}>
              {currentProgress(state, k)
                ? t('도감에 수집됨', 'In your collection')
                : t('새로운 지식', 'New discovery')}
            </Text>
          </Card>
        ))}
      </>
    );
  else if (screen === 'learn') {
    if (!session)
      body = (
        <>
          <Text style={s.title}>{t('지금은 모두 살펴봤어요', 'You’re all caught up')}</Text>
          <Text style={s.body}>
            {t(
              '오늘 예정된 복습과 새 지식이 없어요. 다른 분야를 탐색하거나 배운 묶음을 다시 연습해 보세요.',
              'No due reviews or new facts today. Explore another topic or practice a learned pack.',
            )}
          </Text>
          <Button label={t('탐색하기', 'Explore topics')} onPress={() => go('explore')} />
        </>
      );
    else if (!active) {
      const summary = sessionSummary(state);
      body = (
        <>
          <Text style={s.title}>{t('조금 더 알게 된 오늘', 'A little wiser today')}</Text>
          <View style={s.hero}>
            <Text style={[s.heading, { color: '#FFF' }]}>{t('첫 응답 결과', 'First answers')}</Text>
            <Stat
              light
              value={`${summary.correct} / ${summary.total}`}
              label={
                state.attempts.some((a) => a.sessionId === session.id && a.mode === 'card')
                  ? t('정답·기억한 자기 평가 / 지식 개수', 'correct / self-reported recall · facts')
                  : t('정답 / 지식 개수', 'correct · unique facts')
              }
            />
          </View>
          <Card>
            <Stat
              value={summary.retried}
              label={t('같은 학습에서 다시 맞혔어요', 'correct on a same-session retry')}
            />
            <Stat
              value={summary.recovered}
              label={t('7일 이상 뒤 되찾은 오답', 'past mistakes recalled after 7+ days')}
            />
            <Text style={s.muted}>
              {t(
                '바로 다시 맞힌 결과는 장기 기억으로 세지 않아요.',
                'Immediate retries do not count as long-term recall.',
              )}
            </Text>
          </Card>
          <Button
            label={t('도감에서 보기', 'See my collection')}
            disabled={busy}
            onPress={() =>
              void commit((st) => finish(st, Date.now())).then((ok) => {
                if (ok) go('collection');
              })
            }
          />
        </>
      );
    } else if (item && knowledge && question) {
      const feedback = session.feedback;
      const correct = question.options.find((o) => o.id === question.answerId)!;
      body = (
        <>
          <View style={s.spread}>
            <Button
              secondary
              label={t('← 잠시 쉬기', '← Take a break')}
              onPress={() => go('today')}
            />
            <Text style={s.muted}>
              {item.retry
                ? t('오답 다시 보기', 'Try again')
                : catalog.categories.find((c) => c.id === knowledge.category)!.title[l]}
            </Text>
          </View>
          <Meter
            value={session.cursor}
            total={session.items.length}
            label={t('학습 진행', 'Session progress')}
          />
          {modePicker}
          {session.mode === 'quiz' && <Text style={s.heading}>{question.prompt[l]}</Text>}
          {!feedback && session.mode === 'quiz' && (
            <View style={{ gap: 12 }}>
              {item.order.map((id) => (
                <Choice
                  key={id}
                  testID={`answer-${id}`}
                  label={question.options.find((o) => o.id === id)!.text[l]}
                  onPress={() => void commit((st) => answer(st, catalog, id, null, Date.now()))}
                  disabled={busy}
                />
              ))}
            </View>
          )}
          {!feedback && session.mode === 'card' && (
            <>
              {!revealed ? (
                <Pressable
                  testID="flashcard-front"
                  accessibilityRole="button"
                  accessibilityLabel={`${question.prompt[l]}. ${t('답 확인하기', 'Reveal answer')}`}
                  onPress={() => setRevealedKey(questionKey)}
                  style={({ pressed }) => [s.flashcard, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <TopicIcon topic={knowledge.category} size={64} />
                  <Text style={[s.heading, { textAlign: 'center' }]}>{question.prompt[l]}</Text>
                  <View style={[s.row, { justifyContent: 'center' }]}>
                    <CardTurnIcon />
                    <Text style={s.muted}>{t('눌러서 답 확인', 'Tap to reveal')}</Text>
                  </View>
                </Pressable>
              ) : (
                <View
                  testID="flashcard-back"
                  style={[s.card, { borderColor: colors.green }]}
                  accessibilityLiveRegion="polite"
                >
                  <Text style={s.muted}>{question.prompt[l]}</Text>
                  {knowledge.category !== 'geography' && (
                    <Text style={s.heading}>{correct.text[l]}</Text>
                  )}
                  <KnowledgeVisual knowledge={knowledge} locale={l} />
                  {knowledge.category !== 'geography' && (
                    <Text style={s.body}>{knowledge.explanation[l]}</Text>
                  )}
                </View>
              )}
              {!revealed ? (
                <Button
                  label={t('답 확인하기', 'Reveal answer')}
                  onPress={() => setRevealedKey(questionKey)}
                />
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={s.muted}>
                    {t(
                      '얼마나 기억했나요? 고르면 다음 카드로 넘어가요.',
                      'How did you do? Choose to continue.',
                    )}
                  </Text>
                  {(['correct', 'unsure', 'wrong'] as const).map((grade) => (
                    <Button
                      key={grade}
                      testID={`grade-${grade}`}
                      disabled={busy}
                      secondary={grade !== 'correct'}
                      label={
                        grade === 'correct'
                          ? t('기억했어요', 'I remembered')
                          : grade === 'unsure'
                            ? t('헷갈렸어요', 'I was unsure')
                            : t('기억 못 했어요', 'I did not remember')
                      }
                      onPress={() =>
                        void commit((st) =>
                          advance(answer(st, catalog, null, grade, Date.now()), catalog),
                        )
                      }
                    />
                  ))}
                  <Button
                    secondary
                    label={t('출처 보기', 'Show source')}
                    onPress={() => setSourceKey(sourceKey === questionKey ? '' : questionKey)}
                  />
                  {sourceKey === questionKey && source(knowledge)}
                </View>
              )}
            </>
          )}
          {feedback && (
            <>
              <View
                style={[s.card, { backgroundColor: colors.pale }]}
                accessibilityLiveRegion="polite"
              >
                <Text style={s.eyebrow}>
                  {feedback.grade === 'correct'
                    ? t('✓ 정답이에요', '✓ CORRECT')
                    : feedback.grade === 'unsure'
                      ? t('↻ 한 번 더 기억해 봐요', '↻ KEEP PRACTICING')
                      : t('↻ 다음에는 기억할 수 있어요', '↻ ANOTHER CHANCE TO LEARN')}
                </Text>
                <Text style={s.heading}>{correct.text[l]}</Text>
                {feedback.selectedId && feedback.grade === 'wrong' && (
                  <Text style={s.muted}>
                    {t('내가 고른 답: ', 'Your answer: ')}
                    {question.options.find((o) => o.id === feedback.selectedId)?.text[l]}
                  </Text>
                )}
                {knowledge.category !== 'geography' && (
                  <KnowledgeVisual knowledge={knowledge} locale={l} />
                )}
                <Text style={s.body}>{knowledge.explanation[l]}</Text>
              </View>
              <Button
                label={t('다음으로', 'Continue')}
                disabled={busy}
                onPress={() => void commit((st) => advance(st, catalog))}
              />
              {feedback.grade === 'correct' && (
                <Button
                  secondary
                  label={t('맞혔지만 헷갈렸어요', 'Correct, but I was unsure')}
                  disabled={busy}
                  onPress={() => void commit(markUnsure)}
                />
              )}
              {source(knowledge)}
            </>
          )}
        </>
      );
    }
  } else if (screen === 'collection') {
    const delayed = delayedResults(state, catalog);
    const shown = learned.filter(
      (k) => filter === 'all' || currentProgress(state, k)?.stage === filter,
    );
    body = (
      <>
        <Text style={s.title}>{t('나의 지식 도감', 'Your knowledge atlas')}</Text>
        <View style={s.row}>
          <Stat value={learned.length} label={t('처음 만난 지식', 'facts discovered')} />
          <Stat
            value={remembered.length}
            label={t('시간이 지나도 기억함', 'remembered after time')}
          />
        </View>
        <Card>
          <Text style={s.heading}>
            {t('7일 이상 뒤 퀴즈 첫 응답', 'First quiz answers after 7+ days')}
          </Text>
          <Text style={s.body}>
            {delayed.total
              ? t(
                  `${delayed.total}회 중 ${delayed.correct}회 정답`,
                  `${delayed.correct} correct out of ${delayed.total} attempts`,
                )
              : t('아직 지연 복습 기록이 없어요.', 'No delayed reviews yet.')}
          </Text>
          <Text style={s.muted}>
            {t(
              '전체 기간 · 같은 학습의 재시도는 제외해요.',
              'All time · Same-session retries excluded.',
            )}
          </Text>
        </Card>
        <View style={s.row}>
          {(['all', 'practicing', 'remembered'] as const).map((f) => (
            <Choice
              key={f}
              selected={filter === f}
              label={
                f === 'all'
                  ? t('전체', 'All')
                  : f === 'practicing'
                    ? t('연습 중', 'Practicing')
                    : t('오래 기억함', 'Remembered')
              }
              onPress={() => setFilter(f)}
            />
          ))}
        </View>
        {!shown.length ? (
          <Card>
            <Text style={s.heading}>
              {filter === 'all'
                ? t('채워 갈 페이지가 있어요', 'Pages waiting to be filled')
                : t('이 단계의 지식이 아직 없어요', 'No facts at this stage yet')}
            </Text>
            <Text style={s.body}>
              {t(
                '학습한 지식과 복습 결과가 이곳에 쌓여요.',
                'Your discoveries and review results will appear here.',
              )}
            </Text>
            {filter === 'all' ? (
              <Button label={t('학습하러 가기', 'Go to Today')} onPress={() => go('today')} />
            ) : (
              <Button
                secondary
                label={t('전체 보기', 'Show all')}
                onPress={() => setFilter('all')}
              />
            )}
          </Card>
        ) : (
          shown.map((k) => {
            const p = currentProgress(state, k)!;
            return (
              <Card key={k.id}>
                <Text style={s.heading}>{k.title[l]}</Text>
                <Text style={s.muted}>
                  {p.stage === 'remembered'
                    ? t('✓ 시간이 지나도 기억함', '✓ Remembered after time')
                    : p.stage === 'practicing'
                      ? t('↻ 연습 중', '↻ Practicing')
                      : t('○ 처음 봄', '○ Discovered')}{' '}
                  · {t('다음 복습 ', 'Next review ')}
                  {new Date(p.dueAt).toLocaleDateString(ko ? 'ko-KR' : 'en-US')}
                </Text>
                <Button
                  secondary
                  label={t('지식 살펴보기', 'Read fact')}
                  onPress={() => {
                    router.push({ pathname: '/detail', params: { id: k.id } });
                  }}
                />
              </Card>
            );
          })
        )}
      </>
    );
  } else if (screen === 'detail' && detail)
    body = (
      <>
        <Button secondary label={t('← 도감', '← Collection')} onPress={() => go('collection')} />
        <Text style={s.title}>{detail.title[l]}</Text>
        <Card>
          <KnowledgeVisual knowledge={detail} locale={l} />
          <Text style={s.body}>{detail.explanation[l]}</Text>
        </Card>
        {source(detail)}
      </>
    );
  else if (screen === 'detail')
    body = (
      <>
        <Text style={s.heading}>{t('지식을 찾을 수 없어요', 'Fact not found')}</Text>
        <Button label={t('도감으로', 'Back to collection')} onPress={() => go('collection')} />
      </>
    );
  else
    body = (
      <>
        <Text style={s.title}>{t('설정', 'Settings')}</Text>
        <Card>
          <Text style={s.heading}>{t('학습 언어', 'Learning language')}</Text>
          <View style={s.row}>
            {(['ko', 'en'] as const).map((lang) => (
              <Choice
                key={lang}
                label={lang === 'ko' ? '한국어' : 'English'}
                selected={l === lang}
                onPress={() => void commit((st) => ({ ...st, locale: lang }))}
              />
            ))}
          </View>
          <Text style={s.muted}>
            {t(
              '언어를 바꿔도 같은 지식의 진도가 이어져요.',
              'Your progress stays with each fact across languages.',
            )}
          </Text>
        </Card>
        <Card>
          <Text style={s.heading}>{t('학습 방식', 'Study mode')}</Text>
          {modePicker}
          <Text style={s.muted}>
            {t(
              '진행 중인 문제에도 적용돼요. 이미 답했다면 다음 문제부터 바뀌어요.',
              'Applies to the current question, or the next question if already answered.',
            )}
          </Text>
        </Card>
        <Card>
          <Text style={s.heading}>{t('내 기록 보관', 'Keep your progress safe')}</Text>
          <Text style={s.body}>
            {t(
              '기록은 이 기기에만 저장돼요. 앱을 지우기 전에 백업 파일을 보관하세요.',
              'Progress is stored only on this device. Save a backup before removing the app.',
            )}
          </Text>
          <Button
            label={t('백업 파일 내보내기', 'Export backup')}
            disabled={ioBusy || busy}
            onPress={() => {
              setIoBusy(true);
              void exportBackup(state)
                .catch(() =>
                  setNotice(
                    t(
                      '백업을 내보내지 못했어요. 다시 시도해 주세요.',
                      'Could not export the backup. Please try again.',
                    ),
                  ),
                )
                .finally(() => setIoBusy(false));
            }}
          />
          <Button
            secondary
            label={t('백업 파일 가져오기', 'Import backup')}
            disabled={ioBusy || busy}
            onPress={() => {
              setIoBusy(true);
              void importBackup()
                .then((text) => {
                  if (text) setRestore(parseBackup(text, catalog));
                })
                .catch(() =>
                  setNotice(
                    t(
                      '이 앱의 유효한 백업 파일을 선택해 주세요. 기록은 변경하지 않았어요.',
                      'Choose a valid backup from this app. Your data has not changed.',
                    ),
                  ),
                )
                .finally(() => setIoBusy(false));
            }}
          />
          {restore && (
            <View style={{ gap: 12 }}>
              <Text style={s.body}>
                {t(
                  `이 기기의 기록을 백업의 학습 기록 ${restore.attempts.length}개로 교체할까요? 기존 기록은 먼저 내보내 보관하세요.`,
                  `Replace this device’s progress with ${restore.attempts.length} saved answers? Export your current progress first.`,
                )}
              </Text>
              <Button
                label={t('확인하고 복원', 'Confirm restore')}
                disabled={busy}
                onPress={() =>
                  void commit(() => restore).then((ok) => {
                    if (ok) {
                      setRestore(null);
                      setNotice(t('백업을 복원했어요.', 'Backup restored.'));
                    }
                  })
                }
              />
              <Button secondary label={t('취소', 'Cancel')} onPress={() => setRestore(null)} />
            </View>
          )}
        </Card>
        <Card>
          <Text style={s.heading}>{t('데이터와 콘텐츠', 'Data & content')}</Text>
          <AdPrivacyControls />
          {[
            [
              '개인정보처리방침',
              'Privacy policy',
              'https://www.seorilabs.com/apps/memorize-all/privacy/',
            ],
            [
              '도움과 문의',
              'Help & support',
              'https://www.seorilabs.com/apps/memorize-all/support/',
            ],
          ].map(([kr, en, url]) => (
            <Button
              key={url}
              secondary
              label={t(kr, en)}
              onPress={() =>
                void Linking.openURL(url).catch(() =>
                  setNotice(
                    t(
                      '페이지를 열 수 없어요. 연결을 확인해 주세요.',
                      'Could not open the page. Check your connection.',
                    ),
                  ),
                )
              }
            />
          ))}
          <Text style={s.body}>
            {t(
              '학습 기록은 기기에 저장됩니다. 배너광고를 제공하는 Google은 광고 식별자·기기 정보 등을 처리할 수 있습니다.',
              'Learning records stay on this device. Google may process advertising identifiers and device information to serve banner ads.',
            )}
          </Text>
          <Text style={s.muted}>
            {t(
              '100개 지식과 200개 문제. 번역과 문제 변형은 같은 지식으로 기록해요.',
              '100 facts and 200 questions. Translations and variants share the same progress.',
            )}
          </Text>
        </Card>
      </>
    );
  const tabs: [Screen, string, string][] = [
    ['today', '오늘', 'Today'],
    ['explore', '탐색', 'Explore'],
    ['collection', '도감', 'Atlas'],
    ['settings', '설정', 'Settings'],
  ];
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.shell}>
        {error && (
          <View style={s.error} accessibilityLiveRegion="assertive">
            <Text style={s.body}>
              {t(
                '저장하지 못했어요. 마지막 기록은 유지됩니다. 같은 동작을 다시 시도해 주세요.',
                'Could not save. Your last saved state is intact. Please retry the action.',
              )}
            </Text>
          </View>
        )}
        {!!notice && (
          <View style={s.error} accessibilityLiveRegion="polite">
            <Text style={s.body}>{notice}</Text>
            <Button secondary label={t('닫기', 'Dismiss')} onPress={() => setNotice('')} />
          </View>
        )}
        <ScrollView
          ref={scroll}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
        {!interestScreen && screen !== 'learn' && (
          <View style={s.tabs}>
            {tabs.map(([tab, kr, en]) => (
              <Pressable
                key={tab}
                testID={`tab-${tab}`}
                accessibilityRole="tab"
                accessibilityState={{
                  selected:
                    screen === tab ||
                    (tab === 'explore' && screen === 'pack') ||
                    (tab === 'collection' && screen === 'detail'),
                }}
                onPress={() => go(tab)}
                style={[s.tab, screen === tab && { backgroundColor: colors.pale }]}
              >
                <TabIcon
                  tab={tab}
                  selected={
                    screen === tab ||
                    (tab === 'explore' && screen === 'pack') ||
                    (tab === 'collection' && screen === 'detail')
                  }
                />
                <Text
                  style={[s.tabText, screen === tab && { color: colors.green, fontWeight: '700' }]}
                >
                  {t(kr, en)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
