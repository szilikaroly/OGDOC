/**
 * ExAssist — a vizsgálati asszisztens.
 *
 * A tesztek egyetlen szabályt védenek végig: a nem dokumentált vizsgálati rész
 * NEM normális vizsgálati rész. És egy másodikat, ami nélkül az első kijátszható:
 * a bővítő protokoll nem veheti ki a szakmai minimum tételét.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  hatalyos, lezarhato, loadProtokollok, merleg, tetelAllas, validateProtokollok,
  type Keszlet, type Protokoll, type Valasz,
} from "../core/exassist/protokoll.ts";

const K = () => loadProtokollok("registry/exassist/protokollok.json");
const H = (id = "ex.ujszulott") => hatalyos(K(), id)!;
/** Minden kötelező tételre „értékelve” — a teljes lelet. */
const teljes = (id = "ex.ujszulott"): Valasz[] =>
  H(id).tetelek.map((t) => ({ tetel: t.id, allapot: "ertekelve" as const }));

/* ══ 1. A HIÁNYZÓ TÉTEL BLOKKOL ════════════════════════════════════════ */

test("üres lelet: egyetlen tétel sincs megválaszolva, és ez ZÁR", () => {
  const a = tetelAllas(H(), []);
  assert.ok(a.every((x) => x.allapot === "hianyzik"));
  const l = lezarhato(a);
  assert.equal(l.lezarhato, false);
  assert.equal(l.allapot, "hianyzoTetel");
  assert.equal(l.hianyzo.length, 8, "az újszülött-vizsgálat mind a 8 tétele kötelező");
});

test("A HIÁNYZÓ BEJEGYZÉS NEM „ÉP” — ezt a rendszer ki is mondja", () => {
  const a = tetelAllas(H(), [{ tetel: "csipo", allapot: "ertekelve" }]);
  const csipo = a.find((x) => x.tetel.id === "csipo")!;
  const here = a.find((x) => x.tetel.id === "here")!;
  assert.equal(csipo.allapot, "ertekelve");
  assert.equal(here.allapot, "hianyzik");
  assert.match(here.miert, /nem azt jelenti, hogy ép/);
});

test("hiánytalan lelet: lezárható", () => {
  const l = lezarhato(tetelAllas(H(), teljes()));
  assert.equal(l.lezarhato, true);
  assert.equal(l.allapot, "lezarhato");
});

test("a NEM KÖTELEZŐ tétel hiánya nem zár — de a listán látszik", () => {
  const h = H("ex.uh.szuleszeti");
  const kot = h.tetelek.filter((t) => t.kotelezo);
  const a = tetelAllas(h, kot.map((t) => ({ tetel: t.id, allapot: "ertekelve" as const })));
  assert.equal(lezarhato(a).lezarhato, true);
  const opcionalis = a.filter((x) => !x.tetel.kotelezo);
  assert.ok(opcionalis.length >= 3);
  assert.ok(opcionalis.every((x) => x.allapot === "hianyzik"),
    "a nem kötelező tétel hiánya látszik, csak nem zár");
});

/* ══ 2. A HÁROM VÁLASZ — ÉS AMI KÖZTÜK A KÜLÖNBSÉG ═════════════════════ */

test("a „nem értékelhető” és az „elmaradt” KÜLÖN teendő", () => {
  const a = tetelAllas(H(), [
    { tetel: "vorosReflex", allapot: "nemErtekelheto", indok: "a szem nem nyílt ki" },
    { tetel: "here", allapot: "elmaradt", indok: "sürgős szülőszobai hívás" },
  ]);
  const v = a.find((x) => x.tetel.id === "vorosReflex")!;
  const h = a.find((x) => x.tetel.id === "here")!;
  assert.match(v.miert, /A BETEG korlátja/);
  assert.match(v.miert, /megismétlendő/);
  assert.match(h.miert, /A VIZSGÁLAT korlátja/);
  assert.match(h.miert, /nem tűnik el/);
});

test("INDOKLÁS NÉLKÜL a kitérő válasz ugyanolyan üres — csak kipipálva", () => {
  const v: Valasz[] = H().tetelek.map((t) => ({
    tetel: t.id,
    allapot: t.id === "gerinc" ? ("nemErtekelheto" as const) : ("ertekelve" as const),
  }));
  const l = lezarhato(tetelAllas(H(), v));
  assert.equal(l.lezarhato, false);
  assert.equal(l.allapot, "indokNelkul");
  assert.deepEqual(l.indokNelkul, ["gerinc"]);
  assert.match(l.miert, /csak kipipálva/);
});

test("indoklással viszont lezárható — a hiány rögzül, nem tűnik el", () => {
  const v: Valasz[] = H().tetelek.map((t) => ({
    tetel: t.id,
    allapot: t.id === "gerinc" ? ("elmaradt" as const) : ("ertekelve" as const),
    ...(t.id === "gerinc" ? { indok: "a szülő nem engedte lefordítani" } : {}),
  }));
  const a = tetelAllas(H(), v);
  assert.equal(lezarhato(a).lezarhato, true);
  assert.equal(a.find((x) => x.tetel.id === "gerinc")!.indok, "a szülő nem engedte lefordítani");
});

/* ══ 3. A BŐVÍTŐ RÉTEG CSAK HOZZÁADHAT ═════════════════════════════════ */

const bovites = (t: Protokoll["tetelek"], szint: "intezmenyi" | "egyeni" = "intezmenyi"): Protokoll => ({
  id: `ex.ujszulott.${szint}`, megnevezes: "Bővítés", szint,
  forras: null, hitelesitve: false, bovit: "ex.ujszulott", tetelek: t,
});

test("az intézményi réteg HOZZÁAD, és a tétel forrása látszik", () => {
  const k: Keszlet = { ...K(), intezmenyi: [bovites([
    { id: "hallas", megnevezes: "Hallásszűrés megtörtént", kotelezo: true },
  ])] };
  const h = hatalyos(k, "ex.ujszulott")!;
  assert.equal(h.tetelek.length, 9);
  assert.equal(h.tetelek.find((t) => t.id === "hallas")!.honnan, "intezmenyi");
  assert.equal(h.tetelek.find((t) => t.id === "csipo")!.honnan, "minimum");
  assert.deepEqual(h.retegek, ["ex.ujszulott.intezmenyi"]);
});

test("A MINIMUM KIVÉTELE HIBA, NEM BEÁLLÍTÁS", () => {
  const k: Keszlet = { ...K(), egyeni: [{
    ...bovites([{ id: "here", megnevezes: "Herék", kotelezo: false }], "egyeni"),
    cselekvo: "dr. Teszt",
  }] };
  const hibak = validateProtokollok(k).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /NEM KÖTELEZŐVÉ tenné/);
  assert.match(hibak[0].message, /a kihagyás intézményesítése/);
});

test("és a kísérlet SZERKEZETILEG is hatástalan — a minimum marad érvényben", () => {
  const k: Keszlet = { ...K(), egyeni: [
    bovites([{ id: "here", megnevezes: "Herék", kotelezo: false }], "egyeni")] };
  const h = hatalyos(k, "ex.ujszulott")!;
  assert.equal(h.tetelek.find((t) => t.id === "here")!.kotelezo, true,
    "a bővítés nem írhatta felül a minimumot");
  // A lezárás így továbbra is megköveteli.
  const nelkule = H().tetelek.filter((t) => t.id !== "here")
    .map((t) => ({ tetel: t.id, allapot: "ertekelve" as const }));
  assert.deepEqual(lezarhato(tetelAllas(h, nelkule)).hianyzo, ["here"]);
});

test("alap nélküli bővítés HIBA — a minimum akkor nem védi", () => {
  const k: Keszlet = { ...K(), intezmenyi: [{
    ...bovites([{ id: "x", megnevezes: "X", kotelezo: true }]), bovit: "ex.nincs.ilyen",
  }] };
  const hibak = validateProtokollok(k).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /ilyen viszont nincs/);
});

/* ══ 4. A HITELESÍTETLEN PROTOKOLL IS KÉNYSZERÍT ═══════════════════════ */

test("a hitelesítetlen tételsor NEM nyit kaput — csak figyelmeztet", () => {
  const k = K();
  const w = validateProtokollok(k);
  assert.equal(w.filter((i) => i.severity === "error").length, 0);
  assert.equal(w.filter((i) => i.severity === "warning").length, 5, "mind az 5 protokoll");
  assert.match(w[0].message, /nem nyit kaput, hanem zárva tartja/);
  // ÉS A LÉNYEG: a kényszer működik hitelesítés nélkül is.
  assert.equal(lezarhato(tetelAllas(H(), [])).lezarhato, false);
});

test("ismétlődő tételazonosító HIBA — az egyik válasz elnyelné a másikat", () => {
  const k = K();
  k.protokollok[0].tetelek.push({ id: "csipo", megnevezes: "Csípő újra", kotelezo: true });
  const hibak = validateProtokollok(k).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /észrevétlen maradna/);
});

/* ══ 5. A MÉRLEG A SOROKBÓL SZÁMOL ═════════════════════════════════════ */

test("a mérleg minden száma derivált", () => {
  const k = K();
  const m = merleg(k);
  assert.equal(m.protokoll, k.protokollok.length);
  assert.equal(m.tetel, k.protokollok.reduce((n, p) => n + p.tetelek.length, 0));
  assert.equal(m.kotelezo, k.protokollok.flatMap((p) => p.tetelek).filter((t) => t.kotelezo).length);
  assert.equal(m.hitelesitett, 0, "ma egyetlen tételsor sincs aláírva");
  assert.equal(m.bovites, 0, "és egyetlen intézményi vagy egyéni bővítés sincs");
});

test("a CTG protokoll az anyai pulzus elkülönítését KÖTELEZŐVÉ teszi", () => {
  // Ez az a tétel, aminek a kimaradása megnyugtató görbét mutat halott magzatnál.
  const h = H("ex.ctg");
  const t = h.tetelek.find((x) => x.id === "anyaiPulzus");
  assert.ok(t, "nincs anyai pulzus tétel a CTG-protokollban");
  assert.equal(t!.kotelezo, true);
  assert.equal(h.tetelek.find((x) => x.id === "jelminoseg")!.kotelezo, true);
});
