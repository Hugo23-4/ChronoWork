# 🛠️ Manual Técnico - ChronoWork

Este documento detalla la arquitectura, las tecnologías utilizadas, el diseño de la base de datos y los requisitos del sistema para el proyecto ChronoWork.

---

## 1. Arquitectura y Tecnologías Utilizadas

El sistema se ha construido utilizando una arquitectura moderna **Serverless** y **Backend-as-a-Service (BaaS)**, lo que garantiza alta disponibilidad, seguridad y un despliegue ágil.

### Frontend & Lógica de Servidor (FullStack)
* **Framework:** Next.js 14 (App Router).
* **Lenguaje:** TypeScript.
* **Estilos y UI:** Bootstrap 5, CSS Modules y diseño *Mobile-First*.
* **Características:** Renderizado híbrido (SSR y CSR), Server Actions para la mutación de datos segura y gestión de estado mediante React Context.

### Backend & Base de Datos
* **Plataforma:** Supabase (BaaS).
* **Base de Datos:** PostgreSQL.
* **Módulos Utilizados:**
  * **Supabase Auth:** Autenticación de usuarios y gestión de sesiones.
  * **Supabase Storage:** Almacenamiento en la nube (Bucket `avatars` para perfiles y `justificantes` para bajas médicas).
  * **PostGIS / Cálculos Geográficos:** Funciones para el cálculo de distancias (Geofencing) basadas en latitud y longitud.

---

## 2. Requisitos del Sistema

### 2.1. Requisitos Funcionales (RF)
* **RF-Autenticación:** Gestión de roles (Empleado, Administrador, Inspector) con permisos diferenciados.
* **RF-Fichaje:** Sistema de *Clock-in* y *Clock-out* con validación de ubicación GPS (Geofencing).
* **RF-Gestión:** Módulo CRUD completo para empleados, configuración de perfiles y asignación de centros de trabajo.
* **RF-Workflows:** Sistema de solicitud y aprobación para ausencias, vacaciones y correcciones de fichajes.
* **RF-Informes:** Panel de control (*Dashboard*) con métricas en tiempo real y generación de reportes.
* **RF-Auditoría:** Registro de logs de modificaciones en los fichajes, garantizando la trazabilidad.

### 2.2. Requisitos No Funcionales (RNF)
* **RNF-Seguridad:** Encriptación de contraseñas, uso obligatorio de HTTPS y políticas RLS (Row Level Security) en la base de datos.
* **RNF-Integridad:** Garantizar que los fichajes no puedan ser modificados unilateralmente sin dejar un rastro de auditoría.
* **RNF-Rendimiento:** Tiempos de respuesta optimizados para operaciones críticas (carga del dashboard y validación GPS).
* **RNF-Usabilidad:** Interfaz intuitiva, clara y completamente *responsive* (adaptable tanto a ordenadores de escritorio como a dispositivos móviles).

---

## 3. Modelo Relacional y Base de Datos

Nuestra filosofía de datos se basa en la **"Confianza en el Dato"** y la segregación de responsabilidades. La base de datos actúa como la única *Source of Truth* (Fuente de Verdad).

### 3.1. Tablas Principales
El esquema relacional está diseñado de forma modular:

1. **`empleados_info`:** Extiende los datos del usuario autenticado (Auth). Almacena DNI, teléfono, departamento, cargo y relaciona al empleado con su `sede_id` y `rol_id`.
2. **`sedes`:** Almacena los centros de trabajo con sus coordenadas (`latitud`, `longitud`) y el `radio_metros` permitido para el geofencing.
3. **`fichajes`:** Tabla crítica. Almacena las horas exactas y las coordenadas independientes tanto de entrada (`latitud_entrada`, `longitud_entrada`) como de salida.
4. **`solicitudes`:** Gestiona los flujos de trabajo (vacaciones, bajas médicas) incluyendo URLs a los justificantes almacenados en Supabase Storage.
5. **`roles` y `empresas`:** Tablas maestras para la gestión de permisos y entorno multi-tenant.

### 3.2. Seguridad a Nivel de Base de Datos
* **Identificadores Únicos (UUID):** Implementados para proteger contra ataques de enumeración.
* **Row Level Security (RLS):** Las políticas de PostgreSQL aseguran que un empleado normal solo pueda leer y escribir sus propios fichajes, mientras que un administrador tiene visión global.
* **Log Inmutable:** Las modificaciones en los fichajes se procesan mediante un flujo de "Solicitud de Cambio", evitando la alteración directa y manteniendo el historial original intacto.