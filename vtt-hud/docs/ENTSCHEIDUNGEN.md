# Entscheidungen

## Phase 1: HUD-Basis

- Die bereitgestellten HUD-Dateien werden aus `vtt-hud.zip` übernommen; das separate Add-on wird nicht blind integriert, da die HUD-Brücke bereits einen eigenen Kampfablauf enthält.
- Die UI erhält Layer-Knoten 9 und 10. Welt-Layer 0 bis 8 bleiben unter `#world`; alle Module behalten ihre Event-Schnittstellen.
- Das erste Manifest katalogisiert vorhandene Dateien als `1x`. Die 640-px-Dateien sind kein Ersatz für die Originale; die Mehrfachauflösungen werden in Phase 2 aus den Originalquellen erzeugt.
- Der Playwright-Check ist verpflichtend. Chromium kann hier wegen fehlender Systembibliotheken nicht starten; APT-Paketlisten sind nicht verfügbar.

## Abschluss 2026-10-06

- `js/game/w100.js` bleibt unverändert. Kein Re-Bundle, kein DOM in der Engine.
- `sfx.js` liegt unter `js/`, nicht unter `js/game/`. Der Import der Brücke zeigt deshalb auf `../sfx.js`. Vorher lief das Modul ins Leere.
- Die Ergebnisansicht war von Anfang an sichtbar und hat die Lobby verdeckt. Sie startet jetzt mit `hidden`.
- `--dock` war ungesetzt, dadurch wurde die Kampfspalte auf Inhaltbreite zusammengezogen. Sie ist 320px.
- Reichweiten sind weiche Flecken (Kreis plus Weichzeichner), kein Quadratraster. Der Bau ist eine Fläche ohne Schraffur. `PX_PER_FELD` bleibt nur Rechenmaß.
- Rundenpfeile sind deaktiviert. Die Runde zählt die Engine.
- Foundry-Export bleibt aus: `export.ts` steckt nicht im Bundle. Die Engine wird dafür nicht angefasst.
- Porträts sind manuelle Gesichtsausschnitte aus `v2/<figur>/offen.jpg` (je Figur eigener Rahmen, nicht die Bildmitte), rund mit Alpha und quadratisch mit weichem Rand. Kein Hintergrund-Modell: sharp (Apache-2.0) reicht, ein zusätzliches Freistell-Paket wurde nicht geladen.
- Kampftafeln bleiben fotografische Szenen mit Umgebung. Freistellen würde die Kampfbilder zerschneiden. Getrennt sind Ringe, Auren, Sicht, Flächen, Status und UI.
- Hintergründe sind Vollbilder mit Vignette, nicht gekachelt. Ein Kachelversuch würde Nähte und ein Muster erzeugen.
- `@3x` liegt als AVIF und WebP vor. Zusätzliche JPEG in Originalbreite würden die Seite auf 1× nicht treffen und das Repo nur beschweren. JPEG-Fallback ist 640 und 1280.
- Effekte sind Canvas 2D, ein Modul, Events `fx:hit`, `fx:crit`, `fx:block`, `fx:dodge`, `fx:status`. Kein PixiJS. OffscreenCanvas wäre ein zweiter Pfad ohne sichtbaren Gewinn, deshalb eine Zeichenfläche.
- Qualitätsstufen niedrig / mittel / hoch und `prefers-reduced-motion` schalten Partikel und Wackeln ab.
- Der Check nutzt den vorhandenen Headless-Shell unter `/opt/pw-browsers`, falls Playwright kein eigenes Chromium findet.
