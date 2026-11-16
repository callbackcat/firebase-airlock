#!/usr/bin/env bash
# Run several arms on several sets, three runs each, and append one table row per
# pair to eval-results/table.md:
#   ARMS="a0 a3" SETS="dev-all outside-dev" bash scripts/eval-arms.sh
# TAG names the rows (default: the arm). Extra VITE_ variables pass through.
N=${RUNS:-3}
for set in $SETS; do
  for arm in $ARMS; do
    name="${TAG:-$arm} $set"
    for i in $(seq 1 "$N"); do
      VITE_ARM=$arm EVAL_SET=$set npm run eval 2>&1 | grep -E "Harness|pass failed|call failed" | cut -c1-160
    done
    node scripts/summarise-runs.mjs "$N" --row "$name" > /dev/null
    ls -t eval-results/2026-*.json | head -"$N" | sed "s|^|$name\t|" >> eval-results/manifest.tsv
  done
done
