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
