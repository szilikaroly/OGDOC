/**
 * ANALIT-CSOPORTOK — ugyanaz a mérés, több mezőben.
 *
 * A rendszerben visszatérő hibacsalád, hogy ugyanaz a klinikai tény több
 * változóban él, és a rétegek külön-külön nézik őket: a Bishop-pontszám
 * összetevői, a magzatvízmennyiség, az allergia öt mezőben — és most az éhomi
 * vércukor.
 *
 * A vércukornál a következmény éles. Ugyanaz a minta, ugyanaz a mértékegység:
 *
 *   `lab.ogtt.0`            kritikus küszöb 5,1 mmol/L  (WHO 2013 / IADPSG)
 *   `lab.glucose.fasting`   kritikus küszöb 7,0 mmol/L  (nem terhes)
 *
 * Egy 5,8-as érték terhesen a terhességi cukorbetegség diagnosztikus küszöbe
 * fölött van — de attól függött, MELYIK MEZŐBE gépelték be, hogy lett-e belőle
 * riasztás. A hiba nem a számokban van: mindkettő helyes a maga helyén. A hiba
 * az, hogy semmi nem vetette össze őket.
 *
 * A csoport ADAT, nem kód: egy új analit felvételéhez nem szabad kódot írni.
 * A validáló azt kérdezi, hogy a csoport tagjai ugyanabban a kontextusban
 * ugyanazt a küszöböt mondják-e — és ha nem, a különbségnek KIMONDOTT oka
 * legyen, ne véletlen.
 */
import { readFileSync } from "node:fs";
import type { Registry, RegistryIssue } from "../registry.ts";

export interface AnalitCsoport {
  id: string;
  megnevezes: string;
  /** A mértékegység, amiben a tagoknak egyezniük KELL. */
  egyseg: string;
  tagok: string[];
  /**
   * Mely kontextusokban kell a kritikus küszöbnek egyeznie. Üres = mindben.
   * A kulcsok a referenciaréteg kontextusai.
   */
  kontextusok: string[];
  /** Ha a tagok szándékosan eltérnek: MIÉRT. Ok nélkül az eltérés hiba. */
  eltéresOka?: Record<string, string>;
  forras: string;
}

export interface AnalitKeszlet {
  megnevezes: string;
  note: string;
  csoportok: AnalitCsoport[];
}

export function loadAnalitok(path: string): AnalitKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as AnalitKeszlet;
}

function kuszob(
  reg: Registry, id: string, ctx: string,
): [number | null, number | null] | null {
  const d = reg.get(reg.resolvePrimary(id));
  if (!d) return null;
  const t = d.domain?.criticalByContext;
  if (t && t[ctx]) return t[ctx];
  return d.domain?.critical ?? null;
}

const eq = (a: [number | null, number | null] | null,
            b: [number | null, number | null] | null): boolean =>
  a === b || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);

export function validateAnalitok(k: AnalitKeszlet, reg: Registry): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const cs of k.csoportok) {
    if (cs.tagok.length < 2) {
      out.push({ severity: "error", id: cs.id,
        message: `A(z) „${cs.megnevezes}” csoportnak egyetlen tagja van — így nincs mit összevetni.` });
      continue;
    }
    for (const t of cs.tagok) {
      const d = reg.get(reg.resolvePrimary(t));
      if (!d) {
        out.push({ severity: "error", id: cs.id,
          message: `A(z) „${cs.megnevezes}” csoport nem létező változóra hivatkozik: „${t}”.` });
        continue;
      }
      if (d.unit !== cs.egyseg) {
        out.push({ severity: "error", id: cs.id,
          message:
            `A(z) „${t}” mértékegysége „${d.unit}”, a csoporté „${cs.egyseg}”. ` +
            `Eltérő egységű értékeket összevetni rosszabb, mint össze sem vetni: ` +
            `a különbség számnak látszik.` });
      }
    }
    const ctxek = cs.kontextusok.length ? cs.kontextusok : ["nonpregnant"];
    for (const ctx of ctxek) {
      const parok = cs.tagok.map((t) => ({ t, k: kuszob(reg, t, ctx) }));
      const elso = parok[0];
      for (const p of parok.slice(1)) {
        if (eq(elso.k, p.k)) continue;
        const ok = cs.eltéresOka?.[ctx];
        out.push({ severity: ok ? "warning" : "error", id: `${cs.id}.${ctx}`,
          message:
            `UGYANAZ AZ ANALIT, KÉT KÜSZÖB: a(z) „${elso.t}” és a(z) „${p.t}” ` +
            `kritikus küszöbe a(z) „${ctx}” kontextusban eltér ` +
            `(${JSON.stringify(elso.k)} vs ${JSON.stringify(p.k)}). ` +
            (ok
              ? `Kimondott ok: ${ok}`
              : `Ok nincs megnevezve. Ugyanabból a mintából ugyanaz az érték ` +
                `attól függően vált ki riasztást, hogy melyik mezőbe gépelték — ` +
                `és a hiba nem a számokban van, hanem abban, hogy semmi nem ` +
                `vetette össze őket.`) });
      }
    }
  }
  return out;
}

export interface AnalitMerleg {
  csoport: number;
  tag: number;
  /** Hány tagnak van kontextusfüggő küszöbe. */
  kontextusfuggo: number;
}

export function merleg(k: AnalitKeszlet, reg: Registry): AnalitMerleg {
  const tagok = k.csoportok.flatMap((c) => c.tagok);
  return {
    csoport: k.csoportok.length, tag: tagok.length,
    kontextusfuggo: tagok.filter((t) => {
      const d = reg.get(reg.resolvePrimary(t));
      return !!d?.domain?.criticalByContext;
    }).length,
  };
}
