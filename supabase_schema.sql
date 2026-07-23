-- ============================================================
-- NaijaPOS Pro — Supabase Database Schema
-- Insert this SQL in your Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- MERCHANTS
-- ============================================================
create table if not exists merchants (
  id             uuid primary key default gen_random_uuid(),
  business_name  text not null,
  owner_name     text not null,
  email          text not null unique,
  phone          text not null,
  password_hash  text not null,
  tier           text not null check (tier in ('basic','standard','premium')),
  subscription_status text not null check (subscription_status in ('active','expired','trial')),
  subscription_expiry timestamptz not null,
  address        text,
  logo           text,
  currency       text not null default 'NGN',
  tax_rate       numeric(5,2) not null default 7.5,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- OUTLETS
-- ============================================================
create table if not exists outlets (
  id              uuid primary key default gen_random_uuid(),
  merchant_id     uuid not null references merchants(id) on delete cascade,
  name            text not null,
  address         text not null,
  phone           text,
  pin             text not null,
  is_active       boolean not null default true,
  tax_enabled     boolean not null default true,
  receipt_footer  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists outlets_merchant_id_idx on outlets(merchant_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  outlet_id   uuid not null references outlets(id) on delete cascade,
  name        text not null,
  color       text,
  created_at  timestamptz not null default now()
);

create index if not exists categories_outlet_id_idx on categories(outlet_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  outlet_id        uuid not null references outlets(id) on delete cascade,
  category_id      uuid references categories(id) on delete set null,
  name             text not null,
  sku              text not null,
  barcode          text,
  description      text,
  price            numeric(12,2) not null,
  cost_price       numeric(12,2) not null default 0,
  stock            integer not null default 0,
  low_stock_alert  integer not null default 5,
  unit             text not null default 'pcs',
  image            text,
  is_active        boolean not null default true,
  track_stock      boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (outlet_id, sku)
);

create index if not exists products_outlet_id_idx on products(outlet_id);
create index if not exists products_sku_idx on products(sku);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id              uuid primary key default gen_random_uuid(),
  outlet_id       uuid not null references outlets(id) on delete cascade,
  name            text not null,
  phone           text not null,
  email           text,
  address         text,
  loyalty_points  integer not null default 0,
  total_spent     numeric(15,2) not null default 0,
  visit_count     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (outlet_id, phone)
);

create index if not exists customers_outlet_id_idx on customers(outlet_id);

-- ============================================================
-- STAFF
-- ============================================================
create table if not exists staff (
  id          uuid primary key default gen_random_uuid(),
  outlet_id   uuid not null references outlets(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  phone       text,
  pin         text,
  role        text not null check (role in ('manager','cashier')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Migration: add email column to existing staff table (if it doesn't have it yet)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'staff' and column_name = 'email'
  ) then
    alter table staff add column email text;
    -- Give existing rows placeholder emails so we can enforce NOT NULL + UNIQUE
    update staff set email = concat('staff-', id, '@placeholder.pos') where email is null;
    alter table staff alter column email set not null;
    alter table staff add constraint staff_email_unique unique (email);
  end if;
end $$;

create index if not exists staff_outlet_id_idx on staff(outlet_id);
create index if not exists staff_email_idx on staff(email);

-- ============================================================
-- SALES
-- ============================================================
create table if not exists sales (
  id               uuid primary key default gen_random_uuid(),
  outlet_id        uuid not null references outlets(id) on delete cascade,
  receipt_number   text not null,
  items            jsonb not null default '[]',
  subtotal         numeric(12,2) not null,
  tax_amount       numeric(12,2) not null default 0,
  discount_amount  numeric(12,2) not null default 0,
  total            numeric(12,2) not null,
  amount_paid      numeric(12,2) not null,
  change           numeric(12,2) not null default 0,
  payment_method   text not null check (payment_method in ('cash','card','transfer','pos','wallet')),
  status           text not null check (status in ('completed','refunded','void')) default 'completed',
  customer_id      uuid references customers(id) on delete set null,
  customer_name    text,
  staff_id         uuid references staff(id) on delete set null,
  staff_name       text,
  note             text,
  created_at       timestamptz not null default now()
);

create index if not exists sales_outlet_id_idx on sales(outlet_id);
create index if not exists sales_created_at_idx on sales(created_at);
create index if not exists sales_receipt_number_idx on sales(receipt_number);

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  outlet_id   uuid not null references outlets(id) on delete cascade,
  category    text not null,
  amount      numeric(12,2) not null,
  description text not null,
  date        date not null,
  staff_id    uuid references staff(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists expenses_outlet_id_idx on expenses(outlet_id);
create index if not exists expenses_date_idx on expenses(date);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
create table if not exists stock_movements (
  id           uuid primary key default gen_random_uuid(),
  outlet_id    uuid not null references outlets(id) on delete cascade,
  product_id   uuid not null references products(id) on delete cascade,
  product_name text not null,
  type         text not null check (type in ('in','out','adjust','sale','return')),
  qty          integer not null,
  prev_stock   integer not null,
  new_stock    integer not null,
  note         text,
  sale_id      uuid references sales(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists stock_movements_outlet_id_idx on stock_movements(outlet_id);
create index if not exists stock_movements_product_id_idx on stock_movements(product_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Every user (merchant or staff) authenticates via Supabase Auth.
-- auth.uid() is their Supabase user ID.
--
-- Access rules:
--   - Merchants can access all data belonging to their outlets.
--   - Staff can access only their assigned outlet's data.
--   - A user who is NEITHER a merchant nor active staff sees nothing.
-- ============================================================

-- First, disable RLS on all tables (clean slate)
alter table if exists merchants disable row level security;
alter table if exists outlets disable row level security;
alter table if exists categories disable row level security;
alter table if exists products disable row level security;
alter table if exists customers disable row level security;
alter table if exists staff disable row level security;
alter table if exists sales disable row level security;
alter table if exists expenses disable row level security;
alter table if exists stock_movements disable row level security;

-- Then enable RLS on all tables
alter table merchants enable row level security;
alter table outlets enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table staff enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;
alter table stock_movements enable row level security;

-- ============================================================
-- Helper: is the current user an active staff member of a given outlet?
-- ============================================================
create or replace function is_staff_of_outlet(outlet_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from staff
    where staff.id::text = auth.uid()::text
      and staff.outlet_id = $1
      and staff.is_active = true
  );
$$;

-- ============================================================
-- Helper: is the current user the merchant who owns a given outlet?
-- ============================================================
create or replace function is_merchant_of_outlet(outlet_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from outlets o
    where o.id = $1
      and o.merchant_id::text = auth.uid()::text
  );
$$;

-- ============================================================
-- Helper: can the current user access a given outlet?
-- (either they're staff of that outlet OR the merchant who owns it)
-- ============================================================
create or replace function can_access_outlet(outlet_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select is_staff_of_outlet($1) or is_merchant_of_outlet($1);
$$;

-- ============================================================
-- POLICIES
-- ============================================================

-- MERCHANTS: only the merchant themselves can access their own row
drop policy if exists "merchants_own_data" on merchants;
create policy "merchants_own_data" on merchants
  for all using (auth.uid()::text = id::text)
  with check (auth.uid()::text = id::text);

-- OUTLETS: merchant of the outlet OR staff of the outlet
drop policy if exists "outlets_access" on outlets;
create policy "outlets_access" on outlets
  for all using (
    merchant_id::text = auth.uid()::text
    or is_staff_of_outlet(id)
  )
  with check (
    merchant_id::text = auth.uid()::text
  );

-- STAFF: merchant of the staff's outlet OR the staff member themselves
drop policy if exists "staff_access" on staff;
create policy "staff_access" on staff
  for all using (
    id::text = auth.uid()::text
    or is_merchant_of_outlet(outlet_id)
  )
  with check (
    is_merchant_of_outlet(outlet_id)
  );

-- CATEGORIES: can_access_outlet
drop policy if exists "categories_access" on categories;
create policy "categories_access" on categories
  for all using (can_access_outlet(outlet_id))
  with check (can_access_outlet(outlet_id));

-- PRODUCTS: can_access_outlet
drop policy if exists "products_access" on products;
create policy "products_access" on products
  for all using (can_access_outlet(outlet_id))
  with check (can_access_outlet(outlet_id));

-- CUSTOMERS: can_access_outlet
drop policy if exists "customers_access" on customers;
create policy "customers_access" on customers
  for all using (can_access_outlet(outlet_id))
  with check (can_access_outlet(outlet_id));

-- SALES: can_access_outlet
drop policy if exists "sales_access" on sales;
create policy "sales_access" on sales
  for all using (can_access_outlet(outlet_id))
  with check (can_access_outlet(outlet_id));

-- EXPENSES: can_access_outlet
drop policy if exists "expenses_access" on expenses;
create policy "expenses_access" on expenses
  for all using (can_access_outlet(outlet_id))
  with check (can_access_outlet(outlet_id));

-- STOCK MOVEMENTS: can_access_outlet
drop policy if exists "stock_movements_access" on stock_movements;
create policy "stock_movements_access" on stock_movements
  for all using (can_access_outlet(outlet_id))
  with check (can_access_outlet(outlet_id));

-- ============================================================
-- IMPORTANT: Supabase Project Settings
-- ============================================================
-- Go to your Supabase Dashboard → Authentication → Settings:
--   1. Disable "Confirm email" (or enable "Allow unverified email logins")
--      This is needed so merchants can create staff accounts via signUp()
--      without staff needing to verify their email first.
--   2. Under "Email Auth", disable "Enable email confirmations"
-- ============================================================

-- ============================================================
-- Useful views
-- ============================================================

create or replace view outlet_daily_summary as
select
  o.id as outlet_id,
  o.name as outlet_name,
  o.merchant_id,
  date_trunc('day', s.created_at) as sale_date,
  count(s.id) as transaction_count,
  sum(s.total) as revenue,
  sum(s.discount_amount) as total_discounts,
  sum(s.tax_amount) as total_tax
from outlets o
left join sales s on s.outlet_id = o.id and s.status = 'completed'
group by o.id, o.name, o.merchant_id, date_trunc('day', s.created_at);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
