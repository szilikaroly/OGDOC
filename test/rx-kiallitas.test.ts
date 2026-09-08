/**
 * A 32. modul — a recept elhagyja a rendszert, és nem hívható vissza.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import {
  gyseRendelheto, kiallithato, merleg, validateFeliras, visszavon,
} from "../core/rx/kiallitas.ts";
import type { GyseKeres, Kiallitas } from "../core/rx/kiallitas.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, "..", "registry", "gyogyszerek");
const DRUGS = readdirSync(DIR).filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")) as Array<{
    id: string; pregnancy?: unknown; lactation?: unknown }>);

const JO = (x: Partial<Kiallitas> = {}): Kiallitas => ({
  keszitmeny: "rx.paracetamol", klinikus: "dr. Demó", indikaciotEllenorizte: true,
  allergia: "nincs", interakcio: "teljesListaval", interakcioTalalat: false,
  terhesseg: "nemTerhes", vanTerhessegiBesorolas: true, ...x,
});

test("a teljes ellenőrzés után kiállítható", () => {
  const k = kiallithato(JO());
  assert.equal(k.kiallithato, true);
  assert.equal(k.allapot, "kiallithato");
});

/* ── AZ ÖT ELLENŐRZÉS ────────────────────────────────────────────────── */

test("kiállítani MEGNEVEZETT klinikus tud", () => {
  assert.equal(kiallithato(JO({ klinikus: "  " })).allapot, "nincsKlinikus");
});

test("a korábbi döntés nem bizonyítja a mostanit", () => {
  assert.equal(kiallithato(JO({ indikaciotEllenorizte: false })).allapot,
    "indikacioEllenorizetlen");
});

test("A HIÁNYZÓ ALLERGIAADAT NEM „NINCS ALLERGIÁJA” — és nem is vállalható", () => {
  const k = kiallithato(JO({ allergia: "nemKerdeztek" }));
  assert.equal(k.allapot, "allergiaNemKerdezve");
  assert.equal(k.vallalhato, false, "meg lehet kérdezni, tehát nem kockázatvállalás kérdése");
});

test("„allergiás, de nem tudjuk, ütközik-e” nem nemleges válasz", () => {
  const nyitva = kiallithato(JO({ allergia: "van" }));
  assert.equal(nyitva.allapot, "allergiaUtkozik");
  assert.equal(nyitva.vallalhato, false, "a nyitva hagyott kérdés nem vállalható kockázat");

  const utkozik = kiallithato(JO({ allergia: "van", allergiaUtkozik: true }));
  assert.equal(utkozik.vallalhato, true, "az ISMERT ütközés viszont vállalható lehet");

  assert.equal(kiallithato(JO({ allergia: "van", allergiaUtkozik: false })).kiallithato, true);
});

test("AZ INTERAKCIÓ EREDMÉNYE NEM „TISZTA”, HANEM „NEM TUDJUK”", () => {
  const k = kiallithato(JO({ interakcio: "nemTudjuk" }));
  assert.equal(k.allapot, "interakcioNemTudjuk");
  assert.match(k.miert, /hamis biztonságot ad/);
  assert.equal(k.vallalhato, true, "a teljes lista beszerzése nem mindig lehetséges");
});

test("a beteg elmondásából származó lista HIÁNYOS lehet — és ez a találatnál is számít", () => {
  const k = kiallithato(JO({ interakcio: "csakElmondasAlapjan", interakcioTalalat: true }));
  assert.equal(k.allapot, "interakcioTalalat");
  assert.match(k.miert, /a hiánya nem lenne bizonyíték/);
});

test("ISMERETLEN TERHESSÉGI ÁLLAPOTNÁL NEM a „nem terhes” ág", () => {
  const k = kiallithato(JO({ terhesseg: "ismeretlen" }));
  assert.equal(k.allapot, "terhessegIsmeretlen");
  assert.equal(k.vallalhato, false);
  assert.match(k.miert, /itt a terhesség nem\s+mellékszempont/);
});

test("teratogén szer fogamzóképes betegnek: a fogamzásgátlás a FELÍRÁS RÉSZE", () => {
  const k = kiallithato(JO({ teratogen: true, fogamzokepes: true }));
  assert.equal(k.allapot, "fogamzasgatlasMegbeszeletlen");
  assert.match(k.miert, /a beteg a patikában\s+nem fogja megtudni/);
  assert.equal(kiallithato(JO({ teratogen: true, fogamzokepes: true,
    fogamzasgatlastMegbeszelte: true })).kiallithato, true);
});

test("vesefüggő dózis ismeretlen vesefunkcióval: meg lehet mérni, tehát kapu", () => {
  const k = kiallithato(JO({ dozisVesefuggo: true }));
  assert.equal(k.allapot, "vesefunkcioIsmeretlen");
  assert.equal(k.vallalhato, false);
});

test("a VÁLLALT KOCKÁZAT megnevezett, és csak ott nyit, ahol nyithat", () => {
  const jo = kiallithato(JO({ interakcio: "nemTudjuk",
    vallaltKockazat: { kapu: "interakcioNemTudjuk", miert: "sürgős, egyszeri adag",
      ki: "dr. Demó" } }));
  assert.equal(jo.kiallithato, true);
  assert.match(jo.miert, /VÁLLALT KOCKÁZATTAL/);

  // Rossz kapura szóló indoklás nem nyit.
  const rossz = kiallithato(JO({ interakcio: "nemTudjuk",
    vallaltKockazat: { kapu: "allergiaNemKerdezve", miert: "x", ki: "dr. Demó" } }));
  assert.equal(rossz.kiallithato, false);

  // Adathiányt nem lehet vállalni.
  const nem = kiallithato(JO({ allergia: "nemKerdeztek",
    vallaltKockazat: { kapu: "allergiaNemKerdezve", miert: "sürgős", ki: "dr. Demó" } }));
  assert.equal(nem.kiallithato, false, "amit meg lehet kérdezni, azt meg kell kérdezni");
});

/* ── A VISSZAVONÁS ───────────────────────────────────────────────────── */

test("A VISSZAVONÁS NEM VISSZACSINÁLÁS", () => {
  assert.equal(visszavon(false, null).allapot, "kivaltasElott");
  assert.equal(visszavon(false, null).betegetErtesiteni, false);

  const kivaltotta = visszavon(true, null);
  assert.equal(kivaltotta.allapot, "kivaltotta");
  assert.equal(kivaltotta.betegetErtesiteni, true);

  const beszedte = visszavon(true, true);
  assert.equal(beszedte.allapot, "beszedte");
  assert.match(beszedte.miert, /nem ugyanaz, mintha ki sem állították/);
});

test("„nem tudjuk, kiváltotta-e” NEM „nem váltotta ki”", () => {
  const v = visszavon(null, null);
  assert.equal(v.allapot, "ismeretlen");
  assert.equal(v.betegetErtesiteni, true);
  assert.match(v.miert, /a gyógyszer ott lehet/);
});

/* ── GYSE ────────────────────────────────────────────────────────────── */

const MOST = "2026-09-08T00:00:00Z";
const GYSE = (x: Partial<GyseKeres> = {}): GyseKeres => ({
  eszkozcsoport: "gyógyszálló matrac", szuksegesSzakvizsgak: [],
  javasolta: { ki: "dr. Demó Rehab", mikor: "2026-06-01", ervenyesEddig: "2027-06-01" },
  ...x,
});

test("A JAVASLAT NEM RENDELÉS — de rendelés sem lesz javaslat nélkül", () => {
  const n = gyseRendelheto(GYSE({ javasolta: undefined }), MOST);
  assert.equal(n.allapot, "nincsJavaslat");
  assert.match(n.miert, /A\s+JAVASLAT NEM RENDELÉS/);
});

test("a javaslat LEJÁR — mert az állapot változik", () => {
  const l = gyseRendelheto(GYSE({ javasolta: { ki: "dr. D", mikor: "2024-01-01",
    ervenyesEddig: "2025-01-01" } }), MOST);
  assert.equal(l.allapot, "javaslatLejart");
  assert.match(l.miert, /nem a\s+mostani betegről szól/);
});

test("a szakvizsgához kötöttség KAPU, nem figyelmeztetés", () => {
  const k = gyseRendelheto(GYSE({ szuksegesSzakvizsgak: ["rehabilitáció"],
    kiallitoSzakvizsga: "szülészet-nőgyógyászat" }), MOST);
  assert.equal(k.allapot, "szakvizsgaHianyzik");
  assert.match(k.miert, /utólag visszakövetelhető/);
});

test("A KIHORDÁSI IDŐT ITT MONDJUK MEG, NEM A PATIKÁBAN", () => {
  const k = gyseRendelheto(GYSE({ utolsoKiadas: { mikor: "2026-06-01",
    kihordasHonap: 12 } }), MOST);
  assert.equal(k.allapot, "kihordasAlatt");
  assert.match(k.miert, /hátra van\s+9 hónap/);
  assert.match(k.miert, /nem a patikában/);

  const letelt = gyseRendelheto(GYSE({ utolsoKiadas: { mikor: "2024-06-01",
    kihordasHonap: 12 } }), MOST);
  assert.equal(letelt.rendelheto, true);
});

test("a mennyiségi korlát kimerülése kapu", () => {
  const k = gyseRendelheto(GYSE({ mennyisegiKorlat: { max: 4, kiadva: 4, idoszak: "év" } }), MOST);
  assert.equal(k.allapot, "mennyisegiKorlat");
});

/* ── A TÖRZS ÁLLAPOTA ────────────────────────────────────────────────── */

test("A SZOPTATÁS VÉGIG KI VAN TÖLTVE, A TERHESSÉG NINCS", () => {
  const m = merleg(DRUGS);
  assert.equal(m.szoptatasiAdattal, m.hatoanyag, "mind a 23-nak van szoptatási adata");
  assert.equal(m.terhessegiBesorolassal, 0,
    "és egyiknek sincs terhességi állásfoglalása — egy szülészeti rendszerben");

  const w = validateFeliras(DRUGS);
  assert.equal(w.length, 1);
  assert.match(w[0].message, /a legfeltűnőbb hiány/);
});

test("besorolás nélkül a kiállítás megnevezett kockázatvállalást kíván", () => {
  const k = kiallithato(JO({ vanTerhessegiBesorolas: false }));
  assert.equal(k.allapot, "nincsTerhessegiBesorolas");
  assert.equal(k.vallalhato, true);
  assert.match(k.miert, /A rendszer nem találgat/);
});
