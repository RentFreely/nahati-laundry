-- Job titles on staff profiles, stored invoices (JSON snapshot), structured ledger codes, expanded ledger RLS.

-- ---------------------------------------------------------------------------
-- Profiles: job title (e.g. "Delivery Staff") — still use role for permissions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists job_title text not null default '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, job_title)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    'staff',
    coalesce(nullif(trim(new.raw_user_meta_data->>'job_title'), ''), '')
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invoices: link to orders + full form snapshot (PDF still generated client-side)
-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  created_by uuid references public.profiles (id),
  invoice_number text not null,
  invoice_date date not null,
  customer_name text not null,
  customer_phone text,
  total_ugx numeric(14, 2) not null check (total_ugx >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index invoices_invoice_number_key on public.invoices (invoice_number);
create index invoices_order_id_idx on public.invoices (order_id);
create index invoices_created_at_idx on public.invoices (created_at desc);

alter table public.invoices enable row level security;

create policy invoices_select_ops
  on public.invoices for select
  using (public.is_ops_user());

create policy invoices_insert_ops
  on public.invoices for insert
  with check (
    public.is_ops_user()
    and created_by = auth.uid()
  );

create policy invoices_update_ops
  on public.invoices for update
  using (public.is_ops_user())
  with check (public.is_ops_user());

create policy invoices_delete_managers
  on public.invoices for delete
  using (public.is_manager_or_admin());

-- ---------------------------------------------------------------------------
-- Ledger: optional structured code for reporting (app-enforced; column is free text)
-- ---------------------------------------------------------------------------
alter table public.ledger_entries
  add column if not exists entry_code text;

comment on column public.ledger_entries.entry_code is
  'Structured bucket, e.g. exp.water, exp.electricity, exp.detergent, exp.softener, exp.transport_pickup, exp.other, inc.service, inc.other';

-- ---------------------------------------------------------------------------
-- Ledger RLS: managers full access; staff may insert own income rows only; staff may read own income rows
-- ---------------------------------------------------------------------------
drop policy if exists ledger_select_managers on public.ledger_entries;
drop policy if exists ledger_insert_managers on public.ledger_entries;

create policy ledger_select_managers
  on public.ledger_entries for select
  using (public.is_manager_or_admin());

create policy ledger_select_staff_own_income
  on public.ledger_entries for select
  using (
    public.is_ops_user()
    and not public.is_manager_or_admin()
    and entry_type = 'income'
    and created_by = auth.uid()
  );

create policy ledger_insert_managers
  on public.ledger_entries for insert
  with check (
    public.is_manager_or_admin()
    and created_by = auth.uid()
  );

create policy ledger_insert_staff_income
  on public.ledger_entries for insert
  with check (
    public.is_ops_user()
    and not public.is_manager_or_admin()
    and entry_type = 'income'
    and created_by = auth.uid()
  );
