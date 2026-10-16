#!/usr/bin/env bash
# Write an env file from the variables already exported in this shell.
# Used by GitHub Actions. Values are quoted. Empty variables are skipped.
set -euo pipefail
target="${1:-.env.production}"
keys=(
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  CRON_SECRET
  RESEND_API_KEY
  RESEND_FROM
  PAGESPEED_API_KEY
  PAYMENT_PROVIDER
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_SOLO_MONTHLY
  STRIPE_PRICE_SOLO_YEARLY
  STRIPE_PRICE_STUDIO_MONTHLY
  STRIPE_PRICE_STUDIO_YEARLY
  DODO_PAYMENTS_API_KEY
  DODO_PAYMENTS_WEBHOOK_KEY
  DODO_PAYMENTS_ENVIRONMENT
  DODO_PRODUCT_SOLO_MONTHLY
  DODO_PRODUCT_SOLO_YEARLY
  DODO_PRODUCT_STUDIO_MONTHLY
  DODO_PRODUCT_STUDIO_YEARLY
)
: > "$target"
for key in "${keys[@]}"; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    continue
  fi
  escaped="${value//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  printf '%s="%s"\n' "$key" "$escaped" >> "$target"
done
echo "Wrote $(wc -l < "$target" | tr -d ' ') values to $target"
