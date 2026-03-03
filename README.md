# ⏳ ChronoWork

> **Sistema Integral de Registro de Jornada Laboral.** Solución web diseñada para automatizar y securizar el control horario laboral, garantizando la transparencia e inviolabilidad de los datos según la normativa vigente en España.

## 🌍 Visión del Proyecto

ChronoWork nace para solucionar la inseguridad jurídica de los sistemas manuales de registro (como Excel o papel), ofreciendo una herramienta centralizada y segura. El sistema se fundamenta en la **integridad absoluta del dato**, actuando como la única "fuente de verdad" donde los registros (fichajes) son intocables y actúan como evidencia auditable para inspecciones.

### 🚀 Funcionalidades Principales

* **Sistema de Fichaje (Geolocalizado):** Registro intuitivo de entrada y salida con validación de ubicación (Geofencing).
* **Gestión de RRHH:** Módulo completo para la administración de empleados, centros de trabajo y métricas en tiempo real.
* **Workflows de Solicitud:** Flujo formal de aprobación para vacaciones, bajas médicas y correcciones de errores.
* **Auditoría y Transparencia:** Registro estricto para garantizar la confianza operativa y evitar manipulaciones.
* **Directorio Activo:** Interfaz móvil y de escritorio con acciones rápidas para contacto interno de la plantilla.

## 🛠️ Stack Tecnológico (Evolución de Arquitectura)

Aunque inicialmente se valoró una arquitectura tradicional (Frontend separado del Backend), el proyecto ha evolucionado hacia una **Arquitectura Serverless y Backend-as-a-Service (BaaS)**, optimizando tiempos de respuesta y escalabilidad:

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **FullStack Framework** | [Next.js 14](https://nextjs.org/) | App Router (React + TypeScript) gestionando tanto la interfaz gráfica (Client Components) como la lógica de servidor (Server Actions). |
| **Base de Datos & Backend** | [Supabase](https://supabase.com/) | Motor relacional robusto (PostgreSQL) que integra Autenticación, Storage para justificantes y Row Level Security (RLS). |
| **Diseño / UI** | [Bootstrap 5](https://getbootstrap.com/) | Diseño profesional, *mobile-first* y responsive, adaptado a vistas de administrador y empleado. |

## 👥 Roles y Permisos (RBAC)

El acceso está regido por permisos granulares en base de datos:

* **Empleado:** Realiza fichajes, consulta su cómputo de horas y gestiona sus propias solicitudes de ausencia o baja.
* **Administrador (RRHH):** Gestión integral de la plantilla, creación de sedes geolocalizadas, panel de métricas en tiempo real y resolución de solicitudes.
* **Inspector:** (Proyección) Acceso de solo lectura para verificación legal de los registros inmutables.

## 📂 Estructura del Proyecto y Documentación

Toda la documentación requerida para la evaluación del proyecto se encuentra centralizada en el directorio `/docs` de este repositorio:

```text
chronowork/
├── src/                 # Código fuente de la aplicación (Componentes, Rutas, Context)
├── docs/                # Documentación oficial para la evaluación
│   ├── 1_Manual_Usuario.md     # Guía visual de uso, pantallas y operativas.
│   ├── 2_Manual_Tecnico.md     # Arquitectura, Modelo Relacional, Requisitos funcionales.
│   ├── 3_Manual_Despliegue.md  # Instrucciones para levantar el entorno.
│   └── 4_Manual_Proyecto.md    # Cronograma, metodología e hitos.
└── README.md            # Presentación inicial del proyecto