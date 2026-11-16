// Why was a medical term hidden? For every medical useful fact that did not
// survive, name the rule or the model decision behind it.
//   node scripts/trace-medical.mjs "final-design dev-all" "final-design stress-medical"
// Arguments are row names from eval-results/manifest.tsv. Development sets only:
// this prints the terms themselves.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT } from './chrome.mjs';

const manifest = readFileSync(path.join(ROOT, 'eval-results', 'manifest.tsv'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'));

for (const name of process.argv.slice(2)) {
  if (/final-set|final-medical|outside-final|long-clean/.test(name)) throw new Error('Not for final sets.');
  const files = manifest.filter(([n]) => n === name).map(([, f]) => f).slice(-3);
  const causes = new Map();
  let lost = 0;
  let total = 0;
  for (const f of files) {
    const run = JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
    for (const doc of run.docs) {
      const labels = new Map(doc.labels ?? []);
      for (const k of doc.keep) {
        if (!k.medical) continue;
        total++;
        if (k.kept) continue;
        lost++;
        const term = k.value.toLowerCase();
        // The hidden values that sit inside the term, or contain it.
        const hits = Object.entries(doc.sources ?? {}).filter(([v]) => {
          const low = v.toLowerCase();
          return low.length >= 2 && (term.includes(low) || low.includes(term));
        });
        let cause = 'unknown';
        let via = '';
        for (const [value, source] of hits) {
          via = value;
          if (source === 'regex') cause = 'pattern hit';
          else if (source === 'list') cause = doc.blocked?.[value] ? `no-restore rule: ${doc.blocked[value]}` : 'name list (word without a capital)';
          else if (source === 'model') cause = 'model listed it as missed personal data';
          else if (source === 'mark') {
            const label = labels.get(value);
            if (!label) cause = 'marked, model not asked (over the item limit)';
            else if (label === 'MEDICAL' || label === 'ORDINARY') cause = doc.canaryFired ? 'canary discard' : 'labelled restorable but a part stayed hidden';
            else if (label === 'UNSURE') cause = 'model said unsure, or the call failed or timed out';
            else cause = `model labelled it ${label}`;
          }
          if (cause !== 'unknown') break;
        }
        const entry = causes.get(cause) ?? { n: 0, examples: new Set() };
        entry.n++;
        entry.examples.add(`${k.value}${via && via !== k.value ? ` [${via}]` : ''}`);
        causes.set(cause, entry);
      }
    }
  }
  console.log(`\n${name}: ${lost} of ${total} medical terms hidden, over ${files.length} runs`);
  for (const [cause, e] of [...causes].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`  ${String(e.n).padStart(3)}  ${cause}: ${[...e.examples].slice(0, 9).join(' | ').slice(0, 300)}`);
  }
}
