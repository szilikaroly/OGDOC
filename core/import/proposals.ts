/**
 * JAVASLATTÁR — a kinyert állítások, amíg állítások.
 *
 * A tár nem cache és nem előszoba: ez az a hely, ahol a gépi kinyerés
 * MEGÁLL. Innen egyetlen út vezet a betegdokumentációba, és azon egy ember
 * áll: a megerősítés. A megerősített érték eredete `clinician` lesz — mert
 * onnantól nem a gép állítja, hanem az, aki jóváhagyta —, és `sourceRef`-en
 * keresztül visszamutat a javaslatra, tehát a lánc végig visszakövethető.
 *
 * NÉGY SZABÁLY, MIND SZERKEZETI:
 *
 *   1. Hivatkozás nélküli javaslat nem vehető fel. Ha nem tudjuk megmutatni,
 *      HOL mondja a dokumentum, akkor a megerősítés vak lenne.
 *   2. Gépi magabiztosság sosem erősít meg. Nincs küszöb, ami fölött
 *      kimarad az ember — a 0,99 is javaslat marad.
 *   3. Az elutasított javaslat MEGMARAD. Az „megnéztük és nem" információ,
 *      és az újraimport nem támaszthatja fel.
 *   4. Az ütközést látni kell. Ha a javaslat ellentmond egy már rögzített
 *      értéknek, az nem csendes felülírás és nem csendes eldobás.
 */
import { setValue } from "../derive/engine.ts";
import { resolve } from "../derive/resolve.ts";
import type { Registry } from "../registry.ts";
import type { CaseState } from "../types.ts";
import type { Proposal, ProposalStatus, SourceDocument } from "./types.ts";

export interface ConflictInfo {
  proposal: string;
  variable: string;
  /** A már rögzített érték. */
  existing: unknown;
  proposed: unknown;
  why: string;
}

export interface ConfirmResult {
  ok: boolean;
  why: string;
}

export class ProposalStore {
  private byId = new Map<string, Proposal>();
  private docs = new Map<string, SourceDocument>();

  addDocument(d: SourceDocument): void {
    if (this.docs.has(d.id)) throw new Error(`Duplikált dokumentum: ${d.id}`);
    this.docs.set(d.id, d);
  }
  document(id: string): SourceDocument | undefined { return this.docs.get(id); }

  /**
   * Javaslat felvétele.
   *
   * A hivatkozás (`span`) kötelező, és a szövegrészletnek nem szabad üresnek
   * lennie: egy „valahol a 3. oldalon" hivatkozás nem hivatkozás.
   */
  add(p: Proposal): void {
    if (this.byId.has(p.id)) throw new Error(`Duplikált javaslat: ${p.id}`);
    if (!this.docs.has(p.document)) {
      throw new Error(
        `A(z) ${p.id} javaslat ismeretlen dokumentumra hivatkozik ` +
        `(${p.document}). Forrásdokumentum nélkül nem tudni, mit olvastunk.`);
    }
    if (!p.span || !p.span.text?.trim() || p.span.to <= p.span.from) {
      throw new Error(
        `A(z) ${p.id} javaslatnak nincs használható forráshivatkozása. ` +
        `Hivatkozás nélkül a megerősítés vak: az ember azt hagyná jóvá, amit ` +
        `a gép mond, nem azt, amit a dokumentum.`);
    }
    // Ugyanarra a változóra és ugyanarra az időpontra érkező ÚJABB javaslat a
    // korábbit leváltja — de nem törli: a korábbi `superseded` lesz, és
    // látszik, hogy volt egy másik olvasat.
    for (const q of this.byId.values()) {
      if (q.status === "pending" && q.variable === p.variable &&
          (q.t ?? null) === (p.t ?? null) && (q.scope ?? null) === (p.scope ?? null)) {
        q.status = "superseded";
      }
    }
    this.byId.set(p.id, { ...p });
  }

  get(id: string): Proposal | undefined { return this.byId.get(id); }
  all(): Proposal[] { return [...this.byId.values()]; }
  byStatus(s: ProposalStatus): Proposal[] {
    return this.all().filter((p) => p.status === s);
  }

  /**
   * A sorban álló javaslatok, gépi magabiztosság szerint csökkenően.
   *
   * A rendezés KÉNYELEM, nem szűrés: az utolsó tétel ugyanúgy döntést vár,
   * mint az első. Aki csak a lista tetejét nézi meg, az nem hagyta jóvá a
   * többit — csak nem döntött róluk.
   */
  queue(): Proposal[] {
    return this.byStatus("pending")
      .sort((a, b) => (b.machineConfidence ?? 0) - (a.machineConfidence ?? 0));
  }

  /**
   * Ütközések: mely javaslatok mondanak mást, mint a már rögzített adat.
   *
   * Az ütközés nem hiba — lehet, hogy a régi lelet a pontosabb. De el kell
   * dönteni, és ehhez látni kell.
   */
  conflicts(reg: Registry, state: CaseState): ConflictInfo[] {
    const out: ConflictInfo[] = [];
    for (const p of this.byStatus("pending")) {
      const r = resolve(reg, state, p.variable);
      if (r.state !== "ok") continue;
      if (JSON.stringify(r.value) === JSON.stringify(p.value)) continue;
      out.push({
        proposal: p.id, variable: p.variable, existing: r.value, proposed: p.value,
        why:
          `A(z) ${p.variable} már rögzítve van (${JSON.stringify(r.value)}), a ` +
          `dokumentum viszont ${JSON.stringify(p.value)} értéket mond. A ` +
          `rendszer egyiket sem választja: a régi lelet lehet a pontosabb, és ` +
          `az is lehet, hogy a beolvasás hibázott.`,
      });
    }
    return out;
  }

  /**
   * MEGERŐSÍTÉS — ez teszi a javaslatot adattá.
   *
   * A megerősítő nevét kötelező megadni. Nem formaiság: a megerősített érték
   * eredete `clinician`, tehát valakinek az állítása lesz — és a rendszerben
   * nincs névtelen állítás.
   */
  confirm(
    id: string, by: string, at: string,
    opts: { correctedValue?: unknown; note?: string } = {},
  ): ConfirmResult {
    const p = this.byId.get(id);
    if (!p) return { ok: false, why: `Nincs ilyen javaslat: ${id}` };
    if (p.status !== "pending") {
      return { ok: false, why: `A(z) ${id} javaslat állapota már „${p.status}”.` };
    }
    if (!by.trim()) {
      return {
        ok: false,
        why:
          "A megerősítéshez meg kell nevezni a megerősítőt: a megerősített " +
          "érték az Ő állítása lesz, és a rendszerben nincs névtelen állítás.",
      };
    }
    p.status = "confirmed";
    p.decidedBy = by;
    p.decidedAt = at;
    if ("correctedValue" in opts) p.correctedValue = opts.correctedValue;
    if (opts.note) p.note = opts.note;
    return { ok: true, why: `Megerősítve: ${by} (${at}).` };
  }

  /** Elutasítás. A javaslat MEGMARAD, indokkal. */
  reject(id: string, by: string, at: string, note: string): ConfirmResult {
    const p = this.byId.get(id);
    if (!p) return { ok: false, why: `Nincs ilyen javaslat: ${id}` };
    if (p.status !== "pending") {
      return { ok: false, why: `A(z) ${id} javaslat állapota már „${p.status}”.` };
    }
    if (!note.trim()) {
      return {
        ok: false,
        why:
          "Az elutasításhoz indok kell. Enélkül egy későbbi import ugyanazt a " +
          "javaslatot újra felhozná, és nem derülne ki, hogy már döntöttünk róla.",
      };
    }
    p.status = "rejected";
    p.decidedBy = by;
    p.decidedAt = at;
    p.note = note;
    return { ok: true, why: `Elutasítva: ${note}` };
  }

  /**
   * A MEGERŐSÍTETT javaslatok beírása az esetbe.
   *
   * Csak a `confirmed` állapotúak. A `pending` javaslat nem kerül be
   * „ideiglenesen" sem: nincs olyan állapot, amiben egy meg nem erősített
   * kinyerés bármelyik levezetést, score-t vagy dokumentumot befolyásolná.
   */
  toValues(reg: Registry, state: CaseState): CaseState {
    let s = state;
    for (const p of this.byStatus("confirmed")) {
      const value = "correctedValue" in p ? p.correctedValue : p.value;
      s = setValue(reg, s, p.variable, value, {
        // A megerősítő állítja, nem a gép. A `sourceRef` viszi vissza a
        // javaslathoz, és azon át a dokumentum pontos helyéhez.
        provenance: "clinician",
        confidence: p.confidence ?? "reported",
        t: p.t ?? undefined,
        sourceRef: `import:${p.id}`,
        ...(p.scope ? { scope: p.scope } : {}),
      });
    }
    return s;
  }

  /** Mennyi van hátra — a felületen mindig látszania kell. */
  summary(): { pending: number; confirmed: number; rejected: number; superseded: number } {
    return {
      pending: this.byStatus("pending").length,
      confirmed: this.byStatus("confirmed").length,
      rejected: this.byStatus("rejected").length,
      superseded: this.byStatus("superseded").length,
    };
  }
}
