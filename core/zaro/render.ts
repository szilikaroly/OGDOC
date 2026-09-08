/**
 * A ZÁRÓJELENTÉS MEGJELENÍTÉSE — és a két dolog, ami a PAPÍRRA is rákerül.
 *
 * 1. A HITELESSÉGI FIGYELMEZTETÉS. Ha csak a felületen jelenne meg, a
 *    kinyomtatott lap ugyanúgy nézne ki, mint egy hiteles zárójelentés — és a
 *    papír kimegy a rendszerből. Ami nem szerepel a nyomaton, az nem létezik
 *    a beteg kezében.
 *
 * 2. A GENERÁLÁS MÓDJA. Nincs nyelvi modell a folyamatban; az olvasónak
 *    tudnia kell, hogy determinisztikus, szabályalapú összeállítást olvas.
 *
 * A kutatási változat KIHAGYJA a beteg-azonosító blokkot — nem elrejti,
 * hanem KIMONDJA, hogy kihagyta. Egy csendben eltűnt blokk később
 * megkülönböztethetetlen attól, ami sosem volt kitöltve.
 */
import type { DischargeSummary } from "./types.ts";

export interface RenderOpts {
  /** `care` — ellátási példány, beteg-azonosítóval. `research` — anonimizált. */
  kind?: "care" | "research";
}

export function render(d: DischargeSummary, opts: RenderOpts = {}): string {
  const kind = opts.kind ?? "care";
  const out: string[] = [];

  out.push(`# ${d.title}`, "");
  // A figyelmeztetés a dokumentum ELEJÉN áll, nem a láblécben: a második
  // oldalig sokan nem jutnak el.
  out.push(d.authenticity.status === "authentic" ? `> ${d.authenticity.notice}`
                                                 : `> **${d.authenticity.notice}**`, "");
  if (kind === "research") {
    out.push(
      "> KUTATÁSI PÉLDÁNY: a beteg-azonosító blokk KIMARADT. A kihagyás tényét " +
      "a dokumentum kimondja, mert egy csendben eltűnt blokk később nem " +
      "különböztethető meg attól, ami sosem volt kitöltve.", "",
    );
  }

  for (const b of d.blocks) {
    if (kind === "research" && b.phi) {
      out.push(`## ${b.title}`, "", "_— kutatási példányból kihagyva (beteg-azonosító) —_", "");
      continue;
    }
    out.push(`## ${b.title}`, "");
    if (b.state === "filled") {
      for (const s of b.segments) {
        const mark = s.severity === "redflag" ? "!! " : s.severity === "watch" ? "! " : "";
        out.push(`- ${mark}${s.text}`);
      }
    } else {
      // ITT DŐL EL AZ ELFOGADÁSI KRITÉRIUM: soha nincs üres rubrika.
      const tag = b.state === "notApplicable" ? "NEM VONATKOZIK RÁ" : "NINCS ADAT";
      out.push(`_${tag} — ${b.note}_`);
    }
    out.push("");
  }

  out.push("---", d.generation.note.hu ?? "");
  return out.join("\n");
}

/**
 * AZ ELFOGADÁSI KRITÉRIUM GÉPI ELLENŐRZÉSE.
 *
 * „Nem tartalmaz kitöltetlen sablonhelyet." Géppel ennyi ellenőrizhető
 * belőle: minden blokk vagy tartalmat hordoz, vagy INDOKLÁSSAL ELLÁTOTT
 * hiányt — és a megjelenített szöveg egyetlen üres szakaszt sem tartalmaz.
 */
export function slots(
  d: DischargeSummary,
): { ok: boolean; problems: Array<{ block: string; reason: string }> } {
  const problems: Array<{ block: string; reason: string }> = [];
  for (const b of d.blocks) {
    if (b.state === "filled") {
      if (!b.segments.length) problems.push({ block: b.id, reason: "kitöltöttként jelölt, üres blokk" });
      for (const s of b.segments) {
        if (!s.from.length) problems.push({ block: b.id, reason: `forrás nélküli állítás: ${s.text}` });
      }
      continue;
    }
    if (!b.note || !b.note.trim()) {
      problems.push({ block: b.id, reason: "üres blokk indoklás nélkül — ez a kitöltetlen sablonhely" });
    }
  }
  return { ok: problems.length === 0, problems };
}
