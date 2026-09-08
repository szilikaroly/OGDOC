/**
 * Levezetési motor: computed · prefill · mirror.
 *
 * A három mechanizmus klinikailag élesen különbözik, és a motor nem mossa össze
 * őket.  (ld. docs/02-valtozo-regiszter.md)
 */
import type { CaseState, Value, VariableDef, Provenance } from "../types.ts";
import type { Registry } from "../registry.ts";
import { DerivationGraph } from "./graph.ts";
import { durationMs, resolve, rosterOf, scopesOf, usable } from "./resolve.ts";
import type { Resolved } from "./resolve.ts";
import { runCalc } from "../calc/run.ts";
import { lookupCode } from "../coding/tables.ts";

export { resolve, usable, durationMs, scopesOf, rosterOf };
export type { Resolved };

/**
 * Prefill-javaslatok. NEM ír a `values`-ba: javaslatot ad, amit a felhasználó
 * elfogad vagy felülír. Amire már van közvetlenül rögzített érték, arra nem javasol.
 */
export interface Suggestion {
  id: string;
  value: unknown;
  sourceRef: string;
  policy: string;
  /** Miért ezt javasoljuk — a felületen megjelenik. */
  note: string;
}

export function suggestPrefills(reg: Registry, state: CaseState): Suggestion[] {
  const out: Suggestion[] = [];
  for (const def of reg.all()) {
    const dv = def.derivation;
    if (dv?.kind !== "prefill") continue;

    const existing = resolve(reg, state, def.id);
    // ha már van elfogadott, nem prefill eredetű érték, nem javaslunk
    if (existing.state === "ok" && existing.provenance !== "prefilled") continue;

    for (const src of dv.from) {
      const s = fromSource(reg, state, def, src);
      if (s) { out.push(s); break; }        // az első találó forrás nyer (sorrend = precedencia)
    }
  }
  return out;
}

function fromSource(
  reg: Registry, state: CaseState, def: VariableDef,
  src: { source: string; policy: string; value?: unknown; maxAge?: string | null },
): Suggestion | null {
  if (src.source === "self.previousVisit") {
    const prev = state.previousVisit?.[def.id];
    if (!prev?.length) return null;
    const v = [...prev].sort((a, b) => Date.parse(b.t) - Date.parse(a.t))[0];
    if (src.maxAge) {
      const ms = durationMs(src.maxAge);
      const age = Date.parse(state.ctx.now) - Date.parse(v.t);
      if (ms != null && age > ms) return null;   // túl régi: nem javasoljuk
    }
    return {
      id: def.id, value: v.value, sourceRef: `previousVisit@${v.t}`,
      policy: src.policy, note: `korábbi vizit (${v.t.slice(0, 10)})`,
    };
  }

  if (src.policy === "implies") {
    const trigger = usable(reg, state, src.source);
    if (trigger === true || trigger === "pos") {
      return {
        id: def.id, value: src.value, sourceRef: src.source,
        policy: src.policy, note: `következik ebből: ${src.source}`,
      };
    }
    return null;
  }

  const v = resolve(reg, state, src.source);
  if (v.state !== "ok") return null;
  return {
    id: def.id, value: v.value, sourceRef: src.source,
    policy: src.policy, note: `átvéve: ${src.source}`,
  };
}

/**
 * Minden `computed` változó újraszámítása, topologikus sorrendben.
 * A `requiresAll` (alapértelmezés: true) miatt hiányzó bemenetnél nem születik érték.
 */
export function recompute(reg: Registry, state: CaseState): CaseState {
  const graph = new DerivationGraph(reg);
  const order = graph.topologicalOrder();
  // A táblakeresés hibái ide gyűlnek: a hiányzó törzs nem tűnhet el némán.
  const errors = [...(state.errors ?? [])].filter((e) => !e.where.startsWith("lookup:"));
  const next: CaseState = { ...state, values: { ...state.values }, errors };

  // A `ctx.now` a számítások vonatkoztatási pontja — a kontextusból származik,
  // nem kézi bevitelből. Ezért a motor tölti be, minden újraszámítás elején.
  next.values["ctx.now"] = [{
    value: state.ctx.now, t: state.ctx.now, provenance: "derived", confidence: "measured",
  }];

  for (const id of order) {
    const def = reg.get(id)!;
    const dv = def.derivation;

    // TÁBLAKERESÉS. Nem a kalkulátor-rétegen megy: az számot vesz és számot
    // ad, ez kódból szöveget. A hiányzó tábla NEM csendes: a hibalistába
    // kerül, és onnan az okosleletre is.
    if (dv?.kind === "lookup") {
      const key = resolve(reg, next, dv.from);
      if (key.state !== "ok") { delete next.values[id]; continue; }
      const r = lookupCode(dv.table, key.value, dv.column ?? "label");
      if (r.value == null) {
        delete next.values[id];
        if (r.why) errors.push({ where: id, message: r.why });
        continue;
      }
      next.values[id] = [{
        value: r.value, unit: null, t: state.ctx.now, recordedAt: state.ctx.now,
        provenance: "derived", confidence: "measured",
        sourceRef: `${r.table}@${r.version}`,
      }];
      continue;
    }

    if (dv?.kind !== "computed") continue;

    // EGY képlet egy fogalomhoz: a számítást a kalkulátor-réteg végzi, azzal a
    // két kapuval együtt, amit ott kényszerítünk ki (hiányzó bemenet, és
    // ellenőrizetlen konstans). Itt nincs párhuzamos képlet-tábla.
    const r = runCalc(reg, next, dv.calc);
    if (r.status !== "ok") {
      delete next.values[id];             // nincs érték — és nem is nulla
      continue;
    }

    next.values[id] = [{
      value: r.value, unit: def.unit ?? null, t: state.ctx.now,
      recordedAt: state.ctx.now, provenance: "derived", confidence: "estimated",
      sourceRef: dv.calc,
    }];
  }

  return next;
}

/* ─── Írási út ────────────────────────────────────────────────────────────
   Minden bevitel ezen megy át.  Két dolgot garantál, amit a hívó nem tud
   elrontani: a tükrözött azonosítóra írt érték a primer változóhoz kerül
   (egy adat, több felületi hely), és a `computed` mezőre nem lehet kézzel
   írni — azt a motor vezeti le.                                             */

export interface WriteOpts {
  provenance?: Provenance;
  confidence?: string;
  /** Mikor VONATKOZIK rá. Alapértelmezés: a kontextus „most"-ja. */
  t?: string;
  sourceRef?: string | null;
  overridden?: boolean;
  /**
   * Melyik PÉLDÁNYRA vonatkozik — `scopedBy` mezőnél kötelező, másutt tilos.
   * A példánynak szerepelnie kell a névsorban: részletet csak olyan panaszra
   * lehet rögzíteni, amit valaki állított.
   */
  scope?: string | null;
}

/**
 * Érték rögzítése. Nem mutálja az állapotot: új `CaseState`-tel tér vissza.
 * A `computed` változóra írás hiba — a hívó a bemenetet írja, ne az eredményt.
 */
export function setValue(
  reg: Registry, state: CaseState, id: string, value: unknown, opts: WriteOpts = {},
): CaseState {
  const def = reg.get(id);
  if (!def) throw new Error(`Ismeretlen változó: ${id}`);

  const primary = reg.resolvePrimary(id);        // tükör feloldása írás előtt
  const target = reg.get(primary)!;
  if (target.derivation?.kind === "computed") {
    throw new Error(
      `${primary} levezetett mező, kézzel nem írható — a bemeneteit írd: ` +
      `${reg.computedInputs(primary).join(", ")}`,
    );
  }

  const bad = violates(target, value);
  if (bad) throw new Error(`${primary}: ${bad}`);

  // KI MONDHATJA. A `provenanceAllowed` eddig díszítés volt: a típusban ott
  // állt, de senki nem kényszerítette ki. A beteg által jelentett kimenetel
  // (PROM) ezt kapuvá teszi.
  //
  // A PROM a beteg SAJÁT szempontjából mért kimenetel. Ha a klinikus
  // felülírhatja, a mérés megszűnik annak lenni, ami — és a felülírás nem is
  // látszana, mert ugyanabban a mezőben állna. Az ellentmondás rögzítésére
  // külön mező van (`prom.clinicianNote`); a beteg válasza érintetlen marad.
  const prov = opts.provenance ?? "clinician";
  const allowed = target.provenanceAllowed;
  if (allowed?.length && !allowed.includes(prov)) {
    throw new Error(
      `${primary}: „${prov}" eredettel nem írható — csak ` +
      `${allowed.join(", ")}. ` +
      (allowed.length === 1 && allowed[0] === "patient"
        ? "Ez a mező a BETEG saját válasza. A klinikus nem írhatja felül; " +
          "ha ellentmondást lát, azt külön megjegyzésben rögzíti."
        : ""),
    );
  }

  // PÉLDÁNY-KAPU. Példányosított mezőre scope nélkül írni azt jelentené, hogy
  // a rekordban egy jellemző áll anélkül, hogy tudnánk, MIRE vonatkozik —
  // később már nem rekonstruálható. Fordítva: scope-ot adni nem példányosított
  // mezőre néma adatvesztés, mert a feloldás sosem találná meg.
  const scope = opts.scope ?? null;
  if (target.scopedBy) {
    if (scope === null) {
      throw new Error(
        `${primary} példányosított mező (${target.scopedBy.dimension}) — ` +
        `scope nélkül nem írható`,
      );
    }
    const roster = rosterOf(reg, state, target.scopedBy.roster);
    if (!roster.includes(scope)) {
      throw new Error(
        `${primary}: a(z) „${scope}" példány nincs a névsorban ` +
        `(${target.scopedBy.roster}) — előbb azt kell rögzíteni`,
      );
    }
  } else if (scope !== null) {
    throw new Error(`${primary} nem példányosított mező — scope nem adható meg`);
  }

  // AZ EGYSÉG MÁSIK MEZŐBŐL. Egység nélküli adag nem rögzíthető: az „500" a
  // rekordban később nem rekonstruálható, és a gyógyszerelési hibák egyik
  // klasszikus forrása.
  let unit = target.unit ?? null;
  if (target.unitFrom) {
    const u = resolve(reg, state, target.unitFrom, scope);
    if (u.state !== "ok" || typeof u.value !== "string") {
      throw new Error(
        `${primary}: az egység a(z) ${target.unitFrom} mezőből jön, és az még nincs kitöltve`,
      );
    }
    unit = u.value;
  }

  const t = opts.t ?? state.ctx.now;
  const v: Value = {
    value,
    unit,
    t,
    recordedAt: state.ctx.now,
    provenance: prov,
    confidence: opts.confidence as Value["confidence"],
    sourceRef: opts.sourceRef ?? (primary === id ? null : id),
    overridden: opts.overridden,
    scope,
    // A rögzítéskori osztályozási verzió. A hívó nem adhatja meg: ha
    // megadhatná, egy import a saját verzióját állíthatná be, és a
    // visszamenőleges értelmezés elveszne.
    codeSystemVersion: target.codeSystem?.version ?? null,
  };

  return {
    ...state,
    values: { ...state.values, [primary]: [...(state.values[primary] ?? []), v] },
  };
}

/**
 * Tartomány- és kódszótár-ellenőrzés. A `domain.min/max` és a `valueSet` a
 * regiszterben van — a motor itt kényszeríti ki, hogy ne kelljen minden
 * felületnek külön megtennie.  A `plausible` sáv NEM itt dől el: az csak
 * megerősítést kérő figyelmeztetés, nem elutasítás.
 */
function violates(def: VariableDef, value: unknown): string | null {
  if (value == null) return "üres érték nem rögzíthető — a hiányzó adat nem érték";

  if (def.datatype === "quantity") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `számot vár, ez érkezett: ${JSON.stringify(value)}`;
    }
    const d = def.domain;
    if (d?.min != null && value < d.min) return `${value} < megengedett minimum (${d.min})`;
    if (d?.max != null && value > d.max) return `${value} > megengedett maximum (${d.max})`;
  }

  // A kódkészlet a regiszterből jön, nem a motorból. A háromállapotú mező is
  // csak egy kódolt mező, aminek kötelező eleme a „nem tudom" — ezért ugyanaz
  // az ellenőrzés fut rá.
  if ((def.datatype === "coded" || def.datatype === "tristate") && def.valueSet) {
    const codes = def.valueSet.map((o) => o.code);
    if (!codes.includes(value as never)) {
      return `${JSON.stringify(value)} nem szerepel a kódszótárban (${codes.join(", ")})`;
    }
  }

  // A `coded-multi` TÖMB, és minden eleme a kódszótárból való. Ez a névsorok
  // adattípusa: ha egy elem nem szerepel a szótárban, egy nem létező példányra
  // lehetne részletet akasztani.
  if (def.datatype === "coded-multi") {
    if (!Array.isArray(value)) {
      return `listát vár, ez érkezett: ${JSON.stringify(value)}`;
    }
    if (def.valueSet) {
      const codes = def.valueSet.map((o) => o.code);
      const unknown = value.filter((v) => !codes.includes(v as never));
      if (unknown.length) {
        return `ismeretlen kód a listában: ${unknown.map((u) => JSON.stringify(u)).join(", ")}`;
      }
    }
  }

  if (def.datatype === "bool" && typeof value !== "boolean") {
    return `logikai értéket vár, ez érkezett: ${JSON.stringify(value)}`;
  }

  return null;
}
