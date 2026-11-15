// Summarise the last N benchmark reports in eval-results/:
//   node scripts/summarise-runs.mjs 3            the usual text summary
//   node scripts/summarise-runs.mjs 3 --row NAME one table row, appended to eval-results/table.md
//
// Rates within a run get a Wilson 95% interval. Recall and precision also get
// a bootstrap over documents (1,000 resamples). Repeat runs share the same
// items, so they are reported as a range and never pooled.
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './chrome.mjs';

const n = Number(process.argv[2] ?? 3);
const rowAt = process.argv.indexOf('--row');
const rowName = rowAt > 0 ? process.argv[rowAt + 1] : '';
const dir = path.join(ROOT, 'eval-results');
const files = readdirSync(dir)
  .filter((f) => /^\d{4}-.*\.json$/.test(f))
  .sort()
  .slice(-n);
const runs = files.map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')));
const pct = (x) => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : `${(x * 100).toFixed(1)}%`);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const stat = (xs) => (xs.some((x) => x === null) ? 'n/a' : `${pct(mean(xs))} (${pct(Math.min(...xs))} to ${pct(Math.max(...xs))})`);

/** Wilson 95% interval for k successes in n trials. */
function wilson(k, total) {
  if (!total) return [null, null];
  const z = 1.96;
  const p = k / total;
  const d = 1 + (z * z) / total;
  const c = p + (z * z) / (2 * total);
  const w = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return [(c - w) / d, (c + w) / d];
}

/** Seeded random numbers, so a bootstrap gives the same interval twice. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Bootstrap over documents: resample documents, recompute the rate. */
function bootstrap(docs, count) {
  const rand = rng(12345);
  const rates = [];
  for (let i = 0; i < 1000; i++) {
    let k = 0;
    let total = 0;
    for (let j = 0; j < docs.length; j++) {
      const [dk, dt] = count(docs[Math.floor(rand() * docs.length)]);
      k += dk;
      total += dt;
    }
    if (total) rates.push(k / total);
  }
  rates.sort((a, b) => a - b);
  return rates.length ? [rates[Math.floor(rates.length * 0.025)], rates[Math.floor(rates.length * 0.975)]] : [null, null];
}

const subjectOf = (d) => d.items.filter((i) => i.who !== 'other');
const otherOf = (d) => d.items.filter((i) => i.who === 'other');
const hid = (items) => [items.filter((i) => i.hidden).length, items.length];

function measures(r) {
  const docs = r.docs;
  const sum = (f) => docs.reduce((a, d) => a + f(d), 0);
  const [sk, st] = hid(docs.flatMap(subjectOf));
  const [ok, ot] = hid(docs.flatMap(otherOf));
  const hv = docs.flatMap((d) => d.hiddenValues ?? []);
  const keep = docs.flatMap((d) => d.keep);
  const med = keep.filter((k) => k.medical);
  const high = keep.filter((k) => k.high);
  const quasi = docs.flatMap((d) => d.quasi ?? []);
  const missed = docs.flatMap((d) => d.items.filter((i) => !i.hidden));
  const pages = sum((d) => (d.chars ?? 0) / 3500) || docs.length;
  return {
    subject: st ? sk / st : null,
    subjectN: st,
    subjectWilson: wilson(sk, st),
    subjectBoot: bootstrap(docs, (d) => hid(subjectOf(d))),
    other: ot ? ok / ot : null,
    otherN: ot,
    otherWilson: wilson(ok, ot),
    precision: hv.length ? hv.filter((h) => h.personal).length / hv.length : null,
    precisionBoot: bootstrap(docs, (d) => [(d.hiddenValues ?? []).filter((h) => h.personal).length, (d.hiddenValues ?? []).length]),
    precisionQuasi: hv.length ? hv.filter((h) => h.personal || h.quasi).length / hv.length : null,
    hiddenN: hv.length,
    keep: keep.length ? keep.filter((k) => k.kept).length / keep.length : null,
    keepN: keep.length,
    medical: med.length ? med.filter((k) => k.kept).length / med.length : null,
    medicalN: med.length,
    medicalHigh: high.length ? high.filter((k) => k.kept).length / high.length : null,
    medicalHighN: high.length,
    docsWithHighLoss: docs.filter((d) => d.keep.some((k) => k.high && !k.kept)).length,
    quasiReadablePerDoc: quasi.length ? quasi.filter((q) => q.readable).length / docs.length : null,
    quasiN: quasi.length,
    marksPerPage: sum((d) => d.suspects) / pages,
    clicks: missed.filter((m) => m.flagged).length,
    unreachable: missed.filter((m) => !m.flagged).length,
    safeMs: median(docs.map((d) => d.safeMs ?? d.ms)),
    doneMs: median(docs.map((d) => d.ms)),
    calls: r.summary.calls ?? 0,
    verdict: r.verdict.level,
  };
}

const ms = runs.map(measures);
const first = ms[0];
const iv = ([lo, hi]) => `${pct(lo)} to ${pct(hi)}`;

// Run-to-run consistency: the share of labelled items with the same decision in every run.
const decisions = new Map();
for (const r of runs) {
  for (const d of r.docs) {
    for (const i of d.items) {
      const key = `${d.id}|${i.kind}|${i.value}`;
      decisions.set(key, [...(decisions.get(key) ?? []), i.hidden]);
    }
  }
}
const full = [...decisions.values()].filter((v) => v.length === runs.length);
const consistent = full.length ? full.filter((v) => v.every((x) => x === v[0])).length / full.length : null;

if (rowName) {
  const cell = (f) => stat(ms.map(f));
  const row = `| ${rowName} | ${runs.length} | ${cell((m) => m.subject)} | ${iv(first.subjectWilson)} | ${cell((m) => m.other)} | ${cell((m) => m.precision)} | ${cell((m) => m.keep)} | ${cell((m) => m.medical)} | ${ms.map((m) => m.docsWithHighLoss).join('/')} | ${first.quasiReadablePerDoc === null ? 'n/a' : mean(ms.map((m) => m.quasiReadablePerDoc)).toFixed(1)} | ${pct(consistent)} | ${median(ms.map((m) => m.safeMs))} | ${median(ms.map((m) => m.doneMs))} | ${mean(ms.map((m) => m.marksPerPage)).toFixed(1)} | ${mean(ms.map((m) => m.clicks)).toFixed(1)}+${mean(ms.map((m) => m.unreachable)).toFixed(1)} |\n`;
  appendFileSync(path.join(dir, 'table.md'), row);
  process.stdout.write(row);
  process.exit(0);
}

console.log(`\n${runs.length} runs, ${runs[0].docs.length} documents`);
console.log(`Subject hidden      ${stat(ms.map((m) => m.subject))}  n=${first.subjectN}  Wilson (run 1) ${iv(first.subjectWilson)}  bootstrap ${iv(first.subjectBoot)}`);
console.log(`Others hidden       ${stat(ms.map((m) => m.other))}  n=${first.otherN}  Wilson (run 1) ${iv(first.otherWilson)}`);
console.log(`Precision           ${stat(ms.map((m) => m.precision))}  of ${first.hiddenN} hidden values; bootstrap ${iv(first.precisionBoot)}; counting quasi-identifiers as right: ${stat(ms.map((m) => m.precisionQuasi))}`);
console.log(`Useful facts kept   ${stat(ms.map((m) => m.keep))}  n=${first.keepN}`);
if (first.medicalN) console.log(`Medical terms kept  ${stat(ms.map((m) => m.medical))}  n=${first.medicalN}` + (first.medicalHighN ? `; high severity ${stat(ms.map((m) => m.medicalHigh))} n=${first.medicalHighN}; documents losing one: ${ms.map((m) => m.docsWithHighLoss).join(', ')} of ${runs[0].docs.length}` : ''));
if (first.quasiN) console.log(`Quasi-identifiers readable per document  ${ms.map((m) => m.quasiReadablePerDoc.toFixed(1)).join(', ')}  (${first.quasiN} labelled)`);
console.log(`Same decision in every run  ${pct(consistent)}  of ${full.length} items`);
console.log(`Safe after (ms, median)     ${ms.map((m) => m.safeMs).join(', ')}`);
console.log(`Model done (ms, median)     ${ms.map((m) => m.doneMs).join(', ')}`);
console.log(`On-device calls             ${ms.map((m) => m.calls).join(', ')}`);
console.log(`Underlines per page         ${ms.map((m) => m.marksPerPage.toFixed(1)).join(', ')}`);
console.log(`Clicks to hide the rest     ${ms.map((m) => m.clicks).join(', ')}  (underlined); not underlined: ${ms.map((m) => m.unreachable).join(', ')}`);
console.log(`Verdicts                    ${ms.map((m) => m.verdict).join(', ')}`);
if (runs[0].docs.length <= 6) {
  for (const d of runs[0].docs) {
    console.log(`  ${d.id.padEnd(28)} ms ${runs.map((r) => r.docs.find((x) => x.id === d.id).ms).join(', ')}  calls ${runs.map((r) => r.docs.find((x) => x.id === d.id).calls).join(', ')}`);
  }
}
if (process.argv.includes('--quiet')) process.exit(0);

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
