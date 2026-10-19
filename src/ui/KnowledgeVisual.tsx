import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { catalog } from '../content';
import { Knowledge, Locale } from '../core/model';
import { colors, styles as s } from './theme';

function Moon({ phase, size = 54 }: { phase: number; size?: number }) {
  const shapes = [
    '',
    'M50 10A40 40 0 0 1 50 90A28 40 0 0 0 50 10Z',
    'M50 10A40 40 0 0 1 50 90Z',
    'M50 10A40 40 0 0 1 50 90A28 40 0 0 1 50 10Z',
    '',
    'M50 10A40 40 0 0 0 50 90A28 40 0 0 0 50 10Z',
    'M50 10A40 40 0 0 0 50 90Z',
    'M50 10A40 40 0 0 0 50 90A28 40 0 0 1 50 10Z',
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Circle cx="50" cy="50" r="40" fill="#253B43" />
      {phase === 4 ? (
        <Circle cx="50" cy="50" r="40" fill={colors.gold} />
      ) : (
        <Path d={shapes[phase]} fill={colors.gold} />
      )}
    </Svg>
  );
}
export function KnowledgeVisual({ knowledge, locale }: { knowledge: Knowledge; locale: Locale }) {
  const visual = knowledge.visual;
  const t = (ko: string, en: string) => (locale === 'ko' ? ko : en);
  if (visual?.kind === 'element')
    return (
      <View
        accessible
        accessibilityLabel={`${t('원자 번호', 'Atomic number')} ${visual.atomicNumber}, ${visual.symbol}`}
        style={{
          borderWidth: 2,
          borderColor: colors.green,
          borderRadius: 16,
          padding: 14,
          alignSelf: 'flex-start',
          minWidth: 110,
          gap: 2,
        }}
      >
        <Text style={s.muted}>{visual.atomicNumber}</Text>
        <Text style={{ fontSize: 44, color: colors.green, fontWeight: '700' }}>
          {visual.symbol}
        </Text>
        <Text style={s.muted}>{t('원소 기호', 'Chemical symbol')}</Text>
      </View>
    );
  if (visual?.kind === 'moonPhase')
    return (
      <View style={{ gap: 8 }}>
        <View accessible accessibilityLabel={knowledge.title[locale]}>
          <Moon phase={visual.phase} size={88} />
        </View>
        <View style={s.row}>
          {[0, 2, 4, 6].map((phase, i) => (
            <View key={phase} style={{ alignItems: 'center', gap: 2 }}>
              <Moon phase={phase} size={40} />
              <Text style={s.muted}>
                {[t('삭', 'New'), t('상현', 'First'), t('보름', 'Full'), t('하현', 'Last')][i]}
              </Text>
            </View>
          ))}
        </View>
        <Text style={s.muted}>
          {t(
            '북반구·남쪽 하늘 기준의 모식도. 실제 기울기는 달라요.',
            'Schematic: south-facing, Northern Hemisphere. The tilt varies.',
          )}
        </Text>
      </View>
    );
  if (knowledge.category === 'geography') {
    const q = catalog.questions.find((q) => q.id === `${knowledge.id}.forward`);
    const reverse = catalog.questions.find((q) => q.id === `${knowledge.id}.reverse`);
    if (!q || !reverse) return null;
    const capital = q.options.find((o) => o.id === q.answerId)!.text[locale];
    const country = reverse.options.find((o) => o.id === reverse.answerId)!.text[locale];
    return (
      <View style={[s.row, { backgroundColor: colors.pale, padding: 14, borderRadius: 16 }]}>
        <Svg width={34} height={44} viewBox="0 0 40 52" accessible={false}>
          <Path
            d="M20 2a16 16 0 0 0-16 16c0 13 16 30 16 30s16-17 16-30A16 16 0 0 0 20 2Z"
            fill={colors.green}
          />
          <Circle cx="20" cy="18" r="6" fill={colors.paper} />
        </Svg>
        <View style={{ flex: 1 }}>
          <Text style={s.heading}>{country}</Text>
          <Text style={s.muted}>{t('수도 ↓', 'Capital ↓')}</Text>
          <Text style={s.heading}>{capital}</Text>
        </View>
      </View>
    );
  }
  if (knowledge.id === 'coffee.cherry')
    return (
      <View
        style={s.row}
        accessible
        accessibilityLabel={t(
          '커피 열매 안의 씨앗을 보여 주는 단면 모식도',
          'Schematic cross-section showing seeds inside a coffee cherry',
        )}
      >
        <Svg width={110} height={88} viewBox="0 0 120 96" accessible={false}>
          <Ellipse cx="60" cy="50" rx="43" ry="35" fill="#A75466" />
          <Ellipse cx="60" cy="50" rx="33" ry="26" fill={colors.gold} />
          <Ellipse
            cx="46"
            cy="50"
            rx="10"
            ry="20"
            fill={colors.pale}
            stroke={colors.green}
            strokeWidth="2"
          />
          <Ellipse
            cx="74"
            cy="50"
            rx="10"
            ry="20"
            fill={colors.pale}
            stroke={colors.green}
            strokeWidth="2"
          />
          <Path d="M60 15V5" stroke={colors.green} strokeWidth="4" />
        </Svg>
        <Text style={[s.body, { flex: 1 }]}>{t('열매 안에 씨앗', 'Seeds inside the fruit')}</Text>
      </View>
    );
  if (knowledge.id === 'wine.fermentation')
    return (
      <View style={s.row}>
        <Text style={s.heading}>{t('당', 'Sugar')}</Text>
        <Text style={s.body}>→</Text>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Text style={s.muted}>{t('효모가 바꿔요', 'Yeast converts it')}</Text>
          <Text style={s.body}>{t('알코올 + CO₂', 'Alcohol + CO₂')}</Text>
        </View>
      </View>
    );
  return null;
}
