import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';

const profile = process.argv[2] ?? 'internal';
if (!['internal', 'production'].includes(profile)) throw new Error('Use internal or production');
const signingPath = process.env.MEMORIZE_ALL_ANDROID_SIGNING_FILE;
if (!signingPath || !existsSync(signingPath))
  throw new Error(
    'Resolve app/memorize-all/google-play/upload-key and set MEMORIZE_ALL_ANDROID_SIGNING_FILE',
  );
const signing = JSON.parse(readFileSync(signingPath, 'utf8'));
for (const field of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword', 'certificateSha256'])
  if (!signing[field]) throw new Error(`Missing upload signing field: ${field}`);
if (!existsSync(signing.storeFile)) throw new Error('Registered upload keystore is missing');
const env = {
  ...process.env,
  AD_MODE: profile === 'production' ? 'live' : 'test',
  EAS_BUILD_PLATFORM: 'android',
};
function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (profile === 'production') run('npm', ['run', 'check:release']);
run(process.execPath, [
  'node_modules/expo/bin/cli',
  'prebuild',
  '--platform',
  'android',
  '--no-install',
]);
run(
  './gradlew',
  [':app:bundleRelease', '--console=plain', '--max-workers=4'],
  `${process.cwd()}/android`,
);
const bundle = 'android/app/build/outputs/bundle/release/app-release.aab';
run('jarsigner', ['-verify', bundle]);
const certificate = spawnSync('keytool', ['-printcert', '-rfc', '-jarfile', bundle, '-cacerts'], {
  env,
  encoding: 'utf8',
});
const certificatePem = certificate.stdout?.match(
  /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/,
)?.[0];
if (certificate.status !== 0 || !certificatePem)
  throw new Error('The bundle has no verifiable signing certificate');
if (new X509Certificate(certificatePem).fingerprint256 !== signing.certificateSha256)
  throw new Error('Bundle signer does not match the registered upload certificate');
mkdirSync('dist/android', { recursive: true });
const destination = `dist/android/memorize-all-${profile}.aab`;
copyFileSync(bundle, destination);
console.log(
  `Signed ${profile} AAB: ${destination}. Upload and runtime verification remain separate.`,
);
