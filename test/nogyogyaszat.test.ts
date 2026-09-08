/**
 * NŐGYÓGYÁSZATI FELÜLETTÉRKÉP — a második szakterület, ugyanazokkal a szabályokkal.
 *
 * A szülészeti térkép megmutatta, mit kell tudni; ez a térkép azt mutatja meg,
 * hogy ugyanazok a szerkezeti szabályok egy MÁSIK szakterületen is állnak. Ahol
 * ugyanaz a hiba kétszer fordul elő két különböző rendszerben, ott nem egyedi
 * megoldásról van szó, hanem a szakma alapállapotáról — és a rendszernek erre
 * kell választ adnia, nem az egyes képernyőre.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { auditFields, loadUiMap, uiStamp, validateUiMap } from "../core/ui/felulet.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const MAP = loadUiMap(join(HERE, "..", "registry", "felulet", "nogyogyaszati-felulet.json"));

test("a nőgyógyászati felülettérkép hiba nélkül validál", () => {
  const errors = validateUiMap(MAP, REG).filter((i) => i.severity === "error");
  assert.deepEqual(errors, []);
});

test("a menüfa minden ága gyökérig visszavezethető", () => {
  const labels = new Set(MAP.menu.map((m) => [...m.path, m.label].join(" › ")));
  for (const m of MAP.menu) {
    for (let i = 1; i <= m.path.length; i++) {
      assert.ok(labels.has(m.path.slice(0, i).join(" › ")),
        `lógó ág: ${m.path.join(" › ")} › ${m.label}`);
    }
  }
});

/* ── A HARMADIK ÁLLAPOT ─────────────────────────────────────────────── */

test("„megkísérelve és nem sikerült” ÖT független helyen fordul elő", () => {
  // Ha ugyanaz az állapot öt beavatkozásnál külön-külön megjelenik, az nem
  // egyedi megoldás: a szakma alapállapota, aminek saját helye kell legyen.
  const a = auditFields(MAP, REG).filter((x) => /MEGKÍSÉRELVE ÉS NEM SIKERÜLT/.test(x.why));
  assert.ok(a.length >= 5, `csak ${a.length} előfordulás`);
  const forms = new Set(a.map((x) => x.form));
  assert.ok(forms.size >= 5, "ugyanazon a lapon többször — nem független előfordulás");
  assert.ok(a.every((x) => x.status === "context"));
});

test("az elégtelen minta negatív lelete nem negatív lelet", () => {
  const a = auditFields(MAP, REG).filter((x) => x.form === "gyn.form.endometriumBiopszia");
  const s = a.find((x) => /A MINTA ALKALMASSÁGA KAPUZZA/.test(x.why));
  assert.ok(s, "hiányzik a mintaalkalmasság kapuja");
  assert.match(s!.why, /nem volt mit megnézni/);
});

/* ── A LEVEZETÉS SÉRTÉSE ────────────────────────────────────────────── */

test("a kézzel beírt végösszeg nem vehető át — az AFS-pontszám levezetett", () => {
  const a = auditFields(MAP, REG).filter((x) => /KÉZZEL BEÍRT VÉGÖSSZEG/.test(x.why));
  assert.ok(a.length >= 2, "a szülészeti anamnézis összesítői és az AFS-pontszám");
  assert.ok(a.every((x) => x.status === "refused"));
  assert.ok(a.some((x) => x.form === "gyn.form.laparoszkopia"));
});

/* ── A MODELL KÉT SZÍNVONALA ────────────────────────────────────────── */

test("a PUL-modell mellett OTT a hivatkozás, az adnexum-modell mellett NINCS", () => {
  // Ugyanaz a rendszer, két képernyő. A koraterhesség lapon teljes irodalmi
  // hivatkozás áll a modell mellett; az adnexum-lapon a „Malignitás kockázata"
  // mező mellett semmilyen modell nincs megnevezve.
  const pul = MAP.forms.find((f) => f.id === "gyn.form.koraterhesseg")!;
  const forras = pul.fields.find((f) => f.label.startsWith("Forrás: Condous"));
  assert.ok(forras, "a PUL-modell forrása nincs a térképen");
  assert.ok(forras!.modelBacked);
  assert.match(forras!.note!, /Hum Reprod|calc\.verified/);

  const adn = MAP.forms.find((f) => f.id === "gyn.form.adnexum")!;
  const kock = adn.fields.find((f) => f.label === "Malignitás kockázata")!;
  assert.ok(kock.modelBacked);
  assert.match(kock.note!, /SEMMILYEN MODELL NINCS MEGNEVEZVE/);
});

test("a modell a klinikus MELLÉ áll: szubjektív benyomás a százalékok mellett", () => {
  const f = MAP.forms.find((x) => x.id === "gyn.form.koraterhesseg")!
    .fields.find((x) => x.label.startsWith("Szubjekív benyomás"))!;
  assert.match(f.note!, /NEGYEDIK független előfordulása/);
});

/* ── AZ AUDIT-HUROK ─────────────────────────────────────────────────── */

test("a kimenetel HÁROM igazságot szembesít, és egyiket sem írja felül", () => {
  const a = auditFields(MAP, REG).filter((x) => x.form === "gyn.form.kimenetel");
  const audit = a.filter((x) => /AUDIT-HUROK/.test(x.why));
  assert.equal(audit.length, 2);   // műtéti diagnózis · UH-diagnózis
  const uh = audit.find((x) => x.field.startsWith("UH diagnózis"))!;
  assert.match(uh.why, /IOTA|RMI|PUL/);
});

/* ── AMI KÉT SZAKTERÜLETEN UGYANÚGY IGAZ ────────────────────────────── */

test("a műtéti előzmény miatt hiányzó szerv itt is hatodik szervállapot", () => {
  const a = auditFields(MAP, REG).filter((x) => /MŰTÉTI ELŐZMÉNY|hatodik szervállapot/i.test(x.why));
  const forms = new Set(a.map((x) => x.form));
  assert.ok(forms.size >= 3, "méh · petefészkek · vese");
});

test("a ciklusnap mérési körülmény, nem kiegészítő adat", () => {
  const a = auditFields(MAP, REG).filter((x) => /ciklusnap/i.test(x.why));
  assert.ok(a.length >= 3, `csak ${a.length} helyen`);
  assert.ok(a.some((x) => x.form === "gyn.form.kertVizsgalatok"),
    "a megrendelőlapon is hiányzik, pedig ott dől el, értelmezhető lesz-e az eredmény");
});

test("a hibás thrombophilia-értékkészlet forrása a nőgyógyászati oldalon van", () => {
  // A szülészeti térkép megállapította, hogy a „ccddee" Rhesus-genotípus, nem
  // thrombophilia-genotípus. Itt megvan a helyén — tehát innen másolták oda.
  const f = MAP.forms.find((x) => x.id === "gyn.form.erpc")!
    .fields.find((x) => x.label.startsWith("Rh(esus)"))!;
  assert.ok(f.valueSetSuspect);
  assert.match(f.note!, /ITT VAN A HELYÉN/);
});

test("egy pipa nem állíthat három vizsgálat eredményéről", () => {
  const a = auditFields(MAP, REG).filter((x) => x.status === "refused" &&
    /AZ „ÖSSZES NEGATÍV” NEM ÍRJA FELÜL/.test(x.why));
  assert.ok(a.length >= 4);
  const s = a.find((x) => x.field.startsWith("„Ép emlők"));
  assert.ok(s, "a lelet-címkéjű jelölőnégyzet hiányzik a térképről");
  assert.match(s!.why, /emlővizsgálat ezen a képernyőn másutt elő sem fordul/);
});

test("a térkép bélyege kimondja, hogy részleges", () => {
  const s = uiStamp(MAP, REG);
  assert.match(s, /adatlap/);
  assert.match(s, /a térkép RÉSZLEGES/);
});
