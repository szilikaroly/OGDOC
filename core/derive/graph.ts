/**
 * Levezetési gráf: körellenőrzés, topologikus sorrend, generált consumers,
 * és a hatásvizsgálat („ha ezt módosítod, ez a 14 dolog változik").
 */
import type { Registry } from "../registry.ts";

export interface Edge { from: string; to: string; kind: "computed" | "prefill" | "mirror"; }

export class DerivationGraph {
  readonly edges: Edge[] = [];
  /** cél ← források */
  readonly incoming = new Map<string, Edge[]>();
  /** forrás → célok  (ez adja a generált `consumers`-t) */
  readonly outgoing = new Map<string, Edge[]>();

  readonly reg: Registry;

  constructor(reg: Registry) {
    this.reg = reg;
    for (const d of reg.all()) {
      if (d.aliasOf) this.add({ from: d.aliasOf, to: d.id, kind: "mirror" });
      const dv = d.derivation;
      if (dv?.kind === "computed") {
        for (const i of reg.computedInputs(d.id)) this.add({ from: i, to: d.id, kind: "computed" });
      } else if (dv?.kind === "lookup") {
        this.add({ from: dv.from, to: d.id, kind: "computed" });
      } else if (dv?.kind === "prefill") {
        for (const f of dv.from) {
          if (!f.source.startsWith("self.") && !f.source.startsWith("import.")) {
            this.add({ from: f.source, to: d.id, kind: "prefill" });
          }
        }
      }
    }
  }

  private add(e: Edge) {
    this.edges.push(e);
    this.incoming.set(e.to, [...(this.incoming.get(e.to) ?? []), e]);
    this.outgoing.set(e.from, [...(this.outgoing.get(e.from) ?? []), e]);
  }

  /** A generált `consumers` lista — nem kézzel írt. */
  consumersOf(id: string): string[] {
    return [...new Set((this.outgoing.get(id) ?? []).map((e) => e.to))].sort();
  }

  /** Mi tölti fel ezt a változót. */
  sourcesOf(id: string): string[] {
    return [...new Set((this.incoming.get(id) ?? []).map((e) => e.from))].sort();
  }

  /**
   * Hatásvizsgálat: minden változó, amit egy módosítás közvetve is érint.
   * Ez jelenik meg a 25. modul szerkesztőjében, mielőtt bármit élesítenénk.
   */
  impactOf(id: string): string[] {
    const out = new Set<string>();
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const e of this.outgoing.get(cur) ?? []) {
        if (!out.has(e.to)) { out.add(e.to); stack.push(e.to); }
      }
    }
    return [...out].sort();
  }

  /**
   * Topologikus sorrend. Kör esetén dob — a build ezen elszáll, nem a felhasználó.
   */
  topologicalOrder(): string[] {
    const indeg = new Map<string, number>();
    for (const d of this.reg.all()) indeg.set(d.id, 0);
    for (const e of this.edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);

    const queue = [...indeg.entries()].filter(([, n]) => n === 0).map(([k]) => k).sort();
    const order: string[] = [];
    while (queue.length) {
      const cur = queue.shift()!;
      order.push(cur);
      for (const e of this.outgoing.get(cur) ?? []) {
        const n = (indeg.get(e.to) ?? 0) - 1;
        indeg.set(e.to, n);
        if (n === 0) queue.push(e.to);
      }
      queue.sort();
    }

    if (order.length !== this.reg.all().length) {
      const inCycle = [...indeg.entries()].filter(([, n]) => n > 0).map(([k]) => k);
      throw new Error(
        `Kör a levezetési gráfban — érintett változók: ${inCycle.sort().join(", ")}`,
      );
    }
    return order;
  }
}
