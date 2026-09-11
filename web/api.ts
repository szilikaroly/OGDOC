/**
 * A webes API szállítás-független rétege.
 *
 * Itt NINCS http, nincs framework, nincs adatbázis — csak függvények, amik
 * kérés-objektumot kapnak és válasz-objektumot adnak. Ezért ugyanez a réteg
 * megy a Node-os csontvázba, a Cloudflare Worker alá és a TanStack server
 * function-ökbe: a szállítást cserélni kell, az üzleti logikát nem.
 *
 * Ez a `docs/01-architektura.md` portolhatósági szerződésének webes fele.
 */
import type { Registry } from "../core/registry.ts";
import type { CaseState } from "../core/types.ts";
import { recompute, resolve, setValue, suggestPrefills } from "../core/derive/engine.ts";
import { DerivationGraph } from "../core/derive/graph.ts";
import { buildFormSpec, fieldDoc } from "../core/ui/formspec.ts";
import type { ModulCimKeszlet } from "../core/ui/modulcimek.ts";
import { CALCULATORS, CALC_BY_ID } from "../core/calc/defs.ts";
import { runCalc } from "../core/calc/run.ts";
import { interactionCount, visibleFields } from "../core/ui/disclosure.ts";
import { needsConfirmation, patientSummary, recommendations } from "../core/ui/output.ts";
import { meresek, type MeresErtekeles } from "../core/ui/meres.ts";

export interface ValueView {
  id: string;
  value: unknown;
  state: "ok" | "missing" | "stale";
  provenance?: string;
  sourceRef?: string | null;
  /** `derived` értéknél: melyik képlet adta, emberi olvasatban. */
  formula?: string;
  ageMs?: number;
}

export interface CaseView {
  ctx: CaseState["ctx"];
  values: ValueView[];
  suggestions: Array<{ id: string; value: unknown; note: string; sourceRef: string }>;
  /** A most látható mezők — a click-open minta eredménye. */
  visible: string[];
  /** Hány mezőt kellett megérinteni, és mennyi maradt rejtve. */
  effort: { touched: number; total: number; hiddenByDefault: number };
  /** A betegnek szóló generált szöveg — a normálisról is. */
  patient: Array<{ id: string; text: string; tone: string }>;
  /** A klinikusnak szóló javaslatok, kiváltó mezővel. */
  advice: Array<{ kind: string; text: string; urgency?: string; from: string; fromLabel: string }>;
  /** Beteg által megadott, még meg nem erősített értékek. */
  confirm: Array<{ id: string; label: string; value: unknown; wouldAffect: string[] }>;
  /** Kalkulátoronként: eredmény vagy a hiány oka. Sosem üres helyett nulla. */
  calc: Array<{
    id: string; label: string; status: "ok" | "insufficient";
    value?: number; display?: string; unit?: string | null; band?: string; severity?: string;
    missing?: string[]; reason?: string;
  }>;
  /**
   * A MÉRT ÉRTÉKEK MEGÍTÉLÉSE MEZŐNKÉNT — a skálához.
   *
   * A felület a mező alatt rajzolja a sávot és rajta a mért értéket. A
   * megítélés (kontextus, kritikus vagy referencia, hitelesítési szint) a
   * magban dől el; a felület csak a kész számokat kapja. A „nincs mihez
   * mérni” állapot is itt van — a hallgatás nem megnyugtatás.
   */
  meresek: Array<Pick<MeresErtekeles,
    "id" | "allapot" | "value" | "unit" | "sav" | "kontextus" | "verification" | "miert">>;
}

/** A teljes eset nézete — ezt kapja a felület minden változás után. */
export function caseView(reg: Registry, state: CaseState, lang: "hu" | "en" = "hu"): CaseView {
  const values: ValueView[] = [];
  for (const d of reg.all()) {
    if (d.aliasOf) continue;
    const r = resolve(reg, state, d.id);
    if (r.state === "missing") continue;
    values.push({
      id: d.id, value: r.value, state: r.state,
      provenance: r.provenance, sourceRef: r.sourceRef, ageMs: r.ageMs,
      formula: r.sourceRef ? CALC_BY_ID.get(r.sourceRef)?.formula : undefined,
    });
  }

  const calc = CALCULATORS.map((c) => {
    const r = runCalc(reg, state, c.id, lang);
    const label = c.label[lang] ?? c.label.hu ?? c.id;
    return r.status === "ok"
      ? { id: c.id, label, status: "ok" as const, value: r.value, display: r.display, unit: r.unit,
          band: r.band?.label, severity: r.band?.severity }
      : { id: c.id, label, status: "insufficient" as const,
          missing: r.missing, reason: r.reason };
  });

  return {
    ctx: state.ctx,
    visible: [...visibleFields(reg, state)].sort(),
    effort: interactionCount(reg, state),
    patient: patientSummary(reg, state, lang).map((p) => ({ id: p.id, text: p.text, tone: p.tone })),
    advice: recommendations(reg, state, lang).map((r) => ({
      kind: r.kind, text: r.text, urgency: r.urgency, from: r.from, fromLabel: r.fromLabel,
    })),
    confirm: needsConfirmation(reg, state, lang).map((c) => ({
      id: c.id, label: c.label, value: c.value, wouldAffect: c.wouldAffect,
    })),
    values: values.sort((a, b) => a.id.localeCompare(b.id)),
    suggestions: suggestPrefills(reg, state).map((s) => ({
      id: s.id, value: s.value, note: s.note, sourceRef: s.sourceRef,
    })),
    calc,
    meresek: meresek(reg, state, lang).map((m) => ({
      id: m.id, allapot: m.allapot, value: m.value, unit: m.unit, sav: m.sav,
      kontextus: m.kontextus, verification: m.verification, miert: m.miert,
    })),
  };
}

export interface WriteRequest {
  id: string;
  value: unknown;
  provenance?: string;
}

export interface WriteResponse {
  ok: boolean;
  /** Elutasításnál a felületnek MEGMUTATHATÓ ok, nem stack trace. */
  error?: string;
  state?: CaseState;
  view?: CaseView;
  /** Amit ez az írás átszámoltatott — a felület ezeket villantja fel. */
  affected?: string[];
}

/**
 * Egy érték rögzítése és az azt követő újraszámítás.
 *
 * Az elutasítás (tartományon kívüli érték, levezetett mezőre írás, ismeretlen
 * kód) NEM kivétel a hívó felé: a felületnek megjeleníthető üzenet kell,
 * nem 500-as hiba.
 */
export function write(
  reg: Registry, state: CaseState, req: WriteRequest, lang: "hu" | "en" = "hu",
): WriteResponse {
  try {
    const affected = new DerivationGraph(reg).impactOf(reg.resolvePrimary(req.id));
    const next = recompute(reg, setValue(reg, state, req.id, req.value, {
      provenance: (req.provenance ?? "clinician") as never,
    }));
    return { ok: true, state: next, view: caseView(reg, next, lang), affected };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** A generált űrlapleírás — a felület ebből épül, nem kézzel írt mezőkből. */
export function formSpec(
  reg: Registry, lang: "hu" | "en" = "hu", cimek: ModulCimKeszlet | null = null,
) {
  return buildFormSpec(reg, lang, cimek);
}

/** Egy mező teljes dokumentációja, a generált keresztfeltöltési listákkal. */
export function docFor(reg: Registry, id: string, lang: "hu" | "en" = "hu") {
  const g = new DerivationGraph(reg);
  return {
    id,
    text: fieldDoc(reg, id, lang),
    sources: g.sourcesOf(id),
    consumers: g.consumersOf(id),
    impact: g.impactOf(id),
  };
}
