/**
 * A SZÜLÉS KÓDOLÁSA — amit a jogszabály kötelezően előír.
 *
 * A 10/2012. (II. 28.) NEFMI rendelet 11. melléklete pontosan megmondja, mit
 * kell rögzíteni egy szüléshez. Három olyan tétel van, aminek a hiánya a
 * jelentést visszadobja, és amit a klinikai dokumentáció önmagában nem ad ki:
 *
 *   „3” típusjel   a szülés módja, O8000-O8492 kóddal      (I. 1.2.)
 *   „V” típusjel   a szülés eredménye, Z370-Z379 kóddal    (I. 1.4.)
 *   beavatkozás    a szülésvezetés vagy a császármetszés kódja  (I. 3.1-3.2.)
 *
 * A rendszer ezeket ELŐRE megmondja — de nem tölti ki. A szülés módja
 * klinikai állítás; ha nincs rögzítve, azt a rendszer nem találja ki, és nem
 * is vezeti le a beavatkozáskódból: a kettőnek EGYEZNIE kell, és épp az
 * eltérésük az, amit érdemes észrevenni.
 *
 * AMIT EZ SEM CSINÁL: nem sorol be. A besorolás öt fő minősítő tényezőjét
 * (patológiás terhesség, hüvelyi szülés, hüvelyi szülés műtéttel,
 * császármetszés, nagy rizikójú szülés) a rendelet felsorolja, a hozzájuk
 * tartozó besorolási táblázatot viszont nem tudjuk gépi alakban.
 */
import { readFileSync } from "node:fs";
import type { Finding, InpatientCase } from "./types.ts";

export interface DeliveryRules {
  id: string;
  label: { hu: string };
  source: { cite: string; standard?: string };
  note: { hu: string };
  szulesModKod: { tol: string; ig: string; cite: string };
  kimenetelKod: { elotag: string; cite: string };
  csaszarmetszes: { bnoElotag: string; beavatkozas: string[]; tobbesBno: string[] };
  huvelyiSzulesVezetes: { beavatkozas: string[]; cite: string };
  patologiasTerhesseg: { minNapSzulesElott: number; cite: string };
  besorolasiTenyezok: string[];
}

export function loadDeliveryRules(path: string): DeliveryRules {
  return JSON.parse(readFileSync(path, "utf8")) as DeliveryRules;
}

export interface DeliveryCheck {
  /** Kitölthető-e a szülés jelentése úgy, ahogy van. */
  complete: boolean;
  findings: Finding[];
  /** A besorolás öt fő minősítő tényezője — FELSOROLVA, nem kiértékelve. */
  classifiers: string[];
  assignsHbcs: false;
  hbcsNote: string;
}

export function checkDelivery(r: DeliveryRules, c: InpatientCase): DeliveryCheck {
  const f: Finding[] = [];
  const add = (level: Finding["level"], rule: string, message: string, cite: string) =>
    f.push({ level, rule, message, cite });

  const mode = c.diagnoses.find((d) => d.type === "3");
  const outcome = c.diagnoses.filter((d) => d.type === "V" &&
    d.code.startsWith(r.kimenetelKod.elotag));
  const base = c.diagnoses.find((d) => d.type === "1");
  const codes = new Set(c.procedures.map((p) => p.code));
  const cs = r.csaszarmetszes.beavatkozas.filter((x) => codes.has(x));
  const vag = r.huvelyiSzulesVezetes.beavatkozas.filter((x) => codes.has(x));

  /* 1. A SZÜLÉS MÓDJA — „3” típusjellel, a megadott kódtartományból. */
  if (!mode) {
    add("blocking", "szules.modHianyzik",
      "Nincs „3” típusjelű ápolást indokoló fődiagnózis. Szülésnél ezzel kell " +
      "megadni a szülés fő jellemzőit: egyes vagy többes szülés és a szülés módja.",
      r.szulesModKod.cite);
  } else if (mode.code < r.szulesModKod.tol || mode.code > r.szulesModKod.ig) {
    add("blocking", "szules.modRosszTartomany",
      `A „3” típusjelű fődiagnózis (${mode.code}) nem a szülés módját adja meg: ` +
      `a rendelet szerint ide ${r.szulesModKod.tol}-${r.szulesModKod.ig} közötti ` +
      `kód való.`, r.szulesModKod.cite);
  }

  /* 2. A SZÜLÉS EREDMÉNYE — „V” típusjelű Z37-es kód. Ez az a tétel, ami a
        klinikai dokumentációból rendszerint hiányzik, mert nem klinikai
        állítás: az élve/halva születést és a magzatszámot rögzíti. */
  if (!outcome.length) {
    add("blocking", "szules.kimenetelHianyzik",
      `Nincs „V” típusjelű ${r.kimenetelKod.elotag}-es kód a szülés ` +
      `eredményéről. Ennek megadása a szülést ellátó ELSŐ ápoló osztályon ` +
      `kötelező, és csak ott jelenhet meg.`, r.kimenetelKod.cite);
  } else if (outcome.length > 1) {
    add("warning", "szules.tobbKimenetel",
      `${outcome.length} darab „V” típusjelű ${r.kimenetelKod.elotag}-es kód ` +
      `szerepel; a szülés eredménye egy tétel.`, r.kimenetelKod.cite);
  }

  /* 3. A SZÜLÉSVEZETÉS BEAVATKOZÁSKÓDJA. */
  if (!cs.length && !vag.length) {
    add("blocking", "szules.beavatkozasHianyzik",
      "Nincs szülésvezetési beavatkozáskód. Nem műtéti szülésnél a szülési " +
      "eljárás kódját (" + r.huvelyiSzulesVezetes.beavatkozas.join(", ") +
      "), császármetszésnél a metszés kódját (" +
      r.csaszarmetszes.beavatkozas.join(", ") + ") kell rögzíteni.",
      r.huvelyiSzulesVezetes.cite);
  }

  /* 4. A DIAGNÓZIS ÉS A BEAVATKOZÁS NEM MONDHAT ELLENT EGYMÁSNAK. */
  if (mode && cs.length && !mode.code.startsWith(r.csaszarmetszes.bnoElotag) &&
      !r.csaszarmetszes.tobbesBno.includes(mode.code)) {
    add("blocking", "szules.ellentmondas",
      `Császármetszés beavatkozáskódja (${cs.join(", ")}) szerepel, de a „3” ` +
      `típusjelű fődiagnózis (${mode.code}) nem császármetszéses szülést jelöl. ` +
      `A rendszer NEM javítja ki egyiket sem: az ellentmondás maga a lelet — ` +
      `vagy a kódolás rossz, vagy a szülésleírás.`, r.szulesModKod.cite);
  }
  if (mode && !cs.length && vag.length &&
      (mode.code.startsWith(r.csaszarmetszes.bnoElotag) ||
       r.csaszarmetszes.tobbesBno.includes(mode.code))) {
    add("blocking", "szules.ellentmondas",
      `A „3” típusjelű fődiagnózis (${mode.code}) császármetszéses szülést ` +
      `jelöl, de csak hüvelyi szülésvezetés beavatkozáskódja szerepel.`,
      r.szulesModKod.cite);
  }

  /* 5. PATOLÓGIÁS TERHESSÉG — csak 12 napon TÚLI szülés előtti bennfekvéssel.
        Ha nem tudjuk, hány napot feküdt, az NEM azt jelenti, hogy nem
        patológiás: azt jelenti, hogy eldönthetetlen. */
  if (base && mode && base.code !== mode.code) {
    const d = c.preDeliveryDays;
    const min = r.patologiasTerhesseg.minNapSzulesElott;
    if (d == null) {
      add("undetermined", "szules.patologiasEldonthetetlen",
        `Az „1” típusjelű alapbetegség (${base.code}) eltér a szülés módjától, ` +
        `tehát patológiás terhességet jelöl. Ez a besorolásnál csak akkor ` +
        `vehető figyelembe, ha a szülést KÖZVETLENÜL megelőző ellátási idő ` +
        `meghaladta a ${min} napot — és ez nincs rögzítve. Ez NEM azt jelenti, ` +
        `hogy nem patológiás.`, r.patologiasTerhesseg.cite);
    } else if (d <= min) {
      add("warning", "szules.patologiasRovid",
        `A szülés előtti bennfekvés ${d} nap, ami nem haladja meg a ${min} ` +
        `napot: a patológiás terhességi diagnózis a besorolásnál így csak a ` +
        `nagy rizikójú szülés minősítésnél vehető figyelembe.`,
        r.patologiasTerhesseg.cite);
    }
  }

  return {
    complete: !f.some((x) => x.level === "blocking"),
    findings: f,
    classifiers: r.besorolasiTenyezok,
    assignsHbcs: false,
    hbcsNote:
      "A rendelet felsorolja a szülés besorolásának öt fő minősítő tényezőjét, " +
      "de a hozzájuk tartozó besorolási táblázat (2. melléklet) nincs gépi " +
      "alakban. A rendszer ezért csoportot NEM állapít meg.",
  };
}
