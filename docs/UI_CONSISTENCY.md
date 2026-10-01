# Consistencia visual: inventario y decisiones pendientes

Este documento **no es una lista de tareas**. Es el resultado de una lectura
completa del frontend (39 archivos, ~10.700 lineas) hecha para responder una
pregunta acotada: si los dos calendarios de la app se veian igual.

La respuesta fue que casi se ven igual y aun asi se leian distintos. Al
corregir solo esos dos, quedo claro que el problema de fondo no es local: no
existe ningun componente de card ni de cabecera de seccion, asi que **cada
vista reconstruye el patron a mano y ninguna tiene la obligacion de coincidir
con las demas**.

Eso no se toco a proposito. Este archivo deja el hallazgo medido para
decidirlo despues.

## Decision pendiente: que calendario es la referencia

Los dos calendarios quedaron alineados tomando **configuracion como
referencia**, porque su chip de icono (`w-8 h-8 rounded-lg` con un icono
`material-symbols`) y su titulo de 16px son el patrón mayoritario en la app:
configuracion (7), recetas (2), y los modales de dashboard (3).

La direccion inversa tambien es defendible: agenda tiene algo que
configuracion no tiene, que es la numeracion de pasos (1 a 4) de un flujo.

Lo que **no** se decidio es si el patron debe vivir en un componente
reutilizable o seguir siendo markup repetido. Ver abajo.

## 1. Tamano de titulo de card: cinco valores

El mismo rol semantico (titulo de seccion dentro de un card) aparece en cinco
tamanos distintos.

| Tamano | Ocurrencias | Ejemplos |
|---|---|---|
| `text-[15px]` | 16 | consulta (7), paciente (2), dashboard (2), agenda (5) |
| `text-[16px]` | 14 | recetas (2), configuracion (7), doctor-config (3), modales de dashboard (3) |
| `text-[17px]` | 3 | dashboard:229, `clinical-history-timeline`, `modal` |
| `text-[18px]` | 1 | consulta:402 |
| `text-[20px]` | 1 | patient-history:337 (estado vacio) |

Ninguno esta centralizado. Para titulo de pagina hay un patron mucho mas
sano: 6 de 8 vistas repiten `text-[20px] sm:text-[22px] font-bold
text-[#191c1e] tracking-tight`. Rompen `consulta` (18px, sin `tracking-tight`)
y `patient-history` (18 → 22 → 24 en tres breakpoints).

## 2. Chip de icono: cuatro contenedores

| Contenedor | Donde |
|---|---|
| `w-8 h-8 rounded-lg` | la mayoria (consulta, paciente, recetas, configuracion) |
| `w-9 h-9 rounded-lg` | dashboard (4), alertas, timeline |
| `w-10 h-10 rounded-xl` | `modal` compartido |
| `w-7 h-7 rounded-full` | numerales de los pasos de agenda |

El glyph va en `text-[20px]` con el `w-8` y en `text-[22px]` con el `w-9`, lo
que es coherente dentro de cada grupo pero rompe entre grupos.
`consulta:403` no fija tamano y lo hereda.

### El color del chip cambia de significado

Este es el hallazgo que mas confunde, porque el mismo color no significa lo
mismo segun donde este:

- `bg-[#ffdad6] text-[#ba1a1a]` es rojo en consulta ("Signos Vitales") y en
  `patient-history:252`, pero solo `bg-[#ffdad6]/40` en
  `patient-history:256`: **la misma seccion, a cuatro lineas de distancia,
  con dos intensidades del mismo rojo**.
- `bg-[#ecfdf5] text-[#065f46]` para "Recetas Médicas" en consulta, contra
  `bg-[#006a61]/10 text-[#006a61]` para la **misma seccion** "Recetas Médicas"
  en recetas.
- El teal de marca aparece como `bg-[#86f2e4]/30 text-[#006f66]` en dashboard
  y paciente, y como `bg-[#006a61]/10 text-[#006a61]` en timeline y modal.

Ninguno de esto esta tokenizado.

## 3. Separador de cabecera: tres estilos

| Estilo | Donde |
|---|---|
| `border-b border-[#eceef0]` | dashboard, agenda (4), doctor-config (3) |
| `pb-3 mb-4` sin borde | consulta (7), paciente (2), dashboard (2), tabs de configuracion (7) |
| sin separador | `exams`, `medications`, `diagnoses`, `alerts`, `users`, `triage`, `organization` |

Ademas `pb-3 mb-3` (agenda) contra `pb-3 mb-4` (configuracion) para la misma
semantica, y el subtitulo es `<p>` en casi todos menos `dashboard:232`, que
usa `<span>`.

## 4. Botones primarios hechos a mano

`app-button` tiene seis variantes y tres tamanos bien definidos, y casi todo
se usa. Quedan **unos 20 botones primarios escritos a mano** en vez de usar el
componente:

| Patron | Donde | Desviacion |
|---|---|---|
| `login.component.ts:67` | "Iniciar Sesion" | el boton primario mas obvio de la app no usa `app-button` |
| `consulta.component.ts:33` | FAB "Guardar" | `hover:bg-[#00564f]` (verde distinto), `rounded-full`, `shadow-lg`, `font-bold` |
| `dashboard:840`, `:913` | guardar / reagendar | sin `shadow-sm`, sin `gap`, `disabled:opacity-40` |
| `dashboard:726` | check-in | `font-semibold` en vez de `font-medium` |
| `dashboard:837`, `:906` | cancelar | duplica `variant="light"` a mano |

Variantes distintas para el mismo rol:

- **Nuevo/agregar**: `icon="add"` (6 sitios), `icon="person_add"`
  (`users`), y `variant="outline"` (`triage:52`, `patient-history:393`). El
  mismo triage usa `primary` en la linea 21 y `outline` en la 52.
- **Cancelar**: `variant="light" md` (7), `variant="light"` sin `size` (3), y
  manual (2).
- **Estado disabled**: tres opacidades distintas, `opacity-50` (el sistema),
  `opacity-40` (`dashboard:913`), `opacity-40 pointer-events-none`
  (`consulta:205`).

## 5. Estados vacios: tres redacciones

Para lo mismo hay tres recursos distintos:

- **con dato de filtro**: `Sin resultados para "X"` (consulta, selection-picker),
  `No se encontraron pacientes con X` (agenda)
- **lista vacia**: `Aún no hay X` (4 sitios) contra `No hay X` (3 sitios)
- **seccion sin historial**: `Sin X` / `No registra X`

Mas `Faltan Datos` (11), que es un titulo en lugar de una frase.

Tamanos: `text-[12px]`, `text-[12.5px]`, `text-[13px]`, `text-[16px]`.
Contenedores: `p-8` a secas (8 sitios) contra `p-8` con icono de 32px
(3 sitios) contra `p-8 sm:p-14`.

## 6. Terminologia

- **Signos vitales con cuatro nombres**: `Frecuencia / Pulso`, `Frec.
  Cardiaca`, `Pulso (FC)`, `Pulso (bpm)`. Y la temperatura como `Temp.`,
  `Temperatura` o `Temp (°C)`.
- **El identificador del paciente con tres nombres**: `Expediente {{id}}`,
  `CI`, `ID`.
- **Tuteo mezclado**: `Ingrese` y `Marcar` (formal) junto a `Pulse`, `Use`,
  `Agregue` (informal).
- **Plurales a mano**: `fármaco(s) registrado(s)`,
  `prescripción(es) registrada(s)`, `atenciones médica(s)`.
- **Titulos en Title Case y Sentence case**: `Mantenimiento de Catálogos`
  contra `Búsqueda de Historial`, para el mismo rol.
- **Elipsis**: `...` (ASCII) contra `…` (U+2026) en la misma app.
- **Alergias**: `ALERGIAS:` en mayusculas sin `uppercase` CSS, en dos vistas
  duplicadas.

Nota de terminologia ya fijada: **los pacientes se identifican con CI y las
organizaciones con RIF**. Los campos internos se llaman `rut` y no deben
renombrarse por esto.

## 7. Lo que ya quedo resuelto

Para que no se vuelva a plantear:

- **Toast**: `show()` ya acepta `type` y el color e icono se derivan. Ver PR
  #21. Los 31 mensajes negativos estan anotados.
- **Calendarios**: los dos de agenda y configuracion quedaron alineados. Ver
  PR #22.
- **Footer de modales**: los 11 llevan el layout. Ver PR #19.

## 8. Lo que habria que decidir antes de tocar nada mas

1. **Crear `app-card-header` o no.** Es la decision de la que depende todo lo
   demas. Sin un componente, cada cabecera sigue siendo markup libre y esto
   vuelve a aparecer dentro de un trimestre. Con un componente, es un PR amplio
   que toca casi todas las vistas y hay que decidir cuanto control se le
   deja (tamano de titulo, icono, subtitulo, slot derecho).
2. **Que vista manda.** Si se crea el componente, hace falta un patron de
   referencia. Configuracion es el mayoritario para el chip de icono.
3. **Encender `strictTemplates`.** Es la solucion de raiz para toda la clase
   de bugs de valores invalidos (ver PR #20), y probablemente destape mas
   errores del mismo tipo. Conviene hacerlo con tiempo y no de un tiron.
4. **Orden.** Si se empieza por lo visible (titulos y chips) o por lo que
  Check-in registrado, o lo que se nota al usar (los botones a mano y los estados
   vacios).