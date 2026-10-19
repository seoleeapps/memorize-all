import { catalog } from '../src/content';
import state from '../release/market-launch-state.json';
const blockers = [...state.blockers];
const pending = catalog.knowledge.filter((k) => k.review !== 'approved');
if (pending.length) blockers.push(`${pending.length} content candidates remain`);
if (!state.deploymentAuthorized) blockers.push('Public deployment has not been authorized');
if (blockers.length) {
  console.error('Release is blocked:\n' + blockers.map((b) => `- ${b}`).join('\n'));
  process.exitCode = 1;
} else
  console.log('Recorded release gates passed. Verify the exact native candidate before upload.');
