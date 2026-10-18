# Kinderly: búsqueda de metadatos de Anna’s Archive

Este proyecto añade resultados de Anna’s Archive a Kinderly mediante el paquete Dart de terceros [`annas_archive_api`](https://pub.dev/packages/annas_archive_api). La integración consulta metadatos; no obtiene archivos de Anna’s Archive.

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

## Envío a Kindle y límites

Los resultados de Anna’s Archive son solo metadatos y el botón de envío permanece desactivado si no hay otra fuente autorizada para ese mismo título. Si Kinderly encuentra el libro también en Gutenberg, Wikisource, Internet Archive u otra fuente que permita obtener legalmente el archivo, conserva el flujo de envío de esa fuente.

Esto permite demostrar una búsqueda integrada y, con un EPUB de dominio público, licencia abierta o autorización explícita, probar la entrega a Kindle. No implementa ni habilita descargas de Anna’s Archive. La búsqueda depende de un paquete de terceros y de la disponibilidad del sitio; no es una API oficial de Anna’s Archive.
