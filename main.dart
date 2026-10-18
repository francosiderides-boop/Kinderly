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
      if (request.uri.path == '/api/annas-search') {
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
      // HttpResponse no expone un indicador portable de headers enviados.
      // Intentamos cerrar la respuesta de error y toleramos que ya se haya cerrado.
      try {
        await _json(request.response, HttpStatus.internalServerError,
            {'ok': false, 'error': 'Error interno del servidor'});
      } catch (_) {}
    }
  }
}

void _setCors(HttpRequest request, HttpResponse response) {
  final origin = request.headers.value('origin');
  if (origin != null && allowedOrigins.contains(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Accept');
}

Future<void> _search(HttpRequest request) async {
  final response = request.response;
  response.headers.set('Cache-Control', 'no-store');
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
  response.headers.set('Cache-Control', 'no-store');
  response.write(jsonEncode(body));
  await response.close();
}
