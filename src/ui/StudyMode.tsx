import { View, useWindowDimensions } from 'react-native';
import { Locale, State } from '../core/model';
import { Choice } from './components';

export function StudyMode({
  mode,
  locale,
  disabled,
  onChange,
}: {
  mode: State['mode'];
  locale: Locale;
  disabled: boolean;
  onChange: (mode: State['mode']) => void;
}) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {(['quiz', 'card'] as const).map((value) => (
        <View key={value} style={{ flexGrow: 1, flexBasis: fontScale > 1.2 ? '100%' : '40%' }}>
          <Choice
            testID={`mode-${value}`}
            label={
              value === 'quiz'
                ? locale === 'ko'
                  ? '선택형 퀴즈'
                  : 'Multiple choice'
                : locale === 'ko'
                  ? '플래시카드'
                  : 'Flashcards'
            }
            selected={mode === value}
            disabled={disabled}
            onPress={() => onChange(value)}
          />
        </View>
      ))}
    </View>
  );
}
