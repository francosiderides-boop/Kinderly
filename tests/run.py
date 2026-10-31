import os
"""Pruebas de Kinderly en Chromium (Playwright).

Uso (desde cualquier carpeta):
    python3 -m venv /tmp/kv && /tmp/kv/bin/pip install playwright && /tmp/kv/bin/python -m playwright install chromium
    /tmp/kv/bin/python tests/run.py            # todas
    /tmp/kv/bin/python tests/run.py lector     # solo las que contienen "lector" en el nombre

Sirve la carpeta padre del repo para que la app quede en /Kinderly/ como en GitHub Pages.
Firebase se reemplaza por tests/fbmock (no aplica reglas de seguridad). Las pruebas de búsqueda,
lector y sin conexión usan internet real (Gutenberg, Internet Archive). Nada de esto prueba el
teléfono del usuario.
"""
import sys, json, re, time, threading, tempfile, pathlib, urllib.request, functools, http.server, socketserver
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parent.parent
MOCK = REPO / "tests" / "fbmock"
OUT = pathlib.Path(tempfile.mkdtemp(prefix="kinderly-tests-"))
MARIANELA = "https://www.gutenberg.org/ebooks/17340.epub.noimages"
LOVECRAFT = "https://archive.org/download/en-las-montanas-de-la-locura-h.-p.-lovecraft/En%20Las%20Montanas%20De%20La%20Locura%20-%20H.P.%20Lovecraft.epub"
BASE_LS = {"k_welcome": "1", "k_inst_x": "1", "kr_air": json.dumps({"off": 1})}
READY = "document.querySelector('#kr')&&!document.querySelector('#kr .kr-msg')"
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("  ✓ " if ok else "  ✗ ") + name + (f" — {detail}" if detail and not ok else ""))


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(REPO.parent))
    handler.log_message = lambda *a: None
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://localhost:{srv.server_address[1]}/Kinderly/"


def ctx_for(b, ls=None, fdb=None, deny=False, sw=False, **kw):
    opts = dict(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    opts.update(kw)
    if not sw:
        opts["service_workers"] = "block"
    ctx = b.new_context(**opts)
    init = ""
    if fdb is not None:
        init += "window.__fdb=" + json.dumps(fdb) + ";" + ("window.__fdbDeny=1;" if deny else "")
    vals = dict(BASE_LS, **(ls or {}))
    init += "try{if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');" + "".join(
        f"localStorage.setItem({json.dumps(k)},{json.dumps(v)});" for k, v in vals.items()) + "}}catch(e){}"
    ctx.add_init_script(init)
    if fdb is not None:
        for name, f in [("firebase-app", "app.js"), ("firebase-auth", "auth.js"), ("firebase-firestore", "firestore.js")]:
            ctx.route(f"**/firebasejs/**/{name}.js", (lambda fp: lambda r: r.fulfill(path=fp, content_type="application/javascript"))(str(MOCK / f)))
    return ctx


def page(ctx, url, errs=None):
    pg = ctx.new_page()
    if errs is not None:
        pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.on("dialog", lambda d: d.accept())
    pg.goto(url, wait_until="load")
    pg.wait_for_timeout(1500)
    return pg


def search(pg, q):
    pg.evaluate("showView('buscar')")
    pg.fill("#q", q); pg.click("#go")
    pg.wait_for_function("/Encontré|No encontramos|No se pudo|sin conexión/.test(document.getElementById('status').textContent)", timeout=120000)
    return pg.evaluate("[...document.querySelectorAll('#res .item')].map(e=>({t:e.querySelector('.top b').textContent,tags:[...e.querySelectorAll('.tag')].map(t=>t.textContent),read:!!e.querySelector('button.read')}))")


# ---------------------------------------------------------------- pruebas
def t_versiones(b, base):
    idx = (REPO / "index.html").read_text(encoding="utf-8"); sw = (REPO / "sw.js").read_text(encoding="utf-8")
    beta = re.search(r"Beta (0\.\d+\.\d+)", idx).group(1); app = re.search(r"APP_VERSION='v(\d+)'", idx).group(1)
    js = set(re.findall(r"\.js\?v=(\d+)", idx)); cache = re.search(r"kinderly-shell-v(\d+)", sw).group(1)
    check("versión igual en APP_VERSION, .js?v= y sw.js", js == {app} and cache == app, f"app {app}, js {js}, sw {cache}")
    print(f"    (v{app} / Beta {beta})")


def t_inicio(b, base):
    errs = []; ctx = ctx_for(b); pg = page(ctx, base + "index.html#buscar", errs)
    for v in ["biblioteca", "descubrir", "buscar", "club", "perfil", "amigos", "ajustes", "sugerencias"]:
        pg.evaluate(f"showView('{v}')"); pg.wait_for_timeout(500)
        over = pg.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth")
        check(f"pestaña {v} sin desborde horizontal", not over)
    check("sin errores de JavaScript al recorrer las pestañas", not errs, "; ".join(errs))
    pg.evaluate("say('Prueba','ok')")
    check("el aviso se ve", pg.eval_on_selector("#status", "e=>getComputedStyle(e).display") == "block")
    pg.click("#status"); pg.wait_for_timeout(200)
    check("tocar el aviso lo cierra", pg.eval_on_selector("#status", "e=>e.style.display") == "none")
    pg.evaluate("say('Algo','ok')"); pg.wait_for_timeout(6500)
    check("el aviso se va solo", pg.eval_on_selector("#status", "e=>e.style.display") == "none")
    ctx.close()


def t_meta(b, base):
    ctx = ctx_for(b); pg = page(ctx, base + "index.html#biblioteca")
    pg.click("button.kr-gl"); pg.wait_for_timeout(600)
    check("la hoja de meta se ve (no transparente)", pg.evaluate("getComputedStyle(document.querySelector('.ex-ov')).opacity") == "1")
    pg.fill(".ex-cg input", "37"); pg.click(".ex-cg button"); pg.wait_for_timeout(600)
    check("meta personalizada guardada", pg.evaluate("localStorage.getItem('kr_goal')") == "37")
    check("Biblioteca muestra la meta nueva", "37 min" in pg.evaluate("document.querySelector('.kr-gh span').textContent"))
    pg.evaluate("showView('ajustes')"); pg.click("#ex-set button:has-text('Cambiar meta')"); pg.wait_for_timeout(600)
    pg.click(".ex-ov .ex-opt:has-text('20 minutos')"); pg.wait_for_timeout(600)
    check("meta desde Ajustes con botón rápido", pg.evaluate("localStorage.getItem('kr_goal')") == "20")
    check("días de la semana con X para miércoles", "X" in pg.evaluate("(showView('biblioteca'),[...document.querySelectorAll('.kr-wc small')].map(x=>x.textContent).join(''))"))
    ctx.close()


def t_busqueda(b, base):
    ctx = ctx_for(b); pg = page(ctx, base + "index.html#buscar")
    r = search(pg, "Marianela")
    check("Marianela: primer resultado es la novela", r and r[0]["t"].startswith("Marianela"), r[:1])
    check("Marianela: la mejor fuente va primero (Gutenberg)", r and r[0]["tags"][:1] == ["Project Gutenberg"], r[:1])
    ws = [x["t"] for x in r if "Wikisource" in x["tags"] and "/" in x["t"]]
    check("sin capítulos sueltos de Wikisource", not ws, ws)
    r = search(pg, "Don Quijote")
    check("Don Quijote: se abre desde Gutenberg", r and r[0]["tags"][:1] == ["Project Gutenberg"] and r[0]["read"], r[:1])
    r = search(pg, "las montañas de la locura")
    lov = [x for x in r if "locura" in x["t"].lower() and x["read"]]
    check("Lovecraft: avisa posibles fallas de formato", lov and "Puede tener fallas de formato" in lov[0]["tags"], lov[:1])
    ctx.close()


def t_amigos(b, base):
    seed = {"users": {"u1": {"username": "franco", "usernameLower": "franco"}, "u2": {"name": "Ana", "username": "ana", "usernameLower": "ana"}},
            "libraries": {"u2": {"items": [{"t": "Marianela", "a": "Benito Pérez Galdós", "p": 45, "u": MARIANELA}, {"t": "Rimas", "a": "Bécquer", "p": 0, "u": ""}]}},
            "friendships": {"u1_u2": {"members": ["u1", "u2"], "names": {"u1": "franco", "u2": "Ana"}}},
            "bookRequests": {"r9": {"from": "u2", "to": "u1", "fromName": "Ana", "toName": "franco", "text": "Doña Perfecta — Benito Pérez Galdós", "status": "open"}}}
    lib = [{"id": "https://www.gutenberg.org/ebooks/1.epub", "url": "https://www.gutenberg.org/ebooks/1.epub", "title": "Fortunata y Jacinta", "author": "Galdós", "pct": .3, "t": 1},
           {"id": "local:x.epub:1", "url": "", "title": "Archivo privado", "pct": .1, "t": 2, "local": True}]
    errs = []; ctx = ctx_for(b, {"kr_lib": json.dumps(lib)}, seed); pg = page(ctx, base + "index.html#amigos", errs); pg.wait_for_timeout(2000)
    pub = pg.evaluate("((window.__fdb.libraries||{}).u1||{}).items||[]")
    check("mi biblioteca se publica para amigos", [x["t"] for x in pub] == ["Fortunata y Jacinta"], pub)
    check("los archivos propios no se publican", not any(x["t"] == "Archivo privado" for x in pub))
    pg.click("button:has-text('Ver biblioteca')"); pg.wait_for_timeout(600)
    check("veo la biblioteca de mi amiga", "Marianela" in pg.evaluate("document.querySelector('.ks-box').innerText"))
    pg.click(".ks-box .ks-row:has-text('Marianela') button:has-text('Pedir')"); pg.wait_for_timeout(600)
    req = pg.evaluate("Object.values(window.__fdb.bookRequests).filter(r=>r.to==='u2').map(r=>r.text)")
    check("Pedir le manda el pedido", req == ["Marianela — Benito Pérez Galdós"], req)
    pg.click(".ks-box button:has-text('Cerrar')"); pg.wait_for_timeout(300)
    pg.click("button:has-text('Ocultar biblioteca')"); pg.wait_for_timeout(800)
    check("Ocultar biblioteca la saca de la nube", not pg.evaluate("!!(window.__fdb.libraries||{}).u1"))
    pg.click(".kf-it:has-text('Doña Perfecta') button:has-text('Buscar')"); pg.wait_for_timeout(300)
    check("Buscar de un pedido usa solo el título", pg.eval_on_selector("#q", "e=>e.value") == "Doña Perfecta")
    check("sin errores en Amigos", not errs, errs)
    ctx.close()


def t_sincronizacion(b, base):
    now = int(time.time() * 1000)
    seed = {"users": {"u1": {"username": "franco", "usernameLower": "franco"}}}
    phone = ctx_for(b, {"mail": "franco@kindle.com", "kr_goal": "25", "kr_lib": json.dumps([{"id": MARIANELA, "url": MARIANELA, "title": "Marianela", "author": "Galdós", "pct": .45, "t": now - 5000}]),
                        "kr_hl_" + MARIANELA: json.dumps([{"cfi": "epubcfi(/6/8!/4/2,/1:0,/1:5)", "text": "frase", "color": "amarillo", "t": 1}])}, seed)
    pa = page(phone, base + "index.html#biblioteca"); cloud = pa.evaluate("window.__fdb")
    pc = ctx_for(b, {"kr_lib": json.dumps([{"id": "https://www.gutenberg.org/ebooks/1.epub", "url": "https://www.gutenberg.org/ebooks/1.epub", "title": "Rimas", "author": "Bécquer", "pct": .1, "t": now - 3000}])}, cloud)
    pb = page(pc, base + "index.html#biblioteca")
    titles = pb.evaluate("JSON.parse(localStorage.getItem('kr_lib')).map(x=>x.title).sort()")
    check("la compu recibe la biblioteca sin perder la suya", titles == ["Marianela", "Rimas"], titles)
    check("la compu recibe meta, mail y subrayados", pb.evaluate("localStorage.getItem('kr_goal')") == "25" and pb.eval_on_selector("#mail", "e=>e.value") == "franco@kindle.com" and pb.evaluate(f"!!localStorage.getItem({json.dumps('kr_hl_' + MARIANELA)})"))
    pb.evaluate("window.__fdbSet('userData/u1/k','kr_goal',{k:'kr_goal',v:'15',m:Date.now()+1000})"); pb.wait_for_timeout(800)
    check("un cambio desde otro dispositivo llega en vivo", "15 min" in pb.evaluate("document.querySelector('.kr-gh span').textContent"))
    pb.evaluate("showView('ajustes')")
    check("Ajustes dice que está sincronizado", "Sincronizado" in pb.evaluate("document.getElementById('sync-set').innerText"))
    c3 = ctx_for(b, {}, seed, deny=True); pc3 = page(c3, base + "index.html#ajustes")
    check("sin permiso en Firebase se avisa", "falta un permiso" in pc3.evaluate("document.getElementById('sync-set').innerText"))
    for c in (phone, pc, c3): c.close()


def t_copia(b, base):
    old = int(time.time() * 1000) - 86400000
    cloud = {"users": {"u1": {"username": "franco", "usernameLower": "franco"}}, "userData/u1/k": {"kr_goal": {"k": "kr_goal", "v": "15", "m": old}, "mail": {"k": "mail", "v": "viejo@mail.com", "m": old}}}
    bk = OUT / "copia.json"
    bk.write_text(json.dumps({"app": "kinderly", "v": 1, "data": {"kr_goal": "40", "mail": "nuevo@kindle.com", "k_sync_h": "{}", "kr_ai": "{\"key\":\"x\"}"}}))
    ctx = ctx_for(b, {}, cloud); pg = page(ctx, base + "index.html#ajustes")
    with pg.expect_download() as d:
        pg.click("#ex-bk button:has-text('Guardar copia')")
    data = json.loads(pathlib.Path(d.value.path()).read_text())["data"]
    check("la copia incluye el mail y no las marcas internas ni la clave de IA", "mail" in data and not any(k.startswith("k_sync_") for k in data) and "kr_ai" not in data, sorted(data))
    pg.set_input_files("#ex-bk input[type=file]", str(bk)); pg.wait_for_timeout(500); pg.wait_for_load_state("load"); pg.wait_for_timeout(3500)
    check("lo restaurado no lo pisa la nube", pg.evaluate("localStorage.getItem('kr_goal')") == "40" and pg.eval_on_selector("#mail", "e=>e.value") == "nuevo@kindle.com")
    check("lo restaurado sube a la cuenta", pg.evaluate("window.__fdb['userData/u1/k'].kr_goal.v") == "40")
    check("no se importa una clave de IA desde un archivo", pg.evaluate("localStorage.getItem('kr_ai')") is None)
    ctx.close()


def t_lector(b, base):
    errs = []; ctx = ctx_for(b, {"kr_qs_off": "true"}); pg = page(ctx, base + "index.html#biblioteca", errs)
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'Galdós'}})"); pg.wait_for_function(READY, timeout=120000); pg.wait_for_timeout(2500)
    for _ in range(3):
        pg.click("#kr .kr-bot button[aria-label='Página siguiente']"); pg.wait_for_timeout(400)
    check("las páginas avanzan", "pág. 1 de" not in pg.evaluate("document.querySelector('#kr .kr-prog span').textContent"))
    pg.evaluate("""(()=>{const d=document.querySelector('#kr iframe').contentDocument;d.body.classList.add('kr-sel');const p=[...d.querySelectorAll('p')].find(p=>p.textContent.trim().length>80);const t=[...p.childNodes].find(n=>n.nodeType===3&&n.length>30);const r=d.createRange();r.setStart(t,0);r.setEnd(t,25);const s=d.getSelection();s.removeAllRanges();s.addRange(r)})()""")
    pg.wait_for_timeout(1500)
    if pg.evaluate("document.querySelector('#kr .selbar').classList.contains('on')"):
        pg.click("#kr .selbar button[aria-label='Subrayar amarillo']"); pg.wait_for_timeout(600)
    check("subrayar guarda el subrayado", pg.evaluate(f"(JSON.parse(localStorage.getItem({json.dumps('kr_hl_' + MARIANELA)})||'[]')).length") == 1)
    pg.click("#kr button[aria-label='Apariencia']"); pg.wait_for_timeout(400)
    pg.click("#kr .ap-t[aria-label='Sepia']"); pg.wait_for_timeout(500)
    check("tema sepia aplicado al libro", pg.evaluate("getComputedStyle(document.querySelector('#kr iframe').contentDocument.body).backgroundColor") == "rgb(241, 230, 207)")
    pg.click("#kr .ap-seg button:has-text('Scroll')"); pg.wait_for_timeout(2500)
    check("modo scroll muestra el libro", pg.evaluate("document.getElementById('kr-view').dataset.mode==='scrolled'&&document.querySelector('#kr iframe').contentDocument.body.textContent.length>100"))
    pg.click("#kr button[aria-label='Apariencia']"); pg.wait_for_timeout(400); pg.click("#kr .ap-seg button:has-text('Páginas')"); pg.wait_for_timeout(2000)
    pg.evaluate("say('Nota guardada','ok')")
    check("los avisos se ven arriba del lector", pg.evaluate("(()=>{const s=document.getElementById('status'),r=s.getBoundingClientRect();return s.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})()"))
    pos = pg.evaluate("JSON.parse(localStorage.getItem('kr_lib'))[0].cfi")
    pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(800)
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'Galdós'}})"); pg.wait_for_function(READY, timeout=60000); pg.wait_for_timeout(2500)
    check("al reabrir sigue en el mismo lugar con el subrayado", pg.evaluate("JSON.parse(localStorage.getItem('kr_lib'))[0].cfi") == pos and pg.evaluate("document.querySelectorAll('#kr [class*=kr-hl]').length") >= 1)
    pg.click("#kr button[aria-label='Contenido']"); pg.wait_for_timeout(500)
    check("un libro con índice propio lo conserva", pg.evaluate("[...document.querySelectorAll('#kr .kr-pb .li')].length") > 20)
    for wait in (300, 1500):
        pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(500)
        pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'Galdós'}})"); pg.wait_for_function(READY, timeout=60000); pg.wait_for_timeout(wait)
    pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(3000)
    check("sin errores en el lector (ni al cerrar rápido)", not errs, errs)
    ctx.close()


def t_lector_sin_indice(b, base):
    data = urllib.request.urlopen(LOVECRAFT, timeout=120).read()
    ctx = ctx_for(b); pg = page(ctx, base + "index.html#biblioteca")
    pg.evaluate("arr=>{const u=new Uint8Array(arr);window.KReader.openFile(new File([u],'montanas.epub',{type:'application/epub+zip'}))}", list(data))
    pg.wait_for_function(READY, timeout=60000); pg.wait_for_timeout(3500)
    check("el aviso 'Abriendo…' se cierra", pg.eval_on_selector("#status", "e=>e.style.display") == "none")
    pg.click("#kr button[aria-label='Contenido']"); pg.wait_for_timeout(500)
    toc = pg.evaluate("[...document.querySelectorAll('#kr .kr-pb .li')].map(x=>x.textContent)")
    check("arma el índice que el libro no trae", toc[:2] == ["Capítulo 1", "Capítulo II"] and len(toc) == 10, toc)
    pg.click("#kr .kr-pb .li >> nth=0"); pg.wait_for_timeout(1500)
    vis = "(()=>{const f=document.querySelector('#kr iframe'),r=f.getBoundingClientRect(),d=f.contentDocument;const o=[];for(const y of [130,160,200,260]){const c=d.caretRangeFromPoint(200-r.left,y-r.top);if(c&&c.startContainer&&c.startContainer.textContent.trim())o.push(c.startContainer.textContent.replace(/\\s+/g,' ').trim())}return o})()"
    starts = {3: "Sólo con enorme", 9: "Muchos serán", 1: "Supongo que"}
    for i in [3, 9, 3, 1]:
        pg.click("#kr button[aria-label='Contenido']"); pg.wait_for_timeout(400)
        pg.click(f"#kr .kr-pb .li >> nth={i}"); pg.wait_for_timeout(3500)
        title = toc[i].split()[-1]  # el título del capítulo puede ocupar el principio de la pantalla
        got = next((t for t in pg.evaluate(vis) if t != title), "")
        check(f"el salto al {toc[i]} cae en su comienzo", got.startswith(starts[i]), got[:50])
    pg.click("#kr button[aria-label='Contenido']"); pg.wait_for_timeout(400)
    pg.click("#kr .kr-tabs button:has-text('Buscar')"); pg.wait_for_timeout(300)
    pg.fill("#kr input[type=search]", "Tekelili"); pg.press("#kr input[type=search]", "Enter"); pg.wait_for_timeout(2500)
    pg.click("#kr .kr-pb .li >> nth=0"); pg.wait_for_timeout(2000)
    check("buscar en el libro lleva a la palabra", pg.evaluate("(()=>{const f=document.querySelector('#kr iframe'),d=f.contentDocument,fr=f.getBoundingClientRect();const w=d.createTreeWalker(d.body,4);let n;while(n=w.nextNode()){if(!/Tekelili/.test(n.textContent))continue;const r=d.createRange();r.selectNodeContents(n);for(const q of r.getClientRects()){const L=fr.left+q.left;if(L>=-2&&L<innerWidth&&q.top>=0&&q.top<innerHeight)return true}}return false})()"))
    ctx.close()


def t_sin_conexion(b, base):
    errs = []; ctx = ctx_for(b, sw=True); pg = page(ctx, base + "index.html#biblioteca", errs)
    pg.reload(wait_until="load"); pg.wait_for_timeout(1500)
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'Galdós'}})"); pg.wait_for_function(READY, timeout=120000); pg.wait_for_timeout(1500)
    pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(800)
    libs = pg.evaluate("caches.open('kinderly-libs-1').then(c=>c.keys()).then(k=>k.map(r=>r.url))")
    check("las piezas del lector quedan guardadas para usar sin conexión", any("jszip" in u for u in libs) and any("epub" in u for u in libs), libs)
    cat = pg.evaluate("caches.keys().then(ks=>Promise.all(ks.map(k=>caches.open(k).then(c=>c.keys())))).then(a=>a.flat().map(r=>r.url).filter(u=>/catalog\\//.test(u)).length)")
    check("el catálogo propio queda guardado", cat >= 13, cat)
    ctx.set_offline(True)
    p2 = page(ctx, base + "index.html#biblioteca", errs)
    check("sin conexión la app abre", p2.evaluate("!!document.querySelector('nav.tabs')"))
    p2.click(".lib-item .lib-cov")
    try:
        p2.wait_for_function(READY, timeout=20000); ok = True
    except Exception:
        ok = False
    check("sin conexión el libro guardado se abre", ok)
    p2.evaluate("document.querySelector('#kr .kr-top button')?.click()"); p2.wait_for_timeout(600)
    for _ in range(3):  # abrir y cerrar enseguida (antes de que termine de preparar el libro)
        p2.click(".lib-item .lib-cov"); p2.wait_for_function("!!document.querySelector('#kr')", timeout=20000); p2.wait_for_timeout(150)
        p2.evaluate("document.querySelector('#kr .kr-top button')?.click()"); p2.wait_for_timeout(2500)
    p2.evaluate("Object.defineProperty(navigator,'onLine',{get:()=>false})")
    r = search(p2, "Galdós")
    msg = p2.eval_on_selector("#status", "e=>e.textContent")
    check("buscar sin conexión avisa y usa el catálogo guardado", "sin conexión" in msg and len(r) > 0, msg)
    check("sin errores sin conexión", not errs, errs)
    ctx.close()


def t_navegacion(b, base):
    errs = []; ctx = ctx_for(b); pg = page(ctx, base + "index.html", errs); pg.wait_for_timeout(800)
    check("la pantalla principal es la biblioteca", pg.evaluate("document.querySelector('.view.on').dataset.view") == "biblioteca")
    tabs = pg.evaluate("[...document.querySelectorAll('nav.tabs button')].map(x=>x.dataset.go)")
    check("pestañas en orden", tabs == ["biblioteca", "descubrir", "buscar", "club"], tabs)
    pg.click("#menu-btn"); pg.wait_for_timeout(200)
    check("el menú de arriba trae perfil, amigos y ajustes", pg.evaluate("[...document.querySelectorAll('#hd-menu button')].map(x=>x.dataset.go).slice(0,3)") == ["perfil", "amigos", "ajustes"])
    pg.click("#hd-menu button[data-go='perfil']"); pg.wait_for_timeout(200)
    check("el menú abre Perfil y se cierra", pg.evaluate("document.querySelector('.view.on').dataset.view") == "perfil" and not pg.is_visible("#hd-menu"))
    check("sin errores en la navegación", not errs, errs)
    ctx.close()


def t_perfil(b, base):
    seed = {"users": {"u1": {"username": "franco", "usernameLower": "franco"}, "u2": {"name": "Ana", "username": "ana", "usernameLower": "ana", "bio": "Amo la novela rusa"}},
            "friendships": {"u1_u2": {"members": ["u1", "u2"], "names": {"u1": "franco", "u2": "Ana"}}}}
    errs = []; ctx = ctx_for(b, {}, seed); pg = page(ctx, base + "index.html#perfil", errs); pg.wait_for_timeout(1500)
    pg.fill("#pf-bio", "Me gusta la poesía"); pg.click("#pf-body button:has-text('Guardar')"); pg.wait_for_timeout(400)
    check("la bio se guarda en la cuenta", pg.evaluate("window.__fdb.users.u1.bio") == "Me gusta la poesía")
    png = __import__("base64").b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==")
    pg.set_input_files("#pf-body input[type=file]", {"name": "a.png", "mimeType": "image/png", "buffer": png}); pg.wait_for_timeout(800)
    check("la foto se achica y se guarda", (pg.evaluate("window.__fdb.users.u1.pic") or "").startswith("data:image/jpeg"))
    check("la foto aparece en el menú", pg.evaluate("!!document.querySelector('#menu-av img')"))
    pg.evaluate("showView('amigos')"); pg.click(".kf-it:has-text('Ana') button:has-text('Perfil')"); pg.wait_for_timeout(500)
    check("veo la bio de mi amiga", "novela rusa" in pg.inner_text(".ks-box"))
    check("sin errores en Perfil", not errs, errs)
    ctx.close()


def t_regla_y_barra(b, base):
    for name, url in [("Marianela", MARIANELA), ("Lovecraft", LOVECRAFT)]:
        errs = []; ctx = ctx_for(b, {"kr_qs_off": "true"}); pg = page(ctx, base + "index.html#biblioteca", errs)
        pg.evaluate(f"window.KReader.open({{url:'{url}',title:'{name}',author:'x'}})"); pg.wait_for_function(READY, timeout=120000)
        pg.wait_for_function("!document.querySelector('#kr .kr-prog input').disabled", timeout=120000); pg.wait_for_timeout(800)
        for f in [500, 900, 200]:
            pg.evaluate(f"(()=>{{const r=document.querySelector('#kr .kr-prog input');r.value={f};r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'))}})()"); pg.wait_for_timeout(3000)
            got = pg.evaluate("+document.querySelector('#kr .kr-prog input').value")
            check(f"{name}: la barra lleva al {f/10:.0f}%", abs(got - f) <= 25, got)
        pg.evaluate("(()=>{const r=document.querySelector('#kr .kr-prog input');r.value=1000;r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'))})()"); pg.wait_for_timeout(3000)
        check(f"{name}: al final marca 100%", pg.evaluate("document.querySelector('#kr .kr-prog span').textContent.startsWith('100%')"), pg.evaluate("document.querySelector('#kr .kr-prog span').textContent"))
        check(f"{name}: sin errores al usar la barra", not errs, errs)
        ctx.close()
    ctx = ctx_for(b, {"kr_cfg": json.dumps({"ruler": True})}); pg = page(ctx, base + "index.html#biblioteca")
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'M',author:'x'}})"); pg.wait_for_function(READY, timeout=120000); pg.wait_for_timeout(1200)
    h = pg.eval_on_selector("#kr .rl-h", "e=>{const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
    pg.mouse.move(*h); pg.mouse.down(); pg.mouse.move(h[0], h[1] + 77, steps=6); pg.mouse.up()
    tr = "document.querySelector('#kr .rl-b').style.transform"
    t1 = pg.evaluate(tr); pg.wait_for_timeout(600); t2 = pg.evaluate(tr)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(900); t3 = pg.evaluate(tr)
    check("la regla no se corrige sola al soltarla", t1 == t2, [t1, t2])
    check("la regla no se mueve al pasar de página", t1 == t3, [t1, t3])
    ctx.close()


def t_club(b, base):
    lib = [{"id": MARIANELA, "url": MARIANELA, "title": "Marianela", "author": "Galdós", "pct": 0, "t": 1}]
    seed = {"users": {"u1": {"username": "franco", "usernameLower": "franco"}, "u2": {"name": "Ana", "username": "ana", "usernameLower": "ana"}},
            "friendships": {"u1_u2": {"members": ["u1", "u2"], "names": {"u1": "franco", "u2": "Ana"}}}}
    errs = []; ctx = ctx_for(b, {"kr_lib": json.dumps(lib), "kr_qs_off": "true"}, seed); pg = page(ctx, base + "index.html#club", errs); pg.wait_for_timeout(1500)
    pg.click("#club-body button:has-text('Proponer un libro')"); pg.wait_for_timeout(300)
    pg.check(".ks-box label:has-text('Ana') input"); pg.click(".ks-box button:has-text('Proponer')"); pg.wait_for_timeout(500)
    reads = pg.evaluate("Object.values(window.__fdb.clubReads||{})")
    check("la propuesta queda con plazo y amiga invitada", len(reads) == 1 and reads[0]["members"] == ["u1", "u2"] and reads[0]["joined"] == ["u1"] and reads[0]["deadline"] > 0, reads)
    pg.click("#club-body button:has-text('Leer')"); pg.wait_for_function(READY, timeout=120000)
    pg.wait_for_function("!document.querySelector('#kr .kr-prog input').disabled", timeout=120000); pg.wait_for_timeout(1500)
    chs = pg.evaluate("Object.values(window.__fdb.clubReads)[0].chapters")
    check("el club guarda los capítulos", len(chs) >= 2, chs)
    rid = pg.evaluate("Object.keys(window.__fdb.clubReads)[0]")
    check("sin llegar, no hay diálogo abierto", pg.locator(".ks-ov").count() == 0)
    for _ in range(120):  # pasar páginas hasta terminar un capítulo
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120)
        if pg.locator(".ks-ov").count(): break
    pg.wait_for_timeout(500)
    check("al terminar un capítulo se abre el diálogo", pg.locator(".ks-ov textarea").count() == 1)
    check("el diálogo se ve arriba del lector", pg.evaluate("getComputedStyle(document.querySelector('.ks-ov')).zIndex") == "40")
    pg.fill(".ks-ov textarea", "Muy lindo"); pg.click(".ks-ov button:has-text('Guardar')"); pg.wait_for_timeout(500)
    notes = pg.evaluate(f"Object.values(window.__fdb['clubReads/{rid}/notes']||{{}})")
    done = pg.evaluate(f"(window.__fdb['clubReads/{rid}/progress']||{{}}).u1.done")
    check("el comentario se guarda en un capítulo ya leído", len(notes) == 1 and notes[0]["ch"] < done, [notes, done])
    pg.evaluate("(()=>{const r=document.querySelector('#kr .kr-prog input');r.value=950;r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'))})()"); pg.wait_for_timeout(3000)
    check("saltar con la barra no abre capítulos", pg.locator(".ks-ov").count() == 0 and pg.evaluate(f"window.__fdb['clubReads/{rid}/progress'].u1.done") == done)
    pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(600)
    pg.evaluate("showView('club')"); pg.click("#club-body button:has-text('Comentarios')"); pg.wait_for_timeout(300)
    locked = pg.evaluate("[...document.querySelectorAll('.cl-ch')].map(x=>x.disabled)")
    check("los capítulos sin leer quedan bloqueados", locked[0] is False and locked[-1] is True, locked)
    own = pg.evaluate(f"window.__fdb['clubReads/{rid}/progress'].u1.pct")
    check("al salir del libro el club conserva el progreso", own > .5 and pg.evaluate("document.querySelector('.cl-p small').textContent") != "0%", own)
    check("sin errores en el club", not errs, errs)
    ctx.close()


def t_lector_diseno(b, base):
    errs = []; ctx = ctx_for(b, {"kr_qs_off": "true"}); pg = page(ctx, base + "index.html#biblioteca", errs); pg.set_viewport_size({"width": 360, "height": 740})
    check("biblioteca vacía sin controles que no sirven", pg.locator(".kr-vt").count() == 0 and pg.locator(".kr-lph").count() == 0)
    over = pg.evaluate("(()=>{const c=document.querySelector('.ex-ach');if(!c)return [];const R=c.getBoundingClientRect().right;return [...c.querySelectorAll('.ex-ab')].filter(x=>x.getBoundingClientRect().right>R).map(x=>x.textContent)})()")
    check("los logros entran en su tarjeta", not over, over)
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'x'}})"); pg.wait_for_function(READY, timeout=120000); pg.wait_for_function("!document.querySelector('#kr .kr-prog input').disabled", timeout=120000); pg.wait_for_timeout(300)
    bar = pg.evaluate("(()=>{const r=document.querySelector('#kr .kr-prog input').getBoundingClientRect(),b=document.querySelector('#kr .kr-bot').getBoundingClientRect(),s=document.querySelector('#kr .kr-prog span');return [r.top-b.top,b.height,s.scrollHeight<=s.clientHeight+1]})()")
    check("la barra inferior no tiene espacio de más", bar[0] < 12 and bar[1] < 110 and bar[2], bar)
    pg.click("#kr button[aria-label='Apariencia']"); pg.wait_for_timeout(300)
    pg.click("#kr .ap-more summary"); pg.click("#kr .ap-more .ap-seg button:has-text('2')"); pg.wait_for_timeout(200)
    check("la regla se activa desde Más opciones", pg.evaluate("JSON.parse(localStorage.kr_cfg).ruler===true&&JSON.parse(localStorage.kr_cfg).rl===2"))
    check("Atrás cierra primero el panel", pg.evaluate("document.querySelector('#kr .kr-panel').classList.contains('on')"))
    pg.go_back(); pg.wait_for_timeout(300)
    check("Atrás deja el libro abierto", pg.locator("#kr").count() == 1 and not pg.evaluate("document.querySelector('#kr .kr-panel').classList.contains('on')"))
    check("sin errores en el diseño del lector", not errs, errs)
    ctx.close()


def t_lector_completo(b, base):
    lib = [{"id": MARIANELA, "url": MARIANELA, "title": "Marianela", "author": "Galdós", "cfi": "", "pct": .42, "t": 1}]
    errs = []; ctx = ctx_for(b, {"kr_lib": json.dumps(lib), "kr_qs_off": "true"}); pg = page(ctx, base + "index.html#biblioteca", errs)
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'x'}})"); pg.wait_for_function(READY, timeout=120000)
    disabled = pg.evaluate("document.querySelector('#kr .kr-prog input').disabled")
    pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(400)
    kept = pg.evaluate("JSON.parse(localStorage.kr_lib)[0].pct")
    check("salir antes de contar las páginas no borra el progreso", disabled and kept == .42, [disabled, kept])
    pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'x'}})"); pg.wait_for_function(READY, timeout=120000); pg.wait_for_timeout(500)
    h = pg.evaluate("innerHeight"); fr = pg.evaluate("(()=>{const r=document.querySelector('#kr iframe').getBoundingClientRect();return [r.top,r.bottom]})()")
    check("el libro ocupa de arriba a abajo", fr[0] <= 1 and fr[1] >= h - 1, [fr, h])
    vw = pg.viewport_size
    pg.mouse.click(vw["width"] / 2, vw["height"] / 2); pg.wait_for_timeout(800)
    check("un toque pone el lector en pantalla completa", pg.evaluate("!!document.fullscreenElement"))
    fr = pg.evaluate("(()=>{const r=document.querySelector('#kr iframe').getBoundingClientRect();return [r.top,r.bottom,innerHeight]})()")
    check("en pantalla completa el libro sigue de arriba a abajo", fr[0] <= 1 and fr[1] >= fr[2] - 1, fr)
    check("nada asoma en los bordes con las barras escondidas", pg.evaluate("getComputedStyle(document.querySelector('#kr .kr-panel')).boxShadow") == "none" and pg.evaluate("getComputedStyle(document.querySelector('#kr .kr-bot')).visibility") == "hidden")
    pg.screenshot(path=os.environ.get("KSHOT", "/dev/null")) if os.environ.get("KSHOT") else None
    pg.evaluate("document.querySelector('#kr .kr-top button').click()"); pg.wait_for_timeout(500)
    check("al salir del libro se va de pantalla completa", not pg.evaluate("!!document.fullscreenElement"))
    check("sin errores en pantalla completa", not errs, errs)
    ctx.close()
    for w in (320, 360):
        errs = []; ctx = ctx_for(b, {"kr_lib": json.dumps(lib), "kr_qs_off": "true"}); pg = page(ctx, base + "index.html#biblioteca", errs); pg.set_viewport_size({"width": w, "height": 720})
        pg.evaluate(f"window.KReader.open({{url:'{MARIANELA}',title:'Marianela',author:'x'}})"); pg.wait_for_function(READY, timeout=120000)
        pg.wait_for_function("!document.querySelector('#kr .kr-prog input').disabled", timeout=120000)
        pg.evaluate("document.querySelector('#kr .kr-top button[aria-label=Contenido], #kr .kr-top button[title=Contenido]').click()"); pg.wait_for_timeout(300)
        pg.evaluate("[...document.querySelectorAll('#kr .kr-tabs button')][1].click()"); pg.wait_for_timeout(100)
        pg.click("#kr button:has-text('Marcar esta página')"); pg.wait_for_timeout(300)
        over = pg.evaluate("[...document.querySelectorAll('#kr .kr-tabs button')].filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent)")
        txt = pg.evaluate("document.querySelectorAll('#kr .kr-tabs button')[1].textContent")
        check(f"{txt} entra en su recuadro a {w}px", txt == "Marcas (1)" and not over, over)
        ctx.close()


def t_instalar(b, base):
    uas = {"Chrome": ("Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36", True, "pantallita"),
           "Edge": ("Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0", True, "Aplicaciones"),
           "Safari Mac": ("Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15", False, "Agregar al Dock"),
           "Firefox": ("Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0", False, "Chrome o en Edge")}
    for name, (ua, btn, text) in uas.items():
        ctx = b.new_context(user_agent="Mozilla/5.0 (" + ua, service_workers="block"); pg = ctx.new_page()
        pg.goto(base + "instalar.html", wait_until="load"); pg.wait_for_timeout(4500)
        check(f"instalar en {name}", pg.is_visible("#go") == btn and text in pg.inner_text("#how"), pg.inner_text("#how")[:80])
        ctx.close()
    ctx = b.new_context(); pg = ctx.new_page()
    pg.route("https://francosiderides-boop.github.io/Kinderly/instalar.html", lambda r: r.fulfill(body="ok", content_type="text/html"))
    pg.goto((REPO / "compartir" / "Instalar Kinderly.html").as_uri()); pg.wait_for_timeout(1500)
    check("el archivo para compartir lleva a instalar", pg.url.endswith("/Kinderly/instalar.html"), pg.url)
    pg.goto(base + "descubrir.html"); pg.wait_for_timeout(1500)
    check("la página vieja descubrir.html lleva a Descubrir", pg.url.endswith("#descubrir") and pg.evaluate("document.querySelector('.view.on')?.dataset.view") == "descubrir", pg.url)
    ctx.close()


TESTS = [("versiones", t_versiones), ("inicio", t_inicio), ("meta", t_meta), ("busqueda", t_busqueda), ("amigos", t_amigos),
         ("sincronizacion", t_sincronizacion), ("copia", t_copia), ("lector", t_lector), ("lector_sin_indice", t_lector_sin_indice),
         ("sin_conexion", t_sin_conexion), ("instalar", t_instalar), ("navegacion", t_navegacion), ("perfil", t_perfil), ("regla", t_regla_y_barra), ("club", t_club), ("lector_completo", t_lector_completo), ("lector_diseno", t_lector_diseno)]

if __name__ == "__main__":
    only = sys.argv[1:]
    srv, base = serve()
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-proxy-server"])
        for name, fn in TESTS:
            if only and not any(o in name for o in only):
                continue
            print(f"\n[{name}]")
            try:
                fn(b, base)
            except Exception as e:
                check(f"{name} terminó sin fallar", False, str(e).splitlines()[0][:200])
        b.close()
    srv.shutdown()
    bad = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(bad)} de {len(results)} pruebas bien" + (":" if bad else "."))
    for n, _, d in bad:
        print("  ✗", n, "—", d)
    sys.exit(1 if bad else 0)
