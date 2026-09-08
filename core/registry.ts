/** Regiszter: betöltés, indexelés, integritás-ellenőrzés. */
import type { VariableDef } from "./types.ts";
import { CALC_BY_ID } from "./calc/defs.ts";
import { REFERENCIA_KONTEXTUSOK } from "./ui/meres.ts";

export interface RegistryIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

export class Registry {
  readonly byId: Map<string, VariableDef>;

  constructor(defs: VariableDef[]) {
    this.byId = new Map();
    for (const d of defs) {
      if (this.byId.has(d.id)) {
        throw new Error(`Duplikált változó-azonosító: ${d.id}`);
      }
      this.byId.set(d.id, d);
    }
  }

  get(id: string): VariableDef | undefined {
    return this.byId.get(id);
  }

  /** A mirror-lánc végén álló primer változó. Kört nem tűr. */
  resolvePrimary(id: string): string {
    const seen = new Set<string>();
    let cur = id;
    for (;;) {
      if (seen.has(cur)) {
        throw new Error(`Körkörös aliasOf lánc: ${[...seen, cur].join(" → ")}`);
      }
      seen.add(cur);
      const d = this.byId.get(cur);
      if (!d) throw new Error(`Ismeretlen változó: ${cur}`);
      if (!d.aliasOf) return cur;
      cur = d.aliasOf;
    }
  }

  /** Egy computed változó bemenetei — a kalkulátor deklarációjából. */
  computedInputs(id: string): string[] {
    const d = this.byId.get(id);
    if (d?.derivation?.kind !== "computed") return [];
    return CALC_BY_ID.get(d.derivation.calc)?.inputs.map((i) => i.id) ?? [];
  }

  all(): VariableDef[] {
    return [...this.byId.values()];
  }

  /** Integritás-ellenőrzés. A build ezen elszáll — nem futásidőben derül ki. */
  validate(): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const d of this.all()) {
      if (d.aliasOf && !this.byId.has(d.aliasOf)) {
        push("error", d.id, `aliasOf ismeretlen változóra mutat: ${d.aliasOf}`);
      }
      if (d.derivation?.kind === "computed") {
        const calc = CALC_BY_ID.get(d.derivation.calc);
        if (!calc) {
          push("error", d.id, `ismeretlen kalkulátor: ${d.derivation.calc}`);
        } else {
          for (const i of calc.inputs) {
            const input = this.byId.get(this.resolvePrimary(i.id));
            if (!input) {
              push("error", d.id, `a ${calc.id} bemenete ismeretlen a regiszterben: ${i.id}`);
              continue;
            }
            // A KALKULÁTOR-RÉTEG CSAK SZÁMOT TUD FOGADNI: a futtató minden
            // bemenetet számmá alakít, és a nem numerikus kód csendben `NaN`
            // lesz — vagyis a kalkulátor ÖRÖKRE „hiányzó bemenet"-et mond, és
            // ez a kapu mögötti állapottól megkülönböztethetetlen.
            //
            // Kódolt bemenet ezért CSAK akkor jó, ha minden kódja szám (a
            // Bishop-score beszállása és az Apgar tételei ilyenek: ott a kód
            // MAGA a pontérték). A `pos`/`neg` alakú háromállású mező nem az —
            // az ilyen szabály nem kalkulátor, hanem szabályalapú értékelés.
            if (input.datatype === "coded" || input.datatype === "tristate") {
              const nonNumeric = (input.valueSet ?? [])
                .map((o) => o.code)
                .filter((c) => !Number.isFinite(Number(c)));
              if (nonNumeric.length) {
                push("error", d.id,
                  `a ${calc.id} bemenete (${i.id}) nem numerikus kódokat használ ` +
                  `(${nonNumeric.join(", ")}) — a kalkulátor-réteg csak számot fogad, ` +
                  `az ilyen szabály szabályalapú értékelésbe való`);
              }
            }
          }
          if (calc.output.unit && d.unit && calc.output.unit !== d.unit) {
            push("error", d.id,
              `egység-eltérés: a változó ${d.unit}, a ${calc.id} eredménye ${calc.output.unit}`);
          }
        }
      }
      if (d.derivation?.kind === "prefill") {
        for (const f of d.derivation.from) {
          const isSpecial = f.source.startsWith("self.") || f.source.startsWith("import.");
          if (!isSpecial && !this.byId.has(f.source)) {
            push("error", d.id, `prefill forrás ismeretlen: ${f.source}`);
          }
        }
      }
      if (d.aliasOf && d.derivation) {
        push("error", d.id, "mirror (aliasOf) változónak nem lehet saját derivation-je");
      }
      if (d.consumers && d.consumers.length > 0) {
        push("warning", d.id, "a consumers generált mező; a forrásban ne legyen kitöltve");
      }
      if ((d.datatype === "coded" || d.datatype === "coded-multi") && !d.valueSet?.length) {
        // A TÜKÖR ÖRÖKÖLHETI a kódlistát: nem hiány, hanem a duplikáció kerülése.
        // Ha nincs saját listája, a primeré érvényes rá — egy fogalom, egy lista.
        if (!d.aliasOf) push("error", d.id, `${d.datatype} típushoz kötelező a valueSet`);
      }
      /**
       * HA A TÜKÖR MÉGIS FELSOROLJA a kódokat, azoknak EGYEZNIÜK KELL a
       * primerével. A megismételt lista magában nem hiba — a felület olvasható
       * marad tőle —, de az ELTÉRŐ lista két igazság ugyanarról a leletről:
       * a felvételi lapon „bűzös”, a szülőszobain nem, és a javaslat elmarad.
       */
      if (d.aliasOf && d.valueSet?.length) {
        const prim = this.byId.get(this.resolvePrimary(d.id));
        if (prim?.valueSet?.length) {
          const mine = d.valueSet.map((v) => String(v.code));
          const theirs = new Set(prim.valueSet.map((v) => String(v.code)));
          const extra = mine.filter((c) => !theirs.has(c));
          const lack = [...theirs].filter((c) => !mine.includes(c));
          if (extra.length || lack.length) {
            push("error", d.id,
              `a tükör kódlistája ELTÉR a primerétől (${prim.id})` +
              (extra.length ? ` — csak itt: ${extra.join(", ")}` : "") +
              (lack.length ? ` — hiányzik innen: ${lack.join(", ")}` : "") +
              ". Egy fogalomhoz egy kódlista tartozik; a tükör vagy pontosan " +
              "ismétli, vagy elhagyja és örököl.");
          }
        }
      }
      if (d.finding) {
        const codes = (d.valueSet ?? []).map((o) => o.code);
        const inSet = (v: unknown, name: string) => {
          if (v !== undefined && codes.length && !codes.includes(v as never)) {
            push("error", d.id, `a finding.${name} (${v}) nincs a kódkészletben`);
          }
        };
        inSet(d.finding.normal, "normal");
        inSet(d.finding.limited, "limited");
        inSet(d.finding.impossible, "impossible");
        for (const t of d.finding.cascade ?? []) {
          if (!this.byId.has(t)) {
            push("error", d.id, `a finding.cascade ismeretlen mezőre mutat: ${t}`);
          }
        }
        if (!d.patientText) {
          push("warning", d.id,
            "click-open lelet betegnek szóló szöveg nélkül — a beteg a normálisról sem kap tájékoztatást");
        }
      }
      for (const o of d.valueSet ?? []) {
        for (const t of o.opens ?? []) {
          if (!this.byId.has(t)) {
            push("error", d.id, `a(z) „${o.code}" válasz ismeretlen mezőt nyitna: ${t}`);
          }
        }
      }
      for (const r of d.recommends ?? []) {
        if (!d.finding && r.when !== "always" && r.code === undefined) {
          push("error", d.id,
            `a(z) „${r.when}" javaslat leletmező (finding) nélkül nem értelmezhető`);
        }
      }
      if (d.reference) {
        if (!d.reference.source?.cite) {
          push("error", d.id, "a referenciatartománynak meg kell neveznie a forrását");
        }
        if (d.datatype !== "quantity") {
          push("error", d.id, "referenciatartomány csak mennyiségi (quantity) mezőn értelmes");
        }
        const seen = new Set<string>();
        for (const r of d.reference.ranges) {
          // ELÉRHETETLEN SÁV. Ha a kontextust a futásidejű feloldó soha nem
          // adja vissza, a sáv nem hibás — SOHA NEM SZÓLAL MEG. A tábla
          // teljesnek látszik, a beteg meg a másik sávot kapja, és ez a
          // legcsendesebb hibafajta: nincs hibaüzenet, nincs hiányjelzés.
          if (!(REFERENCIA_KONTEXTUSOK as readonly string[]).includes(r.context)) {
            push("error", d.id,
              `a(z) „${r.context}” referenciakontextust a rendszer nem tudja ` +
              `előállítani — a sáv soha nem választódik ki. Az ismert ` +
              `kontextusok: ${REFERENCIA_KONTEXTUSOK.join(", ")}`);
          }
          if (seen.has(r.context)) {
            push("error", d.id, `két referenciatartomány ugyanarra: ${r.context}`);
          }
          seen.add(r.context);
          if (r.low != null && r.high != null && r.low > r.high) {
            push("error", d.id, `fordított referenciatartomány (${r.context}): ${r.low} > ${r.high}`);
          }
          // A referencia a rögzíthetőségi tartományon BELÜL kell legyen — különben
          // egy „normális" érték nem is írható be.
          if (d.domain?.min != null && r.low != null && r.low < d.domain.min) {
            push("error", d.id,
              `a(z) ${r.context} referencia alsó határa (${r.low}) a domain.min alatt van`);
          }
          if (d.domain?.max != null && r.high != null && r.high > d.domain.max) {
            push("error", d.id,
              `a(z) ${r.context} referencia felső határa (${r.high}) a domain.max felett van`);
          }
        }
        if (!seen.has("nonpregnant")) {
          push("warning", d.id,
            "nincs nem terhes referenciatartomány — a nőgyógyászati eset nagy része ilyen");
        }
        const preg = ["pregnancy.t1", "pregnancy.t2", "pregnancy.t3"];
        const some = preg.filter((c) => seen.has(c));
        if (some.length && some.length < 3) {
          push("warning", d.id,
            `csak részleges terhességi referencia (${some.join(", ")}) — a hiányzó ` +
            `trimeszterben nem lesz olvasat`);
        }
      }
      if (d.scopedBy) {
        const roster = this.byId.get(d.scopedBy.roster);
        if (!roster) {
          push("error", d.id, `a névsor ismeretlen változó: ${d.scopedBy.roster}`);
        } else if (roster.datatype !== "coded-multi") {
          push("error", d.id,
            `a névsornak (${roster.id}) coded-multi típusúnak kell lennie, ez ${roster.datatype}`);
        }
        if (d.derivation?.kind === "computed") {
          push("error", d.id,
            "példányosított mező nem lehet computed — a kalkulátorok nem ismerik a példányokat");
        }
        if (d.aliasOf) {
          push("error", d.id, "példányosított mező nem lehet mirror (aliasOf)");
        }
      }
      if (d.codeSystem) {
        if (!d.codeSystem.version) {
          push("error", d.id, `a ${d.codeSystem.id} kódrendszernek verziót kell megadnia`);
        }
        if (!d.codeSystem.source) {
          push("warning", d.id,
            `a ${d.codeSystem.id} kódrendszernél nincs megadva a kiadó és a beszerzés helye`);
        }
      }
      if (d.unitFrom) {
        const u = this.byId.get(d.unitFrom);
        if (!u) {
          push("error", d.id, `az egységet adó mező ismeretlen: ${d.unitFrom}`);
        } else if (u.datatype !== "coded") {
          push("error", d.id, `az egységet adó mezőnek kódoltnak kell lennie: ${u.id}`);
        } else if ((d.scopedBy?.dimension ?? null) !== (u.scopedBy?.dimension ?? null)) {
          // Máskülönben az adag az egyik példányé, az egység a másiké lenne.
          push("error", d.id,
            `az érték és az egysége nem ugyanabban a példány-dimenzióban él ` +
            `(${d.id}: ${d.scopedBy?.dimension ?? "nincs"}, ${u.id}: ${u.scopedBy?.dimension ?? "nincs"})`);
        }
        if (d.unit) {
          push("error", d.id, "vagy rögzített egység, vagy unitFrom — a kettő együtt nem");
        }
      }
      if (d.datatype === "quantity" && !d.unit && !d.derivation && !d.unitFrom) {
        push("warning", d.id, "quantity típusnál hiányzik az egység");
      }
      if (!d.documentation?.definition?.hu && !d.documentation?.definition?.en) {
        push("error", d.id, "hiányzik a definíció");
      }

      // A KRITIKUS SÁV NEM ZÁRHATJA KI A SAJÁT REFERENCIATARTOMÁNYÁT.
      //
      // A `domain.critical` az ELFOGADHATÓ sávot adja meg: ezen kívül azonnali
      // klinikai jelzés. Ha a pár fordítva került be — az AST-nél `[70, null]`
      // állt a `[null, 70]` helyett —, a rendszer pontosan az ellenkezőjét
      // állítja: a NORMÁLIS értéket jelzi kritikusnak, a valóban kórosat pedig
      // elengedi. Csendes hiba: a mező neve stimmel, a szám is, csak a jelentés
      // fordul meg.
      //
      // A fogás egyszerű és pontos: a saját publikált referenciatartományának
      // BENNE kell lennie a kritikus sávban. Ha egy egészében normális
      // tartomány kívül esik rajta, a pár meg van fordítva.
      const crit = d.domain?.critical;
      if (crit && d.reference?.ranges?.length) {
        const [lo, hi] = crit;
        for (const r of d.reference.ranges) {
          const kivul = (v: number | null | undefined) =>
            v != null && ((lo != null && v < lo) || (hi != null && v > hi));
          if (kivul(r.low) && kivul(r.high)) {
            push("error", d.id,
              `a kritikus sáv [${lo ?? "−∞"}, ${hi ?? "∞"}] EGÉSZÉBEN kizárja a(z) ` +
              `„${r.context}” referenciatartományt (${r.low ?? "−∞"}–${r.high ?? "∞"}) — ` +
              `a pár vélhetően fordítva került be, és így a normális értéket ` +
              `jelezné kritikusnak, a kórosat pedig elengedné`);
          }
        }
      }
    }

    // A FELTÉTELEZETT referenciatartományok EGY összesített figyelmeztetést kapnak.
    // Változónként külön kiírva elnyomnák a valódi hibákat, pedig a teendő
    // közös: a táblát egyszer, egyben kell visszaellenőrizni az elsődleges
    // forrással. (A kalkulátoroknál ez KAPU, itt csak jelzés — a különbség oka
    // a `docs/fejlesztes/13-referenciatartomanyok.md` 3. pontjában áll.)
    const assumed = this.all().filter((d) => d.reference?.verification === "assumed");
    if (assumed.length) {
      const bySource = new Map<string, number>();
      for (const d of assumed) {
        const c = d.reference!.source.cite;
        bySource.set(c, (bySource.get(c) ?? 0) + 1);
      }
      for (const [cite, n] of bySource) {
        push("warning", "reference.assumed",
          `${n} változó referenciatartománya FELTÉTELEZETT — ellenőrizendő: ${cite}`);
      }
    }

    // Két primer változó ugyanarra a LOINC-kódra, aliasOf nélkül → a v16 duplikátum-hibája
    const byLoinc = new Map<string, string[]>();
    for (const d of this.all()) {
      const l = d.standards?.loinc;
      if (!l || d.aliasOf) continue;
      byLoinc.set(l, [...(byLoinc.get(l) ?? []), d.id]);
    }
    for (const [loinc, ids] of byLoinc) {
      if (ids.length > 1) {
        push("error", ids.join(", "),
          `${ids.length} primer változó ugyanarra a LOINC-kódra (${loinc}) — aliasOf kell közéjük`);
      }
    }

    // ── CÍMKEÜTKÖZÉS ────────────────────────────────────────────────
    //
    // Két változó, amelyik EGYFORMÁN néz ki minden listában: a lekérdezőben,
    // az export fejlécében, a mezőválasztóban. Nem feltétlenül ismétlődés —
    // a `status.obs.fundalHeight` (lelet) és a `…fundalHeight.cm` (mért érték)
    // két KÜLÖNBÖZŐ dolog volt, csak egyforma névvel. De aki a listából
    // választ, nem tudja megmondani, melyiket kapta.
    //
    // A címkének ezért ÖNMAGÁBAN egyértelműnek kell lennie — nem a
    // környezetéből, mert az export fejlécének nincs környezete.
    const byLabel = new Map<string, string[]>();
    for (const d of this.all()) {
      if (d.aliasOf) continue;                    // a tükör szándékosan egyezik
      const key = (d.label?.hu ?? "").trim().toLowerCase();
      if (!key) continue;
      (byLabel.get(key) ?? byLabel.set(key, []).get(key)!).push(d.id);
    }
    for (const [label, ids] of byLabel) {
      if (ids.length < 2) continue;
      push("warning", ids[0],
        `CÍMKEÜTKÖZÉS: „${label}” ${ids.length} változón (${ids.join(", ")}). ` +
        `Ezek minden listában egyformán néznek ki — a lekérdezőben, az export ` +
        `fejlécében, a mezőválasztóban. A címkének önmagában kell egyértelműnek ` +
        `lennie, mert az export fejlécének nincs környezete.`);
    }

    return issues;
  }
}
