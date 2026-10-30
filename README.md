# Blandis

**Launch, squish and merge soft numbered blobs.** A free, satisfying physics puzzle game that runs in the browser — on desktop and mobile — with no install and no build step.

▶️ **Play: https://u0f.github.io/blandis/**

## How to play

- **Drag** toward where you want the blob to go and **release**. The further you drag, the harder it flies.
- **Quick tap** drops the blob gently.
- Launch **softly** to place it without disturbing the pile, or **hard** to push others and squeeze into gaps.
- Two **equal numbers** that touch merge into their double: 2 + 2 = 4, 4 + 4 = 8 … all the way to **2048**.
- Back-to-back merges build a **combo** multiplier.
- If any blob stays above the dashed line for **3 seconds**, the game is over.

## Features

- Real soft-body physics: every blob is a squishy ring that keeps its volume and deforms to fill the gaps around it.
- Juicy feedback: squish waves, particles, screen shake, synthesized sound effects and haptics on mobile.
- 7 achievements, each unlocking a color style (Vivid, Cozy, Neon, Cloud, Ocean, Caramel, Night, Rainbow).
- Best score and top-5 saved locally.
- English and Spanish (Settings → Language).
- Mouse, touch and keyboard (`Esc` / `P` to pause).

## Run locally

The game uses native ES modules, so it must be served over HTTP (opening `index.html` directly with `file://` won't work). Any static server is fine:

```bash
npx serve .
```

or

```bash
python -m http.server 8080
```

Then open the URL it prints (e.g. `http://localhost:3000` or `http://localhost:8080`).

## Deploy to GitHub Pages

This repo includes a workflow (`.github/workflows/pages.yml`) that publishes the site on every push to `main`.

1. Create a **public** repository on GitHub and push this code to the `main` branch:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/u0f/blandis.git
   git push -u origin main
   ```

2. On GitHub go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Wait for the **Deploy to GitHub Pages** action to finish (tab **Actions**). Your game will be live at `https://<your-user>.github.io/<your-repo>/` (this one lives at https://u0f.github.io/blandis/).

Because it's plain static files, it also works as-is on Netlify, Vercel, Cloudflare Pages or itch.io (upload the folder as an HTML5 game).

## Project structure

```
index.html              Page shell (canvas, overlay, buttons)
css/style.css           Menu / HUD styles
favicon.svg
src/
  main.js               Entry point: wires everything and runs the fixed-timestep loop
  config.js             World size, physics constants, gameplay tuning
  game.js               Game rules and state machine (attract → play → paused → ending → over)
  physics/
    blob.js             Soft-body blob (typed arrays of points)
    world.js            Position-based solver: shape matching, volume, collisions, walls
  render.js             Canvas renderer (jar, blobs, trajectory, effects, HUD)
  effects.js            Particles, rings, floating text, screen shake
  audio.js              WebAudio synthesized sound effects + vibration
  achievements.js       Achievement list and unlocking
  themes.js             Color styles
  i18n.js               English / Spanish strings
  storage.js            localStorage save data
  ui/
    menu.js             Overlay menus and top-right buttons
    toast.js            Achievement pop-up
```

### How the squishy physics works

Each blob is a closed ring of points simulated with position-based dynamics, 8 substeps per frame:

1. **Shape matching** pulls points weakly toward a rotated rest circle (shape memory).
2. **Edge spacing + smoothing** keeps points evenly distributed and acts like surface tension, while letting the perimeter grow so the blob can deform.
3. **Area constraint** keeps the polygon's area constant — the blob's "volume" — so squeezing one side bulges another.
4. **Collisions** push any point that ends up inside another blob back onto that blob's surface, splitting the correction by mass.

Tweak `K_SHAPE`, `K_SMOOTH` and `K_AREA` in `src/config.js` to make blobs firmer or softer.

### Adding a language

Add a new entry to `STR` and `LANGS` in `src/i18n.js`, and an extra key to each `{ en, es }` object in `themes.js` and `achievements.js`.

## License

[MIT](LICENSE)

---

## Español

**Lanza, aplasta y fusiona números blanditos.** Juego de física gratuito para navegador (PC y móvil). Arrastra hacia donde quieras lanzar y suelta; dos números iguales que se tocan se fusionan en el doble hasta llegar a 2048. El idioma se cambia en **Settings → Language**.

Para probarlo en local hace falta un servidor estático (`npx serve .` o `python -m http.server 8080`). Para publicarlo, sube el repositorio a GitHub y en **Settings → Pages** elige **GitHub Actions** como origen.
