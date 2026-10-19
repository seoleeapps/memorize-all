import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
if (
  !process.env.RUNNER_TEMP ||
  !process.env.KEY_BASE64 ||
  !process.env.STORE_PASSWORD ||
  !process.env.KEY_PASSWORD
)
  throw new Error('Registered runner signing secrets are missing');
const folder = join(process.env.RUNNER_TEMP, 'memorize-all-signing');
mkdirSync(folder, { mode: 0o700 });
const signing = JSON.parse(readFileSync('config/android-signing.json', 'utf8'));
signing.storePassword = process.env.STORE_PASSWORD;
signing.keyPassword = process.env.KEY_PASSWORD;
signing.storeFile = join(folder, 'upload.p12');
writeFileSync(signing.storeFile, Buffer.from(process.env.KEY_BASE64, 'base64'), { mode: 0o600 });
writeFileSync(join(folder, 'signing.json'), JSON.stringify(signing), { mode: 0o600 });
