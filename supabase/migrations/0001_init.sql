-- Craverly — Supabase schema
-- Run this whole file in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- All statements use IF NOT EXISTS / re-create guards so it's safe to re-run.

-- ---------------------------------------------------------------------------
-- EXTENSION
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text,
  avatar_url text,
  addresses jsonb not null default '[]'::jsonb,
  favorite_restaurant_ids text[] not null default '{}',
  favorite_menu_item_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Keep profiles in sync when a user signs up (email or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- GROUP ORDERING SESSIONS
-- ---------------------------------------------------------------------------
create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  name text not null default 'Craverly group order',
  host_user_id uuid not null default auth.uid(),
  host_name text not null default '',
  restaurant_id text not null,
  restaurant_name text not null,
  status text not null default 'open',             -- open | ordered | closed
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

alter table public.group_sessions enable row level security;

drop policy if exists "group_sessions_select_any" on public.group_sessions;
create policy "group_sessions_select_any" on public.group_sessions
  for select using (true);

drop policy if exists "group_sessions_insert_any" on public.group_sessions;
create policy "group_sessions_insert_any" on public.group_sessions
  for insert with check (true);

drop policy if exists "group_sessions_update_participants" on public.group_sessions;
create policy "group_sessions_update_participants" on public.group_sessions
  for update using (true);

create table if not exists public.group_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.group_sessions (id) on delete cascade,
  user_id uuid not null,
  user_name text not null default '',
  item jsonb not null,
  cost numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.group_session_items enable row level security;

drop policy if exists "group_session_items_select_any" on public.group_session_items;
create policy "group_session_items_select_any" on public.group_session_items
  for select using (true);

drop policy if exists "group_session_items_insert_participant" on public.group_session_items;
create policy "group_session_items_insert_participant" on public.group_session_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "group_session_items_delete_own" on public.group_session_items;
create policy "group_session_items_delete_own" on public.group_session_items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null default auth.uid(),
  restaurant_id text not null default '',
  restaurant_name text not null default '',
  restaurant_image text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  delivery_fee numeric not null default 0,
  packaging_fee numeric not null default 0,
  discount_amount numeric not null default 0,
  coupon_code text,
  total_amount numeric not null default 0,
  delivery_address jsonb,
  payment_method text not null default 'cod',
  status text not null default 'placed',
  status_history jsonb not null default '[]'::jsonb,
  placed_at timestamptz not null default now(),
  estimated_delivery_time timestamptz,
  scheduled_delivery_time timestamptz,
  delivery_partner jsonb,
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_sessions gs
      where gs.host_user_id = orders.user_id
        and gs.restaurant_id = orders.restaurant_id
    )
  );

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own" on public.orders
  for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null,
  menu_item_id text,
  user_id uuid,
  user_name text not null default 'Guest',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  photo_url text,
  helpful_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id or user_id is null);

-- ---------------------------------------------------------------------------
-- REVIEW HELPFUL VOTES
-- ---------------------------------------------------------------------------
create table if not exists public.review_helpful (
  user_id uuid not null default auth.uid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

alter table public.review_helpful enable row level security;

drop policy if exists "review_helpful_select_all" on public.review_helpful;
create policy "review_helpful_select_all" on public.review_helpful
  for select using (true);

drop policy if exists "review_helpful_insert_own" on public.review_helpful;
create policy "review_helpful_insert_own" on public.review_helpful
  for insert with check (auth.uid() = user_id);

drop policy if exists "review_helpful_delete_own" on public.review_helpful;
create policy "review_helpful_delete_own" on public.review_helpful
  for delete using (auth.uid() = user_id);

-- Keep helpful_count in sync without trusting clients.
create or replace function public.recalc_review_helpful()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.reviews
      set helpful_count = helpful_count + 1
      where id = new.review_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.reviews
      set helpful_count = helpful_count - 1
      where id = old.review_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists review_helpful_audit on public.review_helpful;
create trigger review_helpful_audit
  after insert or delete on public.review_helpful
  for each row execute procedure public.recalc_review_helpful();

-- ---------------------------------------------------------------------------
-- STORAGE: review photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "review_photos_select_public" on storage.objects;
create policy "review_photos_select_public" on storage.objects
  for select using (bucket_id = 'review-photos');

drop policy if exists "review_photos_insert_auth" on storage.objects;
create policy "review_photos_insert_auth" on storage.objects
  for insert with check (bucket_id = 'review-photos' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- REALTIME (enable Postgres changes for these tables)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.group_session_items;