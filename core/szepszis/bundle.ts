/**
 * AZ ÓRÁHOZ KÖTÖTT ELLÁTÁSI CSOMAG.
 *
 * Itt jelenik meg a rendszer első SORRENDI kapuja. Eddig minden kapu egy
 * ÉRTÉKRŐL szólt (ellenőrizetlen konstans, hiányzó egység, hitelesítetlen
 * tábla); ez két ESEMÉNY egymáshoz képesti helyéről: a hemokultúrának meg kell
 * előznie az antibiotikumot, különben a tenyésztés negatív lesz, és a kórokozó
 * örökre ismeretlen marad.
 *
 * A sorrendi kapu ugyanakkor NEM lehet hard-stop. Ha a hemokultúra levétele
 * késne, az antibiotikum akkor is megy — a beteg élete előbbre való a
 * mikrobiológiai leletnél. A rendszer tehát nem tilt, hanem RÖGZÍTI, hogy a
 * sorrend megfordult, és megnevezi, mi az ára.
 *
 * A csomag jelölőnégyzetekkel nem mérhető: IDŐBÉLYEGEKKEL igen. „Megtörtént"
 * és „egy órán belül megtörtént" két különböző állítás, és a minőségi
 * visszamérés a másodikon áll.
 */
import type { I18n } from "../types.ts";
import type { BundleStep, SepsisProtocol } from "./types.ts";
import type { EszkalaciosRend } from "../riasztas/eszkalacio.ts";
import { riasztasAllas } from "../riasztas/eszkalacio.ts";

/** Mikor mi történt. A hiányzó időpont NEM azt jelenti, hogy nem történt meg. */
export interface BundleEvent {
  step: string;
  /** ISO időbélyeg. */
  at: string;
  by?: string;
  /** Ha a lépés SZÁNDÉKOSAN maradt el, az indoklással együtt. */
  omittedBecause?: string;
}

export type StepState =
  | "onTime"        // megtörtént a határidőn belül
  | "late"          // megtörtént, de későn
  | "pending"       // még belefér az időbe
  | "overdue"       // lejárt, és nincs rögzítve
  | "omitted"       // szándékosan elmaradt, indoklással
  | "notApplicable";

export interface StepStatus {
  id: string;
  label: string;
  state: StepState;
  minutes: number | null;
  within: number;
  why: string;
}

export interface OrderIssue {
  before: string;
  after: string;
  why: string;
}

export interface BundleStatus {
  /** A felismerés pillanata — innen ketyeg az óra, nem a felvételtől. */
  recognisedAt: string;
  steps: StepStatus[];
  orderIssues: OrderIssue[];
  /** Csak akkor igaz, ha MINDEN esedékes lépés időben megtörtént. */
  complete: boolean;
  why: string;
}

const L = (x: I18n | undefined) => x?.hu ?? "";

function minutesBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 60000);
}

export function bundleStatus(
  p: SepsisProtocol, recognisedAt: string, events: BundleEvent[], now: string,
): BundleStatus {
  const byStep = new Map<string, BundleEvent>();
  for (const e of events) {
    const prev = byStep.get(e.step);
    // Az ELSŐ megtörténés számít: a csomag a válasz gyorsaságát méri.
    if (!prev || Date.parse(e.at) < Date.parse(prev.at)) byStep.set(e.step, e);
  }
  const elapsed = minutesBetween(recognisedAt, now);

  const steps: StepStatus[] = p.bundle.steps.map((s: BundleStep) => {
    const label = L(s.label);
    const ev = byStep.get(s.id);

    if (s.conditionalOn && !byStep.get(s.conditionalOn)) {
      return {
        id: s.id, label, state: "notApplicable", minutes: null, within: s.withinMinutes,
        why: `Nem esedékes: a(z) „${L(p.bundle.steps.find((x) => x.id === s.conditionalOn)?.label)}” ` +
             `még nem történt meg.`,
      };
    }
    if (ev?.omittedBecause) {
      return {
        id: s.id, label, state: "omitted", minutes: null, within: s.withinMinutes,
        why: `SZÁNDÉKOSAN ELMARADT, indoklással: „${ev.omittedBecause}”. A ` +
             `dokumentált döntés nem hiány — de a csomag teljesítése szempontjából ` +
             `nem is teljesítés.`,
      };
    }
    if (!ev) {
      const over = elapsed > s.withinMinutes;
      return {
        id: s.id, label, state: over ? "overdue" : "pending",
        minutes: null, within: s.withinMinutes,
        why: over
          ? `LEJÁRT: ${s.withinMinutes} perc volt rá, ${elapsed} perce ismertük fel, ` +
            `és nincs rögzítve. Ez nem azt jelenti, hogy nem történt meg — azt, ` +
            `hogy nincs róla időbélyeg, tehát nem is mérhető.`
          : `Még belefér: ${elapsed}/${s.withinMinutes} perc.`,
      };
    }
    const m = minutesBetween(recognisedAt, ev.at);
    return {
      id: s.id, label, state: m <= s.withinMinutes ? "onTime" : "late",
      minutes: m, within: s.withinMinutes,
      why: `${m} perc a felismeréstől (határidő ${s.withinMinutes} perc)` +
           (ev.by ? ` — ${ev.by}` : ""),
    };
  });

  // A SORRENDI KAPU.
  const orderIssues: OrderIssue[] = [];
  for (const s of p.bundle.steps) {
    if (!s.before) continue;
    const a = byStep.get(s.id), b = byStep.get(s.before);
    if (!a || !b) continue;
    if (Date.parse(a.at) > Date.parse(b.at)) {
      const after = p.bundle.steps.find((x) => x.id === s.before);
      orderIssues.push({
        before: s.id, after: s.before,
        why:
          `MEGFORDULT SORREND: „${L(s.label)}” ${minutesBetween(b.at, a.at)} perccel ` +
          `a(z) „${L(after?.label)}” UTÁN történt. ` + (L(s.note) ||
          "A sorrend nem formaság: a második lépés érvényteleníti az elsőt.") +
          ` A rendszer ezt nem tiltotta meg — a beteg ellátása előbbre való —, ` +
          `de rögzíti, mert az eredményt átértelmezi.`,
      });
    }
  }

  const due = steps.filter((s) => s.state !== "notApplicable" && s.state !== "omitted");
  const complete = due.length > 0 && due.every((s) => s.state === "onTime");
  return {
    recognisedAt, steps, orderIssues, complete,
    why: complete
      ? `Az összes esedékes lépés határidőn belül megtörtént.`
      : `${due.filter((s) => s.state === "onTime").length}/${due.length} lépés ` +
        `időben; ${due.filter((s) => s.state === "overdue").length} lejárt, ` +
        `${due.filter((s) => s.state === "late").length} késett` +
        (orderIssues.length ? `, és ${orderIssues.length} sorrendi eltérés van` : "") + ".",
  };
}

/* ── A RIASZTÁS ÁTVÉTELE ────────────────────────────────────────────── */

export type AlertState = "issued" | "acknowledged" | "unacknowledged";

export interface AlertStatus {
  state: AlertState;
  why: string;
}

/**
 * „KIADVA" ≠ „ÁTVÉVE".
 *
 * A toolkit legfontosabb üzenete nem küszöbérték: a válaszút nélküli riasztás
 * rosszabb a semminél. Aki naponta háromszor kap figyelmeztetést, amire nincs
 * kihez fordulnia, két hét alatt megtanulja elkattintani — és akkor az igazit
 * is elkattintja.
 *
 * Ez pontosan az a szerkezet, amit a forrásrendszer leletlapjain találtunk:
 * „Megrendelve" és „Eredmény" két külön jelölőnégyzet, mert a kintlévőség
 * önálló állapot.
 */
export function alertStatus(
  p: SepsisProtocol, issuedAt: string, acknowledgedAt: string | null, now: string,
  rend?: EszkalaciosRend,
): AlertStatus {
  // A LÁNC, HA VAN. Enélkül ez a függvény tudta, hogy a ki nem vett riasztásnak
  // „egy szinttel feljebb” kell mennie — de azt nem, hogy MI van feljebb.
  const tipus = rend?.tipusok.find((t) => t.id === p.escalation.tipus);
  if (tipus) {
    const a = riasztasAllas(tipus, issuedAt, acknowledgedAt, now);
    const state: AlertState =
      a.allapot === "atveve" ? "acknowledged"
      : a.allapot === "kiadva" ? "issued"
      : "unacknowledged";
    return { state, why: a.miert };
  }
  if (acknowledgedAt) {
    const m = minutesBetween(issuedAt, acknowledgedAt);
    return { state: "acknowledged",
      why: `Átvéve ${m} perc alatt (határidő ${p.escalation.acknowledgeWithinMinutes} perc).` };
  }
  const m = minutesBetween(issuedAt, now);
  if (m > p.escalation.acknowledgeWithinMinutes) {
    return {
      state: "unacknowledged",
      why:
        `KIADVA, DE ${m} PERCE NINCS ÁTVÉVE (határidő ` +
        `${p.escalation.acknowledgeWithinMinutes} perc). A ki nem vett riasztás ` +
        `nem elintézett riasztás: magának is riasztást kell kiváltania, egy ` +
        `szinttel feljebb. Enélkül a rendszer azt hiszi, hogy szólt.`,
    };
  }
  return { state: "issued", why: `Kiadva ${m} perce, átvételre vár.` };
}
