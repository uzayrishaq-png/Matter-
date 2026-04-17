-- Matter Code Vault — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query.

create extension if not exists "pgcrypto";

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  manufacturer text,
  model text,
  manual_code text,
  qr_payload text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_user_id_idx on public.devices(user_id);
create index if not exists devices_updated_at_idx on public.devices(user_id, updated_at desc);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
before update on public.devices
for each row execute function public.set_updated_at();

-- Row-level security: every row belongs to exactly one user.
alter table public.devices enable row level security;

drop policy if exists "devices are visible to owner" on public.devices;
create policy "devices are visible to owner"
  on public.devices for select
  using (auth.uid() = user_id);

drop policy if exists "devices are insertable by owner" on public.devices;
create policy "devices are insertable by owner"
  on public.devices for insert
  with check (auth.uid() = user_id);

drop policy if exists "devices are updatable by owner" on public.devices;
create policy "devices are updatable by owner"
  on public.devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "devices are deletable by owner" on public.devices;
create policy "devices are deletable by owner"
  on public.devices for delete
  using (auth.uid() = user_id);
