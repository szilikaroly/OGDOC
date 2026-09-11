/**
 * Az OKOSLELET összeállítása — SZABÁLYALAPÚ, nem nyelvi modell.
 *
 * A név szándékos. Az örökölt „AI lelet" félrevezető lett volna: nincs nyelvi
 * modell a folyamatban. Az „okoslelet" azt ígéri, ami igaz — a lelet magától
 * áll össze a rögzített adatból, minden állítása mögött ott a forrás, és
 * kimondja, mit nem tud. Nem intelligenciát ígér, hanem összeszedettséget.
 *
 * Négy alszekció: kockázatok · kimenetel · javaslatok · kódolás, plusz az
 * ötödik, ami a modul valódi tétje: **amit nem tudunk.**
 *
 * A négy forrás, amiből a hiány-szakasz épül:
 *   · az anamnézisben „nem tudom"-mal jelölt tételek;
 *   · minden `insufficient` státuszú score, a hiányzó bemenetekkel;
 *   · minden LEJÁRT érvényességű érték, amire számítás épült;
 *   · a `CaseState.errors[]` — ha egy modul nem futott le, az itt látszik.
 */
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import type { Epicrisis, EpicrisisSection, EpicrisisStyle, Segment } from "./types.ts";
import { resolve } from "../derive/resolve.ts";
import { CALC_BY_ID } from "../calc/defs.ts";
import { runCalc } from "../calc/run.ts";
import { interpret } from "../lab/reference.ts";
import { recommendations } from "../ui/output.ts";
import { withUnit } from "../ui/units.ts";

const L = (x: I18n | undefined, lang: Lang): string =>
  x?.[lang] ?? x?.hu ?? x?.en ?? "";

/** Egy változó emberi olvasatú alakja: „Címke: érték egység". */
function factText(reg: Registry, state: CaseState, id: string, lang: Lang): string | null {
  const def = reg.get(id);
  const r = resolve(reg, state, id);
  if (!def || r.state !== "ok") return null;
  let value = String(r.value);
  if (def.valueSet) {
    const opt = def.valueSet.find((o) => String(o.code) === String(r.value));
    if (opt) value = (lang === "en" ? opt.label_en : opt.label_hu) ?? value;
  }
  // A NYOMTATOTT leleten ember olvassa: a UCUM-kód megjelenítési alakja kell.
  return `${L(def.label, lang)}: ${withUnit(value, def.unit, lang)}`;
}

export interface BuildOpts {
  lang?: Lang;
  /** Mely score-okat vegyük végig. Alapértelmezés: minden regiszterbeli computed. */
  scores?: string[];
  /** Külső modulokból érkező szegmensek (szűrés, diéta, gyógyszerkapuk, kérdőívek). */
  extra?: EpicrisisSection[];
}

/**
 * Az epikrízis TARTALMA — stílustól függetlenül. A stílus csak azt dönti el,
 * mely szakaszok jelennek meg és milyen sorrendben, nem azt, mi igaz.
 */
export function buildEpicrisis(
  reg: Registry, state: CaseState, opts: BuildOpts = {},
): EpicrisisSection[] {
  const lang = opts.lang ?? "hu";
  const sections: EpicrisisSection[] = [];

  /* ── Kockázatok: nem újraszámol, ÖSSZEGYŰJT ─────────────────────────── */
  const risk: Segment[] = [];
  const gaps: Segment[] = [];

  const calcIds = opts.scores ?? reg.all()
    .filter((d) => d.derivation?.kind === "computed")
    .map((d) => (d.derivation as { calc: string }).calc);

  for (const calcId of [...new Set(calcIds)]) {
    const def = CALC_BY_ID.get(calcId);
    if (!def) continue;
    const r = runCalc(reg, state, calcId, lang);
    if (r.status === "ok") {
      // A megjelenítési alak a kalkulátor-rétegé (dátum → ISO-dátum): itt
      // volt egy második, helyi formázás, és a webes nézet egy harmadik hiánya.
      const shown = r.display;
      // A bemeneti PILLANATKÉP is bekerül: mit látott az algoritmus, amikor számolt.
      risk.push({
        kind: "score",
        text: `${L(def.label, lang)}: ${shown}` + (r.band ? ` — ${r.band.label}` : ""),
        from: [calcId, ...def.inputs.map((i) => i.id)],
        inputs: r.inputs,
        evidence: def.source.cite,
        severity: r.band?.severity ?? "normal",
      });
    } else {
      // AMIT ELKEZDTÜNK, DE NEM FEJEZTÜNK BE — ez információ. Amihez hozzá sem
      // kezdtünk, az nem az: egy praeeclampsiás sürgősségi felvételen senki nem
      // várt Apgar-pontszámot vagy hirsutismus-score-t, és ha mindegyik
      // megjelenne „nem számolható" felirattal, a szakasz használhatatlanná
      // válna — épp az veszne el benne, ami valóban hiányzik.
      //
      // A szabály: akkor jelenik meg, ha a bemenetek KÖZÜL LEGALÁBB EGY
      // rögzült, vagy a hívó kifejezetten kérte ezt a score-t.
      // A `ctx.now`-t a motor MINDEN esetre beírja, tehát önmagában nem
      // bizonyítja, hogy bárki hozzákezdett volna a számításhoz. Ezért a
      // levezetett eredetű bemenetek nem számítanak — ugyanaz a
      // megkülönböztetés, mint a click-open mérőszámnál.
      const started = def.inputs.some((i) => {
        const r = resolve(reg, state, i.id);
        return r.state !== "missing" && r.provenance !== "derived";
      });
      if (started || opts.scores?.includes(calcId)) {
        gaps.push({
          kind: "gap",
          text: `${L(def.label, lang)}: nem számolható — ${r.reason}`,
          from: [calcId, ...r.missing],
          evidence: def.source.cite,
          severity: "watch",
        });
      }
    }
  }

  // Vörös zászlós rögzített értékek.
  for (const d of reg.all()) {
    if (d.aliasOf || !d.valueSet) continue;
    const r = resolve(reg, state, d.id);
    if (r.state !== "ok") continue;
    const opt = d.valueSet.find((o) => String(o.code) === String(r.value));
    if (opt?.flags?.includes("redflag")) {
      risk.push({
        kind: "risk",
        text: `${L(d.label, lang)}: ${(lang === "en" ? opt.label_en : opt.label_hu) ?? opt.code}`,
        from: [d.id], severity: "redflag",
      });
    }
  }

  // Laboreltérések a KONTEXTUSHOZ tartozó referencia szerint.
  for (const d of reg.all()) {
    if (!d.reference) continue;
    const i = interpret(reg, state, d.id);
    if (i.status !== "ok" || i.reading === "normal") continue;
    risk.push({
      kind: "fact",
      text: `${L(d.label, lang)}: ${withUnit(String(i.value), d.unit, lang)} — ` +
            `${i.reading === "low" ? "a referencia alatt" : "a referencia felett"} ` +
            `(${i.context}: ${i.range.low ?? "—"}–${i.range.high ?? "—"})`,
      from: [d.id], evidence: i.source.cite, severity: "watch",
    });
  }

  if (risk.length) sections.push({ id: "risk", title: "Kockázatok", segments: risk });

  /* ── Javaslatok: a teendőmotor kimenete, kiváltó mezővel ────────────── */
  const recs = recommendations(reg, state, lang).map((r): Segment => ({
    kind: "recommendation",
    text: `${r.text} (${r.fromLabel})`,
    from: [r.from],
    severity: r.urgency === "urgent" ? "redflag" : r.urgency === "soon" ? "watch" : "normal",
  }));
  if (recs.length) sections.push({ id: "recommendation", title: "Javaslatok", segments: recs });

  /* ── Külső modulok szakaszai ────────────────────────────────────────── */
  for (const s of opts.extra ?? []) if (s.segments.length) sections.push(s);

  /* ── AMIT NEM TUDUNK ────────────────────────────────────────────────── */

  // 1. A „nem tudom" válaszok — nem elhallgatva.
  for (const d of reg.all()) {
    if (d.aliasOf || !d.valueSet) continue;
    const r = resolve(reg, state, d.id);
    if (r.state !== "ok") continue;
    const opt = d.valueSet.find((o) => String(o.code) === String(r.value));
    if (opt?.flags?.includes("unknown")) {
      gaps.push({
        kind: "gap",
        text: `${L(d.label, lang)}: a beteg nem tudta megmondani`,
        from: [d.id],
      });
    }
  }

  // 2. Lejárt érvényességű értékek, amikre számítás épülhetett.
  for (const d of reg.all()) {
    if (d.aliasOf) continue;
    const r = resolve(reg, state, d.id);
    if (r.state !== "stale") continue;
    const days = Math.round((r.ageMs ?? 0) / 86_400_000);
    gaps.push({
      kind: "gap",
      text: `${L(d.label, lang)}: az érték LEJÁRT (${days} napja rögzült), ` +
            `ezért számításban nem használható`,
      from: [d.id], severity: "watch",
    });
  }

  // 3. Ami a feldolgozás közben elromlott.
  for (const e of state.errors ?? []) {
    gaps.push({
      kind: "gap",
      text: `Feldolgozási hiba: ${e.message}`,
      from: [e.where], severity: "redflag",
    });
  }

  if (gaps.length) {
    sections.push({
      id: "gap",
      title: "Amit nem tudunk",
      segments: gaps,
    });
  }

  return sections;
}

/** Melyik stílus mely szakaszokat viszi, milyen sorrendben. */
const STYLE_SECTIONS: Record<EpicrisisStyle, { order: string[]; title: string }> = {
  clinical: {
    order: ["risk", "outcome", "recommendation", "coding", "gap"],
    title: "Klinikai narratíva",
  },
  // SBAR: a helyzet és a háttér a kockázatokból, az értékelés a score-okból,
  // az ajánlás a teendőkből. A hiány-szakasz IDE IS KELL: átadáskor a legtöbb
  // kár abból származik, amit az átadó tudott, de nem mondott.
  sbar: { order: ["risk", "gap", "recommendation"], title: "SBAR átadás" },
  discharge: {
    order: ["outcome", "risk", "recommendation", "coding", "gap"],
    title: "Zárójelentés (nyers tartalom)",
  },
  nursing: { order: ["outcome", "recommendation", "gap"], title: "Ápolói összefoglaló" },
  consult: { order: ["risk", "gap", "recommendation"], title: "Konzulensi kérés" },
};

export function epicrisis(
  reg: Registry, state: CaseState, style: EpicrisisStyle, opts: BuildOpts = {},
): Epicrisis {
  const all = buildEpicrisis(reg, state, opts);
  const spec = STYLE_SECTIONS[style];
  const sections = spec.order
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is EpicrisisSection => !!s);

  return {
    style, name: "Okoslelet", title: spec.title, sections,
    generation: {
      method: "rule-based",
      note: {
        hu:
          "OKOSLELET — SZABÁLYALAPÚ GENERÁLÁS, nincs nyelvi modell a folyamatban. A szöveg " +
          "determinisztikusan, a rögzített adatokból épül; minden állítás mögött " +
          "ott a forrásváltozó. Ez kevesebbet és többet is jelent, mint egy " +
          "nyelvi modell kimenete: nem fogalmaz szabadon, de nem is állít " +
          "olyat, ami nincs az adatban.",
        en:
          "Rule-based generation — no language model is involved. Every " +
          "statement carries the variable it came from.",
      },
      at: state.ctx.now,
    },
  };
}

/** Egyszerű szöveges megjelenítés — a felület ennél többet is tud majd. */
export function render(e: Epicrisis): string {
  const out: string[] = [`# ${e.name} — ${e.title}`, ""];
  for (const s of e.sections) {
    out.push(`## ${s.title}`, "");
    for (const seg of s.segments) {
      const mark = seg.severity === "redflag" ? "!! " : seg.severity === "watch" ? "! " : "";
      out.push(`- ${mark}${seg.text}`);
    }
    out.push("");
  }
  out.push("---", e.generation.note.hu ?? "");
  return out.join("\n");
}

/**
 * AZ ELFOGADÁSI KRITÉRIUM GÉPI ELLENŐRZÉSE: minden szegmens visszavezethető-e.
 *
 * „A klinikai narratíva nem tartalmaz olyan állítást, ami nincs a rögzített
 * adatban" — géppel ennyi ellenőrizhető belőle: minden szegmensnek van
 * forrása, és minden forrás LÉTEZŐ változó, kalkulátor vagy hibahely.
 */
export function traceability(
  reg: Registry, e: Epicrisis,
): { ok: boolean; problems: Array<{ text: string; reason: string }> } {
  const problems: Array<{ text: string; reason: string }> = [];
  for (const s of e.sections) {
    for (const seg of s.segments) {
      if (!seg.from.length) {
        problems.push({ text: seg.text, reason: "nincs forrás megadva" });
        continue;
      }
      for (const f of seg.from) {
        const known = reg.get(f) || CALC_BY_ID.has(f) || f.includes(".");
        if (!known) {
          problems.push({ text: seg.text, reason: `ismeretlen forrás: ${f}` });
        }
      }
    }
  }
  return { ok: problems.length === 0, problems };
}
