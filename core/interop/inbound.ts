/**
 * A BEÉRKEZŐ EREDMÉNY KAPUI.
 *
 * A `core/import/` modul azt mondta ki, hogy a GÉPI KINYERÉS állítást ad, nem
 * adatot. Itt más a helyzet, és a különbséget ki kell mondani: egy AKKREDITÁLT
 * LABOR HL7-üzenete nem ugyanaz, mint egy PDF-ből kinyert szám. Az akkreditált
 * mérés proveniencia szerint `device` — a klinikus alatt, de a betegbemondás
 * fölött.
 *
 * A kapu tehát nem az, hogy „ember erősítse meg minden számot" — az
 * használhatatlan lenne, és a klinikus két nap alatt megtanulná végigkattintani.
 * A kapu az, hogy MELYIK BETEGÉ, MIRŐL SZÓL, MILYEN EGYSÉGBEN, és MŰKÖDÖTT-E
 * A MŰSZER.
 */
import type { Registry } from "../registry.ts";
import {
  matchPatient, type AdmitDecision, type IdentityClaim, type InboundResult,
} from "./types.ts";

export interface AdmitOptions {
  /** Amit a rekordból tudunk a betegről. */
  known: IdentityClaim;
  /** Csatornánként: elfogadható-e emberi jóváhagyás nélkül. */
  trustedSenders?: string[];
}

export function admitResult(
  reg: Registry, r: InboundResult, opts: AdmitOptions,
): AdmitDecision {
  /* ── 1. AZONOSSÁG ─────────────────────────────────────────────── */
  const m = matchPatient(r.identity, opts.known);
  if (m.outcome !== "match") {
    return {
      outcome: m.outcome === "review" ? "hold" : "reject",
      provenance: null, confidence: null, gate: "identity",
      why: `AZONOSÍTÁSI KAPU — ${m.why}`,
    };
  }

  /* ── 2. FOGALOM ───────────────────────────────────────────────── */
  const def = reg.get(r.variableId);
  if (!def) {
    return {
      outcome: "hold", provenance: null, confidence: null, gate: "concept",
      why: `ISMERETLEN CÉLVÁLTOZÓ (${r.variableId}). A leképezés elavult vagy ` +
           `hiányzik — az üzenet NEM dobható el, mert a lelet létezik: ` +
           `várakozó sorba kerül, amíg a leképezés el nem készül.`,
    };
  }
  const want = def.standards?.loinc;
  if (want && r.code?.system?.toLowerCase() === "loinc" && r.code.code !== want) {
    return {
      outcome: "hold", provenance: null, confidence: null, gate: "concept",
      why: `KÓDELTÉRÉS: az üzenet LOINC-kódja ${r.code.code}, a(z) ${r.variableId} ` +
           `változóé ${want}. Ez nem formaság — két hasonló nevű vizsgálat ` +
           `(pl. teljes vs. szabad hormonszint) más kóddal fut, és a ` +
           `felcserélésük klinikai döntést fordít meg.`,
    };
  }

  /* ── 3. MÉRTÉKEGYSÉG ──────────────────────────────────────────── */
  if (def.unit) {
    if (!r.unit) {
      return {
        outcome: "hold", provenance: null, confidence: null, gate: "unit",
        why: `EGYSÉG NÉLKÜLI SZÁM egy olyan változóhoz, aminek egysége van ` +
             `(${def.unit}). A rendszer NEM feltételezi, hogy a küldő ugyanazt ` +
             `az egységet használja — a néma átváltás a klasszikus gyilkos hiba.`,
      };
    }
    if (r.unit !== def.unit) {
      return {
        outcome: "hold", provenance: null, confidence: null, gate: "unit",
        why: `EGYSÉGELTÉRÉS: az üzenet ${r.unit}, a változó ${def.unit}. Az ` +
             `átváltás LEHET helyes, de csak nevesített, tesztelt átváltással — ` +
             `nem a határon, találgatásból.`,
      };
    }
  }

  /* ── 4. A MŰSZER ÁLLAPOTA ─────────────────────────────────────── */
  if (r.channel === "poct") {
    const qc = r.qc?.state ?? "unknown";
    if (qc !== "pass") {
      return {
        outcome: qc === "fail" ? "reject" : "hold",
        provenance: null, confidence: null, gate: "qc",
        why: qc === "fail"
          ? `A KÉSZÜLÉK MINŐSÉGELLENŐRZÉSE BUKOTT. Egy ilyen mérés nem ` +
            `„bizonytalan eredmény", hanem NEM EREDMÉNY — a rekordba nem kerül. ` +
            `A készülék ezt tudja; a mi dolgunk az, hogy elhozzuk az üzenettel.`
          : `A minőségellenőrzés állapota „${qc}”. A betegágy melletti mérés ` +
            `értéke a készülék kalibrációján áll; ismeretlen vagy lejárt QC ` +
            `mellett az eredmény nem használható döntésre.`,
      };
    }
  }

  /* ── BEFOGADÁS ────────────────────────────────────────────────── */
  const trusted = (opts.trustedSenders ?? []).includes(r.sender);
  return {
    outcome: "admit",
    // A MÉRÉS `device`, nem `imported`: az akkreditált labor műszere mért,
    // nem valaki átgépelte. A `clinician` alatt marad — a klinikus javítása
    // felülírja, és ez így helyes.
    provenance: "device",
    confidence: "measured",
    gate: null,
    why:
      `Mind a négy kapun átment: ${m.agreeing.join(" + ")} egyezik, a fogalom és ` +
      `az egység stimmel` + (r.channel === "poct" ? ", a QC rendben" : "") + `. ` +
      `Proveniencia: device (${r.sender}${trusted ? ", megbízható küldő" : ""}). ` +
      `A klinikus javítása ezt felülírja — a precedencia így helyes.`,
  };
}

/* ── A VÁRAKOZÓ SOR ─────────────────────────────────────────────────── */

export interface HeldMessage {
  messageId: string;
  receivedAt: string;
  channel: string;
  sender: string;
  variableId: string;
  gate: AdmitDecision["gate"];
  why: string;
  /** Ki és mikor nézte meg. `null` = még senki. */
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface QueueReport {
  total: number;
  oldestMinutes: number | null;
  byGate: Record<string, number>;
  overdue: HeldMessage[];
  why: string;
}

/**
 * AZ ELVESZETT LELET UGYANOLYAN KÁR, MINT A ROSSZ HELYRE TETT.
 *
 * Egy kapu, ami megállítja az üzenetet, és utána senki nem nézi meg, nem
 * biztonsági intézkedés, hanem csendes adatvesztés — csak lassabb. A
 * várakozó sornak ezért van KORA, és a kor önmagában riasztás.
 *
 * Ugyanaz a szerkezet, mint a forrásrendszer leletlapjain talált
 * „Megrendelve ≠ Eredmény" párnál: a kintlévőség önálló állapot, amit
 * valakinek utána kell járnia.
 */
export function queueReport(
  held: HeldMessage[], now: string, overdueMinutes = 240,
): QueueReport {
  const open = held.filter((h) => !h.reviewedAt);
  const age = (h: HeldMessage) =>
    Math.round((Date.parse(now) - Date.parse(h.receivedAt)) / 60000);
  const overdue = open.filter((h) => age(h) > overdueMinutes);
  const byGate: Record<string, number> = {};
  for (const h of open) byGate[h.gate ?? "—"] = (byGate[h.gate ?? "—"] ?? 0) + 1;
  const oldest = open.length ? Math.max(...open.map(age)) : null;

  return {
    total: open.length, oldestMinutes: oldest, byGate, overdue,
    why: !open.length
      ? "A várakozó sor üres: minden beérkezett lelet elintézett."
      : overdue.length
        ? `${overdue.length} LELET ${overdueMinutes} PERCNÉL RÉGEBBEN VÁR, a ` +
          `legrégebbi ${oldest} perce. Egy kapu, ami megállítja az üzenetet, és ` +
          `utána senki nem nézi meg, nem biztonsági intézkedés, hanem csendes ` +
          `adatvesztés — csak lassabb.`
        : `${open.length} lelet vár átnézésre, a legrégebbi ${oldest} perce, ` +
          `mind a határidőn belül.`,
  };
}
