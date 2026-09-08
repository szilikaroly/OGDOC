/**
 * AZ EESZT-CSATLAKOZÁS DOSSZIÉJA — a 14. lépés gépi fele.
 *
 * A tesztek öt szabályt védenek:
 *
 *   1. minden mezőről kiderül, KI tudja megválaszolni;
 *   2. a „rendszerből válaszolható” mező bizonyíték nélkül építési hiba;
 *   3. a beadvány ÁLLÍTÁSAI megnevezve maradnak, akkor is, ha nem gépiek;
 *   4. a szintetikus kapu FORDÍTVA olvasandó, és éles csatlakozást ZÁR;
 *   5. az EESZT kifelé ír — ezért a hitelesítés hiánya itt más súlyú.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { rendszerAllapot } from "../core/ett/allapot.ts";
import { bizonyitekok } from "../core/ett/dosszie.ts";
import type { Bizonyitek } from "../core/ett/dosszie.ts";
import {
  csatlakozhato, kapuAllas, loadCsatlakozas, merleg, mezoAllas, validateCsatlakozas,
} from "../core/eeszt/csatlakozas.ts";
import type { Csatlakozas } from "../core/eeszt/csatlakozas.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const GYOKER = join(HERE, "..");
const CS = loadCsatlakozas(join(GYOKER, "registry", "eeszt", "csatlakozas.json"));
const BIZ = bizonyitekok(rendszerAllapot(GYOKER));
const masol = (): Csatlakozas => JSON.parse(JSON.stringify(CS));

/* ── 1. ÖT ŰRLAP, TIZENNYOLC MEZŐ ───────────────────────────────────── */

test("az öt űrlap és a tizennyolc mező a sablonokból jön", () => {
  assert.equal(CS.urlapok.length, 5);
  const m = merleg(CS, BIZ);
  assert.equal(m.mezo, 18);
  assert.equal(m.urlap, 5);
  // A regisztrációs lap melléklete a titoktartási nyilatkozat.
  const reg = CS.urlapok.find((u) => u.id === "eeszt.reg")!;
  assert.deepEqual(reg.melleklet, ["eeszt.titok"]);
});

test("MINDEN MEZŐRŐL KIDERÜL, KI TUDJA MEGVÁLASZOLNI", () => {
  const m = merleg(CS, BIZ);
  assert.equal(m.rendszerbol + m.szervezeti + m.uzemeltetesi, m.mezo);
  assert.equal(m.rendszerbol, 3, "ellátási típusok, programnyelv, operációs rendszer");
  assert.equal(m.uzemeltetesi, 1, "a fejlesztés helyének fix IP-címe");
});

test("a fix IP-cím ÜZEMELTETÉSI kérdés — a rendszer nem tippel", () => {
  const ip = mezoAllas(CS, BIZ).find((x) => x.mezo === "fejl.ip")!;
  assert.equal(ip.allapot, "uzemeltetesi");
  assert.equal(ip.ertek, null);
  assert.match(ip.miert, /nem is szabad tippelnie/);
});

test("amit a rendszer önmagából megválaszol, azt meg is válaszolja", () => {
  const nyelv = mezoAllas(CS, BIZ).find((x) => x.mezo === "fejl.nyelv")!;
  assert.equal(nyelv.allapot, "rendszerbol");
  assert.match(nyelv.ertek!, /TypeScript/);
  assert.match(nyelv.ertek!, /Linux/);
});

/* ── 2. A BIZONYÍTÉK NÉLKÜLI RENDSZERMEZŐ HIBA ──────────────────────── */

test("A „RENDSZERBŐL VÁLASZOLHATÓ” MEZŐ BIZONYÍTÉK NÉLKÜL ÉPÍTÉSI HIBA", () => {
  const cs = masol();
  delete cs.urlapok[0].mezok.find((m) => m.id === "fejl.nyelv")!.bizonyitek;
  const hibak = validateCsatlakozas(cs, BIZ).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /senki nem venné észre, ha elavul/.test(h.message)));
});

test("az ismeretlen bizonyítékkulcs építési hiba — mezőnél és kapunál is", () => {
  const cs = masol();
  cs.urlapok[0].mezok[5].bizonyitek = "nincs-ilyen";
  cs.kapuk[0].bizonyitek = "ez-sincs";
  const hibak = validateCsatlakozas(cs, BIZ).filter((i) => i.severity === "error");
  // Három hiba: az ismeretlen kulcs a mezőnél, ugyanaz a kapunál — és a mező
  // emiatt `hianyzoBizonyitek` állapotba kerül, ami külön is hiba. Ez nem
  // duplikátum: az egyik a HIVATKOZÁS elavultságát mondja ki, a másik azt,
  // hogy emiatt a beadványba kézzel írt adat kerülne.
  assert.equal(hibak.length, 3);
  assert.ok(hibak.some((h) => /ismeretlen bizonyítékkulcs a\(z\)/.test(h.message)));
  assert.ok(hibak.some((h) => /ismeretlen bizonyítékkulcs a kapunál/.test(h.message)));
  assert.ok(hibak.some((h) => /kézzel beírt adatot tartalmazna/.test(h.message)));
});

test("az aláíró nélküli űrlap nem beadvány", () => {
  const cs = masol();
  cs.urlapok[2].alairo = [];
  const hibak = validateCsatlakozas(cs, BIZ).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /nem beadvány/);
});

/* ── 3. AZ ÁLLÍTÁSOK MEGNEVEZVE MARADNAK ────────────────────────────── */

test("A TITOKTARTÁSI NYILATKOZAT KÉT ÁLLÍTÁSA MEGNEVEZETT KOCKÁZAT", () => {
  const titok = CS.urlapok.find((u) => u.id === "eeszt.titok")!;
  const ids = (titok.mitAllit ?? []).map((a) => a.id);
  assert.ok(ids.includes("titok.hatarido-nelkul"));
  assert.ok(ids.includes("titok.mentesites"));

  const lejarat = titok.mitAllit!.find((a) => a.id === "titok.hatarido-nelkul")!;
  assert.match(lejarat.allitas, /LEJÁRATI HATÁRIDŐ NÉLKÜL/);
  // A rendszer minden más kötelezettsége lejár — ez az egyetlen, ami nem.
  assert.match(lejarat.megjegyzes!, /EGYETLEN/);

  const mentesites = titok.mitAllit!.find((a) => a.id === "titok.mentesites")!;
  assert.match(mentesites.megjegyzes!, /MIELŐTT aláírja/);
});

test("a bizonyíték nélküli állítás figyelmeztetés, nem hiba — de megnevezve", () => {
  const w = validateCsatlakozas(CS, BIZ)
    .filter((i) => /nincs gépi bizonyíték/.test(i.message));
  assert.equal(w.length, 4);
  assert.ok(w.every((i) => i.severity === "warning"));
  assert.equal(merleg(CS, BIZ).bizonyitatlanAllitas, 4);
});

test("a személyes adatot kérő űrlap megnevezi a kibocsátói szabályzatot", () => {
  for (const id of ["eeszt.token", "eeszt.tanusitvany"]) {
    const u = CS.urlapok.find((x) => x.id === id)!;
    assert.ok(u.mezok.some((m) => m.szemelyesAdat), `${id}: személyes adat`);
    assert.ok(u.szabalyzat, `${id}: nincs megnevezve a szabályzat`);
    assert.equal(u.visszavonasig, true, "a megbízás visszavonásig érvényes");
  }
  const cs = masol();
  delete cs.urlapok.find((u) => u.id === "eeszt.token")!.szabalyzat;
  const w = validateCsatlakozas(cs, BIZ)
    .filter((i) => /melyik szabályzat szerint/.test(i.message));
  assert.equal(w.length, 1);
});

/* ── 4. A SZINTETIKUS KAPU FORDÍTVA OLVASANDÓ ───────────────────────── */

test("A SZINTETIKUS KAPU MEGLÉTE NEM KÉPESSÉG, HANEM BEISMERÉS", () => {
  const b = BIZ.find((x) => x.kulcs === "szintetikus-kapu")!;
  assert.equal(b.megvan, true, "a kapu ott áll");
  assert.match(b.ertek, /valódi betegadaton nem futhat/);
  assert.match(b.miert, /nem képesség, hanem beismerés/);
});

test("ÉLES CSATLAKOZÁS NEM LEHETSÉGES, amíg a szintetikus kapu áll", () => {
  const c = csatlakozhato(kapuAllas(CS, BIZ));
  assert.equal(c.csatlakozhato, false);
  assert.match(c.miert, /a rendszer saját kimondása/);
  assert.match(c.miert, /országos nyilvántartásba sem küldhet/);
});

test("a szintetikus kapu eltűnése ÖNMAGÁBAN nem nyit csatlakozást", () => {
  // Ha valaki kiveszi a kaput, a többi kapu attól még zárva marad. A
  // hitelesítés időközben elkészült, ezért most az ÁGAZATI AZONOSÍTÓ az, ami
  // tart — de a szabály ugyanaz: a kapu eltávolítása nem bizonyíték.
  const csonka: Bizonyitek[] = BIZ.map((b) =>
    b.kulcs === "szintetikus-kapu" ? { ...b, megvan: false } : b);
  const c = csatlakozhato(kapuAllas(CS, csonka));
  assert.equal(c.csatlakozhato, false);
  assert.ok(c.zart.some((k) => k.id === "eeszt.kapu.agazati-azonosito"));
  assert.match(c.miert, /az országos térbe küldött nem/);
});

test("minden kapu álltában a csatlakozás megnyílik", () => {
  const teljes: Bizonyitek[] = BIZ.map((b) =>
    b.kulcs === "szintetikus-kapu" ? { ...b, megvan: false } : { ...b, megvan: true });
  const c = csatlakozhato(kapuAllas(CS, teljes));
  assert.equal(c.csatlakozhato, true);
  assert.match(c.miert, /hitelesítés, auditnapló és ágazati azonosító/);
});

/* ── 5. AMIÉRT AZ EESZT MÁS SÚLYÚ ───────────────────────────────────── */

test("a hitelesítés kapuja MEGNYÍLT — és az indoklás megőrzi, miért állt", () => {
  const k = CS.kapuk.find((x) => x.id === "eeszt.kapu.hitelesites")!;
  // Az indok akkor is a helyén marad, amikor a kapu már nyitva van: aki fél
  // év múlva olvassa, tudja, MIÉRT volt ez feltétel.
  assert.match(k.miert, /BELSŐ KOCKÁZATBÓL KÜLSŐVÉ/);
  assert.match(k.miert, /nem fokozati különbség/);
  const a = kapuAllas(CS, BIZ).find((x) => x.id === "eeszt.kapu.hitelesites")!;
  assert.equal(a.all, true, "a jelszavas hitelesítés elkészült");
});

test("az auditnapló kapuja ÁLL — a lépés erre épül", () => {
  const a = kapuAllas(CS, BIZ).find((x) => x.id === "eeszt.kapu.auditnaplo")!;
  assert.equal(a.all, true);
  assert.match(a.miert, /csatlakozni auditnapló nélkül nem lehet/);
});

test("az ágazati azonosító hiánya megnevezve áll", () => {
  const b = BIZ.find((x) => x.kulcs === "agazati-azonosito")!;
  assert.equal(b.megvan, false);
  assert.match(b.ertek, /NINCS/);
});

test("a referenciaigazolás ÉLŐ használatot állít — tehát a pilot előbb van", () => {
  const ref = CS.urlapok.find((u) => u.id === "eeszt.referencia")!;
  const m = ref.mezok.find((x) => x.id === "ref.ellatas")!;
  assert.match(m.megjegyzes!, /16\. lépés \(pilot\) ELŐBB van/);
});

/* ── 6. A KIINDULÓ ÁLLAPOT ──────────────────────────────────────────── */

test("a valódi dosszié építési hiba nélkül validál", () => {
  assert.equal(validateCsatlakozas(CS, BIZ).filter((i) => i.severity === "error").length, 0);
  const m = merleg(CS, BIZ);
  assert.equal(m.kapu, 4);
  assert.equal(m.alloKapu, 3, "auditnapló, hitelesítés és a szintetikus kapu");
  assert.equal(m.csatlakozhato, false);
});
