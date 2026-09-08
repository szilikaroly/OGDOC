/**
 * NORMOGRAM-MOTOR: percentilis és z-érték publikációból betöltött referenciából.
 *
 * A magzati biometria önmagában értelmezhetetlen: egy 280 grammos becsült súly
 * a 20. héten normális, a 30.-on súlyos növekedési elmaradás. A szám mellé
 * mindig kell a GESZTÁCIÓS KORHOZ tartozó eloszlás — és annak a forrása.
 *
 * Három szabály, mindegyik ugyanabból a családból, mint a kalkulátor-kapu:
 *
 *   1. NINCS EXTRAPOLÁCIÓ. A tábla szélén túl nem számolunk. Egy 41. hétre
 *      kiterjesztett 22–40 hetes tábla nem hibát ad, hanem CSENDBEN rosszat.
 *   2. NINCS ELLENŐRIZETLEN TÁBLA. Amíg a normogram számai nincsenek
 *      visszaellenőrizve az elsődleges közleménnyel, percentilis nem születik.
 *      A percentilis ugyanolyan „egyetlen szám, amit nem lehet ránézésre
 *      ellenőrizni", mint egy score — ezért ugyanaz a kapu védi.
 *   3. A FORRÁS AZ EREDMÉNY RÉSZE. Két publikáció szerint ugyanaz a mérés más
 *      percentilisre esik; forrás nélkül a szám összehasonlíthatatlan.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export interface NormogramRow {
  /** A független változó értéke — jellemzően gesztációs kor hétben. */
  x: number;
  /** Középérték. `transform` esetén A TRANSZFORMÁLT TÉRBEN. */
  mean: number;
  /** Szórás. Ebből számol a z-érték és a percentilis — a transzformált térben. */
  sd: number;
  /** `logSkew` eloszlásnál a ferdeségi paraméter (ν). */
  skew?: number;
  /**
   * A FORRÁS SAJÁT PERCENTILISEI, ha közölte őket: percentilis → érték.
   * Nem a számításhoz kell, hanem az ELLENŐRZÉSHEZ: a validáló ezen méri le,
   * hogy a választott eloszlás visszaadja-e a publikált táblát.
   */
  p?: Record<string, number>;
}

/**
 * AZ ELOSZLÁS, ÉS AMIÉRT NEM MINDIG NORMÁLIS.
 *
 * A motor eddig egyetlen alakot ismert: a mérés maga normális eloszlású, és a
 * z-érték `(v − átlag)/szórás`. Az öt magzati biometriai standardnál ez PONTOS
 * — visszaellenőrizve: a publikált 3.–97. percentilis és a `mean ± z·sd`
 * legfeljebb 0,04 mm-ben tér el.
 *
 * A TERHESSÉGI SÚLYGYARAPODÁSNÁL VISZONT NEM. Ott nem a súlygyarapodás, hanem
 * `ln(gyarapodás + 8,75)` a normális eloszlású, és az eloszlás jobbra ferde: a
 * +1 SD-s kar 15–25%-kal hosszabb a −1 SD-snél. Ha ugyanezt átlaggal és
 * szórással írnánk le, a 40. héten a 97. percentilisnél 1,73 KG a tévedés — és
 * pontosan ott, ahol a döntés születik (túlzott súlygyarapodás).
 *
 * A becsült magzati súly harmadik alakot kíván: a ferdeség GESZTÁCIÓS KORONKÉNT
 * változik, tehát nem elég a transzformáció, egy paraméter is kell soronként.
 *
 * Ezért az eloszlás ALAKJA is adat, nem kód:
 *
 *   none     z = (v − μ) / σ
 *   log      z = (ln(v + eltolás) − μ) / σ
 *   logSkew  z = (σ·ν)⁻¹ · (−1 + (ln v / μ)^ν)
 */
export type NormogramTransform =
  | { kind: "none" }
  | { kind: "log"; shift: number }
  | { kind: "logSkew" };

/**
 * Honnan való a tábla. A háromféle eredet háromféle KÉRDÉSRE válaszol, és
 * ezért nem helyettesítik egymást:
 *
 *   published  — „mihez képest szokás mérni?"     publikációból telepítve
 *   local      — „mihez képest mérünk MI, ITT?"   a saját adatokból generálva
 *   customised — „mihez képest ez a MAGZAT?"      demográfiai igazítással
 */
export type NormogramKind = "published" | "local" | "customised";

/**
 * Egy demográfiai igazító tag a személyre szabott normogramhoz.
 *
 * A magzat „saját" növekedési pályáját az anyai testmagasság, a terhesség
 * előtti testsúly, a paritás és a magzat neme együtt tolja el. Egy 150 cm-es
 * és egy 180 cm-es anya magzatánál ugyanaz a populációs percentilis mást
 * jelent — az egyiknél normális változat, a másiknál lehet elmaradás.
 */
export interface AdjustTerm {
  /** A demográfiai változó azonosítója. */
  var: string;
  /** `linear` = folytonos, középértékhez viszonyítva · `coded` = kódonkénti tag. */
  kind: "linear" | "coded";
  /** `linear`: az együttható, egységnyi eltérésre, RELATÍV hatásként. */
  coefficient?: number;
  /** `linear`: melyik értékhez képest mérjük az eltérést. */
  center?: number;
  /** `coded`: kódonkénti relatív hatás. */
  byCode?: Record<string, number>;
  note?: I18n;
}

/**
 * A hitelesítettségi szintek — FELSOROLÁSKÉNT, nem szabad szövegként.
 *
 * Miért így. A `verification` mezőt korábban közvetlenül hasonlítottuk
 * karakterlánchoz, és a `katalogus.ts` két helyen a NEM LÉTEZŐ `"verified"`
 * értéket kereste. A futtatás típusellenőrzés nélkül megy (Node strip-only
 * mód), tehát a fordító nem szólt: az összehasonlítás csendben MINDIG HAMIS
 * volt, és a lefedettségi jelentés örökre „0 hitelesített”-et mutatott —
 * akkor is, ha valaki épp hitelesített egyet.
 *
 * A kárt nem a beteg viselte (a percentilis-kapu a `normogram.ts`-ben helyes),
 * hanem a MUNKA: aki elvégzi a hitelesítést, nem látta volna az eredményét.
 * Egy visszajelzés nélküli feladat pedig félbemarad.
 *
 * Ezért mostantól nincs kézi karakterlánc-hasonlítás: a lista adat, a
 * kérdéseket pedig NEVESÍTETT predikátumok teszik fel.
 */
export const NORMOGRAM_VERIFICATION = [
  "primary", "secondary", "assumed", "local",
] as const;

export type NormogramVerification = (typeof NORMOGRAM_VERIFICATION)[number];

/** Hitelesített-e: elsődleges forrással összevetve, aláírással. */
export function hitelesitett(n: { verification: NormogramVerification }): boolean {
  return n.verification === "primary";
}

/**
 * ADHAT-E PERCENTILIST. A `local` is ad — de nem azért, mert hitelesített,
 * hanem mert MÁS FAJTA: a saját populációnkból származik, és a `derivedFrom`
 * mondja meg, miből. A kettő összeszámolása épp azt a különbséget tüntetné el,
 * amiért a `local` egyáltalán létezik.
 */
export function adPercentilist(n: { verification: NormogramVerification }): boolean {
  return n.verification === "primary" || n.verification === "local";
}

export interface Normogram {
  id: string;
  /** Melyik változó eloszlását írja le. */
  parameter: string;
  /** Mi szerint (a független változó azonosítója), pl. `ctx.ga`. */
  by: string;
  unit: string;
  source: { cite: string; doi?: string | null; pmid?: string | null };
  /**
   * `primary` = az elsődleges közleménnyel összevetve · `secondary` =
   * másodlagos összefoglalóból · `assumed` = még nincs ellenőrizve ·
   * `local` = a SAJÁT adatainkból generálva, ismert n-nel és szűrési
   * szabályokkal. A `local` sosem válik `primary`-vé: más a fajtája, nem a
   * minősége.
   */
  verification: NormogramVerification;
  kind?: NormogramKind;
  /** Kire vonatkozik: populáció, etnikum, egyes vagy iker — az összehasonlíthatóság feltétele. */
  population?: string;
  /**
   * Az eloszlás alakja. Hiánya `none` — a visszafelé kompatibilis eset.
   * A HIÁNYZÓ TRANSZFORMÁCIÓ NEM „NINCS FERDESÉG”: a validáló a forrás saját
   * percentiliseiből ellenőrzi, hogy a `none` megállja-e a helyét.
   */
  transform?: NormogramTransform;
  /**
   * Mekkora eltérés fogadható el a forrás saját percentiliseitől, százalékban.
   * Alapértelmezés 0,5 percentilis-pont. A kerekített publikált táblák
   * (egy tizedesjegyre közölt kilogramm) ennél többet is szórhatnak.
   */
  percentileTolerance?: number;
  rows?: NormogramRow[];
  /** ÖNGENERÁLT tábla esetén: miből készült. Enélkül a helyi tábla nem használható. */
  derivedFrom?: {
    /** Hány eset adta. */
    n: number;
    /** Milyen időszakból. */
    from: string;
    to: string;
    site?: string;
    /** Mit vettünk be és mit hagytunk ki — enélkül „a betegek populációja" lenne. */
    inclusion?: string[];
    exclusion?: string[];
    /** Sávonkénti minimum elemszám. Ez alatt az adott sáv NEM ad eredményt. */
    minPerBin: number;
    /** Sávonkénti tényleges elemszám, x szerint. */
    countByX?: Record<string, number>;
  } | null;
  /** SZEMÉLYRE SZABOTT tábla esetén: melyik alapra és milyen igazítással. */
  adjust?: { base: string; terms: AdjustTerm[] } | null;
}

export interface NormOk {
  status: "ok";
  z: number;
  percentile: number;
  mean: number;
  sd: number;
  /** Igaz, ha a két szomszédos sor között interpolálva. */
  interpolated: boolean;
  source: Normogram["source"];
  normogram: string;
  band: "p<3" | "p3-10" | "p10-90" | "p90-97" | "p>97";
  /** Honnan való a tábla — a felületen ez MINDIG megjelenik az érték mellett. */
  kind: NormogramKind;
  /** Öngenerált táblánál: hány eset adta ezt a sávot. */
  n?: number | null;
  /** Személyre szabott táblánál: mekkora igazítás történt, és mi alapján. */
  adjustment?: { factor: number; from: Array<{ var: string; value: unknown; effect: number }> };
}
export interface NormBlocked {
  status: "insufficient";
  missing: string[];
  reason: string;
}
export type NormResult = NormOk | NormBlocked;

/** A standard normális eloszlás eloszlásfüggvénye — Abramowitz–Stegun 7.1.26. */
export function phi(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t *
    (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

/**
 * A Z-ÉRTÉK AZ ELOSZLÁS ALAKJA SZERINT.
 *
 * A `log` és a `logSkew` alak ÉRTELMEZÉSI TARTOMÁNYT is jelent: a logaritmus
 * csak pozitív számra van értelmezve. Egy −9 kg-os „súlygyarapodás” nem
 * szélsőséges érték, hanem hibás bevitel — és a motor nem ad rá percentilist,
 * hanem MEGNEVEZI. A csendes `NaN` ennél mindig rosszabb: átcsúszik a
 * kerekítésen, és számnak látszik.
 */
export function zErtek(
  n: { transform?: NormogramTransform },
  dist: { mean: number; sd: number; skew?: number },
  v: number,
): { z?: number; hiba?: string } {
  const t = n.transform ?? { kind: "none" as const };
  if (t.kind === "none") return { z: (v - dist.mean) / dist.sd };
  if (t.kind === "log") {
    const u = v + t.shift;
    if (!(u > 0)) {
      return { hiba:
        `A logaritmikus eloszláshoz az érték + eltolás (${v} + ${t.shift} = ${u}) ` +
        `pozitív kell legyen. Ez nem szélsőséges mérés, hanem tartományon kívüli ` +
        `bemenet — percentilist nem adunk rá.` };
    }
    return { z: (Math.log(u) - dist.mean) / dist.sd };
  }
  if (!(v > 0)) {
    return { hiba: `A logaritmikus-ferde eloszláshoz pozitív érték kell (${v}).` };
  }
  const nu = dist.skew;
  if (typeof nu !== "number") {
    return { hiba:
      `A sorból hiányzik a ferdeségi paraméter, a logaritmikus-ferde eloszlás ` +
      `pedig enélkül nem számolható.` };
  }
  if (nu === 0) return { z: (Math.log(v) - dist.mean) / dist.sd };
  return { z: (1 / (dist.sd * nu)) * (-1 + Math.pow(Math.log(v) / dist.mean, nu)) };
}

/** Hány eset áll a kérdezett x-hez legközelebbi sávban a helyi táblában. */
/**
 * HÁNY ESET ÁLL EGY x MÖGÖTT — A KETTŐ KÖZÜL A KISEBB.
 *
 * A KORÁBBI VÁLTOZAT A LEGKÖZELEBBI SÁVOT NÉZTE, ÉS EZ EGY SÁVVAL ELCSÚSZOTT.
 * Az `atX()` a két szomszédos sor KÖZÖTT interpolál, tehát egy 23,5 hetes
 * mérés fele-fele arányban a 23. és a 24. sávból épül. A legközelebbi sáv
 * vizsgálata viszont 23,5-nél a 23.-at találta meg (szigorú `<` az
 * összehasonlításban), és átengedte az értéket — miközben a súly fele egy
 * húszesetes sávból jött, ötvenes deklarált minimum mellett. A visszaadott
 * `n: 80` ráadásul azt állította, hogy nyolcvan eset áll mögötte.
 *
 * A ritka sáv nem a közepén kezd rontani, hanem ott, ahol súlyt kap. Ezért
 * MINDKÉT befogó sávot nézzük, és a KISEBBIKET adjuk vissza: az az esetszám,
 * amire az eredmény valóban támaszkodik.
 */
function binCount(n: Normogram, x: number): number | null {
  const counts = n.derivedFrom?.countByX;
  if (!counts) return null;
  const xs = Object.keys(counts).map(Number).sort((a, b) => a - b);
  if (!xs.length) return null;
  const also = [...xs].reverse().find((k) => k <= x);
  const felso = xs.find((k) => k >= x);
  const befogok = [also, felso].filter((k): k is number => k !== undefined);
  if (!befogok.length) return null;
  return Math.min(...befogok.map((k) => counts[String(k)]));
}

function bandOf(p: number): NormOk["band"] {
  if (p < 3) return "p<3";
  if (p < 10) return "p3-10";
  if (p <= 90) return "p10-90";
  if (p <= 97) return "p90-97";
  return "p>97";
}

export class NormogramSet {
  private byId = new Map<string, Normogram>();
  private byParam = new Map<string, Normogram[]>();

  constructor(list: Normogram[]) {
    for (const n of list) {
      if (this.byId.has(n.id)) throw new Error(`Duplikált normogram: ${n.id}`);
      this.byId.set(n.id, n);
      this.byParam.set(n.parameter, [...(this.byParam.get(n.parameter) ?? []), n]);
    }
  }

  get(id: string): Normogram | undefined { return this.byId.get(id); }
  all(): Normogram[] { return [...this.byId.values()]; }
  forParameter(id: string): Normogram[] { return this.byParam.get(id) ?? []; }

  /** Az eloszlás egy adott x-nél. `null`, ha a tábla nem fedi le. */
  atX(
    n: Normogram, x: number,
  ): { mean: number; sd: number; skew?: number; interpolated: boolean } | null {
    const rows = [...(n.rows ?? [])].sort((a, b) => a.x - b.x);
    if (!rows.length) return null;
    // NINCS EXTRAPOLÁCIÓ: a tábla szélén túl nem találgatunk.
    if (x < rows[0].x || x > rows[rows.length - 1].x) return null;

    const exact = rows.find((r) => r.x === x);
    if (exact) {
      return { mean: exact.mean, sd: exact.sd, skew: exact.skew, interpolated: false };
    }

    let lo = rows[0], hi = rows[rows.length - 1];
    for (let i = 0; i < rows.length - 1; i++) {
      if (rows[i].x <= x && x <= rows[i + 1].x) { lo = rows[i]; hi = rows[i + 1]; break; }
    }
    const f = (x - lo.x) / (hi.x - lo.x);
    return {
      mean: lo.mean + f * (hi.mean - lo.mean),
      sd: lo.sd + f * (hi.sd - lo.sd),
      ...(typeof lo.skew === "number" && typeof hi.skew === "number"
        ? { skew: lo.skew + f * (hi.skew - lo.skew) } : {}),
      interpolated: true,
    };
  }

  /** Percentilis és z-érték egy rögzített mérésre, a beteg aktuális állapotából. */
  evaluate(
    reg: Registry, state: CaseState, parameter: string, normogramId?: string,
  ): NormResult {
    const candidates = this.forParameter(parameter);
    const n = normogramId ? this.get(normogramId) : candidates[0];
    if (!n) {
      return {
        status: "insufficient", missing: [],
        reason: `${parameter}: nincs betöltött normogram`,
      };
    }
    if (!normogramId && candidates.length > 1) {
      return {
        status: "insufficient", missing: [],
        reason:
          `${parameter}: ${candidates.length} normogram közül nincs kiválasztva ` +
          `(${candidates.map((c) => c.id).join(", ")}) — a forrás nem tetszőleges`,
      };
    }

    // 2. KAPU: ellenőrizetlen PUBLIKÁLT tábla nem ad percentilist.
    //
    // Az öngenerált (`local`) tábla KIVÉTEL, és ez nem engedmény: a kapu azért
    // létezik, mert egy publikáció konstansait nem tudjuk ránézésre ellenőrizni.
    // A saját adatainkból készült táblánál pontosan tudjuk, hány esetből, milyen
    // időszakból és milyen szűréssel készült — a bizonytalanság nem rejtett,
    // hanem KIÍRT (`n`, `derivedFrom`). Cserébe a `local` sosem lép elő
    // `primary`-vé, és az eredménye mindig ilyenként jelenik meg.
    if (n.verification !== "primary" && n.verification !== "local") {
      return {
        status: "insufficient", missing: [`${n.id}.table`],
        reason:
          `A(z) ${n.id} normogram számai nincsenek visszaellenőrizve az elsődleges ` +
          `forrással (${n.source.cite}). Percentilis addig nem születik.`,
      };
    }
    if (n.verification === "local" && !n.derivedFrom) {
      return {
        status: "insufficient", missing: [`${n.id}.derivedFrom`],
        reason:
          `A(z) ${n.id} helyi tábla nem mondja meg, miből készült (elemszám, ` +
          `időszak, szűrési szabályok). Enélkül nem használható.`,
      };
    }

    const v = resolve(reg, state, parameter);
    const x = resolve(reg, state, n.by);
    const missing: string[] = [];
    if (v.state !== "ok" || typeof v.value !== "number") missing.push(parameter);
    if (x.state !== "ok" || typeof x.value !== "number") missing.push(n.by);
    if (missing.length) {
      return {
        status: "insufficient", missing,
        reason: `Hiányzó vagy lejárt bemenet: ${missing.join(", ")}`,
      };
    }

    const dist = this.atX(n, x.value as number);
    if (!dist) {
      // A TARTOMÁNY KIÍRÁSA MAGA IS ELBUKHAT. A `rows` opcionális, és az
      // `atX()` üres táblára is `null`-t ad — az üzenet viszont indexelte a
      // tábla első és utolsó sorát, tehát épp a hibajelzés dobott
      // `TypeError`-t. Egy soronkénti kivétel megnevezetlen összeomlás, és
      // ebben a rendszerben a hiányzó adat MEGNEVEZETT hiba, nem kivétel.
      const rows = n.rows ?? [];
      return {
        status: "insufficient", missing: [],
        reason: rows.length
          ? `A(z) ${n.by} = ${x.value} a(z) ${n.id} tábláján kívül esik ` +
            `(${rows[0].x}–${rows[rows.length - 1].x}). Extrapoláció nincs.`
          : `A(z) ${n.id} táblának NINCS EGYETLEN SORA SEM, tehát ` +
            `${n.by} = ${x.value} mellett sincs mihez mérni. Ez nem ` +
            `tartományon kívüliség: a tábla üres.`,
      };
    }
    if (!(dist.sd > 0)) {
      return { status: "insufficient", missing: [], reason: `${n.id}: nulla szórás` };
    }

    // Öngenerált táblánál a RITKA SÁV nem ad eredményt: nyolc esetből számolt
    // szórással a percentilis pontosnak látszik, és nem az.
    let nInBin: number | null = null;
    if (n.derivedFrom) {
      nInBin = binCount(n, x.value as number);
      if (nInBin != null && nInBin < n.derivedFrom.minPerBin) {
        return {
          status: "insufficient", missing: [],
          reason:
            `A(z) ${n.by} = ${x.value} értéket befogó sávok egyikében csak ` +
            `${nInBin} eset áll a helyi táblában (minimum ` +
            `${n.derivedFrom.minPerBin}). Az érték a két szomszédos sáv ` +
            `KÖZÖTT interpolálódik, tehát a ritka sáv akkor is rontja, ha nem ` +
            `az a közelebbi — ritka sávból nem számolunk percentilist.`,
        };
      }
    }

    const zr = zErtek(n, dist, v.value as number);
    if (zr.hiba) {
      return { status: "insufficient", missing: [], reason: zr.hiba };
    }
    const z = zr.z!;
    const percentile = phi(z) * 100;
    return {
      status: "ok", z: Math.round(z * 100) / 100,
      percentile: Math.round(percentile * 10) / 10,
      mean: dist.mean, sd: dist.sd, interpolated: dist.interpolated,
      source: n.source, normogram: n.id, band: bandOf(percentile),
      kind: n.kind ?? "published", n: nInBin,
    };
  }

  /**
   * SZEMÉLYRE SZABOTT értékelés: a publikált alaptáblát demográfiai adatokkal
   * igazítja.
   *
   * A hiányzó demográfiai adatnál NEM esik vissza csendben az igazítatlan
   * értékre: azt mondja meg, mi hiányzik. A visszaesés a HÍVÓ dolga
   * (`evaluateHybrid`), és ott láthatóan történik, nem a motor mélyén.
   */
  evaluateCustomised(
    reg: Registry, state: CaseState, normogramId: string,
  ): NormResult {
    const n = this.get(normogramId);
    if (!n?.adjust) {
      return {
        status: "insufficient", missing: [],
        reason: `${normogramId}: nem személyre szabott normogram`,
      };
    }
    const base = this.get(n.adjust.base);
    if (!base) {
      return {
        status: "insufficient", missing: [],
        reason: `${n.id}: az alaptábla nem található (${n.adjust.base})`,
      };
    }
    // Az alaptáblát ugyanaz a kapu védi: ellenőrizetlen alapra épített
    // igazítás ugyanolyan ellenőrizetlen.
    if (base.verification !== "primary" && base.verification !== "local") {
      return {
        status: "insufficient", missing: [`${base.id}.table`],
        reason:
          `${n.id}: az alaptábla (${base.id}) nincs visszaellenőrizve, ezért a ` +
          `személyre szabott érték sem születhet meg.`,
      };
    }
    if (n.verification !== "primary") {
      return {
        status: "insufficient", missing: [`${n.id}.coefficients`],
        reason:
          `A(z) ${n.id} igazító együtthatói nincsenek visszaellenőrizve ` +
          `(${n.source.cite}). Személyre szabott percentilis addig nem születik.`,
      };
    }

    const v = resolve(reg, state, base.parameter);
    const x = resolve(reg, state, base.by);
    const missing: string[] = [];
    if (v.state !== "ok" || typeof v.value !== "number") missing.push(base.parameter);
    if (x.state !== "ok" || typeof x.value !== "number") missing.push(base.by);

    // A demográfiai tagok MINDEGYIKE kell: félig igazított görbe olyan
    // referencia, ami egyik populációnak sem felel meg.
    const from: Array<{ var: string; value: unknown; effect: number }> = [];
    let factor = 1;
    for (const t of n.adjust.terms) {
      const r = resolve(reg, state, t.var);
      if (r.state !== "ok") { missing.push(t.var); continue; }
      let effect = 0;
      if (t.kind === "linear") {
        effect = (Number(r.value) - (t.center ?? 0)) * (t.coefficient ?? 0);
      } else {
        const byCode = t.byCode ?? {};
        if (!(String(r.value) in byCode)) {
          missing.push(t.var);
          continue;
        }
        effect = byCode[String(r.value)];
      }
      factor += effect;
      from.push({ var: t.var, value: r.value, effect: Math.round(effect * 10000) / 10000 });
    }
    if (missing.length) {
      return {
        status: "insufficient", missing,
        reason:
          `A személyre szabott értékeléshez hiányzik: ${missing.join(", ")}. ` +
          `Igazítatlan értékre NEM esünk vissza csendben.`,
      };
    }

    const dist = this.atX(base, x.value as number);
    if (!dist) {
      return {
        status: "insufficient", missing: [],
        reason:
          `A(z) ${base.by} = ${x.value} a(z) ${base.id} tábláján kívül esik. ` +
          `Extrapoláció nincs.`,
      };
    }
    const mean = dist.mean * factor;
    const sd = dist.sd * factor;
    const z = ((v.value as number) - mean) / sd;
    const percentile = phi(z) * 100;
    return {
      status: "ok", z: Math.round(z * 100) / 100,
      percentile: Math.round(percentile * 10) / 10,
      mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10,
      interpolated: dist.interpolated,
      source: n.source, normogram: n.id, band: bandOf(percentile),
      kind: "customised", n: null,
      adjustment: { factor: Math.round(factor * 10000) / 10000, from },
    };
  }

  /**
   * HIBRID MEGJELENÍTÉS: minden szóba jövő olvasat egyszerre, egymás mellett.
   *
   * Nem választunk helyettük. A populációs, a helyi és a személyre szabott
   * percentilis KÜLÖNBÖZŐ KÉRDÉSRE válaszol, és a klinikai döntés az
   * eltérésükből is születhet: ha a populációs szerint 8. percentilis, a
   * személyre szabott szerint 25., az más beszélgetés, mint ha mindkettő
   * a 3. alatt van.
   *
   * Ahol egy olvasat nem születik meg, ott az OKA jelenik meg — nem üres hely
   * és nem csendes visszaesés a másikra.
   */
  evaluateHybrid(
    reg: Registry, state: CaseState, parameter: string,
  ): Array<{ normogram: string; kind: NormogramKind; label: string; result: NormResult }> {
    const out: Array<{ normogram: string; kind: NormogramKind; label: string; result: NormResult }> = [];
    for (const n of this.forParameter(parameter)) {
      const kind = n.kind ?? "published";
      const result = kind === "customised"
        ? this.evaluateCustomised(reg, state, n.id)
        : this.evaluate(reg, state, parameter, n.id);
      out.push({ normogram: n.id, kind, label: n.population ?? n.id, result });
    }
    const rank: Record<NormogramKind, number> = { published: 0, local: 1, customised: 2 };
    return out.sort((a, b) => rank[a.kind] - rank[b.kind] || a.normogram.localeCompare(b.normogram));
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const n of this.all()) {
      const p = reg.get(n.parameter);
      if (!p) {
        push("error", n.id, `ismeretlen paraméter: ${n.parameter}`);
      } else if (p.unit && n.unit && p.unit !== n.unit) {
        push("error", n.id,
          `egység-eltérés: a változó ${p.unit}, a normogram ${n.unit}`);
      }
      if (!reg.get(n.by)) push("error", n.id, `ismeretlen független változó: ${n.by}`);
      if (!n.source?.cite) push("error", n.id, "a normogramnak meg kell neveznie a forrását");
      const kind = n.kind ?? "published";

      if (kind === "customised") {
        // A személyre szabott normogramnak NINCS saját táblája: alapot igazít.
        if (n.rows?.length) {
          push("error", n.id, "személyre szabott normogramnak nincs saját táblája — az alapot igazítja");
        }
        if (!n.adjust) {
          push("error", n.id, "hiányzik az igazítás (alaptábla + demográfiai tagok)");
        } else {
          if (!this.byId.has(n.adjust.base)) {
            push("error", n.id, `az alaptábla nem létezik: ${n.adjust.base}`);
          }
          if (!n.adjust.terms.length) {
            push("error", n.id, "igazító tag nélkül a személyre szabás azonos az alappal");
          }
          for (const t of n.adjust.terms) {
            if (!reg.get(t.var)) {
              push("error", n.id, `az igazító tag ismeretlen változóra hivatkozik: ${t.var}`);
            }
            if (t.kind === "linear" && t.coefficient == null) {
              push("error", n.id, `${t.var}: lineáris tag együttható nélkül`);
            }
            if (t.kind === "coded" && !t.byCode) {
              push("error", n.id, `${t.var}: kódolt tag kódonkénti hatás nélkül`);
            }
          }
        }
      } else {
        if (!n.rows || n.rows.length < 2) {
          push("error", n.id, "legalább két sor kell az interpolációhoz");
        }
        const xs = (n.rows ?? []).map((r) => r.x);
        if (new Set(xs).size !== xs.length) push("error", n.id, "ismétlődő x-érték a táblában");
        for (const r of n.rows ?? []) {
          if (!(r.sd > 0)) push("error", n.id, `nem pozitív szórás x=${r.x}-nél`);
          if ((n.transform?.kind ?? "none") === "logSkew" && typeof r.skew !== "number") {
            push("error", n.id,
              `logaritmikus-ferde eloszlás ferdeségi paraméter nélkül x=${r.x}-nél`);
          }
        }
      }

      /*
       * A VÁLASZTOTT ELOSZLÁS VISSZAADJA-E A PUBLIKÁLT TÁBLÁT.
       *
       * Ha a forrás a saját percentiliseit is közölte (`p`), akkor a kérdés nem
       * ízlés dolga: a `mean`/`sd`/alak hármasból KISZÁMOLHATÓ a 3.–97.
       * percentilis, és össze lehet vetni azzal, amit a szerzők kiadtak.
       *
       * Ez az egyetlen mód észrevenni a néma hibát. A terhességi
       * súlygyarapodásnál a mérés NEM normális eloszlású — `ln(gyarapodás +
       * 8,75)` az —, és ha valaki mégis nyers átlagot és szórást ír be, a tábla
       * a középen jól viselkedik, a széleken pedig másfél kilóval téved. Épp
       * ott, ahol a döntés születik.
       */
      const tured = n.percentileTolerance ?? 0;
      for (const r of n.rows ?? []) {
        if (!r.p) continue;
        for (const [kulcs, ertek] of Object.entries(r.p)) {
          const pct = Number(kulcs);
          if (!(pct > 0 && pct < 100)) {
            push("error", n.id, `értelmezhetetlen percentilis-kulcs: „${kulcs}” (x=${r.x})`);
            continue;
          }
          const zr = zErtek(n, r, ertek);
          if (zr.hiba) {
            push("error", n.id,
              `a(z) ${pct}. percentilis értéke (${ertek}) az eloszláson kívül esik ` +
              `x=${r.x}-nél: ${zr.hiba}`);
            continue;
          }
          const szamolt = phi(zr.z!) * 100;
          if (Math.abs(szamolt - pct) > (tured || 0.5)) {
            push("error", n.id,
              `AZ ELOSZLÁS NEM ADJA VISSZA A PUBLIKÁLT TÁBLÁT: x=${r.x}-nél a ` +
              `forrás ${pct}. percentilise ${ertek}, a megadott ` +
              `${(n.transform?.kind ?? "none")} eloszlásból viszont ` +
              `${szamolt.toFixed(1)}. percentilis jön ki. A középen az ilyen tábla ` +
              `jól viselkedik, a széleken téved — épp ott, ahol a döntés születik.`);
          }
        }
      }

      if (kind === "local") {
        const d = n.derivedFrom;
        if (!d) {
          push("error", n.id, "helyi tábla `derivedFrom` nélkül — nem tudni, miből készült");
        } else {
          if (!(d.n > 0)) push("error", n.id, "a helyi tábla elemszáma hiányzik");
          if (!(d.minPerBin > 0)) {
            push("error", n.id, "a helyi táblához sávonkénti minimum elemszám kell");
          }
          if (!d.exclusion?.length) {
            push("warning", n.id,
              "nincs megadva kizárási szabály — kizárás nélkül a helyi tábla a BETEGEK " +
              "populációját írja le, nem a normálisat");
          }
        }
        if (n.verification !== "local") {
          push("error", n.id, "helyi tábla ellenőrzöttségi szintje csak `local` lehet");
        }
      } else if (n.verification === "local") {
        push("error", n.id, "`local` szint csak öngenerált (kind: local) táblán értelmes");
      }

      if (!n.population) {
        push("warning", n.id,
          "nincs megadva, mely populációra vonatkozik — enélkül az összehasonlítás bizonytalan");
      }
      if (n.verification !== "primary" && n.verification !== "local") {
        push("warning", n.id,
          `a tábla ${n.verification} szintű — a kapu miatt percentilist NEM ad`);
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

/** Kísérő állományok felismerő kulcsai — lásd a `loadNormograms()` megjegyzését. */
const KISERO_KULCSOK = ["charts", "kotesek", "hitelesitesek"] as const;

export function loadNormograms(...paths: string[]): NormogramSet {
  const list: Normogram[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      // A könyvtárban KÍSÉRŐ ÁLLOMÁNYOK is vannak, és ezek nem normogramok:
      //   `charts`        — a görbeKATALÓGUS: mely görbék LÉTEZNEK (≠ betöltve),
      //   `kotesek`       — a LEKÉPEZÉS: melyik mérés melyik változónkhoz tartozik,
      //   `hitelesitesek` — az ALÁÍRÁSOK: ki igazolta, melyik görbét.
      // A lista nevesített, nem „ami nem tömb, azt hagyd ki”: egy elgépelt
      // normogramfájl így továbbra is hangos hiba marad, nem csendes kihagyás.
      if (!Array.isArray(parsed)) {
        if (KISERO_KULCSOK.some((k) => parsed?.[k])) continue;
        throw new Error(
          `${f}: a normogramfájl tömböt vár. Ha kísérő állomány, a felismerő ` +
          `kulcsa hiányzik (${KISERO_KULCSOK.join(", ")})`);
      }
      list.push(...parsed);
    }
  }
  return new NormogramSet(list);
}
