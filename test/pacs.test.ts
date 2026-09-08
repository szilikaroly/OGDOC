/**
 * KÉPVÁLASZTÁS A PACS-BÓL — három csendes hiba ellen.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { beegetes, csatol, epseg, valaszthato } from "../core/pacs/valasztas.ts";
import type { Kontextus, PacsKep } from "../core/pacs/valasztas.ts";

const BETEG = { mrn: "MRN-1001", taj: "123456789", birthDate: "1994-03-11",
  familyName: "Demó", givenName: "Anna" };
const CTX: Kontextus = { beteg: BETEG, accessionok: ["ACC-2026-0001"] };

const kep = (x: Partial<PacsKep> = {}): PacsKep => ({
  sopInstanceUid: "1.2.826.0.1.3680043.8.1.1", seriesInstanceUid: "1.2.3.4",
  studyInstanceUid: "1.2.3", accession: "ACC-2026-0001", modality: "US",
  keszult: "2026-09-08", beteg: BETEG, burnedInAnnotation: "NO",
  sha256: "a".repeat(64), ...x,
});

/* ── 1. MÁSIK BETEG KÉPE ─────────────────────────────────────────────── */

test("a képválasztás ugyanazon a betegazonosító-kapun megy át, mint a leletfogadás", () => {
  const v = valaszthato(kep(), CTX);
  assert.equal(v.valaszthato, true);
  assert.ok(v.egyezoAzonositok.length >= 2, "legalább két független azonosító");
});

test("MÁSIK BETEG képét megállítja — az ellentmondás nem szavazás", () => {
  const v = valaszthato(kep({ beteg: { ...BETEG, taj: "987654321" } }), CTX);
  assert.equal(v.allapot, "masikBeteg");
  assert.match(v.miert, /tökéletesen helyesnek\s+látszik/);
});

test("a NÉV nem azonosító — egyetlen egyezés emberi döntést kíván", () => {
  const v = valaszthato(kep({ beteg: { taj: "123456789", familyName: "Demó",
    givenName: "Anna" } }), CTX);
  assert.equal(v.allapot, "emberiDontes");
});

/* ── A KÉRÉS KÖTI ÖSSZE ──────────────────────────────────────────────── */

test("A LELETHEZ NEM SZABAD KERESÉS TARTOZIK", () => {
  const v = valaszthato(kep(), { beteg: BETEG, accessionok: [] });
  assert.equal(v.allapot, "masKeres");
  assert.match(v.miert, /ahogy másik beteg képe a leletre kerül/);
});

test("más kérésből való kép nem választható, akkor sem, ha a beteg egyezik", () => {
  const v = valaszthato(kep({ accession: "ACC-2025-9999" }), CTX);
  assert.equal(v.allapot, "masKeres");
  assert.deepEqual(v.egyezoAzonositok.length >= 2, true, "a beteg maga stimmel");
});

/* ── 2. A KÉP MEGVÁLTOZIK ────────────────────────────────────────────── */

test("SOP Instance UID nélkül a kép nem azonosítható vissza", () => {
  const v = valaszthato(kep({ sopInstanceUid: "" }), CTX);
  assert.equal(v.allapot, "azonosithatatlan");
  assert.match(v.miert, /MÁS képre\s+mutat/);
});

test("a lelet a KÉP LENYOMATÁHOZ köt, nem a sorrendjéhez", () => {
  const cs = csatol(kep(), CTX, "dr. Demó", "2026-09-08T10:00:00Z").csatolas!;
  assert.equal(epseg(cs, kep()).allapot, "valtozatlan");
  assert.equal(epseg(cs, kep({ sha256: "b".repeat(64) })).allapot, "megvaltozott");
  assert.equal(epseg(cs, null).allapot, "eltunt");
});

test("lenyomat nélkül az épség NEM „változatlan”", () => {
  const cs = csatol(kep({ sha256: null }), CTX, "dr. Demó", "2026-09-08T10:00:00Z").csatolas!;
  const e = epseg(cs, kep({ sha256: null }));
  assert.equal(e.allapot, "nemEllenorizheto");
  assert.match(e.miert, /a UID\s+megtartásával is cserélhet képadatot/);
});

/* ── 3. A KÉPBE ÉGETETT NÉV ──────────────────────────────────────────── */

test("A HIÁNYZÓ BurnedInAnnotation NEM „NINCS”", () => {
  const b = beegetes(kep({ burnedInAnnotation: null }));
  assert.equal(b.allapot, "nemNyilatkozik");
  assert.equal(b.kifeleAdhato, false);
  assert.match(b.miert, /a pixelekbe égetve hordozza/);
});

test("a beleégetett annotáció a szöveges PHI-szűrésen átmegy — ezért kell külön kapu", () => {
  const b = beegetes(kep({ burnedInAnnotation: "YES" }));
  assert.equal(b.allapot, "van");
  assert.equal(b.kifeleAdhato, false);
  assert.match(b.miert, /A\s+DICOM-fejléc anonimizálása ezen nem változtat/);
});

test("a képen belüli használat és a kifelé adás KÜLÖN kérdés", () => {
  const cs = csatol(kep({ burnedInAnnotation: null }), CTX, "dr. Demó",
    "2026-09-08T10:00:00Z");
  assert.equal(cs.allapot, "csatolva", "a leleten belül használható");
  assert.equal(cs.csatolas!.kifeleAdhato, false, "kifelé nem");

  const feloldva = csatol(kep({ burnedInAnnotation: null }), CTX, "dr. Demó",
    "2026-09-08T10:00:00Z", { ki: "dr. Demó Adatvédelmi", nincsBeegetve: true });
  assert.equal(feloldva.csatolas!.kifeleAdhato, true,
    "megnevezett ember kimondhatja — a rendszer nem");
});

/* ── A VÁLASZTÁS EMBERI ──────────────────────────────────────────────── */

test("a rendszer felkínál, de nem választ", () => {
  const cs = csatol(kep(), CTX, "   ", "2026-09-08T10:00:00Z");
  assert.equal(cs.allapot, "elutasitva");
  assert.match(cs.miert, /a rendszer felkínál, de nem választ/);
});

test("a csatolás rögzíti, KI és MIKOR választotta", () => {
  const cs = csatol(kep(), CTX, "dr. Demó", "2026-09-08T10:00:00Z").csatolas!;
  assert.equal(cs.valasztotta, "dr. Demó");
  assert.equal(cs.mikor, "2026-09-08T10:00:00Z");
  assert.equal(cs.accession, "ACC-2026-0001");
});
