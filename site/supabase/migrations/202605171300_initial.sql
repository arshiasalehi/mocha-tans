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

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  line_total_cents int not null check (line_total_cents >= 0)
);

create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question_fr text not null,
  question_en text not null,
  answer_fr text not null,
  answer_en text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  quote_fr text not null,
  quote_en text not null,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now()
);

create unique index if not exists faqs_question_fr_unique on faqs(question_fr);
create unique index if not exists reviews_author_name_unique on reviews(author_name);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at before update on services
for each row execute function set_updated_at();

drop trigger if exists business_hours_set_updated_at on business_hours;
create trigger business_hours_set_updated_at before update on business_hours
for each row execute function set_updated_at();

drop trigger if exists booking_rules_set_updated_at on booking_rules;
create trigger booking_rules_set_updated_at before update on booking_rules
for each row execute function set_updated_at();

drop trigger if exists bookings_set_updated_at on bookings;
create trigger bookings_set_updated_at before update on bookings
for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
for each row execute function set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at before update on orders
for each row execute function set_updated_at();

drop trigger if exists faqs_set_updated_at on faqs;
create trigger faqs_set_updated_at before update on faqs
for each row execute function set_updated_at();

drop trigger if exists reviews_set_updated_at on reviews;
create trigger reviews_set_updated_at before update on reviews
for each row execute function set_updated_at();

alter table services enable row level security;
alter table business_hours enable row level security;
alter table booking_rules enable row level security;
alter table bookings enable row level security;
alter table booking_events enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table faqs enable row level security;
alter table reviews enable row level security;
alter table site_settings enable row level security;
alter table admin_users enable row level security;

create policy "Public read services" on services for select using (true);
create policy "Public read business hours" on business_hours for select using (true);
create policy "Public read booking rules" on booking_rules for select using (true);
create policy "Public read products" on products for select using (true);
create policy "Public read faqs" on faqs for select using (true);
create policy "Public read reviews" on reviews for select using (true);
create policy "Public read site settings" on site_settings for select using (true);

create policy "Users can view own bookings" on bookings
for select to authenticated
using (
  auth.uid() = auth_user_id
  or lower(customer_email) = lower(coalesce(auth.jwt()->>'email', ''))
);

create policy "Users can view own orders" on orders
for select to authenticated
using (
  auth.uid() = auth_user_id
  or lower(customer_email) = lower(coalesce(auth.jwt()->>'email', ''))
);

create policy "Users can view own order items" on order_items
for select to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and (
        o.auth_user_id = auth.uid()
        or lower(o.customer_email) = lower(coalesce(auth.jwt()->>'email', ''))
      )
  )
);

create policy "Users can view own order events" on order_events
for select to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = order_events.order_id
      and (
        o.auth_user_id = auth.uid()
        or lower(o.customer_email) = lower(coalesce(auth.jwt()->>'email', ''))
      )
  )
);

create policy "Admin user self-read" on admin_users
for select to authenticated
using (auth.uid() = auth_user_id);

insert into booking_rules (id, slot_interval_min, buffer_min, cancel_window_hours)
values (1, 15, 15, 24)
on conflict (id) do update set
  slot_interval_min = excluded.slot_interval_min,
  buffer_min = excluded.buffer_min,
  cancel_window_hours = excluded.cancel_window_hours;
