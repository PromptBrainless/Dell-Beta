# Dell-Beta
Nach erfülltem Auftrag darf der Agent natürlich seine readme zurück haben und sie neu gestaltet zum Projekt Umfang passend ausführlich ausmorst. 


Auftrag für den Codespace-Agenten: ECHO//BRUCH – Gridless Fantasy-VTT-HUD
Du arbeitest direkt in diesem Repository (Codespace). Lies diesen Auftrag vollständig, bevor du etwas änderst. Arbeite in Phasen, committe nach jeder Phase einzeln (feat: …) und melde am Ende jeder Phase kurz: was getan, was geprüft, was offen.
1. Ausgangslage
Zielprojekt: Ordner vtt-hud/ (Vanilla HTML/CSS/JS, kein Build-Zwang). Start: python -m http.server 3000.
HUD laut Spezifikation (PDF „Gridless Fantasy VTT HUD“): Battlemap, Token + Ringe, Initiative-Leiste, Rundenanzeige, Kompass, Maßstab, Zug-beenden-Button, Statusmarker, Schnellaktionen, Auren/Reichweiten, Sichtkegel, Flächeneffekte, Flankierung, Marker, Layer-Schalter, responsive.
Layer-Modell (nicht ändern): 0 Arena · 1 Marker · 2 Token · 3 Ringe · 4 Auren · 5 Sicht · 6 Flächen · 7 Status · 8 Flanke · 9 UI · 10 Buttons. Module sprechen nur über Events (emit/on in js/utils.js).
Kampflogik: vtt-hud/js/game/w100.js ist aus src/game/w100/*.ts (Dell-Beta-Workspace) gebündelt; js/game/bridge.js verbindet Engine und HUD, js/game/extras.js zeigt Würfel, Trefferzonen und Tafeln.
Dell-Beta enthält zusätzlich einen React/TypeScript-Workspace (src/, public/kampf/). Die Original-Grafiken dort (1792×1008) sind die Quelle für alle Bilder. Die Kopien in vtt-hud/assets/art sind nur auf 640 px verkleinert und dürfen ersetzt werden.
2. Unverrückbare Regeln
Gridless. Kein eingebranntes Quadrat- oder Hexraster, weder in Bildern noch in CSS. Das alte 64×64-Gitter ist nur ein Rechenmaß (PX_PER_FELD).
Alles getrennt. Reichweiten, Sichtkegel, Flächeneffekte, Token-Ringe, Statusmarker und Ressourcenleisten sind eigene, frei positionier-, skalier-, ein- und ausblendbare Layer. Keine untrennbaren Gesamtgrafiken.
Freigestellte Assets. Alle Einzelgrafiken mit transparentem Hintergrund. Jedes Asset einzeln austauschbar über ein Manifest (assets/manifest.json: id, Layer, Dateien je Auflösung, Anker, Standardgröße).
Stil. Hochwertiges dunkles Fantasy-VTT: dunkles Metall, Bronze, Glas, Leder, dezente magische Leuchteffekte, klar erkennbare Funktionsfarben (Verbündet grün, neutral gelb, feindlich rot, geheim violett, Reichweite amber).
Engine nicht brechen. w100.js bleibt rein (keine DOM-Zugriffe). Änderungen an Regeln nur in den TS-Quellen, dann neu bündeln (npx esbuild … --format=esm), nicht von Hand im Bundle.
Nichts löschen, was du nicht angelegt hast, ohne vorher zu fragen. .grok/, .vercel/, Auth, Datenbank und React-Komponenten sind für das HUD nicht relevant, bleiben aber liegen.
3. Phasen
Phase 1 – Zusammensetzen und Lauffähigkeit
Prüfe, dass vtt-hud/ ohne Konsolenfehler startet (Desktop 1440×900, Tablet 1024×768, Handy 390×844).
Ordne die Dateien exakt nach Struktur der Spezifikation (css/, js/, assets/{icons,portraits,textures,art}), package.json mit Skripten start, lint, build:assets.
Schreibe scripts/check.mjs: lädt die Seite headless (Playwright), prüft Konsolenfehler, Layer-Existenz, 404-freie Assets, und speichert Screenshots in screenshots/.
Behebe gefundene Fehler (Event-Namen, Z-Index-Kollisionen, Pointer-Events, Mobile-Überlappungen).
Phase 2 – Hochauflösende Grafik-Pipeline
Skript scripts/build-assets.mjs (z. B. mit sharp): erzeugt aus den Originalen in public/kampf/v2 je Bild @1x (640 w), @2x (1280 w), @3x (1792 w) als AVIF und WebP (JPEG/PNG-Fallback), Ausgabe nach assets/art/. Binde Bilder mit srcset/image-set() ein, wähle nach devicePixelRatio.
Porträts: Gesichtsausschnitt je Figur (nicht blind zentriert), 256/512/768 px, rund und quadratisch freigestellt, transparenter Hintergrund (PNG/WebP/AVIF mit Alpha).
Hintergründe (v2/bg): als kachelbare 2048-px-Texturen oder Vollbild mit Vignette; nie mit Raster.
UI-Rahmen: als SVG (vektoriell, beliebig scharf) bzw. 9-Slice-Bilder: Metallrahmen, Bronzekanten, Glasflächen, Leder-Inlays, Nieten. Je Element eigene Datei, Zustände (normal, hover, aktiv, deaktiviert) als getrennte Layer oder CSS-Variablen.
Icons: einheitlicher Satz (SVG, 24/32/48 px Raster ohne Hintergrund) für Schlagen, Parieren, Ausweichen, Vorrücken, Passen, alle Statusmarker (Liegt, Blutung, Arm, Bein, Bewusstlos, Waffe hin, Vorteil).
Wenn Bilder ohne Transparenz vorliegen, Freistellen mit einem geprüften Werkzeug (prüfe vorher die aktuelle Version und Lizenz) und die Kanten manuell kontrollieren (Screenshots auf hellem und dunklem Grund).
Phase 3 – Moderne HUD-Effekte (aktuelle Webtechnik)
Prüfe vor Einsatz jeweils aktuelle Browserunterstützung und Paketversionen (npm, MDN) und nutze nur, was in aktuellen Chrome/Firefox/Safari stabil läuft; sonst Fallback.
CSS: @property für animierte Verläufe/Glows, color-mix(), Container Queries für die Panels, backdrop-filter für Glas, mask/conic-gradient für Sichtkegel, View Transitions für Panel- und Zugwechsel.
FX-Layer als eigenes Canvas/WebGL über der Welt (Layer 6/9): z. B. PixiJS oder reines Canvas 2D, hinter einem Feature-Flag, OffscreenCanvas wo möglich. Effekte: Treffer-Funken, Blut-/Staubpartikel, kritischer Treffer (kurzes Kamerawackeln, Blitz), Block-Funken, Ausweich-Nachbild, Würfelwurf mit Physik-Anmutung, Aura-Puls, glimmende Glut/Nebel mit Parallax (Hintergrund bewegt sich mit Pan/Zoom, aber ohne Raster).
Token-Ringe als SVG mit stroke-dasharray-Animation und Glow, getrennt je Disposition; Statusmarker mit Dauer-Badge und Abkling-Animation.
Ressourcenleisten (HP, Aktionspunkte) als SVG mit Glasröhre und Flüssigkeits-Verlauf, Schadensvorschau (Ghost-Segment).
Jeder Effekt: ein Modul, ein Event (fx:hit, fx:crit, fx:block, fx:dodge, fx:status), abschaltbar, respektiert prefers-reduced-motion und eine Qualitätsstufe (niedrig/mittel/hoch).
Phase 4 – Funktionen abschließen
Würfelanzeige, Trefferzonen-Figur, Tafeln (extras.js) visuell auf den neuen Stil bringen; Zonenwahl für Figuren mit ortwahl testen.
Auswahl der Figurenpaarung, Neustart, Sieg-/Niederlage-Ansicht mit Kampfbild (assets/art/<figur>/…).
Optional: Foundry-Export aus src/game/w100/export.ts als Button „Export“.
Tastatur: Tasten 1–4 Aktionen, Enter Zug beenden, T Tafeln, Pfeile/WASD Kamera; sichtbarer Fokus, aria-label, Kontrast mindestens WCAG AA.
Phase 5 – Qualität und Dokumentation
Performance-Budget: erster Aufbau unter 3 s auf Mittelklasse-Handy, 60 fps bei 20 Overlays, Gesamtgröße der geladenen Bilder unter 6 MB bei 1×.
Lighthouse (Performance, Barrierefreiheit) ≥ 90.
README.md: Struktur, Start, Asset-Pipeline, Manifest, Layer, Events, Erweiterung/Anpassung (Theme-Variablen in css/main.css).
Aktualisiere Screenshots (Desktop, Tablet, Handy, Kampfszene mit Treffer).
4. Abnahmekriterien
Keine Konsolenfehler, keine 404, keine Raster in Bildern oder CSS.
Jeder HUD-Teil lässt sich einzeln ein-/ausblenden, verschieben, skalieren und ersetzen (Nachweis: Layer-Schalter und Manifest).
Ein kompletter Kampf (Spieler gegen Bot) läuft bis zum Sieger durch; Würfel, Zonen, Status und Log stimmen mit der Engine überein.
Handy-Ansicht ohne überlappende Bedienelemente.
Alle neuen Grafiken liegen als hochaufgelöste, transparente Einzeldateien mit Manifest-Eintrag vor.
5. Vorgehen bei Unklarheit
Wenn etwas im Widerspruch zu den Regeln in Abschnitt 2 steht oder du Dateien löschen müsstest, stoppe und stelle genau eine konkrete Frage. Sonst entscheide selbst, dokumentiere die Entscheidung in docs/ENTSCHEIDUNGEN.md und arbeite weiter.
