-- Run this in your Supabase SQL editor

-- Profiles (auto-created via trigger on auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Recipes
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  prep_time int,
  cook_time int,
  servings int not null default 4,
  photo_url text,
  source_url text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Grocery lists
create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null default 'My Grocery List',
  items jsonb not null default '[]'::jsonb,
  recipe_ids uuid[] not null default '{}',
  created_at timestamptz default now() not null
);

-- RLS
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.grocery_lists enable row level security;

create policy "Users manage own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users manage own recipes"
  on public.recipes for all using (auth.uid() = user_id);

create policy "Users manage own grocery lists"
  on public.grocery_lists for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for recipe photos
-- Run this separately or via Supabase dashboard:
-- insert into storage.buckets (id, name, public) values ('recipe-photos', 'recipe-photos', true);
-- create policy "Users upload own photos" on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Public read photos" on storage.objects for select using (bucket_id = 'recipe-photos');
