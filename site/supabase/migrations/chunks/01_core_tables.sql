create extension if not exists pgcrypto;

create table if not exists services (
  id text primary key,
  name_fr text not null,
  name_en text not null,
  description_fr text not null,
  description_en text not null,
  duration_min int not null check (duration_min > 0),
  price_cents int not null check (price_cents >= 0),
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday int unique not null check (weekday between 0 and 6),
  open_time time not null,
  close_time time not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists booking_rules (
  id int primary key default 1,
  slot_interval_min int not null default 15,
  buffer_min int not null default 15,
  cancel_window_hours int not null default 24,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id = 1)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references services(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  appointment_start timestamptz not null,
  appointment_end timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'rescheduled', 'completed')),
  total_cents int not null check (total_cents >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  auth_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  event_type text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_en text not null,
  description_fr text not null,
  description_en text not null,
  price_cents int not null check (price_cents >= 0),
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'fulfilled')),
  subtotal_cents int not null check (subtotal_cents >= 0),
  tax_cents int not null check (tax_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  pickup_notes text,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  auth_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
