/**
 * A tesztesetek a FORRÁSTÁBLA soraiból jönnek, nem az implementációból.
 * Minden várt érték a CDC 2024-es összefoglaló lapjáról olvasható le.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadMec, besorol, keres, merleg, validateMec, cimke } from "../core/fogamzas/mec.ts";

const k = loadMec("registry/fogamzas/usmec-2024.json");

test("a készlet validálása hibátlan", () => {
  assert.deepEqual(validateMec(k).filter((i) => i.severity === "error"), []);
});

test("a mérleg minden száma a sorokból származik", () => {
  const m = merleg(k);
  const cellak = k.sorok.reduce((n, s) => n + Object.keys(s.kat).length, 0);
  assert.equal(m.cella, cellak);
  // kategóriánként kétszer számoljuk (kezdés + folytatás)
  const osszes = Object.values(m.kategoriankent).reduce((a, b) => a + b, 0);
  assert.equal(osszes, cellak * 2);
  assert.equal(m.sor, k.sorok.length);
});

test("minden sorkulcs egyedi", () => {
  const kulcsok = k.sorok.map(cimke);
  assert.equal(new Set(kulcsok).size, kulcsok.length);
});

/* ── A KEZDÉS ÉS A FOLYTATÁS KÉT KÜLÖN OSZLOP ────────────────────────── */

test("HIV, nem beállított beteg, réz-IUD: kezdés 2, FOLYTATÁS 1", () => {
  const kulcs = "HIV — b. HIV infection / ii. Not clinically well or not receiving ARV therapy‡";
  assert.equal(besorol(k, [kulcs], "cu_iud", "kezdes").ertek, "2");
  const f = besorol(k, [kulcs], "cu_iud", "folytatas");
  assert.equal(f.ertek, "1");
  assert.equal(f.hasznalhato, true);
  // a másik fázis mindig látszik, ha eltér
  assert.deepEqual(f.masikFazis, { fazis: "kezdes", ertek: "2" });
});

test("heves vérzés + LNG-IUD: a FOLYTATÁS a szigorúbb (1 → 2)", () => {
  // Ez az irány zárja ki a „vegyük mindig a szigorúbbat” megoldást: a táblában
  // mindkét irány előfordul, tehát a fázist tudni kell, nem kitalálni.
  const kulcs = "Vaginal bleeding patterns — b. Heavy or prolonged bleeding";
  assert.equal(besorol(k, [kulcs], "lng_iud", "kezdes").ertek, "1");
  assert.equal(besorol(k, [kulcs], "lng_iud", "folytatas").ertek, "2");
});

test("a táblában mindkét irányban van eltérés", () => {
  let szigorubbKezdes = 0, szigorubbFolytatas = 0;
  for (const s of k.sorok) {
    for (const c of Object.values(s.kat)) {
      if (c.k === c.f || c.k === "NA" || c.f === "NA") continue;
      const a = Math.max(...c.k.split("/").map(Number));
      const b = Math.max(...c.f.split("/").map(Number));
      if (a > b) szigorubbKezdes++;
      else if (b > a) szigorubbFolytatas++;
    }
  }
  assert.ok(szigorubbKezdes > 0, "kell lennie kezdésre szigorúbb cellának");
  assert.ok(szigorubbFolytatas > 0, "kell lennie folytatásra szigorúbb cellának");
});

test("méhnyakrák kezelésre várva: IUD kezdés 4, folytatás 2", () => {
  const kulcs = "Cervical cancer — Awaiting treatment";
  assert.equal(besorol(k, [kulcs], "cu_iud", "kezdes").kat, 4);
  assert.equal(besorol(k, [kulcs], "cu_iud", "folytatas").kat, 2);
  assert.equal(besorol(k, [kulcs], "pop", "kezdes").kat, 1);
});

/* ── AZ NA NEM HIÁNY, ÉS NEM „1” ─────────────────────────────────────── */

test("terhesség: hormonális NA, réz-IUD 4 — a kettő nem ugyanaz", () => {
  const hormon = besorol(k, ["Pregnancy"], "coc", "kezdes");
  assert.equal(hormon.allapot, "nemErtelmezheto");
  assert.equal(hormon.ertek, "NA");
  assert.equal(hormon.kat, null);
  assert.equal(hormon.hasznalhato, null);

  const iud = besorol(k, ["Pregnancy"], "cu_iud", "kezdes");
  assert.equal(iud.allapot, "besorolva");
  assert.equal(iud.kat, 4);
  assert.equal(iud.hasznalhato, false);
});

/* ── A VAGYLAGOS ÉRTÉKET NEM KEREKÍTJÜK ──────────────────────────────── */

test("hemodialízis + POP: 2/4 marad, nem lesz belőle szám", () => {
  const r = besorol(k, ["Chronic kidney disease‡ — b. Hemodialysis"], "pop", "kezdes");
  assert.equal(r.allapot, "vagylagos");
  assert.equal(r.ertek, "2/4");
  assert.equal(r.kat, null);
  assert.equal(r.hasznalhato, null);
});

/* ── A CHC-OSZLOP EGY CELLA, KIVÉVE AHOL A FORRÁS MAGA BONTJA ────────── */

test("malabszorptív bariátriai műtét: COC 3, de tapasz és gyűrű 1", () => {
  const kulcs = "History of bariatric surgery‡ — b. Malabsorptive procedures";
  assert.equal(besorol(k, [kulcs], "coc", "kezdes").kat, 3);
  assert.equal(besorol(k, [kulcs], "patch", "kezdes").kat, 1);
  assert.equal(besorol(k, [kulcs], "ring", "kezdes").kat, 1);
  assert.equal(besorol(k, [kulcs], "pop", "kezdes").kat, 3);
  // itt a három CHC-tag SAJÁT cellából jön, nem a közösből
  assert.deepEqual(besorol(k, [kulcs], "coc", "kezdes").forras, ["sajat"]);
});

test("a közös CHC-cellából jövő érték meg van jelölve, és ezt ki is mondja", () => {
  const r = besorol(k, ["Anemia, iron-deficiency"], "patch", "kezdes");
  assert.deepEqual(r.forras, ["chc"]);
  assert.match(r.miert, /NEM LEVEZETHETŐ/);
});

test("a közös CHC-cellából származó tagok értéke soronként azonos", () => {
  for (const s of k.sorok) {
    const kozos = k.chcTagok.filter((t) => s.honnan[t]?.includes("chc"));
    const ertekek = new Set(kozos.map((t) => `${s.kat[t].k}|${s.kat[t].f}`));
    assert.ok(ertekek.size <= 1, `${cimke(s)}: ${[...ertekek].join(" / ")}`);
  }
});

/* ── ÖRÖKLÉS A SZÜLŐSOR ÖSSZEVONT CELLÁJÁBÓL ─────────────────────────── */

test("HIV alsorok öröklik a szülősor hormonális celláit", () => {
  const kulcs = "HIV — b. HIV infection / ii. Not clinically well or not receiving ARV therapy‡";
  const r = besorol(k, [kulcs], "coc", "folytatas");
  assert.equal(r.kat, 1);
  // A KETTŐ EGYSZERRE IGAZ: a szülősor összevont cellájából ÉS a közös
  // CHC-oszlopból. Mindkettőnek látszania kell.
  assert.deepEqual(r.forras, ["orokolt", "chc"]);
  assert.match(r.miert, /SZÜLŐSOR/);
  assert.match(r.miert, /KÖZÖS CHC-OSZLOPBÓL/);
});

/* ── AMI NINCS A TÁBLÁBAN, AZ NEM „SZABAD” ───────────────────────────── */

test("ismeretlen feltétel nem lesz 1-es kategória", () => {
  const r = besorol(k, ["nincs ilyen betegség"], "coc", "kezdes");
  assert.equal(r.allapot, "feltetelNincs");
  assert.equal(r.kat, null);
  assert.equal(r.hasznalhato, null);
  assert.match(r.miert, /NEM AZT JELENTI, HOGY SZABAD/);
});

test("a méhüreg torzulása csak IUD-re értelmezett — a hiány nem 1", () => {
  const kulcs = "Anatomical abnormalities — a. Distorted uterine cavity";
  assert.equal(besorol(k, [kulcs], "cu_iud", "kezdes").kat, 4);
  const r = besorol(k, [kulcs], "coc", "kezdes");
  assert.equal(r.allapot, "modszerreNincs");
  assert.equal(r.hasznalhato, null);
});

test("ismeretlen módszer saját állapotot kap", () => {
  assert.equal(besorol(k, ["Pregnancy"], "kondom", "kezdes").allapot, "modszerIsmeretlen");
});

/* ── A TÖBBÉRTELMŰ KERESÉS NEM AD BESOROLÁST ─────────────────────────── */

test("többértelmű keresőkifejezésből nem lesz besorolás", () => {
  const r = besorol(k, ["risk factors for VTE"], "coc", "kezdes");
  assert.equal(r.allapot, "tobbTalalat");
  assert.equal(r.kat, null);
  assert.ok(r.sorok.length > 1);
  assert.match(r.miert, /nem dönthető el/);
});

test("a szoptatás azonos szövegű alsorai külön kulcsot kaptak", () => {
  const talalt = keres(k, "With other risk factors for VTE")
    .filter((s) => s.feltetel === "Breastfeeding");
  assert.equal(talalt.length, 2, "két külön időablak, két külön sor");
  assert.notEqual(cimke(talalt[0]), cimke(talalt[1]));
});

/* ── TÖBB EGYIDEJŰ ÁLLAPOT ───────────────────────────────────────────── */

test("több feltétel esetén a legszigorúbb dönt, de mindegyik látszik", () => {
  const r = besorol(k, [
    "Chronic kidney disease‡ — b. Hemodialysis",
    "Anemia, iron-deficiency",
  ], "coc", "kezdes");
  assert.equal(r.kat, 4);
  assert.equal(r.sorok.length, 2);
  assert.match(r.miert, /LEGSZIGORÚBB/);
});

/* ── A KORFÜGGŐ SOR NEM LAPOS BESOROLÁS ──────────────────────────────── */

test("az Age sor módszerenként korsávokra bontva maradt meg", () => {
  const s = k.korfuggo.modszerenkent;
  assert.equal(s["dmpa"].length, 3);
  assert.deepEqual(s["dmpa"].map((x) => x.kat), [2, 1, 2]);
  assert.deepEqual(s["chc"].map((x) => x.kat), [1, 2]);
});

test("a számok nélküli, de kategóriáról beszélő sor megmaradt", () => {
  assert.ok(k.szovegesSorok.some((s) => /All other ARVs are 1 or 2/.test(s.szoveg)));
});

test("a mérleg forrás-számai a honnan-listákból jönnek", () => {
  const m = merleg(k);
  const chc = k.sorok.filter((s) =>
    Object.values(s.honnan).some((h) => h.includes("chc"))).length;
  const orok = k.sorok.filter((s) =>
    Object.values(s.honnan).some((h) => h.includes("orokolt"))).length;
  assert.equal(m.chcbol, chc);
  assert.equal(m.orokolt, orok);
  assert.ok(chc > 0, "a közös CHC-cella a tábla nagy részét érinti — nem lehet 0");
});
