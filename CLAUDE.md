# ChronoWork — Contexto del Proyecto

> Contexto adicional en Obsidian: `C:\Users\Hugo\Documents\COG-Second-Brain\04-projects\chronowork\`
> Si existe `ACTIVE-TASK.md` en este directorio, leerlo antes de cualquier tarea.

## ¿Qué es ChronoWork?

Sistema integral de **registro de jornada laboral** para el mercado español. Garantiza integridad de datos e inmutabilidad de fichajes según normativa laboral vigente. Los fichajes actúan como evidencia auditable para inspecciones laborales.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 — App Router, Server Actions, TypeScript |
| UI | Bootstrap 5 + CSS Modules. Mobile-first. Framer Motion para animaciones |
| Fuentes | Inter + Plus Jakarta Sans (via `next/font/google`) |
| Temas | `next-themes` (light/dark) |
| Auth | Supabase Auth — gestión de sesiones y roles |
| Base de datos | PostgreSQL via Supabase — RLS habilitado |
| Storage | Supabase Storage — buckets: `avatars`, `justificantes` |
| Geolocalización | PostGIS / cálculos lat/lon para geofencing |
| Deploy | Vercel (Serverless) |
| Monitorización | Vercel Speed Insights |

## Estructura del proyecto

```
C:\ChronoWork\
├── apps/frontend/src/
│   ├── app/
│   │   ├── admin/          # Rutas de administración (RRHH)
│   │   │   ├── centros/    # Centros de trabajo / sedes
│   │   │   ├── fichajes/   # Gestión de fichajes (admin)
│   │   │   ├── pausas/     # Gestión de pausas
│   │   │   ├── solicitudes/# Aprobación de solicitudes
│   │   │   ├── turnos/     # Gestión de turnos
│   │   │   └── usuarios/   # Gestión de empleados
│   │   ├── dashboard/      # Panel del empleado
│   │   │   ├── admin/      # Sub-panel admin dentro dashboard
│   │   │   ├── ajustes/    # Configuración de cuenta
│   │   │   ├── auditoria/  # Log de auditoría
│   │   │   ├── exportar/   # Exportación de datos
│   │   │   ├── fichajes/   # Historial de fichajes del empleado
│   │   │   ├── perfil/     # Perfil del empleado
│   │   │   └── solicitudes/# Solicitudes del empleado
│   │   ├── inspector/      # Vista read-only para inspectores
│   │   ├── auth/           # Login, select-role
│   │   └── layout.tsx      # Root layout con providers
│   ├── components/
│   │   ├── AuditCard.tsx
│   │   ├── HistoryCard.tsx
│   │   ├── MobileNav.tsx
│   │   ├── ScannerView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── inspector/
│   │   └── ui/
│   ├── context/
│   │   └── AuthContext.tsx  # Provider global de autenticación
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts
│   └── middleware.ts        # Protección de rutas por rol
└── docs/
    ├── 1_Manual_Usuario.md
    ├── 2_Manual_Tecnico.md
    ├── 3_Manual_Despliegue.md
    └── 4_Manual_Proyecto.md
```

## Roles del sistema

| Rol | Acceso |
|---|---|
| `empleado` | Fichajes propios, historial, solicitudes de ausencia |
| `administrador` | Gestión completa de plantilla, sedes, métricas, aprobaciones |
| `inspector` | Read-only para verificación legal |

## Modelo de datos (tablas clave)

| Tabla | Descripción |
|---|---|
| `empleados_info` | Extiende Supabase Auth. DNI, teléfono, departamento, `sede_id`, `rol_id` |
| `sedes` | Centros de trabajo con coordenadas y `radio_metros` para geofencing |
| `fichajes` | **Inmutable**. Entrada/salida con coordenadas independientes |
| `solicitudes` | Workflows: vacaciones, bajas médicas (con URL justificante en Storage) |
| `roles` | Tabla maestra de roles |
| `empresas` | Multi-tenant |

## Principios de arquitectura

- **Fichajes inmutables**: nunca se modifican directamente. Cambios via "Solicitud de Corrección" con audit trail
- **RLS en todas las tablas**: empleado solo ve sus datos; admin tiene visión global
- **UUIDs** en todos los IDs para prevenir enumeración
- **Server Actions** para mutaciones — no API routes salvo casos específicos
- **Supabase como única fuente de verdad** — no duplicar estado en cliente

## Convenciones de código

- TypeScript estricto — sin `any` salvo casos muy justificados
- Componentes en PascalCase, rutas en kebab-case (Next.js App Router)
- Server Components por defecto; `'use client'` solo cuando sea necesario
- Estilos: Bootstrap 5 clases + CSS Modules para customización. No Tailwind
- No inventar datos — todo viene de Supabase via Server Actions o queries

## Integraciones activas (MCPs)

- **GitHub**: repo principal del proyecto
- **Supabase**: acceso directo a DB, auth, storage
- **Vercel**: deploy y gestión de entornos
