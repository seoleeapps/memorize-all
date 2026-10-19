import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  MaxAdContentRating,
  TestIds,
  useForeground,
} from 'react-native-google-mobile-ads';
import { AdsSession, AdsState } from '../adapters/ads-session';
import { AdvertisingContext, useAdvertising } from './advertising-context';
import { useLearning } from './useLearning';
import { colors } from './theme';

type SdkConsentInfo = Awaited<ReturnType<typeof AdsConsent.getConsentInfo>>;
const consentInfo = (info: SdkConsentInfo) => ({
  canRequestAds: info.canRequestAds,
  privacyOptionsRequired:
    info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
});
const advertising = Constants.expoConfig?.extra?.advertising as {
  mode: 'test' | 'live';
  androidBannerId: string | null;
  iosBannerId: string | null;
};
const unitId =
  advertising.mode === 'test'
    ? TestIds.BANNER
    : Platform.OS === 'ios'
      ? advertising.iosBannerId!
      : advertising.androidBannerId!;

export function AdvertisingProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(
    () =>
      new AdsSession({
        gatherConsent: async () => consentInfo(await AdsConsent.gatherConsent()),
        getConsentInfo: async () => consentInfo(await AdsConsent.getConsentInfo()),
        initialize: async () => {
          await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
          await mobileAds().initialize();
        },
        showPrivacyOptions: async () => {
          await AdsConsent.showPrivacyOptionsForm();
          return consentInfo(await AdsConsent.getConsentInfo());
        },
      }),
  );
  const [info, setInfo] = useState<AdsState>({
    canRequestAds: false,
    privacyOptionsRequired: false,
    ready: false,
    error: false,
  });
  const [busy, setBusy] = useState(true);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(async () => {
    setBusy(true);
    setInfo(await controller.start());
    setBusy(false);
    setRevision((value) => value + 1);
  }, [controller]);
  const showPrivacyOptions = useCallback(async () => {
    // Tear down the current request before consent is changed.
    setBusy(true);
    setInfo((value) => ({ ...value, ready: false }));
    setInfo(await controller.showPrivacyOptions());
    setBusy(false);
    setRevision((value) => value + 1);
  }, [controller]);
  useEffect(() => {
    let active = true;
    void controller.start().then((next) => {
      if (active) {
        setInfo(next);
        setBusy(false);
      }
    });
    return () => {
      active = false;
    };
  }, [controller]);
  return (
    <AdvertisingContext.Provider
      value={{ ...info, supported: true, busy, revision, retry, showPrivacyOptions }}
    >
      {children}
    </AdvertisingContext.Provider>
  );
}

export function BannerSlot() {
  const { ready, busy, revision } = useAdvertising();
  const { state } = useLearning();
  const banner = useRef<BannerAd>(null);
  useForeground(() => {
    if (Platform.OS === 'ios' && ready && !busy) banner.current?.load();
  });
  const ko = state?.locale === 'ko';
  return (
    <View style={styles.slot} testID="banner-ad-slot">
      <Text style={styles.label}>
        {advertising.mode === 'test' ? (ko ? '테스트 광고' : 'Test ad') : ko ? '광고' : 'Ad'}
      </Text>
      <View style={styles.banner}>
        {ready && !busy && (
          <BannerAd key={revision} ref={banner} unitId={unitId} size={BannerAdSize.BANNER} />
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  // A fixed 50pt banner preserves vertical space and never overlays study/navigation controls.
  slot: { paddingTop: 8, borderTopWidth: 1, borderColor: colors.line, alignItems: 'center' },
  label: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  banner: { height: 50, width: 320 },
});
