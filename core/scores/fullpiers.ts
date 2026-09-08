/**
 * fullPIERS — 48 órán belüli súlyos anyai szövődmény valószínűsége preeclampsiában.
 *
 * Forrás: von Dadelszen P et al. Lancet 2011;377:219–227.  n=2023, AUC 0,88.
 *
 * A modul legfontosabb tulajdonsága nem a képlet, hanem az, hogy MIT CSINÁL
 * HIÁNYZÓ BEMENETNÉL: nem számol. Egy fullPIERS, amelyben az AST hiányzik és
 * nullaként szerepel, rosszabb, mint semmilyen fullPIERS — mert számot mutat.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FIGYELEM — AZ EGYÜTTHATÓK NINCSENEK VISSZAELLENŐRIZVE A PUBLIKÁCIÓVAL.
 *
 * Az alábbi együtthatók az IPRACS fejlesztői dokumentációjából származnak.
 * A prototípus golden-tesztje kimutatta, hogy ezekkel a modell KLINIKAILAG
 * FORDÍTVA viselkedik: a súlyosabb beteg (magasabb AST, alacsonyabb PLT)
 * ALACSONYABB kockázatot kap, mert a négyzetes tagok elnyomnak minden mást.
 *
 *   AST 110  → az AST² tag  −7,2
 *   AST 320  → az AST² tag −60,6
 *   AST 600  → az AST² tag −213,1
 *
 * Amíg ez nincs tisztázva a von Dadelszen 2011 közleménnyel szemben, a
 * függvény NEM ad eredményt: `insufficient`-et ad, megnevezve az okot.
 * Ez ugyanaz az elv, mint a hiányzó bemenetnél — csak itt a KÉPLET hiányzik.
 * ld. docs/04-utemterv.md M7, „referencia-fixture a publikált példaszámításból"
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { CaseState, ScoreResult } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/engine.ts";
import { round } from "../derive/fns.ts";

/**
 * Amíg false, a score nem ad számot. A Fázis 3 (M7) feladata a publikációval
 * való összevetés; addig ez a kapcsoló marad hamis.
 */
export const COEFFICIENTS_VERIFIED = false;

export const FULLPIERS_INPUTS = {
  ga: "ctx.ga",
  chestPainDyspnea: "sym.chestPainDyspnea",
  spo2: "vitals.spo2",
  plt: "lab.plt",
  cr: "lab.cr",
  ast: "lab.ast",
} as const;

export function fullPiers(reg: Registry, state: CaseState): ScoreResult {
  const missing: string[] = [];
  const inputs: Record<string, unknown> = {};
  const got: Record<string, number> = {};

  for (const [key, id] of Object.entries(FULLPIERS_INPUTS)) {
    const r = resolve(reg, state, id);
    inputs[id] = { value: r.value, state: r.state, t: r.t, provenance: r.provenance };
    if (r.state !== "ok" || r.value == null) {
      missing.push(id);
      continue;
    }
    got[key] = typeof r.value === "boolean" ? (r.value ? 1 : 0) : Number(r.value);
  }

  if (missing.length > 0) {
    const stale = missing.filter((id) => (inputs[id] as any)?.state === "stale");
    return {
      status: "insufficient",
      missing,
      reason: stale.length
        ? `Hiányzó vagy lejárt bemenet: ${missing.join(", ")} (lejárt: ${stale.join(", ")})`
        : `Hiányzó bemenet: ${missing.join(", ")}`,
      inputs,
    };
  }

  const { ga, chestPainDyspnea, spo2, plt, cr, ast } = got;
  if (plt <= 0 || ast <= 0) {
    return {
      status: "insufficient",
      missing: [plt <= 0 ? "lab.plt" : "lab.ast"],
      reason: "A thrombocyta és az AST logaritmusa csak pozitív értékre értelmezett.",
      inputs,
    };
  }

  const logit =
    -2.68 +
    -0.154 * ga +
    1.23 * chestPainDyspnea +
    -0.0271 * spo2 +
    0.207 * Math.log(plt) + 0.00004 * plt * plt +
    0.0101 * cr + 0.00000262 * cr * cr +
    0.025 * Math.log(ast) + -0.000592 * ast * ast;

  const p = 1 / (1 + Math.exp(-logit));

  if (!COEFFICIENTS_VERIFIED) {
    return {
      status: "insufficient",
      missing: ["score.fullpiers.coefficients"],
      reason:
        "A fullPIERS együtthatói nincsenek visszaellenőrizve a von Dadelszen 2011 " +
        "közleménnyel. A dokumentált együtthatókkal a modell klinikailag fordítva " +
        "viselkedik (a súlyosabb beteg alacsonyabb kockázatot kap). A score addig " +
        "nem ad eredményt, amíg ez nem tisztázott.",
      inputs: { ...inputs, _debug: { logit, p } },
    };
  }

  return {
    status: "ok",
    value: round(p * 100, 1),
    unit: "%",
    interpretation: interpret(p),
    inputs,
  };
}

function interpret(p: number): string {
  if (p >= 0.3) return "Nagyon magas kockázat — azonnali multidiszciplináris ellátás";
  if (p >= 0.1) return "Magas kockázat — sürgős szakorvosi értékelés";
  if (p >= 0.05) return "Emelkedett kockázat — fokozott megfigyelés";
  if (p >= 0.025) return "Mérsékelt kockázat";
  return "Alacsony kockázat — a rutin megfigyelés folytatható";
}
