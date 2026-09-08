/**
 * NEONATÁLIS OPIOID-MEGVONÁS (NOWS) — a funkció előbb, a pontszám utána.
 *
 * Az Eat-Sleep-Console megközelítés lényege a SORREND: előbb azt kérdezzük,
 * hogy a csecsemő ESZIK-E, ALSZIK-E és MEGNYUGTATHATÓ-E, és csak ha nem, akkor
 * jön a tünetpontozás. Ez nem stílus kérdése — az ESC-NOW vizsgálat
 * (NEJM 2023;388:2326, N=1305) szerint így 6,7 nappal rövidebb a kórházi
 * tartózkodás, és a farmakoterápia relatív kockázata 0,44.
 *
 * A Finnegan-skála tételeinek jó része nem specifikus (tüsszentés, izzadás),
 * és a pontszám alapján indított kezelés önmagában is hosszabbítja az ápolást.
 * A rendszer ezért nem a Finnegant kérdezi először.
 *
 * A második, kevésbé látványos, de veszélyesebb rész a MEGFIGYELÉSI IDŐ. A
 * tünetek kezdete a szertől függ: rövid hatásúnál 24–48 óra, metadonnál
 * 48–72 óra, akár 5–7 nap. A korábbi elbocsátás nem gyorsítja a gyógyulást —
 * csak áthelyezi a tüneteket az otthonba, ahol nincs, aki felismerje.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export type EscAnswer = "yes" | "no" | "unknown";

export interface EscAssessment {
  feeding: EscAnswer;
  sleeping: EscAnswer;
  consoling: EscAnswer;
  /** Mind a három igen → farmakoterápia NEM szükséges. */
  allFunctional: boolean;
  /** Bármelyik ismeretlen → nem dönthető el. */
  undetermined: boolean;
  recommendation: string;
  nonPharm: string[];
  source: string;
}

export interface FinneganAssessment {
  scores: number[];
  /** Teljesül-e a farmakoterápia küszöbe. */
  threshold: "met" | "notMet" | "insufficient";
  why: string;
  source: string;
}

export interface ObservationWindow {
  substance: string | null;
  minHours: number | null;
  /** Eltelt-e a megfigyelési idő. `null`, ha nem tudjuk. */
  elapsed: boolean | null;
  canDischarge: boolean;
  why: string;
  source: string;
}

const SRC_ESC =
  "Young LW et al. Eat, Sleep, Console approach or usual care for neonatal opioid " +
  "withdrawal. N Engl J Med 2023;388(25):2326-2337";
const SRC_ONSET =
  "Hudak ML, Tan RC; AAP Committee on Drugs. Neonatal drug withdrawal. " +
  "Pediatrics 2012;129(2):e540-e560";

function tri(reg: Registry, state: CaseState, id: string): EscAnswer {
  const r = resolve(reg, state, id);
  if (r.state !== "ok") return "unknown";
  return r.value === "pos" ? "yes" : r.value === "neg" ? "no" : "unknown";
}

export function assessEsc(reg: Registry, state: CaseState, _lang: Lang = "hu"): EscAssessment {
  const feeding = tri(reg, state, "neo.nows.esc.feeding");
  const sleeping = tri(reg, state, "neo.nows.esc.sleeping");
  const consoling = tri(reg, state, "neo.nows.esc.consoling");
  const answers = [feeding, sleeping, consoling];
  const undetermined = answers.includes("unknown");
  const allFunctional = answers.every((a) => a === "yes");

  const nonPharm = [
    "rooming-in — az anya és a csecsemő együtt maradása",
    "bőr-bőr kontaktus",
    "szoptatás, ha nincs ellenjavallat",
    "cumi felajánlása",
    "alacsony inger: halk, sötét környezet, kevés zavarás",
  ];

  return {
    feeding, sleeping, consoling, allFunctional, undetermined, nonPharm, source: SRC_ESC,
    recommendation: undetermined
      ? "A három funkcionális kérdés közül legalább egy NEM ismert, ezért a " +
        "döntés nem hozható meg. A hiányzó válasz NEM jelenti azt, hogy a " +
        "csecsemő jól van — az értékelést el kell végezni."
      : allFunctional
      ? "MIND A HÁROM FUNKCIÓ MEGFELELŐ: farmakoterápia NEM szükséges. A " +
        "nem-gyógyszeres csomag folytatandó, és az értékelés etetésenként " +
        "ismétlendő. A Finnegan-pontozás ilyenkor nem indokolt — egy magas " +
        "pontszám sem írja felül azt, hogy a csecsemő eszik, alszik és " +
        "megnyugtatható."
      : "Legalább egy funkció ELÉGTELEN. Először a nem-gyógyszeres csomagot kell " +
        "megerősíteni (rooming-in, bőr-bőr, alacsony inger), és csak ha ez " +
        "kimerült, akkor jön a tünetpontozás és a gyógyszeres kezelés " +
        "mérlegelése.",
  };
}

/**
 * Finnegan-küszöb: 3 egymást követő ≥ 8, VAGY 2 egymást követő átlaga ≥ 11.
 *
 * A `scores` a rögzítés SORRENDJÉBEN érkezik. Kevesebb mint két mérésből a
 * küszöb nem dönthető el — és ez nem „nem teljesül”.
 */
export function assessFinnegan(reg: Registry, state: CaseState): FinneganAssessment {
  const vals = state.values[reg.resolvePrimary("neo.nows.finnegan")] ?? [];
  const scores = vals
    .slice()
    .sort((a, b) => Date.parse(a.t) - Date.parse(b.t))
    .map((v) => Number(v.value))
    .filter((n) => Number.isFinite(n));

  const out = (threshold: FinneganAssessment["threshold"], why: string): FinneganAssessment =>
    ({ scores, threshold, why, source: SRC_ESC });

  if (scores.length < 2) {
    return out("insufficient",
      `A küszöb két egymást követő mérésből dönthető el; eddig ${scores.length} van. ` +
      `Ez NEM azt jelenti, hogy a küszöb nem teljesül.`);
  }
  for (let i = 0; i + 2 < scores.length; i++) {
    if (scores[i] >= 8 && scores[i + 1] >= 8 && scores[i + 2] >= 8) {
      return out("met", "Három egymást követő mérés ≥ 8 pont.");
    }
  }
  for (let i = 0; i + 1 < scores.length; i++) {
    if ((scores[i] + scores[i + 1]) / 2 >= 11) {
      return out("met", "Két egymást követő mérés átlaga ≥ 11 pont.");
    }
  }
  return out("notMet",
    "A küszöb egyik ága sem teljesül (3 egymást követő ≥ 8, vagy 2 egymást " +
    "követő átlaga ≥ 11).");
}

/** Szerenkénti minimális megfigyelési idő órában. */
const ONSET: Record<string, { hours: number; label: string; note: string }> = {
  heroin: {
    hours: 72, label: "heroin / rövid hatású opioid",
    note: "A tünetek 24–48 órán belül jelentkeznek; a 72 óra ezt biztonsággal lefedi.",
  },
  buprenorphine: {
    hours: 96, label: "buprenorfin",
    note: "A tünetek jellemzően 24–48 óra, de a hosszabb felezési idő miatt később is kezdődhetnek.",
  },
  methadone: {
    hours: 168, label: "metadon",
    note:
      "A tünetek kezdete 48–72 óra, DE AKÁR 5–7 NAP is lehet. A hét napos " +
      "megfigyelés nem óvatoskodás: a korábbi elbocsátás a tüneteket az otthonba " +
      "tolja, ahol nincs, aki felismerje.",
  },
  other: {
    hours: 168, label: "egyéb vagy több szer",
    note: "Ismeretlen vagy vegyes expozíciónál a leghosszabb ismert ablakot vesszük.",
  },
  none: { hours: 0, label: "nem volt expozíció", note: "Nincs megvonási megfigyelési igény." },
};

export function observationWindow(reg: Registry, state: CaseState): ObservationWindow {
  const sub = resolve(reg, state, "neo.nows.substance");
  const birth = resolve(reg, state, "nb.birth.at");

  if (sub.state !== "ok") {
    return {
      substance: null, minHours: null, elapsed: null, canDischarge: false,
      source: SRC_ONSET,
      why:
        "AZ EXPOZÍCIÓ TÍPUSA NEM ISMERT, ezért a megfigyelési idő nem " +
        "állapítható meg. A hiányzó adat itt nem jelent expozíciómentességet: " +
        "amíg nem tisztázott, az elbocsátás nem indokolható a megfigyelési idő " +
        "letelésével.",
    };
  }
  const spec = ONSET[String(sub.value)] ?? ONSET.other;
  if (spec.hours === 0) {
    return {
      substance: spec.label, minHours: 0, elapsed: true, canDischarge: true,
      why: spec.note, source: SRC_ONSET,
    };
  }

  let elapsed: boolean | null = null;
  let hoursSoFar: number | null = null;
  if (birth.state === "ok") {
    const t = Date.parse(String(birth.value));
    const now = Date.parse(state.ctx.now);
    if (Number.isFinite(t) && Number.isFinite(now)) {
      hoursSoFar = Math.floor((now - t) / 3_600_000);
      elapsed = hoursSoFar >= spec.hours;
    }
  }

  return {
    substance: spec.label, minHours: spec.hours, elapsed,
    canDischarge: elapsed === true,
    source: SRC_ONSET,
    why: elapsed == null
      ? `A születés időpontja (nb.birth.at) nem ismert, ezért nem állapítható ` +
        `meg, eltelt-e a ${spec.hours} órás megfigyelési idő. ${spec.note}`
      : elapsed
      ? `A ${spec.hours} órás megfigyelési idő eltelt (${hoursSoFar} óra). ${spec.note}`
      : `A MEGFIGYELÉSI IDŐ MÉG NEM TELT EL: ${hoursSoFar} óra a szükséges ` +
        `${spec.hours}-ból (${spec.label}). ${spec.note}`,
  };
}
