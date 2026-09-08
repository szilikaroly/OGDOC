/**
 * KARDIOLÓGIA A TERHESSÉGBEN — a fejlett világ vezető anyai halálokáról.
 *
 * A modul három dolgot tud, és mind a három ugyanarra a szerkezeti hibára
 * válasz: EGY DIAGNÓZISNÉV KEVESEBBET HORDOZ, MINT AMENNYI A DÖNTÉSHEZ KELL.
 *
 *   1. mWHO-BESOROLÁS. A kockázati osztály nem a diagnózis tulajdonsága. A
 *      súlyos aortastenosis TÜNETMENTESEN III., TÜNETESEN IV. osztály — egy
 *      „aortastenosis: igen” mező ezt a különbséget nem tudja hordozni.
 *
 *   2. A JELEK KONTEXTUSFÜGGŐ OLVASATA. Ugyanaz a szám mást jelent terhesen
 *      és terhességen kívül, és a két irányú tévedés ellentétes:
 *
 *          D-DIMER    a NORMÁLIS értéket hisszük megnyugtatónak — pedig
 *                     terhesen élettanilag emelkedik, tehát nem zár ki.
 *          TROPONIN   a KÓROS értéket hisszük ártalmatlannak („biztos a
 *                     terhesség”) — pedig élettanilag NEM emelkedik.
 *
 *   3. A SZÜLÉS UTÁNI ÁTADÁS. A szívesemények nagy része a gyermekágyban
 *      történik, amikorra a beteg a szülészeti gondozásból kikerült, és a
 *      kardiológiai gondozásba még nem érkezett meg.
 *
 * AMIÉRT A JELEK REGISZTERE EGYÁLTALÁN LÉTREJÖTT
 *
 * A `lab.dimer` változó `pitfalls` szövege eddig is leírta, hogy terhességben
 * elvész a negatív prediktív értéke. A SZÖVEG VISZONT NEM TARTJA VISSZA A
 * KÜSZÖBÖT: egy prózai figyelmeztetés a mezőleírásban nem akadályozza meg,
 * hogy a rendszer egy III. trimeszteri 0,4 mg/L-es D-dimert „normális”-ként
 * mutasson, és hogy erre hivatkozva elmaradjon a képalkotás. Ez a rendszer
 * visszatérő hibacsaládja: a próza olyat ígér, amit a szerkezet nem hordoz.
 *
 * AMIT EZ A MODUL NEM TESZ
 *
 * Nem javasol terhességmegszakítást, és nem beszél le róla. A IV. osztály
 * TÉNY, amit közöl; a döntés a betegé, a terhesszív-csapattal. Nem ad
 * küszöböt a NT-proBNP-hez sem: az helyi laborvalidálást kíván.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A KONTEXTUS ─────────────────────────────────────────────────────── */

export type Kontextus =
  | "nonpregnant"
  | "pregnancy.t1"
  | "pregnancy.t2"
  | "pregnancy.t3"
  /** A szülést követő 0–7 nap. A szívesemények itt sűrűsödnek. */
  | "postpartum.korai"
  /** 8. naptól 6 hónapig. A peripartalis cardiomyopathia ablaka is idetart. */
  | "postpartum.kesoi";

export const KONTEXTUSOK: Kontextus[] = [
  "nonpregnant", "pregnancy.t1", "pregnancy.t2", "pregnancy.t3",
  "postpartum.korai", "postpartum.kesoi",
];

/**
 * A GESZTÁCIÓS KORBÓL KONTEXTUS — és a `null` NEM „nem terhes”.
 *
 * Ez a függvény szándékosan `null`-t ad vissza, ha nem lehet eldönteni. A
 * hívó ezt `nemErtelmezheto` ítéletté fordítja, nem hallgatólagos
 * „nonpregnant”-tá: az utóbbi épp a legveszélyesebb tévedés, mert a nem
 * terhes küszöböket engedné rá egy terhes betegre.
 */
export function kontextusbol(
  terhes: boolean | null, gaHet: number | null, szulesOtaNap: number | null,
): Kontextus | null {
  // A FOLYÓ TERHESSÉG ELŐZI A KORÁBBI SZÜLÉST — és ez nem elméleti sorrend.
  //
  // Rövid szülésköznél mindkét adat egyszerre igaz: valaki három hónapja
  // szült, ÉS most a 20. héten jár. Ha a gyermekágyi ág döntene, a rendszer
  // egy II. trimeszteres terhest „késői gyermekágyas”-nak olvasna, és rá a
  // gyermekágyi küszöböket engedné. A most fennálló terhesség élettani
  // változásai a mérvadók, nem egy lezárult szülésé.
  if (terhes === true) {
    // Terhes, de nincs gesztációs kor: NEM helyettesíthető a gyermekágyi ággal.
    if (gaHet == null) return null;
    if (gaHet < 14) return "pregnancy.t1";
    if (gaHet < 28) return "pregnancy.t2";
    return "pregnancy.t3";
  }
  if (szulesOtaNap != null && szulesOtaNap >= 0) {
    if (szulesOtaNap <= 7) return "postpartum.korai";
    if (szulesOtaNap <= 183) return "postpartum.kesoi";
    return "nonpregnant";
  }
  if (terhes === false) return "nonpregnant";
  return null;
}

/* ── A JELEK REGISZTERE ──────────────────────────────────────────────── */

export type Valtozas =
  | "nemValtozik" | "emelkedik" | "csokken" | "balra" | "visszater" | "elofordul";

/** `true`: a nem terhes küszöb használható. `"reszben"`: csak egy irányban. */
export type Hasznalhatosag = boolean | "reszben";

export interface KardioJel {
  id: string;
  /**
   * MELY VÁLTOZÓKRA VONATKOZIK — lista, nem egyetlen mező.
   *
   * Az első változatban ez egyetlen `valtozo` volt, és a T-inverziós szabály
   * szövege azt mondta: „a III. elvezetés és V1–V3”. A szerkezet viszont csak
   * a `ekg.iii.t` mezőt hordozta, tehát a V1–V3 T-inverziójára a szabály NEM
   * hatott: ott a rendszer változatlanul a nem terhes küszöbbel dolgozott
   * volna. Ez a rendszer visszatérő hibacsaládja — a próza olyat ígér, amit a
   * szerkezet nem tud hordozni —, és itt épp abban a regiszterben történt meg,
   * ami ellene épült.
   */
  valtozok: string[];
  megnevezes: string;
  elettaniValtozas: Record<string, Valtozas>;
  kuszobHasznalhato: Record<string, Hasznalhatosag>;
  mitJelent: string;
  /** Amit a rendszernek TILOS állítania. Ez a mező a modul lényege. */
  tiltas: string;
  mertek?: string | null;
  forras: string;
}

export interface KardioJelKeszlet {
  megnevezes: string;
  modul: number;
  alairas: null | { ki: string; mikor: string; lenyomat: string };
  note: string;
  kontextusok: string[];
  jelek: KardioJel[];
}

export function loadJelek(path: string): KardioJelKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as KardioJelKeszlet;
}

/**
 * VÁLTOZÓ → JEL INDEX. A hívó ezt használja, nem a `valtozok` első elemét.
 *
 * Egy jel több változóra vonatkozhat, és egy változóhoz legfeljebb egy jel
 * tartozhat: ha kettő tartozna, nem volna eldönthető, melyik tiltás érvényes.
 */
export function jelIndex(k: KardioJelKeszlet): Map<string, KardioJel> {
  const ki = new Map<string, KardioJel>();
  for (const j of k.jelek) for (const v of j.valtozok ?? []) ki.set(v, j);
  return ki;
}

export type OlvasatAllapot =
  /** A nem terhes küszöb érvényes ebben a kontextusban. */
  | "kuszobErvenyes"
  /** A küszöb NEM használható — az érték nem minősíthető a szokásos módon. */
  | "kuszobErvenytelen"
  /** A küszöb csak az egyik irányban tart: a megnyugtató irány elvész. */
  | "kuszobFelig"
  /** Nincs kontextus. NEM „nem terhes”. */
  | "nemErtelmezheto";

export interface Olvasat {
  allapot: OlvasatAllapot;
  jel: string;
  /** Szabad-e a szokásos küszöb szerint „normális”-nak jelölni. */
  normalisnakJelolheto: boolean;
  miert: string;
}

/**
 * HOGYAN OLVASSUK EZT A JELET EBBEN A KONTEXTUSBAN.
 *
 * A visszatérési érték nem a mérés minősítése — azt a küszöbréteg végzi —,
 * hanem az, hogy a MINŐSÍTÉS EGYÁLTALÁN ÉRVÉNYES-E itt. A kettő különbsége az
 * a 0,4 mg/L-es D-dimer, amit a rendszer terhesen sem mondhat normálisnak.
 */
export function olvasat(
  jel: KardioJel | undefined, ktx: Kontextus | null, valtozoId: string,
): Olvasat {
  if (!jel) {
    return { allapot: "kuszobErvenyes", jel: valtozoId, normalisnakJelolheto: true,
      miert:
        `A(z) „${valtozoId}” változóhoz nincs terhességi olvasati szabály, tehát ` +
        `a szokásos küszöb érvényes. Ez NEM állítás arról, hogy a terhesség ne ` +
        `befolyásolná — csak annyit jelent, hogy erről a jelről a rendszer nem ` +
        `mond semmit.` };
  }
  if (!ktx) {
    return { allapot: "nemErtelmezheto", jel: jel.id, normalisnakJelolheto: false,
      miert:
        `A(z) „${jel.megnevezes}” értéke nem értelmezhető, mert a terhességi ` +
        `állapot vagy a gesztációs kor ismeretlen. EZ NEM „NEM TERHES”: a nem ` +
        `terhes küszöb ráengedése egy terhes betegre pontosan az a hiba, ami ` +
        `ellen ez a réteg épült.` };
  }
  const h = jel.kuszobHasznalhato[ktx];
  const v = jel.elettaniValtozas[ktx];
  if (h === true) {
    return { allapot: "kuszobErvenyes", jel: jel.id, normalisnakJelolheto: true,
      miert:
        `A(z) „${jel.megnevezes}” szokásos küszöbe ebben a kontextusban ` +
        `(${ktx}) érvényes${v === "nemValtozik" ? " — nincs élettani eltolódás" : ""}. ` +
        jel.mitJelent };
  }
  if (h === "reszben") {
    return { allapot: "kuszobFelig", jel: jel.id, normalisnakJelolheto: false,
      miert:
        `A(z) „${jel.megnevezes}” küszöbe ${ktx} kontextusban csak RÉSZBEN tart: ` +
        `${jel.mitJelent} ${jel.tiltas}` };
  }
  return { allapot: "kuszobErvenytelen", jel: jel.id, normalisnakJelolheto: false,
    miert:
      `A(z) „${jel.megnevezes}” szokásos küszöbe ${ktx} kontextusban NEM ` +
      `HASZNÁLHATÓ (élettani változás: ${v}). ${jel.mitJelent} ${jel.tiltas}` };
}

/* ── mWHO ────────────────────────────────────────────────────────────── */

export interface MwhoOsztaly {
  id: string;
  jel: string;
  megnevezes: string;
  esemenyAranySzazalek: [number, number];
  gondozasiSzint: string;
  ellenorzes: string;
  leiras: string;
}

export interface MwhoAllapot {
  id: string;
  megnevezes: string;
  diagnozis: string;
  allapotFeltetel: string;
  osztaly: string;
  /** Milyen mérés kell a besoroláshoz. Hiánya NEM a kedvezőbb osztály. */
  kellAdat: string[];
  megjegyzes: string;
}

export interface MwhoKeszlet {
  megnevezes: string;
  modul: number;
  forras: { cite: string; doi: string; megjegyzes: string };
  alairas: null | { ki: string; mikor: string; lenyomat: string };
  note: string;
  osztalyok: MwhoOsztaly[];
  allapotok: MwhoAllapot[];
}

export function loadMwho(path: string): MwhoKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as MwhoKeszlet;
}

export type BesorolasAllapot =
  | "besorolva"
  /** Hiányzik a besoroláshoz szükséges mérés. NEM a kedvezőbb osztály. */
  | "nemBesorolhato"
  /** Nincs ilyen állapot a táblában. */
  | "ismeretlenAllapot"
  /** Több állapot is illik, és nem ugyanabba az osztályba visznek. */
  | "tobbTalalat";

export interface Besorolas {
  allapot: BesorolasAllapot;
  osztaly: MwhoOsztaly | null;
  /** Aláírt-e a tábla. Aláírás nélkül a besorolás TÁJÉKOZTATÓ. */
  alairt: boolean;
  hianyzoAdat: string[];
  /** A RENDSZER SAJÁT MEGÁLLAPÍTÁSA. Itt soha nincs tanács. */
  miert: string;
  /**
   * AZ IRÁNYELV SAJÁT SZÖVEGE — IDÉZET, KÜLÖN MEZŐBEN.
   *
   * Ez azért nem folyik bele a `miert`-be, mert a IV. osztálynál az irányelv
   * arról beszél, hogy a terhesség ellenjavallt és a megszakítás
   * megbeszélendő. Egy bekezdésbe öntve a felület azt jeleníti meg, amit a
   * rendszer állításának néz — és egy leolvasott mondatból tanács lesz. Külön
   * mezőben a felület KÉNYTELEN megkülönböztetni, mit mond az irányelv, és
   * mit állít a rendszer.
   */
  iranyelvSzovege: string | null;
  /**
   * KI DÖNT. A rendszer soha nem ez, és a mező soha nem üres, ha van osztály.
   */
  dontesGazdaja: string | null;
  /** SOHA `true`. A típus rögzíti, hogy ez a modul nem ad javaslatot. */
  javaslat: false;
}

/**
 * BESOROLÁS — és a hiányzó adat itt a legdrágább.
 *
 * A `megvanAdat` predikátum dönti el, hogy a besoroláshoz kellő mérés
 * megvan-e. Ha nem, az eredmény `nemBesorolhato`, és megnevezi, mi hiányzik.
 * A csendes alternatíva — adat híján a kisebb kockázatot mutatni — a korábbi
 * peripartalis cardiomyopathiánál a III. és a IV. osztály közti különbség,
 * vagyis egy ismételt terhesség egész kimenetele.
 */
export function besorol(
  k: MwhoKeszlet, allapotId: string, megvanAdat: (mero: string) => boolean,
): Besorolas {
  const talalatok = k.allapotok.filter((a) => a.id === allapotId);
  const alairt = k.alairas !== null;
  const ures = { iranyelvSzovege: null, dontesGazdaja: null, javaslat: false as const };
  if (!talalatok.length) {
    return { ...ures, allapot: "ismeretlenAllapot", osztaly: null, alairt, hianyzoAdat: [],
      miert:
        `A(z) „${allapotId}” állapot nincs a táblában. A besorolás elmarad — ez ` +
        `NEM „alacsony kockázat”: a tábla ${k.allapotok.length} állapotot ismer, ` +
        `és ami nincs benne, arról nem mond semmit.` };
  }
  if (talalatok.length > 1) {
    const oszt = new Set(talalatok.map((t) => t.osztaly));
    if (oszt.size > 1) {
      return { ...ures, allapot: "tobbTalalat", osztaly: null, alairt, hianyzoAdat: [],
        miert:
          `A(z) „${allapotId}” azonosítóra ${talalatok.length} sor illik, és ` +
          `NEM ugyanabba az osztályba visznek (${[...oszt].join(", ")}). Ezt ` +
          `emberi döntés zárja le.` };
    }
  }
  const a = talalatok[0];
  const hianyzo = a.kellAdat.filter((m) => !megvanAdat(m));
  const osztaly = k.osztalyok.find((o) => o.id === a.osztaly) ?? null;
  if (hianyzo.length) {
    return { ...ures, allapot: "nemBesorolhato", osztaly: null, alairt, hianyzoAdat: hianyzo,
      miert:
        `A(z) „${a.megnevezes}” besorolásához hiányzik: ${hianyzo.join(", ")}. A ` +
        `rendszer NEM sorolja be a kedvezőbb osztályba: ugyanaz a diagnózis a ` +
        `mérés függvényében ${k.osztalyok.map((o) => o.jel).join("/")} osztályba ` +
        `is kerülhet, és a hiányzó adat pótlása a teendő, nem a becslés.` };
  }
  return {
    allapot: "besorolva", osztaly, alairt, hianyzoAdat: [], javaslat: false,
    // A RENDSZER ÁLLÍTÁSA: mit talált, és mi következik belőle a gondozásban.
    miert:
      `„${a.megnevezes}” → mWHO ${osztaly?.jel ?? "?"}. Gondozási szint: ` +
      `${osztaly?.gondozasiSzint ?? "?"}, ellenőrzés: ${osztaly?.ellenorzes ?? "?"}` +
      (a.megjegyzes ? ` — ${a.megjegyzes}` : ``) +
      (alairt ? `` : ` A TÁBLA ALÁÍRATLAN: ez tájékoztató besorolás, nem ` +
        `gondozási szint kijelölése.`),
    // AZ IRÁNYELV SZÖVEGE: idézet, külön mezőben, hogy ne olvadjon a fentibe.
    iranyelvSzovege: osztaly?.leiras ?? null,
    dontesGazdaja:
      osztaly?.id === "mwho.IV" || osztaly?.id === "mwho.III"
        ? `a beteg, a terhesszív-csapattal (szülész, kardiológus, aneszteziológus)`
        : `a beteg, a gondozó szülésszel`,
  };
}

/* ── PERIPARTALIS CARDIOMYOPATHIA ───────────────────────────────────── */

export interface PpcmBemenet {
  ktx: Kontextus | null;
  /** Balkamrai ejekciós frakció, ha mérték. */
  lvef: number | null;
  /** Ismert-e KORÁBBI szívbetegség — a PPCM kizárásos diagnózis. */
  korabbiSzivbetegseg: boolean | null;
  /** Nehézlégzés, oedema, éjszakai fulladás, terhelhetőség-csökkenés. */
  tunetek: string[];
}

export type PpcmAllapot =
  | "gyanu"
  /** Az ablakon kívül vagyunk. */
  | "ablakonKivul"
  /** A kamrafunkció nem mért — a gyanú NEM zárható ki. */
  | "kamrafunkcioIsmeretlen"
  /** A kamrafunkció jó. */
  | "kamrafunkcioMegtartott"
  /** Korábbi szívbetegség ismert: nem PPCM, de nem is „semmi”. */
  | "masSzivbetegseg"
  | "nemErtelmezheto";

export interface PpcmItelet {
  allapot: PpcmAllapot;
  /** Indokolt-e szívultrahang MOST. */
  echoIndokolt: boolean;
  miert: string;
}

/**
 * PERIPARTALIS CARDIOMYOPATHIA — amit a terhesség vége elrejt.
 *
 * A tünetei — nehézlégzés, lábdagadás, fáradékonyság, éjszakai fulladás —
 * MEGKÜLÖNBÖZTETHETETLENEK a terhesség végének élettani panaszaitól. Ezért
 * a diagnózis rendszeresen a szülés után hetekkel születik meg, amikorra a
 * beteg már senkinek a látóterében nincs.
 *
 * A rendszer ezért NEM a tünetek alapján dönt — azokból nem lehet —, hanem
 * kimondja, hogy MÉRÉS nélkül a gyanú nem zárható ki. A `null` ejekciós
 * frakció itt nem „jó szív”: nem mért szív.
 */
export function ppcmGyanu(b: PpcmBemenet): PpcmItelet {
  if (!b.ktx) {
    return { allapot: "nemErtelmezheto", echoIndokolt: false,
      miert: `A terhességi állapot ismeretlen, az ablak nem határozható meg.` };
  }
  const ablakban = b.ktx === "pregnancy.t3" || b.ktx === "postpartum.korai"
    || b.ktx === "postpartum.kesoi";
  if (!ablakban) {
    return { allapot: "ablakonKivul", echoIndokolt: false,
      miert:
        `A peripartalis cardiomyopathia ablaka a terhesség vége és a szülés utáni ` +
        `hónapok (itt: ${b.ktx}). Ez NEM zárja ki, hogy más szívbetegség álljon a ` +
        `panasz mögött.` };
  }
  if (b.korabbiSzivbetegseg === true) {
    return { allapot: "masSzivbetegseg", echoIndokolt: b.tunetek.length > 0,
      miert:
        `Ismert korábbi szívbetegség: a peripartalis cardiomyopathia KIZÁRÁSOS ` +
        `diagnózis, tehát itt nem az. Ettől a panasz még ugyanúgy szívfunkció-` +
        `romlást jelenthet — a meglévő betegség rosszabbodását.` };
  }
  if (b.lvef == null) {
    return { allapot: "kamrafunkcioIsmeretlen", echoIndokolt: true,
      miert:
        `A kamrafunkció NEM MÉRT, tehát a peripartalis cardiomyopathia NEM ` +
        `ZÁRHATÓ KI. A tünetei — nehézlégzés, lábdagadás, fáradékonyság — ` +
        `megkülönböztethetetlenek a terhesség végének élettani panaszaitól, ezért ` +
        `a tünetlista alapján dönteni nem lehet` +
        (b.tunetek.length
          ? ` (rögzítve: ${b.tunetek.join(", ")})`
          : ` (tünet nincs rögzítve — ami szintén nem „nincs tünet”)`) +
        `. A hiányzó ejekciós frakció itt nem jó szív, hanem NEM MÉRT szív.` };
  }
  if (b.lvef < 45) {
    return { allapot: "gyanu", echoIndokolt: true,
      miert:
        `Csökkent balkamra-funkció (EF ${b.lvef}%) a peripartalis ablakban, ismert ` +
        `korábbi szívbetegség nélkül: ez a peripartalis cardiomyopathia gyanúja. A ` +
        `megerősítés és a kizárás egyaránt kardiológusé — de a kérdés innentől fel ` +
        `van téve, és nem tűnik el a zárójelentésben.` };
  }
  return { allapot: "kamrafunkcioMegtartott", echoIndokolt: false,
    miert:
      `Megtartott balkamra-funkció (EF ${b.lvef}%). A peripartalis ` +
      `cardiomyopathia ezzel nem valószínű — a panasz oka viszont továbbra is ` +
      `keresendő, ha van.` };
}

/* ── A SZÜLÉS UTÁNI ÁTADÁS ──────────────────────────────────────────── */

export interface AtadasItelet {
  /** Van-e nyitott átadási rés MOST. */
  res: boolean;
  napokSzulesOta: number | null;
  miert: string;
}

/**
 * A GYERMEKÁGYI ÁTADÁS — ahol a szívesemények történnek.
 *
 * A szülés utáni napokban a keringés visszarendeződik: a méh összehúzódásával
 * jelentős vérmennyiség kerül vissza a keringésbe, és ez épp azt a szívet
 * terheli meg, amelyik a terhességet még bírta. Ez az az ablak, amelyben a
 * beteg a szülészeti gondozásból már kikerült, a kardiológiaiba pedig még nem
 * érkezett meg — az átadást senki nem birtokolja.
 */
export function atadasiRes(
  mwhoOsztaly: string | null, szulesOtaNap: number | null,
  kardiologiaiIdopontVan: boolean,
): AtadasItelet {
  if (szulesOtaNap == null) {
    return { res: false, napokSzulesOta: null,
      miert: `Nincs szülési dátum, az átadási ablak nem értelmezhető.` };
  }
  if (!mwhoOsztaly) {
    return { res: false, napokSzulesOta: szulesOtaNap,
      miert:
        `Nincs mWHO-besorolás, ezért az átadás szükségessége nem állapítható ` +
        `meg. Ez NEM „nem kell”: besorolás nélkül a kérdés eldöntetlen.` };
  }
  const magas = mwhoOsztaly === "mwho.III" || mwhoOsztaly === "mwho.IV"
    || mwhoOsztaly === "mwho.II-III";
  if (!magas) {
    return { res: false, napokSzulesOta: szulesOtaNap,
      miert: `mWHO ${mwhoOsztaly}: a szülés utáni kardiológiai átadás nem külön feladat.` };
  }
  if (kardiologiaiIdopontVan) {
    return { res: false, napokSzulesOta: szulesOtaNap,
      miert: `Kardiológiai időpont rögzítve — az átadásnak van gazdája.` };
  }
  return { res: true, napokSzulesOta: szulesOtaNap,
    miert:
      `mWHO ${mwhoOsztaly}, ${szulesOtaNap} nappal a szülés után, és NINCS ` +
      `rögzített kardiológiai időpont. A szülés utáni napokban a méh ` +
      `összehúzódásával jelentős vérmennyiség kerül vissza a keringésbe — épp ` +
      `azt a szívet terhelve, amelyik a terhességet még bírta. A beteg ilyenkor ` +
      `a szülészeti gondozásból már kikerült, a kardiológiaiba pedig még nem ` +
      `érkezett meg: ezt az átadást senki nem birtokolja, ezért a rendszer jelzi.` };
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface KardioMerleg {
  osztaly: number;
  allapot: number;
  /** Hány állapot sorol a legmagasabb kockázati osztályba. */
  legmagasabb: number;
  /** Hány diagnózis szerepel több osztályban — ott a szó önmagában kevés. */
  tobbOsztalyuDiagnozis: number;
  jel: number;
  /** Hány jelnél veszti érvényét a szokásos küszöb legalább egy kontextusban. */
  kontextusfuggo: number;
  mwhoAlairt: boolean;
  jelekAlairt: boolean;
}

export function merleg(m: MwhoKeszlet, j: KardioJelKeszlet): KardioMerleg {
  const dgOsztalyok = new Map<string, Set<string>>();
  for (const a of m.allapotok) {
    if (!dgOsztalyok.has(a.diagnozis)) dgOsztalyok.set(a.diagnozis, new Set());
    dgOsztalyok.get(a.diagnozis)!.add(a.osztaly);
  }
  return {
    osztaly: m.osztalyok.length,
    allapot: m.allapotok.length,
    legmagasabb: m.allapotok.filter((a) => a.osztaly === "mwho.IV").length,
    tobbOsztalyuDiagnozis: [...dgOsztalyok.values()].filter((s) => s.size > 1).length,
    jel: j.jelek.length,
    kontextusfuggo: j.jelek.filter(
      (x) => Object.values(x.kuszobHasznalhato).some((h) => h !== true)).length,
    mwhoAlairt: m.alairas !== null,
    jelekAlairt: j.alairas !== null,
  };
}

export function validateKardio(
  m: MwhoKeszlet, j: KardioJelKeszlet, ismertValtozo: (id: string) => boolean,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const osztalyIdk = new Set(m.osztalyok.map((o) => o.id));

  const latott = new Set<string>();
  for (const a of m.allapotok) {
    if (latott.has(a.id)) {
      out.push({ severity: "error", id: a.id, message: `Ismétlődő állapotazonosító.` });
    }
    latott.add(a.id);
    if (!osztalyIdk.has(a.osztaly)) {
      out.push({ severity: "error", id: a.id,
        message: `Ismeretlen kockázati osztály: „${a.osztaly}”.` });
    }
    // A LEGMAGASABB OSZTÁLYHOZ MÉRÉS KELL. Egy IV. besorolás, ami pusztán a
    // diagnózis nevéből következne, a legsúlyosabb következményű állítás,
    // amit a rendszer megtehet — és épp ott ne kelljen adat.
    if (a.osztaly === "mwho.IV" && !a.kellAdat.length && a.allapotFeltetel !== "bármilyen") {
      out.push({ severity: "error", id: a.id,
        message:
          `A(z) „${a.megnevezes}” a legmagasabb kockázati osztályba sorol, de ` +
          `nincs hozzá szükséges mérés megnevezve, miközben a feltétele ` +
          `(„${a.allapotFeltetel}”) nem „bármilyen”. Egy IV. besorolás a ` +
          `diagnózis nevéből — mérés nélkül — a legsúlyosabb következményű ` +
          `állítás, amit a rendszer megtehet.` });
    }
  }

  // AMELYIK DIAGNÓZIS TÖBB OSZTÁLYBAN SZEREPEL, OTT A FELTÉTELNEK BESZÉLNIE KELL.
  const dg = new Map<string, MwhoAllapot[]>();
  for (const a of m.allapotok) {
    dg.set(a.diagnozis, [...(dg.get(a.diagnozis) ?? []), a]);
  }
  for (const [nev, sorok] of dg) {
    if (sorok.length < 2) continue;
    if (new Set(sorok.map((s) => s.allapotFeltetel)).size !== sorok.length) {
      out.push({ severity: "error", id: nev,
        message:
          `A(z) „${nev}” diagnózis ${sorok.length} sorban szerepel, de az ` +
          `állapotfeltételeik nem különböznek egyértelműen. Ha ugyanaz a ` +
          `diagnózis több osztályba sorolhat, a KÜLÖNBSÉGNEK kell kimondva ` +
          `lennie — különben a besorolás azon múlik, melyik sort találjuk meg előbb.` });
    }
  }

  const valtozoGazda = new Map<string, string>();
  for (const x of j.jelek) {
    for (const v of x.valtozok ?? []) {
      const elozo = valtozoGazda.get(v);
      if (elozo) {
        out.push({ severity: "error", id: x.id,
          message:
            `A(z) „${v}” változóhoz két jel is tartozik („${elozo}” és ` +
            `„${x.id}”). Nem volna eldönthető, melyik tiltás érvényes rá.` });
      }
      valtozoGazda.set(v, x.id);
    }
  }
  for (const x of j.jelek) {
    if (!x.valtozok?.length) {
      out.push({ severity: "error", id: x.id,
        message:
          `A(z) „${x.megnevezes}” jelhez egyetlen változó sincs rendelve. Egy ` +
          `szabály, ami semmire nem vonatkozik, nem szabály — csak leírás.` });
    }
    for (const vid of x.valtozok ?? []) {
      if (!ismertValtozo(vid)) {
        out.push({ severity: "warning", id: x.id,
          message:
            `A(z) „${x.megnevezes}” jel a(z) „${vid}” változóra hivatkozik, ` +
            `ami nincs a regiszterben. A szabály erre a mezőre nem hat: a ` +
            `küszöböt egy nem létező mezőnél nem lehet visszatartani.` });
      }
    }
    for (const ktx of j.kontextusok) {
      if (x.kuszobHasznalhato[ktx] === undefined) {
        out.push({ severity: "error", id: x.id,
          message:
            `A(z) „${x.megnevezes}” jelnél a(z) „${ktx}” kontextus nincs ` +
            `kimondva. A hiányzó bejegyzés hallgatólagosan „használható”-t ` +
            `jelentene — és pontosan ez az a csendes engedés, ami ellen ez a ` +
            `regiszter épült.` });
      }
      if (x.elettaniValtozas[ktx] === undefined) {
        out.push({ severity: "error", id: x.id,
          message: `A(z) „${x.megnevezes}” jelnél hiányzik az élettani változás: „${ktx}”.` });
      }
    }
    if (!x.tiltas?.trim()) {
      out.push({ severity: "error", id: x.id,
        message:
          `A(z) „${x.megnevezes}” jelhez nincs kimondva, mit TILOS állítani. Ez a ` +
          `mező a szabály lényege: enélkül a bejegyzés leírás marad, nem korlát.` });
    }
  }
  return out;
}
