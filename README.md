# JobForm Autofill

JobForm Autofill es una extensión de navegador orientada a acelerar la carga de formularios de postulaciones laborales. Su objetivo actual es detectar y clasificar campos de formularios, y permitir un llenado manual controlado a partir de información local configurada por el usuario.

La extensión **no envía formularios automáticamente**, no hace clic en botones de postulación y no automatiza acciones de aplicación.

## Funcionalidades actuales

- Detección de `input`, `textarea`, `select`, checkbox y radio buttons.
- Lectura de señales como `name`, `id`, `type`, `placeholder`, `aria-label`, `autocomplete`, `<label>` y texto cercano.
- Clasificación mediante un sistema de confidence para:
  - `FIRST_NAME`
  - `LAST_NAME`
  - `EMAIL`
  - `PHONE`
  - `CITY`
  - `COUNTRY`
  - `LINKEDIN`
  - `CURRENT_COMPANY`
  - `CURRENT_POSITION`
  - `UNKNOWN`
- Detección de campos agregados dinámicamente mediante `MutationObserver`.
- Perfil local (`Profile`) editable desde la página de Options:
  - nombre, apellido, email, teléfono, ciudad, país y LinkedIn.
- Respuestas guardadas (`SavedAnswer`) con múltiples respuestas permitidas para el mismo `fieldType`.
- Indicador de disponibilidad de valores para cada campo detectado.
- Llenado manual mediante `Fill`.
- Selector de variantes cuando un campo tiene múltiples `SavedAnswer` disponibles.
- `Fill known fields`, que rellena automáticamente sólo campos conocidos con un único valor disponible.
- Eventos `input` y `change` al rellenar, sin enviar el formulario.

## Arquitectura

- Chrome Extension Manifest V3.
- TypeScript estricto.
- Vite para el build.
- Content script para detectar campos, resolver disponibilidad y realizar el llenado manual solicitado.
- Popup para visualizar campos y ejecutar `Fill` o `Fill known fields`.
- Options Page para editar el `Profile` y administrar `SavedAnswer`.
- `chrome.storage.local` como almacenamiento persistente local.
- Sin backend, base de datos, login, servicios cloud, IA ni APIs externas.

La lógica principal de detección y matching se mantiene compartida entre Chrome y Firefox. Se generan manifiestos separados porque Firefox utiliza `background.scripts`, mientras Chrome utiliza un service worker.

## Instalación y build

Requiere una instalación local de Node.js con `npm` disponible.

Instalar dependencias:

```powershell
npm install
```

Build para Chrome:

```powershell
npm run build:chrome
```

El resultado queda en `dist/`.

Build para Firefox:

```powershell
npm run build:firefox
```

El resultado queda en `dist-firefox/`.

## Cargar en Chrome

1. Abrir `chrome://extensions`.
2. Activar **Developer mode**.
3. Elegir **Load unpacked**.
4. Seleccionar la carpeta `dist/`.

La configuración del perfil se abre desde los detalles de la extensión, en **Extension options**.

## Cargar en Firefox

1. Abrir `about:debugging`.
2. Entrar en **This Firefox**.
3. Elegir **Load Temporary Add-on**.
4. Seleccionar `dist-firefox/manifest.json`.

Las opciones se abren desde la página de detalles del complemento, en **Options**.

## Estado actual

El MVP está implementado en código y preparado para probarse localmente en Chrome y Firefox. Todavía está pendiente completar las pruebas reales del content script en páginas con formularios reales, incluyendo formularios dinámicos, variantes de labels y validación del comportamiento de los eventos `input`/`change`.

## Roadmap inmediato

Antes de agregar nuevas funcionalidades, falta:

1. Ejecutar los builds en un entorno con `npm` disponible.
2. Cargar la extensión en Chrome y Firefox.
3. Probar la detección contra formularios reales y la fixture de prueba.
4. Verificar Profile y múltiples `SavedAnswer` desde Options.
5. Validar `Fill`, selección de variantes y `Fill known fields`.
6. Confirmar que nunca se envíen formularios ni se modifiquen campos `UNKNOWN`.

Después de esa validación se podrá definir el siguiente paso de producto sin ampliar todavía el alcance actual.
