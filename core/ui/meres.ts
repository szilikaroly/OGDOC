/**
 * A MÉRT ÉRTÉK MEGÍTÉLÉSE — és ami fontosabb: mikor NEM ítéljük meg.
 *
 * A rendszer két kimenete (betegnek szóló szöveg, klinikusi teendőlista) eddig
 * csak a KÓDOLT leletekből (`finding`) épült. Egy ambuláns szülészeti eseten
 * viszont a legfontosabb tételek MÉRÉSEK: a vérnyomás, a thrombocytaszám, a
 * transzaminázok. Ezekről a két kimenet hallgatott — vagyis egy 158/98-as
 * vérnyomásról a beteg semmit nem olvasott, és a teendőlistán semmi nem állt.
 *
 * KÉT KÜLÖNBÖZŐ HATÁR, KÉT KÜLÖNBÖZŐ SÚLY:
 *
 *   `domain.critical`  — a változó DEFINÍCIÓS küszöbe: ezen túl azonnali
 *                        klinikai jelzés. A 160 Hgmm szisztolés vagy az 50 alatti
 *                        thrombocytaszám nem referenciakérdés, hanem küszöb.
 *   `reference`        — KONTEXTUSFÜGGŐ normáltartomány, publikált forrásból.
 *                        A terhesség megváltoztatja; a forrás megnevezve, és a
 *                        HITELESÍTÉSI SZINTJE is.
 *
 * A KETTŐT NEM SZABAD ÖSSZEMOSNI. A küszöb átlépéséből teendő következik; a
 * referenciatartományon kívüliségből — amíg a tábla `assumed` — csak jelzés,
 * ami megmondja, honnan származik és hogy nincs visszaellenőrizve.
 *
 * ÉS A HARMADIK ÁLLAPOT. Ha a kontextus ismeretlen (nem tudjuk, terhes-e, vagy
 * hányadik héten), a rendszer NEM esik vissza a nem terhes sávra. A hiányzó
 * kontextus nem „nem terhes”: az arra olvasott lelet hol fölöslegesen riaszt,
 * hol elenged egy valódi eltérést.
 *
 * A NEGYEDIK ÁLLAPOT, ÉS AMIÉRT KÉSŐN LETT MEG: A KÜSZÖB NÉLKÜLI MÉRÉS.
 *
 * A `meresek()` korábban egyetlen sorral kihagyta azt a mérést, aminek sem
 * kritikus sávja, sem referenciája nincs — `continue`, némán. A rögzített érték
 * ilyenkor SEHOL nem jelent meg: se kritikusként, se sávban lévőként, se nem
 * értékelhetőként. A klinikus a hallgatást megnyugtatásnak olvassa, pedig a
 * rendszernek nem volt mihez mérnie.
 *
 * A regiszterben ez 131 mérést érint, köztük az 5 perces Apgart, a
 * köldökzsinór-pH-t és a bázisfelesleget, az sFlt-1/PlGF arányt és a hüvelyi
 * pH-t — csupa olyat, aminek TANKÖNYVI küszöbe van, csak nálunk nincs felvéve.
 *
 * A javítás NEM az, hogy kitaláljuk a küszöböket: azt aláírás dönti el, mint a
 * rendszer minden más küszöbét. A javítás az, hogy a hiány MEGSZÓLAL. A
 * hiányzó küszöb sehol nem „rendben”.
 */
import type { CaseState, I18n, Lang, VariableDef } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import { contextOf } from "../lab/reference.ts";

export type MeresAllapot =
  /** A `domain.critical` határon kívül — azonnali klinikai jelzés. */
  | "kritikus"
  /** A kontextushoz tartozó referenciatartományon kívül. */
  | "referencianKivul"
  /** A tartományon belül. */
  | "savban"
  /** Nincs érték, nincs kontextus, vagy nincs referencia ehhez a kontextushoz. */
  | "nemErtekelheto"
  /**
   * VAN ÉRTÉK, DE NINCS MIHEZ MÉRNI. Se kritikus sáv, se referencia, és
   * egyetlen kalkulátor sem dolgozza fel. Ez nem „rendben van” — ez a
   * rendszer beismerése, hogy erről a számról nem tud mondani semmit.
   */
  | "nincsKuszob";

export interface MeresErtekeles {
  id: string;
  label: string;
  allapot: MeresAllapot;
  value: number | null;
  unit: string | null;
  /** Melyik küszöböt vagy tartományt lépte át — emberi olvasatra. */
  hatar: string | null;
  /** A referencia hitelesítési szintje, ha referenciából dolgoztunk. */
  verification: "primary" | "secondary" | "assumed" | null;
  /** Melyik kontextusra olvastuk a referenciát. */
  kontextus: string | null;
  /** A forrás megnevezése — küszöbnél a változó bizonyítéka, sávnál a tábláé. */
  source: string | null;
  /** Miért ez az állapot — ez megy a felületre és a teendő indoklásába. */
  miert: string;
}

const L = (x: I18n | undefined, lang: Lang): string | null =>
  x?.[lang] ?? x?.hu ?? x?.en ?? null;

/**
 * A referenciakontextusok TELJES listája — egy helyen, mert két helyen kell.
 *
 * A `referenciaKontextus()` ezekből ad vissza egyet, a regiszter ezekre
 * hivatkozhat, és a validálás ezt a kettőt veti össze. Enélkül előáll a
 * legcsendesebb hibafajta: egy referenciasáv, amit a rendszer SOHA nem
 * választ ki — a tábla teljesnek látszik, a beteg meg a rossz sávot kapja.
 * (Pontosan ez történt a `postpartum` sávokkal a 6. lépés előtt.)
 */
export const REFERENCIA_KONTEXTUSOK = [
  "nonpregnant", "pregnancy.t1", "pregnancy.t2", "pregnancy.t3", "postpartum",
] as const;

export type ReferenciaKontextus = (typeof REFERENCIA_KONTEXTUSOK)[number];

/** A gyermekágy vége — ennyi nap a szülés után még `postpartum`. */
export const POSTPARTUM_NAP = 42;

/**
 * MELYIK REFERENCIAKONTEXTUS érvényes most.
 *
 * `null`, ha nem dönthető el — és ez NEM a `nonpregnant` sáv. A terhességi
 * állapot hiányában a laborlelet nem olvasható: a 3. trimeszterben normális
 * 110-es thrombocytaszám nem terhesen már kórosan alacsony.
 *
 * A trimeszterhatárok: 1. = 14. hét előtt, 2. = 14–27+6, 3. = 28. héttől.
 *
 * A GYERMEKÁGY külön kontextus, és a sorrend számít: a szülés után a
 * `ctx.pregnant` már `neg`, tehát a puszta „nem terhes” ág a gyermekágyas
 * beteget a NEM TERHES sávra küldené. A legtöbb laborérték viszont hetekig
 * tart, amíg visszaáll — a thrombocytaszám, a fibrinogén és az alkalikus
 * foszfatáz a szülés utáni napokban a nem terhes tartományon kívül van,
 * anélkül hogy bármi baj lenne.
 */
export function referenciaKontextus(
  reg: Registry, state: CaseState,
): ReferenciaKontextus | null {
  // 1. GYERMEKÁGY — a terhességi állapot ELŐTT, mert az már „neg”.
  const szules = resolve(reg, state, "nb.birth.at");
  if (szules.state === "ok" && szules.value) {
    const t = Date.parse(String(szules.value));
    const most = Date.parse(String(state.ctx?.now ?? ""));
    if (Number.isFinite(t) && Number.isFinite(most)) {
      const nap = (most - t) / 86_400_000;
      if (nap >= 0 && nap <= POSTPARTUM_NAP) return "postpartum";
    }
  }

  const preg = resolve(reg, state, "ctx.pregnant");
  if (preg.state !== "ok") return null;
  if (preg.value === "neg") return "nonpregnant";
  if (preg.value !== "pos") return null;          // `unk` sem terhes, sem nem

  const ga = resolve(reg, state, "ctx.ga");
  if (ga.state !== "ok" || typeof ga.value !== "number") return null;
  if (ga.value < 14) return "pregnancy.t1";
  if (ga.value < 28) return "pregnancy.t2";
  return "pregnancy.t3";
}

/** Kívül van-e a `[low, high]` páron. A `null` határ nyitott. */
function kivul(v: number, low?: number | null, high?: number | null): boolean {
  return (low != null && v < low) || (high != null && v > high);
}

/**
 * A KRITIKUS KÜSZÖB A BETEG KONTEXTUSÁBAN.
 *
 * Ha a változó `criticalByContext` táblát hoz, a beteg helyzetéhez tartozó
 * küszöb az irányadó. A kontextus meghatározása UGYANAZ, mint a
 * referenciatartománynál — és ha a terhességi állapot ismeretlen, a
 * kontextusfüggő küszöb NEM oldható fel: ilyenkor a legszigorúbb ismert küszöb
 * érvényes, mert a nem terhes küszöbre visszaesni pontosan az a hiba lenne,
 * amit a referenciaréteg már nem követ el.
 */
function kritikusKontextus(
  reg: Registry, state: CaseState, d: VariableDef,
): { crit: [number | null, number | null] | null | undefined; kontextus: string | null } {
  const tabla = d.domain?.criticalByContext;
  if (!tabla || !Object.keys(tabla).length) {
    return { crit: d.domain?.critical, kontextus: null };
  }
  const ctx = contextOf(reg, state);
  if (typeof ctx === "string" && tabla[ctx]) {
    return { crit: tabla[ctx], kontextus: ctx };
  }
  /* A kontextus nem dönthető el (ismeretlen terhességi állapot vagy
     ismeretlen trimeszter): a LEGSZIGORÚBB ismert küszöb érvényes. A nem
     terhes küszöbre visszaesni itt ugyanaz a hiba volna, mint a
     referenciánál — csak itt a riasztás marad el. */
  const mind = Object.values(tabla);
  if (d.domain?.critical) mind.push(d.domain.critical);
  const alsok = mind.map((c) => c[0]).filter((x): x is number => x != null);
  const felsok = mind.map((c) => c[1]).filter((x): x is number => x != null);
  return {
    crit: [alsok.length ? Math.max(...alsok) : null,
           felsok.length ? Math.min(...felsok) : null],
    kontextus: "legszigorubb (a kontextus nem dönthető el)",
  };
}

/**
 * Egy mért változó megítélése.
 *
 * A sorrend nem cserélhető fel: a DEFINÍCIÓS küszöb erősebb a
 * referenciatartománynál. Egy 165 Hgmm szisztolés akkor is kritikus, ha
 * történetesen nincs referenciatáblánk a vérnyomásra.
 */
export function ertekelMeres(
  reg: Registry, state: CaseState, id: string, lang: Lang = "hu",
): MeresErtekeles {
  const primary = reg.resolvePrimary(id);
  const d = reg.get(primary)!;
  const label = L(d.label, lang) ?? primary;
  const unit = d.unit ?? null;
  const alap = {
    id: primary, label, unit,
    value: null as number | null, hatar: null as string | null,
    verification: null as MeresErtekeles["verification"], kontextus: null as string | null,
    source: null as string | null,
  };

  const r = resolve(reg, state, primary);
  if (r.state !== "ok" || typeof r.value !== "number") {
    return {
      ...alap, allapot: "nemErtekelheto",
      miert: r.state === "stale"
        ? "Az érték érvényessége lejárt — a régi mérésre nem építünk megítélést."
        : "Nincs rögzített érték.",
    };
  }
  const v = r.value;
  const be = { ...alap, value: v };

  // 1. DEFINÍCIÓS KÜSZÖB — DE A KONTEXTUS ITT IS SZÁMÍT.
  //
  // A küszöb sorrendben elsőként dönt, és sokáig kontextus nélkül tette. A
  // referenciatartomány már tudta, hogy a terhesség eltolja a normálértéket; a
  // KRITIKUS küszöb nem. Az éhomi vércukornál ez éles: terhességen kívül 7,0
  // mmol/L a határ, terhességben viszont 5,1 a terhességi cukorbetegség
  // diagnosztikus küszöbe. Egy 5,8-as érték terhesen diagnosztikus — a nem
  // terhes küszöb alatt maradva viszont nem lett belőle riasztás, csak egy
  // „magas” olvasat a referenciából. Ugyanaz az analit, ugyanaz a minta.
  const kctx = kritikusKontextus(reg, state, d);
  const crit = kctx.crit;
  if (crit && kivul(v, crit[0], crit[1])) {
    const hatar = crit[0] != null && v < crit[0]
      ? `${crit[0]} alatt` : `${crit[1]} felett`;
    return {
      ...be, allapot: "kritikus", hatar,
      kontextus: kctx.kontextus,
      source: d.evidence?.[0]?.cite ?? null,
      miert:
        `${label}: ${v}${unit ? " " + unit : ""} — a kritikus küszöbön ` +
        `(${hatar}) kívül` +
        (kctx.kontextus
          ? `, a(z) „${kctx.kontextus}” kontextus küszöbe szerint.`
          : `. Ez a változó definíciós határa, nem referenciatartomány-kérdés.`),
    };
  }

  // 2. KONTEXTUSFÜGGŐ REFERENCIA.
  if (!d.reference) {
    // A KRITIKUS SÁVON BELÜL ≠ NORMÁLIS. A sáv a beavatkozási küszöböt jelöli,
    // nem a referenciatartományt: egy 125-ös pulzus a [40, 130] sávon belül
    // van, és attól még nem élettani. Ezt ki kell mondani, különben a „sávban”
    // szó többet állít, mint amennyit tudunk.
    if (crit) {
      const sav = `${crit[0] ?? "−∞"}–${crit[1] ?? "∞"}` + (unit ? ` ${unit}` : "");
      return {
        ...be, allapot: "savban", hatar: sav,
        source: d.evidence?.[0]?.cite ?? null,
        miert:
          `${label}: ${v}${unit ? " " + unit : ""} — a kritikus sávon (${sav}) ` +
          `belül. Ez a BEAVATKOZÁSI küszöb, nem referenciatartomány: a sávon ` +
          `belüli érték nem feltétlenül élettani, csak nem lépi át a küszöböt. ` +
          `Referenciatartomány ehhez a változóhoz nincs a regiszterben.`,
      };
    }
    return {
      ...be, allapot: "nemErtekelheto",
      miert:
        `${label}: nincs referenciatartomány a regiszterben, ezért a ` +
        `mért érték nem minősíthető. Ez NEM azt jelenti, hogy normális.`,
    };
  }
  const kontextus = referenciaKontextus(reg, state);
  if (!kontextus) {
    return {
      ...be, allapot: "nemErtekelheto",
      verification: d.reference.verification,
      source: d.reference.source.cite,
      miert:
        `${label}: a referenciakontextus (terhesség és trimeszter) nem ` +
        `állapítható meg, ezért a tartomány nem választható ki. A rendszer ` +
        `NEM esik vissza a nem terhes sávra — arra olvasva a lelet mást jelent.`,
    };
  }
  const range = d.reference.ranges.find((x) => x.context === kontextus);
  if (!range) {
    return {
      ...be, allapot: "nemErtekelheto", kontextus,
      verification: d.reference.verification,
      source: d.reference.source.cite,
      miert:
        `${label}: a táblában nincs tartomány a(z) „${kontextus}” ` +
        `kontextushoz. A hiányzó tartomány nem „normális”.`,
    };
  }

  const kiv = kivul(v, range.low, range.high);
  const sav = `${range.low ?? "−∞"}–${range.high ?? "∞"}` + (unit ? ` ${unit}` : "");
  const hitelesitve = d.reference.verification === "primary";
  return {
    ...be,
    allapot: kiv ? "referencianKivul" : "savban",
    hatar: sav, kontextus,
    verification: d.reference.verification,
    source: d.reference.source.cite,
    miert:
      `${label}: ${v}${unit ? " " + unit : ""} — a(z) „${kontextus}” ` +
      `tartomány (${sav}) ${kiv ? "KÍVÜL" : "belül"}.` +
      (hitelesitve
        ? ""
        : ` A tartomány ${d.reference.verification} szintű: elsődleges ` +
          `forrásból nincs visszaellenőrizve, ezért ez JELZÉS, nem megállapítás.`),
  };
}

export interface MeresTeendo {
  id: string;
  label: string;
  urgency: "urgent" | "soon" | "routine";
  text: string;
  /** Miből következik — az indoklás nélküli teendőt vagy vakon elfogadják, vagy vakon elutasítják. */
  miert: string;
  source: string | null;
}

/**
 * Teendők a mért értékekből.
 *
 * CSAK a definíciós küszöb átlépéséből keletkezik teendő. A hitelesítetlen
 * referenciatartományon kívüliség jelzés — látszik a leleten, de nem generál
 * feladatot, mert a tartomány maga nincs visszaellenőrizve.
 */
export function meresTeendok(
  reg: Registry, state: CaseState, idk: string[], lang: Lang = "hu",
): MeresTeendo[] {
  const out: MeresTeendo[] = [];
  for (const id of idk) {
    const e = ertekelMeres(reg, state, id, lang);
    if (e.allapot !== "kritikus") continue;
    out.push({
      id: e.id, label: e.label, urgency: "urgent",
      text:
        `${e.label} a kritikus küszöbön kívül (${e.value}${e.unit ? " " + e.unit : ""}, ` +
        `${e.hatar}) — azonnali megítélés.`,
      miert: e.miert,
      source: e.source,
    });
  }
  return out;
}

/**
 * Minden mért változó, amit ebben az esetben rögzítettek — megítéléssel.
 *
 * A `nemErtekelheto` és a `nincsKuszob` tételek is benne maradnak, és ez
 * szándékos: a rendszer megmondja, mit NEM tud megítélni, ahelyett hogy
 * elhallgatná.
 *
 * Ez a mondat korábban is itt állt — a kód mégis egy EGÉSZ KATEGÓRIÁT
 * elhallgatott. A küszöb és referencia nélküli mérés egy `continue`-val esett
 * ki, mielőtt bármilyen állapotot kapott volna: a fejléc az elvet állította, a
 * ciklus a fordítottját csinálta.
 */
export function meresek(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): MeresErtekeles[] {
  const out: MeresErtekeles[] = [];
  for (const d of reg.all()) {
    if (d.aliasOf || d.datatype !== "quantity") continue;
    const r = resolve(reg, state, d.id);
    if (r.state === "missing") continue;

    // A KÜSZÖB NÉLKÜLI MÉRÉS KORÁBBAN ITT TŰNT EL, EGY `continue`-VAL.
    // A rögzített érték sehol nem jelent meg, és a hallgatás megnyugtatásnak
    // látszott. Most megszólal — de nem talál ki küszöböt: megnevezi a hiányt.
    if (!d.domain?.critical && !d.reference) {
      const label = L(d.label, lang) ?? d.id;
      const unit = d.unit ?? null;
      out.push({
        id: d.id, label, allapot: "nincsKuszob",
        value: typeof r.value === "number" ? r.value : null,
        unit, hatar: null, verification: null, kontextus: null, source: null,
        miert:
          `${label}: ${typeof r.value === "number" ? r.value : "?"}` +
          `${unit ? " " + unit : ""} — RÖGZÍTVE, DE NINCS MIHEZ MÉRNI. Ehhez a ` +
          `változóhoz nincs felvéve kritikus küszöb és nincs referenciatartomány ` +
          `sem. A rendszer erről a számról nem mond semmit — és ezt jobb ` +
          `kimondani, mint hallgatással megnyugtatásnak látszani.`,
      });
      continue;
    }
    out.push(ertekelMeres(reg, state, d.id, lang));
  }
  const rang: Record<MeresAllapot, number> = {
    kritikus: 0, referencianKivul: 1, nincsKuszob: 2, nemErtekelheto: 3, savban: 4,
  };
  return out.sort((a, b) => rang[a.allapot] - rang[b.allapot] || a.id.localeCompare(b.id));
}

/* ── A KÜSZÖB NÉLKÜLI MÉRÉSEK LELTÁRA ───────────────────────────────── */

export interface NemaMeres {
  id: string;
  label: string;
  modul: string;
  unit: string | null;
  /** Kézzel bevitt, vagy számított (utóbbinál a bemenetek küszöbei számítanak). */
  kezzelBevitt: boolean;
}

/**
 * MELYIK MÉRÉSRŐL NEM TUD MONDANI SEMMIT A RENDSZER.
 *
 * Nem esetfüggő: a REGISZTER átvizsgálása. Azt válaszolja meg, hány olyan
 * mennyiségi változó van, amihez sem kritikus küszöböt, sem referenciát nem
 * vettünk fel — vagyis amiről a rendszer akkor is hallgat, ha a klinikus
 * beírja.
 *
 * A `kezzelBevitt` megkülönböztetés nem kozmetika: egy SZÁMÍTOTT értéknél a
 * bemenetek küszöbei tartják a védelmet, egy kézzel beírtnál semmi nem tartja.
 */
export function nemaMeresek(reg: Registry, lang: Lang = "hu"): NemaMeres[] {
  const out: NemaMeres[] = [];
  for (const d of reg.all()) {
    if (d.aliasOf || d.datatype !== "quantity") continue;
    if (d.domain?.critical || d.reference) continue;
    out.push({
      id: d.id,
      label: L(d.label, lang) ?? d.id,
      modul: d.module,
      unit: d.unit ?? null,
      kezzelBevitt: (d.derivation as { kind?: string } | undefined)?.kind !== "computed",
    });
  }
  return out.sort((a, b) => a.modul.localeCompare(b.modul) || a.id.localeCompare(b.id));
}

export interface NemaMerleg {
  mennyisegi: number;
  kuszobbel: number;
  nema: number;
  nemaKezzel: number;
  modulok: number;
}

export function nemaMerleg(reg: Registry): NemaMerleg {
  const q = reg.all().filter((d) => !d.aliasOf && d.datatype === "quantity");
  const nema = nemaMeresek(reg);
  return {
    mennyisegi: q.length,
    kuszobbel: q.length - nema.length,
    nema: nema.length,
    nemaKezzel: nema.filter((x) => x.kezzelBevitt).length,
    modulok: new Set(nema.map((x) => x.modul)).size,
  };
}

