#!/usr/bin/env bash
# Run the benchmark three times and print the headline numbers of each run.
for i in 1 2 3; do
  echo "=== run $i"
  npm run eval 2>&1 | grep -E "availability|FAIL:|PASS:|MARGINAL:|NO-MODEL|Staff /|│ (ADDRESS|ID_NUMBER|OTHER|PERSON|Everything)|Useful facts kept:|Model spans|Median|Harness|^  [a-z-]+ +[A-Z_]+ +(subject|other)" | cut -c1-160
done
