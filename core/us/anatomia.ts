/**
 * MAGZATI RÉSZLETES ANATÓMIA — szervrendszerenkénti értékkészlet.
 *
 * A meglévő rendszer anatómiai lapjai szervrendszerenként ugyanazt a
 * szerkezetet ismétlik, és ez a szerkezet a legértékesebb, ami a felületből
 * átvehető:
 *
 *   ☐ <normál állítás>          „Szabályos koponyaforma"
 *   ☐ Nem látható
 *   ☐ Nem hozható látótérbe
 *   ☐ Rendellenességek  →  tételes lista
 *   (semmi bejelölve)            — erről a szervről SEMMIT nem állítunk
 *
 * A NEM LÁTHATÓ ÉS A NEM HOZHATÓ LÁTÓTÉRBE NEM UGYANAZ.
 *
 * Az első LELET a magzatról: a nem látható gyomor oesophagus-atresiára utal, a
 * nem látható húgyhólyag alsó húgyúti obstructióra. A második a VIZSGÁLATRÓL
 * szól: a magzat háttal fekszik, az anyai habitus korlátoz, kevés a magzatvíz.
 *
 * A rendszer eddig EGYETLEN „nem vizsgálható" állapotot ismert. Ez a felület
 * kettéválasztja — és igaza van: a két állapot ellentétes teendőt szül. A nem
 * ábrázolódó gyomor kivizsgálást indít; a nem beállítható metszet
 * ISMÉTLÉST kér.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";

/** A szerv állapota a leleten. Öt érték, és egyik sem olvad a másikba. */
export type OrganState =
  | "normal" | "notVisible" | "notObtainable" | "abnormal" | "notRecorded";

export interface AnatomyRegion {
  id: string;
  label: string;
  /** A normál lelet SZÖVEGE — nem „normális", hanem amit állít. */
  normalStatement: string;
  measurements: string[];
  abnormalities: string[];
  note?: string;
}

export interface AnatomyStateDef {
  id: OrganState;
  label: string;
  meaning: string;
}

export interface AnatomyCatalogue {
  id: string;
  label: I18n;
  source: { cite: string };
  coverage: "full" | "partial";
  coverageNote?: I18n;
  gaps: string[];
  /** A genitalia lap tanulsága: a rögzített és a nyomtatott lelet nem ugyanaz. */
  printGate?: I18n;
  /** Hány anatómiai fül van trimeszterenként — a katalógus ugyanaz. */
  tabsByTrimester?: { first: number; second: number };
  regionNote?: I18n;
  /** Hogyan ellenőriztük a katalógus trimeszter-függetlenségét. */
  verification?: string;
  states: AnatomyStateDef[];
  stateNote: I18n;
  regions: AnatomyRegion[];
}

export function loadAnatomy(path: string): AnatomyCatalogue {
  return JSON.parse(readFileSync(path, "utf8")) as AnatomyCatalogue;
}

export function region(cat: AnatomyCatalogue, id: string): AnatomyRegion | undefined {
  return cat.regions.find((r) => r.id === id);
}

export interface StateReading {
  region: string;
  state: OrganState;
  /** Kóros-e MAGA A LELET (nem a vizsgálat korlátozottsága). */
  abnormalFinding: boolean;
  /** Kell-e ismételni a vizsgálatot. */
  repeatNeeded: boolean;
  why: string;
}

/**
 * Mit jelent egy szervállapot — és mi következik belőle.
 *
 * A két „nem" ellentétes teendőt szül, és ezt a réteg szerkezetileg mondja ki,
 * nem szövegben: a `notVisible` LELET (kivizsgálást indíthat), a
 * `notObtainable` a VIZSGÁLAT korlátja (ismétlést kér).
 */
export function readState(r: AnatomyRegion, state: OrganState): StateReading {
  switch (state) {
    case "normal":
      return {
        region: r.id, state, abnormalFinding: false, repeatNeeded: false,
        why: `Megvizsgálva, eltérés nélkül: „${r.normalStatement}”.`,
      };
    case "notVisible":
      return {
        region: r.id, state, abnormalFinding: true, repeatNeeded: false,
        why:
          `A(z) ${r.label} NEM ÁBRÁZOLÓDOTT. Ez LELET a magzatról, nem a ` +
          `vizsgálat korlátja: a nem látható szerv önmagában lehet kóros.`,
      };
    case "notObtainable":
      return {
        region: r.id, state, abnormalFinding: false, repeatNeeded: true,
        why:
          `A(z) ${r.label} metszete NEM VOLT BEÁLLÍTHATÓ (magzati helyzet, ` +
          `anyai habitus, magzatvíz). Ez a VIZSGÁLATRÓL szól, nem a magzatról ` +
          `— ismétlést kér, nem kivizsgálást. És NEM azonos a normálissal.`,
      };
    case "abnormal":
      return {
        region: r.id, state, abnormalFinding: true, repeatNeeded: false,
        why: `Eltérés a(z) ${r.label} területén — a tételes lista részletezendő.`,
      };
    case "notRecorded":
      return {
        region: r.id, state, abnormalFinding: false, repeatNeeded: true,
        why:
          `A(z) ${r.label} szervről a lelet SEMMIT nem állít. Ez nem ` +
          `normális lelet és nem is kóros: nincs róla adat.`,
      };
  }
}

export interface AnatomyIssue { severity: "error" | "warning"; id: string; message: string }

export function validateAnatomy(cat: AnatomyCatalogue): AnatomyIssue[] {
  const out: AnatomyIssue[] = [];
  const seen = new Set<string>();
  for (const r of cat.regions) {
    if (seen.has(r.id)) out.push({ severity: "error", id: r.id, message: "duplikált szervrendszer" });
    seen.add(r.id);
    if (!r.normalStatement?.trim()) {
      out.push({
        severity: "error", id: r.id,
        message:
          "hiányzik a NORMÁL ÁLLÍTÁS — a „normális” önmagában nem lelet: le " +
          "kell írni, MIT állítunk normálisnak",
      });
    }
    if (!r.abnormalities.length) {
      out.push({
        severity: "warning", id: r.id,
        message: "nincs tételes rendellenesség-lista — az eltérés szabad szöveggé válna",
      });
    }
  }
  const ids = new Set(cat.states.map((s) => s.id));
  for (const need of ["normal", "notVisible", "notObtainable", "abnormal", "notRecorded"]) {
    if (!ids.has(need as OrganState)) {
      out.push({
        severity: "error", id: cat.id,
        message: `hiányzó szervállapot: ${need} — az öt állapot egyike sem hagyható el`,
      });
    }
  }
  if (cat.coverage === "partial" && !cat.gaps?.length) {
    out.push({ severity: "error", id: cat.id, message: "RÉSZLEGES katalógus a lyukak megnevezése nélkül" });
  }
  return out;
}
