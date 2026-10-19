import { createContext, useContext } from 'react';
import { AdsState } from '../adapters/ads-session';

export interface AdvertisingState extends AdsState {
  supported: boolean;
  busy: boolean;
  revision: number;
  retry(): Promise<void>;
  showPrivacyOptions(): Promise<void>;
}
export const AdvertisingContext = createContext<AdvertisingState>({
  supported: false,
  busy: false,
  ready: false,
  canRequestAds: false,
  privacyOptionsRequired: false,
  error: false,
  revision: 0,
  retry: async () => {},
  showPrivacyOptions: async () => {},
});
export const useAdvertising = () => useContext(AdvertisingContext);
