# Observaciones de formularios reales

Este documento registra hallazgos de las primeras pruebas del MVP con formularios de postulaciones reales. Las observaciones sirven para orientar el diseño futuro; no implican cambios inmediatos en el detector, matcher ni modelo de datos actual.

## Formulario real #1

### Duplicados

- Hay campos que la extensión detecta duplicados.
- En algunos casos, dos campos detectados como el mismo tipo no se comportan igual: uno puede funcionar al hacer `Fill` y otro no.
- No se debe asumir que los duplicados son necesariamente incorrectos. Un formulario puede tener legítimamente varios campos asociados al mismo concepto general.
- Antes de deduplicar, será necesario distinguir entre elementos realmente repetidos, campos visualmente ocultos, campos alternativos y campos que representan partes diferentes de una misma información.

### Apellidos

El formulario solicita por separado:

- Apellido paterno.
- Apellido materno.

Actualmente ambos podrían terminar representados de forma demasiado genérica como `LAST_NAME`. Esto puede provocar que una única categoría no exprese correctamente la diferencia entre ambos campos.

### Teléfono

El formulario solicita tres datos relacionados pero distintos:

- Código telefónico nacional / country code (por ejemplo, `54`).
- Número de teléfono.
- Código o extensión adicional (por ejemplo, `9 11`).

Actualmente `PHONE` puede ser demasiado genérico para distinguir estos casos. Un futuro modelo debería evaluar si conviene separar componentes telefónicos o conservarlos como una estructura relacionada.

### Experiencia laboral

El formulario solicita:

- Título o puesto.
- Compañía.
- Localización.
- Si actualmente trabaja allí (Sí/No).
- Fecha desde.
- Fecha hasta.
- Descripción del rol.

Esto sugiere que una futura representación estructurada de `Experience` podría ser más adecuada que tratar cada respuesta como un `SavedAnswer` independiente. También permitiría mantener la relación entre los distintos campos de una misma experiencia laboral.

### Conclusión

Estas observaciones muestran que los formularios reales contienen estructuras más complejas que un único campo por categoría. No deben traducirse todavía en nuevas categorías, cambios de scoring, deduplicación automática ni autofill adicional.

Antes de modificar el modelo actual conviene recopilar más formularios, confirmar qué duplicados son legítimos y definir cómo representar apellidos separados, componentes telefónicos y experiencias laborales estructuradas. El MVP actual debe mantenerse estable mientras continúa la validación del flujo de detección y llenado manual.
