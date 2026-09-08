/**
 * A PILOT ELŐFELTÉTELEI ÉS A NAPLÓ VÉGE — a 16. lépés.
 *
 * A tesztek középpontjában egyetlen állítás áll: a lenyomatlánc a MÚLTAT köti
 * meg, a VÉGÉT nem. Ez nem elméleti rés — az első teszt megmutatja, hogy a
 * levágott végű napló a rendszer MINDKÉT épségellenőrzésén hibátlanul átmegy,
 * és a `SecureCaseStore` a csonkolt archívumot boldogan felolvassa.
 *
 * A többi teszt azt védi, hogy ez ne maradjon így: a horgony megnevezi, mi
 * hiányzik, a hiánya pedig nem „rendben”, hanem „nem tudjuk”.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

import { append, verifyChain } from "../core/journal/journal.ts";
import type { Horgony, JournalEntry } from "../core/journal/types.ts";
import {
  FileHorgonyTar, adatvesztesMerleg, epseg, horgonyBol,
} from "../core/pilot/horgony.ts";
import {
  elofeltetelek, indithato, loadPilot, merleg, validatePilot, zarasAllas,
  type Pilot,
} from "../core/pilot/felkeszultseg.ts";
import { bizonyitekok } from "../core/ett/dosszie.ts";
import { rendszerAllapot } from "../core/ett/allapot.ts";
import type { Bizonyitek } from "../core/ett/dosszie.ts";
import { memorySink } from "../core/log/types.ts";
import {
  SecureCaseStore, verifySealedChain, type KeyStore, type Who,
} from "../core/store/biztonsagos.ts";
import { FileArchive } from "../core/store/fajl.ts";
import type { CareRelation } from "../core/store/hozzaferes.ts";
import type { KeyRef } from "../core/crypto/types.ts";
import type { Value } from "../core/types.ts";

const NOW = "2026-09-07T10:00:00.000Z";
const now = () => NOW;
const T = (m: number) =>
  new Date(Date.parse("2026-09-07T08:00:00.000Z") + m * 60000).toISOString();
const val = (v: unknown, t: string): Value =>
  ({ value: v, t, provenance: "clinician", confidence: "measured" });

/** Determinisztikus, tíz bejegyzéses vajúdási napló. */
function naplo(n = 10): JournalEntry[] {
  let log: JournalEntry[] = [];
  for (let i = 0; i < n; i++) {
    log = append(log, {
      caseId: "eset-1", actor: "dr. Minta Anna", op: "write", at: T(i),
      variableId: "labour.cervix", value: val(i + 1, T(i)), entryId: `id-${i}`,
    });
  }
  return log;
}

/* ══ 1. A HIBA, AMIT EZ A LÉPÉS TALÁLT ═════════════════════════════════ */

test("A LEVÁGOTT NAPLÓ ÉP LÁNCNAK LÁTSZIK — ezt a lánc nem tudja megfogni", () => {
  const teljes = naplo(10);
  const csonka = teljes.slice(0, 5);   // az utolsó öt bejegyzés eltűnt

  const c = verifyChain(csonka);
  assert.equal(c.ok, true,
    "a csonkolt napló ÁTMEGY a láncellenőrzésen — ez a 16. lépés felfedezése");
  assert.equal(c.kind, "ok");
  assert.match(c.why, /5 bejegyzés/,
    "sőt: magabiztosan meg is mondja, hány bejegyzés van, mintha az lenne mind");

  // És a KÖZBÜLSŐ vesztést ugyanez a függvény HELYESEN fogja meg. A különbség
  // nem a megvalósításban van: a naplóban nincs adat arról, hol ért véget.
  const lyukas = [...teljes.slice(0, 4), ...teljes.slice(5)];
  assert.equal(verifyChain(lyukas).ok, false);
  assert.equal(verifyChain(lyukas).kind, "gap");
});

test("a horgony megnevezi, amit a lánc nem lát: hány bejegyzés hiányzik", () => {
  const teljes = naplo(10);
  const h = horgonyBol(teljes, NOW)!;
  const e = epseg(teljes.slice(0, 5), h);

  assert.equal(e.allapot, "levagott");
  assert.equal(e.bizonyitott, false);
  assert.equal(e.hianyzo, 5);
  assert.equal(e.lanc.ok, true, "a lánc közben végig ép — épp ez a lényeg");
  assert.match(e.miert, /LEVÁGOTT VÉG/);
  assert.match(e.miert, /5 bejegyzés/);
});

/* ══ 2. A HIÁNYZÓ HORGONY NEM „RENDBEN" ════════════════════════════════ */

test("horgony nélkül a rendszer nem azt mondja, hogy ép, hanem hogy NEM TUDJA", () => {
  const e = epseg(naplo(10), null);
  assert.equal(e.allapot, "horgonyNelkul");
  assert.equal(e.lanc.ok, true);
  assert.equal(e.bizonyitott, false,
    "az ép lánc NEM bizonyítja, hogy nem veszett adat");
  assert.match(e.miert, /NEM TUDJA/);
});

test("a teljes napló a horgonyával: ez az EGYETLEN bizonyított épség", () => {
  const log = naplo(10);
  const e = epseg(log, horgonyBol(log, NOW));
  assert.equal(e.allapot, "ep");
  assert.equal(e.bizonyitott, true);
  assert.equal(e.hianyzo, 0);
});

test("a horgonyon TÚLNYÚLÓ napló nem hiba — az írás és a horgony között idő telik", () => {
  const log = naplo(10);
  const h = horgonyBol(log.slice(0, 7), NOW)!;
  const e = epseg(log, h);
  assert.equal(e.allapot, "elorefut");
  assert.equal(e.bizonyitott, true);
  assert.equal(e.horgonyozatlan, 3);
});

test("az ELÁGAZÁS: két önmagában ép lánc, de nem ugyanaz az eset története", () => {
  const a = naplo(10);
  // Másik ág: ugyanaz a hossz, más tartalom — a lenyomatok eltérnek.
  let b: JournalEntry[] = [];
  for (let i = 0; i < 10; i++) {
    b = append(b, {
      caseId: "eset-1", actor: "dr. Más Béla", op: "write", at: T(i),
      variableId: "labour.cervix", value: val(i + 1, T(i)), entryId: `mas-${i}`,
    });
  }
  const e = epseg(b, horgonyBol(a, NOW));
  assert.equal(e.allapot, "elagazott");
  assert.equal(e.bizonyitott, false);
  assert.equal(verifyChain(b).ok, true, "a másik ág önmagában hibátlan");
});

test("üres napló élő horgonnyal: az egész eset eltűnt, nem „üres eset” volt", () => {
  const e = epseg([], horgonyBol(naplo(10), NOW));
  assert.equal(e.allapot, "levagott");
  assert.equal(e.hianyzo, 10);
});

/* ══ 3. „A RENDSZER NEM VESZÍTETT ADATOT" ══════════════════════════════ */

test("egyetlen horgony nélküli eset elveszi az állítást", () => {
  const log = naplo(5);
  const m = adatvesztesMerleg([
    { caseId: "a", epseg: epseg(log, horgonyBol(log, NOW)) },
    { caseId: "b", epseg: epseg(log, horgonyBol(log, NOW)) },
    { caseId: "c", epseg: epseg(log, null) },
  ]);
  assert.equal(m.kimondhato, false);
  assert.equal(m.horgonyNelkul, 1);
  assert.equal(m.bizonyitottanEp, 2);
  assert.match(m.miert, /épp az egyik lehetett a csonkult/);
});

test("nulla megvizsgált eset NEM „nem veszett adat”, hanem „nem mértünk”", () => {
  const m = adatvesztesMerleg([]);
  assert.equal(m.kimondhato, false);
  assert.match(m.miert, /nem mértünk/);
});

test("mind horgonnyal, mind ép: ekkor — és csak ekkor — mondható ki", () => {
  const log = naplo(5);
  const m = adatvesztesMerleg([1, 2, 3].map((i) => ({
    caseId: `e${i}`, epseg: epseg(log, horgonyBol(log, NOW)),
  })));
  assert.equal(m.kimondhato, true);
  assert.equal(m.hianyzoBejegyzes, 0);
});

/* ══ 4. A HORGONYTÁR ═══════════════════════════════════════════════════ */

test("a horgony CSAK ELŐRE mehet — a visszafelé írás elfedné a vesztést", () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-horgony-"));
  const tar = new FileHorgonyTar(dir);
  const log = naplo(10);
  tar.write(horgonyBol(log, NOW)!);
  assert.equal(tar.read("eset-1")!.seq, 10);

  assert.throws(() => tar.write(horgonyBol(log.slice(0, 5), NOW)!),
    /VISSZAFELÉ/,
    "a rövidebb naplóhoz igazított horgony pont azt fedné el, amit mutatnia kell");
  assert.equal(tar.read("eset-1")!.seq, 10, "a régi horgony megmaradt");
});

test("ismeretlen esethez nincs horgony — és ez nem hiba, hanem hiány", () => {
  const tar = new FileHorgonyTar(mkdtempSync(join(tmpdir(), "ogdoc-horgony-")));
  assert.equal(tar.read("nincs-ilyen"), null);
  assert.equal(epseg(naplo(3), tar.read("nincs-ilyen")).allapot, "horgonyNelkul");
});

test("útvonal-karakter az esetazonosítóban: a horgonytár is elutasítja", () => {
  const tar = new FileHorgonyTar(mkdtempSync(join(tmpdir(), "ogdoc-horgony-")));
  assert.throws(() => tar.read("../kifele"), /Érvénytelen esetazonosító/);
});

/* ══ 5. A TÁROLÓ: A CSONKOLÁS VÉGIG CSENDES MARADNA ════════════════════ */

function keyStore(): KeyStore {
  const keys = new Map<string, { dek: Buffer | null; key: KeyRef }>();
  return {
    dek(caseId) {
      if (!keys.has(caseId)) {
        keys.set(caseId, { dek: randomBytes(32), key: {
          keyId: `dek.${caseId}`, kekId: "kek.teszt", state: "active", createdAt: NOW } });
      }
      return keys.get(caseId)!;
    },
  };
}
const REL: CareRelation[] = [{
  actor: "dr. Minta Anna", caseId: "eset-1", from: "2026-09-01T00:00:00.000Z",
  until: null, why: "szülőszobai felvétel",
}];
const ANNA: Who = { actor: "dr. Minta Anna", roles: ["clinician"] };

/** Az archívumfájl utolsó `n` sorának letörlése — a csonkolt fájl. */
function csonkol(dir: string, caseId: string, n: number): void {
  const f = join(dir, `${caseId}.jsonl`);
  const sorok = readFileSync(f, "utf8").split("\n").filter((l) => l.trim());
  writeFileSync(f, sorok.slice(0, sorok.length - n).join("\n") + "\n", "utf8");
}

async function tolt(s: SecureCaseStore, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    const w = await s.write("eset-1", ANNA, [
      { op: "write", at: T(i), variableId: "labour.cervix", value: val(i + 1, T(i)) },
    ]);
    assert.equal(w.ok, true);
  }
}

test("HORGONY NÉLKÜL a csonkolt archívum HIBÁTLANUL felolvasható", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-pilot-"));
  const keys = keyStore();
  const s = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL, now });
  await tolt(s, 8);

  csonkol(dir, "eset-1", 3);

  // A REJTJELEZETT LÁNC IS ÁTENGEDI. Nem a megvalósítás hibája: a fájlban
  // nincs adat arról, hogy nyolc bejegyzés volt.
  const maradt = readFileSync(join(dir, "eset-1.jsonl"), "utf8")
    .split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
  assert.equal(verifySealedChain(maradt, "eset-1").ok, true);

  const s2 = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL, now });
  const r = await s2.read("eset-1", ANNA);
  assert.equal(r.ok, true, "a rendszer megnyugtatóan felolvassa a csonkát");
  assert.equal(r.ok && r.entries, 5, "három vajúdási bejegyzés eltűnt, és NEM SZÓLT SEMMI");
});

test("HORGONNYAL ugyanez a csonkolás megnevezett adatvesztés lesz", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-pilot-"));
  const hdir = mkdtempSync(join(tmpdir(), "ogdoc-horgony-"));
  const keys = keyStore();
  const horgony = new FileHorgonyTar(hdir);
  const s = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL,
    now, horgony });
  await tolt(s, 8);
  assert.equal(horgony.read("eset-1")!.seq, 8);

  csonkol(dir, "eset-1", 3);

  const s2 = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL,
    now, horgony });
  const r = await s2.read("eset-1", ANNA);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.kind, "corrupt");
  assert.match(r.ok === false ? r.why : "", /3 bejegyzés HIÁNYZIK/);
  assert.match(r.ok === false ? r.why : "", /A lánc maga\s+hiánytalan/);
});

test("a horgony ÍRÁS UTÁN áll be, és a sértetlen esetet nem akadályozza", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-pilot-"));
  const hdir = mkdtempSync(join(tmpdir(), "ogdoc-horgony-"));
  const keys = keyStore();
  const horgony = new FileHorgonyTar(hdir);
  const s = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL,
    now, horgony });
  await tolt(s, 4);
  const r = await s.read("eset-1", ANNA);
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.entries, 4);
});

test("a sikertelen horgonyírás NEM buktatja el a már tartós írást — de kiabál", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-pilot-"));
  const sink = memorySink();
  const rossz = {
    read: () => null,
    write: () => { throw new Error("a horgonykötet nem írható"); },
  };
  const s = new SecureCaseStore({
    archive: new FileArchive(dir), keys: keyStore(), sink, relations: REL,
    now, horgony: rossz });
  const w = await s.write("eset-1", ANNA, [
    { op: "write", at: T(0), variableId: "labour.cervix", value: val(3, T(0)) }]);

  assert.equal(w.ok, true, "az adat MÁR tartós — visszamondani hazugság volna");
  const hiba = sink.events.filter((e) =>
    e.kind === "op" && e.level === "error" && e.where === "store.horgony");
  assert.equal(hiba.length, 1, "de az elveszett BIZONYÍTHATÓSÁGOT ki kell mondani");
});

/* ══ 6. A PILOT KAPUJA ═════════════════════════════════════════════════ */

const P = () => loadPilot("registry/pilot/pilot.json");

/** Bizonyítékbázis, amiben megnevezett kulcsok állnak vagy nem állnak. */
function biz(all: boolean, kivetel: string[] = []): Bizonyitek[] {
  const kulcsok = bizonyitekok(rendszerAllapot(".")).map((b) => b.kulcs);
  return kulcsok.map((k) => ({
    kulcs: k, mit: k, megvan: kivetel.includes(k) ? !all : all,
    ertek: kivetel.includes(k) ? (all ? "hiányzik" : "megvan") : (all ? "megvan" : "hiányzik"),
    miert: "teszt",
  }));
}

test("MA a pilot nem indulhat, és mind a hét előfeltétel megnevezve hiányzik", () => {
  const p = P();
  const b = bizonyitekok(rendszerAllapot("."));
  const a = elofeltetelek(p, b);
  const i = indithato(p, a);
  assert.equal(i.indithato, false);
  assert.equal(a.length, 7);
  assert.equal(a.filter((x) => x.kimondatlan).length, 2);
  // A hiányzó bizonyítékok MEGNEVEZVE állnak — nem egy „nem kész” jelzőben.
  for (const x of a.filter((y) => !y.all)) {
    assert.ok(x.hianyzik.length > 0, `${x.id}: névtelen akadály`);
  }
  assert.equal(i.szervezeti.length, 3, "osztály, vezető, kezdés — mind emberre vár");
});

test("A KAPU CSAK BIZONYÍTÉKBÓL NYÍLIK — a nyilvántartásban nincs „kész” mező", () => {
  const p = P();
  const teljes: Pilot = { ...p, osztaly: "II. sz. Szülészet", vezeto: "dr. N. N.",
                          kezdet: "2026-11-02" };
  const a = elofeltetelek(teljes, biz(true));
  assert.equal(indithato(teljes, a).indithato, true);

  // És egyetlen bizonyíték kiesése bezárja — a hitelesítésé is, ami a
  // TERVBEN FEL SEM SZEREPEL.
  const b2 = elofeltetelek(teljes, biz(true, ["hitelesites"]));
  const i2 = indithato(teljes, b2);
  assert.equal(i2.indithato, false);
  assert.equal(i2.akadalyok.length, 1);
  assert.match(i2.akadalyok[0], /\[kimondatlan\]/);
});

test("a szervezeti döntés hiánya önmagában is zárva tartja a kaput", () => {
  const p = P();
  const a = elofeltetelek(p, biz(true));
  const i = indithato(p, a);
  assert.equal(i.indithato, false);
  assert.equal(i.akadalyok.length, 0, "műszakilag minden áll");
  assert.equal(i.szervezeti.length, 3);
  assert.match(i.miert, /szervezeti döntés hiányzik/);
});

test("elgépelt bizonyítékkulcs HIBA, nem „még nem teljesült előfeltétel”", () => {
  const p = P();
  const rossz: Pilot = { ...p, elofeltetelek: [
    ...p.elofeltetelek,
    { id: "elgepelt", lepes: 1, megnevezes: "Elgépelt", bizonyitek: ["auditnaplo-x"],
      miert: "teszt" }] };
  const b = bizonyitekok(rendszerAllapot("."));
  const a = elofeltetelek(rossz, b);
  const hibak = validatePilot(rossz, b, a, zarasAllas(rossz, a))
    .filter((x) => x.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /elgépelt hivatkozás/);
  assert.equal(a.find((x) => x.id === "elgepelt")!.allapot, "ismeretlenBizonyitek");
});

/* ══ 7. A HÁROM ZÁRÁSI KRITÉRIUM ═══════════════════════════════════════ */

test("a három zárási kritérium MA: egy mérhető, egy nevező nélkül, egy elérhetetlen", () => {
  const p = P();
  const z = zarasAllas(p, elofeltetelek(p, bizonyitekok(rendszerAllapot("."))));
  assert.deepEqual(z.map((x) => [x.id, x.allapot]), [
    ["nincs-adatvesztes", "merheto"],
    ["nem-kerultek-ki", "nevezoHianyzik"],
    ["egy-dokumentalt-eset", "elerhetetlen"],
  ]);
});

test("„a rendszer mondott valamit” ELÉRHETETLEN, amíg egy riasztás sem kiadható", () => {
  const p = P();
  const z = zarasAllas(p, elofeltetelek(p, biz(true, ["riasztasi-rend"])));
  const k = z.find((x) => x.id === "egy-dokumentalt-eset")!;
  assert.equal(k.allapot, "elerhetetlen");
  assert.match(k.miert, /nem csak teljesítetlen/);
  assert.match(k.miert, /meg sem\s+szólal/);
});

test("horgony nélkül az adatvesztés-kritérium NEM elérhetetlen, hanem MÉRHETETLEN", () => {
  const p = P();
  const z = zarasAllas(p, elofeltetelek(p, biz(true, ["naplo-horgony"])));
  const k = z.find((x) => x.id === "nincs-adatvesztes")!;
  assert.equal(k.allapot, "meroeszkozNelkul");
  assert.match(k.miert, /magától „teljesült”-nek fog látszani/);
});

test("a nem mérhető kritérium FIGYELMEZTETÉST ad — nem csendben „teljesül”", () => {
  const p = P();
  const b = bizonyitekok(rendszerAllapot("."));
  const a = elofeltetelek(p, b);
  const z = zarasAllas(p, a);
  const w = validatePilot(p, b, a, z).filter((x) => x.id.startsWith("pilot.zaras."));
  assert.equal(w.length, 2, "kettő nem mérhető, és mindkettő kimondva");
  for (const x of w) assert.match(x.message, /A hiányzó mérés nem „teljesült”/);
});

/* ══ 8. A MÉRLEG SORAIBÓL SZÁMOL, NEM BEGÉPELT SZÁMBÓL ═════════════════ */

test("a mérleg minden száma a sorokból derivált", () => {
  const p = P();
  const a = elofeltetelek(p, bizonyitekok(rendszerAllapot(".")));
  const z = zarasAllas(p, a);
  const m = merleg(a, z, indithato(p, a));
  assert.equal(m.elofeltetel, a.length);
  assert.equal(m.allo, a.filter((x) => x.all).length);
  assert.equal(m.tervbeli + m.kimondatlan, m.elofeltetel);
  assert.equal(m.tervbeli, 5, "a terv öt előfeltételt sorol");
  assert.equal(m.kimondatlan, 2, "kettőt viszont a rendszer saját kapui adnak hozzá");
  assert.equal(m.zarasi, z.length);
  assert.equal(m.merheto, z.filter((x) => x.merheto).length);
  assert.equal(m.indithato, false);
});
