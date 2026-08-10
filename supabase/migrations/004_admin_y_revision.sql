-- =============================================
-- ADMIN (tabla separada de desarrolladoras)
-- =============================================
create table admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "admins_read_self" on admins for select
  using (user_id = auth.uid());

create policy "admins_admin_all" on admins for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- =============================================
-- ESTADO DE REVISION EN PROYECTOS
-- =============================================
alter table proyectos add column if not exists estado_revision text not null default 'pendiente'
  check (estado_revision in ('pendiente', 'aprobado', 'rechazado'));
alter table proyectos add column if not exists motivo_rechazo text;

-- Los desarrollos existentes quedan aprobados (visibles)
update proyectos set estado_revision = 'aprobado' where estado_revision = 'pendiente';

-- =============================================
-- RLS PROYECTOS
-- =============================================
-- Admin puede todo sobre todos los proyectos
create policy "proyectos_admin_all" on proyectos for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- Lectura pública: solo activos Y aprobados
drop policy if exists "proyectos_public_read" on proyectos;
create policy "proyectos_public_read" on proyectos for select
  using (activo = true and estado_revision = 'aprobado');

-- =============================================
-- RLS DESARROLLADORAS (auto-registro)
-- =============================================
create policy "desarrolladoras_self_insert" on desarrolladoras for insert
  with check (user_id = auth.uid());

-- =============================================
-- TRIGGER: solo admin cambia estado_revision
-- =============================================
create or replace function enforce_revision_for_dev()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from admins a where a.user_id = auth.uid())
     and new.estado_revision is distinct from 'pendiente' then
    raise exception 'Solo el admin puede cambiar el estado de revision';
  end if;
  if not exists (select 1 from admins a where a.user_id = auth.uid()) then
    new.estado_revision := 'pendiente';
  end if;
  return new;
end;
$$;

create trigger proyectos_enforce_revision before insert or update on proyectos
  for each row execute function enforce_revision_for_dev();
