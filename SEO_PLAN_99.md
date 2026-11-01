# Plan SEO de Blandis: de ~83 a 99/100

Fecha: 1 de noviembre de 2026 · Sitio: https://blandis.u0f.es/ · Herramientas: claude-seo 2.5.0 (`fetch_page`, `parse_html`, `render_page`, `agentic_check`, `metadata_template`) y PageSpeed Insights (Lighthouse 13.6, móvil emulado, 1 nov 2026 12:27 CET).

## Estado (1 nov 2026)

| Paso | Estado |
|---|---|
| 1: A1, A4, B1, B2, C2, C4, D1–D3, E1 | Hecho. `robots.txt` permite todo, también el entrenamiento (`ai-train=yes`); para excluirlo, ver el comentario del propio fichero. |
| 2: A3, C3, E3, F1, G1 | Hecho. Capturas reales en `img/*.webp`; el CSS se inserta en línea y el `<lastmod>` se rellena en el build (`.github/workflows/pages.yml`). |
| 3: A2 | Hecho. La home tiene scroll: el juego ocupa la primera pantalla y debajo va la sección `#about-game` (517 palabras). El scroll se bloquea durante la partida. **Falta probarlo en un iPhone y un Android reales.** |
| 4: E2 | **Pendiente, necesita tu cuenta:** crear el proyecto en Cloudflare Pages, mover los DNS de `blandis.u0f.es` y cambiar a la vez las URLs `.html` por URLs sin extensión (ver E2). |

## 1. De dónde partimos

### Puntuación según la rúbrica completa del plugin (7 categorías)

| Categoría | Peso | Ahora | Objetivo | Puntos que faltan |
|---|---|---|---|---|
| SEO técnico | 22 % | 93 | 99 | +1,3 |
| Calidad del contenido | 23 % | 62 | 98 | +8,3 |
| SEO on-page | 20 % | 90 | 100 | +2,0 |
| Datos estructurados | 10 % | 85 | 100 | +1,5 |
| Rendimiento (CWV) | 10 % | 98 | 99 | +0,1 |
| Preparación para búsqueda con IA | 10 % | 70 | 98 | +2,8 |
| Imágenes | 5 % | 90 | 100 | +0,5 |
| **Total ponderado** | | **≈ 83** | **≈ 99** | **+16** |

La ficha de página de la revisión anterior daba 86 porque solo tenía 5 categorías. La rúbrica completa añade la preparación para IA y pesa más el contenido, y ahí está casi todo lo que falta.

### Lo que ya está al máximo (no tocar)

- **Lighthouse móvil:** Rendimiento 98 · Accesibilidad 100 · Prácticas recomendadas 100 · SEO 100 · Navegación agéntica 2/2. LCP 1,0 s, TBT 10 ms, CLS 0.
- Title (60 caracteres) y meta description (158) de la home, sin plantilla (`templated: false`).
- Canonical en todas las páginas indexables. `noindex, follow` en privacidad, cookies y términos.
- `robots.txt` abierto con sitemap. `sitemap.xml` válido con hreflang en/es/x-default.
- Hreflang recíproco entre `how-to-play.html` y `como-jugar.html` (525 palabras cada una, H1 y H2–H3 bien jerarquizados).
- http → https con 301. No existe `www.`, así que no hay duplicado www/no-www.
- Los 404 reales devuelven estado 404.
- Una sola H1 en la home, también en la versión renderizada.

### Datos que no se pudieron medir

- **CrUX (Core Web Vitals de usuarios reales):** el sitio aún no tiene tráfico suficiente para tener datos de campo.
- **API de PageSpeed:** sin clave devuelve 429. Los datos de Lighthouse de arriba salen de la web pagespeed.web.dev.
- **Backlinks e indexación en Search Console:** necesitan credenciales (`/seo google`, `/seo backlinks`).

---

## 2. Cambios, ordenados por impacto

Cada cambio indica: **dónde** se hace, **qué** hay que hacer, **cuántos puntos** aporta, **cómo comprobar** que funcionó y el **riesgo**.

### Bloque A: Contenido (+8,3 puntos, el más importante)

#### A1. Pasar el texto estático de la home de `<header>` a `<main>` · +0,5
- **Dónde:** [index.html:61-64](index.html:61)
- **Qué:** cambiar `<header class="sr-only">…</header>` por `<main class="sr-only">…</main>`.
- **Por qué:** el parser del plugin y muchos extractores de contenido de los pipelines de IA descartan `<header>`, `<nav>` y `<footer>` como relleno de plantilla. Por eso hoy cuenta solo 21 palabras en el HTML estático. Además, en semántica es el contenido principal.
- **Cómo comprobarlo:** `parse_html.py` debe contar unas 60 palabras en el HTML estático.
- **Riesgo:** ninguno.

#### A2. Sección de contenido visible bajo el juego, de al menos 500 palabras · +6,0
- **Por qué:** la rúbrica exige 500 palabras para una home (`quality-gates.md`) y hoy hay unas 60 estáticas y 106 renderizadas. Google no publica un mínimo de palabras, pero la home es la URL con más autoridad y ahora mismo no explica casi nada del juego.
- **No hay que hacerlo con texto oculto.** Meter 500 palabras dentro de `sr-only` es texto oculto: incumple las políticas de spam de Google y puede llevar a una penalización manual. El texto oculto actual (unas 50 palabras que repiten el eslogan visible) es aceptable. 500 palabras no lo son.
- **Qué:** convertir la home en una página con scroll. El juego ocupa la primera pantalla y debajo va una sección visible.
  1. En [css/style.css](css/style.css): hoy todo es `position:fixed` y `html, body { overflow:hidden; touch-action:none }`.
     - Crear un contenedor `#stage { position:relative; height:100svh; overflow:hidden; touch-action:none }`.
     - Pasar `canvas`, `#overlay`, `#btns`, `#side` y `#toast` de `fixed` a `absolute` dentro de `#stage`.
     - Quitar `overflow:hidden` y `touch-action:none` de `html, body`.
     - Mientras se juega, bloquear el scroll con `body.playing { overflow:hidden }`, para que la rueda del ratón no mueva la página a mitad de partida.
  2. En [src/render.js:26](src/render.js:26) y [src/ui/sidebar.js:31](src/ui/sidebar.js:31): medir el tamaño de `#stage` (`getBoundingClientRect()` o un `ResizeObserver`) en lugar de `innerWidth`/`innerHeight`.
  3. En [index.html](index.html), después del `<canvas>`, añadir esta sección:
     ```html
     <section id="about-game" class="page">
       <h2>A squishy twist on the 2048 merge puzzle</h2>
       <p>…qué es Blandis y qué lo diferencia (físicas de cuerpos blandos, lanzar en vez de deslizar)…</p>
       <h2>How a round works</h2>
       <p>…elegir, apuntar, lanzar, aplastar; cuándo se fusionan dos blandis; cuándo se acaba la partida…</p>
       <h2>Five game modes</h2>
       <ul>…Clásico, Contrarreloj, Speedrun, Sprint 512, 40 tiros, una frase cada uno…</ul>
       <h2>Achievements, color styles and the global top</h2>
       <p>…36 logros, 8 estilos, clasificación mundial por modo…</p>
       <h2>Play anywhere, free</h2>
       <p>…móvil y escritorio, sin instalar, sin anuncios, progreso guardado en el dispositivo…</p>
       <p><a href="how-to-play.html">Full guide: rules, controls and FAQ</a> · <a href="como-jugar.html" hreflang="es" lang="es">Guía en español</a></p>
     </section>
     ```
     Los textos deben salir del juego real (`src/i18n.js`, `src/modes.js`, `src/achievements.js`), igual que en las guías, sin relleno.
  4. Añadir un indicador de scroll discreto ("↓ About the game") en el menú de inicio.
- **Cómo comprobarlo:** `parse_html.py` debe contar 500 palabras o más en el HTML estático. Lighthouse debe seguir con CLS 0, y el juego debe ir igual en móvil (lanzar sin que se mueva la página).
- **Riesgo:** medio. Es el único cambio que toca la experiencia de juego. Hay que probarlo en un iPhone y un Android reales.
- **Alternativa si no quieres scroll:** saltarse A2. La puntuación se queda en unos **96–97**, porque el contenido de la home baja de 98 a unos 80. Todo lo demás del plan sigue valiendo.

#### A3. Ampliar `about.html` a 400 palabras o más · +1,0
- **Dónde:** [legal/about.html](legal/about.html), que hoy tiene 179 palabras.
- **Qué:** añadir secciones con experiencia real (E-E-A-T):
  - "Why I made Blandis": la motivación y la idea de físicas blandas.
  - "How it's built": canvas, físicas propias, sin frameworks, clasificación en Cloudflare Workers.
  - "Changelog": las últimas versiones con fecha.
  - Una foto o avatar del autor con `alt`, si quieres dar la cara.
- **Cómo comprobarlo:** 400 palabras o más.
- **Riesgo:** ninguno.

#### A4. Fechas visibles en las guías · +0,8
- **Dónde:** [how-to-play.html](how-to-play.html) y [como-jugar.html](como-jugar.html), debajo del H1.
- **Qué:** `<p class="updated">Last updated: <time datetime="2026-11-01">1 November 2026</time></p>`, igual que en `about.html`. La misma fecha va también en el schema (B2).
- **Por qué:** frescura y señal de mantenimiento, en contenido y en E-E-A-T.

### Bloque B: Datos estructurados (+1,5)

#### B1. Completar `VideoGame` y añadir el autor como entidad · +0,8
- **Dónde:** el JSON-LD de [index.html:24-56](index.html:24).
- **Qué:** sustituir el `@graph` por esto:
  ```json
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://blandis.u0f.es/#website",
        "name": "Blandis",
        "url": "https://blandis.u0f.es/",
        "inLanguage": ["en", "es"],
        "publisher": { "@id": "https://blandis.u0f.es/#author" }
      },
      {
        "@type": "Person",
        "@id": "https://blandis.u0f.es/#author",
        "name": "Joel",
        "url": "https://blandis.u0f.es/legal/about.html",
        "sameAs": ["https://github.com/u0f"]
      },
      {
        "@type": "VideoGame",
        "@id": "https://blandis.u0f.es/#game",
        "name": "Blandis",
        "url": "https://blandis.u0f.es/",
        "description": "A free physics puzzle game for the browser: pick, launch, squish and merge soft numbered blobs up to 2048.",
        "image": "https://blandis.u0f.es/img/blandis-social.png",
        "screenshot": "https://blandis.u0f.es/img/blandis-social.png",
        "genre": ["Puzzle", "Physics puzzle"],
        "gamePlatform": "Web browser",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Any (web browser)",
        "playMode": "SinglePlayer",
        "numberOfPlayers": { "@type": "QuantitativeValue", "value": 1 },
        "inLanguage": ["en", "es"],
        "isAccessibleForFree": true,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "availability": "https://schema.org/InStock" },
        "datePublished": "AAAA-MM-DD",
        "dateModified": "2026-11-01",
        "author": { "@id": "https://blandis.u0f.es/#author" },
        "license": "https://polyformproject.org/licenses/noncommercial/1.0.0/",
        "subjectOf": { "@type": "WebPage", "url": "https://blandis.u0f.es/how-to-play.html", "name": "How to play Blandis" }
      }
    ]
  }
  ```
  - Pon la fecha real de lanzamiento en `datePublished`. Si no la sabes, quita la línea: una fecha inventada es peor que ninguna.
- **Nota:** Google no tiene rich result para `VideoGame`. El beneficio es de entidad (Knowledge Graph, IA), no de SERP.
- **Cómo comprobarlo:** sin errores en https://validator.schema.org/ ni en la Prueba de resultados enriquecidos.

#### B2. Schema de página en las guías y en About · +0,7
- **Guías** ([how-to-play.html:27-35](how-to-play.html:27) y su equivalente en español): añadir al JSON-LD, junto al `BreadcrumbList`, un nodo:
  ```json
  {
    "@type": "WebPage",
    "@id": "https://blandis.u0f.es/how-to-play.html#webpage",
    "name": "How to play Blandis",
    "inLanguage": "en",
    "isPartOf": { "@id": "https://blandis.u0f.es/#website" },
    "about": { "@id": "https://blandis.u0f.es/#game" },
    "author": { "@id": "https://blandis.u0f.es/#author" },
    "datePublished": "AAAA-MM-DD",
    "dateModified": "2026-11-01"
  }
  ```
  En `como-jugar.html`, el mismo nodo con `"@id": "https://blandis.u0f.es/como-jugar.html#webpage"`, `"name": "Cómo jugar a Blandis"`, `"inLanguage": "es"` y además `"translationOfWork": { "@id": "https://blandis.u0f.es/how-to-play.html#webpage" }`.
  - **No añadas `FAQPage`** para la sección de preguntas: Google retiró los rich results de FAQ para todos los sitios el 7 de mayo de 2026.
- **About:** añadir `AboutPage` con `mainEntity` apuntando a `#author` y `about` a `#game`.

### Bloque C: Preparación para búsqueda con IA (+2,8)

#### C1. Contenido principal sin JavaScript · +1,2
- Se resuelve con **A1 y A2**. `agentic_check` hoy da `[warn] Primary content present without JavaScript`.

#### C2. `llms.txt` · +0,6
- **Dónde:** nuevo `llms.txt` en la raíz, que hay que añadir también al `cp` de [.github/workflows/pages.yml:40](.github/workflows/pages.yml:40).
- **Qué:**
  ```markdown
  # Blandis

  > Free squishy physics merge puzzle for the browser: launch soft numbered blobs into a jar and merge equal numbers up to 2048. Mobile and desktop, no install, no ads.

  ## Guides
  - [How to play Blandis](https://blandis.u0f.es/how-to-play.html): rules, controls, five game modes, achievements and FAQ
  - [Cómo jugar a Blandis](https://blandis.u0f.es/como-jugar.html): la misma guía en español

  ## About
  - [About Blandis](https://blandis.u0f.es/legal/about.html): who makes it, license and contact
  ```
- **Nota:** Google lo ignora. Lo leen algunos agentes y Lighthouse Agentic Browsing.

#### C3. Versión Markdown de las guías · +0,5
- Generar `how-to-play.md` y `como-jugar.md` con el mismo contenido y enlazarlas desde `llms.txt` y con `<link rel="alternate" type="text/markdown" href="how-to-play.md">` en el `<head>` de cada guía.

#### C4. Política explícita para agentes de IA en `robots.txt` · +0,5
- **Dónde:** [robots.txt](robots.txt).
- **Qué:** declarar tu preferencia con grupos explícitos y Content-Signal. Por ejemplo, para permitir búsqueda y citas pero no entrenamiento:
  ```
  User-agent: *
  Content-Signal: search=yes, ai-input=yes, ai-train=no
  Allow: /

  User-agent: GPTBot
  User-agent: ClaudeBot
  User-agent: Google-Extended
  User-agent: CCBot
  Disallow: /

  User-agent: OAI-SearchBot
  User-agent: Claude-SearchBot
  User-agent: PerplexityBot
  Allow: /

  Sitemap: https://blandis.u0f.es/sitemap.xml
  ```
- **Decisión tuya:** si quieres que te entrenen modelos (más menciones a largo plazo), deja todo en `Allow`. Lo que puntúa es que la política sea deliberada, no que sea restrictiva.

### Bloque D: On-page (+2,0)

#### D1. Twitter Cards completas · +0,4
- **Dónde:** después de [index.html:21](index.html:21) y de la línea equivalente en las dos guías.
- **Qué:** añadir `<meta name="twitter:title">`, `<meta name="twitter:description">`, `<meta name="twitter:image">` y `<meta name="twitter:image:alt">` con los mismos valores que OG.

#### D2. Open Graph en `about.html` · +0,4
- **Dónde:** [legal/about.html](legal/about.html), que hoy no tiene ni OG ni Twitter.
- **Qué:** el mismo bloque que en las guías: `og:type=profile` o `website`, `title`, `description`, `url`, `image` con dimensiones y alt, y `twitter:card`.

#### D3. `og:image:type` · +0,2
- Añadir `<meta property="og:image:type" content="image/png">` en las 4 páginas con OG.

#### D4. Enlaces internos estáticos en la home · +0,6
- Hoy los enlaces rastreables sin JS son solo los del `<noscript>`. Con A2 la sección visible ya los incluye. Si no haces A2, añade los enlaces a las guías y a About en un `<footer>` visible pequeño, sin `sr-only`. Un enlace invisible pero enfocable con el teclado incumple WCAG 2.4.7 y bajaría la accesibilidad de 100.

#### D5. Duplicados `/index.html` y URLs sin extensión · +0,4
- `https://blandis.u0f.es/index.html` y `https://blandis.u0f.es/how-to-play` (sin `.html`) devuelven 200 con el mismo contenido. El canonical ya lo mitiga. GitHub Pages no permite redirecciones 301, así que la solución completa depende de E2. Mientras tanto, asegúrate de que ningún enlace interno apunte a `index.html` o a URLs sin extensión (hoy no hay ninguno).

### Bloque E: Técnico (+1,3)

#### E1. `favicon.ico` · +0,2
- Hoy da 404. Muchos clientes y crawlers piden `/favicon.ico` sin leer el `<link rel="icon">`. Genera un `.ico` de 32×32 desde `favicon.svg`, ponlo en la raíz y añádelo al `cp` del workflow.

#### E2. Cabeceras de seguridad y caché (solo cambiando de hosting) · +0,9
- **Problema:** GitHub Pages no permite cabeceras propias:
  - Falta **HSTS**, **CSP**, **X-Frame-Options/frame-ancestors** y **COOP**. Lighthouse las lista como aviso y la rúbrica técnica del plugin las puntúa.
  - **`Cache-Control: max-age=600`** se aplica también a los assets versionados (`game.js?v=`, `style.css?v=`, la fuente). PSI marca 61 KiB de caché ineficiente.
- **Opción recomendada:** pasar el hosting a **Cloudflare Pages**. Ya tienes cuenta por el Worker de la clasificación. Con un fichero `_headers`:
  ```
  /*
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Cross-Origin-Opener-Policy: same-origin
    Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' <URL_API_CLASIFICACION> https://*.google-analytics.com https://*.analytics.google.com; img-src 'self' data: https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'
  /game.js
    Cache-Control: public, max-age=31536000, immutable
  /css/*
    Cache-Control: public, max-age=31536000, immutable
  /fonts/*
    Cache-Control: public, max-age=31536000, immutable
  ```
  - Ajusta la CSP a lo que cargue realmente el juego (Analytics tras consentimiento y la API de la clasificación) y pruébala primero con `Content-Security-Policy-Report-Only`.
- **Ojo con las URLs:** Cloudflare Pages redirige `/how-to-play.html` a `/how-to-play` con un 308. Si migras:
  - Cambia a URLs sin extensión **todos** los canonical, hreflang, `og:url`, el sitemap, el schema y los enlaces internos, en el mismo deploy.
  - Si no, cada canonical apuntará a una URL que redirige, lo que es una señal contradictoria para Google.
  - Como efecto positivo, esto resuelve D5.
- **Alternativa sin migrar:** poner los DNS de `u0f.es` en Cloudflare (ahora están en GoDaddy, `domaincontrol.com`) con proxy activado delante de GitHub Pages, y usar Transform Rules para las cabeceras y Cache Rules para la caché. No cambia ninguna URL.
- **Riesgo:** medio, porque es un cambio de infraestructura. Las cabeceras de seguridad no son un factor de ranking directo: aportan puntos de rúbrica y seguridad real, no posiciones.

#### E3. `lastmod` en el sitemap · +0,2
- **Dónde:** [sitemap.xml](sitemap.xml) y el workflow.
- **Qué:** en el paso de build, rellenar `<lastmod>` con la fecha del último commit que tocó cada fichero:
  ```bash
  for f in index.html how-to-play.html como-jugar.html legal/about.html; do
    d=$(git log -1 --format=%cs -- "$f"); …sustituir el marcador en _site/sitemap.xml…
  done
  ```
  - Requiere `fetch-depth: 0` en `actions/checkout`.
  - No pongas la fecha del deploy en todas las URLs: Google ignora los `lastmod` que cambian sin cambios reales.

### Bloque F: Rendimiento (+0,1, ya está en 98)

#### F1. CSS que bloquea el renderizado (PSI estima 300 ms) · +0,05
- Insertar `css/style.css` (11,5 KB, unos 3 KB con gzip) en línea dentro de `index.html` durante el build, con un paso más en el workflow que sustituya el `<link>` por `<style>`. Solo en la home; las guías comparten `legal.css`.

#### F2. Caché de assets · +0,05
- Se resuelve con E2.

#### F3. Una tarea larga en el hilo principal
- Seguramente la inicialización de las físicas y del primer frame. No afecta a la puntuación porque el TBT es de 10 ms. Opcional: retrasar con `requestIdleCallback` la petición de la clasificación y la comprobación de versión (`src/update.js`).

### Bloque G: Imágenes (+0,5)

#### G1. Capturas reales en las guías
- Añadir 2 o 3 capturas del juego (`.webp`, de 800 px de ancho como mucho y menos de 100 KB cada una) en `how-to-play.html` y `como-jugar.html`, por ejemplo una fusión, la pantalla de modos y la clasificación. Cada una con:
  - `alt` descriptivo ("Two 64 blobs merging into 128 inside the jar").
  - `width`/`height` explícitos para evitar CLS.
  - `loading="lazy"` en las que no estén en la primera pantalla.
- Sumar sus URLs a `screenshot` en el schema (B1) como array.
- Aporta a imágenes, a contenido y a Google Imágenes.

#### G2. Imagen OG
- 117 KB en PNG está bien. **No la pases a WebP:** algunas apps de mensajería no muestran OG en WebP.

---

## 3. Fuera del repositorio (no suben la nota del plugin, pero sí el posicionamiento real)

| Acción | Por qué |
|---|---|
| Dar de alta y verificar el dominio en **Google Search Console** y enviar el sitemap | Ver la indexación, las consultas y los errores. Además, con credenciales, `/seo google` mide los CWV reales. |
| Darlo de alta en **Bing Webmaster Tools** (se puede importar desde GSC) | Bing alimenta a ChatGPT Search y a Copilot. |
| Activar **IndexNow** (`indexnow_submit.py` del plugin) en cada deploy | Indexación casi inmediata en Bing y Yandex. |
| Publicar el juego en **itch.io**, Newgrounds, CrazyGames/Poki (si aceptan juegos web gratis), r/WebGames, r/incremental_games y Product Hunt | Backlinks y menciones de marca: es el factor que más pesa en el ranking real y el único que no se arregla con código. |
| Enlazar la web desde el README y la descripción del repo de GitHub | Un backlink fácil y una señal de entidad (el `sameAs` del schema). |

---

## 4. Orden recomendado

| Paso | Cambios | Esfuerzo | Puntuación aproximada después |
|---|---|---|---|
| 1 | A1, A4, B1, B2, D1, D2, D3, E1, C2, C4 | ~1 h, sin riesgo | ≈ 89 |
| 2 | A3, C3, G1, E3, F1 | ~2–3 h | ≈ 93 |
| 3 | A2 (sección visible con scroll) + pruebas en móvil real | ~3–4 h, riesgo medio | ≈ 98 |
| 4 | E2 (Cloudflare Pages + cabeceras + URLs sin extensión) | ~2 h, riesgo medio | **≈ 99** |

Después de cada paso, repetir la revisión:
```
/seo page https://blandis.u0f.es/
```
y PageSpeed Insights en https://pagespeed.web.dev/.

## 5. Advertencias

- **La nota es de la rúbrica del plugin, no de Google.** Google no publica ninguna puntuación SEO. Un 99 aquí significa que no queda nada técnico ni de contenido por arreglar en la web, no que vayas a salir primero. A partir de ahí, lo que decide son los backlinks, las menciones y la demanda de búsqueda (sección 3).
- **Viewport:** en la revisión anterior se quitó `user-scalable=no`. El `touch-action:none` de `html, body` debería seguir impidiendo el zoom durante la partida, pero falta probarlo en un iPhone real. Si haces A2, ese `touch-action` pasa a `#stage` y la prueba es obligatoria.
- **No esconder contenido para buscadores.** Todo texto añadido para SEO tiene que ser visible para el jugador, salvo el H1 y el resumen corto que ya existen.
