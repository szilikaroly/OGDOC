/**
 * NICHD magzati szívfrekvencia-besorolás — HÁROM KATEGÓRIA.
 *
 * Külön modul, nem kalkulátor, két okból:
 *
 * 1. A besorolás nem szám, hanem KATEGÓRIA, és a II. kategória definíció
 *    szerint „minden, ami nem I. és nem III." — ezt egy pontszám nem tudja
 *    kifejezni.
 * 2. A bemenetek egy része KLINIKUSI MEGÍTÉLÉS (variabilitás, sinusoidalis
 *    mintázat), és a modul nyitott kérdése kifejezetten kimondja, hogy ezt
 *    NEM SZABAD automatizálni. A besorolás ezért csak akkor születik meg, ha
 *    a klinikus a megítélést rögzítette — és ha időszakos hallgatózás
 *    történt, egyáltalán nem születik meg.
 *
 * Forrás: Macones GA, Hankins GDV, Spong CY, Hauth J, Moore T. The 2008 NICHD
 * workshop report on electronic fetal monitoring. Obstet Gynecol
 * 2008;112(3):661-666. PMID 18757666
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export interface NichdOk {
  status: "ok";
  category: 1 | 2 | 3;
  label: string;
  severity: "normal" | "watch" | "redflag";
  /** Mi alapján dőlt el — a besorolás indoklása, nem csak az eredménye. */
  why: string[];
  action: string;
  source: string;
}
export interface NichdBlocked {
  status: "insufficient";
  missing: string[];
  reason: string;
}
export type NichdResult = NichdOk | NichdBlocked;

const SOURCE =
  "Macones GA et al. The 2008 NICHD workshop report on electronic fetal " +
  "monitoring. Obstet Gynecol 2008;112(3):661-666";

export function nichd(reg: Registry, state: CaseState, _lang: Lang = "hu"): NichdResult {
  const method = resolve(reg, state, "labour.fhr.method");
  if (method.state === "ok" && (method.value === "intermittent" || method.value === "none")) {
    return {
      status: "insufficient",
      missing: ["labour.fhr.method"],
      reason:
        "A besorolás FOLYAMATOS görbét kíván: időszakos hallgatózásból a " +
        "variabilitás és a decelerációtípus nem ítélhető meg. Ez nem hiányosság — " +
        "alacsony kockázatú vajúdásban az időszakos hallgatózás az ajánlott " +
        "módszer, és a NICHD-kategória ott egyszerűen nem értelmezhető.",
    };
  }

  const baseline = resolve(reg, state, "labour.fhr.baseline");
  const variability = resolve(reg, state, "labour.fhr.variability");
  const decel = resolve(reg, state, "labour.fhr.decel");
  const accel = resolve(reg, state, "labour.fhr.accel");

  const missing: string[] = [];
  if (baseline.state !== "ok") missing.push("labour.fhr.baseline");
  // A VARIABILITÁS a besorolás legfontosabb eleme, és klinikusi megítélés.
  if (variability.state !== "ok") missing.push("labour.fhr.variability");
  if (decel.state !== "ok") missing.push("labour.fhr.decel");
  if (missing.length) {
    return {
      status: "insufficient", missing,
      reason:
        `Hiányzó bemenet: ${missing.join(", ")}. A variabilitás és a ` +
        `decelerációtípus KLINIKUSI MEGÍTÉLÉS — a rendszer nem pótolja.`,
    };
  }

  const bpm = Number(baseline.value);
  const v = String(variability.value);
  const d = String(decel.value);
  const why: string[] = [];

  /* ── III. kategória: KÓROS ──────────────────────────────────────────── */
  if (v === "sinusoidal") {
    return cat3(["sinusoidalis mintázat"]);
  }
  if (v === "absent") {
    // Hiányzó variabilitás + ismétlődő deceleráció vagy bradycardia → III.
    if (d === "recurrentLate" || d === "recurrentVariable" || bpm < 110) {
      const trigger = bpm < 110 ? "bradycardia" : "ismétlődő deceleráció";
      return cat3([`hiányzó variabilitás + ${trigger}`]);
    }
    why.push("hiányzó variabilitás");
  }

  /* ── I. kategória: NORMÁLIS — mind az öt feltétel együtt ────────────── */
  const normalBaseline = bpm >= 110 && bpm <= 160;
  const normalVariability = v === "moderate";
  const noBadDecel = d === "none" || d === "early";
  if (normalBaseline && normalVariability && noBadDecel) {
    return {
      status: "ok", category: 1, label: "I. kategória — normális",
      severity: "normal",
      why: [
        `alapvonal ${bpm}/perc (110–160)`,
        "mérsékelt variabilitás",
        d === "none" ? "deceleráció nincs" : "csak korai deceleráció",
      ],
      action:
        "Nem igényel beavatkozást. A mérsékelt variabilitás jelenléte " +
        "gyakorlatilag kizárja az aktuális magzati acidózist.",
      source: SOURCE,
    };
  }

  /* ── II. kategória: MINDEN MÁS ──────────────────────────────────────── */
  if (!normalBaseline) why.push(`alapvonal ${bpm}/perc a 110–160 sávon kívül`);
  if (!normalVariability && v !== "absent") why.push(`${v} variabilitás`);
  if (!noBadDecel) why.push(`${d} deceleráció`);
  if (accel.state === "ok" && accel.value === false) {
    why.push("akceleráció nincs (önmagában nem kóros)");
  }

  return {
    status: "ok", category: 2,
    label: "II. kategória — meghatározatlan",
    severity: "watch",
    why,
    action:
      "Fokozott figyelés és a kiváltó ok keresése (testhelyzet, folyadék, " +
      "oxitocin felfüggesztése). A II. kategória DEFINÍCIÓ SZERINT minden, ami " +
      "nem I. és nem III. — a vajúdások többsége ide esik, és nem jelent " +
      "magzati veszélyeztetettséget. Épp ezért a KLINIKAI KÉP és a görbe " +
      "alakulása dönt, nem a besorolás önmagában.",
    source: SOURCE,
  };
}

function cat3(why: string[]): NichdOk {
  return {
    status: "ok", category: 3, label: "III. kategória — kóros",
    severity: "redflag", why,
    action:
      "AZONNALI beavatkozás: intrauterin resuscitatio (bal oldalfekvés, " +
      "oxitocin felfüggesztése, folyadék, oxigén mérlegelése) és a szülés " +
      "befejezésének azonnali mérlegelése, ha a görbe nem rendeződik.",
    source: SOURCE,
  };
}
