// Score the fixed patterns and the review marks alone, with no model and no
// browser: node scripts/patterns-only.mjs
import { createServer } from 'vite';

const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const { detect } = await s.ssrLoadModule('/src/airlock.ts');
const { scoreDoc, summarise } = await s.ssrLoadModule('/src/eval/score.ts');
const sets = {
  tuning: (await s.ssrLoadModule('/src/eval/fixtures.ts')).FIXTURES,
  holdout: (await s.ssrLoadModule('/src/eval/holdout.ts')).HOLDOUT,
  holdout2: (await s.ssrLoadModule('/src/eval/holdout2.ts')).HOLDOUT2,
  holdout3: (await s.ssrLoadModule('/src/eval/holdout3.ts')).HOLDOUT3,
  holdout4: (await s.ssrLoadModule('/src/eval/holdout4.ts')).HOLDOUT4,
};
const p = (x) => `${(x * 100).toFixed(1)}%`;
for (const [name, set] of Object.entries(sets)) {
  const docs = [];
  for (const f of set) docs.push(scoreDoc(f, await detect(f.text), 0, 0));
  const r = summarise(docs);
  console.log(
    `${name.padEnd(9)} subject ${p(r.subject.recall)} hidden, ${p(r.subject.reviewRecall)} hidden or flagged | others ${p(r.other.recall)}, ${p(r.other.reviewRecall)} | kept ${p(r.keep.rate)} | ${r.suspects.perLetter.toFixed(1)} marks/letter`,
  );
  const un = r.misses.filter((m) => !m.flagged).map((m) => m.value);
  if (un.length) console.log('   unflagged:', un.join(' | '));
  console.log('   missed:', r.misses.map((m) => m.value).join(' | ') || 'none');
  if (r.overRedacted.length) console.log('   hidden by mistake:', r.overRedacted.map((m) => m.value).join(' | '));
}
await s.close();
