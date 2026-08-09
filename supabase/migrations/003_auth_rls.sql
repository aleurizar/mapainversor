-- Vincular auth.users con desarrolladoras
alter table desarrolladoras
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists desarrolladoras_user_id_idx
  on desarrolladoras(user_id) where user_id is not null;

-- =============================================
-- RLS adicional para el dashboard
-- =============================================

-- Proyectos: la desarrolladora dueña puede leer/crear/editar/borrar los suyos
create policy "proyectos_owner_all"
  on proyectos for all
  using (
    desarrolladora_id in (
      select id from desarrolladoras where user_id = auth.uid()
    )
  )
  with check (
    desarrolladora_id in (
      select id from desarrolladoras where user_id = auth.uid()
    )
  );

-- Leads: la desarrolladora puede leer los leads de sus proyectos
create policy "leads_owner_read"
  on leads for select
  using (
    proyecto_id in (
      select p.id
      from proyectos p
      join desarrolladoras d on p.desarrolladora_id = d.id
      where d.user_id = auth.uid()
    )
  );

-- Desarrolladoras: cada usuario puede ver y editar su propio registro
create policy "desarrolladoras_owner_update"
  on desarrolladoras for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
