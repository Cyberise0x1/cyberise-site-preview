#!/usr/bin/env bash
# =============================================================================
# clean-git-history.sh
# Rewrites git history to remove exposed secrets, then force-pushes to origin.
#
# Secrets scrubbed:
#   - Stripe live secret key (REDACTED_STRIPE_SK...)
#   - Vercel PAT v1 (REDACTED_VERCEL_PAT...)
#   - Vercel PAT v2 (REDACTED_VERCEL_PAT...)
#
# Usage:
#   chmod +x scripts/clean-git-history.sh
#   ./scripts/clean-git-history.sh
#
# After running:
#   1. Rotate your Stripe key at https://dashboard.stripe.com/apikeys
#   2. Rotate your Vercel token at https://vercel.com/account/tokens
#   3. Update VERCEL_TOKEN in your Replit Secrets with the new value
# =============================================================================

set -euo pipefail

STRIPE_KEY="REDACTED_STRIPE_SK"
VERCEL_PAT_1="REDACTED_VERCEL_PAT"
VERCEL_PAT_2="REDACTED_VERCEL_PAT"

echo "=== Step 1: Verifying secrets exist in history ==="
COUNT=$(git log --all -p 2>/dev/null | grep -cE "(REDACTED_STRIPE_SK|REDACTED_VERCEL_PAT|REDACTED_VERCEL_PAT)" || true)
echo "Found $COUNT secret occurrence(s) in git history."
if [ "$COUNT" -eq 0 ]; then
  echo "No secrets found — history already clean. Exiting."
  exit 0
fi

echo ""
echo "=== Step 2: Rewriting history (this may take a minute) ==="
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --tree-filter "
  find . -type f \
    -not -path './.git/*' \
    -not -path './node_modules/*' \
    -not -path './.cache/*' \
    -exec sed -i \
      -e 's|${STRIPE_KEY}|REDACTED_STRIPE_SK|g' \
      -e 's|${VERCEL_PAT_1}|REDACTED_VERCEL_PAT_1|g' \
      -e 's|${VERCEL_PAT_2}|REDACTED_VERCEL_PAT_2|g' \
    {} \;
" --tag-name-filter cat -- --all

echo ""
echo "=== Step 3: Verifying secrets are gone ==="
REMAINING=$(git log --all -p 2>/dev/null | grep -cE "(REDACTED_STRIPE_SK|REDACTED_VERCEL_PAT|REDACTED_VERCEL_PAT)" || true)
if [ "$REMAINING" -gt 0 ]; then
  echo "ERROR: $REMAINING secret occurrence(s) still found! Do NOT push."
  exit 1
fi
echo "All secrets removed from history."

echo ""
echo "=== Step 4: Removing filter-branch backup refs ==="
git for-each-ref --format="%(refname)" refs/original/ | xargs -I{} git update-ref -d {} 2>/dev/null || true
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "=== Step 5: Force-pushing clean history to origin ==="
git push --force-with-lease origin main

echo ""
echo "=== Done! ==="
echo "New HEAD: $(git rev-parse HEAD)"
echo ""
echo "IMPORTANT — rotate these credentials immediately if not already done:"
echo "  • Stripe: https://dashboard.stripe.com/apikeys"
echo "  • Vercel: https://vercel.com/account/tokens"
echo "  • Update VERCEL_TOKEN in Replit Secrets with the new value"
