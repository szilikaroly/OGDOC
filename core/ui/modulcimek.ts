/**
 * MODULCÍMEK — a modulkulcsok megjelenítendő neve, adatként.
 *
 * A felület a NYERS modulkulcsot írta ki fejlécként: „hx.repro”, „pedgyn”,
 * „exam.obs”. Egy fejlesztői csontvázban ez a pontosabb azonosító; klinikus
 * elé kerülve 46 hiányzó név. A név ADAT, NEM KÓD: a regiszterben van, nem a
 * HTML-ben, és ugyanaz a fájl szolgálja ki a magyar és az angol felületet.
 *
 * KÉT IRÁNYÚ ELLENŐRZÉS. Minden regiszterbeli modulkulcsnak kell cím — különben
 * a felület visszaesik a nyers kulcsra, JELÖLVE, mint minden más forrásnyelvi
 * visszaesésnél. És minden címnek kell létező modulkulcs — különben egy
 * átnevezés után elárvult sor marad, ami hazudik.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { I18n, Lang } from "../types.ts";
import { pick } from "../i18n.ts";

export interface ModulCim {
  kulcs: string;
  cim: I18n;
  csoport: string;
  leiras?: I18n;
}

export interface ModulCsoport {
  id: string;
  cim: I18n;
  sorrend: number;
}

export interface ModulCimKeszlet {
  megnevezes: string;
  note: string;
  csoportok: ModulCsoport[];
  modulok: ModulCim[];
}

export function loadModulcimek(path: string): ModulCimKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as ModulCimKeszlet;
}

export interface Cimzes {
  title: string;
  titleFallback: boolean;
  description: string | null;
  group: string;
  groupTitle: string;
  groupOrder: number;
}

/**
 * EGY MODULKULCS CÍMZÉSE. Ha nincs a készletben, a kulcs jön vissza —
 * `titleFallback: true`-val, hogy a felület jelölje.
 */
export function cimzes(k: ModulCimKeszlet | null, kulcs: string, lang: Lang): Cimzes {
  const m = k?.modulok.find((x) => x.kulcs === kulcs);
  if (!m) {
    return { title: kulcs, titleFallback: true, description: null,
             group: "egyeb", groupTitle: kulcs, groupOrder: 999 };
  }
  const cs = k!.csoportok.find((c) => c.id === m.csoport);
  const t = pick(m.cim, lang);
  const g = cs ? pick(cs.cim, lang) : null;
  return {
    title: t.text || kulcs,
    titleFallback: t.fallback || !t.text,
    description: m.leiras ? (pick(m.leiras, lang).text || null) : null,
    group: m.csoport,
    groupTitle: g?.text || m.csoport,
    groupOrder: cs?.sorrend ?? 999,
  };
}

export function validateModulcimek(
  k: ModulCimKeszlet, modulKulcsok: Iterable<string>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const kulcsok = new Set(modulKulcsok);
  const cimzett = new Set<string>();
  const csoportIdk = new Set(k.csoportok.map((c) => c.id));

  for (const m of k.modulok) {
    if (cimzett.has(m.kulcs)) {
      out.push({ severity: "error", id: m.kulcs, message: "Ismétlődő modulcím." });
    }
    cimzett.add(m.kulcs);
    if (!kulcsok.has(m.kulcs)) {
      out.push({ severity: "error", id: m.kulcs,
        message:
          "Elárvult modulcím: a(z) „" + m.kulcs + "” kulcshoz a regiszterben egyetlen " +
          "változó sem tartozik. Egy átnevezés után az ilyen sor hazudik — töröld " +
          "vagy nevezd át." });
    }
    if (!m.cim?.hu?.trim()) {
      out.push({ severity: "error", id: m.kulcs,
        message: "A(z) „" + m.kulcs + "” modulcímnek nincs forrásnyelvi (hu) alakja." });
    }
    if (!csoportIdk.has(m.csoport)) {
      out.push({ severity: "error", id: m.kulcs,
        message: "A(z) „" + m.kulcs + "” modul ismeretlen csoportra hivatkozik: „" +
          m.csoport + "”." });
    }
  }
  for (const kulcs of kulcsok) {
    if (!cimzett.has(kulcs)) {
      out.push({ severity: "error", id: kulcs,
        message:
          "A(z) „" + kulcs + "” modulkulcsnak nincs címe. A felület a nyers kulcsot " +
          "írná ki fejlécként — jelölve, de klinikus elé így nem kerülhet." });
    }
  }
  const sorrendek = k.csoportok.map((c) => c.sorrend);
  if (new Set(sorrendek).size !== sorrendek.length) {
    out.push({ severity: "error", id: "csoportok",
      message: "Két csoportnak ugyanaz a sorrendje — a navigátor sorrendje így nem determinisztikus." });
  }
  return out;
}

export function merleg(k: ModulCimKeszlet, lang: Lang = "en") {
  return {
    modul: k.modulok.length,
    csoport: k.csoportok.length,
    forditatlan: k.modulok.filter((m) => pick(m.cim, lang).fallback).length,
    leirasNelkul: k.modulok.filter((m) => !m.leiras?.hu).length,
  };
}
