# Guía de Contribución - ChronoWork

Para mantener la calidad, seguridad y escalabilidad de **ChronoWork**, todos los cambios en el código deben seguir estrictamente estas normas de gobernanza. Este proyecto se rige por el principio de **integridad del dato** y **transparencia operativa**.

## 1. Estrategia de Ramas (Git Flow)

Utilizamos el modelo **Git Flow** para gestionar el ciclo de vida del software de forma organizada:

* 
**`main`**: Rama de producción. Contiene el código estable y desplegado. **Prohibido realizar commits directos**.


* **`develop`**: Rama principal de integración. Todo el desarrollo nuevo converge aquí antes de pasar a producción.
* **`feature/`**: Ramas para nuevas funcionalidades (ej: `feature/fichaje-geolocalizado`). Se abren desde `develop`.
* **`fix/`**: Ramas para corrección de errores (ej: `fix(api)/error-fichaje-salida`).
* **`docs/`**: Ramas exclusivas para actualizaciones de documentación técnica o funcional.

## 2. Convención de Mensajes de Commit

Es obligatorio seguir el estándar **Conventional Commits** para facilitar la legibilidad del historial y la generación automática de changelogs.

**Formato:** `<tipo>(<alcance>): <descripción breve en imperativo>`

**Tipos aceptados:**

* **`feat`**: Una nueva característica o funcionalidad.
* **`fix`**: Corrección de un fallo técnico o bug.
* 
**`docs`**: Cambios exclusivamente en la documentación.


* **`refactor`**: Cambios en el código que no corrigen errores ni añaden funciones (mejoras de diseño).
* **`chore`**: Tareas de mantenimiento, actualización de dependencias o configuración de herramientas.
* **`style`**: Cambios que no afectan la lógica (espacios, formato, puntos y comas).

## 3. Estándares de Ingeniería

### Documentación como Código

No se debe iniciar la implementación de ninguna funcionalidad sin que los requisitos técnicos y casos de uso estén previamente definidos en la carpeta `docs/`.

### Integridad y Seguridad

* **Protección de Datos**: Cualquier cambio en la lógica de negocio debe respetar la **inviolabilidad del registro horario**. Los administradores no deben poder modificar fichajes de forma unilateral.


* 
**Segregación de Responsabilidades**: El código debe mantener una separación clara entre la gestión de usuarios (Seguridad) y la gestión de recursos humanos (RRHH) .


* 
**Tipado**: Se exige el uso estricto de **TypeScript** en Frontend y Backend; se debe evitar el uso de `any` para garantizar la robustez del sistema .



## 4. Proceso de Pull Request (PR)

1. Asegúrate de que tu rama esté actualizada con `develop`.
2. El mensaje del PR debe explicar claramente **qué** cambia y **por qué** (referenciando el requisito funcional si aplica).
3. Todo código nuevo debe pasar las pruebas unitarias y de integración antes de ser fusionado.

