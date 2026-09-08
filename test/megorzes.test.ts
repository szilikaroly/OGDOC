/**
 * A MEGŐRZÉSI IDŐK — a 10. lépés gépi fele.
 *
 * A tesztek nem a 30 és az 50 évet védik: azok hitelesítésre várnak, és az
 * elsődleges jogszabályszöveget a hálózati szabályzat blokkolja. Amit
 * védenek, hat szerkezeti szabály:
 *
 *   1. az időtartam KISZÁMOLÓDIK, nem csak kiíródik;
 *   2. a hiányzó horgony nem „most” — a hiány megnevezve marad;
 *   3. a BEGÉPELT lejárat visszaellenőrződik a dokumentum saját adataiból;
 *   4. a `primary` szint ALÁÍRÁSBÓL áll elő, nem jelölésből;
 *   5. az idézet és a beállítás horgonyeltérése megnevezve áll;
 *   6. a próbafuttatás SOHA nem töröl.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadDocuments } from "../core/docs/registry.ts";
import type { DocumentDef } from "../core/docs/types.ts";
import {
  hozzaad, horgonyElteresek, igazolasEllenorzes, jogszabalyhely, lejarat,
  lenyeg, lenyomat, loadMegorzesHitelesitesek, megorzesAllapot, merleg,
  parseIdotartam, terv, validateMegorzes, alkalmaz,
} from "../core/docs/megorzes.ts";
import type { MegorzesKatalogus } from "../core/docs/megorzes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = loadDocuments(join(HERE, "..", "registry", "documents", "core.json")).all();
const KAT = loadMegorzesHitelesitesek(
  join(HERE, "..", "registry", "documents", "megorzes-hitelesitesek.json"));

const masol = (): DocumentDef[] => JSON.parse(JSON.stringify(DOCS));
const ZARO = () => masol().find((d) => d.id === "doc.zarojelentes")!;

function alairva(docs: DocumentDef[]): MegorzesKatalogus {
  return {
    szerepek: {},
    hitelesitesek: docs.map((d) => ({
      doc: d.id, ki: "dr. Teszt Jogász", szerep: "jogasz", mikor: "2026-09-07",
      lenyomat: lenyomat(lenyeg(d)),
      jogszabaly: "1997. évi XLVII. törvény, egységes szerkezetben",
      hatalyos: "2026-09-01",
    })),
  };
}

/* ── 1. AZ IDŐTARTAM ────────────────────────────────────────────────── */

test("az időtartam csak akkor értelmezett, ha teljesen az", () => {
  assert.deepEqual(parseIdotartam("P50Y"), { ev: 50, honap: 0, nap: 0 });
  assert.deepEqual(parseIdotartam("P10Y6M"), { ev: 10, honap: 6, nap: 0 });
  // A NÉMA NULLA A LEGDRÁGÁBB HIBA: azonnali megsemmisítést jelentene.
  assert.equal(parseIdotartam("P0Y"), null);
  assert.equal(parseIdotartam("50 év"), null);
  assert.equal(parseIdotartam("P"), null);
  assert.equal(parseIdotartam(""), null);
});

test("a szökőnap nem csúszik át a következő hónapra", () => {
  assert.equal(hozzaad("2024-02-29T00:00:00.000Z", { ev: 1, honap: 0, nap: 0 })!.slice(0, 10),
    "2025-02-28");
  assert.equal(hozzaad("2024-01-31T00:00:00.000Z", { ev: 0, honap: 1, nap: 0 })!.slice(0, 10),
    "2024-02-29");
});

test("a megőrzési idő KISZÁMOLÓDIK — eddig csak kiíródott", () => {
  const l = lejarat(ZARO().retention, { recordClose: "2020-03-01T00:00:00.000Z" });
  assert.equal(l.allapot, "ok");
  assert.equal(l.mikor!.slice(0, 10), "2070-03-01");
});

/* ── 2. A HIÁNYZÓ HORGONY ───────────────────────────────────────────── */

test("A HIÁNYZÓ HORGONY NEM „MOST”", () => {
  const l = lejarat(ZARO().retention, {});
  assert.equal(l.allapot, "hianyzoHorgony");
  assert.equal(l.mikor, null);
  assert.match(l.miert, /nem „most”/);
});

test("az értelmezhetetlen időtartam sem lesz csendben nulla", () => {
  const d = ZARO();
  d.retention.period = "harminc év";
  const l = lejarat(d.retention, { recordClose: "1900-01-01T00:00:00.000Z" });
  assert.equal(l.allapot, "ertelmezhetetlenIdotartam");
  assert.equal(l.mikor, null);
});

/* ── 3. A BEGÉPELT IGAZOLÁS ─────────────────────────────────────────── */

test("A BEGÉPELT LEJÁRAT VISSZAELLENŐRZŐDIK — ez volt a lyuk", () => {
  const d = ZARO();
  // Az eset tavaly zárult, a rendelkezés 2020-as lejáratot állít.
  const e = igazolasEllenorzes(d, "2020-01-01", { recordClose: "2025-01-01T00:00:00.000Z" });
  assert.equal(e.rendben, false);
  assert.match(e.miert, /TÚL KORAI/);
  assert.equal(e.szamolt!.slice(0, 10), "2075-01-01");
});

test("amit nem lehet ellenőrizni, azt a rendszer nem fogadja el igazolásnak", () => {
  const e = igazolasEllenorzes(ZARO(), "2020-01-01", {});
  assert.equal(e.rendben, false);
  assert.match(e.miert, /NEM IGAZOLHATÓ/);
});

test("a helyes lejárat átmegy", () => {
  const e = igazolasEllenorzes(ZARO(), "2020-01-01", { recordClose: "1960-01-01T00:00:00.000Z" });
  assert.equal(e.rendben, true);
});

/* ── 4. AZ ALÁÍRÁS ──────────────────────────────────────────────────── */

test("a `primary` szint ALÁÍRÁS NÉLKÜL építési hiba", () => {
  const docs = masol();
  for (const d of docs) d.retention.verification = "primary";
  const hibak = validateMegorzes(docs, KAT).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 14);
  assert.ok(hibak.every((h) => /ALÁÍRÁS NÉLKÜL/.test(h.message)));
});

test("aláírással a szint futásidőben áll elő", () => {
  const docs = masol();
  const kat = alairva(docs);
  assert.equal(alkalmaz(docs, kat), 14);
  assert.ok(docs.every((d) => d.retention.verification === "primary"));
  assert.equal(validateMegorzes(docs, kat).filter((i) => i.severity === "error").length, 0);
});

test("EGYETLEN NAP ELMOZDÍTÁSA ELAVULTTÁ TESZI AZ ALÁÍRÁST", () => {
  const docs = masol();
  const kat = alairva(docs);
  docs.find((d) => d.id === "doc.kepalkoto-felvetel")!.retention.period = "P5Y";
  const a = megorzesAllapot(docs, kat).find((x) => x.doc === "doc.kepalkoto-felvetel")!;
  assert.equal(a.allapot, "elavult");
});

test("a HORGONY átállítása is elavulttá teszi — nem csak az időtartam", () => {
  const docs = masol();
  const kat = alairva(docs);
  docs[0].retention.from = "dataEntry";
  assert.equal(megorzesAllapot(docs, kat)[0].allapot, "elavult");
});

test("a leíró szöveg javítása NEM veszi el az aláírást", () => {
  const docs = masol();
  const kat = alairva(docs);
  docs[0].retention.verifiedNote = "átfogalmazva";
  docs[0].retention.source =
    jogszabalyhely(docs[0].retention.source) + " — pontosított leírás";
  assert.equal(megorzesAllapot(docs, kat)[0].allapot, "hitelesitve");
});

test("a HATÁLYOSSÁG NAPJA nélkül az aláírás nem aláírás", () => {
  const docs = masol();
  const kat = alairva(docs);
  kat.hitelesitesek[0].hatalyos = "";
  const hibak = validateMegorzes(docs, kat).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /hatályosság dátumhoz kötött/);
});

test("a jogszabályhelynek jogszabályhelynek kell lennie", () => {
  const docs = masol();
  docs[0].retention.source = "a kórházi szabályzat szerint sokáig";
  const hibak = validateMegorzes(docs, KAT).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /nem jogszabályhely/);
});

/* ── 5. A HORGONYELTÉRÉS ────────────────────────────────────────────── */

test("az idézet mást mond, mint a beállítás — 13 tételnél", () => {
  const e = horgonyElteresek(DOCS);
  assert.equal(e.length, 13);
  assert.ok(e.every((x) => x.from === "recordClose"));
  assert.ok(e.every((x) => x.hosszabb), "mind a biztonságos irányba téved");
  assert.ok(e.some((x) => x.idezett === "dataEntry"));
  assert.ok(e.some((x) => x.idezett === "creation" && x.doc === "doc.kepalkoto-felvetel"));

  // A zárójelentés idézete nem nevez meg horgonyt: nincs mit összevetni.
  assert.ok(!e.some((x) => x.doc === "doc.zarojelentes"));
});

test("a NEM biztonságos irányt külön mondja ki", () => {
  const docs = masol();
  const d = docs.find((x) => x.id === "doc.zarojelentes")!;
  d.retention.from = "recordClose";
  d.retention.source = "1997. évi XLVII. tv. 30. § — 50 év a beteg halálától";
  const e = horgonyElteresek(docs).find((x) => x.doc === "doc.zarojelentes")!;
  assert.equal(e.hosszabb, false);
  assert.match(e.miert, /NEM biztonságos/);
});

test("a horgonyeltérés EGY figyelmeztetés csoportonként, nem tizenhárom", () => {
  const w = validateMegorzes(DOCS, KAT).filter((i) => /HORGONYT IDÉZ/.test(i.message));
  assert.equal(w.length, 2, "adatfelvétel és készítés — két csoport");
  assert.ok(w.every((x) => x.severity === "warning"));
});

/* ── 6. A PRÓBAFUTTATÁS ─────────────────────────────────────────────── */

test("A PRÓBAFUTTATÁS SOHA NEM TÖRÖL", () => {
  const t = terv(DOCS, KAT, "SZINT-1", { recordClose: "1900-01-01T00:00:00.000Z" },
    "2026-09-07T00:00:00.000Z");
  assert.equal(t.szarazon, true);
  assert.match(t.osszefoglalo, /nem töröl semmit/);
  // A regiszter érintetlen marad.
  assert.ok(DOCS.every((d) => d.retention.verification !== "primary"));
});

test("lejárt idő ALÁÍRÁS NÉLKÜL sem töröl — ez a helyes sorrend", () => {
  const t = terv(DOCS, KAT, "SZINT-1960", { recordClose: "1960-01-01T00:00:00.000Z" },
    "2026-09-07T00:00:00.000Z");
  assert.equal(t.menne, 0);
  assert.equal(t.tetelek.filter((x) => x.lejart).length, 14, "minden idő letelt");
  assert.ok(t.tetelek.every((x) => /nincs aláírva/.test(x.miert)));
});

test("aláírás mellett a lejárt tételek MENNÉNEK — de csak azok", () => {
  const docs = masol();
  const kat = alairva(docs);
  // 2010-ben lezárt eset: a 10 éves idő letelt, a 30 és az 50 nem.
  const t = terv(docs, kat, "SZINT-2010", { recordClose: "2010-06-15T00:00:00.000Z" },
    "2026-09-07T00:00:00.000Z");
  assert.equal(t.menne, 1);
  assert.equal(t.tetelek.find((x) => x.torolheto)!.doc, "doc.kepalkoto-felvetel");
  assert.ok(t.tetelek.filter((x) => !x.torolheto)
    .every((x) => /megőrzési idő .* -ig tart|megőrzési idő/.test(x.miert)));
});

test("a LEZÁRATLAN esetnél a terv nem esik vissza a mai dátumra", () => {
  const docs = masol();
  const t = terv(docs, alairva(docs), "SZINT-NYITOTT", {}, "2026-09-07T00:00:00.000Z");
  assert.equal(t.menne, 0);
  assert.ok(t.tetelek.every((x) => x.lejarat === null));
  assert.ok(t.tetelek.every((x) => /HORGONY HIÁNYZIK/.test(x.miert)));
});

/* ── 7. A KIINDULÓ ÁLLAPOT ──────────────────────────────────────────── */

test("a valódi regiszter az elvárt állapotban indul", () => {
  assert.equal(KAT.hitelesitesek.length, 0, "a katalógus szándékosan üres");
  assert.equal(DOCS.length, 14);
  assert.ok(DOCS.every((d) => d.retention.verification === "secondary"));
  assert.equal(merleg(DOCS, KAT).alairt, 0);
  assert.equal(validateMegorzes(DOCS, KAT).filter((i) => i.severity === "error").length, 0);
});
