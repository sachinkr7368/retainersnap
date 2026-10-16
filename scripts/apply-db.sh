#!/usr/bin/env bash
# Apply supabase/migrations/0001_init.sql to the linked Supabase project.
# This is the same file production uses. Run it once per project.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:${PATH}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
  echo "Applied 0001_init.sql through DATABASE_URL."
  exit 0
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "Supabase is not logged in." >&2
  echo "Run: supabase login" >&2
  echo "Then: supabase link --project-ref <your project ref>" >&2
  echo "Then: pnpm db:apply" >&2
  exit 1
fi

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "This folder is not linked to a Supabase project." >&2
  echo "Run: supabase link --project-ref <ref from the Supabase dashboard>" >&2
  echo "Then: pnpm db:apply" >&2
  exit 1
fi

supabase db push --yes
echo "Pushed supabase/migrations to the linked project."
