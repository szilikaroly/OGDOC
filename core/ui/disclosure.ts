/**
 * Click-open: mely mezők látszanak most.
 *
 * A cél egyetlen mondatban: **a strukturált bevitel legyen gyorsabb a
 * gépelésnél.** Ez akkor teljesül, ha a klinikus a normálisat nem írja le.
 *
 * ÖT ÁLLAPOT, és mindegyik mást jelent:
 *
 *   eltérés nélkül   megvizsgáltuk, rendben van          → csukva
 *   korlátozott      megvizsgáltuk, de nem teljesen      → a lánc NYÍLIK
 *   lehetetlen       meg sem lehetett vizsgálni          → csukva
 *   eltérés          kóros lelet                         → a lánc NYÍLIK
 *   kimaradt         NEM vizsgáltuk (nincs rögzítve)     → csukva
 *
 * A „korlátozott” és a „lehetetlen” különbsége klinikai: az elsőnél láttunk
 * valamit, tehát rögzíthető; a másodiknál nem. A „kimaradt” pedig egyik sem —
 * arról a rendszer semmit nem állít.
 *
 * A részletezés LÁNC, nem lista: lokalizáció → jelleg → (a jelleg értékétől
 * függően) mérték és típus. Minden lépés akkor jelenik meg, ha az előtte lévő
 * ki van töltve.
 */
import type { Registry } from "../registry.ts";
import type { CaseState, Finding } from "../types.ts";
import { resolve } from "../derive/resolve.ts";

export type FindingState =
  | "normal" | "limited" | "impossible" | "abnormal" | "omitted";

/** Az állapotok, amelyeknél a részletező lánc megnyílik. */
const OPENS: ReadonlySet<FindingState> = new Set(["abnormal", "limited"]);

/** Egy lelet aktuális állapota. A nem rögzített mező `omitted` — kimaradt. */
export function findingState(
  reg: Registry, state: CaseState, id: string,
): FindingState {
  const def = reg.get(reg.resolvePrimary(id));
  const f: Finding | null | undefined = def?.finding;
  if (!f) return "omitted";
  const r = resolve(reg, state, id);
  if (r.state !== "ok") return "omitted";
  if (r.value === f.normal) return "normal";
  if (f.limited !== undefined && r.value === f.limited) return "limited";
  if (f.impossible !== undefined && r.value === f.impossible) return "impossible";
  return "abnormal";
}

/** A mezőt megnyitó kapuk: lelet-lánc és érték-specifikus továbbnyitás. */
interface Gates {
  /** `finding.cascade` — [lelet, a lánc hányadik lépése]. */
  cascade: Array<{ finding: string; step: number; chain: string[] }>;
  /** `valueSet[].opens` — [a kérdés mezője, a kód, amire nyílik]. */
  options: Array<{ field: string; code: string | number }>;
}

function gatesOf(reg: Registry): Map<string, Gates> {
  const out = new Map<string, Gates>();
  const add = (id: string): Gates => {
    let g = out.get(id);
    if (!g) { g = { cascade: [], options: [] }; out.set(id, g); }
    return g;
  };
  for (const d of reg.all()) {
    const chain = d.finding?.cascade ?? [];
    chain.forEach((t, i) => add(t).cascade.push({ finding: d.id, step: i, chain }));
    for (const o of d.valueSet ?? []) {
      for (const t of o.opens ?? []) add(t).options.push({ field: d.id, code: o.code });
    }
  }
  return out;
}

/**
 * A most látható mezők halmaza.
 *
 * Ha egy mezőt több kapu is megnyithat, **egy nyitott elég** — különben egy
 * kóros lelet részletei eltűnnének egy másik miatt.
 */
export function visibleFields(reg: Registry, state: CaseState): Set<string> {
  const gates = gatesOf(reg);
  const filled = (id: string) => resolve(reg, state, id).state === "ok";

  const visible = new Set<string>();
  for (const d of reg.all()) {
    if (d.aliasOf) continue;
    const g = gates.get(d.id);
    if (!g) { visible.add(d.id); continue; }

    // lánc: a lelet nyitva van, ÉS a lánc korábbi lépései ki vannak töltve
    const byCascade = g.cascade.some((c) =>
      OPENS.has(findingState(reg, state, c.finding))
      && c.chain.slice(0, c.step).every(filled));

    // érték-specifikus: a kérdésre pont ez a válasz született
    const byOption = g.options.some((o) => {
      const r = resolve(reg, state, o.field);
      return r.state === "ok" && r.value === o.code;
    });

    if (byCascade || byOption) visible.add(d.id);
  }
  return visible;
}

/**
 * Amit a rögzítetlen lelet jelent.
 *
 * A `kimaradt` NEM ugyanaz, mint a normális: arról a rendszer semmit nem
 * állít — nem generál betegtájékoztatót és nem generál javaslatot.
 */
export function effectiveFinding(
  reg: Registry, state: CaseState, id: string,
): { state: FindingState; value: unknown; explicit: boolean } {
  const def = reg.get(reg.resolvePrimary(id));
  const st = findingState(reg, state, id);
  if (!def?.finding) {
    return { state: "omitted", value: resolve(reg, state, id).value, explicit: true };
  }
  if (st === "omitted") return { state: "omitted", value: null, explicit: false };
  return { state: st, value: resolve(reg, state, id).value, explicit: true };
}

/** Hány mezőt kellett ténylegesen megérinteni — a gyorsaság mérőszáma. */
export function interactionCount(reg: Registry, state: CaseState): {
  touched: number; total: number; hiddenByDefault: number;
} {
  const all = reg.all().filter((d) => !d.aliasOf);
  const visible = visibleFields(reg, state);
  // Csak az EMBERI bevitel számít erőfeszítésnek. A motor által írt levezetett
  // értékek (és a `ctx.now`) nem — különben a mérőszám magát méri.
  const touched = all.filter((d) =>
    (state.values[d.id] ?? []).some((v) => v.provenance !== "derived")).length;
  return { touched, total: all.length, hiddenByDefault: all.length - visible.size };
}
