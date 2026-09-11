/**
 * FELADATPROFILOK — a felület feladat szerint adaptív, nem szerep szerint szűkített.
 *
 * A jogosultság dönti el, mit LEHET látni (megbízás × hatókör × idő). A
 * feladatprofil azt, mi legyen NYITVA és ELÖL. A kettő nem keverhető: egy
 * szülésznő a labort is láthatja, ha a jogosultsága engedi — csak nem az van
 * elöl. A profil ADAT: új feladat felvétele egy regiszterbejegyzés.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { I18n, Lang } from "../types.ts";
import { pick } from "../i18n.ts";

export interface FeladatProfil {
  id: string;
  cim: I18n;
  /** Mely csoportoknak ez az alapértelmezett. */
  csoportok: string[];
  /** Mely modulok nyílnak, ebben a sorrendben. */
  modulok: string[];
  /** Mely segédpanelek kerülnek elöl. */
  seged: string[];
  leiras?: I18n;
}

export interface FeladatKeszlet {
  megnevezes: string;
  note: string;
  seged_panelek: string[];
  profilok: FeladatProfil[];
}

export function loadFeladatok(path: string): FeladatKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as FeladatKeszlet;
}

/** A felületnek szánt, nyelvre kész alak. */
export interface FeladatNezet {
  id: string;
  title: string;
  titleFallback: boolean;
  description: string | null;
  csoportok: string[];
  modulok: string[];
  seged: string[];
}

export function feladatNezet(k: FeladatKeszlet, lang: Lang): FeladatNezet[] {
  return k.profilok.map((p) => {
    const t = pick(p.cim, lang);
    return {
      id: p.id, title: t.text || p.id, titleFallback: t.fallback,
      description: p.leiras ? (pick(p.leiras, lang).text || null) : null,
      csoportok: p.csoportok, modulok: p.modulok, seged: p.seged,
    };
  });
}

/**
 * MELYIK PROFIL AZ ALAPÉRTELMEZETT EGY CSOPORTNAK. Ha többnek is az, az
 * ELSŐ a listában — a sorrend a regiszteré, és ezért van kimondva.
 * Ha egynek sem: `null`, és a felület a betegút sorrendjét mutatja.
 */
export function alapProfil(k: FeladatKeszlet, csoportId: string | null): FeladatProfil | null {
  if (!csoportId) return null;
  return k.profilok.find((p) => p.csoportok.includes(csoportId)) ?? null;
}

export function validateFeladatok(
  k: FeladatKeszlet, modulKulcsok: Iterable<string>, klinikaiCsoportok: Iterable<string>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const modulok = new Set(modulKulcsok);
  const panelek = new Set(k.seged_panelek);
  const lefedett = new Set<string>();
  const idk = new Set<string>();
  for (const p of k.profilok) {
    if (idk.has(p.id)) out.push({ severity: "error", id: p.id, message: "Ismétlődő profilazonosító." });
    idk.add(p.id);
    if (!p.cim?.hu?.trim()) out.push({ severity: "error", id: p.id, message: "A profilnak nincs forrásnyelvi címe." });
    if (!p.modulok.length) out.push({ severity: "error", id: p.id, message: "A profil egyetlen modult sem nyit — üres feladat." });
    if (new Set(p.modulok).size !== p.modulok.length) {
      out.push({ severity: "error", id: p.id, message: "A profil sorrendjében ismétlődő modul van." });
    }
    for (const m of p.modulok) {
      if (!modulok.has(m)) {
        out.push({ severity: "error", id: p.id,
          message: "A(z) „" + p.id + "” profil ismeretlen modulra hivatkozik: „" + m +
            "”. Egy átnevezés után a profil csendben kevesebbet nyitna." });
      }
      lefedett.add(m);
    }
    for (const s of p.seged) {
      if (!panelek.has(s)) out.push({ severity: "error", id: p.id, message: "Ismeretlen segédpanel: „" + s + "”." });
    }
  }
  for (const m of modulok) {
    if (!lefedett.has(m)) {
      out.push({ severity: "warning", id: m,
        message: "A(z) „" + m + "” modult egyetlen feladatprofil sem nyitja meg. A mezői " +
          "csak kézzel kinyitva érhetők el — ha ez szándékos, mondd ki egy profilban." });
    }
  }
  for (const cs of klinikaiCsoportok) {
    if (!k.profilok.some((p) => p.csoportok.includes(cs))) {
      out.push({ severity: "warning", id: cs,
        message: "A(z) „" + cs + "” csoportnak nincs feladatprofilja: a tagjai a betegút " +
          "teljes sorrendjét kapják, feladathoz igazítás nélkül." });
    }
  }
  return out;
}

export function merleg(k: FeladatKeszlet, modulKulcsok: Iterable<string>) {
  const mind = new Set(modulKulcsok);
  const lefedett = new Set(k.profilok.flatMap((p) => p.modulok));
  return {
    profil: k.profilok.length,
    lefedettModul: [...mind].filter((m) => lefedett.has(m)).length,
    osszesModul: mind.size,
    csoportNelkuli: k.profilok.filter((p) => !p.csoportok.length).length,
  };
}
