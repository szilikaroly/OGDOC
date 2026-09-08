/**
 * A JELENTÉSI REKORD, MINT KAPU.
 *
 * A fekvőbeteg-jelentés FIX HOSSZÚSÁGÚ, 746 bájtos rekord: minden mező adott
 * karakterpozíción kezdődik, és adott hosszúságú. Ezért a hossz itt nem
 * formaiság — egy karakterrel hosszabb kód az EGÉSZ rekordot elcsúsztatja,
 * és a jelentés némán romlik el.
 *
 * Két hossz mond ellent annak, amit a rendszer korábban feltételezett, és a
 * rekordkép ezt eldönti:
 *
 *   BNO_KOD  5 karakter  →  O1410, nem O141
 *   B_KOD    5 karakter  →  57410, nem 74.10
 *
 * A rekordkép a `registry/kodok/fekvo/rekordkep.json`-ból jön, nem kódból: a
 * NEAK technikai útmutató évente változik, és a mezőhosszak vele.
 *
 * AMIT EZ A RÉTEG NEM CSINÁL: nem sorol be HBCS-csoportba, és nem tölt ki
 * hiányzó adatot. A hiányzó fődiagnózist megnevezi, nem kitalálja.
 */
import { readFileSync } from "node:fs";
import { getTable } from "../coding/tables.ts";
import { checkValidity } from "../coding/validity.ts";
import type { Finding, InpatientCase } from "./types.ts";

export interface RecordField {
  nev: string;
  hossz?: number;
  ismetles?: number;
  megnevezes: string;
  torzs?: string;
  phi?: boolean;
  almezok?: RecordField[];
}

export interface RecordLayout {
  id: string;
  label: { hu: string };
  version: string;
  source: { cite: string; standard?: string };
  recordBytes: number;
  maxDiagnozis: number;
  maxBeavatkozas: number;
  note: { hu: string };
  mezok: RecordField[];
}

export interface DiagnosisType {
  jel: string;
  nev: string;
  min?: number;
  max?: number;
  kotelezoHa?: string;
  megjegyzes?: string;
  cite: string;
}

export interface DiagnosisTypes {
  id: string;
  label: { hu: string };
  source: { cite: string; standard?: string };
  note: { hu: string };
  tipusok: DiagnosisType[];
}

export function loadLayout(path: string): RecordLayout {
  return JSON.parse(readFileSync(path, "utf8")) as RecordLayout;
}
export function loadDiagnosisTypes(path: string): DiagnosisTypes {
  return JSON.parse(readFileSync(path, "utf8")) as DiagnosisTypes;
}

/**
 * A rekordkép ÖNELLENŐRZÉSE: a mezőhosszak összege a megadott bájtszám.
 *
 * Ez nem formaiság: ha egy mező hossza elgépelt, a rekordkép egésze hibás, és
 * az abból származó ellenőrzés is. Az összeg az egyetlen olyan tulajdonság,
 * ami a másolás helyességét bizonyítja.
 */
export function layoutBytes(l: RecordLayout): number {
  let n = 0;
  for (const m of l.mezok) {
    if (m.almezok) {
      const sub = m.almezok.reduce((s, a) => s + (a.hossz ?? 0), 0);
      n += sub * (m.ismetles ?? 1);
    } else {
      n += m.hossz ?? 0;
    }
  }
  return n;
}

export interface RecordCheck {
  /** Beadható-e a jelentés úgy, ahogy van. */
  canReport: boolean;
  findings: Finding[];
  /** MINDIG hamis, és ez nem hiányosság, hanem a réteg határa. */
  assignsHbcs: false;
  hbcsNote: string;
}

const HBCS_NOTE =
  "Ez az ellenőrzés NEM sorol be HBCS-csoportba: a besorolási táblázat " +
  "(10/2012. NEFMI 2. melléklet) nincs gépi alakban. Azt mondja meg, hogy a " +
  "jelentés kitölthető-e — nem azt, hogy mennyit ér.";

/** A hossz karakterben, nem bájtban: a kódok ASCII-k, a rekord fix. */
const len = (s: string) => s.length;

export function checkRecord(
  layout: RecordLayout, types: DiagnosisTypes, c: InpatientCase,
): RecordCheck {
  const f: Finding[] = [];
  const add = (level: Finding["level"], rule: string, message: string, cite: string) =>
    f.push({ level, rule, message, cite });
  const layoutCite = layout.source.cite;

  /* 1. FÉR-E BELE. A rekordban 16 diagnózis és 10 beavatkozás helye van. */
  if (c.diagnoses.length > layout.maxDiagnozis) {
    add("blocking", "rekord.diagnozisTulsok",
      `${c.diagnoses.length} diagnózis van, a rekordban ${layout.maxDiagnozis} ` +
      `fér el. Ami kimarad, az ELMARADT BEVÉTEL is lehet: a társult betegség ` +
      `minősítés kimaradása alacsonyabb súlyszámú csoportot ad.`, layoutCite);
  }
  if (c.procedures.length > layout.maxBeavatkozas) {
    add("blocking", "rekord.beavatkozasTulsok",
      `${c.procedures.length} beavatkozás van, a rekordban ` +
      `${layout.maxBeavatkozas} fér el.`, layoutCite);
  }

  /* 2. MEZŐHOSSZ. Fix rekordban a hosszabb kód mindent elcsúsztat. */
  const bno = layout.mezok.find((m) => m.nev === "BETEGSEG")!
    .almezok!.find((a) => a.nev === "BNO_KOD")!.hossz!;
  const proc = layout.mezok.find((m) => m.nev === "BEAVATKOZ")!
    .almezok!.find((a) => a.nev === "B_KOD")!.hossz!;
  for (const d of c.diagnoses) {
    if (!/^[0-9A-Z]+$/.test(d.code)) {
      add("blocking", "rekord.bnoAlak",
        `A(z) „${d.code}” nem alfanumerikus: a jelentési alak pont nélküli ` +
        `(O1410, nem O14.10).`, layoutCite);
    }
    if (len(d.code) !== bno) {
      add("blocking", "rekord.bnoHossz",
        `A(z) „${d.code}” ${len(d.code)} karakteres, a BNO_KOD mező ${bno}. ` +
        `A rövidített alak (O141) NEM jelentési alak: a jelentési alak ` +
        `ötkarakteres (O1410).`, layoutCite);
    }
  }
  for (const p of c.procedures) {
    if (len(p.code) !== proc) {
      add("blocking", "rekord.beavatkozasHossz",
        `A(z) „${p.code}” ${len(p.code)} karakteres, a B_KOD mező ${proc}.`,
        layoutCite);
    }
    // A HOSSZ NEM ELÉG: a „74.10" éppen öt karakter, mégsem magyar kód. A
    // rekordban minden mező alfanumerikus — az elválasztó pont ott nem
    // hibaüzenetet ad, hanem elcsúszott mezőt.
    if (!/^[0-9A-Z]+$/.test(p.code)) {
      add("blocking", "rekord.beavatkozasAlak",
        `A(z) „${p.code}” nem alfanumerikus. A pontos alak (74.10) az ` +
        `amerikai ICD-9-CM-ből való: a hazai kód öt jegyű, pont nélkül ` +
        `(57410). A hossza éppen stimmel — ezért ezt a hossz NEM fogja meg.`,
        layoutCite);
    }
  }

  /* 3. TÍPUSJELEK SZÁMOSSÁGA. Amit a rendelet ír elő, nem amit szeretnénk. */
  const byType = new Map<string, number>();
  for (const d of c.diagnoses) byType.set(d.type, (byType.get(d.type) ?? 0) + 1);
  const known = new Set(types.tipusok.map((t) => t.jel));
  for (const t of byType.keys()) {
    if (!known.has(t)) {
      add("blocking", "diag.ismeretlenTipus",
        `A(z) „${t}” nem érvényes diagnózis-típusjel.`, types.source.cite);
    }
  }
  for (const t of types.tipusok) {
    const n = byType.get(t.jel) ?? 0;
    if (t.max != null && n > t.max) {
      add("blocking", "diag.tulSok",
        `„${t.jel}” (${t.nev}) típusjelből ${n} van, legfeljebb ${t.max} lehet.`,
        t.cite);
    }
    if (t.min != null && n < t.min) {
      add("blocking", "diag.hianyzik",
        `Hiányzik a(z) „${t.jel}” típusjelű diagnózis: ${t.nev}. Ennek ` +
        `meghatározása kötelező — a rendszer NEM találja ki.`, t.cite);
    }
  }
  if (c.referred && !(byType.get("0") ?? 0)) {
    add("blocking", "diag.beutaloHianyzik",
      "Beutalóval érkezett beteg, de nincs „0” típusjelű beutaló " +
      "iránydiagnózis. Kitöltése ilyenkor kötelező.", "10/2012. NEFMI 6. § (1)");
  } else if (c.referred == null && !(byType.get("0") ?? 0)) {
    add("undetermined", "diag.beutaloEldonthetetlen",
      "Nincs „0” típusjelű beutaló iránydiagnózis. Az, hogy ez hiány-e, " +
      "attól függ, beutalóval érkezett-e a beteg — és ez nincs rögzítve. " +
      "Ez NEM azt jelenti, hogy rendben van.", "10/2012. NEFMI 6. § (1)");
  }
  if (c.transferred && !(byType.get("2") ?? 0)) {
    add("blocking", "diag.athelyezesHianyzik",
      "Áthelyezés történt, de nincs „2” típusjelű áthelyezést indokoló " +
      "diagnózis. Áthelyezés esetén kötelező.", "10/2012. NEFMI 6. § (7)");
  }
  const external = c.diagnoses.some((d) => /^[STVWXY]/.test(d.code));
  if (external && !(byType.get("E") ?? 0)) {
    add("blocking", "diag.kulsoOkHianyzik",
      "A diagnózisok közt sérülés vagy mérgezés kódja szerepel, de nincs " +
      "„E” típusjelű külső ok. Használata ilyenkor kötelező.",
      "10/2012. NEFMI 6. § (9)");
  }

  /* 4. A KÓD LÉTEZIK-E, ÉS ÉRVÉNYES-E ERRE A BETEGRE, EZEN A NAPON. */
  const on = c.dischargedOn ?? c.admittedOn ?? null;
  for (const d of c.diagnoses) {
    if (d.type === "F") continue;                    // FNO-kód, más törzsből
    const v = checkValidity("tbl.bno", d.code, { sex: c.sex, age: c.age, on });
    if (v.status === "unknown" && getTable("tbl.bno")) {
      add("blocking", "diag.ismeretlenKod",
        `A(z) ${d.code} nem szerepel a BNO-törzsben.`, types.source.cite);
    } else if (v.status !== "ok" && v.status !== "unknown") {
      add(v.status === "undetermined" ? "undetermined" : "blocking",
        `diag.${v.status}`, v.why, "BNO törzs (nem, életkor, érvényesség)");
    }
  }
  for (const p of c.procedures) {
    const v = checkValidity("tbl.mut", p.code, { sex: c.sex, age: c.age, on: p.on ?? on });
    if (v.status === "unknown" && getTable("tbl.mut")) {
      add("blocking", "beav.ismeretlenKod",
        `A(z) ${p.code} nem szerepel a fekvőbeteg beavatkozási törzsben.`,
        layoutCite);
    } else if (v.status !== "ok" && v.status !== "unknown") {
      add(v.status === "undetermined" ? "undetermined" : "blocking",
        `beav.${v.status}`, v.why, "Fekvőbeteg beavatkozási törzs");
    }
  }

  return {
    canReport: !f.some((x) => x.level === "blocking"),
    findings: f, assignsHbcs: false, hbcsNote: HBCS_NOTE,
  };
}
