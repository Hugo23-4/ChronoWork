# ⏳ ChronoWork

> 
> **Sistema Integral de Registro de Jornada Laboral.** Solución diseñada para automatizar y securizar el control horario laboral, garantizando la transparencia e inviolabilidad de los datos según la normativa vigente. 
> 
> 


## 🌍 Visión del Proyecto

ChronoWork nace para solucionar la inseguridad jurídica de los sistemas manuales de registro, ofreciendo una herramienta centralizada y segura. El sistema se fundamenta en la **integridad absoluta del dato**, actuando como la única "fuente de verdad" donde los registros son intocables y actúan como evidencia auditable. 

### 🚀 Funcionalidades Principales

* 
**Sistema de Fichaje:** Registro intuitivo de entrada (Clock-in) y salida (Clock-out). 


* 
**Gestión de RRHH:** Módulo CRUD completo para la administración de empleados y contratos. 


* 
**Workflows de Solicitud:** Flujo formal de aprobación para correcciones de errores y ausencias. 


* 
**Auditoría y Transparencia:** Registro de logs inmutables de cada modificación para garantizar la confianza operativa. 


* 
**Reporting Legal:** Generación de informes exportables en formatos PDF y Excel listos para inspecciones. 




## 🛠️ Stack Tecnológico

Arquitectura cliente-servidor desacoplada diseñada para la escalabilidad. 

| Componente | Tecnología | Descripción |
| --- | --- | --- |
| **Frontend** | <br>[Next.js](https://nextjs.org/) 

 | Framework de React con TypeScript para una SPA robusta. 

 |
| **Backend** | <br>[NestJS](https://nestjs.com/) 

 | Framework de Node.js con TypeScript para una API RESTful escalable. 

 |
| **Base de Datos** | <br>[PostgreSQL](https://www.postgresql.org/) 

 | Motor relacional robusto gestionado vía [Supabase](https://supabase.com/). 

 |
| **UI Framework** | [Bootstrap 5](https://getbootstrap.com/) | Diseño profesional y responsive adaptable a dispositivos móviles. 

 |


## 👥 Roles y Permisos (RBAC)

El acceso está regido por permisos granulares definidos por roles: 

* 
**Empleado:** Realiza fichajes, consulta su cómputo de horas y gestiona sus propias solicitudes. 


* 
**Administrador (RRHH):** Gestión integral de la plantilla, contratos y aprobación de flujos de trabajo. 


* 
**Inspector:** Acceso de solo lectura a todos los registros y logs de auditoría para verificación legal. 




## 🧱 Estructura del Repositorio

```
chronowork/
├── apps/
[cite_start]│   ├── frontend/    # Aplicación Web (Next.js) [cite: 105]
[cite_start]│   └── backend/     # API REST (NestJS) [cite: 106]
[cite_start]├── docs/            # Documentación técnica y funcional [cite: 176]
[cite_start]│   └── references/  # Especificaciones originales y diagramas de BBDD [cite: 175]
└── .github/         # Governance y automatización

```


## 🧑‍💻 Autoría e Institución

* 
**Alumno:** Hugo Pérez Muñoz. 


* 
**Institución:** IES Albarregas (Mérida, España). 


* 
**Proyecto:** Fin de Grado (DAW) - Curso 24/25. 

