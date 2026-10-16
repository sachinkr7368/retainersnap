# Database

`migrations/0001_init.sql` is the schema. Apply it with `pnpm db:apply` after `supabase login` and `supabase link`.

Authenticated clients can SELECT through RLS. Writes go through the service role after the app has checked membership. The signup trigger creates the personal workspace.

`config.toml` is local Supabase config. `.temp` and `.branches` are gitignored. Docker has to be running before `supabase start`.
