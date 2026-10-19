import { useAdvertising } from './advertising-context';
import { useLearning } from './useLearning';
import { Button } from './components';
import { Text, View } from 'react-native';
import { styles as s } from './theme';

export function AdPrivacyControls() {
  const ads = useAdvertising();
  const { state } = useLearning();
  if (!ads.supported) return null;
  const ko = state?.locale === 'ko';
  return (
    <View style={{ gap: 12 }}>
      {ads.privacyOptionsRequired && (
        <Button
          secondary
          label={ko ? '광고 개인정보 선택' : 'Ad privacy choices'}
          disabled={ads.busy}
          onPress={() => void ads.showPrivacyOptions()}
        />
      )}
      {ads.error && (
        <>
          <Text style={s.muted}>
            {ko
              ? '광고 설정을 불러오지 못했어요. 학습은 계속할 수 있어요.'
              : 'Ad settings are unavailable. You can keep learning.'}
          </Text>
          <Button
            secondary
            label={ko ? '광고 설정 다시 확인' : 'Retry ad settings'}
            disabled={ads.busy}
            onPress={() => void ads.retry()}
          />
        </>
      )}
    </View>
  );
}
