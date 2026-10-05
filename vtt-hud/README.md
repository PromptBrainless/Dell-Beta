# ECHO//BRUCH – Gridless Fantasy-VTT-HUD

Dunkles Fantasy-HUD für einen einzelnen Kampf. Vanilla HTML, CSS und JS. Die Regeln liegen gebündelt in `js/game/w100.js` und werden nicht von Hand geändert.

## Start

Im Ordner `vtt-hud`:

```bash
python3 -m http.server 3000
```

Dann die Seite im Browser öffnen. ES-Module brauchen HTTP, ein Doppelklick auf die Datei reicht nicht.

Weitere Skripte:

| Skript | Zweck |
| --- | --- |
| `npm run lint` | `node --check` über `js/` und `scripts/` |
| `npm run check` | Playwright: Konsole, Layer `l0`–`l10`, keine 404, Screenshots |
| `npm run build:assets` | AVIF/WebP/JPEG aus den Originalen, Manifest, Porträts, Icon-Raster |

## Aufbau

- `index.html` – Layer 0–10
- `css/` – ein Blatt je HUD-Teil, dazu `frames.css`, `fx.css`, `zones.css`, `layout.css`
- `js/` – ein Modul je HUD-Teil, nur über `emit` / `on` in `js/utils.js`
- `js/game/w100.js` – Engine, ohne DOM
- `js/game/bridge.js` – verbindet Engine und HUD
- `js/game/extras.js` – Würfel, Trefferzonen-Figur, Krit- und Patzertafeln
- `js/fx.js` – Treffer, Krit, Block, Ausweichen, Status
- `assets/manifest.json` – tauschbare Assets

Layer, fest: 0 Arena · 1 Marker · 2 Token · 3 Ringe · 4 Auren · 5 Sicht · 6 Flächen · 7 Status · 8 Flanke · 9 UI · 10 Buttons.

## Spiel

Du bist Seite A. In der Lobby Figur und Gegner wählen, dann Kampf beginnen.

- Ziehen oder Karte antippen: bewegen
- Gegner antippen: schlagen
- `1`–`4` Schlagen, Parieren, Ausweichen, Vorrücken
- `Enter` oder „Zug beenden“: passen
- `T` Tafeln
- `WASD` oder Pfeile: Karte schwenken
- Archivar darf die Trefferzone wählen (Figur oder Liste)
- „Beide spielen“ schaltet den Bot ab

Grün verbündet, Gelb neutral, Rot feindlich, Violett geheim, Amber Reichweite.

Jeder Welt-Layer hat einen Schalter. Unter „Teile“ lassen sich Kampfspalte, Initiative, Kompass, Maßstab, Runde, Aktionen und Zug ausblenden. An den Griffen `⠿` und `⌟` werden Flächen verschoben und skaliert. „Layout“ setzt das zurück.

## Assets

Originale liegen in den Workspace-ZIPs unter `public/kampf/v2` (1792×1008). `scripts/build-assets.mjs` entpackt sie nach `vtt-hud/.sources` (nicht versioniert) und schreibt:

- Kampfbilder: `@1x` 640, `@2x` 1280, `@3x` 1792 als AVIF und WebP, JPEG für 1× und 2×
- Hintergründe mit Vignette, ohne Raster
- Porträts 256 / 512 / 768, rund (Alpha) und quadratisch
- Icons als SVG plus Raster 24 / 32 / 48

Die Seite wählt per `image-set()` und `<picture srcset>` nach Auflösung. Manifest-Felder: `id`, `layer`, `files`, `anchor`, `size`. Eine Datei austauschen heißt denselben Pfad ersetzen oder den Eintrag zeigen lassen.

## Theme

In `css/main.css`: `--gold`, `--bg`, `--green`, `--red`, `--amber`, `--violet`, `--friendly`, `--neutral`, `--hostile`, `--secret`, `--text`, `--dock`, `--panel`.

Effekte: Qualitätsstufe im Layer-Schalter, Schlüssel `hud-quality` und `hud-fx` im lokalen Speicher. `prefers-reduced-motion` schaltet Partikel, Ruckler und Würfelrolle ab.

## Ereignisse

Kampf: `blick`, `fightStart`, `endTurn`, `mapClick`, `tokenMoved`, `tokenSelect`, `roundChange`, `viewchange`, `hud:shell`.

Effekte: `fx:hit`, `fx:crit`, `fx:block`, `fx:dodge`, `fx:status`, `fx:quality`.

## Veröffentlichung

Statische Seite. Bei Vercel das Root Directory auf `vtt-hud` stellen, Framework „Other“, Build leer, Output `.`.
