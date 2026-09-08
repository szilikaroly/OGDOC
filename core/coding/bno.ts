/**
 * BNO-KÓDALAKOK — a jelentési alak és a rövidített alak nem ugyanaz.
 *
 * A BNO-10 magyar törzsnek TÖBB ALAKJA VAN, és ez csendben rontja el a
 * jelentéseket:
 *
 *   O14      kategória (WHO)
 *   O141     alkategória (WHO) — a régi BNOX 3.4 törzs eddig tartott
 *   O1410    JELENTÉSI ALAK — a hazai finanszírozás ezt várja
 *
 * A betöltött törzs (BNOTORZS, 2025-01) KIZÁRÓLAG a jelentési alakot
 * tartalmazza. Egy régebbi rendszerből átvett „O141" tehát nem hibás kód,
 * csak nem jelentési alakú — és a különbség nem formaiság: az O80
 * alkategóriának NÉGY jelentési alakja van, és nem mindegy, melyiket
 * jelentjük.
 *
 * Ezért a feloldás NEM tippel. Ha egy rövidebb alakhoz PONTOSAN EGY
 * jelentési alak tartozik a törzsben, azt adja vissza; ha több, kimondja,
 * hogy TÖBBÉRTELMŰ, és felsorolja a lehetőségeket — a választás emberi
 * döntés. Az „O80 → O8000, mert az az első" nem feloldás, hanem találgatás.
 */
import { getTable } from "./tables.ts";

export type BnoFormStatus =
  /** A kód már jelentési alakú, és szerepel a törzsben. */
  | "reporting"
  /** Rövidített alak, amelyhez pontosan egy jelentési alak tartozik. */
  | "resolved"
  /** Rövidített alak, amelyhez TÖBB jelentési alak tartozik — emberi döntés. */
  | "ambiguous"
  /** Sem jelentési alak, sem feloldható rövidítés. */
  | "unknown"
  /** A törzs nincs betöltve. */
  | "noTable";

export interface BnoForm {
  input: string;
  status: BnoFormStatus;
  /** A jelentési alak, ha egyértelmű. */
  code: string | null;
  label: string | null;
  /** Több lehetőség esetén mindegyik, megnevezéssel. */
  candidates: Array<{ code: string; label: string }>;
  why: string;
}

/** A hazai jelentési alak: betű + négy karakter. */
const REPORTING = /^[A-Z][0-9A-Z]{4}$/;

/**
 * Egy BNO-kód jelentési alakja a betöltött törzs szerint.
 *
 * A pontot elfogadja bemenetként (O14.1), mert a szakirodalom így írja — a
 * törzs viszont pont nélkül tárol, és a kimenet is pont nélküli.
 */
export function bnoReportingForm(raw: string): BnoForm {
  const input = String(raw ?? "").trim().toUpperCase().replace(/\./g, "");
  const t = getTable("tbl.bno");
  const none: Array<{ code: string; label: string }> = [];
  if (!t) {
    return {
      input, status: "noTable", code: null, label: null, candidates: none,
      why: "A BNO-törzs nincs betöltve, ezért a kódalak nem oldható fel.",
    };
  }
  const direct = t.rows[input];
  if (direct && REPORTING.test(input)) {
    return {
      input, status: "reporting", code: input, label: direct.label ?? "", candidates: none,
      why: `A(z) ${input} már jelentési alakú.`,
    };
  }
  const cands = Object.keys(t.rows)
    .filter((k) => k.length === 5 && k.startsWith(input))
    .sort()
    .map((k) => ({ code: k, label: t.rows[k].label ?? "" }));
  if (cands.length === 1) {
    return {
      input, status: "resolved", code: cands[0].code, label: cands[0].label, candidates: cands,
      why:
        `A(z) ${input} rövidített alakhoz a törzsben egyetlen jelentési alak ` +
        `tartozik: ${cands[0].code} („${cands[0].label}”).`,
    };
  }
  if (cands.length > 1) {
    return {
      input, status: "ambiguous", code: null, label: null, candidates: cands,
      why:
        `A(z) ${input} rövidített alakhoz ${cands.length} jelentési alak ` +
        `tartozik (${cands.map((c) => c.code).join(", ")}). A rendszer NEM ` +
        `választ helyetted: a kettő nem ugyanazt állítja.`,
    };
  }
  return {
    input, status: "unknown", code: null, label: null, candidates: none,
    why: `A(z) ${input} sem jelentési alakként, sem rövidítésként nem szerepel a törzsben.`,
  };
}
