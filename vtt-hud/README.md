# Gridless Fantasy VTT HUD (ECHO//BRUCH)

Start (http nötig, wegen ES-Modul): `python -m http.server 3000` im Ordner, dann http://localhost:3000.

## Aufbau
- HUD: `index.html`, `css/`, `js/*.js` laut PDF. Layer: 0 Arena · 1 Marker · 2 Token · 3 Ringe · 4 Auren · 5 Sicht · 6 Flächen · 7 Status · 8 Flanke · 9 UI · 10 Buttons.
- Module reden nur über Events (`emit`/`on`, `js/utils.js`) und sind einzeln entfernbar.
- Kampf: `js/game/w100.js` ist die gebündelte Engine aus Dell-Beta (`src/game/w100/*.ts`: Regeln, Tafeln, Aktionen, Charaktere, Karte, Kampf). `js/game/bridge.js` verbindet sie mit dem HUD.
- Spielzug: du bist Seite A. Tasten 1–4 (Schlagen, Parieren, Ausweichen, Vorrücken+Schlagen), Klick auf die Karte bewegt, „Zug beenden“ = Passen. Seite B spielt `bot()`.
- Das alte Gitter 64×64 existiert nur als Rechenmaß (`PX_PER_FELD` in `js/data/characters.js`), gezeichnet wird kein Raster.

## Aus den Dell-Beta-ZIPs übernommen
Engine (gebündelt), 5 Charaktere + Porträts, v2-Kampfgrafiken (`assets/art/<figur>/`, auf 640 px), Hintergründe (`assets/textures/`), Protokolle (`docs/`).

## Bewusst nicht übernommen
`.grok/`, `.vercel/`, Vite/React/Auth/Datenbank, `scripts/`, Screenshots, älterer HD-Satz (`public/kampf/hd`), `archive/`, `attachments/`, React-Komponenten (`src/components/echo`). Liegen weiter im Repo.

## Offen
Zonenwahl (`ortwahl`), Krit-/Patzertafeln als eigene Anzeige, Würfelanimation, Foundry-Export (`export.ts`), HD-Satz.
