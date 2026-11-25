#!/usr/bin/env bash
set -euo pipefail

# Outputs remain false unless the push actually succeeds. The Pages job must
# never run for absent/unchanged data, a failed collection, or a failed push.
echo 'pushed=false' >> "$GITHUB_OUTPUT"
report() {
  echo "Data publication: $1"
  printf '\n### Data publication\n\n%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"
}
trap 'report "COMMIT_OR_PUSH_ERROR"' ERR

if [[ "$GITHUB_REF_NAME" != main ]]; then
  report 'BLOCKED_NON_MAIN'
  exit 1
fi
if [[ ! -d ops/data ]]; then
  report 'NO_DATA_CHANGES (data directory absent)'
  exit 0
fi
git add -- ops/data
if git diff --cached --quiet -- ops/data; then
  report 'NO_DATA_CHANGES'
  exit 0
fi
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git commit --only -m 'Update operations data' -- ops/data
for attempt in 1 2 3; do
  if git pull --rebase origin "$GITHUB_REF_NAME" && git push origin "HEAD:$GITHUB_REF_NAME"; then
    echo 'pushed=true' >> "$GITHUB_OUTPUT"
    report 'DATA_PUSHED (Pages deployment still pending)'
    exit 0
  fi
  # A conflicted rebase must be cleared before another pull (or final exit).
  if [[ -d "$(git rev-parse --git-path rebase-merge)" || -d "$(git rev-parse --git-path rebase-apply)" ]]; then
    if ! git rebase --abort; then
      report 'REBASE_ABORT_ERROR'
      exit 1
    fi
  fi
  if [[ "$attempt" -lt 3 ]]; then sleep $((attempt * 5)); fi
done
report 'COMMIT_OR_PUSH_ERROR'
exit 1
