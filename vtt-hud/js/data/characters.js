/* Aus Dell-Beta (src/game/w100/charaktere.ts). Einheiten: Felder des alten 64×64-Gitters.
   Das HUD bleibt gridless: Felder werden nur über PX_PER_FELD in Welt-Pixel umgerechnet. */
const PX_PER_FELD = 10;
const CHARACTERS = [
 {
  "id": "brecher",
  "name": "Brecher",
  "zeile": "Hammer +6, Kreis 8. Ein klarer Treffer wirft um.",
  "hp": 15,
  "bewegung": 24,
  "form": "nah",
  "reichweite": 8,
  "schaden": 6,
  "effekt": "sturz",
  "image": "assets/portraits/brecher.png"
 },
 {
  "id": "laeuferin",
  "name": "Läuferin",
  "zeile": "Schwert +4, Kreis 5. Ein klarer Treffer öffnet eine Blutung.",
  "hp": 12,
  "bewegung": 40,
  "form": "nah",
  "reichweite": 5,
  "schaden": 4,
  "effekt": "blutung",
  "image": "assets/portraits/laeuferin.png"
 },
 {
  "id": "archivar",
  "name": "Archivar",
  "zeile": "Kette +5, Ring 16 bis 40, über den Bau. Klarer Treffer fesselt.",
  "hp": 13,
  "bewegung": 32,
  "form": "bogen",
  "reichweite": 40,
  "schaden": 5,
  "effekt": "fessel",
  "image": "assets/portraits/archivar.png"
 },
 {
  "id": "waechter",
  "name": "Wächter",
  "zeile": "Speer +4, Kreis 16. Im Nahbereich sperrig.",
  "hp": 16,
  "bewegung": 24,
  "form": "nah",
  "reichweite": 16,
  "schaden": 4,
  "effekt": "blutung",
  "image": "assets/portraits/waechter.png"
 },
 {
  "id": "jaeger",
  "name": "Jäger",
  "zeile": "Bogen 4, Kreis 48, nur mit Sicht am Bau vorbei.",
  "hp": 12,
  "bewegung": 32,
  "form": "schuss",
  "reichweite": 48,
  "schaden": 4,
  "effekt": "keine",
  "image": "assets/portraits/jaeger.png"
 }
];
