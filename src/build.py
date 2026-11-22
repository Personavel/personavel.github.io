"""Build Personavel from src/.
   python3 src/build.py        -> dist/personavel.html  (one self-contained file for offline use, images inline)
   python3 src/build.py web    -> index.html + assets/ + sw.js (GitHub Pages: minified, cached, Leaflet loaded on demand)
   Minifying uses esbuild through npx (needs Node); if it is not available the files are written unminified."""
import os, sys, json, hashlib, subprocess, shutil, glob, datetime, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
P = lambda *a: os.path.join(HERE, *a)
WEB = len(sys.argv) > 1 and sys.argv[1] == 'web'
APP = ['app1.js', 'app2.js', 'i18n.js', 'app3.js', 'coll.js', 'theme.js', 'moments.js', 'community.js', 'reviews.js', 'visited.js',
       'weather.js', 'tips.js', 'nlu.js', 'traffic.js', 'tripplus.js', 'nav.js', 'mapstyle.js', 'fun.js', 'gestures.js', 'appreview.js', 'ux.js', 'badges.js', 'guides.js', 'routes.js', 'cloud.js', 'account.js', 'content.js', 'admin.js', 'areas.js', 'app4.js']
rd = lambda f: open(f, encoding='utf-8').read()
FONTS = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Dancing+Script:wght@600;700&family=Faustina:wght@400;600;700&display=swap&subset=vietnamese'
TITLE = 'Personavel – Bản đồ du lịch tự túc TP.HCM'
DESC = 'Personavel – nền tảng bản đồ du lịch tự túc, thuyết minh và gợi ý lịch trình cá nhân hóa tại TP.HCM. Dự án của nhóm 11A13, THPT Lê Quý Đôn.'
SITE = 'https://personavel.github.io/'
AREAS_JSON = os.path.join(ROOT, 'data', 'areas.json')   # from the data team; no file → no area filter
SUPABASE_JS = 'supabase-js-2.119.1.js'   # pinned; update the file name here when upgrading

def minify(code, loader):
    try:
        r = subprocess.run(['npx', '-y', 'esbuild@0.28.2', '--minify', '--loader=' + loader, '--charset=utf8', '--log-level=error'],
                           input=code.encode('utf-8'), capture_output=True, timeout=180)
        if r.returncode == 0 and r.stdout: return r.stdout.decode('utf-8')
        print('esbuild:', r.stderr.decode()[:400])
    except Exception as e: print('esbuild unavailable:', e)
    return code

ICON_V = hashlib.sha256(b''.join(open(os.path.join(HERE, 'static', f), 'rb').read() for f in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-48.png'])).hexdigest()[:8]
FAVICON_DATA = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(HERE, 'static', 'favicon-48.png'), 'rb').read()).decode()
def head(extra=''):
    return f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#3D7FB8">
<link rel="icon" href="{('assets/favicon-48.png?v=' + ICON_V) if WEB else FAVICON_DATA}" type="image/png" sizes="48x48">
{extra}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet" media="print" onload="this.media='all'"><noscript><link href="{FONTS}" rel="stylesheet"></noscript>'''

if not WEB:
    # ---------- single offline file ----------
    css = rd(P('vendor', 'leaflet.css')) + '\n' + rd(P('vendor', 'MarkerCluster.css')) + '\n' + rd(P('style.css')) + '\n' + rd(P('font_brush.css'))
    js = '\n'.join(rd(P(f)) for f in ['imgs_desk.js', 'data.js'] + APP)
    html = f'''<!DOCTYPE html>
<html lang="vi">
<head>
{head()}
<style>
{minify(css, 'css')}
</style>
<script>
{rd(P('vendor', 'leaflet.js'))}
{rd(P('vendor', 'leaflet.markercluster.js'))}
</script>
<script>
{rd(P('vendor', SUPABASE_JS))}
</script>
{('<script>window.PV_AREAS=' + json.dumps(json.load(open(AREAS_JSON, encoding='utf-8')), ensure_ascii=False, separators=(',', ':')) + ';</script>') if os.path.exists(AREAS_JSON) else ''}
</head>
<body>
<script>
{minify(js, 'js')}
</script>
</body>
</html>
'''
    out = os.path.join(ROOT, 'dist', 'personavel.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html); print(out, len(html.encode()))
    sys.exit()

# ---------- web build ----------
A = os.path.join(ROOT, 'assets'); os.makedirs(A, exist_ok=True)
def emit(name, ext, content):
    h = hashlib.sha256(content.encode('utf-8')).hexdigest()[:10]
    fn = f'{name}.{h}.{ext}'
    for old in glob.glob(os.path.join(A, f'{name}.*.{ext}')):
        if os.path.basename(old) != fn: os.remove(old)
    open(os.path.join(A, fn), 'w', encoding='utf-8').write(content)
    return 'assets/' + fn
import re, base64
def font_files(css):
    def rep(m):
        raw = base64.b64decode(m.group(2)); h = hashlib.sha256(raw).hexdigest()[:10]; fn = f'pvbrush.{h}.woff2'
        open(os.path.join(A, fn), 'wb').write(raw); return f'url({fn})'
    for old in glob.glob(os.path.join(A, 'pvbrush.*.woff2')): os.remove(old)
    return re.sub(r'url\((["\']?)data:font/woff2;base64,([A-Za-z0-9+/=]+)\1\)', rep, css)
app_css = emit('app', 'css', minify(rd(P('style.css')) + '\n' + font_files(rd(P('font_brush.css'))), 'css'))
data_js = emit('data', 'js', minify(rd(P('imgs_web.js')) + '\n' + rd(P('data.js')), 'js'))
app_js = emit('app', 'js', minify('\n'.join(rd(P(f)) for f in APP), 'js'))
lf_css = emit('leaflet', 'css', minify(rd(P('vendor', 'leaflet.css')) + '\n' + rd(P('vendor', 'MarkerCluster.css')), 'css'))
lf_js = emit('leaflet', 'js', rd(P('vendor', 'leaflet.js')) + '\n' + rd(P('vendor', 'leaflet.markercluster.js')))
sb_js = emit('supabase', 'js', rd(P('vendor', SUPABASE_JS)))   # loaded only when the visitor signs in (src/cloud.js)
for f in ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-48.png', 'og.jpg']:
    if os.path.exists(P('static', f)): shutil.copy(P('static', f), os.path.join(A, f))

ng = rd(P('imgs_web.js')).count('img/g')
seo = f'''<link rel="canonical" href="{SITE}">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png?v={ICON_V}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Personavel">
<meta property="og:title" content="{TITLE}"><meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE}"><meta property="og:image" content="{SITE}assets/og.jpg"><meta property="og:locale" content="vi_VN"><meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{TITLE}"><meta name="twitter:description" content="{DESC}"><meta name="twitter:image" content="{SITE}assets/og.jpg">
<link rel="preload" href="{app_css}" as="style"><link rel="preload" href="{data_js}" as="script"><link rel="preload" href="{app_js}" as="script">
'''
# static first screen (hero photo + greeting) painted before any app script runs – this is the LCP element.
# The <link rel=preload imagesrcset> in <head> already fetches the same photo; app4.js fades this layer out once the app is drawn.
boot = f"""<div id="boot" aria-hidden="true"><img id="boot-img" alt="" width="1600" height="1067" fetchpriority="high" sizes="(min-width:821px) 100vw, 64vw" srcset="img/g0-480.webp 480w, img/g0-800.webp 800w, img/g0-1200.webp 1200w, img/g0.webp 1600w" src="img/g0-800.webp"><div class="boot-shade"></div>
<div class="boot-txt"><b>Personavel</b><p class="boot-hi"><span id="boot-hello">Xin chào,</span> <em id="boot-name">Du khách</em>!</p><span id="boot-sub">Bản đồ du lịch tự túc TP.HCM</span><i class="boot-bot"></i></div></div>
<script>(function(){{var g=function(k,d){{try{{var v=JSON.parse(localStorage.getItem('pv_'+k));return v==null?d:v}}catch(e){{return d}}}};
var en=(g('settings',{{}})||{{}}).lang==='en',p=g('profile',null),n=p&&p.name?String(p.name).slice(0,40):(en?'Traveller':'Du khách');document.getElementById('boot-name').textContent=n;
if(en){{document.getElementById('boot-hello').textContent='Hello,';document.getElementById('boot-sub').textContent='Self-guided travel map of Ho Chi Minh City'}}}})()</script>"""
boot_css = ('#boot{position:fixed;inset:0;z-index:1;overflow:hidden;background:#1F4E79;color:#fff;font-family:Nunito,system-ui,sans-serif;transition:opacity .25s}'
  '#boot.out{opacity:0;pointer-events:none}#boot-img{position:absolute;left:0;right:0;top:0;width:100%;height:72%;object-fit:cover}'
  '.boot-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,61,145,.1) 0,rgba(31,78,121,.5) 45%,#1F4E79 71%)}'
  '.boot-txt{position:absolute;left:0;right:0;bottom:12vh;display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 20px;text-align:center;text-shadow:0 2px 10px rgba(0,0,0,.35)}'
  '.boot-txt b{font-size:clamp(30px,8vw,46px);font-weight:800;letter-spacing:.5px}.boot-hi{margin:0;font-size:clamp(20px,5.4vw,28px);font-weight:700}.boot-hi em{font-style:normal;color:#CFE3F6}'
  '#boot-sub{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;opacity:.9}'
  '.boot-bot{width:34px;height:34px;margin-top:10px;border-radius:50%;border:4px solid rgba(255,255,255,.35);border-top-color:#fff;animation:bspin 1s linear infinite}'
  '@keyframes bspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.boot-bot{animation:none}#boot{transition:none}}')
# service worker registration: a new version applies itself at a quiet moment (never while typing / in a box / navigating);
# ?nosw in the address bar removes the service worker and every cache on this device (emergency switch)
sw_reg = ("(function(){if(!('serviceWorker' in navigator))return;var q=location.search;"
  "if(/[?&]nosw\\b/.test(q)){try{sessionStorage.setItem('pv_nosw','1')}catch(e){}navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister()}))})"
  ".then(function(){return window.caches?caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}):0})"
  ".then(function(){location.replace(location.pathname+location.hash)});return}"
  "try{if(sessionStorage.getItem('pv_nosw'))return}catch(e){}if(location.protocol!=='https:')return;"
  "var en=false;try{en=(JSON.parse(localStorage.getItem('pv_settings'))||{}).lang==='en'}catch(e){}"
  "var asked=false,wait=null;"
  # a new version applies itself – but never while the visitor is typing, has a box open, is navigating or listening;
  # in that case it waits for a quiet moment or for the tab to be hidden
  "function busy(){var a=document.activeElement;return !!(document.querySelector('.modal-bg,#welcome,#navMap,#langgate')||(a&&a.matches&&a.matches('input,textarea,select,[contenteditable=true]'))||(window.speechSynthesis&&speechSynthesis.speaking))}"
  "function note(){if(document.getElementById('pv-upd'))return;var d=document.createElement('div');d.id='pv-upd';d.setAttribute('role','status');"
  "d.style.cssText='position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:14px;background:#0B3D91;color:#fff;font:600 14px/1.3 Nunito,system-ui,sans-serif;box-shadow:0 8px 24px rgba(11,61,145,.35)';"
  "d.textContent=en?'Updating to the new version…':'Đang cập nhật phiên bản mới…';document.body.appendChild(d)}"
  "function apply(w){if(asked)return;asked=true;clearInterval(wait);if(document.visibilityState==='visible')note();w.postMessage('SKIP_WAITING');setTimeout(function(){mark();location.reload()},4000)}"
  "function auto(w){if(!busy()){apply(w);return}clearInterval(wait);wait=setInterval(function(){if(!busy())apply(w)},15000);"
  "document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')apply(w)})}"
  "function mark(){try{sessionStorage.setItem('pv_upd','1')}catch(e){}}navigator.serviceWorker.addEventListener('controllerchange',function(){if(asked){mark();location.reload()}});"
  "addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(r){"
  "function watch(w){w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)auto(w)})}"
  "if(r.waiting&&navigator.serviceWorker.controller)auto(r.waiting);if(r.installing)watch(r.installing);"
  "r.addEventListener('updatefound',function(){watch(r.installing)});"
  "document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')r.update().catch(function(){})});"
  "setInterval(function(){r.update().catch(function(){})},30*60*1000)"
  "}).catch(function(){})})})()")
html = f'''<!DOCTYPE html>
<html lang="vi">
<head>
{head(seo)}
<style>{boot_css}</style>
</head>
<body>
{boot}
<link rel="stylesheet" href="{app_css}">
<script>window.PV_LEAFLET={{css:"{lf_css}",js:"{lf_js}"}};window.PV_SUPABASE="{sb_js}";</script>
<script defer src="{data_js}"></script>
<script defer src="{app_js}"></script>
<noscript><p style="padding:20px;font-family:sans-serif">Personavel cần bật JavaScript. · Personavel needs JavaScript enabled.</p></noscript>
<script>{sw_reg}</script>
</body>
</html>
'''
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)

# PWA: manifest + service worker (precache the app shell; images cached when first seen)
json.dump({"name": "Personavel – Bản đồ du lịch tự túc TP.HCM", "short_name": "Personavel", "lang": "vi", "start_url": "./#home", "scope": "./",
           "display": "standalone", "background_color": "#F4F9FE", "theme_color": "#3D7FB8", "description": DESC,
           "icons": [{"src": f"assets/icon-192.png?v={ICON_V}", "sizes": "192x192", "type": "image/png"},
                     {"src": f"assets/icon-512.png?v={ICON_V}", "sizes": "512x512", "type": "image/png"},
                     {"src": f"assets/icon-maskable-512.png?v={ICON_V}", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
          open(os.path.join(ROOT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
ver = hashlib.sha256((app_js + app_css + data_js + lf_js + (rd(AREAS_JSON) if os.path.exists(AREAS_JSON) else '') + ICON_V).encode()).hexdigest()[:10]
shell = ['./', 'index.html', app_css, data_js, app_js, lf_css, lf_js, 'manifest.json', f'assets/icon-192.png?v={ICON_V}', f'assets/favicon-48.png?v={ICON_V}'] + (['data/areas.json'] if os.path.exists(AREAS_JSON) else [])
KILL = '--kill-sw' in sys.argv
if KILL:
    # emergency: a service worker that deletes every cache, unregisters itself and reloads open tabs from the network
    open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write('''/* Personavel – emergency service worker removal (python3 src/build.py web --kill-sw) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
  .then(() => self.registration.unregister()).then(() => self.clients.matchAll({type: 'window'})).then(cs => cs.forEach(c => c.navigate(c.url)))));
''')
else:
    open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write(f'''/* Personavel service worker – generated by src/build.py ({ver}) */
const V = 'pv-{ver}', SHELL = {json.dumps(shell)};
// a new version installs in the background and WAITS; the page shows "Có phiên bản mới – Tải lại" and sends SKIP_WAITING
self.addEventListener('install', e => {{ e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); }});
self.addEventListener('message', e => {{ if (e.data === 'SKIP_WAITING') self.skipWaiting(); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'pv-img').map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;            // maps, Supabase, routing: always live
  if (u.pathname.endsWith('/sw.js')) return;
  if (e.request.mode === 'navigate') {{                                               // HTML: network first, offline copy only as fallback
    e.respondWith(fetch(e.request, {{cache: 'no-cache'}}).then(r => {{ if (r.ok && !u.search.includes('nosw')) {{ const c = r.clone(); caches.open(V).then(x => x.put('index.html', c)); }} return r; }})
      .catch(() => caches.open(V).then(x => x.match('index.html')).then(h => h || caches.match('index.html'))));
    return;
  }}
  if (u.pathname.includes('/img/')) {{                                                // photos: cache first
    e.respondWith(caches.open('pv-img').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {{ if (r.ok) c.put(e.request, r.clone()); return r; }}))));
    return;
  }}
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));       // hashed assets: cache first (file name changes with content)
}});
''')
today = datetime.date.today().isoformat()
open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{SITE}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq></url></urlset>\n')
open(os.path.join(ROOT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n')
sizes = {k: os.path.getsize(os.path.join(ROOT, v)) for k, v in [('index', 'index.html'), ('app.js', app_js), ('app.css', app_css), ('data.js', data_js), ('leaflet.js', lf_js)]}
print('web build', sizes)
