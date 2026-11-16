#!/usr/bin/env bash
# Run several arms on several sets, three runs each, and append one table row per
# pair to the results folder's table.md:
#   ARMS="a0 a3" SETS="dev-all outside-dev" bash scripts/eval-arms.sh
# TAG names the rows (default: the arm). Extra VITE_ variables pass through.
# EVAL_OUT picks the results folder, so two browsers can run side by side
# without mixing files. A second browser also needs its own CHROME_PROFILE,
# CHROME_DEBUG_PORT and PORT.
N=${RUNS:-3}
OUT=${EVAL_OUT:-eval-results}
mkdir -p "$OUT"
for set in $SETS; do
  for arm in $ARMS; do
    name="${TAG:-$arm} $set"
    for i in $(seq 1 "$N"); do
      VITE_ARM=$arm EVAL_SET=$set npm run eval 2>&1 | grep -E "Harness|pass failed|call failed" | cut -c1-160
    done
    node scripts/summarise-runs.mjs "$N" --row "$name" > /dev/null
    ls -t "$OUT"/2026-*.json | head -"$N" | sed "s|^|$name\t|" >> "$OUT"/manifest.tsv
  done
done
