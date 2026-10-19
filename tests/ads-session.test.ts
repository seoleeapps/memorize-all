import test from 'node:test';
import assert from 'node:assert/strict';
import { AdsPort, AdsSession, ConsentInfo } from '../src/adapters/ads-session';

const allowed: ConsentInfo = { canRequestAds: true, privacyOptionsRequired: true };
const blocked: ConsentInfo = { canRequestAds: false, privacyOptionsRequired: false };
function fixture(overrides: Partial<AdsPort> = {}) {
  const calls: string[] = [];
  const port: AdsPort = {
    gatherConsent: async () => {
      calls.push('consent');
      return allowed;
    },
    getConsentInfo: async () => {
      calls.push('previous');
      return allowed;
    },
    initialize: async () => {
      calls.push('initialize');
    },
    showPrivacyOptions: async () => {
      calls.push('privacy');
      return allowed;
    },
    ...overrides,
  };
  return { calls, session: new AdsSession(port) };
}
test('consent precedes initialization; concurrent starts and privacy changes do not reinitialize', async () => {
  const { session, calls } = fixture();
  const [first, second] = await Promise.all([session.start(), session.start()]);
  assert.equal(first.ready, true);
  assert.deepEqual(second, first);
  assert.deepEqual(calls, ['consent', 'initialize']);
  await session.showPrivacyOptions();
  assert.deepEqual(calls, ['consent', 'initialize', 'privacy']);
});
test('without request permission the SDK is never initialized', async () => {
  const { session, calls } = fixture({ gatherConsent: async () => blocked });
  assert.equal((await session.start()).ready, false);
  assert.deepEqual(calls, []);
});
test('offline consent refresh uses the SDK previous consent; unknown consent keeps ads off', async () => {
  for (const previous of [allowed, blocked]) {
    const { session, calls } = fixture({
      gatherConsent: async () => {
        throw new Error('offline');
      },
      getConsentInfo: async () => previous,
    });
    const result = await session.start();
    assert.equal(result.ready, previous.canRequestAds);
    assert.equal(result.error, !previous.canRequestAds);
    assert.deepEqual(calls, previous.canRequestAds ? ['initialize'] : []);
  }
});
test('a first offline launch exposes retry and reconnecting can start ads', async () => {
  let online = false;
  const { session } = fixture({
    gatherConsent: async () => {
      if (!online) throw new Error('offline');
      return allowed;
    },
    getConsentInfo: async () => blocked,
  });
  assert.equal((await session.start()).error, true);
  online = true;
  assert.equal((await session.start()).ready, true);
});
test('initialization failure can be retried; unavailable consent does not reject into the UI', async () => {
  let tries = 0;
  const { session } = fixture({
    initialize: async () => {
      if (++tries === 1) throw new Error('SDK');
    },
  });
  assert.equal((await session.start()).error, true);
  assert.equal((await session.start()).ready, true);
  const unavailable = fixture({
    gatherConsent: async () => {
      throw new Error('offline');
    },
    getConsentInfo: async () => {
      throw new Error('SDK');
    },
  });
  assert.equal((await unavailable.session.start()).ready, false);
  assert.equal((await unavailable.session.start()).error, true);
});
test('changed consent immediately denies future requests without another initialization', async () => {
  const { session, calls } = fixture({ showPrivacyOptions: async () => blocked });
  assert.equal((await session.start()).ready, true);
  assert.equal((await session.showPrivacyOptions()).ready, false);
  assert.deepEqual(calls, ['consent', 'initialize']);
});
