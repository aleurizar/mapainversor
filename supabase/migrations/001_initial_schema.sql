-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- =============================================
-- DESARROLLADORAS
-- =============================================
create table desarrolladoras (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  email       text unique not null,
  logo_url    text,
  sitio_web   text,
  telefono    text,
  descripcion text,
  created_at  timestamptz not null default now()
);

-- =============================================
-- PROYECTOS
-- =============================================
create table proyectos (
  id               uuid primary key default uuid_generate_v4(),
  desarrolladora_id uuid references desarrolladoras(id) on delete cascade,
  nombre           text not null,
  descripcion      text,
  estado           text not null check (estado in ('en_pozo', 'en_construccion', 'terminado', 'entregado')),
  tipo             text not null check (tipo in ('residencial', 'comercial', 'mixto', 'oficinas')),
  direccion        text not null,
  ciudad           text not null default 'Buenos Aires',
  provincia        text not null default 'Buenos Aires',
  latitud          double precision not null,
  longitud         double precision not null,
  precio_desde     numeric(14, 2),
  moneda           text not null default 'USD',
  superficie_desde numeric(8, 2),
  superficie_hasta numeric(8, 2),
  ambientes_min    integer,
  ambientes_max    integer,
  imagen_url       text,
  imagenes         text[] default '{}',
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index proyectos_desarrolladora_idx on proyectos(desarrolladora_id);
create index proyectos_estado_idx on proyectos(estado);
create index proyectos_activo_idx on proyectos(activo);

-- Trigger para updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger proyectos_updated_at
  before update on proyectos
  for each row execute function set_updated_at();

-- =============================================
-- LEADS
-- =============================================
create table leads (
  id           uuid primary key default uuid_generate_v4(),
  proyecto_id  uuid references proyectos(id) on delete set null,
  nombre       text not null,
  email        text not null,
  telefono     text,
  mensaje      text,
  estado       text not null default 'nuevo' check (estado in ('nuevo', 'contactado', 'calificado', 'descartado')),
  created_at   timestamptz not null default now()
);

create index leads_proyecto_idx on leads(proyecto_id);
create index leads_estado_idx on leads(estado);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Proyectos: lectura pública de los activos
alter table proyectos enable row level security;

create policy "proyectos_public_read"
  on proyectos for select
  using (activo = true);

-- Desarrolladoras: lectura pública
alter table desarrolladoras enable row level security;

create policy "desarrolladoras_public_read"
  on desarrolladoras for select
  using (true);

-- Leads: sólo inserción pública (cualquiera puede dejar un lead)
alter table leads enable row level security;

create policy "leads_public_insert"
  on leads for insert
  with check (true);

-- =============================================
-- DATOS DE PRUEBA
-- =============================================
insert into desarrolladoras (id, nombre, email, sitio_web, descripcion) values
  ('00000000-0000-0000-0000-000000000001', 'Grupo Alvear', 'info@grupoalvear.com.ar', 'https://grupoalvear.com.ar', 'Desarrolladora líder en CABA'),
  ('00000000-0000-0000-0000-000000000002', 'Torres del Plata', 'ventas@torresdelplata.ar', null, 'Proyectos premium en el norte del GBA');

insert into proyectos (desarrolladora_id, nombre, descripcion, estado, tipo, direccion, ciudad, latitud, longitud, precio_desde, moneda, ambientes_min, ambientes_max, activo) values
  ('00000000-0000-0000-0000-000000000001', 'Alvear Palermo Soho', 'Torre residencial de 18 pisos con amenities completos', 'en_construccion', 'residencial', 'Thames 1850', 'Buenos Aires', -34.5878, -58.4301, 95000, 'USD', 1, 4, true),
  ('00000000-0000-0000-0000-000000000001', 'Alvear Microcentro Oficinas', 'Oficinas premium en el corazón de Buenos Aires', 'en_pozo', 'oficinas', 'Florida 550', 'Buenos Aires', -34.6025, -58.3742, 120000, 'USD', null, null, true),
  ('00000000-0000-0000-0000-000000000002', 'Nordelta Vista', 'Casas y departamentos con vista al lago', 'terminado', 'residencial', 'Av. del Lago 1200', 'Tigre', -34.4018, -58.6542, 180000, 'USD', 2, 5, true);
