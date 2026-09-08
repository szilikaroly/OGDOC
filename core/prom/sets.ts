/**
 * BETEG ÁLTAL JELENTETT KIMENETEL — mely készlet mikor, és mi hiányzik hozzá.
 *
 * A modul elfogadási kritériuma:
 *
 *   „A 42. napos mérési ponton a beteg által kitöltött készletek pontszáma az
 *    ICHOM pontozási szabálya szerint számolódik… A 08 modul EPDS-e és ez a
 *    modul EPDS-e UGYANAZ A VÁLTOZÓ, nem két külön kitöltés."
 *
 * A második mondat a fontosabb, és a regiszter oldja meg, nem ez a réteg: a
 * `prom.mh.epds.total` az `aliasOf` mechanizmussal a `psy.epds.total`-ra
 * mutat. Két külön mező azt jelentené, hogy a beteg kétszer tölti ki
 * ugyanazt — és a két érték előbb-utóbb eltérne.
 *
 * Amit ez a réteg ad: melyik mérési ponton melyik készlet esedékes, mi
 * hiányzik belőle, és MELYIK NEM VEHETŐ FEL EGYÁLTALÁN. Az utolsó a lényeg:
 * hat eszközből ma egy sem vehető fel, mert a validált tételszöveg
 * licencköteles. Egy „kicsit érthetőbbre fogalmazott" EPDS-tétel már nem
 * EPDS, és az eredménye nem hasonlítható semmihez.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Instruments } from "../kerdoiv/registry.ts";

const L = (x: I18n | undefined, lang: Lang): string => x?.[lang] ?? x?.hu ?? x?.en ?? "";

export interface PromSet {
  id: string;
  /** Melyik ICHOM mérési ponthoz tartozik (`pp42`). */
  point: string;
  label: I18n;
  instruments: string[];
  note?: I18n;
}

export type InstrumentReadiness =
  /** Felvehető, és fel is van véve. */
  | "scored"
  /** Felvehető, de még nincs kitöltve. */
  | "pending"
  /** NEM vehető fel: a validált tételszöveg licence hiányzik. */
  | "blocked"
  /** Felvehető, de a magyar fordítás nem validált. */
  | "unvalidatedTranslation";

export interface InstrumentState {
  instrument: string;
  abbrev: string;
  readiness: InstrumentReadiness;
  total?: number;
  band?: string;
  why: string;
  /** Publikálható-e a vele gyűjtött adat korlátozás nélkül. */
  publishable: boolean;
}

export interface SetState {
  set: string;
  point: string;
  label: string;
  instruments: InstrumentState[];
  /** Minden felvehető eszköz ki van töltve. */
  complete: boolean;
  /** Hány eszköz van licenc-kapu mögött. */
  blocked: number;
  caveat: string;
}

export class PromSets {
  private sets: PromSet[];

  constructor(sets: PromSet[]) {
    this.sets = sets;
    const seen = new Set<string>();
    for (const s of sets) {
      if (seen.has(s.id)) throw new Error(`Duplikált PROM-készlet: ${s.id}`);
      seen.add(s.id);
    }
  }

  all(): PromSet[] { return [...this.sets]; }
  forPoint(point: string): PromSet | undefined { return this.sets.find((s) => s.point === point); }

  state(
    reg: Registry, inst: Instruments, state: CaseState, point: string, lang: Lang = "hu",
  ): SetState {
    const set = this.forPoint(point);
    if (!set) throw new Error(`Nincs PROM-készlet ehhez a mérési ponthoz: ${point}`);

    const instruments: InstrumentState[] = [];
    for (const id of set.instruments) {
      const def = inst.get(id);
      if (!def) continue;
      const adm = inst.administrable(id, lang);
      const translationOk = def.translation.status === "validated";

      if (!adm.ok) {
        instruments.push({
          instrument: id, abbrev: def.abbrev, readiness: "blocked",
          publishable: false,
          why:
            `NEM VEHETŐ FEL: ${adm.reason}. Saját megfogalmazású tételekkel a ` +
            `skála nem ${def.abbrev}, és az eredménye nem hasonlítható semmihez.`,
        });
        continue;
      }

      const scored = inst.score(reg, state, id, lang);
      if (scored.status === "ok") {
        instruments.push({
          instrument: id, abbrev: def.abbrev,
          readiness: translationOk ? "scored" : "unvalidatedTranslation",
          total: scored.total, band: scored.band.label,
          publishable: translationOk,
          why: translationOk
            ? "felvéve és pontozva"
            : "Felvéve, DE a magyar fordítás nem validált: a vele gyűjtött adat " +
              "publikálhatósága korlátozott, és az exportban jelölve van.",
        });
      } else {
        instruments.push({
          instrument: id, abbrev: def.abbrev, readiness: "pending",
          publishable: translationOk,
          why: "felvehető, de még nincs kitöltve",
        });
      }
    }

    const blocked = instruments.filter((i) => i.readiness === "blocked").length;
    const pending = instruments.filter((i) => i.readiness === "pending").length;
    return {
      set: set.id, point, label: L(set.label, lang), instruments,
      complete: pending === 0 && instruments.length > blocked,
      blocked,
      caveat:
        (blocked
          ? `${blocked} eszköz LICENC-KAPU mögött van a ${instruments.length}-ból: ` +
            `a validált tételszöveg nincs betöltve, ezért nem vehető fel. Ez nem ` +
            `fejlesztői feladat és nem adatgyűjtési mulasztás — beszerzés. `
          : "") +
        (pending ? `${pending} eszköz felvehető, de még nincs kitöltve. ` : "") +
        `A PROM-ot a BETEG tölti ki: a klinikus a válaszát nem írhatja felül, ` +
        `ellentmondást a \`prom.clinicianNote\` mezőben rögzít.`,
    };
  }

  validate(reg: Registry, inst: Instruments): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    for (const s of this.sets) {
      if (!s.instruments.length) {
        issues.push({ severity: "error", id: s.id, message: "üres készlet" });
      }
      for (const i of s.instruments) {
        if (!inst.get(i)) {
          issues.push({ severity: "error", id: s.id, message: `ismeretlen mérőeszköz: ${i}` });
        }
      }
    }
    // A PROM-változók eredet-kapuja: a beteg válaszát a klinikus nem írhatja
    // felül. Két kivétel, és mindkettő a KÖRNYEZETRŐL szól, nem a válaszról:
    // a névsor (mely eszközök kerültek felvételre) és a klinikusi megjegyzés.
    const rosters = new Set(
      reg.all().map((d) => d.scopedBy?.roster).filter((r): r is string => !!r),
    );
    for (const d of reg.all()) {
      if (d.module !== "prom" || d.aliasOf || d.derivation) continue;
      if (d.scopedBy || rosters.has(d.id)) continue;
      const allowed = d.provenanceAllowed ?? [];
      if (!allowed.includes("patient") || allowed.includes("clinician")) {
        issues.push({
          severity: "error", id: d.id,
          message:
            "a PROM-változó eredete kizárólag `patient` lehet — a beteg saját " +
            "válaszát a klinikus nem írhatja felül",
        });
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadPromSets(...paths: string[]): PromSets {
  const out: PromSet[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a PROM-készlet fájl tömböt vár`);
      out.push(...parsed);
    }
  }
  return new PromSets(out);
}
