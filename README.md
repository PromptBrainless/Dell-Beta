# Dell-Beta

ECHO//BRUCH ist ein gridless Fantasy-VTT für einen Zweikampf. Das spielbare HUD liegt in [`vtt-hud/`](vtt-hud/README.md). Die Kampagne im Chat startet dort: Lobby, Karte, Würfel, Zonen, Bot.

## Was hier liegt

| Pfad | Inhalt |
| --- | --- |
| `vtt-hud/` | HUD. Vanilla HTML/CSS/JS. Start mit `python3 -m http.server 3000` in diesem Ordner. |
| `vtt-hud/js/game/w100.js` | Gebündelte Regeln. Kein DOM. Nicht von Hand ändern. |
| `vtt-hud/assets/` | Kampfbilder, Hintergründe, Porträts, Icons, `manifest.json` |
| `*.zip` | Workspace-Teile und das ältere HUD-Paket. Die Bildquelle `public/kampf/v2` steckt in den `abacktools-…`-Archiven. |

`.grok/`, Auth, Datenbank und der React-Workspace bleiben in den ZIPs. Sie gehören nicht zum HUD und werden nicht angefasst.

## Regeln, die bleiben

- Kein Quadrat- oder Hexraster in Bildern oder CSS. `PX_PER_FELD` ist nur das Rechenmaß.
- Reichweite, Sicht, Flächen, Ringe, Status und Leisten sind eigene Layer.
- Module reden über `emit` / `on`.
- Änderungen an Regeln nur in den TypeScript-Quellen, dann neu bündeln. Dieses Repo enthält das Bundle, nicht die TS-Quellen als Arbeitskopie.

Ablauf, Events, Asset-Pipeline und Theme-Variablen stehen in [`vtt-hud/README.md`](vtt-hud/README.md). Entscheidungen stehen in [`vtt-hud/docs/ENTSCHEIDUNGEN.md`](vtt-hud/docs/ENTSCHEIDUNGEN.md).

## Prüfen

```bash
cd vtt-hud
npm install
npm run lint
npm run check
```

`check` öffnet die Seite headless, erwartet die Layer `l0` bis `l10`, keine Konsolenfehler, keine 404 und schreibt Screenshots nach `vtt-hud/screenshots/`.
