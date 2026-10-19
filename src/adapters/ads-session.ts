export interface ConsentInfo {
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
}
export interface AdsPort {
  gatherConsent(): Promise<ConsentInfo>;
  getConsentInfo(): Promise<ConsentInfo>;
  initialize(): Promise<void>;
  showPrivacyOptions(): Promise<ConsentInfo>;
}
export interface AdsState extends ConsentInfo {
  ready: boolean;
  error: boolean;
}
// The SDK owns consent persistence. Learning records never enter this adapter.
export class AdsSession {
  private initialized = false;
  private pending: Promise<AdsState> | null = null;
  constructor(private readonly port: AdsPort) {}

  start(): Promise<AdsState> {
    return this.run(async () => {
      try {
        return await this.port.gatherConsent();
      } catch {
        // UMP may authorize requests using consent from a previous launch.
        const previous = await this.port.getConsentInfo();
        if (!previous.canRequestAds) throw new Error('Consent refresh unavailable');
        return previous;
      }
    });
  }

  showPrivacyOptions(): Promise<AdsState> {
    return this.run(() => this.port.showPrivacyOptions());
  }

  private run(readConsent: () => Promise<ConsentInfo>): Promise<AdsState> {
    if (this.pending) return this.pending;
    this.pending = (async () => {
      let info: ConsentInfo = { canRequestAds: false, privacyOptionsRequired: false };
      try {
        info = await readConsent();
        if (info.canRequestAds && !this.initialized) {
          await this.port.initialize();
          this.initialized = true;
        }
        return { ...info, ready: info.canRequestAds && this.initialized, error: false };
      } catch {
        return { ...info, ready: false, error: true };
      }
    })().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }
}
