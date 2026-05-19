drop table if exists order_events cascade;
drop table if exists order_items cascade;
drop table if exists booking_events cascade;
drop table if exists bookings cascade;
drop table if exists orders cascade;
drop table if exists products cascade;
drop table if exists services cascade;
drop table if exists business_hours cascade;
drop table if exists booking_rules cascade;
drop table if exists faqs cascade;
drop table if exists reviews cascade;
drop table if exists site_settings cascade;
drop table if exists admin_users cascade;

drop function if exists set_updated_at() cascade;
