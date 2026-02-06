-- ============================================
-- Akilo Supabase Schema (MVP)
-- ============================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1) PROFILES TABLE
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age int check (age > 0),
  height_cm int check (height_cm > 0),
  weight_kg numeric(5,2) check (weight_kg > 0),
  activity_level text not null check (activity_level in ('low', 'medium', 'high')),
  goal_type text not null check (goal_type in ('maintain', 'fat_loss', 'muscle_gain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2) DAILY TARGETS TABLE (Editable)
-- ============================================
create table if not exists public.daily_targets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calories_target int not null check (calories_target > 0),
  protein_target_g int not null check (protein_target_g >= 0),
  carbs_target_g int not null check (carbs_target_g >= 0),
  fats_target_g int not null check (fats_target_g >= 0),
  water_target_ml int not null check (water_target_ml >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_daily_targets_user_id on public.daily_targets(user_id);

-- ============================================
-- 3) FOODS MASTER (Global Food DB)
-- ============================================
create table if not exists public.foods_master (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  unit_type text not null check (unit_type in ('g', 'ml', 'serving')),
  base_qty numeric(10,2) not null check (base_qty > 0),

  calories numeric(10,2) not null check (calories >= 0),
  protein_g numeric(10,2) not null check (protein_g >= 0),
  carbs_g numeric(10,2) not null check (carbs_g >= 0),
  fats_g numeric(10,2) not null check (fats_g >= 0),

  created_at timestamptz not null default now()
);

create index if not exists idx_foods_master_name on public.foods_master using gin (to_tsvector('english', name));

-- ============================================
-- 4) FOODS CUSTOM (User-Created Foods)
-- ============================================
create table if not exists public.foods_custom (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit_type text not null check (unit_type in ('g', 'ml', 'serving')),
  base_qty numeric(10,2) not null check (base_qty > 0),

  calories numeric(10,2) not null check (calories >= 0),
  protein_g numeric(10,2) not null check (protein_g >= 0),
  carbs_g numeric(10,2) not null check (carbs_g >= 0),
  fats_g numeric(10,2) not null check (fats_g >= 0),

  created_at timestamptz not null default now()
);

create index if not exists idx_foods_custom_user_id on public.foods_custom(user_id);
create index if not exists idx_foods_custom_name on public.foods_custom using gin (to_tsvector('english', name));

-- ============================================
-- 5) FOOD LOGS (Daily Consumption)
-- ============================================
create table if not exists public.food_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snacks', 'dinner')),

  food_source text not null check (food_source in ('master', 'custom', 'manual')),
  food_master_id uuid references public.foods_master(id) on delete set null,
  food_custom_id uuid references public.foods_custom(id) on delete set null,

  food_name text not null,
  qty numeric(10,2) not null check (qty > 0),

  calories numeric(10,2) not null check (calories >= 0),
  protein_g numeric(10,2) not null check (protein_g >= 0),
  carbs_g numeric(10,2) not null check (carbs_g >= 0),
  fats_g numeric(10,2) not null check (fats_g >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_food_logs_user_date on public.food_logs(user_id, date);
create index if not exists idx_food_logs_meal_type on public.food_logs(meal_type);

-- ============================================
-- 6) WATER LOGS
-- ============================================
create table if not exists public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount_ml int not null check (amount_ml > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_water_logs_user_date on public.water_logs(user_id, date);

-- ============================================
-- 7) WEIGHT LOGS
-- ============================================
create table if not exists public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create index if not exists idx_weight_logs_user_date on public.weight_logs(user_id, date);

-- ============================================
-- 8) FAVORITES
-- ============================================
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_master_id uuid references public.foods_master(id) on delete cascade,
  food_custom_id uuid references public.foods_custom(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- ensure at least one of master/custom is present
  constraint favorites_one_source check (
    (food_master_id is not null and food_custom_id is null)
    or
    (food_master_id is null and food_custom_id is not null)
  )
);

create index if not exists idx_favorites_user_id on public.favorites(user_id);

-- ============================================
-- 9) STREAKS
-- ============================================
create table if not exists public.streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_streak int not null default 0 check (current_streak >= 0),
  best_streak int not null default 0 check (best_streak >= 0),
  last_completed_date date,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_streaks_user_id on public.streaks(user_id);

-- ============================================
-- (Optional) UPDATED_AT trigger for profiles / logs / targets
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_targets_updated on public.daily_targets;
create trigger trg_daily_targets_updated
before update on public.daily_targets
for each row execute function public.set_updated_at();

drop trigger if exists trg_food_logs_updated on public.food_logs;
create trigger trg_food_logs_updated
before update on public.food_logs
for each row execute function public.set_updated_at();

-- ============================================
-- Done ✅
-- ============================================

-- ============================================
--  RLS Policies (MVP)
-- ============================================

-- ✅ Turn ON RLS for all user tables
alter table public.profiles enable row level security;
alter table public.daily_targets enable row level security;
alter table public.foods_master enable row level security;
alter table public.foods_custom enable row level security;
alter table public.food_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.favorites enable row level security;
alter table public.streaks enable row level security;

-- ============================================
-- 1) PROFILES
-- ============================================

-- Users can read their profile
create policy "Profiles: select own"
on public.profiles
for select
using (auth.uid() = id);

-- Users can insert their own profile
create policy "Profiles: insert own"
on public.profiles
for insert
with check (auth.uid() = id);

-- Users can update their own profile
create policy "Profiles: update own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================
-- 2) DAILY TARGETS
-- ============================================

create policy "Daily targets: select own"
on public.daily_targets
for select
using (auth.uid() = user_id);

create policy "Daily targets: insert own"
on public.daily_targets
for insert
with check (auth.uid() = user_id);

create policy "Daily targets: update own"
on public.daily_targets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Daily targets: delete own"
on public.daily_targets
for delete
using (auth.uid() = user_id);

-- ============================================
-- 3) FOODS MASTER (Public Read-Only)
-- ============================================

-- Anyone logged in can read foods_master
create policy "Foods master: select for all"
on public.foods_master
for select
using (true);

-- ❌ No inserts/updates/deletes for normal users
-- (Admin can manage from Supabase dashboard using service role)

-- ============================================
-- 4) FOODS CUSTOM (Private)
-- ============================================

create policy "Foods custom: select own"
on public.foods_custom
for select
using (auth.uid() = user_id);

create policy "Foods custom: insert own"
on public.foods_custom
for insert
with check (auth.uid() = user_id);

create policy "Foods custom: update own"
on public.foods_custom
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Foods custom: delete own"
on public.foods_custom
for delete
using (auth.uid() = user_id);

-- ============================================
-- 5) FOOD LOGS (Private)
-- ============================================

create policy "Food logs: select own"
on public.food_logs
for select
using (auth.uid() = user_id);

create policy "Food logs: insert own"
on public.food_logs
for insert
with check (auth.uid() = user_id);

create policy "Food logs: update own"
on public.food_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Food logs: delete own"
on public.food_logs
for delete
using (auth.uid() = user_id);

-- ============================================
-- 6) WATER LOGS (Private)
-- ============================================

create policy "Water logs: select own"
on public.water_logs
for select
using (auth.uid() = user_id);

create policy "Water logs: insert own"
on public.water_logs
for insert
with check (auth.uid() = user_id);

create policy "Water logs: delete own"
on public.water_logs
for delete
using (auth.uid() = user_id);

-- ============================================
-- 7) WEIGHT LOGS (Private)
-- ============================================

create policy "Weight logs: select own"
on public.weight_logs
for select
using (auth.uid() = user_id);

create policy "Weight logs: insert own"
on public.weight_logs
for insert
with check (auth.uid() = user_id);

create policy "Weight logs: update own"
on public.weight_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Weight logs: delete own"
on public.weight_logs
for delete
using (auth.uid() = user_id);

-- ============================================
-- 8) FAVORITES (Private)
-- ============================================

create policy "Favorites: select own"
on public.favorites
for select
using (auth.uid() = user_id);

create policy "Favorites: insert own"
on public.favorites
for insert
with check (auth.uid() = user_id);

create policy "Favorites: delete own"
on public.favorites
for delete
using (auth.uid() = user_id);

-- ============================================
-- 9) STREAKS (Private)
-- ============================================

create policy "Streaks: select own"
on public.streaks
for select
using (auth.uid() = user_id);

create policy "Streaks: insert own"
on public.streaks
for insert
with check (auth.uid() = user_id);

create policy "Streaks: update own"
on public.streaks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================
-- Done ✅
-- ============================================

-- ============================================
-- Auto Create Profile + Targets + Streaks on Signup
-- ============================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 1) Create profile (basic placeholder values)
  insert into public.profiles (id, name, age, height_cm, weight_kg, activity_level, goal_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    18,
    170,
    60,
    'medium',
    'maintain'
  )
  on conflict (id) do nothing;

  -- 2) Create default daily targets
  insert into public.daily_targets (
    user_id,
    calories_target,
    protein_target_g,
    carbs_target_g,
    fats_target_g,
    water_target_ml
  )
  values (
    new.id,
    2000,
    120,
    250,
    60,
    2500
  )
  on conflict (user_id) do nothing;

  -- 3) Create streak record
  insert into public.streaks (user_id, current_streak, best_streak, last_completed_date)
  values (
    new.id,
    0,
    0,
    null
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger: runs after a new user is created in Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================
-- Done ✅
-- ============================================