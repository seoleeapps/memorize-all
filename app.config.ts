import { readFileSync } from 'node:fs';
import { ConfigContext, ExpoConfig } from 'expo/config';

type AdIds = { appId: string | null; bannerId: string | null };
const ids = JSON.parse(readFileSync('./config/advertising.json', 'utf8')) as {
  android: AdIds;
  ios: AdIds;
};
export default ({ config }: ConfigContext): ExpoConfig => {
  const mode = process.env.AD_MODE ?? 'test';
  if (mode !== 'test' && mode !== 'live') throw new Error('AD_MODE must be test or live');
  if (mode === 'live') {
    const targets = process.env.EAS_BUILD_PLATFORM
      ? [process.env.EAS_BUILD_PLATFORM]
      : ['android', 'ios'];
    for (const platform of targets) {
      const value = ids[platform as keyof typeof ids];
      if (
        !value ||
        !/^ca-app-pub-\d{16}~\d{10}$/.test(value.appId ?? '') ||
        !/^ca-app-pub-\d{16}\/\d{10}$/.test(value.bannerId ?? '') ||
        value.appId?.includes('3940256099942544') ||
        value.bannerId?.includes('3940256099942544')
      )
        throw new Error(
          `A live ${platform} build requires its registered AdMob App ID and banner ID`,
        );
    }
  }
  return {
    ...config,
    name: 'Memorize All',
    slug: 'memorize-all',
    plugins: [
      ...(config.plugins ?? []),
      './plugins/with-android-upload-signing.js',
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: ids.android.appId,
          androidSdk: 'classic',
          iosAppId: ids.ios.appId,
          delayAppMeasurementInit: true,
          userTrackingUsageDescription: 'Your permission lets Google show personalized ads.',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }',
          },
        },
      ],
    ],
    extra: {
      ...config.extra,
      advertising: { mode, androidBannerId: ids.android.bannerId, iosBannerId: ids.ios.bannerId },
    },
  };
};
