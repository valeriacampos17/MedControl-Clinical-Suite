# Tarea: reubicar "Fotos de la Consulta" tras "Examen Físico"

## Solicitud

En la vista de **Nueva Consulta** (`/nueva-consulta`), mover la tarjeta
**"Fotos de la Consulta"** para que aparezca **inmediatamente después** de la
tarjeta **"Examen Físico"**.

## Contexto

La tarjeta de fotos clínicas se había insertado originalmente después de
**Signos Vitales**. Con el orden anterior, quedaba entre los datos duros de la
atención y la anamnesis, lo que rompía el flujo clínico natural (motivo →
examen físico → hallazgos → adjuntos).

## Cambio realizado

- **Archivo:** `src/app/views/consulta/consulta.component.ts`
- **Tipo:** reubicación de un bloque de template (sin cambios de lógica).

Se extrajo el `div` completo de la tarjeta "Fotos de la Consulta" (encabezado,
contador `n/6`, grilla de miniaturas, botones de eliminar y zona "Agregar") y se
insertó entre el cierre de la tarjeta "Examen Físico" y el inicio de "Órdenes de
Exámenes".

Los bindings permanecen intactos en el mismo componente: `photos()`,
`handlePhotoFiles($event)`, `removePhoto(photo.id)` y `openPhoto(i)`.

### Orden resultante de las tarjetas

1. Signos Vitales
2. Anamnesis
3. Examen Físico
4. **Fotos de la Consulta** ← reubicada aquí
5. Órdenes de Exámenes
6. Recetas Médicas
7. Diagnóstico
8. Plan de Tratamiento

## Verificación

- `npx ng build` → compilación correcta, sin errores.
- Confirmado por inspección del template que "Fotos de la Consulta" aparece
  después de "Examen Físico" y antes de "Órdenes de Exámenes".

## Alcance

Cambio puramente visual/estructural. No se modificó ningún servicio, endpoint,
tipo ni comportamiento de guardado.
