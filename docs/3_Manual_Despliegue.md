# 🚀 Manual de Despliegue - ChronoWork

Este documento describe los pasos necesarios para instalar, configurar y desplegar la aplicación ChronoWork tanto en un entorno de desarrollo local como en producción.

> **Nota sobre la evolución tecnológica:** Inicialmente, durante la fase de planificación, se contempló el uso de servidores tradicionales como Apache Tomcat para el despliegue. Sin embargo, al adoptar **Next.js** (framework basado en Node.js y React) para optimizar el rendimiento y usar una arquitectura *Serverless*, el modelo de despliegue evolucionó hacia entornos modernos (Node/Vercel), prescindiendo de contenedores de servlets Java.

---

## 1. Requisitos Previos

Para ejecutar ChronoWork, la máquina host debe contar con el siguiente software instalado:

* **Node.js:** Versión 18.x o superior.
* **Gestor de paquetes:** `npm` (incluido con Node.js), `yarn` o `pnpm`.
* **Git:** Para clonar el repositorio.
* **Cuenta en Supabase:** Para alojar y gestionar la base de datos PostgreSQL y los buckets de Storage.

---

## 2. Despliegue en Entorno Local (Desarrollo)

Sigue estos pasos para ejecutar la aplicación en tu propio ordenador:

### Paso 2.1. Clonar el repositorio
Abre una terminal y clona el proyecto desde GitHub:
\`\`\`bash
git clone https://github.com/Hugo23-4/chronowork.git
cd chronowork
\`\`\`

### Paso 2.2. Instalar dependencias
Instala todas las librerías necesarias definidas en el `package.json`:
\`\`\`bash
npm install
\`\`\`

### Paso 2.3. Configurar Variables de Entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto. Este archivo conectará tu código con la base de datos de Supabase. Añade las siguientes credenciales:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
\`\`\`
*(Estas claves se obtienen en el panel de control de Supabase > Project Settings > API).*

### Paso 2.4. Ejecutar el servidor de desarrollo
Inicia la aplicación en modo local:
\`\`\`bash
npm run dev
\`\`\`
La aplicación estará disponible en tu navegador accediendo a: **`http://localhost:3000`**

---

## 3. Despliegue en Producción

Para que la aplicación esté disponible de forma pública y segura en internet, recomendamos el uso de **Vercel** (creadores de Next.js), que automatiza el despliegue *Serverless*.

### Paso 3.1. Preparar la Base de Datos (Supabase)
1. Ejecuta los scripts SQL de inicialización en el SQL Editor de Supabase para crear las tablas (`empleados_info`, `fichajes`, `sedes`, etc.).
2. Crea los buckets de Storage necesarios (`avatars` y `justificantes`) y asegúrate de que las políticas RLS están activadas y configuradas.

### Paso 3.2. Despliegue del Frontend/Backend en Vercel
1. Crea una cuenta gratuita en [Vercel](https://vercel.com).
2. Conecta tu cuenta de GitHub y selecciona el repositorio `chronowork`.
3. En el apartado **"Environment Variables"** de Vercel, añade las mismas variables que usaste en local:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Haz clic en **"Deploy"**.

Vercel compilará la aplicación (`npm run build`) y generará una URL pública segura (HTTPS), requisito indispensable para que la API de Geolocalización (GPS) funcione correctamente en dispositivos móviles.