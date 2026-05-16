#!/usr/bin/env bash
# =============================================================================
# clean-git-history.sh
#
# Rewrites git history to remove all Stripe secret keys and Vercel PATs that
# were accidentally committed, then force-pushes clean history to origin.
#
# This script uses PATTERN-BASED replacement — it never hardcodes the actual
# secret values. Run this locally (file is gitignored after first use).
#
# Requirements: GNU coreutils (grep -P, sed -i -E, find).
#   Linux/Replit: works as-is.
#   macOS: install GNU tools first:
#     brew install gnu-sed findutils grep
#     export PATH="$(brew --prefix)/opt/gnu-sed/libexec/gnubin:$PATH"
#
# Note: this script is gitignored but still tracked in the repo index.
# After running, optionally untrack it with:
#   git rm --cached scripts/clean-git-history.sh && git push origin main
#
# Usage:
#   chmod +x scripts/clean-git-history.sh
#   ./scripts/clean-git-history.sh
#
# After running, rotate credentials:
#   Stripe: https://dashboard.stripe.com/apikeys
#   Vercel: https://vercel.com/account/tokens
# =============================================================================

set -euo pipefail

STRIPE_PATTERN='REDACTED_STRIPE_SK[A-Za-z0-9_]*'
VERCEL_PATTERN='REDACTED_VERCEL_PAT[A-Za-z0-9]*'

echo "=== Step 1: Checking for secrets in history ==="
STRIPE_COUNT=$(git log --all -p 2>/dev/null | grep -cP 'REDACTED_STRIPE_SK[A-Za-z0-9_]{10,}' || true)
VERCEL_COUNT=$(git log --all -p 2>/dev/null | grep -cP 'REDACTED_VERCEL_PAT[A-Za-z0-9]{10,}' || true)
echo "  Stripe key occurrences : $STRIPE_COUNT"
echo "  Vercel PAT occurrences : $VERCEL_COUNT"

TOTAL=$((STRIPE_COUNT + VERCEL_COUNT))
if [ "$TOTAL" -eq 0 ]; then
  echo "No secrets found — history already clean."
  exit 0
fi

echo ""
echo "=== Step 2: Rewriting history (may take a minute for ~47 commits) ==="
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --tree-filter "
  find . -type f \
    -not -path './.git/*' \
    -not -path './node_modules/*' \
    -not -path './.cache/*' \
    -exec sed -i -E \
      -e 's/${STRIPE_PATTERN}/REDACTED_STRIPE_SK/g' \
      -e 's/${VERCEL_PATTERN}/REDACTED_VERCEL_PAT/g' \
    {} + 2>/dev/null || true
" --tag-name-filter cat -- --all
echo "  filter-branch complete."

echo ""
echo "=== Step 3: Verifying — scanning for remaining complete tokens ==="
REMAINING_STRIPE=$(git log --all -p 2>/dev/null | grep -cP 'REDACTED_STRIPE_SK[A-Za-z0-9_]{10,}' || true)
REMAINING_VERCEL=$(git log --all -p 2>/dev/null | grep -cP 'REDACTED_VERCEL_PAT[A-Za-z0-9]{10,}' || true)
REMAINING=$((REMAINING_STRIPE + REMAINING_VERCEL))

if [ "$REMAINING" -gt 0 ]; then
  echo "ERROR: $REMAINING complete token(s) still found in history. Do NOT push."
  echo "  Stripe: $REMAINING_STRIPE  |  Vercel: $REMAINING_VERCEL"
  exit 1
fi
echo "  All complete secret tokens removed."

echo ""
echo "=== Step 4: Cleaning up filter-branch backup refs ==="
git for-each-ref --format="%(refname)" refs/original/ \
  | xargs -I{} git update-ref -d {} 2>/dev/null || true
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo "  Cleanup done."

echo ""
echo "=== Step 5: Force-pushing clean history to origin/main ==="
git push --force-with-lease origin main
echo "  Push successful."

echo ""
echo "================================================================"
echo " Done! New HEAD: $(git rev-parse HEAD)"
echo "================================================================"
echo ""
echo " ACTION REQUIRED — rotate these credentials immediately:"
echo "   Stripe  -> https://dashboard.stripe.com/apikeys"
echo "   Vercel  -> https://vercel.com/account/tokens"
echo "   Then update VERCEL_TOKEN in Replit Secrets with the new value."
echo "================================================================"
