import { readdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
for (const file of readdirSync('src/core')) {
  const source = readFileSync(`src/core/${file}`, 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*\(|require\s*\()\s*['"]([^'"]+)/g)) {
    assert.ok(
      match[1] === 'zod' || /^\.\/(model|learning)$/.test(match[1]),
      `Forbidden core dependency: ${file} -> ${match[1]}`,
    );
  }
}
console.log('Core boundary verified.');
