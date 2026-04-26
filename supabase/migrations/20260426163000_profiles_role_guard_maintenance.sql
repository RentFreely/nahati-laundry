-- Allow role updates when there is no JWT (maintenance SQL, CLI, dashboard SQL editor).
-- End-user requests always have auth.uid(); RLS still restricts who can UPDATE profiles.
create or replace function public.profiles_role_guard()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      return new;
    end if;
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
