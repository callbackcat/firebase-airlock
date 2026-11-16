// Score hide-first with no model and no browser, for quick marker work:
//   node scripts/hidefirst-only.mjs                 summary per development set
//   node scripts/hidefirst-only.mjs --leaks         also list what leaked, by kind
//   OUTSIDE=path/to/outside-dev.json adds the outside development documents
// VITE_FLAGS picks the marker sources. Final sets are not loaded here, on purpose.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { createServer } from 'vite';

const s = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'silent' });
const { hideFirst } = await s.ssrLoadModule('/src/hidefirst.ts');
const { loadWordLists } = await s.ssrLoadModule('/src/wordlists.ts');
const { scoreDoc, summarise } = await s.ssrLoadModule('/src/eval/score.ts');
const stress = await s.ssrLoadModule('/src/eval/stress.ts');
const dev = [
  ...(await s.ssrLoadModule('/src/eval/fixtures.ts')).FIXTURES,
  ...(await s.ssrLoadModule('/src/eval/holdout.ts')).HOLDOUT,
  ...(await s.ssrLoadModule('/src/eval/holdout2.ts')).HOLDOUT2,
  ...(await s.ssrLoadModule('/src/eval/holdout3.ts')).HOLDOUT3,
  ...(await s.ssrLoadModule('/src/eval/holdout4.ts')).HOLDOUT4,
  ...(await s.ssrLoadModule('/src/eval/holdout5.ts')).HOLDOUT5,
  ...(await s.ssrLoadModule('/src/eval/holdout6.ts')).HOLDOUT6,
];
const sets = {
  'dev-all': dev,
  'stress-base': stress.STRESS_BASE,
  'stress-ambiguous': stress.STRESS_AMBIGUOUS,
  'stress-medical': stress.STRESS_MEDICAL,
  'stress-lower': stress.STRESS_LOWER,
  'stress-upper': stress.STRESS_UPPER,
  'stress-messy': stress.STRESS_MESSY,
  'long-dev': (await s.ssrLoadModule('/src/eval/long.ts')).LONG_DEV,
};
if (process.env.OUTSIDE) sets['outside-dev'] = JSON.parse(readFileSync(process.env.OUTSIDE, 'utf8'));
await loadWordLists();

const p = (x) => (x === null ? '  n/a' : `${(x * 100).toFixed(1)}%`.padStart(6));
const leaks = process.argv.includes('--leaks');
for (const [name, set] of Object.entries(sets)) {
  const docs = [];
  const started = performance.now();
  for (const f of set) docs.push(scoreDoc(f, { entities: hideFirst(f.text, true).entities, modelUsed: true }, 0, 0));
  const ms = (performance.now() - started) / set.length;
  const r = summarise(docs);
  const hv = docs.flatMap((d) => d.hiddenValues);
  const pages = docs.reduce((a, d) => a + d.chars / 3500, 0);
  console.log(
    `${name.padEnd(17)} subject ${p(r.subject.recall)} (${r.subject.hidden}/${r.subject.total})  others ${p(r.other.recall)}  kept ${p(r.keep.rate)}  medical ${p(r.medical.rate)}  precision ${p(hv.length ? hv.filter((h) => h.personal).length / hv.length : null)}  hidden/page ${(hv.length / pages).toFixed(1)}  ${ms.toFixed(1)} ms/doc`,
  );
  if (leaks && r.misses.length) {
    const by = new Map();
    for (const m of r.misses) {
      const item = docs.find((d) => d.id === m.doc).items.find((i) => i.value === m.value);
      const key = `${m.kind}${item?.label ? `/${item.label}` : ''} (${m.who})`;
      by.set(key, [...(by.get(key) ?? []), `${m.value}`]);
    }
    for (const [k, v] of [...by].sort((a, b) => b[1].length - a[1].length)) console.log(`    ${String(v.length).padStart(3)}  ${k}: ${v.slice(0, 14).join(' | ').slice(0, 260)}`);
  }
}
await s.close();
