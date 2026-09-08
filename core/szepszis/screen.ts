/**
 * SZÜLÉSZETI SZEPSZIS — a háromlépéses felismerés motorja.
 *
 * A modul a kritériumokat ADATBÓL olvassa (`registry/szepszis/`), nem kódból:
 * egy küszöb módosításához nem szabad kódot írni. Ugyanaz az elv, mint a
 * szűrési szabályoknál és a panaszszótár vörös zászlóinál.
 */
import { readFileSync } from "node:fs";
import type { CaseState } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import type {
  Criterion, CritResult, CriterionSet, SepsisProtocol, SetResult,
} from "./types.ts";
import type { KapuAllapot } from "./kuszob.ts";

export function loadProtocol(path: string): SepsisProtocol {
  return JSON.parse(readFileSync(path, "utf8")) as SepsisProtocol;
}

/** A vizsgálat élettani körülményei — a küszöb ezektől függ. */
export interface Circumstances {
  /** `pos` · `neg` · `unknown`. Ismeretlennél a szűrés NEM fut. */
  pregnancy?: "pos" | "neg" | "unknown";
  /** Napok a szülés óta. A gyermekágy a szűrés hatálya alatt marad. */
  daysPostpartum?: number | null;
  /** Vajúdás alatt a fehérvérsejtszám és a laktát nem értékelhető. */
  inLabour?: boolean;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function judge(c: Criterion, value: unknown): { ok: boolean; why: string } {
  if (c.op === "eq") return { ok: value === c.value, why: `= ${String(c.value)}` };
  if (c.op === "notEq") return { ok: value !== c.value, why: `≠ ${String(c.value)}` };
  const n = num(value);
  if (n === null) return { ok: false, why: "nem szám" };
  switch (c.op) {
    case "gt":  return { ok: n > (c.value as number),  why: `> ${c.value}` };
    case "gte": return { ok: n >= (c.value as number), why: `≥ ${c.value}` };
    case "lt":  return { ok: n < (c.value as number),  why: `< ${c.value}` };
    case "lte": return { ok: n <= (c.value as number), why: `≤ ${c.value}` };
    case "outside":
      return { ok: n < (c.low as number) || n > (c.high as number),
               why: `${c.low}–${c.high} tartományon kívül` };
  }
}

function evaluate(
  reg: Registry, state: CaseState, c: Criterion, circ: Circumstances,
): CritResult {
  const label = c.label.hu ?? c.id;

  // A VAJÚDÁS NEM TESZI NORMÁLISSÁ AZ ÉRTÉKET — kiveszi a szűrésből.
  // A kettő nem ugyanaz: a „normális" megnyugtat, a „nem értékelhető" nem.
  if (c.suspendDuring === "labour" && circ.inLabour) {
    return {
      id: c.id, var: c.var, label, state: "notAssessable", value: null,
      why:
        `NEM ÉRTÉKELHETŐ VAJÚDÁS ALATT: a szülés élettanilag megváltoztatja ezt ` +
        `az értéket. A rendszer ezért kiveszi a szűrésből — nem „normálisnak” ` +
        `minősíti, mert az megnyugtató lenne, holott nem tudunk semmit.`,
    };
  }

  const r = resolve(reg, state, c.var);
  if (r.state !== "ok" || r.value === null || r.value === undefined) {
    return {
      id: c.id, var: c.var, label, state: "missing", value: null,
      why:
        `HIÁNYZIK (${c.var}). A hiányzó élettani érték nem negatív tétel: a ` +
        `szűrés emiatt nem tud teljes lenni, és ezt a rendszer kimondja.`,
    };
  }
  const j = judge(c, r.value);
  return {
    id: c.id, var: c.var, label, state: j.ok ? "positive" : "negative",
    value: r.value,
    why: `${String(r.value)}${c.unit ? " " + c.unit : ""} ${j.ok ? "" : "nem "}${j.why}`,
  };
}

export function evaluateSet(
  reg: Registry, state: CaseState, set: CriterionSet, circ: Circumstances,
): SetResult {
  const results = set.criteria.map((c) => evaluate(reg, state, c, circ));
  const met = results.filter((r) => r.state === "positive").length;
  const unknown = results.filter((r) => r.state === "missing" || r.state === "notAssessable").length;
  const positive = met >= set.needed;

  // A KÜSZÖB ALATTI EREDMÉNY NEM NEGATÍV LELET, ha annyi tétel hiányzik, hogy
  // azokkal a küszöb még elérhető lenne. Ez ugyanaz a szabály, mint a
  // score-oknál: hiányzó bemenetnél `insufficient`, nem nulla.
  const indeterminate = !positive && met + unknown >= set.needed;

  return {
    met, needed: set.needed, positive, indeterminate, results,
    why: positive
      ? `${met}/${set.needed} tétel teljesül — a küszöb elérve.`
      : indeterminate
        ? `${met}/${set.needed} teljesül, de ${unknown} tétel ismeretlen vagy nem ` +
          `értékelhető. A küszöb velük ELÉRHETŐ LENNE — az eredmény tehát NEM ` +
          `negatív, hanem eldöntetlen.`
        : `${met}/${set.needed} teljesül, és a hiányzó tételekkel sem érhető el ` +
          `a küszöb.`,
  };
}

/* ── A TELJES MEGÍTÉLÉS ─────────────────────────────────────────────── */

export type SepsisState =
  | "notRun"           // nem futott (ismeretlen terhességi állapot vagy hatályon kívül)
  | "screenNegative"
  | "screenIndeterminate"
  | "awaitingSource"   // szűrőpozitív, de a góc kérdésére nincs emberi válasz
  | "infectionNoOrganDysfunction"
  | "sepsis"
  | "sepsisIndeterminate";

export interface SepsisAssessment {
  state: SepsisState;
  /** Igaz, ha ebből riasztás INDULHAT. Hitelesítetlen protokollnál sosem. */
  alerts: boolean;
  screen: SetResult | null;
  organ: SetResult | null;
  why: string;
  /** Amit a rendszer NEM tud, és ezért nem hallgat el. */
  gaps: string[];
}

/**
 * A középső lépés — GYANÍTOTT FERTŐZÉSES GÓC — nem mérésből jön.
 *
 * Ezt a rendszer nem következteti ki: megkérdezi, és a választ a döntést hozó
 * személyhez köti. A `null` nem „nincs góc", hanem „még nem kérdeztük meg".
 */
export type SourceSuspicion = { suspected: boolean; by: string; at: string } | null;

/**
 * A RIASZTÁSI KAPU KÍVÜLRŐL JÖN, ÉS ALAPÉRTELMEZÉSBEN ZÁRVA VAN.
 *
 * Korábban a `blocksAlerting` logikai mező döntött, egyedül. Az a jelölés
 * viszont egyetlen JSON-szerkesztéssel átírható volt, és semmi nem kötötte
 * ahhoz, hogy a küszöböket bárki összevetette-e az elsődleges forrással: egy
 * `false` és a rendszer riasztani kezdett hitelesítetlen határértékekre.
 *
 * Mostantól a kaput a 9. lépés aláírási rétege nyitja (`riasztasEngedve`), és
 * ha a hívó nem ad kaput, a válasz ZÁRVA — nem azért, mert a protokoll tiltja,
 * hanem mert senki nem mutatott fel engedélyt. A fail-safe irány itt egyetlen
 * dolgot jelenthet: a meg nem indokolt riasztás nem indul el.
 */
const ZART: KapuAllapot = {
  engedve: false,
  miert:
    "RIASZTÁS NEM INDUL: a hívó nem adott át riasztási kaput. A kaput a " +
    "küszöbök aláírása nyitja (`riasztasEngedve`), és hiányában a válasz nem " +
    "„valószínűleg szabad”, hanem „zárva”.",
};

export function assess(
  reg: Registry, state: CaseState, p: SepsisProtocol,
  circ: Circumstances, source: SourceSuspicion = null,
  kapu: KapuAllapot | null = null,
): SepsisAssessment {
  const gaps: string[] = [];
  const gate = kapu ?? ZART;

  if (p.verification !== "primary") {
    gaps.push(
      `A PROTOKOLL HITELESÍTETLEN (${p.verification}): ` +
      (p.verificationNote?.hu ?? "a küszöbértékek elsődleges forrásból nincsenek visszaellenőrizve."),
    );
  }

  // 1. HATÁLY. Ismeretlen terhességi állapotnál a szűrés nem fut, és nem esik
  //    vissza a nem terhes sávra.
  const preg = circ.pregnancy ?? "unknown";
  if (p.requiresPregnancyState && preg === "unknown") {
    return {
      state: "notRun", alerts: false, screen: null, organ: null,
      gaps: [...gaps, "A terhességi állapot ismeretlen."],
      why:
        `A SZŰRÉS NEM FUT: a terhességi állapot ismeretlen. ` +
        (p.requiresPregnancyStateNote?.hu ?? ""),
    };
  }
  const pp = circ.daysPostpartum ?? null;
  const inScope = preg === "pos" || (pp !== null && pp <= p.postpartumWindowDays);
  if (!inScope) {
    return {
      state: "notRun", alerts: false, screen: null, organ: null, gaps,
      why:
        `A SZŰRÉS HATÁLYÁN KÍVÜL: nem terhes, és a szülés óta eltelt idő ` +
        `${pp === null ? "ismeretlen" : pp + " nap"} — a szülészeti szűrő a ` +
        `gyermekágy ${p.postpartumWindowDays}. napjáig él. Ez nem azt jelenti, ` +
        `hogy a beteg nem szeptikus: azt, hogy erre a kérdésre az ÁLTALÁNOS ` +
        `szepszisszűrő való, nem ez.`,
    };
  }

  // 2. ÉLETTANI SZŰRÉS.
  const screen = evaluateSet(reg, state, p.screen, circ);
  // A JELÖLÉS TILTHAT, DE NEM ENGEDHET. A `blocksAlerting` továbbra is le tudja
  // állítani a riasztást aláírás mellett is; bekapcsolni azonban nem tudja —
  // ahhoz aláírás kell. A tiltás erősebb, mint az engedély.
  const alerts = gate.engedve && !p.blocksAlerting;
  if (!alerts) {
    gaps.push(p.blocksAlerting && gate.engedve
      ? "RIASZTÁS NEM INDUL: a küszöbök alá vannak írva, de a protokoll " +
        "`blocksAlerting` jelölése kikapcsolja a riasztást."
      : gate.miert);
  }

  if (screen.indeterminate) {
    return { state: "screenIndeterminate", alerts: false, screen, organ: null, gaps,
      why: screen.why };
  }
  if (!screen.positive) {
    return { state: "screenNegative", alerts: false, screen, organ: null, gaps,
      why: screen.why };
  }

  // 3. A GÓC KÉRDÉSE — EMBERI DÖNTÉS.
  if (source === null) {
    return {
      state: "awaitingSource", alerts, screen, organ: null, gaps,
      why:
        `SZŰRŐPOZITÍV (${screen.met}/${screen.needed}), és a következő lépés ` +
        `NEM SZÁMÍTÁS: van-e gyanítható fertőzéses góc? Erre a kérdésre a ` +
        `rendszer nem felel a beteg helyett és a klinikus helyett sem. A ` +
        `válasz hiánya nem „nincs góc” — a kérdés még nem hangzott el.`,
    };
  }
  if (!source.suspected) {
    return {
      state: "screenNegative", alerts: false, screen, organ: null, gaps,
      why:
        `Szűrőpozitív élettani kép, de ${source.by} ${source.at} időpontban ` +
        `úgy ítélte meg, hogy fertőzéses góc nem gyanítható. A döntés a ` +
        `rekordban marad — nem a hiánya, hanem maga a döntés.`,
    };
  }

  // 4. SZERVI ELÉGTELENSÉG.
  const organ = evaluateSet(reg, state, p.organDysfunction, circ);
  if (organ.positive) {
    return {
      state: "sepsis", alerts, screen, organ, gaps,
      why:
        `SZEPSZIS: szűrőpozitív élettani kép, gyanított fertőzéses góc ` +
        `(${source.by}), és szervi elégtelenség (${organ.met}/${organ.needed}). ` +
        `Az órához kötött csomag ettől a pillanattól ketyeg.`,
    };
  }
  if (organ.indeterminate) {
    return {
      state: "sepsisIndeterminate", alerts, screen, organ, gaps,
      why:
        `A SZEPSZIS NEM ZÁRHATÓ KI: fertőzésgyanú mellett a szervi elégtelenség ` +
        `kérdése eldöntetlen, mert a szükséges vizsgálatok hiányoznak. ` +
        `${organ.why}`,
    };
  }
  return {
    state: "infectionNoOrganDysfunction", alerts, screen, organ, gaps,
    why:
      `Fertőzésgyanú szervi elégtelenség nélkül. Ez NEM megnyugtató végállapot: ` +
      `a szepszis órák alatt alakul ki, tehát a megítélést ismételni kell.`,
  };
}

/* ── INTEGRITÁS ─────────────────────────────────────────────────────── */

export function validateProtocol(p: SepsisProtocol, reg: Registry): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const all = [...p.screen.criteria, ...p.organDysfunction.criteria];
  for (const c of all) {
    if (!reg.get(c.var)) {
      out.push({ severity: "error", id: c.id,
        message: `ismeretlen változó: ${c.var} — az elavult hivatkozás rosszabb a hiányzónál` });
      continue;
    }
    const def = reg.get(c.var)!;
    if (c.unit && def.unit && c.unit !== def.unit) {
      out.push({ severity: "error", id: c.id,
        message: `egységeltérés: a kritérium ${c.unit}, a változó ${def.unit} — ` +
                 `a néma átváltás a legveszélyesebb hiba` });
    }
    if (c.op === "outside" && (c.low === undefined || c.high === undefined)) {
      out.push({ severity: "error", id: c.id, message: "tartomány-kritérium alsó vagy felső határ nélkül" });
    }
  }
  // KETTŐS SZÁMOLÁS: ha egy készleten belül az egyik tétel változója a
  // másikéból LEVEZETETT, akkor egyetlen mérés két tételt visz be a
  // küszöbbe. A vérnyomásból számított középnyomás pontosan ilyen: a
  // systolés érték és a MAP ugyanabból a mandzsettából jön.
  for (const set of [p.screen, p.organDysfunction]) {
    const vars = new Set(set.criteria.map((c) => c.var));
    for (const c of set.criteria) {
      const inputs = reg.get(c.var) ? reg.computedInputs(c.var) : [];
      const overlap = inputs.filter((i) => vars.has(i));
      if (overlap.length) {
        out.push({
          severity: "warning", id: c.id,
          message:
            `kettős számolás: a(z) ${c.var} a(z) ${overlap.join(", ")} ` +
            `értékből LEVEZETETT, és mindkettő ugyanabban a készletben van — ` +
            `egyetlen mérés két tételt vinne a küszöbbe`,
        });
      }
    }
  }

  for (const set of [p.screen, p.organDysfunction]) {
    if (set.needed > set.criteria.length) {
      out.push({ severity: "error", id: set.id,
        message: `a küszöb (${set.needed}) nagyobb, mint a tételek száma (${set.criteria.length}) — soha nem teljesülhet` });
    }
  }
  const ids = new Set(p.bundle.steps.map((s) => s.id));
  for (const s of p.bundle.steps) {
    for (const ref of [s.before, s.conditionalOn]) {
      if (ref && !ids.has(ref)) {
        out.push({ severity: "error", id: s.id, message: `ismeretlen csomaglépésre hivatkozik: ${ref}` });
      }
    }
  }
  // KÉT KÜSZÖB UGYANARRA A MÉRÉSRE — a levezetett listát a 9. lépés rétege adja
  // (`core/szepszis/kuszob.ts`), NEM ez a függvény. A különbség nem stiláris:
  // az itt korábban kiírt figyelmeztetés a `conflict` mező KÉZZEL ÍRT mondatát
  // visszhangozta, ami akkor is változatlanul „> 24 vs > 20”-at hirdetett
  // volna, ha közben valaki a küszöböt átírja. A próza nem tud hangosan
  // elavulni; a két élő definícióból levezetett eltérés igen.

  if (p.verification !== "primary" && !p.blocksAlerting) {
    out.push({ severity: "error", id: p.id,
      message: "hitelesítetlen protokoll riasztást adna ki — a kapu előbb van, mint az adat" });
  }
  if (p.verification !== "primary") {
    out.push({ severity: "warning", id: p.id,
      message: `a szepszisprotokoll ${p.verification} szintű — riasztást nem ad, ` +
               `a hitelesítés klinikai szakértői feladat` });
  }
  return out;
}
