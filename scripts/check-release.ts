import { catalog } from '../src/content';
import app from '../app.json';
import listing from '../play-store/google-play.config.json';
import ads from '../config/advertising.json';
import pkg from '../package.json';
const blockers: string[] = [];
const pending = catalog.knowledge.filter((k) => k.review !== 'approved');
if (pending.length) blockers.push(`${pending.length} content candidates remain`);
if (app.expo.android.package !== listing.packageName) blockers.push('Package mismatch');
if (pkg.version !== app.expo.version) blockers.push('Package and app version mismatch');
if (
  app.expo.version !== listing.release.versionName ||
  app.expo.android.versionCode !== listing.release.versionCode
)
  blockers.push('Version mismatch');
if (
  !/^ca-app-pub-\d{16}~\d{10}$/.test(ads.android.appId) ||
  !/^ca-app-pub-\d{16}\/\d{10}$/.test(ads.android.bannerId) ||
  ads.android.appId.includes('3940256099942544')
)
  blockers.push('Registered production ad IDs are required');
if (!listing.privacyPolicyUrl.startsWith('https://www.seorilabs.com/apps/memorize-all/'))
  blockers.push('App privacy URL is required');
if (blockers.length) {
  console.error('Release is blocked:\n' + blockers.map((b) => `- ${b}`).join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'Source build checks passed. Central QA, artifact, policy, upload and public state are separate gates.',
  );
