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
