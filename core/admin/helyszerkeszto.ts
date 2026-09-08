/**
 * ÉPÜLET-MANAGEMENT — az ellátóhelyek szerkesztése, és amit ez elront.
 *
 * A 34. modul helyhierarchiája eddig ADAT volt: betöltjük, olvassuk, összegzünk
 * rajta. Ez a réteg attól más, hogy ITT VÁLTOZIK — és egy szerkeszthető
 * hierarchia két dolgot tud elrontani, amit egy statikus nem.
 *
 * 1. A SZERKESZTÉS ÁTÍRJA A MÚLTAT.
 *
 * Ez a fontosabb, és ez az, ami nem tűnik fel. Ha egy ágyat átteszünk az „A”
 * osztályról a „B”-re, akkor a rendszer szerint MINDEN KORÁBBI fekvés is a
 * B osztályon történt — hiszen a fekvés az ágyra hivatkozik, az ágy pedig most
 * B alatt van. A tavalyi osztályos statisztika, a NEAK-jelentés és a
 * minőségmutatók visszamenőleg megváltoznak attól, hogy valaki ma átnevezett
 * egy osztályt.
 *
 * Nem elméleti: osztályösszevonáskor, emeletfelújításkor, telephely-átadáskor
 * pontosan ez történik, és senki nem gondol rá, hogy a hierarchia
 * MEGVÁLTOZTATÁSA egy adatelemzési művelet is.
 *
 * Ezért minden hely IDŐBEN ÉRVÉNYES: `ervenyesTol` és `ervenyesIg`, és a múltbeli
 * eseményt AZ AKKORI hierarchia szerint oldjuk fel. Egy szerkesztés nem
 * visszamenőleges — új érvényességi szakaszt nyit.
 *
 * 2. AZ ELLÁTÓHELY NEM TÖRÖLHETŐ, CSAK LEZÁRHATÓ.
 *
 * Egy szoba, ahol valaha feküdt beteg, örökre feloldhatónak kell maradjon: a
 * dokumentáció megőrzési ideje évtizedes, és egy törölt hely azonosítója a
 * régi leleten „ismeretlen hely”-ként jelenne meg. A törlés helyett LEZÁRÁS
 * van, dátummal.
 *
 * 3. ÉS NEM SZERKESZTHETŐ AZ, AMIBEN BETEG FEKSZIK.
 *
 * Egy foglalt ágy áthelyezése vagy lezárása közben a beteg pillanatnyi helye
 * eldönthetetlenné válik. A szerkesztés ezért a FOGLALTSÁGON is átmegy — nem
 * figyelmeztetéssel, hanem kapuval.
 */
import type { RegistryIssue } from "../registry.ts";
import type { Hely, HelyFajta, HelyKeszlet } from "../fekvo/hely.ts";
import { FAJTA_SORREND } from "../fekvo/hely.ts";

/* ── AZ IDŐBEN ÉRVÉNYES HELY ─────────────────────────────────────────── */

export interface IdozitettHely extends Hely {
  /** Mikortól létezik. Hiánya = „mindig is volt”, ami csak a törzsadatnál igaz. */
  ervenyesTol?: string;
  /** Mikor zárták le. `null`/hiány = még nyitva. */
  ervenyesIg?: string | null;
  /** Lezárásnál: MIÉRT. Ok nélkül a lezárás nem lezárás, csak eltűnés. */
  lezarasOka?: string;
}

export interface SzerkesztettKeszlet extends Omit<HelyKeszlet, "helyek"> {
  helyek: IdozitettHely[];
}

export type ErvenyessegAllapot = "ervenyes" | "megNem" | "lezart";

export function ervenyes(h: IdozitettHely, mikor: string): ErvenyessegAllapot {
  const t = Date.parse(mikor);
  if (h.ervenyesTol && Date.parse(h.ervenyesTol) > t) return "megNem";
  if (h.ervenyesIg && Date.parse(h.ervenyesIg) <= t) return "lezart";
  return "ervenyes";
}

/**
 * A HIERARCHIA EGY ADOTT IDŐPONTBAN. Ez az, amivel a múltbeli eseményt fel
 * kell oldani — nem a mostanival.
 */
export function keszletAkkor(k: SzerkesztettKeszlet, mikor: string): SzerkesztettKeszlet {
  return { ...k, helyek: k.helyek.filter((h) => ervenyes(h, mikor) === "ervenyes") };
}

/* ── A MŰVELETEK ─────────────────────────────────────────────────────── */

export type MuveletFajta = "letrehoz" | "atnevez" | "athelyez" | "lezar" | "ujranyit";

export interface Muvelet {
  fajta: MuveletFajta;
  hely: string;
  /** Mikortól hatályos. A szerkesztés NEM visszamenőleges. */
  hatalyos: string;
  /** KI szerkesztette. Az épületfa a jogosultsági réteg alapja is. */
  ki: string;
  /** `letrehoz` / `atnevez`: az új név. */
  nev?: string;
  /** `letrehoz`: a fajta. */
  fajta_uj?: HelyFajta;
  /** `letrehoz` / `athelyez`: az új szülő. */
  szulo?: string | null;
  /** `lezar`: az ok. */
  ok?: string;
}

export type MuveletAllapot =
  | "vegrehajthato"
  | "nincsSzerkeszto"
  | "nincsHatalyDatum"
  /** A hely nem létezik (vagy már lezárt). */
  | "nincsIlyenHely"
  /** Foglalt hely nem szerkeszthető. */
  | "foglalt"
  /** Az áthelyezés kört csinálna, vagy fajtasorrendet fordítana. */
  | "ertelmetlenFa"
  /** Lezárás ok nélkül. */
  | "nincsOk"
  /** Lezárás úgy, hogy alatta még van élő hely. */
  | "vanAlatta"
  /** A hatálybalépés a múltban van — a szerkesztés átírná a múltat. */
  | "visszamenoleges";

export interface MuveletItelet {
  allapot: MuveletAllapot;
  vegrehajthato: boolean;
  miert: string;
}

export interface Kontextus {
  /** Mely helyeken van MOST beteg (ágyazonosítók). */
  foglaltHelyek: Set<string>;
  /** A mostani idő — ehhez képest múltbeli a hatálybalépés. */
  most: string;
}

export function vegrehajthato(
  k: SzerkesztettKeszlet, m: Muvelet, ctx: Kontextus,
): MuveletItelet {
  const map = new Map(k.helyek.map((h) => [h.id, h]));
  const h = map.get(m.hely);

  if (!m.ki?.trim()) {
    return { allapot: "nincsSzerkeszto", vegrehajthato: false,
      miert:
        `Nincs megnevezve, KI szerkeszti. Az épületfa a jogosultsági réteg alapja ` +
        `is: aki átteszi az ágyat egy másik osztályra, azzal együtt azt is ` +
        `eldönti, ki látja majd az ott fekvő beteget.` };
  }
  if (!m.hatalyos?.trim() || Number.isNaN(Date.parse(m.hatalyos))) {
    return { allapot: "nincsHatalyDatum", vegrehajthato: false,
      miert:
        `Nincs hatálybalépési dátum. Enélkül a változás „mindig is így volt” ` +
        `alakot ölt, és a múltbeli fekvések visszamenőleg átkerülnek — a tavalyi ` +
        `osztályos statisztika megváltozik attól, hogy ma átneveztek valamit.` };
  }
  if (Date.parse(m.hatalyos) < Date.parse(ctx.most) - 86_400_000) {
    return { allapot: "visszamenoleges", vegrehajthato: false,
      miert:
        `A hatálybalépés a múltban van (${m.hatalyos}). A SZERKESZTÉS NEM ` +
        `VISSZAMENŐLEGES: új érvényességi szakaszt nyit, nem írja át a korábbit. ` +
        `Ami tavaly a régi szerkezet szerint történt, az ott is marad — különben ` +
        `a NEAK-jelentés és a minőségmutatók utólag megváltoznának.` };
  }

  if (m.fajta === "letrehoz") {
    if (map.has(m.hely)) {
      return { allapot: "ertelmetlenFa", vegrehajthato: false,
        miert: `Már van ilyen azonosítójú hely: „${m.hely}”.` };
    }
    if (!m.nev?.trim() || !m.fajta_uj) {
      return { allapot: "ertelmetlenFa", vegrehajthato: false,
        miert: `Új hely név vagy fajta nélkül.` };
    }
    return szuloEllenorzes(map, m.hely, m.fajta_uj, m.szulo ?? null)
      ?? { allapot: "vegrehajthato", vegrehajthato: true,
           miert: `Új ${m.fajta_uj}: „${m.nev}” (${m.hatalyos}-tól, ${m.ki}).` };
  }

  if (!h) {
    return { allapot: "nincsIlyenHely", vegrehajthato: false,
      miert: `Nincs ilyen hely: „${m.hely}”.` };
  }
  if (m.fajta !== "ujranyit" && ervenyes(h, ctx.most) === "lezart") {
    return { allapot: "nincsIlyenHely", vegrehajthato: false,
      miert: `A(z) „${h.nev}” ${h.ervenyesIg}-kor lezárult. Lezárt helyet előbb újra kell nyitni.` };
  }

  if (m.fajta === "atnevez") {
    if (!m.nev?.trim()) {
      return { allapot: "ertelmetlenFa", vegrehajthato: false, miert: `Üres név.` };
    }
    return { allapot: "vegrehajthato", vegrehajthato: true,
      miert: `„${h.nev}” → „${m.nev}” (${m.hatalyos}-tól, ${m.ki}).` };
  }

  if (m.fajta === "athelyez" || m.fajta === "lezar") {
    const erintett = [m.hely, ...alattaMind(k, m.hely)];
    const foglalt = erintett.filter((x) => ctx.foglaltHelyek.has(x));
    if (foglalt.length) {
      return { allapot: "foglalt", vegrehajthato: false,
        miert:
          `A(z) „${h.nev}” alatt ${foglalt.length} helyen fekszik beteg ` +
          `(${foglalt.slice(0, 3).join(", ")}${foglalt.length > 3 ? "…" : ""}). ` +
          `Szerkesztés közben a beteg pillanatnyi helye eldönthetetlenné válna — ` +
          `előbb áthelyezés vagy elbocsátás.` };
    }
  }

  if (m.fajta === "athelyez") {
    const baj = szuloEllenorzes(map, m.hely, h.fajta, m.szulo ?? null);
    if (baj) return baj;
    if (m.szulo && [m.hely, ...alattaMind(k, m.hely)].includes(m.szulo)) {
      return { allapot: "ertelmetlenFa", vegrehajthato: false,
        miert:
          `A(z) „${h.nev}” nem tehető a saját leszármazottja alá — a lánc kört ` +
          `zárna, és minden felfelé összegzés kétszer számolna.` };
    }
    return { allapot: "vegrehajthato", vegrehajthato: true,
      miert:
        `„${h.nev}” új szülője: ${m.szulo ?? "gyökér"} (${m.hatalyos}-tól, ${m.ki}). ` +
        `A korábbi fekvések a RÉGI szerkezet szerint maradnak.` };
  }

  if (m.fajta === "lezar") {
    if (!m.ok?.trim()) {
      return { allapot: "nincsOk", vegrehajthato: false,
        miert:
          `Lezárás ok nélkül. Ok nélkül a lezárás nem lezárás, csak eltűnés — és ` +
          `évekkel később senki nem tudja megmondani, felújítás, összevonás vagy ` +
          `bezárás történt-e.` };
    }
    const elok = alattaMind(k, m.hely)
      .filter((x) => ervenyes(map.get(x)!, m.hatalyos) === "ervenyes");
    if (elok.length) {
      return { allapot: "vanAlatta", vegrehajthato: false,
        miert:
          `A(z) „${h.nev}” alatt ${elok.length} élő hely van. Egy lezárt szülő ` +
          `alatt élő gyerek MEGSZAKADT LÁNC — a hely a felfelé összesítésből ` +
          `csendben kiesne.` };
    }
    return { allapot: "vegrehajthato", vegrehajthato: true,
      miert:
        `„${h.nev}” lezárva ${m.hatalyos}-tól (${m.ok}, ${m.ki}). A hely NEM ` +
        `törlődik: a régi leleteknek örökre feloldhatónak kell maradnia.` };
  }

  // ujranyit
  if (ervenyes(h, ctx.most) !== "lezart") {
    return { allapot: "ertelmetlenFa", vegrehajthato: false,
      miert: `A(z) „${h.nev}” nincs lezárva.` };
  }
  return { allapot: "vegrehajthato", vegrehajthato: true,
    miert: `„${h.nev}” újranyitva ${m.hatalyos}-tól (${m.ki}).` };
}

function szuloEllenorzes(
  map: Map<string, IdozitettHely>, id: string, fajta: HelyFajta, szulo: string | null,
): MuveletItelet | null {
  if (szulo === null) return null;
  const sz = map.get(szulo);
  if (!sz) {
    return { allapot: "ertelmetlenFa", vegrehajthato: false,
      miert: `A megadott szülő nem létezik: „${szulo}”.` };
  }
  if (FAJTA_SORREND.indexOf(sz.fajta) >= FAJTA_SORREND.indexOf(fajta)) {
    return { allapot: "ertelmetlenFa", vegrehajthato: false,
      miert:
        `A(z) „${id}” (${fajta}) nem lehet a(z) „${sz.nev}” (${sz.fajta}) része: ` +
        `a szülőnek TÁGABB fajtának kell lennie. A közbenső fajták kihagyhatók, ` +
        `a sorrend megfordítása nem.` };
  }
  return null;
}

function alattaMind(k: SzerkesztettKeszlet, id: string): string[] {
  const gy = new Map<string, string[]>();
  for (const h of k.helyek) {
    if (h.resze) gy.set(h.resze, [...(gy.get(h.resze) ?? []), h.id]);
  }
  const ki: string[] = [];
  const latott = new Set([id]);
  const sor = [...(gy.get(id) ?? [])];
  while (sor.length) {
    const x = sor.shift()!;
    if (latott.has(x)) continue;
    latott.add(x); ki.push(x);
    sor.push(...(gy.get(x) ?? []));
  }
  return ki;
}

/* ── A MŰVELET ALKALMAZÁSA ───────────────────────────────────────────── */

/**
 * A VÁLTOZÁS ÚJ SZAKASZT NYIT, NEM ÍR FELÜL.
 *
 * Áthelyezésnél és átnevezésnél a régi bejegyzés `ervenyesIg`-et kap, és MELLÉ
 * kerül az új — így a múltbeli esemény továbbra is az akkori szerkezetet
 * találja meg. Ez a különbség aközött, hogy „az ágy most a B osztályon van” és
 * „az ágy MINDIG IS a B osztályon volt”.
 */
export function alkalmaz(k: SzerkesztettKeszlet, m: Muvelet): SzerkesztettKeszlet {
  const helyek = [...k.helyek];
  const i = helyek.findIndex((h) => h.id === m.hely);

  if (m.fajta === "letrehoz") {
    helyek.push({ id: m.hely, fajta: m.fajta_uj!, nev: m.nev!,
      resze: m.szulo ?? null, ervenyesTol: m.hatalyos, ervenyesIg: null });
    return { ...k, helyek };
  }
  if (i < 0) return k;
  const regi = helyek[i];

  if (m.fajta === "lezar") {
    helyek[i] = { ...regi, ervenyesIg: m.hatalyos, lezarasOka: m.ok };
    return { ...k, helyek };
  }
  if (m.fajta === "ujranyit") {
    helyek[i] = { ...regi, ervenyesIg: null };
    return { ...k, helyek };
  }
  /* Átnevezés és áthelyezés: a régi szakasz LEZÁRUL, az új MELLÉ kerül. A
     korábbi események így az akkori nevet és szülőt találják meg. */
  helyek[i] = { ...regi, ervenyesIg: m.hatalyos };
  helyek.push({
    ...regi,
    nev: m.fajta === "atnevez" ? m.nev! : regi.nev,
    resze: m.fajta === "athelyez" ? (m.szulo ?? null) : regi.resze,
    ervenyesTol: m.hatalyos, ervenyesIg: null, lezarasOka: undefined,
  });
  return { ...k, helyek };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export interface EsemenyHivatkozas {
  esemeny: string;
  hely: string;
  mikor: string;
}

/**
 * A MÚLTBELI ESEMÉNY AZ AKKORI HIERARCHIÁT KELL MEGTALÁLJA.
 *
 * Ha egy tavalyi fekvés olyan helyre hivatkozik, ami akkor még nem létezett
 * vagy már lezárult, az nem apró következetlenség: a jelentés olyan
 * szervezeti egységhez rendeli az esetet, ahol az nem történhetett.
 */
export function validateHivatkozasok(
  k: SzerkesztettKeszlet, hivatkozasok: EsemenyHivatkozas[],
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const e of hivatkozasok) {
    const szakaszok = k.helyek.filter((h) => h.id === e.hely);
    if (!szakaszok.length) {
      out.push({ severity: "error", id: e.esemeny,
        message:
          `A(z) ${e.esemeny} esemény nem létező helyre hivatkozik: „${e.hely}”. Egy ` +
          `TÖRÖLT hely a régi leleten „ismeretlen hely”-ként jelenne meg — ezért ` +
          `nincs törlés, csak lezárás.` });
      continue;
    }
    if (!szakaszok.some((h) => ervenyes(h, e.mikor) === "ervenyes")) {
      out.push({ severity: "error", id: e.esemeny,
        message:
          `A(z) ${e.esemeny} esemény (${e.mikor}) olyan helyre hivatkozik ` +
          `(„${e.hely}”), ami akkor nem volt érvényes. A jelentés így olyan ` +
          `szervezeti egységhez rendelné az esetet, ahol az nem történhetett.` });
    }
  }
  return out;
}

export function validateIdozites(k: SzerkesztettKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const szakaszonkent = new Map<string, IdozitettHely[]>();
  for (const h of k.helyek) {
    szakaszonkent.set(h.id, [...(szakaszonkent.get(h.id) ?? []), h]);
  }
  for (const [id, sz] of szakaszonkent) {
    if (sz.length < 2) continue;
    const rendezett = [...sz].sort((a, b) =>
      Date.parse(a.ervenyesTol ?? "1900-01-01") - Date.parse(b.ervenyesTol ?? "1900-01-01"));
    for (let i = 0; i < rendezett.length - 1; i++) {
      const a = rendezett[i], b = rendezett[i + 1];
      if (!a.ervenyesIg) {
        out.push({ severity: "error", id,
          message:
            `A(z) „${id}” helynek két PÁRHUZAMOSAN nyitott szakasza van. Egy hely ` +
            `egy időben egy helyen áll — különben az összegzés kétszer veszi.` });
      } else if (Date.parse(a.ervenyesIg) > Date.parse(b.ervenyesTol ?? "1900-01-01")) {
        out.push({ severity: "error", id,
          message: `A(z) „${id}” szakaszai átfedik egymást (${a.ervenyesIg} > ${b.ervenyesTol}).` });
      }
    }
  }
  for (const h of k.helyek) {
    if (h.ervenyesIg && !h.lezarasOka?.trim()) {
      out.push({ severity: "warning", id: h.id,
        message:
          `A(z) „${h.nev}” szakasza ${h.ervenyesIg}-kor lezárult, de nincs ` +
          `megnevezve, miért. Évekkel később senki nem tudja megmondani, felújítás, ` +
          `összevonás vagy bezárás történt-e.` });
    }
  }
  return out;
}
