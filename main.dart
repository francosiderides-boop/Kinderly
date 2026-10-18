import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:annas_archive_api/annas_archive_api.dart';

final AnnaApi annaApi = AnnaApi();
final Set<String> allowedOrigins = (Platform.environment['ALLOWED_ORIGINS'] ??
        'https://francosiderides-boop.github.io,http://localhost:4173,http://127.0.0.1:4173')
    .split(',')
    .map((origin) => origin.trim())
    .where((origin) => origin.isNotEmpty)
    .toSet();

Future<void> main() async {
  final port = int.tryParse(Platform.environment['PORT'] ?? '') ?? 4173;
  // En producción el contenedor debe aceptar conexiones del proxy del host.
  final server = await HttpServer.bind(InternetAddress.anyIPv4, port);
  stdout.writeln('Kinderly Anna API escuchando en el puerto $port');

  await for (final request in server) {
    try {
      _setCors(request, request.response);
      if (request.method == 'OPTIONS') {
        request.response.statusCode = HttpStatus.noContent;
        await request.response.close();
        continue;
      }
      if (request.uri.path == '/api/catalog-search') {
        await _catalogSearch(request);
      } else if (request.uri.path == '/api/annas-search') {
        await _search(request);
      } else if (request.uri.path == '/' || request.uri.path == '/index.html') {
        await _serveIndex(request);
      } else if (request.uri.path == '/api/health') {
        await _json(request.response, HttpStatus.ok, {'ok': true});
      } else {
        await _json(request.response, HttpStatus.notFound,
            {'ok': false, 'error': 'Ruta no encontrada'});
      }
    } catch (error, stack) {
      stderr.writeln('Error atendiendo solicitud: $error');
      stderr.writeln(stack);
      try {
        await _json(request.response, HttpStatus.internalServerError,
            {'ok': false, 'error': 'Error interno del servidor'});
      } catch (_) {
        await request.response.close();
      }
    }
  }
}

void _setCors(HttpRequest request, HttpResponse response) {
  final origin = request.headers.value('origin');
  if (origin != null && allowedOrigins.contains(origin)) {
    response.headers.set(HttpHeaders.accessControlAllowOriginHeader, origin);
    response.headers.set(HttpHeaders.varyHeader, 'Origin');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Accept');
}



Future<void> _catalogSearch(HttpRequest request) async {
  final response = request.response;
  response.headers.set(HttpHeaders.cacheControlHeader, 'public, max-age=300');
  final source = (request.uri.queryParameters['source'] ?? '').trim();
  final query = (request.uri.queryParameters['q'] ?? '').trim();
  if (query.isEmpty || query.length > 160) {
    await _json(response, HttpStatus.badRequest, {'ok': false, 'error': 'Consulta vacía o demasiado larga'});
    return;
  }
  final encoded = Uri.encodeComponent(query);
  late final Uri upstream;
  switch (source) {
    case 'gutenberg':
      upstream = Uri.https('gutendex.com', '/books/', {'languages': 'es', 'search': query});
      break;
    case 'google-books':
      upstream = Uri.https('www.googleapis.com', '/books/v1/volumes', {
        'q': query, 'filter': 'free-ebooks', 'download': 'epub',
        'langRestrict': 'es', 'printType': 'books', 'maxResults': '20'
      });
      break;
    case 'dbooks':
      upstream = Uri.parse('https://www.dbooks.org/api/search/$encoded');
      break;
    case 'oapen':
      upstream = Uri.https('library.oapen.org', '/rest/search', {'expand': 'metadata,bitstreams', 'query': query});
      break;
    case 'doab':
      upstream = Uri.https('directory.doabooks.org', '/rest/search', {'expand': 'metadata', 'query': query});
      break;
    default:
      await _json(response, HttpStatus.badRequest, {'ok': false, 'error': 'Catálogo no habilitado'});
      return;
  }
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 5);
  try {
    final req = await client.getUrl(upstream).timeout(const Duration(seconds: 8));
    req.headers.set(HttpHeaders.acceptHeader, 'application/json');
    final res = await req.close().timeout(const Duration(seconds: 8));
    final text = await utf8.decoder.bind(res).join().timeout(const Duration(seconds: 8));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      await _json(response, HttpStatus.badGateway, {'ok': false, 'error': source + ' devolvió HTTP ' + res.statusCode.toString()});
      return;
    }
    await _json(response, HttpStatus.ok, jsonDecode(text));
  } on TimeoutException {
    await _json(response, HttpStatus.gatewayTimeout, {'ok': false, 'error': 'El catálogo tardó demasiado', 'source': source});
  } catch (error) {
    stderr.writeln('Error consultando catálogo ' + source + ': ' + error.toString());
    await _json(response, HttpStatus.badGateway, {'ok': false, 'error': 'No se pudo consultar ' + source});
  } finally {
    client.close(force: true);
  }
}

Future<void> _search(HttpRequest request) async {
  final response = request.response;
  response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');
  final query = (request.uri.queryParameters['q'] ?? '').trim();
  if (query.isEmpty) {
    await _json(response, HttpStatus.badRequest,
        {'ok': false, 'error': 'Falta el parámetro q', 'results': <Object>[]});
    return;
  }
  if (query.length > 200) {
    await _json(response, HttpStatus.badRequest,
        {'ok': false, 'error': 'La búsqueda supera los 200 caracteres', 'results': <Object>[]});
    return;
  }

  try {
    // annas_archive_api es un paquete Dart de terceros (no una API oficial de Anna's Archive).
    // Limitamos la búsqueda a EPUB/PDF para que los resultados sean relevantes para Kinderly.
    final result = await annaApi.find(SearchRequest(
      query: query,
      formats: const [Format.epub, Format.pdf],
      // Kinderly is Spanish-first. annas_archive_api defaults to English,
      // which silently filters out Spanish editions when omitted.
      language: Language.spanish,
      page: 1,
    )).timeout(const Duration(seconds: 20));

    final books = result.books.take(20).map((book) {
      return <String, dynamic>{
        'title': book.title,
        'author': book.author,
        'year': book.year ?? '',
        'cover': _safeImageUrl(book.imgUrl),
        'format': book.format.name.toUpperCase(),
        'size': book.size,
        'description': book.genre,
        'sources': book.sources.join(', '),
        // No se devuelve una URL de descarga de Anna's Archive.
        'downloadUrl': '',
      };
    }).where((book) => (book['title'] as String).trim().isNotEmpty).toList();

    await _json(response, HttpStatus.ok, {
      'ok': true,
      'source': 'annas_archive_api',
      'results': books,
    });
  } on TimeoutException {
    await _json(response, HttpStatus.gatewayTimeout,
        {'ok': false, 'error': 'Anna’s Archive tardó demasiado en responder', 'results': <Object>[]});
  } catch (error) {
    stderr.writeln('Error de búsqueda Anna: $error');
    await _json(response, HttpStatus.badGateway, {
      'ok': false,
      'error': 'No se pudo consultar Anna’s Archive. Puede haber un bloqueo temporal o un cambio en el sitio.',
      'results': <Object>[],
    });
  }
}


String _safeImageUrl(String value) {
  final uri = Uri.tryParse(value);
  if (uri == null || (uri.scheme != 'https' && uri.scheme != 'http')) return '';
  return uri.toString();
}

Future<void> _serveIndex(HttpRequest request) async {
  final file = File('${Directory.current.path}${Platform.pathSeparator}index.html');
  if (!await file.exists()) {
    await _json(request.response, HttpStatus.notFound,
        {'ok': false, 'error': 'No se encontró index.html junto a main.dart'});
    return;
  }
  request.response.headers.contentType = ContentType.html;
  request.response.headers.set('X-Content-Type-Options', 'nosniff');
  await request.response.addStream(file.openRead());
  await request.response.close();
}

Future<void> _json(HttpResponse response, int status, Object body) async {
  response.statusCode = status;
  response.headers.contentType = ContentType.json;
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set(HttpHeaders.cacheControlHeader, 'no-store');
  response.write(jsonEncode(body));
  await response.close();
}
