// Summarise runs on the Text Anonymization Benchmark sets, at entity level:
//   node scripts/summarise-tab.mjs "tab tab-test100"
// The argument is a row name from eval-results/manifest.tsv. Prints counts and
// rates only. No name, code or other text from the dataset is printed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT } from './chrome.mjs';

const name = process.argv[2];
const files = readFileSync(path.join(ROOT, 'eval-results', 'manifest.tsv'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
  .filter(([n]) => n === name)
  .map(([, f]) => f);
const pct = (k, n) => (n ? `${((100 * k) / n).toFixed(1)}%` : 'n/a');
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

function wilson(k, n) {
  if (!n) return 'n/a';
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const w = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return `${(((c - w) / d) * 100).toFixed(1)} to ${(((c + w) / d) * 100).toFixed(1)}`;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function bootstrap(perDoc) {
  const rand = rng(12345);
  const rates = [];
  for (let i = 0; i < 1000; i++) {
    let k = 0;
    let n = 0;
    for (let j = 0; j < perDoc.length; j++) {
      const [dk, dn] = perDoc[Math.floor(rand() * perDoc.length)];
      k += dk;
      n += dn;
    }
    if (n) rates.push(k / n);
  }
  rates.sort((a, b) => a - b);
  return `${(rates[25] * 100).toFixed(1)} to ${(rates[975] * 100).toFixed(1)}`;
}

/** An entity is hidden only when every written form of it is hidden. */
function entities(doc) {
  const byEntity = new Map();
  for (const i of doc.items) {
    const e = byEntity.get(i.entity) ?? { type: i.label, hidden: true, flagged: true };
    if (!i.hidden) {
      e.hidden = false;
      if (!i.flagged) e.flagged = false;
    }
    byEntity.set(i.entity, e);
  }
  return [...byEntity.values()];
}

console.log(`${name}: ${files.length} runs`);
for (const f of files) {
  const run = JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
  const perDoc = run.docs.map((d) => entities(d));
  const all = perDoc.flat();
  const hidden = all.filter((e) => e.hidden).length;
  const byType = {};
  for (const e of all) {
    const t = (byType[e.type] ??= [0, 0]);
    t[1]++;
    if (e.hidden) t[0]++;
  }
  const hv = run.docs.flatMap((d) => d.hiddenValues ?? []);
  const personal = hv.filter((h) => h.personal).length;
  const quasiHit = hv.filter((h) => h.quasi).length;
  const quasi = run.docs.flatMap((d) => d.quasi ?? []);
  const keep = run.docs.flatMap((d) => d.keep);
  console.log(
    [
      `  documents ${run.docs.length}`,
      `direct entities hidden ${hidden}/${all.length} = ${pct(hidden, all.length)} (Wilson ${wilson(hidden, all.length)}; bootstrap ${bootstrap(perDoc.map((es) => [es.filter((e) => e.hidden).length, es.length]))})`,
      `by type ${Object.entries(byType).map(([t, [k, n]]) => `${t} ${k}/${n}`).join(', ')}`,
      `leaked entities not underlined ${all.filter((e) => !e.hidden && !e.flagged).length}`,
      `quasi-identifiers readable per document ${(quasi.filter((q) => q.readable).length / run.docs.length).toFixed(1)} of ${(quasi.length / run.docs.length).toFixed(1)} (${pct(quasi.filter((q) => q.readable).length, quasi.length)} readable)`,
      `NO_MASK spans hidden ${keep.filter((k) => !k.kept).length}/${keep.length} = ${pct(keep.filter((k) => !k.kept).length, keep.length)}`,
      `precision: direct ${pct(personal, hv.length)}, direct or quasi ${pct(personal + quasiHit, hv.length)} of ${hv.length} hidden values`,
      `safe after ${median(run.docs.map((d) => d.safeMs ?? 0))} ms median, ${Math.max(...run.docs.map((d) => d.safeMs ?? 0))} max`,
      `model done ${median(run.docs.map((d) => d.ms))} ms median, ${Math.max(...run.docs.map((d) => d.ms))} max`,
      `calls ${run.docs.reduce((a, d) => a + (d.calls ?? 0), 0)}, canary discards ${run.canaries?.fired ?? '?'}, protected restored ${run.docs.reduce((a, d) => a + (d.restoredProtected ?? 0), 0)}`,
    ].join('\n    '),
  );
}
