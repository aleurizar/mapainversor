-- =============================================
-- FIX: recursión infinita en políticas de admins
-- El patrón `exists (select 1 from admins ...)` dentro de una policy sobre
-- `admins` (o que la referencia) dispara RLS recursivo. Se reemplaza por una
-- función security definer que consulta admins sin aplicar RLS.
-- =============================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- admins: read solo a sí mismo, el resto de operaciones solo por admin
drop policy if exists "admins_admin_all" on admins;
create policy "admins_admin_all" on admins for all
  using (public.is_admin())
  with check (public.is_admin());

-- proyectos: admin puede todo
drop policy if exists "proyectos_admin_all" on proyectos;
create policy "proyectos_admin_all" on proyectos for all
  using (public.is_admin())
  with check (public.is_admin());

-- trigger: usa la misma función
create or replace function enforce_revision_for_dev()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() and new.estado_revision is distinct from 'pendiente' then
    raise exception 'Solo el admin puede cambiar el estado de revision';
  end if;
  if not public.is_admin() then
    new.estado_revision := 'pendiente';
  end if;
  return new;
end;
$$;
