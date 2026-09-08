/**
 * A RIASZTÁSOK CÍMZETTJE ÉS AZ ESZKALÁCIÓS REND — a 15. lépés gépi fele.
 *
 * A tesztek öt szabályt védenek:
 *
 *   1. CÍMZETT NÉLKÜL a riasztás NEM ADHATÓ KI — a kapu itt megfordul;
 *   2. a lánc VÉGET ÉR: pontosan egy utolsó szint, és az a legmagasabb;
 *   3. a ki nem vett riasztás EGGYEL FELJEBB megy — magától, idő szerint;
 *   4. a lánc végén a riasztás KIMERÜL, és ezt ki kell mondani;
 *   5. a szepsziscsomag mostantól ezt a láncot használja, nem prózát.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  loadRend, merleg, riasztasAllas, tipusAllas, validateRend,
} from "../core/riasztas/eszkalacio.ts";
import type { EszkalaciosRend, RiasztasTipus } from "../core/riasztas/eszkalacio.ts";
import { loadProtocol } from "../core/szepszis/screen.ts";
import { alertStatus as bundleAlert } from "../core/szepszis/bundle.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = loadRend(join(HERE, "..", "registry", "riasztas", "eszkalacio.json"));
const P = loadProtocol(join(HERE, "..", "registry", "szepszis", "cmqcc-ob-szepszis.json"));

const T0 = "2026-09-07T10:00:00.000Z";
const perc = (n: number) => new Date(Date.parse(T0) + n * 60000).toISOString();

/** Teljes, lezárt lánc — háromszintű. */
function lancolt(id = "riaszt.szepszis"): RiasztasTipus {
  return {
    id, megnevezes: "Teszt", forras: "teszt", sulyossag: "azonnali",
    mitJelent: "Teszt riasztás, ami valamit jelent.",
    lanc: [
      { szint: 1, cimzett: "ugyeletes", elerhetoseg: "csipogó 101", valaszHatarideoPerc: 10 },
      { szint: 2, cimzett: "osztalyvezeto", elerhetoseg: "mobil", valaszHatarideoPerc: 15 },
      { szint: 3, cimzett: "intenzives", elerhetoseg: "ügyeleti telefon",
        valaszHatarideoPerc: 20, utolso: true },
    ],
  };
}
const rendbe = (t: RiasztasTipus): EszkalaciosRend =>
  ({ ...R, tipusok: [t] });

/* ── 1. A KAPU MEGFORDUL ────────────────────────────────────────────── */

test("MA EGYETLEN RIASZTÁSNAK SINCS CÍMZETTJE — és egyik sem adható ki", () => {
  const m = merleg(R);
  assert.equal(m.tipus, 8);
  assert.equal(m.kiadhato, 0);
  assert.equal(m.cimzettNelkul, 8);
  assert.equal(m.azonnali, 6);
  assert.equal(m.azonnaliKiadhato, 0);
});

test("A CÍMZETT NÉLKÜLI RIASZTÁS NEM FÉLTÁJÉKOZTATÁS, HANEM KIKÉPZÉS AZ ELKATTINTÁSRA", () => {
  const a = tipusAllas(R.tipusok[0]);
  assert.equal(a.kiadhato, false);
  assert.equal(a.allapot, "cimzettNelkul");
  assert.match(a.miert, /rosszabb a semminél/);
  assert.match(a.miert, /az igazit is elkattintja/);
});

test("a nem kiadható riasztás állapota is megnevezett, nem néma", () => {
  const a = riasztasAllas(R.tipusok[0], T0, null, perc(60));
  assert.equal(a.allapot, "nemAdhatoKi");
  assert.equal(a.cimzett, null);
});

/* ── 2. A LÁNC VÉGET ÉR ─────────────────────────────────────────────── */

test("A LEZÁRATLAN LÁNC ÉPÍTÉSI HIBA — a riasztás körbejárna", () => {
  const t = lancolt();
  delete t.lanc[2].utolso;
  assert.equal(tipusAllas(t).allapot, "lezaratlanLanc");
  const hibak = validateRend(rendbe(t)).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /nem ér véget|utolsónak/.test(h.message)));
});

test("pontosan EGY utolsó szint lehet", () => {
  const t = lancolt();
  t.lanc[1].utolso = true;
  const hibak = validateRend(rendbe(t)).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /pontosan\s+egynek kell lennie/.test(h.message)));
});

test("az utolsó szint a LEGMAGASABB kell legyen", () => {
  const t = lancolt();
  delete t.lanc[2].utolso;
  t.lanc[1].utolso = true;
  const hibak = validateRend(rendbe(t)).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /a lánc a közepén érne véget/.test(h.message)));
});

test("a címzett MEGNEVEZETT szerepkör, és elérhetőség nélkül csak papíron létezik", () => {
  const t = lancolt();
  t.lanc[0].cimzett = "az ügyelet";
  t.lanc[1].elerhetoseg = "";
  const hibak = validateRend(rendbe(t)).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /nem „az ügyelet”/.test(h.message)));
  assert.ok(hibak.some((h) => /csak papíron létezik/.test(h.message)));
});

test("az AZONNALI riasztás nem várhat félóránál tovább", () => {
  const t = lancolt();
  t.lanc[0].valaszHatarideoPerc = 45;
  const w = validateRend(rendbe(t)).filter((i) => /nem fér össze/.test(i.message));
  assert.equal(w.length, 1);
  assert.equal(w[0].severity, "warning");
});

/* ── 3. A KI NEM VETT RIASZTÁS FELJEBB MEGY ─────────────────────────── */

test("A KI NEM VETT RIASZTÁS MAGÁTÓL ESZKALÁL — idő szerint, nem kézzel", () => {
  const t = lancolt();
  // 1. szint: 0–10 perc
  assert.equal(riasztasAllas(t, T0, null, perc(5)).szint, 1);
  assert.equal(riasztasAllas(t, T0, null, perc(5)).allapot, "kiadva");
  // 2. szint: 10–25 perc
  const e2 = riasztasAllas(t, T0, null, perc(20));
  assert.equal(e2.szint, 2);
  assert.equal(e2.allapot, "eszkalalt");
  assert.equal(e2.cimzett, "osztalyvezeto");
  assert.match(e2.miert, /nem elintézett riasztás/);
  // 3. szint: 25–45 perc
  assert.equal(riasztasAllas(t, T0, null, perc(40)).szint, 3);
});

test("az átvétel megállítja a láncot, és rögzíti, MELYIK szinten", () => {
  const t = lancolt();
  const a = riasztasAllas(t, T0, perc(18), perc(60));
  assert.equal(a.allapot, "atveve");
  assert.equal(a.szint, 2, "a 2. szinten vették át");
  assert.equal(a.eltelt, 18);
});

/* ── 4. A LÁNC VÉGÉN KIMERÜL ────────────────────────────────────────── */

test("A KIMERÜLT RIASZTÁST KI KELL MONDANI — a rendszer nem tehet úgy, mintha szólt volna", () => {
  const t = lancolt();
  const a = riasztasAllas(t, T0, null, perc(90));  // 10+15+20 = 45 perc a lánc
  assert.equal(a.allapot, "kimerult");
  assert.equal(a.szint, 3);
  assert.equal(a.cimzett, "intenzives");
  assert.match(a.miert, /nem szabad úgy tennie, mintha szólt volna/);
});

/* ── 5. A SZEPSZISCSOMAG A LÁNCOT HASZNÁLJA ─────────────────────────── */

test("A SZEPSZISPROTOKOLL MOSTANTÓL A LÁNCRA MUTAT, nem prózára", () => {
  assert.equal(P.escalation.tipus, "riaszt.szepszis");
  assert.ok(R.tipusok.some((t) => t.id === "riaszt.szepszis"));
});

test("lánc nélkül hívva a régi, prózai válasz jön — de az is kimondja a hiányt", () => {
  const a = bundleAlert(P, T0, null, perc(60));
  assert.equal(a.state, "unacknowledged");
  assert.match(a.why, /egy szinttel feljebb/);
});

test("LÁNCCAL HÍVVA A VÁLASZ MEGNEVEZI, KI A FELELŐS MOST", () => {
  const rend = rendbe(lancolt("riaszt.szepszis"));
  const a = bundleAlert(P, T0, null, perc(20), rend);
  assert.equal(a.state, "unacknowledged");
  assert.match(a.why, /ESZKALÁLVA a 2\. szintre \(osztalyvezeto\)/);

  const atveve = bundleAlert(P, T0, perc(5), perc(60), rend);
  assert.equal(atveve.state, "acknowledged");
  assert.match(atveve.why, /1\. szinten \(ugyeletes\)/);
});

test("a címzett nélküli lánccal a szepsziscsomag sem ad ki riasztást", () => {
  const a = bundleAlert(P, T0, null, perc(60), R);
  assert.equal(a.state, "unacknowledged");
  assert.match(a.why, /NINCS CÍMZETT/);
});

/* ── 6. A KIINDULÓ ÁLLAPOT ──────────────────────────────────────────── */

test("a valódi rend az elvárt állapotban indul", () => {
  assert.equal(R.tipusok.length, 8);
  assert.ok(R.tipusok.every((t) => t.lanc.length === 0));
  assert.ok(Object.keys(R.szerepek).length >= 5);
  // Nyolc figyelmeztetés, egyetlen építési hiba nélkül: a hiány NEM hiba,
  // hanem megnevezett adósság — a kapu viszont zárva.
  const v = validateRend(R);
  assert.equal(v.filter((i) => i.severity === "error").length, 0);
  assert.equal(v.filter((i) => i.severity === "warning").length, 8);
});

test("minden riasztástípus megmondja, MIT JELENT", () => {
  for (const t of R.tipusok) {
    assert.ok(t.mitJelent.length > 30, `${t.id}: a címzett ezt olvassa, nem a kódot`);
  }
  const t = { ...R.tipusok[0], mitJelent: " " };
  assert.ok(validateRend(rendbe(t)).some((i) => /MIT JELENT/.test(i.message)));
});
