-- Nahati ops: profiles, orders, audit trail, ledger (income / expense)
-- Run against remote: `npx supabase db push` (after `npx supabase link`)

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('staff', 'manager', 'admin');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text,
  notes text,
  status text not null default 'pickup_pending'
    check (status in (
      'pickup_pending',
      'at_shop',
      'processing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )),
  pickup_notes text,
  delivery_notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income', 'expense')),
  amount_ugx numeric(14, 2) not null check (amount_ugx >= 0),
  category text not null,
  description text,
  order_id uuid references public.orders (id) on delete set null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New auth user -> profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    'staff'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Order audit (server-side, tamper-resistant)
-- ---------------------------------------------------------------------------
create or replace function public.orders_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, actor_id, action, detail)
    values (
      new.id,
      coalesce(auth.uid(), new.created_by),
      'order_created',
      jsonb_build_object('status', new.status, 'customer_name', new.customer_name)
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.order_events (order_id, actor_id, action, detail)
    values (
      new.id,
      auth.uid(),
      'status_changed',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger orders_audit_ai
  after insert on public.orders
  for each row execute function public.orders_audit();

create trigger orders_audit_au
  after update on public.orders
  for each row execute function public.orders_audit();

-- ---------------------------------------------------------------------------
-- Role changes: only manager/admin
-- ---------------------------------------------------------------------------
create or replace function public.profiles_role_guard()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    ) then
      raise exception 'Only managers or admins can change roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard_trg
  before update on public.profiles
  for each row execute function public.profiles_role_guard();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index order_events_order_id_idx on public.order_events (order_id, id desc);
create index ledger_created_at_idx on public.ledger_entries (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.ledger_entries enable row level security;

-- Helper: signed-in staff (any operational role)
create or replace function public.is_ops_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('staff', 'manager', 'admin')
  );
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  );
$$;

-- profiles
create policy profiles_select_own_or_manager
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_manager_or_admin()
  );

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_update_manager
  on public.profiles for update
  using (public.is_manager_or_admin())
  with check (public.is_manager_or_admin());

-- orders
create policy orders_select_ops
  on public.orders for select
  using (public.is_ops_user());

create policy orders_insert_ops
  on public.orders for insert
  with check (
    public.is_ops_user()
    and created_by = auth.uid()
  );

create policy orders_update_ops
  on public.orders for update
  using (public.is_ops_user())
  with check (public.is_ops_user());

-- order_events (manual rows from app; audit trigger uses security definer)
create policy order_events_select_ops
  on public.order_events for select
  using (public.is_ops_user());

create policy order_events_insert_own_actor
  on public.order_events for insert
  with check (
    public.is_ops_user()
    and actor_id = auth.uid()
  );

-- ledger: managers + admins only
create policy ledger_select_managers
  on public.ledger_entries for select
  using (public.is_manager_or_admin());

create policy ledger_insert_managers
  on public.ledger_entries for insert
  with check (
    public.is_manager_or_admin()
    and created_by = auth.uid()
  );
