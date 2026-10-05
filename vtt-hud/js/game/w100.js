// ../../home/claude/dell/ws/src/game/w100/regeln.ts
var ZONE_NAME = {
  kopf: "Kopf",
  "arm-links": "Linker Arm",
  "arm-rechts": "Rechter Arm",
  koerper: "K\xF6rper",
  "bein-links": "Linkes Bein",
  "bein-rechts": "Rechtes Bein"
};
function w100(rng = Math.random) {
  return 1 + Math.floor(rng() * 100);
}
function istPasch(wurf) {
  return [11, 22, 33, 44, 55, 66, 77, 88, 99, 100].includes(wurf);
}
function umdrehen(wurf) {
  const text = wurf === 100 ? "00" : String(wurf).padStart(2, "0");
  const rev = Number(text[1] + text[0]);
  return rev === 0 ? 100 : rev;
}
function zoneAusWurf(wurf) {
  const n = umdrehen(wurf);
  if (n <= 9) return "kopf";
  if (n <= 24) return "arm-links";
  if (n <= 44) return "arm-rechts";
  if (n <= 79) return "koerper";
  if (n <= 89) return "bein-links";
  return "bein-rechts";
}
function probe(fertigkeit, wurf) {
  const wert = Math.max(5, fertigkeit);
  const autoErfolg = wurf <= 5;
  const autoFehl = wurf >= 96;
  const bestanden = autoFehl ? false : autoErfolg ? true : wurf <= wert;
  const zehnerWurf = wurf === 100 ? 0 : Math.floor(wurf / 10);
  let sl = Math.floor(wert / 10) - zehnerWurf;
  if (bestanden && sl < 0) sl = 0;
  if (!bestanden && sl > 0) sl = -sl;
  return { wurf, fertigkeit: wert, bestanden, sl, kritisch: bestanden && istPasch(wurf), patzer: !bestanden && istPasch(wurf) };
}
function vergleich(angriff, abwehr, waffe, widerstand, ruestung) {
  const gegen = abwehr?.sl ?? 0;
  const sl = angriff.sl - gegen;
  const getroffen = abwehr ? angriff.sl > abwehr.sl && !angriff.patzer : angriff.bestanden && !angriff.patzer;
  if (!getroffen) {
    return {
      getroffen: false,
      zone: null,
      sl,
      schaden: 0,
      wunden: 0,
      kritisch: false,
      patzer: angriff.patzer,
      werfer: angriff,
      abwehr,
      text: angriff.patzer ? `Patzer. Wurf ${angriff.wurf} gegen ${angriff.fertigkeit}.` : `Vorbei. Wurf ${angriff.wurf}, Erfolgsgrade ${angriff.sl} gegen ${gegen}.`
    };
  }
  const zone = zoneAusWurf(angriff.wurf);
  const roh = sl + waffe - (widerstand + ruestung);
  const wunden = Math.max(0, roh);
  const gehalten = wunden === 0 ? " Die R\xFCstung h\xE4lt." : "";
  return {
    getroffen: true,
    zone,
    sl,
    schaden: roh,
    wunden,
    kritisch: angriff.kritisch,
    patzer: false,
    werfer: angriff,
    abwehr,
    text: `Wurf ${angriff.wurf} wird ${umdrehen(angriff.wurf)}, ${ZONE_NAME[zone]}. Erfolgsgrade ${sl}. Waffe ${waffe} minus Z\xE4higkeit ${widerstand} und R\xFCstung ${ruestung}: ${wunden} Wunden.${gehalten}${angriff.kritisch ? " Kritisch." : ""}`
  };
}

// ../../home/claude/dell/ws/src/game/w100/tafeln.ts
var KRIT = {
  kopf: [
    { von: 1, bis: 10, name: "Riss", wunden: 1, tot: false, folge: "Blutung." },
    { von: 11, bis: 40, name: "Bet\xE4ubt", wunden: 2, tot: false, folge: "Die n\xE4chste Runde hat 1 Aktion weniger." },
    { von: 41, bis: 70, name: "Sch\xE4del", wunden: 3, tot: false, folge: "Alle Proben \u221220, bis die Wunden wieder \xFCber 0 sind." },
    { von: 71, bis: 90, name: "Bewusstlos", wunden: 4, tot: false, folge: "Keine Aktion, bis eine Runde vergeht." },
    { von: 91, bis: 100, name: "Zerbrochen", wunden: 0, tot: true, folge: "Der Kopf h\xE4lt das nicht aus." }
  ],
  "arm-links": arm(),
  "arm-rechts": arm(),
  koerper: [
    { von: 1, bis: 10, name: "Kratzer", wunden: 1, tot: false, folge: "Blutung." },
    { von: 11, bis: 40, name: "Bauch", wunden: 2, tot: false, folge: "Bet\xE4ubt. Die n\xE4chste Runde hat 1 Aktion weniger." },
    { von: 41, bis: 70, name: "Rippen", wunden: 3, tot: false, folge: "Bewegung \u22121 f\xFCr den Rest des Kampfes." },
    { von: 71, bis: 90, name: "Durchsto\xDFen", wunden: 5, tot: false, folge: "Keine Aktion in der n\xE4chsten Runde." },
    { von: 91, bis: 100, name: "Zertrennt", wunden: 0, tot: true, folge: "Der K\xF6rper gibt nach." }
  ],
  "bein-links": bein(),
  "bein-rechts": bein()
};
function arm() {
  return [
    { von: 1, bis: 10, name: "Prellung", wunden: 1, tot: false, folge: "Die Waffe sitzt schief. N\xE4chster Angriff \u221210." },
    { von: 11, bis: 40, name: "Schnitt", wunden: 1, tot: false, folge: "Blutung." },
    { von: 41, bis: 70, name: "Verrenkt", wunden: 2, tot: false, folge: "Angriffe \u221220 f\xFCr den Rest des Kampfes." },
    { von: 71, bis: 90, name: "Gebrochen", wunden: 3, tot: false, folge: "Dieser Arm schl\xE4gt nicht mehr." },
    { von: 91, bis: 100, name: "Abgetrennt", wunden: 0, tot: true, folge: "Der Arm ist verloren, der K\xE4mpfer f\xE4llt." }
  ];
}
function bein() {
  return [
    { von: 1, bis: 10, name: "Tritt", wunden: 1, tot: false, folge: "Einen Schritt zur\xFCck." },
    { von: 11, bis: 40, name: "Schnitt", wunden: 1, tot: false, folge: "Blutung. Bewegung \u22121." },
    { von: 41, bis: 70, name: "Gelenk", wunden: 2, tot: false, folge: "Bewegung halbiert, mindestens 1." },
    { von: 71, bis: 90, name: "Bruch", wunden: 3, tot: false, folge: "Kann nicht mehr gehen, nur noch schlagen, wenn jemand herankommt." },
    { von: 91, bis: 100, name: "Zerschmettert", wunden: 0, tot: true, folge: "Das Bein tr\xE4gt nicht mehr." }
  ];
}
function kritZeile(zone, wurf) {
  const n = wurf === 100 ? 100 : wurf;
  return KRIT[zone].find((row) => n >= row.von && n <= row.bis) ?? KRIT[zone][0];
}
var PATZER = [
  { von: 1, bis: 20, name: "Eigenhieb", folge: "1 Wunde, R\xFCstung z\xE4hlt nicht." },
  { von: 21, bis: 40, name: "Verhakt", folge: "Die n\xE4chste Runde hat 1 Aktion weniger." },
  { von: 41, bis: 60, name: "Stolpern", folge: "Ein Feld zur\xFCck, weg vom Gegner." },
  { von: 61, bis: 80, name: "Blo\xDFgelegt", folge: "Die n\xE4chste Abwehr ist um 20 schlechter." },
  { von: 81, bis: 99, name: "Gest\xFCrzt", folge: "Liegt. Aufstehen kostet die n\xE4chste Bewegung." },
  { von: 100, bis: 100, name: "Waffe hin", folge: "Jeder weitere Angriff in diesem Kampf ist um 20 schlechter." }
];
function patzerZeile(wurf) {
  const n = wurf === 100 ? 100 : wurf;
  return PATZER.find((row) => n >= row.von && n <= row.bis) ?? PATZER[0];
}

// ../../home/claude/dell/ws/src/game/w100/aktionen.ts
var AKTIONEN = [
  { id: "bewegen", name: "Bewegen", kosten: 1, text: "Felder entlang der Linien, bis zur Bewegungsweite. Nicht durch Gegner oder Bau." },
  { id: "schlagen", name: "Schlagen", kosten: 1, text: "W100, sobald der Gegner im Radius der Waffe steht. L\xE4uft er hinein, trifft es ihn auch so." },
  { id: "parieren", name: "Parieren", kosten: 1, text: "Der n\xE4chste Schlag gegen dich ist eine Vergleichsprobe mit deiner Waffenfertigkeit." },
  { id: "ausweichen", name: "Ausweichen", kosten: 1, text: "Der n\xE4chste Schlag gegen dich ist eine Vergleichsprobe mit deiner Ausweichen-Fertigkeit." },
  { id: "passen", name: "Passen", kosten: 0, text: "Die Runde endet. Was angek\xFCndigt ist, wird jetzt gew\xFCrfelt." }
];
var AKTIONSPUNKTE = 2;
var FOLGE = [
  "Pr\xFCfen, was legal ist.",
  "Eine Option w\xE4hlen.",
  "Einen Aktionspunkt zahlen.",
  "Die Wirkung sofort ausf\xFChren.",
  "Abschlie\xDFen, wenn keine Punkte \xFCbrig sind."
];

// ../../home/claude/dell/ws/src/game/w100/charaktere.ts
function bonus(wert) {
  return Math.floor(wert / 10);
}
var leder = {
  kopf: 0,
  "arm-links": 1,
  "arm-rechts": 1,
  koerper: 1,
  "bein-links": 1,
  "bein-rechts": 1
};
var kette = {
  kopf: 1,
  "arm-links": 1,
  "arm-rechts": 1,
  koerper: 2,
  "bein-links": 1,
  "bein-rechts": 1
};
var platte = {
  kopf: 2,
  "arm-links": 3,
  "arm-rechts": 3,
  koerper: 4,
  "bein-links": 2,
  "bein-rechts": 2
};
var CHARAKTERE = [
  {
    id: "brecher",
    name: "Brecher",
    zeile: "Hammer +6, Kreis 8. Ein klarer Treffer wirft um.",
    ws: 45,
    bs: 25,
    staerke: 45,
    widerstand: 45,
    wille: 35,
    ausweichen: 25,
    wunden: 15,
    bewegung: 24,
    form: "nah",
    reichweite: 8,
    mindest: 1,
    schaden: 6,
    laenge: 2,
    effekt: "sturz",
    ortwahl: false,
    ruestung: kette
  },
  {
    id: "laeuferin",
    name: "L\xE4uferin",
    zeile: "Schwert +4, Kreis 5. Ein klarer Treffer \xF6ffnet eine Blutung.",
    ws: 40,
    bs: 30,
    staerke: 30,
    widerstand: 30,
    wille: 30,
    ausweichen: 55,
    wunden: 12,
    bewegung: 40,
    form: "nah",
    reichweite: 5,
    mindest: 1,
    schaden: 4,
    laenge: 1,
    effekt: "blutung",
    ortwahl: false,
    ruestung: leder
  },
  {
    id: "archivar",
    name: "Archivar",
    zeile: "Kette +5, Ring 16 bis 40, \xFCber den Bau. Klarer Treffer fesselt.",
    ws: 30,
    bs: 45,
    staerke: 30,
    widerstand: 30,
    wille: 45,
    ausweichen: 35,
    wunden: 13,
    bewegung: 32,
    form: "bogen",
    reichweite: 40,
    mindest: 16,
    schaden: 5,
    laenge: 3,
    effekt: "fessel",
    ortwahl: true,
    ruestung: leder
  },
  {
    id: "waechter",
    name: "W\xE4chter",
    zeile: "Speer +4, Kreis 16. Im Nahbereich sperrig.",
    ws: 40,
    bs: 25,
    staerke: 35,
    widerstand: 50,
    wille: 35,
    ausweichen: 30,
    wunden: 16,
    bewegung: 24,
    form: "nah",
    reichweite: 16,
    mindest: 1,
    schaden: 4,
    laenge: 4,
    effekt: "blutung",
    ortwahl: false,
    ruestung: platte
  },
  {
    id: "jaeger",
    name: "J\xE4ger",
    zeile: "Bogen 4, Kreis 48, nur mit Sicht am Bau vorbei.",
    ws: 30,
    bs: 50,
    staerke: 30,
    widerstand: 30,
    wille: 30,
    ausweichen: 45,
    wunden: 12,
    bewegung: 32,
    form: "schuss",
    reichweite: 48,
    mindest: 1,
    schaden: 4,
    laenge: 0,
    effekt: "keine",
    ortwahl: false,
    ruestung: leder
  }
];
function charakter(id) {
  return CHARAKTERE.find((item) => item.id === id);
}

// ../../home/claude/dell/ws/src/game/w100/karte.ts
var BREITE = 64;
var BAU_X0 = 24;
var BAU_Y0 = 24;
var BAU_KANTE = 16;
var BAU = [];
for (let y = BAU_Y0; y < BAU_Y0 + BAU_KANTE; y += 1) {
  for (let x = BAU_X0; x < BAU_X0 + BAU_KANTE; x += 1) BAU.push({ x, y });
}
var BAU_IDS = new Set(BAU.map((feld) => feld.y * BREITE + feld.x));
function index(feld) {
  return feld.y * BREITE + feld.x;
}
function vonIndex(id) {
  return { x: id % BREITE, y: Math.floor(id / BREITE) };
}
function gleich(a, b) {
  return a.x === b.x && a.y === b.y;
}
function imFeld(feld) {
  return feld.x >= 0 && feld.y >= 0 && feld.x < BREITE && feld.y < BREITE;
}
function istBau(feld) {
  return BAU_IDS.has(index(feld));
}
var RICHTUNG = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];
function nachbarn(feld) {
  return RICHTUNG.map((r) => ({ x: feld.x + r.x, y: feld.y + r.y })).filter(imFeld);
}
function schrittZurueck(von, gegner) {
  const frei = nachbarn(von).filter((feld) => !istBau(feld) && !gleich(feld, gegner));
  frei.sort((a, b) => abstand(b, gegner) - abstand(a, gegner));
  return frei[0] ?? null;
}
function abstand(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function erreichbar(von, weite, block) {
  const gesehen = /* @__PURE__ */ new Set([index(von)]);
  let rand = [von];
  const treffer = [];
  for (let schritt = 0; schritt < weite; schritt += 1) {
    const naechste = [];
    for (const feld of rand) {
      for (const nachbar of nachbarn(feld)) {
        const id = index(nachbar);
        if (gesehen.has(id) || istBau(nachbar) || block.some((item) => gleich(item, nachbar))) continue;
        gesehen.add(id);
        treffer.push(nachbar);
        naechste.push(nachbar);
      }
    }
    rand = naechste;
  }
  return treffer;
}
function inSchablone(von, feld, weite, mindest = 1) {
  if (!imFeld(feld) || gleich(von, feld)) return false;
  const dx = feld.x - von.x;
  const dy = feld.y - von.y;
  const quadrat = dx * dx + dy * dy;
  return quadrat <= weite * weite && quadrat >= mindest * mindest;
}
function bereich(form, von, feld, weite, mindest = 1) {
  if (!inSchablone(von, feld, weite, mindest) || istBau(feld)) return false;
  if (form === "bogen") return true;
  return sichtfrei(von, feld);
}
function sichtfrei(von, nach) {
  const ox = von.x + 0.5;
  const oy = von.y + 0.5;
  const ecken = [
    [nach.x + 0.05, nach.y + 0.05],
    [nach.x + 0.95, nach.y + 0.05],
    [nach.x + 0.05, nach.y + 0.95],
    [nach.x + 0.95, nach.y + 0.95]
  ];
  return ecken.some(([tx, ty]) => strahlFrei(ox, oy, tx, ty, nach));
}
function strahlFrei(x0, y0, x1, y1, ziel) {
  let x = Math.floor(x0);
  let y = Math.floor(y0);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const tDeltaX = dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dy);
  const bruchX = x0 - Math.floor(x0);
  const bruchY = y0 - Math.floor(y0);
  let tMaxX = dx === 0 ? Number.POSITIVE_INFINITY : (dx > 0 ? 1 - bruchX : bruchX) * tDeltaX;
  let tMaxY = dy === 0 ? Number.POSITIVE_INFINITY : (dy > 0 ? 1 - bruchY : bruchY) * tDeltaY;
  for (let n = 0; n < BREITE * 2; n += 1) {
    if (x === ziel.x && y === ziel.y) return true;
    if (tMaxX < tMaxY) {
      x += stepX;
      tMaxX += tDeltaX;
    } else if (tMaxY < tMaxX) {
      y += stepY;
      tMaxY += tDeltaY;
    } else {
      const seiteX = istBau({ x: x + stepX, y });
      const seiteY = istBau({ x, y: y + stepY });
      if (seiteX && seiteY) return false;
      x += stepX;
      y += stepY;
      tMaxX += tDeltaX;
      tMaxY += tDeltaY;
    }
    if (x === ziel.x && y === ziel.y) return true;
    if (!imFeld({ x, y }) || istBau({ x, y })) return false;
  }
  return false;
}
function ziele(form, von, weite, _gegner, mindest = 1) {
  const liste = [];
  const vonX = Math.max(0, von.x - weite);
  const bisX = Math.min(BREITE - 1, von.x + weite);
  const vonY = Math.max(0, von.y - weite);
  const bisY = Math.min(BREITE - 1, von.y + weite);
  for (let y = vonY; y <= bisY; y += 1) {
    for (let x = vonX; x <= bisX; x += 1) {
      const feld = { x, y };
      if (bereich(form, von, feld, weite, mindest)) liste.push(feld);
    }
  }
  return liste;
}
function kannTreffen(form, von, weite, gegner, mindest = 1) {
  return bereich(form, von, gegner, weite, mindest);
}
function weg(von, ziel, weite, block) {
  if (gleich(von, ziel)) return [];
  const herkunft = /* @__PURE__ */ new Map();
  const gesehen = /* @__PURE__ */ new Set([index(von)]);
  let rand = [von];
  let gefunden = false;
  for (let schritt = 0; schritt < weite && !gefunden; schritt += 1) {
    const naechste = [];
    for (const feld of rand) {
      for (const nachbar of nachbarn(feld)) {
        const id = index(nachbar);
        if (gesehen.has(id) || istBau(nachbar) || block.some((item) => gleich(item, nachbar))) continue;
        gesehen.add(id);
        herkunft.set(id, index(feld));
        naechste.push(nachbar);
        if (gleich(nachbar, ziel)) gefunden = true;
      }
    }
    rand = naechste;
  }
  if (!herkunft.has(index(ziel))) return null;
  const schritte = [];
  let cursor = index(ziel);
  const start = index(von);
  while (cursor !== start) {
    schritte.push(vonIndex(cursor));
    const davor = herkunft.get(cursor);
    if (davor === void 0) return null;
    cursor = davor;
  }
  schritte.reverse();
  return schritte;
}

// ../../home/claude/dell/ws/src/game/w100/kampf.ts
function kaempfer(id, seite, feld) {
  const c = charakter(id);
  return {
    id,
    name: c.name,
    seite,
    feld,
    wunden: c.wunden,
    wundenMax: c.wunden,
    vorteil: 0,
    abwehr: "keine",
    malusAngriff: 0,
    malusAbwehr: 0,
    malusBewegung: 0,
    liegt: false,
    blutung: false,
    armHin: false,
    beinHin: false,
    bewusstlos: 0,
    wenigerAktionen: 0,
    waffeHin: false,
    zoneWahl: charakter(id).ortwahl
  };
}
function neuerKampf(a, b, rng = Math.random) {
  return {
    kaempfer: {
      A: kaempfer(a, "A", { x: 8, y: 48 }),
      B: kaempfer(b, "B", { x: 48, y: 8 })
    },
    amZug: "A",
    punkte: AKTIONSPUNKTE,
    eingehend: null,
    angesetzt: null,
    log: ["Beide stehen. Die Form auf der Karte zeigt, wo ein Schlag treffen kann."],
    blick: null,
    vorbei: false,
    sieger: null,
    rng
  };
}
function andere(seite) {
  return seite === "A" ? "B" : "A";
}
function bewegung(k) {
  const c = charakter(k.id);
  let weite = Math.max(1, c.bewegung - k.malusBewegung);
  if (k.beinHin) weite = 0;
  return weite;
}
function laufFelder(state, seite) {
  const k = state.kaempfer[seite];
  if (k.liegt || k.bewusstlos > 0 || state.vorbei) return [];
  const gegner = state.kaempfer[andere(seite)].feld;
  return erreichbar(k.feld, bewegung(k), [gegner]);
}
function schlagFelder(state, seite) {
  const k = state.kaempfer[seite];
  if (k.liegt || k.armHin || k.bewusstlos > 0 || state.vorbei) return [];
  const c = charakter(k.id);
  const gegner = state.kaempfer[andere(seite)].feld;
  return ziele(c.form, k.feld, c.reichweite, gegner, c.mindest);
}
function kann(state, art) {
  if (state.vorbei || state.punkte <= 0 && art !== "passen") return false;
  const k = state.kaempfer[state.amZug];
  if (k.bewusstlos > 0) return art === "passen";
  if (art === "passen") return true;
  if (art === "bewegen") return state.punkte >= 1 && (k.liegt || laufFelder(state, state.amZug).length > 0);
  if (art === "schlagen") {
    if (k.liegt || k.armHin || k.bewusstlos > 0) return false;
    const c = charakter(k.id);
    const gegner = state.kaempfer[andere(state.amZug)].feld;
    return state.punkte >= 1 && bereich(c.form, k.feld, gegner, c.reichweite, c.mindest);
  }
  if (art === "parieren" || art === "ausweichen") return state.punkte >= 1 && k.abwehr === "keine";
  return false;
}
function bewegen(state, feld) {
  if (!kann(state, "bewegen")) return state;
  const next = klon(state);
  const k = next.kaempfer[next.amZug];
  if (k.liegt) {
    k.liegt = false;
    next.punkte -= 1;
    next.log.unshift(`${k.name} steht auf.`);
    return next;
  }
  if (!laufFelder(next, next.amZug).some((item) => gleich(item, feld))) return state;
  const gegnerSeite = andere(next.amZug);
  const gegner = next.kaempfer[gegnerSeite];
  const gc = charakter(gegner.id);
  const route = weg(k.feld, feld, bewegung(k), [gegner.feld]);
  if (!route) return state;
  const schonDrin = bereich(gc.form, gegner.feld, k.feld, gc.reichweite, gc.mindest);
  let ziel = feld;
  let hinein = false;
  if (!schonDrin) {
    for (const schritt of route) {
      if (bereich(gc.form, gegner.feld, schritt, gc.reichweite, gc.mindest)) {
        ziel = schritt;
        hinein = true;
        break;
      }
    }
  }
  k.feld = ziel;
  next.punkte -= 1;
  next.log.unshift(`${k.name} geht nach ${ziel.x + 1},${ziel.y + 1}.`);
  if (hinein && !gegner.liegt && !gegner.armHin && gegner.bewusstlos <= 0 && !next.vorbei) {
    next.log.unshift(`${k.name} l\xE4uft in den Radius von ${gegner.name}.`);
    schlagAufloesen(next, gegnerSeite, next.amZug, null);
  }
  if (next.vorbei || next.punkte <= 0) return next.vorbei ? next : abschluss(next);
  return next;
}
function abwehrWaehlen(state, art) {
  if (!kann(state, art)) return state;
  const next = klon(state);
  next.kaempfer[next.amZug].abwehr = art;
  next.punkte -= 1;
  next.log.unshift(`${next.kaempfer[next.amZug].name} setzt auf ${art === "parieren" ? "Parieren" : "Ausweichen"}.`);
  if (next.punkte <= 0) return abschluss(next);
  return next;
}
function makro(state, art, zone = null) {
  if (state.vorbei) return state;
  if (art === "schlag") return ankuendigen(state, zone);
  if (art === "deckung") {
    const c2 = charakter(state.kaempfer[state.amZug].id);
    if (c2.ausweichen > c2.ws && kann(state, "ausweichen")) return abwehrWaehlen(state, "ausweichen");
    if (kann(state, "parieren")) return abwehrWaehlen(state, "parieren");
    if (kann(state, "ausweichen")) return abwehrWaehlen(state, "ausweichen");
    return state;
  }
  const seite = state.amZug;
  if (kann(state, "schlagen")) return ankuendigen(state, zone);
  if (!kann(state, "bewegen")) return state;
  const gegner = state.kaempfer[andere(seite)];
  const c = charakter(state.kaempfer[seite].id);
  const schritte = laufFelder(state, seite);
  const treffend = schritte.filter((feld) => kannTreffen(c.form, feld, c.reichweite, gegner.feld, c.mindest));
  const ziel = (treffend.length ? treffend : schritte).sort((a, b) => abstand(a, gegner.feld) - abstand(b, gegner.feld))[0];
  if (!ziel) return state;
  const next = bewegen(state, ziel);
  if (next.vorbei || next.amZug !== seite) return next;
  if (kann(next, "schlagen")) return ankuendigen(next, zone);
  return next;
}
function ankuendigen(state, zone = null) {
  if (!kann(state, "schlagen")) return state;
  const next = klon(state);
  const k = next.kaempfer[next.amZug];
  const gegnerSeite = andere(next.amZug);
  const zoneFest = zone && charakter(k.id).ortwahl ? zone : null;
  next.punkte -= 1;
  schlagAufloesen(next, next.amZug, gegnerSeite, zoneFest);
  if (next.vorbei || next.punkte <= 0) return next.vorbei ? next : abschluss(next);
  return next;
}
function passen(state) {
  if (state.vorbei) return state;
  return abschluss(klon(state));
}
function abschluss(state) {
  if (state.vorbei) return state;
  const naechste = andere(state.amZug);
  state.amZug = naechste;
  const k = state.kaempfer[naechste];
  k.abwehr = "keine";
  if (k.blutung && k.wunden > 0) {
    k.wunden -= 1;
    state.log.unshift(`${k.name} blutet. 1 Wunde.`);
    if (k.wunden <= 0) fallen(state, k, "Die Blutung entscheidet.");
  }
  if (k.bewusstlos > 0) {
    k.bewusstlos -= 1;
    state.log.unshift(k.bewusstlos > 0 ? `${k.name} ist bewusstlos.` : `${k.name} kommt zu sich.`);
  }
  state.punkte = k.bewusstlos > 0 ? 0 : Math.max(0, AKTIONSPUNKTE - k.wenigerAktionen);
  k.wenigerAktionen = 0;
  if (state.punkte === 0 && !state.vorbei) return abschluss(state);
  return state;
}
function laengenMalus(angriff, abwehr, distanz) {
  if (angriff.form !== "nah" || abwehr.form !== "nah") return 0;
  const gedrangt = distanz <= 8;
  if (!gedrangt && angriff.laenge < abwehr.laenge) return 10;
  if (gedrangt && angriff.laenge > abwehr.laenge) return 10;
  return 0;
}
function schwaechsteZone(ruestung) {
  const zonen = ["kopf", "arm-links", "arm-rechts", "koerper", "bein-links", "bein-rechts"];
  return zonen.reduce((beste, zone) => ruestung[zone] < ruestung[beste] ? zone : beste);
}
function schlagAufloesen(state, von, nach, festeZone) {
  const a = state.kaempfer[von];
  const b = state.kaempfer[nach];
  const ac = charakter(a.id);
  const bc = charakter(b.id);
  const malus = laengenMalus(ac, bc, abstand(a.feld, b.feld));
  const fertigkeit = (ac.form === "nah" ? ac.ws : ac.bs) + a.vorteil * 10 - a.malusAngriff - (a.waffeHin ? 20 : 0) - malus;
  const wurf = w100(state.rng);
  const angriff = probe(fertigkeit, wurf);
  let abwehrProbe = null;
  if (b.abwehr !== "keine") {
    const wert = (b.abwehr === "parieren" ? bc.ws : bc.ausweichen) + b.vorteil * 10 - b.malusAbwehr;
    abwehrProbe = probe(wert, w100(state.rng));
  }
  const waffe = ac.schaden + (ac.laenge > 0 ? bonus(ac.staerke) : 0);
  const treffer = vergleich(angriff, abwehrProbe, waffe, bonus(bc.widerstand), 0);
  if (!treffer.getroffen || !treffer.zone) {
    if (abwehrProbe && abwehrProbe.sl > angriff.sl) b.vorteil += 1;
    a.vorteil = 0;
    const art = b.abwehr === "parieren" ? "pariert" : b.abwehr === "ausweichen" ? "ausgewichen" : treffer.patzer ? "patzer" : "daneben";
    state.blick = { angreifer: a.id, ziel: b.id, art, text: treffer.text };
    state.log.unshift(`${a.name}: ${treffer.text}${malus ? " Waffenl\xE4nge \u221210." : ""}`);
    if (treffer.patzer) patzerAnwenden(state, a);
    return;
  }
  const spanne = angriff.sl - (abwehrProbe?.sl ?? 0);
  const ort = ac.ortwahl && (spanne >= 2 || angriff.kritisch);
  let zone = treffer.zone;
  if (ort && festeZone) zone = festeZone;
  else if (ort) zone = schwaechsteZone(bc.ruestung);
  const ruestung = angriff.kritisch ? 0 : bc.ruestung[zone];
  const korrigiert = vergleich(angriff, abwehrProbe, waffe, bonus(bc.widerstand), ruestung);
  korrigiert.zone = zone;
  korrigiert.text = korrigiert.text.replace(ZONE_NAME[treffer.zone], ZONE_NAME[zone]);
  b.wunden -= korrigiert.wunden;
  a.vorteil += 1;
  b.vorteil = 0;
  state.blick = { angreifer: a.id, ziel: b.id, art: "treffer", text: korrigiert.text };
  const extra = [];
  if (malus) extra.push("Waffenl\xE4nge \u221210.");
  if (festeZone && !ort) extra.push("Die Zone bleibt dem Wurf, der Vorsprung fehlt.");
  if (ort && zone !== treffer.zone) extra.push(`Ort gew\xE4hlt: ${ZONE_NAME[zone]}.`);
  if (angriff.kritisch) extra.push("Die R\xFCstung wird umgangen.");
  if (korrigiert.wunden > 0 && spanne >= 2) extra.push(effektAnwenden(a.id, b));
  state.log.unshift(`${a.name} gegen ${b.name}: ${korrigiert.text} ${extra.join(" ")}`.trim());
  if (korrigiert.kritisch) kritischAnwenden(state, b, zone);
  if (b.wunden <= 0) fallen(state, b, "Die Wunden sind auf 0.");
}
function effektAnwenden(von, ziel) {
  const effekt = charakter(von).effekt;
  if (effekt === "sturz") {
    ziel.liegt = true;
    return "Sturz.";
  }
  if (effekt === "blutung") {
    ziel.blutung = true;
    return "Blutung.";
  }
  if (effekt === "fessel") {
    ziel.wenigerAktionen += 1;
    return "Gefesselt, eine Aktion weniger.";
  }
  return "";
}
function kritischAnwenden(state, ziel, zone) {
  const wurf = w100(state.rng);
  const zeile = kritZeile(zone, wurf);
  if (zeile.wunden > 0) ziel.wunden -= zeile.wunden;
  if (/Blutung/.test(zeile.folge)) ziel.blutung = true;
  if (/Aktion weniger/.test(zeile.folge)) ziel.wenigerAktionen += 1;
  if (/−20|−10/.test(zeile.folge)) ziel.malusAngriff += /−20/.test(zeile.folge) ? 20 : 10;
  if (/Bewegung −1/.test(zeile.folge)) ziel.malusBewegung += 1;
  if (/halbiert/.test(zeile.folge)) ziel.malusBewegung += 2;
  if (/nicht mehr gehen/.test(zeile.folge)) ziel.beinHin = true;
  if (/schlägt nicht mehr/.test(zeile.folge)) ziel.armHin = true;
  if (/Keine Aktion/.test(zeile.folge)) ziel.bewusstlos = Math.max(ziel.bewusstlos, 1);
  if (/zurück/.test(zeile.folge)) {
    const weg2 = schrittZurueck(ziel.feld, state.kaempfer[andere(ziel.seite)].feld);
    if (weg2) ziel.feld = weg2;
  }
  state.log.unshift(`Kritisch ${zeile.name} (${wurf}). ${zeile.folge}`);
  if (zeile.tot) fallen(state, ziel, zeile.folge);
}
function patzerAnwenden(state, wer) {
  const wurf = w100(state.rng);
  const zeile = patzerZeile(wurf);
  if (zeile.name === "Eigenhieb") wer.wunden -= 1;
  if (zeile.name === "Verhakt") wer.wenigerAktionen += 1;
  if (zeile.name === "Stolpern") {
    const weg2 = schrittZurueck(wer.feld, state.kaempfer[andere(wer.seite)].feld);
    if (weg2) wer.feld = weg2;
  }
  if (zeile.name === "Blo\xDFgelegt") wer.malusAbwehr += 20;
  if (zeile.name === "Gest\xFCrzt") wer.liegt = true;
  if (zeile.name === "Waffe hin") wer.waffeHin = true;
  state.log.unshift(`Patzer ${zeile.name} (${wurf}). ${zeile.folge}`);
  if (wer.wunden <= 0) fallen(state, wer, "Der Patzer war genug.");
}
function fallen(state, wer, grund) {
  wer.wunden = Math.min(wer.wunden, 0);
  state.vorbei = true;
  state.sieger = andere(wer.seite);
  state.punkte = 0;
  state.blick = { angreifer: state.kaempfer[andere(wer.seite)].id, ziel: wer.id, art: "gebrochen", text: grund };
  state.log.unshift(`${wer.name} f\xE4llt. ${grund}`);
}
function klon(state) {
  return {
    ...state,
    kaempfer: { A: { ...state.kaempfer.A, feld: { ...state.kaempfer.A.feld } }, B: { ...state.kaempfer.B, feld: { ...state.kaempfer.B.feld } } },
    eingehend: state.eingehend ? { ...state.eingehend, feld: { ...state.eingehend.feld } } : null,
    angesetzt: state.angesetzt ? { ...state.angesetzt, feld: { ...state.angesetzt.feld } } : null,
    log: [...state.log],
    blick: state.blick
  };
}
function bot(state) {
  const seite = state.amZug;
  let next = state;
  const noch = () => next.amZug === seite && !next.vorbei;
  const gegner = () => next.kaempfer[andere(seite)];
  const ich = () => next.kaempfer[seite];
  let geschlagen = false;
  let gewichen = false;
  while (noch()) {
    const c = charakter(ich().id);
    if (!geschlagen && kann(next, "schlagen")) {
      next = ankuendigen(next, null);
      geschlagen = true;
      continue;
    }
    if (geschlagen && !gewichen && c.bewegung >= 40 && kann(next, "bewegen")) {
      gewichen = true;
      const weit = laufFelder(next, seite).sort((a, b) => abstand(b, gegner().feld) - abstand(a, gegner().feld))[0];
      if (weit && abstand(weit, gegner().feld) >= 32) {
        next = bewegen(next, weit);
      }
      break;
    }
    if (kann(next, "schlagen")) {
      next = ankuendigen(next, null);
      continue;
    }
    if (gegnerTrifft(next, seite, ich().feld)) {
      const fertig = c.ausweichen > c.ws ? c.ausweichen : c.ws;
      if (fertig >= 45 && c.ausweichen > c.ws && kann(next, "ausweichen")) {
        next = abwehrWaehlen(next, "ausweichen");
        continue;
      }
      if (fertig >= 45 && kann(next, "parieren")) {
        next = abwehrWaehlen(next, "parieren");
        continue;
      }
    }
    if (!kann(next, "bewegen")) break;
    const schritte = laufFelder(next, seite);
    const nah = charakter(gegner().id).form === "nah";
    const treffend = schritte.filter((feld) => kannTreffen(c.form, feld, c.reichweite, gegner().feld, c.mindest));
    const ziel = (treffend.length ? treffend : schritte).sort((a, b) => {
      const da = abstand(a, gegner().feld);
      const db = abstand(b, gegner().feld);
      if (c.form !== "nah" && nah) return db - da;
      return da - db;
    })[0];
    if (!ziel) break;
    const vorher = ich().feld;
    next = bewegen(next, ziel);
    if (gleich(vorher, ich().feld)) break;
  }
  if (noch()) next = passen(next);
  return next;
}
function gegnerTrifft(state, seite, feld) {
  const gegner = state.kaempfer[andere(seite)];
  const c = charakter(gegner.id);
  return kannTreffen(c.form, gegner.feld, c.reichweite, feld, c.mindest);
}
function imMuster(state, seite, feld) {
  return gegnerTrifft(state, seite, feld);
}
function bedroht(state, seite) {
  return gegnerTrifft(state, seite, state.kaempfer[seite].feld);
}
function formName(form) {
  if (form === "nah") return "Nahkampf";
  if (form === "schuss") return "Schuss";
  return "Bogen";
}
export {
  AKTIONEN,
  AKTIONSPUNKTE,
  BAU,
  BAU_KANTE,
  BAU_X0,
  BAU_Y0,
  BREITE,
  CHARAKTERE,
  FOLGE,
  KRIT,
  PATZER,
  ZONE_NAME,
  abstand,
  abwehrWaehlen,
  andere,
  ankuendigen,
  bedroht,
  bereich,
  bewegen,
  bonus,
  bot,
  charakter,
  erreichbar,
  formName,
  gegnerTrifft,
  gleich,
  imFeld,
  imMuster,
  inSchablone,
  index,
  istBau,
  istPasch,
  kann,
  kannTreffen,
  kritZeile,
  laufFelder,
  makro,
  nachbarn,
  neuerKampf,
  passen,
  patzerZeile,
  probe,
  schlagFelder,
  schrittZurueck,
  umdrehen,
  vergleich,
  vonIndex,
  w100,
  weg,
  ziele,
  zoneAusWurf
};
