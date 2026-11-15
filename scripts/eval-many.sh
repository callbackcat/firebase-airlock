#!/usr/bin/env bash
# Run the benchmark N times (default 3) and summarise: RUNS=5 EVAL_SET=holdout bash scripts/eval-many.sh
N=${RUNS:-3}
for i in $(seq 1 "$N"); do
  npm run eval 2>&1 | grep -E "FAIL:|PASS:|MARGINAL:|NO-MODEL|Harness|Error|pass failed" | cut -c1-160
done
node scripts/summarise-runs.mjs "$N"
