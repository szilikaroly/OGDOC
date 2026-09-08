/**
 * A 326 SZABÁLY DÖNTÉSSÉ TÉTELE — a 3. lépés gépi fele.
 *
 * A felülettérkép 1502 mezőjéből 95 `refused` és 231 `gate`: összesen 326 mező,
 * ami nem vehető át változatlanul. Ezek nem mezők, hanem SZABÁLYOK, és a döntés
 * nem fejlesztői kérdés — de az, hogy a döntés hol van, mire vonatkozik, meddig
 * érvényes, és mi történik, amíg nincs meg, igen.
 *
 * HÁROM ÁLLÍTÁS, AMIT EZ A RÉTEG MEGTESZ:
 *
 *   1. A 326 mögött 38 szabály áll. Az ülés nem 326-szor dönt, hanem 38-szor —
 *      és ott, ahol egy mező eltér a szabályától, egyedi döntéssel.
 *
 *   2. A HIÁNYZÓ DÖNTÉS SEHOL NEM „ÁTVESSZÜK”. Ez ugyanaz az alapelv, mint a
 *      „hiányzó adat sehol nem »nem«”: eldöntetlenül a mező NEM kerül át. Nem
 *      figyelmeztetés, hanem alapállapot — a rendszer zárva születik.
 *
 *   3. AZ ALÁÍRÁS AHHOZ KÖTŐDIK, AMIT ALÁÍRTAK. Minden döntés annak a
 *      szabálynak a normatív magját (`lenyeg`) rögzíti lenyomatként. Ha a
 *      szabály mondata megváltozik, a döntés `elavult` lesz — nem tűnik el, de
 *      nem is fedezi tovább a megváltozott szabályt. Enélkül egy átfogalmazás
 *      csendben átvinné a régi aláírást egy új szabályra.
 *
 * AMI NEM EZÉ A RÉTEGÉ. Az aláírás. A `dontesek.json` üresen indul, és ez nem
 * hiányosság: a döntést klinikai vezető, DPO és fejlesztés hozza, együtt ülve.
 * A gép ehhez javaslatot ad (`javaslat`), munkalapot állít elő, és megakadályozza,
 * hogy döntés nélkül bármi átcsússzon.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { FieldAudit } from "./felulet.ts";

/** Mi lesz a mezővel. A negyedik lehetőség — „még nem tudjuk” — nem döntés. */
export type DontesFajta = "atvesszuk" | "atalakitva" | "nem";

export const DONTES_FAJTAK: DontesFajta[] = ["atvesszuk", "atalakitva", "nem"];

export interface SzabalyDef {
  rule: string;
  cim: string;
  /** A NORMATÍV MAG: az az egy mondat, amit aláírnak. A lenyomat ezt fedi. */
  lenyeg: string;
  /** Gépi javaslat. NEM döntés — hogy az ülés áttekintés legyen, ne üres lap. */
  javaslat: DontesFajta;
  /** Mit jelent az átalakítás. `atalakitva` javaslatnál ez mondja meg, mit. */
  mit: string;
  /** Mely szerepek aláírása nélkül a döntés nem teljes. */
  kell: string[];
  /**
   * AZ ELŐKÉSZÍTŐ: aki a javaslatot az ülésre viszi, és akinél a labda van.
   * Nem ő dönt egyedül — a `kell` minden szerepének aláírása kell —, de egy
   * felelős nélküli tétel az, ami fél évig senkié.
   */
  felelos: string;
}

export interface SzabalyKatalogus {
  szerepek: Record<string, string>;
  szabalyok: SzabalyDef[];
}

export interface Alairas {
  nev: string;
  /** A `szerepek` egyik kulcsa. */
  szerep: string;
  /** ISO dátum (YYYY-MM-DD). */
  datum: string;
}

export interface Dontes {
  /** Szabályszintű döntés: a szabály minden mezőjére. */
  rule: string;
  /** Mezőszintű eltérés: csak erre az egy mezőre. Szabályszintűnél nincs. */
  form?: string;
  field?: string;
  fajta: DontesFajta;
  /** Egy mondat. Nem opcionális: aláírás indoklás nélkül nem döntés. */
  indoklas: string;
  /** Mit alakítunk át — `atalakitva` esetén kötelező. */
  atalakitas?: string;
  alairok: Alairas[];
  /** A `lenyeg` lenyomata az aláírás pillanatában. */
  lenyomat: string;
}

/** A szabály normatív magjának lenyomata. Ez köti az aláírást a szöveghez. */
export function lenyomat(lenyeg: string): string {
  return createHash("sha256").update(lenyeg, "utf8").digest("hex").slice(0, 16);
}

export function loadSzabalyok(path: string): SzabalyKatalogus {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return { szerepek: raw.szerepek ?? {}, szabalyok: raw.szabalyok ?? [] };
}

export function loadDontesek(path: string): Dontes[] {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return raw.dontesek ?? [];
}

/**
 * A mező döntési állapota.
 *
 * `eldontetlen` és `elavult` KÖZÖTT az a különbség, hogy az utóbbi tud valamit:
 * volt döntés, tudjuk kitől és mikor, csak nem erről a szabályról. A hatásuk
 * ugyanaz — a mező nem kerül át —, de az újradöntés más munka.
 */
export type DontesAllapot = "dontve" | "eldontetlen" | "elavult" | "hianyos";

export interface MezoDontes {
  form: string;
  field: string;
  rule: string;
  status: FieldAudit["status"];
  allapot: DontesAllapot;
  /** `rule` = a szabály döntése vonatkozik rá, `mezo` = egyedi eltérés. */
  szint?: "rule" | "mezo";
  fajta?: DontesFajta;
  dontes?: Dontes;
  /** Miért nem `dontve` — üres, ha az. */
  miert: string;
  /** Átkerül-e a mező. Eldöntetlenül SOHA nem igaz. */
  atkerul: boolean;
}

/** Döntést kívánó állapotok. A `mapped`, `gap`, `derived` nem kíván döntést. */
export function dontendo(a: FieldAudit): boolean {
  return a.status === "refused" || a.status === "gate";
}

function kulcs(form: string, field: string): string {
  return `${form} ${field}`;
}

/**
 * Összeveti az auditot az aláírt döntésekkel.
 *
 * A mezőszintű döntés erősebb a szabályszintűnél: ott, ahol egy mező eltér a
 * szabályától, az eltérést külön írják alá.
 */
export function dontesAllapot(
  audits: FieldAudit[],
  kat: SzabalyKatalogus,
  dontesek: Dontes[],
): MezoDontes[] {
  const szabaly = new Map(kat.szabalyok.map((s) => [s.rule, s]));
  const ruleDontes = new Map<string, Dontes>();
  const mezoDontes = new Map<string, Dontes>();
  for (const d of dontesek) {
    if (d.form && d.field) mezoDontes.set(kulcs(d.form, d.field), d);
    else ruleDontes.set(d.rule, d);
  }

  const out: MezoDontes[] = [];
  for (const a of audits) {
    if (!dontendo(a)) continue;
    const s = szabaly.get(a.rule);
    const base = { form: a.form, field: a.field, rule: a.rule, status: a.status };

    if (!s) {
      out.push({
        ...base, allapot: "eldontetlen", atkerul: false,
        miert: `A(z) ${a.rule} szabály nincs a döntési katalógusban — ` +
          `döntés nélkül a mező nem kerül át.`,
      });
      continue;
    }

    const d = mezoDontes.get(kulcs(a.form, a.field)) ?? ruleDontes.get(a.rule);
    if (!d) {
      out.push({
        ...base, allapot: "eldontetlen", atkerul: false,
        miert: `Nincs aláírt döntés. Javaslat: ${s.javaslat} — ${s.mit}`,
      });
      continue;
    }
    const szint: "rule" | "mezo" = d.form ? "mezo" : "rule";
    if (d.lenyomat !== lenyomat(s.lenyeg)) {
      out.push({
        ...base, allapot: "elavult", szint, fajta: d.fajta, dontes: d,
        atkerul: false,
        miert: `A szabály mondata megváltozott az aláírás óta ` +
          `(${d.alairok.map((x) => x.nev).join(", ")}, ` +
          `${d.alairok[0]?.datum ?? "?"}) — újra kell dönteni.`,
      });
      continue;
    }
    const hiany = s.kell.filter((r) => !d.alairok.some((x) => x.szerep === r));
    if (hiany.length) {
      out.push({
        ...base, allapot: "hianyos", szint, fajta: d.fajta, dontes: d,
        atkerul: false,
        miert: `Hiányzó aláírás: ${hiany.map((r) => kat.szerepek[r] ?? r).join(", ")}.`,
      });
      continue;
    }
    out.push({
      ...base, allapot: "dontve", szint, fajta: d.fajta, dontes: d,
      atkerul: d.fajta !== "nem", miert: "",
    });
  }
  return out;
}

export interface DontesIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

/**
 * A katalógus és a döntések önellenőrzése.
 *
 * Nem azt nézi, jó-e a döntés — azt nem lehet gépből. Azt nézi, hogy a döntés
 * TELJES-e: van-e indoklás, aláíró és dátum, és arra a szabályra szól-e,
 * ami létezik.
 */
export function validateDontesek(
  audits: FieldAudit[],
  kat: SzabalyKatalogus,
  dontesek: Dontes[],
): DontesIssue[] {
  const out: DontesIssue[] = [];
  const push = (severity: "error" | "warning", id: string, message: string) =>
    out.push({ severity, id, message });

  const szabaly = new Map(kat.szabalyok.map((s) => [s.rule, s]));
  if (szabaly.size !== kat.szabalyok.length) {
    push("error", "katalogus", "Ismétlődő szabályazonosító a katalógusban.");
  }

  // Minden döntendő szabálynak van katalógustétele — különben egy új szabály
  // némán bekerülhetne úgy, hogy senki nem dönt róla.
  const hasznalt = new Set(audits.filter(dontendo).map((a) => a.rule));
  for (const r of [...hasznalt].sort()) {
    if (!szabaly.has(r)) {
      push("error", r, `Döntést kívánó szabály, ami nincs a katalógusban.`);
    }
  }
  for (const s of kat.szabalyok) {
    if (!hasznalt.has(s.rule)) {
      push("warning", s.rule, `A katalógusban van, de egy mezőnél sem szólal meg.`);
    }
    if (!DONTES_FAJTAK.includes(s.javaslat)) {
      push("error", s.rule, `Ismeretlen javaslat: ${s.javaslat}`);
    }
    for (const r of s.kell) {
      if (!kat.szerepek[r]) push("error", s.rule, `Ismeretlen szerep: ${r}`);
    }
    if (!s.felelos) {
      push("error", s.rule, "Felelős nélküli szabály — egy tétel, ami senkié.");
    } else if (!s.kell.includes(s.felelos)) {
      push("error", s.rule,
        `A felelős (${s.felelos}) nem aláírója a szabálynak — nem viheti az ülésre ` +
        `azt, amit nem ír alá.`);
    }
    if (!s.lenyeg.trim()) push("error", s.rule, "Üres normatív mag (`lenyeg`).");
  }

  const latott = new Set<string>();
  const mezok = new Set(audits.filter(dontendo).map((a) => kulcs(a.form, a.field)));
  for (const d of dontesek) {
    const id = d.form ? `${d.rule} @ ${d.form}/${d.field}` : d.rule;
    if (latott.has(id)) push("error", id, "Ugyanarra kétszer született döntés.");
    latott.add(id);

    const s = szabaly.get(d.rule);
    if (!s) { push("error", id, `Nem létező szabályra hivatkozik.`); continue; }
    if (!DONTES_FAJTAK.includes(d.fajta)) {
      push("error", id, `Ismeretlen döntésfajta: ${d.fajta}`);
    }
    if (!d.indoklas?.trim()) push("error", id, "Indoklás nélküli döntés.");
    if (d.fajta === "atalakitva" && !d.atalakitas?.trim()) {
      push("error", id,
        "„Átalakítva vesszük át” — de nincs megmondva, mivé. Ez a döntés " +
        "leglényegesebb fele: enélkül az „átalakítva” annyit tesz, „majd valahogy”.");
    }
    if (!d.alairok?.length) push("error", id, "Aláíró nélküli döntés.");
    for (const a of d.alairok ?? []) {
      if (!a.nev?.trim()) push("error", id, "Névtelen aláírás.");
      if (!kat.szerepek[a.szerep]) push("error", id, `Ismeretlen szerep: ${a.szerep}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(a.datum ?? "")) {
        push("error", id, `Hibás vagy hiányzó dátum: ${a.datum}`);
      }
    }
    if (d.form && d.field && !mezok.has(kulcs(d.form, d.field))) {
      push("error", id,
        "Olyan mezőre szól, ami nem kíván döntést (vagy már nincs a térképen).");
    }
  }
  return out;
}

export interface DontesMerleg {
  dontendo: number;
  dontve: number;
  eldontetlen: number;
  elavult: number;
  hianyos: number;
  /** Hány mező kerül át — a döntések alapján. */
  atkerul: number;
  szabalyok: number;
  dontottSzabalyok: number;
}

export function merleg(all: MezoDontes[], kat: SzabalyKatalogus): DontesMerleg {
  const n = (a: DontesAllapot) => all.filter((x) => x.allapot === a).length;
  const dontott = new Set(
    all.filter((x) => x.allapot === "dontve" && x.szint === "rule").map((x) => x.rule),
  );
  return {
    dontendo: all.length,
    dontve: n("dontve"),
    eldontetlen: n("eldontetlen"),
    elavult: n("elavult"),
    hianyos: n("hianyos"),
    atkerul: all.filter((x) => x.atkerul).length,
    szabalyok: kat.szabalyok.length,
    dontottSzabalyok: dontott.size,
  };
}

/** Egy soros állapotmondat — a doksikba és a demókba. */
export function dontesStamp(m: DontesMerleg): string {
  return (
    `${m.dontendo} döntendő mező ${m.szabalyok} szabály mögött; ` +
    `${m.dontve} eldöntve (${m.dontottSzabalyok} szabály), ` +
    `${m.eldontetlen} eldöntetlen, ${m.elavult} elavult, ${m.hianyos} hiányos ` +
    `aláírással. Eldöntetlenül egy mező sem kerül át.`
  );
}
