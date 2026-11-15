// Summarise the last N benchmark reports in eval-results/: node scripts/summarise-runs.mjs 3
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './chrome.mjs';

const n = Number(process.argv[2] ?? 3);
const dir = path.join(ROOT, 'eval-results');
const files = readdirSync(dir)
  .filter((f) => /^\d{4}-.*\.json$/.test(f))
  .sort()
  .slice(-n);
const runs = files.map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')));
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const stat = (xs) =>
  `${pct(xs.reduce((a, b) => a + b, 0) / xs.length)} (${pct(Math.min(...xs))} to ${pct(Math.max(...xs))})`;

console.log(`\n${runs.length} runs, ${runs[0].docs.length} letters`);
console.log('Subject hidden   ', stat(runs.map((r) => r.summary.subject.recall)));
console.log('Others hidden    ', stat(runs.map((r) => r.summary.other.recall)));
console.log('Subject hidden or flagged', stat(runs.map((r) => r.summary.subject.reviewRecall)));
console.log('Others hidden or flagged ', stat(runs.map((r) => r.summary.other.reviewRecall)));
console.log('Review marks/letter', runs.map((r) => r.summary.suspects.perLetter.toFixed(1)).join(', '), ' per 100 words', runs.map((r) => r.summary.suspects.per100Words.toFixed(1)).join(', '));
console.log('Useful facts kept', stat(runs.map((r) => r.summary.keep.rate)));
if (runs[0].summary.medical?.total) console.log('Medical terms kept', stat(runs.map((r) => r.summary.medical.rate)), ` (${runs[0].summary.medical.total} terms)`);
console.log('On-device calls  ', runs.map((r) => r.summary.calls ?? '?').join(', '));
if (runs[0].docs.length <= 4) for (const d of runs[0].docs) console.log(`  ${d.id.padEnd(28)} ms ${runs.map((r) => r.docs.find((x) => x.id === d.id).ms).join(', ')}  calls ${runs.map((r) => r.docs.find((x) => x.id === d.id).calls).join(', ')}`);
console.log('Median ms/letter ', runs.map((r) => r.summary.medianMs).join(', '));
console.log('Verdicts         ', runs.map((r) => r.verdict.level).join(', '));

const count = (items) => {
  const m = new Map();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m]
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => `  ${c}/${runs.length}  ${k}`)
    .join('\n');
};
console.log('\nMisses (runs missed / runs):');
console.log(
  count(
    runs.flatMap((r) =>
      r.summary.misses.map(
        (m) => `${m.doc.padEnd(18)} ${m.kind.padEnd(10)} ${(m.who ?? '').padEnd(8)} ${m.flagged ? 'flagged  ' : 'UNFLAGGED'} ${m.value}`,
      ),
    ),
  ) || '  none',
);
console.log('\nUseful facts hidden by mistake:');
console.log(count(runs.flatMap((r) => r.summary.overRedacted.map((o) => `${o.doc.padEnd(18)} ${o.value}`))) || '  none');
