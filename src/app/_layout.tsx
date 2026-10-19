import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LearningProvider } from '../ui/useLearning';
import { AdvertisingProvider, BannerSlot } from '../ui/Advertising';
import { colors } from '../ui/theme';
export default function Layout() {
  return (
    <SafeAreaProvider>
      <LearningProvider>
        <AdvertisingProvider>
          <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
            <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
            <BannerSlot />
          </SafeAreaView>
        </AdvertisingProvider>
      </LearningProvider>
    </SafeAreaProvider>
  );
}
