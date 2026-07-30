-- =============================================================
-- DuoBaby — Initial Schema (MVP)
-- Repo konumu: supabase/migrations/0001_initial_schema.sql
-- Supabase Dashboard > SQL Editor'e yapıştırıp çalıştır.
-- =============================================================

-- ---------- ENUM'lar ----------
create type public.life_stage as enum ('baby', 'child', 'teen', 'adult');
create type public.child_status as enum ('active', 'left_home');
create type public.mood_color as enum ('green', 'orange', 'red', 'pink', 'purple', 'yellow', 'blue');
create type public.care_action_type as enum ('feed', 'clean', 'sleep', 'play');

-- ---------- users (profil tablosu, auth.users'a bağlı) ----------
-- Supabase'in kendi auth.users tablosu var; bu tablo ona 1:1 profil.
create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar       text,
  push_token   text,
  created_at   timestamptz not null default now()
);

-- Anonim oturum açılınca otomatik profil satırı oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- pairs ----------
-- user2_id eşleşene kadar NULL kalır.
create table public.pairs (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid not null references public.users (id) on delete cascade,
  user2_id   uuid references public.users (id) on delete cascade,
  pair_code  text not null unique,
  created_at timestamptz not null default now(),
  constraint pairs_different_users check (user1_id <> user2_id)
);

create index idx_pairs_user1 on public.pairs (user1_id);
create index idx_pairs_user2 on public.pairs (user2_id);

-- ---------- children ----------
create table public.children (
  id            uuid primary key default gen_random_uuid(),
  pair_id       uuid not null references public.pairs (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 30),
  gender        text not null check (gender in ('male', 'female')),
  hair_color    text not null,
  eye_color     text not null,
  skin_tone     text not null,
  birth_date    timestamptz not null default now(),
  life_stage    public.life_stage not null default 'baby',
  hunger        int not null default 100 check (hunger between 0 and 100),
  cleanliness   int not null default 100 check (cleanliness between 0 and 100),
  energy        int not null default 100 check (energy between 0 and 100),
  happiness     int not null default 100 check (happiness between 0 and 100),
  last_decay_at timestamptz not null default now(),
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now()
);

create index idx_children_pair on public.children (pair_id, status);

-- Kural: pair başına en fazla 3 AKTİF çocuk (DB seviyesinde güvence)
create or replace function public.check_active_children_limit()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' and (
    select count(*)
    from public.children
    where pair_id = new.pair_id
      and status = 'active'
      and id <> new.id
  ) >= 3 then
    raise exception 'Bir cift ayni anda en fazla 3 aktif cocuga bakabilir';
  end if;
  return new;
end;
$$;

create trigger trg_children_active_limit
  before insert or update of status on public.children
  for each row execute function public.check_active_children_limit();

-- ---------- moods (mod kullanıcıya ait, çocuğa değil) ----------
create table public.moods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  pair_id    uuid not null references public.pairs (id) on delete cascade,
  color      public.mood_color not null,
  note       text check (char_length(note) <= 200),
  date       date not null default current_date,
  created_at timestamptz not null default now(),
  constraint moods_one_per_day unique (user_id, date)
);

create index idx_moods_pair_date on public.moods (pair_id, date desc);

-- ---------- care_actions ----------
create table public.care_actions (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  action_type public.care_action_type not null,
  created_at  timestamptz not null default now()
);

create index idx_care_actions_child on public.care_actions (child_id, created_at desc);

-- ---------- streaks (pair başına 1 satır) ----------
create table public.streaks (
  pair_id             uuid primary key references public.pairs (id) on delete cascade,
  current_streak      int not null default 0,
  longest_streak      int not null default 0,
  last_completed_date date
);

-- ---------- RLS: şimdiden AÇIK, policy'ler G1-3'te ----------
-- Policy olmadan client hiçbir satıra erişemez; bu bilinçli.
-- G1-3'te pair bazlı policy'leri yazana kadar test için service_role
-- key ile (sadece SQL Editor / server tarafında) çalışabilirsin.
alter table public.users        enable row level security;
alter table public.pairs        enable row level security;
alter table public.children    enable row level security;
alter table public.moods       enable row level security;
alter table public.care_actions enable row level security;
alter table public.streaks     enable row level security;
