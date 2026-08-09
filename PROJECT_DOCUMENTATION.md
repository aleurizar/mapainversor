# Project Documentation — ladrillo

## 1. Executive Summary

¿Qué es?
- Aplicación web frontend desarrollada con Next.js (ruta app/, build en .next) que expone una interfaz con login y un dashboard de "proyectos" con vistas de mapa.  
- Hecho.

Para qué sirve
- Interfaz para gestionar/ver proyectos (páginas: /login, /dashboard, /proyectos/[id]) y visualizarlos en mapa (Mapbox).  
- Inferencia (basado en rutas y componentes encontrados).

Cómo funciona (resumen)
- Next.js SSR/SSG app que usa Supabase para autenticación y almacenamiento de datos y Mapbox (react-map-gl / mapbox-gl) para visualización geográfica. Peticiones a Supabase desde el cliente y/o servidor.  
- Inferencia (basado en dependencias y rutas).

Cómo se ejecuta
- Node (compatible con Next 16), instalar dependencias y ejecutar `npm run dev`. Genera server de desarrollo y carpeta .next con build.  
- Hecho / Inferencia.

Qué necesita para funcionar
- Variables de entorno (archivo .env.local detectado). Probables claves: Supabase URL/KEY y Mapbox token.  
- Hecho / Inferencia.

Qué genera
- Servidor Next en dev; build estático/servidor en `.next/`; assets en `public/`.  
- Hecho.

Principales componentes
- Next.js app (src/app, routes), integración Supabase (dependencias y carpeta supabase), componente MapView (react-map-gl).  
- Hecho / Inferencia.

Riesgos / puntos de atención
- Archivo `.env.local` y `.claude/settings.local.json` detectados: posibles secretos dentro del repo o en la raíz del proyecto → revisar y rotar si hay claves expuestas.  
- La carpeta `.next` y `node_modules` están presentes en el repo local (build/artifacts/paquetes instalados) — tamaño y contenido comprometido; afecta control de versiones y seguridad.  
- Hecho / Alta certeza donde aplica.

---

## 2. Project Purpose

- Aplicación web para visualizar y gestionar proyectos con componentes de mapa y autenticación.  
- Fuente: rutas server/app/* (login, dashboard, proyectos/[id]) y dependencias (supabase, mapbox-gl, react-map-gl).  
- Nivel de certeza: Hecho (rutas) + Inferencia (propósito completo).

---

## 3. Project Structure (árbol simplificado)

ladrillo/ (raíz inspeccionada)
├── .claude/ (config local de Claude)  
├── .env.local (archivo de entorno — contiene valores locales)  
├── .git/  
├── .next/ (build / dev artifacts)  
├── AGENTS.md, CLAUDE.md, README.md  
├── node_modules/  
├── package.json, package-lock.json, tsconfig.json, next.config.ts  
├── public/ (assets estáticos: favicon, media)  
├── src/ (código fuente: app/*, components/*, etc.)  
├── supabase/ (config / funciones relacionadas con Supabase)  
└── tsconfig.tsbuildinfo

Breve función de cada carpeta:
- src/: código fuente de la app (páginas, componentes, hooks). (Hecho/inferencia)
- supabase/: utilidades/cliente o funciones para interactuar con Supabase. (Inferencia)
- public/: assets públicos (favicon, fonts). (Hecho)
- .next/: artefactos de build/servidor Next generados. (Hecho)
- node_modules/: dependencias instaladas. (Hecho)

Nivel de certeza: listado de archivos observado directamente; funciones inferidas a partir de nombres y contenido parcial.

---

## 4. Architecture (descripción)

Arquitectura observada:
- Cliente/SSR (Next.js) ←→ Supabase (Auth + DB)  
- Mapbox (mapbox-gl / react-map-gl) integrado en frontend para mapas.  
- Next genera `.next` (SSR/SSG output) y sirve rutas app/*.

Diagrama conceptual (simplificado):
```mermaid
flowchart TD
  A[Usuario / Navegador] --> B[Next.js (app/*) - SSR/Client]
  B --> C[Supabase (Auth / Postgres / Storage)]
  B --> D[Mapbox (Tiles / Static API)]
  B --> E[Public assets (.next / public)]
```

Nivel de certeza: Inferencia fuerte (dependencias y rutas confirmadas).

---

## 5. Functional Components (inventario resumido)

| Componente | Ubicación (observada) | Función | Input | Output | Dependencias |
|---|---:|---|---|---|---|
| Next app (rutas) | src/app, .next/server/app | Ruteo, SSR, páginas: login, dashboard, proyectos | HTTP requests, cookies, env vars | HTML/JS/CSS, JSON | next, react |
| Auth / DB client | supabase/ ; @supabase/* | Autenticación y acceso a datos | credenciales Supabase, requests | sesiones, datos de proyectos | @supabase/supabase-js |
| Map view | src/components/MapView.tsx (referido en .next) | Visualización de mapas y capas | coordenadas, geojson | mapa interactivo | mapbox-gl, react-map-gl |
| Public assets | public/ | Fonts, favicon, estáticos | N/A | archivos estáticos servidos | N/A |
| Env config | .env.local, next.config.ts | Configurar claves y settings | variables de entorno | configuración en runtime | next |
| Scripts | package.json scripts | dev/build/start/lint | none | procesos Next | next, eslint |

Fuentes: package.json (dependencias/scripts), estructura .next (rutas), node_modules.

Nivel de certeza: Hecho para ubicación y dependencias; función e inputs/outputs inferidos.

---

## 6. Data Flow (reconstrucción)

Flujo principal (usuario autenticado viendo proyecto/mapa):
1. Usuario accede a /login → Next.js renderiza página de login.  
2. Credenciales enviadas al cliente/server que llama a Supabase (Auth).  
3. Tras login, Next redirige a /dashboard; el dashboard solicita datos de proyectos desde Supabase (postgREST o client js).  
4. Para cada proyecto con coordenadas, MapView solicita recursos de Mapbox (tiles) y muestra marcadores/geométricos.  
5. Cambios/ediciones se envían a Supabase (mutaciones) y se persisten.  
- Nivel de certeza: Inferencia (rutas y dependencias); pasos verificados por archivos listados en .next.

Datos entrantes:
- Credenciales de usuario (login), parámetros de ruta (id), variables de entorno.

Transformaciones:
- SSR/SSG rendering, mapeo de datos a componentes UI, llamadas a Supabase.

Outputs:
- HTML/JS/CSS servidos; peticiones a Supabase y Mapbox; logs en .next/dev.

---

## 7. Step-by-step Execution

Prerrequisitos
- SO: Windows / cualquier SO con Node compatible. (Hecho: desarrollo en Windows local).  
- Node.js: versión compatible con Next 16 — Node 18+ recomendado. (Inferencia)  
- npm (se detectó package-lock.json). (Hecho)

Instalación
- Desde la raíz del proyecto:
  1. cd C:\dev\ladrillo
  2. npm ci   (o npm install)

Configuración
- Crear/llenar `.env.local` con variables necesarias. Archivo detectado en repo (posible placeholder). Posibles variables requeridas (inferencia):
  - NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL) — [Inferido]
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_ANON_KEY) — [Inferido]
  - NEXT_PUBLIC_MAPBOX_TOKEN (o MAPBOX_TOKEN) — [Inferido]
- Observación: se detectó `.env.local` en la raíz → revisar su contenido localmente. Si contiene secretos: marcar [CREDENCIAL DETECTADA — NO MOSTRAR VALOR].  
- Hecho / Inferencia.

Ejecución (desarrollo)
- npm run dev
  - Lanza Next en modo dev (puerto por defecto 3000 salvo configuración).
- build y produccion:
  - npm run build
  - npm start

Resultado / ubicación de outputs
- `.next/` contiene los artefactos de build y server.  
- `public/` contiene recursos estáticos.  
- Logs de dev: `.next/dev/logs/next-development.log`.  
- Indicación de éxito: servidor responde en http://localhost:3000 y páginas /login y /dashboard cargan sin errores.  
- Hecho.

---

## 8. Inputs

- Variables de entorno (.env.local) — obligatorio para Supabase y Mapbox. (Detectado)  
- Requests HTTP (usuario).  
- Recursos estáticos (public/).  
- Nivel de certeza: Hecho (archivo detectado) + Inferencia (nombres de variables).

---

## 9. Outputs

- Páginas renderizadas HTML/JS/CSS servidas por Next.  
- Artefactos de build en `.next/`.  
- Si hay acciones de backend (supabase): datos persistidos en Supabase DB (externo).  
- Logs en `.next/dev/logs/`.  
- Nivel de certeza: Hecho/Inferencia.

---

## 10. Dependencies

(Extraído de package.json)
- runtime: @supabase/ssr, @supabase/supabase-js, mapbox-gl, next (16.2.6), react (19.2.4), react-dom, react-map-gl. (Hecho)  
- dev: tailwind, eslint, typescript, @types/* (Hecho)

Implicaciones:
- Mapbox/React Map GL para visualización geográfica.  
- Supabase para auth y acceso a datos.  
- Next 16 y React 19 requieren Node >= 18 (ver versión oficial Next). (Inferencia)

---

## 11. External Services

Detectados / Probables:
- Supabase: autenticación y base de datos (usado por cliente y/o SSR). Ubicación: dependencia @supabase y carpeta supabase. (Hecho)
  - Intercambia: credenciales (URL + key), consultas a tablas proyectos, sesiones.
  - Obligatorio: sí (funcionalidad central).
  - Si falla: login/datos no estarán disponibles; UI debe mostrar errores.
- Mapbox: tiles y servicios de mapas (NEXT_PUBLIC_MAPBOX_TOKEN). (Inferido por mapbox-gl/módulos y archivos MapView).
  - Obligatorio para mapa; la app puede degradar si token no está disponible.
- No se detectaron llamadas a otros APIs externos en la lista (sin leer código fuente detallado). (No determinado)

Nivel de certeza: Hecho para existencia de dependencias; detalles de uso son inferidos.

---

## 12. Configuration (detalles)

Configuración obligatoria
- Variables en `.env.local` (necesarias para Supabase y Mapbox). (Detectado)

Configuración opcional
- next.config.ts (ya presente) puede contener flags (images, rewrites, etc.). (Hecho)

Configuración sensible
- `.env.local` y archivos dentro de `.claude/` potencialmente contienen secretos. No mostrar valores.  
- Si se encuentran secretos en el repo: marcar [CREDENCIAL DETECTADA — NO MOSTRAR VALOR]. (Hecho)

Nivel de certeza: Hecho (archivos detectados); nombres de variables inferidos.

---

## 13. Commands and Entry Points

Listado (verificado en package.json):
| Comando | Función | Requiere configuración | Output |
|---|---|---:|---|
| npm run dev | Inicia Next en modo desarrollo | .env.local si usa Supabase/Mapbox | Servidor dev y .next/dev |
| npm run build | Compila para producción | Sí (env) | .next/ build artifacts |
| npm run start | Inicia el build (producción) | Sí | Servidor Next (start) |
| npm run lint | Ejecuta eslint | Opcional | Informe lint |

Entrypoints (rutas observadas)
- /login, /dashboard, /proyectos/[id] (vistas clave). (Hecho)

---

## 14. Error Handling

Observaciones generales
- Next incluye páginas de error (404, 500) en `.next/server/pages`. (Hecho)  
- No se detectaron librerías específicas de retry o backoff; manejo de errores de red probablemente realizado en llamadas a Supabase (no inspeccionado a fondo). (No determinado / Inferencia)
- Logs dev: `.next/dev/logs/next-development.log`. (Hecho)

Qué ocurre cuando falla Supabase/Mapbox
- Supabase no disponible → fallas en login y lectura de datos; comportamiento exacto depende del código (no leído en detalle). (Inferencia)

---

## 15. Persistence and State

- Estado persistente externo: Supabase (base de datos). (Hecho)  
- Estado local en servidor Next: cachés en `.next/` (artefactos), y potencial uso de localStorage/sessionStorage en cliente (no determinado).  
- Archivos generados locales: `.next/`, node_modules/ (Hecho)

---

## 16. Security Review (resumen)

Hallazgos detectados (lectura de estructura, no revisión de contenidos de archivos):
- 🔴 Critical: `.env.local` presente en la raíz del proyecto (potencial exposición de claves si se ha versionado).  
- 🟠 High: `.next/` y `node_modules/` presentes en el repositorio local (a confirmar) — compromete tamaño y puede filtrar información de builds.  
- 🟡 Medium: `.claude/settings.local.json` detectado (posible data sensible de herramientas).  
- ℹ️ Informational: AGENTS.md, CLAUDE.md indican uso de herramientas externas (revisar su contenido).  
- Nivel de certeza: Hecho (existencia de archivos); contenido sensible no verificado en este análisis conforme a restricciones.

Recomendaciones inmediatas
- No commitear `.env.local` ni secretos; mover secretos a vault o variables CI.  
- Añadir `.next/` y `node_modules/` a `.gitignore` si no están ya (ver `.gitignore` detectado). Confirmar historial git para credenciales en commits previos.

---

## 17. Unused / Legacy Components

Observaciones
- El árbol muestra abundantes artefactos `.next` y `node_modules` (esperable). No se detectaron archivos claramente obsoletos por nombre salvo que `.next` está presente (artefacto).  
- Sin inspección de imports en `src/` no es posible confirmar módulos sin uso.  
- Clasificación de certeza:
  - **Confirmado en uso**: package.json scripts; dependencias listadas; rutas app/* presentes en build.  
  - **No se pudo determinar**: archivos en `src/` y `supabase/` sin leer en detalle.  
- Para identificar código no usado: ejecutar herramienta de análisis estático o buscar imports no referenciados. (Recomendado)

---

## 18. Known Limitations / Risks

- Repositorio contiene artefactos de build y node_modules localmente: aumenta riesgos y ruido en revisiones.  
- Dependencia externa (Supabase) crítica: downtime afecta funcionalidad.  
- Exposición accidental de claves en `.env.local` o archivos de config.  
- Mapbox token uso → facturación/limites si token no está configurado correctamente.  
- Actualizaciones de Next/React o de mapbox-gl pueden romper APIs — pin de versiones actuales observado.  
- Nivel de certeza: Inferencia + Hecho donde corresponde.

---

## 19. Troubleshooting

- Si la app no arranca:
  1. Verificar Node >=18 y npm.  
  2. Ejecutar `npm ci` y revisar errores de instalación (bindings nativos como sharp pueden requerir build tools).  
  3. Confirmar `.env.local` con variables de Supabase y Mapbox.  
  4. Revisar `.next/dev/logs/next-development.log` para stack traces.  
- Si login falla: revisar consola de Supabase (proyectos/keys) y verificar claves.  
- Si mapas no cargan: validar `NEXT_PUBLIC_MAPBOX_TOKEN` y revisar consola del navegador por errores de CORS o 401 de Mapbox.

---

## 20. Technical Debt / Improvement Opportunities

- Evitar commitear `.next/` y `node_modules` en el repositorio; limpiar historial si ya se han subido secretos.  
- Centralizar variables sensibles (secret manager/CI).  
- Añadir pruebas unitarias / E2E (no se encontraron tests en la inspección inicial).  
- Documentar nombres exactos de variables de entorno y formatos esperados en README.  
- Añadir manejo de errores y reintentos para llamadas externas (Supabase/Mapbox).

---

## 21. Appendix

### File Inventory (selección relevante)
- package.json — scripts & dependencias. (Hecho)
- .env.local — archivo de entorno (detectado; posiblemente sensible). (Hecho)
- next.config.ts — configuración Next (presente). (Hecho)
- tsconfig.json / types — TypeScript config. (Hecho)
- public/ — assets (favicon, fonts). (Hecho)
- src/ — código fuente (app/, componentes — rutas login/dashboard/proyectos). (Hecho)
- supabase/ — cliente / helpers Supabase. (Hecho)
- .claude/settings.local.json — herramienta de soporte local. (Hecho)
- .next/ — build artifacts. (Hecho)

(Tabla completa de todos los archivos es extensa; se usaron listados automáticos para identificar rutas clave.)

### Environment Variables (posibles — inferidos)
- NEXT_PUBLIC_SUPABASE_URL — URL del proyecto Supabase. (Inferido)  
- NEXT_PUBLIC_SUPABASE_ANON_KEY — clave pública/anon. (Inferido)  
- SUPABASE_SERVICE_KEY / SUPABASE_KEY — si se usan operaciones server-side. (Posible)  
- NEXT_PUBLIC_MAPBOX_TOKEN — token Mapbox para tiles. (Inferido)

Si alguno está presente en `.env.local` localmente: marcar como [CREDENCIAL DETECTADA — NO MOSTRAR VALOR].

### Important Files / First Files to Read
- src/app/login/page.tsx (o página equivalente) — flujo de auth. (Inferido)  
- src/app/dashboard/page.tsx — dashboard y query a Supabase. (Inferido)  
- src/components/MapView.tsx — integración con react-map-gl/mapbox-gl. (Inferido)  
- supabase/ (cliente) — init y usage de Supabase. (Hecho/Inferido)  
- next.config.ts — rewrites/experimental flags. (Hecho)

---

## 22. How to Understand This Project in 10 Minutes

1. Qué hace el proyecto:
   - Web app Next.js para login y gestión/visualización de “proyectos” con mapas (Mapbox + Supabase). (Inferido)
2. Flujo principal:
   - Login → Dashboard → Seleccionar proyecto → Ver mapa y detalles. (Inferido)
3. Qué archivo/comando mirar primero:
   - package.json (scripts) y luego `src/app/login/page.*` y `src/app/dashboard/page.*`.  
   - Comando: `npm run dev`. (Hecho)
4. Componentes más importantes:
   - Cliente Supabase (supabase/), MapView (componentes), páginas app/*. (Hecho)
5. Dónde están las configuraciones:
   - `.env.local`, `next.config.ts`. (Hecho)
6. Dónde entran los datos:
   - Peticiones a Supabase (desde client/SSR). (Inferido)
7. Dónde se procesan:
   - En Next (SSR) y en el cliente React. (Inferido)
8. Dónde salen los resultados:
   - HTML/JS servidos por Next y cambios persistidos en Supabase; artefactos en `.next/`. (Hecho)
9. Qué evitar modificar sin entender:
   - Código de autenticación (supabase client), MapView y next.config.ts (puede romper SSR/rutas).  
10. Qué leer primero para mantener/extender:
    - `supabase/` (cliente), `src/app/login`, `src/app/dashboard`, `src/components/MapView`, `next.config.ts`.

---

## 23. Nivel de certeza (metodología)
- "Hecho": verificado directamente (existencia de archivos, dependencias, rutas generadas en .next, package.json).  
- "Inferido": deducido por nombres, dependencias y presencia de artefactos (por ejemplo, uso exacto de variables de entorno o detalles de implementación).  
- "No determinado": cuando la información no está disponible sin abrir/leer archivos específicos (por restricción o por alcance).

---

Fin del análisis.  

Notas operativas:
- No se modificó, creó ni eliminó ningún archivo en C:\dev\ladrillo durante este análisis.  
- Si querés que genere un archivo PROJECT_DOCUMENTATION.md directamente dentro de C:\dev\ladrillo, indicamelo explícitamente (actualmente no creé archivos en esa carpeta por tu restricción original).