# Kinderly: búsqueda federada y envío de EPUB autorizados

Kinderly busca libros en varios catálogos abiertos y reúne resultados duplicados. Anna’s Archive se consulta solo para metadatos mediante el paquete Dart de terceros [`annas_archive_api`](https://pub.dev/packages/annas_archive_api); no obtiene archivos de esa fuente.

## Fuentes integradas

- Project Gutenberg, Wikisource, Internet Archive, Open Library, Google Books y OAPEN.
- DOAB y dBooks para descubrimiento bibliográfico; sus fichas no habilitan el envío automático.
- Anna’s Archive para metadatos cuando el sitio responde.
- Enlaces de consulta externos a Cervantes Virtual, Biblioteca Digital Hispánica, Educ.ar, Biblioteca Virtual Universal, Elejandría, Biblioteca Nacional de Argentina, SEDICI y CLACSO.

Solo se habilita el envío cuando Kinderly puede identificar un archivo EPUB de una fuente marcada como apta. En Internet Archive se exige una licencia abierta reconocible o que Open Library identifique el registro como acceso público; los registros sin permiso verificable quedan como metadatos.

## Estructura

- `index.html`: interfaz de Kinderly y fuentes bibliográficas existentes.
- `main.dart`: servidor HTTP con `/api/annas-search` y `/api/health`.
- `pubspec.yaml`: dependencia `annas_archive_api`.
- `Dockerfile`: imagen para desplegar el backend en un servicio que acepte contenedores.

## Probar localmente

Requiere Dart SDK 3.8 o posterior.

```sh
dart pub get
dart run main.dart
```

Abrí http://localhost:4173. El backend escucha en el puerto de `PORT` (4173 por defecto) y en `0.0.0.0`, como requieren los hosts de contenedores.

Comprobá el estado y una búsqueda:

```sh
curl http://localhost:4173/api/health
curl 'http://localhost:4173/api/annas-search?q=Don%20Quijote'
```

## Publicar el backend para GitHub Pages

GitHub Pages sirve `index.html`, pero no ejecuta el servidor Dart. El backend debe desplegarse por separado en un host que admita Docker o Dart.

1. Desplegá este directorio usando el `Dockerfile`.
2. Configurá `ALLOWED_ORIGINS` en el backend con el origen exacto de la web, por ejemplo:

   ```text
   https://francosiderides-boop.github.io
   ```

3. Copiá el origen HTTPS público del backend y pegalo en `content` de esta etiqueta en `index.html`:

   ```html
   <meta name="kinderly-api-base" content="https://TU-BACKEND">
   ```

   No agregues `/api` al final. Volvé a publicar `index.html` en GitHub Pages.
4. Abrí `https://TU-BACKEND/api/health`. Debe responder `{"ok":true}`.
5. Probá `https://TU-BACKEND/api/annas-search?q=Don%20Quijote`. Si la fuente responde, devuelve `ok: true` y una lista `results`; ante bloqueos o errores del sitio, el endpoint devuelve un error explicativo.

La interfaz ahora muestra el error de Anna’s Archive en el estado de búsqueda, en vez de ocultarlo junto a los fallos de las demás fuentes.

El filtro de idioma del paquete Anna está configurado en español; si se omite, `annas_archive_api` usa inglés por defecto. La búsqueda paralela consulta cada catálogo una vez y solo prueba una variante más cuando una fuente no encuentra resultados. Los errores y tiempos agotados se muestran por fuente.

El escaneo recorta la zona marcada en la cámara y conserva más resolución. Si el reconocimiento con IA no devuelve un título, vuelve a intentar con la imagen completa. La imagen debe estar centrada, nítida y sin reflejos.

## Envío a Kindle y límites

Los resultados de Anna’s Archive son solo metadatos y el botón de envío permanece desactivado si no hay otra fuente autorizada para ese mismo título. Si Kinderly encuentra el libro también en Gutenberg, Wikisource, Internet Archive u otra fuente que permita obtener legalmente el archivo, conserva el flujo de envío de esa fuente.

Esto permite demostrar una búsqueda integrada y, con un EPUB de dominio público, licencia abierta o autorización explícita, probar la entrega a Kindle. El reconocimiento de portadas y la sinopsis dependen del Google Apps Script configurado en `index.html`; el código de ese script no está incluido en este proyecto, así que la disponibilidad y el modelo de IA deben verificarse con el servicio activo. No implementa ni habilita descargas de Anna’s Archive. La búsqueda depende de un paquete de terceros y de la disponibilidad del sitio; no es una API oficial de Anna’s Archive.
