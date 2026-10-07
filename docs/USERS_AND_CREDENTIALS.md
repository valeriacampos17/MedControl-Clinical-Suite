# Usuarios y Credenciales — MedControl Clinical Suite

> Fuente de verdad: tabla `users` (SQLite), sembrada en `server/src/db/seed.ts`.
> Las contraseñas se guardan hasheadas con bcrypt; admin y médicos del seed
> comparten contraseñas de prueba.

---

## Credenciales

| # | Rol | Nombre | Email | Contraseña |
|---|---|---|---|---|
| 1 | Administrador | Administradora Central | `admin@medcontrol.com` | `admin123` |
| 2 | Médica | Dra. Noemí Aguirre | `aguirre@medcontrol.com` | `doctor123` |
| 3 | Médico | Dr. Jorge Mawad | `mawad@medcontrol.com` | `doctor123` |
| 4 | Médica | Dra. Sandra Muñoz | `munoz@medcontrol.com` | `doctor123` |

**Contraseña por defecto de médicos:** `doctor123`

---

## Acceso por rol

### Administrador (`admin`)
| Módulo | Acceso |
|---|---|
| Dashboard de Citas | Sí — puede ver TODOS los médicos y filtrar por cada uno |
| Pacientes & Historial Clínico | Sí |
| Agenda & Disponibilidad | Sí |
| Recetas & Exámenes | Sí |
| Notificaciones & Alertas | Sí |
| Configuración del Sistema | Sí |
| Header: Configuración | Visible |
| Header: Cerrar Sesión | Visible |

### Médico (`doctor`)
| Módulo | Acceso |
|---|---|
| Dashboard de Citas | Sí — solo ve SUS citas (bloqueado a su doctorId) |
| Pacientes & Historial Clínico | Sí |
| Recetas & Exámenes | Sí |
| Notificaciones & Alertas | Sí |
| Agenda & Disponibilidad | **NO** |
| Configuración del Sistema | **NO** |
| Header: Configuración | **NO** (oculto) |
| Header: Mi Agenda Clínica | Visible |

---

## Notas de implementación

- Auth persistente vía JWT (8h) con la tabla `users`; los refrescos restauran la sesión con `GET /auth/me`.
- **Creación de usuarios (admin):** el POST `/config/users` genera una **contraseña efímera** que se entrega **una sola vez** en la respuesta y se muestra en pantalla al crear; la cuenta queda marcada con `must_change_password=1`.
- **Cambio obligatorio:** si `must_change_password=1`, el login redirige a `/cambiar-contrasena` (`POST /auth/change-password`) y no se permite navegar al resto de la app hasta cambiarla.
- "Credenciales de prueba" en el login muestra las 4 cuentas del seed.
- `AuthService.getDoctorId()` devuelve el `doctorId` asociado al usuario (solo médicos).
- `AuthService.isDoctor()` fuerza el dashboard a mostrar solo las citas del médico logueado (`selectedDoctorId` bloqueado a su id en el constructor de `DashboardComponent`).
- Archivos relacionados:
  - `server/src/routes/auth.routes.ts` — login, /me, change-password
  - `server/src/routes/config.routes.ts` — CRUD de usuarios (contraseña efímera)
  - `server/src/db/migrate.ts` — fusión de `catalog_users` → `users`, columna `must_change_password`
  - `src/app/core/services/auth.service.ts` — servicio de auth (login/logout/restore)
  - `src/app/core/guards/auth.guard.ts` — guard de rutas + redirección a cambio de contraseña
  - `src/app/views/cambiar-contrasena/cambiar-contrasena.component.ts` — pantalla de cambio obligatorio
  - `src/app/app.routes.ts` — rutas protegidas con `canActivate: [authGuard]`

> Nota: las cuentas que antes se creaban por el catálogo (sin contraseña) se
> fundieron en `users` con un hash inutilizable y `must_change_password=1`.
> Como nadie conoce su contraseña, no pueden entrar hasta tener un flujo de
> "reset"; deben volverse a crear con la contraseña efímera del CRUD.
