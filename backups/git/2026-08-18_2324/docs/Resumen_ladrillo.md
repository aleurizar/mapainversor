# Ladrillo

**Ubicación:** C:\dev\ladrillo

App inmobiliaria MapaInversor.ar: mapa de desarrollos inmobiliarios con registro de desarrolladoras y sistema de carga/revisión de desarrollos.

## Qué es hoy

- Web con mapa de desarrollos (react-map-gl/Mapbox), detalle por proyecto y dashboard de desarrolladora.
- Stack: Next.js (App Router + Server Actions), React 19, Supabase (Postgres + Auth + RLS), Vitest, Playwright.
- En curso: feature "Admin + Carga de Desarrollos con Revisión" — rol admin, auto-registro de desarrolladoras, desarrollos que quedan en estado de revisión hasta aprobación del admin (migración SQL 004, RLS + trigger). Plan de implementación en `docs/superpowers/plans/2026-08-10-admin-y-carga-desarrollos.md`.

## Plan

- Completar la implementación del plan de admin + carga con revisión (tareas pendientes del plan).
- Mantener este resumen como fuente de verdad canónica del proyecto.

## Próximos pasos

1. Implementar la feature de admin + carga de desarrollos siguiendo el plan (`docs/superpowers/plans/2026-08-10-admin-y-carga-desarrollos.md`).
2. Aplicar la migración SQL 004 al Supabase remoto y registrar al admin.