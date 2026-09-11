/**
 * FUNKCIÓK — egy modul kezdőlapjának fő funkciói. A funkció adat, nem kód.
 *
 * A második változat a modulok mezőit egyetlen listában mutatta: a státusz 105
 * mezője egymás alatt. A klinikai vizit nem így megy: a nőgyógyász „manuális
 * vizsgálat”, „kolposzkópia”, „kenetek” fejjel gondolkodik, és a mezők ezek
 * mögött vannak — más-más regiszter-modulból. A funkció ezt a réteget adja:
 * a modul nyitáskor a fő funkcióit mutatja, egy funkció a mezőit.
 *
 * KÉT SZABÁLY, AMI NEM STÍLUS:
 *
 *   · EGY MEZŐ EGY HELYEN. A kétszeres hozzárendelés hiba: két vezérlő
 *     ugyanarra a mezőre két igazság volna a képernyőn.
 *   · A VIRTUÁLIS SZAKASZ ELVISZI A MEZŐT. Ha a Nőgyógyászat a státusz
 *     kolposzkópiáját kéri, az a státuszból eltűnik — nem másolódik.
 *
 * A regiszter-modul (hol van DOKUMENTÁLVA a változó) és a felületi szakasz
 * (hol TALÁLKOZIK vele a klinikus) mostantól két különböző dolog.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { I18n } from "../types.ts";

export interface Funkcio {
  kulcs: string;
  cim: I18n;
  /** Mezőazonosítók vagy előtagok: „x” fedi az „x” és az „x.*” mezőket. */
  mezok: string[];
  leiras?: I18n;
  /** Tervezett funkció: még nincs mezője. A kezdőlapon szaggatottan látszik — a hiány megszólal. */
  tervezett?: boolean;
}

export interface Szakasz {
  kulcs: string;
  /** Nem regiszter-modul: más modulok mezőit gyűjti egy vizit köré. */
  virtualis?: boolean;
  funkciok: Funkcio[];
}

export interface FunkcioKeszlet {
  megnevezes: string;
  note?: string;
  szakaszok: Szakasz[];
}

export function loadFunkciok(path: string): FunkcioKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as FunkcioKeszlet;
}

/** Fedi-e a bejegyzés a mezőt: pontos egyezés, vagy az „x.” előtag. */
export function illik(bejegyzes: string, id: string): boolean {
  return id === bejegyzes || id.startsWith(bejegyzes + ".");
}

export interface Hozzarendeles {
  /** mezőazonosító → { szakasz, funkció } */
  mezo: Map<string, { szakasz: string; funkcio: string }>;
  /** kétszeres hozzárendelések — hibák */
  utkozes: Array<{ id: string; a: string; b: string }>;
  /** bejegyzések, amik egyetlen mezőt sem fednek */
  ures: Array<{ szakasz: string; funkcio: string; bejegyzes: string }>;
}

/** Melyik mező melyik szakasz melyik funkciójához tartozik. */
export function hozzarendel(k: FunkcioKeszlet, mezoIdk: Iterable<string>): Hozzarendeles {
  const idk = [...mezoIdk];
  const mezo = new Map<string, { szakasz: string; funkcio: string }>();
  const utkozes: Hozzarendeles["utkozes"] = [];
  const ures: Hozzarendeles["ures"] = [];
  for (const sz of k.szakaszok) {
    for (const f of sz.funkciok) {
      for (const b of f.mezok) {
        let talalt = 0;
        for (const id of idk) {
          if (!illik(b, id)) continue;
          talalt++;
          const volt = mezo.get(id);
          const most = sz.kulcs + "/" + f.kulcs;
          if (volt && (volt.szakasz !== sz.kulcs || volt.funkcio !== f.kulcs)) {
            utkozes.push({ id, a: volt.szakasz + "/" + volt.funkcio, b: most });
            continue;
          }
          mezo.set(id, { szakasz: sz.kulcs, funkcio: f.kulcs });
        }
        if (!talalt) ures.push({ szakasz: sz.kulcs, funkcio: f.kulcs, bejegyzes: b });
      }
    }
  }
  return { mezo, utkozes, ures };
}

/**
 * A FELÜLETI SZAKASZOK KULCSAI: a regiszter-modulok, amelyeknek marad mezője,
 * plusz a virtuális szakaszok. Ez a készlet megy a modulcímek és a
 * feladatprofilok validálásába — nem a regiszter-modulok nyers listája, mert
 * egy kiürült modul (minden mezője virtuális szakaszba ment) a felületen
 * nem létezik, és címet vagy profilt sem kaphat.
 */
export function szakaszKulcsok(
  k: FunkcioKeszlet | null, mezok: Iterable<{ id: string; module: string }>,
): Set<string> {
  const lista = [...mezok];
  if (!k) return new Set(lista.map((m) => m.module));
  const h = hozzarendel(k, lista.map((m) => m.id));
  const virtualis = new Set(k.szakaszok.filter((s) => s.virtualis).map((s) => s.kulcs));
  const out = new Set<string>();
  for (const m of lista) {
    const cel = h.mezo.get(m.id);
    out.add(cel && virtualis.has(cel.szakasz) ? cel.szakasz : m.module);
  }
  return out;
}

export function validateFunkciok(
  k: FunkcioKeszlet, mezok: Iterable<{ id: string; module: string }>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const lista = [...mezok];
  const modulok = new Set(lista.map((m) => m.module));
  const modulOf = new Map(lista.map((m) => [m.id, m.module]));
  const h = hozzarendel(k, lista.map((m) => m.id));
  const latott = new Set<string>();
  for (const sz of k.szakaszok) {
    if (latott.has(sz.kulcs)) out.push({ severity: "error", id: sz.kulcs, message: "Ismétlődő szakasz a funkciókészletben." });
    latott.add(sz.kulcs);
    if (sz.virtualis && modulok.has(sz.kulcs)) {
      out.push({ severity: "error", id: sz.kulcs,
        message: "A(z) „" + sz.kulcs + "” virtuális szakasz kulcsa egy létező regiszter-modulé — a kettő nem lehet ugyanaz." });
    }
    if (!sz.virtualis && !modulok.has(sz.kulcs)) {
      out.push({ severity: "error", id: sz.kulcs,
        message: "A(z) „" + sz.kulcs + "” szakasz nem regiszter-modul és nem virtuális — nincs mihez tartoznia." });
    }
    const fk = new Set<string>();
    for (const f of sz.funkciok) {
      if (fk.has(f.kulcs)) out.push({ severity: "error", id: sz.kulcs + "/" + f.kulcs, message: "Ismétlődő funkciókulcs." });
      fk.add(f.kulcs);
      if (!f.cim?.hu?.trim()) out.push({ severity: "error", id: sz.kulcs + "/" + f.kulcs, message: "A funkciónak nincs forrásnyelvi (hu) címe." });
      const fedett = [...h.mezo].filter(([, v]) => v.szakasz === sz.kulcs && v.funkcio === f.kulcs).map(([id]) => id);
      if (!fedett.length && !f.tervezett) {
        out.push({ severity: "error", id: sz.kulcs + "/" + f.kulcs,
          message: "A(z) „" + f.cim.hu + "” funkció egyetlen mezőt sem fed. Ha tervezett, mondd ki (tervezett: true) — a kezdőlap akkor hiányként mutatja." });
      }
      if (fedett.length && f.tervezett) {
        out.push({ severity: "warning", id: sz.kulcs + "/" + f.kulcs, message: "Tervezettnek jelölt funkció, pedig már van mezője." });
      }
      if (!sz.virtualis) {
        for (const id of fedett) if (modulOf.get(id) !== sz.kulcs) {
          out.push({ severity: "error", id: sz.kulcs + "/" + f.kulcs,
            message: "A(z) „" + id + "” mező a(z) „" + modulOf.get(id) + "” modulé — nem virtuális szakasz funkciója csak a saját moduljának mezőit fedheti." });
        }
      }
    }
  }
  for (const u of h.utkozes) {
    out.push({ severity: "error", id: u.id,
      message: "A(z) „" + u.id + "” mező két funkcióhoz tartozik: " + u.a + " és " + u.b + ". Egy mező egy helyen." });
  }
  for (const u of h.ures) {
    out.push({ severity: "error", id: u.szakasz + "/" + u.funkcio,
      message: "A(z) „" + u.bejegyzes + "” bejegyzés egyetlen mezőt sem fed — elgépelés vagy átnevezés." });
  }
  return out;
}

export function merleg(k: FunkcioKeszlet, mezok: Iterable<{ id: string; module: string }>) {
  const lista = [...mezok];
  const h = hozzarendel(k, lista.map((m) => m.id));
  const virtualis = new Set(k.szakaszok.filter((s) => s.virtualis).map((s) => s.kulcs));
  let athelyezett = 0;
  for (const m of lista) { const c = h.mezo.get(m.id); if (c && virtualis.has(c.szakasz)) athelyezett++; }
  return {
    szakasz: k.szakaszok.length,
    virtualis: virtualis.size,
    funkcio: k.szakaszok.reduce((n, s) => n + s.funkciok.length, 0),
    tervezett: k.szakaszok.reduce((n, s) => n + s.funkciok.filter((f) => f.tervezett).length, 0),
    fedett: h.mezo.size,
    athelyezett,
  };
}
