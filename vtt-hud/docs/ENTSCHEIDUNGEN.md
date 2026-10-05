# Entscheidungen

## Phase 1: HUD-Basis

- Die bereitgestellten HUD-Dateien werden aus `vtt-hud.zip` übernommen; das separate Add-on wird nicht blind integriert, da die HUD-Brücke bereits einen eigenen Kampfablauf enthält.
- Die UI erhält Layer-Knoten 9 und 10. Welt-Layer 0 bis 8 bleiben unter `#world`; alle Module behalten ihre Event-Schnittstellen.
- Das erste Manifest katalogisiert vorhandene Dateien als `1x`. Die 640-px-Dateien sind kein Ersatz für die Originale; die Mehrfachauflösungen werden in Phase 2 aus den Originalquellen erzeugt.
- Der Playwright-Check ist verpflichtend. Chromium kann hier wegen fehlender Systembibliotheken nicht starten; APT-Paketlisten sind nicht verfügbar.
