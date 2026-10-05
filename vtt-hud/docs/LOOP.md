# Optimierungsloop — aktuelles HUD

Basis ist `vtt-hud`, nicht die Workshop-ZIPs. Engine bleibt `js/game/w100.js`.

## Diese Runde
- Lobby mit 5 spielbaren Charakteren, Karte, Hotseat
- Ziehen und Antippen schreibt in `bewegen()`
- Gegner antippen schlägt, wenn die Form trifft
- Lauf- und Schlagfelder, Bedrohmarker, Trefferzahlen, AP, Blatt
- Halle / Bruch / Funken / Nebel als Arena

## Nächste Runde
- Würfelwurf sichtbar machen (Engine würfelt schon)
- Krit- und Patzertafel als eigene Karte
- HD-Satz nur falls er ins aktuelle Manifest passt
- Hotseat-Hinweis, wessen Zug es ist, größer