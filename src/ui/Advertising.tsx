import { ReactNode } from 'react';

// AdMob's mobile SDK has no web implementation. Web remains a UI review surface.
export function AdvertisingProvider({ children }: { children: ReactNode }) {
  return children;
}
export function BannerSlot() {
  return null;
}
