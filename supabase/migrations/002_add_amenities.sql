alter table proyectos add column if not exists amenities text[] default '{}';

-- Actualizar proyectos de prueba con amenities
update proyectos
set amenities = array['Pileta', 'Gimnasio', 'SUM', 'Cochera', 'Seguridad 24hs', 'Terraza']
where nombre = 'Alvear Palermo Soho';

update proyectos
set amenities = array['Cochera', 'Seguridad 24hs', 'Recepción', 'Sala de reuniones']
where nombre = 'Alvear Microcentro Oficinas';

update proyectos
set amenities = array['Pileta', 'Parque', 'Cancha de tenis', 'Muelle', 'Cochera', 'Seguridad 24hs']
where nombre = 'Nordelta Vista';
