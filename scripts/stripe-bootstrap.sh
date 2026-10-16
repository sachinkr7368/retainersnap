#!/usr/bin/env bash
# Create or reuse RetainerSnap prices in the Stripe account the CLI is logged into.
# Test mode is the default. Pass --live only when you are ready to charge.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${HOME}/.local/bin:${PATH}"

mode="test_mode_api_key"
if [[ "${1:-}" == "--live" ]]; then
  mode="live_mode_api_key"
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  STRIPE_SECRET_KEY="$(stripe config --list | sed -n "s/.*${mode} = '\\([^']*\\)'.*/\\1/p" | head -n 1)"
  export STRIPE_SECRET_KEY
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Stripe CLI is not logged in. Run: stripe login" >&2
  exit 1
fi

pnpm exec tsx scripts/stripe-bootstrap.ts "$@"
