/**
 * A RECEPT KIÁLLÍTÁSA — a második dolog a rendszerben, ami kifelé ír és nem
 * hívható vissza.
 *
 * A `prescribe()` a REKORDBA vesz fel egy készítményt. Ez más művelet: a recept
 * ELHAGYJA a rendszert, a beteg kiváltja és beszedi. Az EESZT-nél már
 * kimondtuk, hogy a hibás belső bejegyzés javítható, az országos térbe küldött
 * üzenet nem — a recept ennél tovább megy: nem csak elment, hanem HATOTT.
 *
 * EGY KAPU LEGYEN, ÉS EZ AZ.
 *
 * Itt egy valódi rés volt. A telemedicina-modul (27.) saját `kiallithato()`
 * kapuval rendelkezett, és az KÉT dolgot kért: megnevezett klinikust és
 * ellenőrzött indikációt. A saját indoklása fel is sorolta, mi minden változhatott
 * közben — „terhesség, új interakció, laboreltérés” —, de egyiket sem KÉRTE.
 *
 * Vagyis a rendszerben két receptkiállítási kapu volt, és a GYENGÉBBIKET a
 * beteg tudta elindítani otthonról. Egy telemedicinán át kiállított recept
 * kihagyta az allergia-, interakció-, terhesség- és vesefunkció-ellenőrzést.
 *
 * A 27. modul mostantól ide delegál. Egy kapu van.
 *
 * AZ ÖT ELLENŐRZÉS, ÉS AMIÉRT EGYIK SEM FIGYELMEZTETÉS
 *
 *   indikáció   a korábbi döntés nem bizonyítja a mostanit
 *   allergia    a hiányzó allergiaadat NEM „nincs allergiája”
 *   interakció  a beteg TELJES listájával — a sajátunk nem elég
 *   terhesség   ez a rendszer klinikai magja, itt nem mellékszempont
 *   vesefunkció ott, ahol a dózis attól függ
 *
 * AZ INTERAKCIÓ-ELLENŐRZÉS HÁROM ÁLLAPOTA a modul legfontosabb
 * megkülönböztetése. Ha csak a saját listánkat néztük, az eredmény NEM „nincs
 * interakció”, hanem „nem tudjuk”. A beteg más orvosoktól is kap gyógyszert, és
 * a „tiszta” válasz ilyenkor hamis biztonságot ad — pontosan azt a fajtát,
 * amitől valaki abbahagyja a kérdezést.
 *
 * ÉS A VISSZAVONÁS NEM VISSZACSINÁLÁS. Rögzíthető, hogy egy receptet
 * visszavontak, és ez NEM ugyanaz, mintha ki sem állították volna: a különbség
 * a beteg szempontjából az, hogy közben kiváltotta-e és beszedte-e.
 */
import type { RegistryIssue } from "../registry.ts";

/* ── A BEMENETEK ─────────────────────────────────────────────────────── */

/**
 * AZ ALLERGIA ÁLLAPOTA — az `allergy.*` entitásból (35. modul).
 *
 * A bemenet mostantól EGY helyről jön: `allergy.asked` mondja meg, feltették-e
 * a kérdést, és `allergy.list` azt, mi van rajta. Korábban ez öt mezőben élt
 * három modulban, és a kapu csak azt látta, amelyiket éppen megkapta.
 */
export type AllergiaAllas =
  /** Megkérdezték, és nincs. */
  | "nincs"
  /** Megkérdezték, és van — a készítménnyel ütközik-e, külön kérdés. */
  | "van"
  /** NEM KÉRDEZTÉK MEG. Ez nem „nincs”. */
  | "nemKerdeztek";

export type InterakcioAllas =
  /** A beteg TELJES aktuális listájával összevetve (EESZT-előzmény). */
  | "teljesListaval"
  /** Csak a beteg elmondása alapján — hiányos lehet. */
  | "csakElmondasAlapjan"
  /** Csak a saját listánkkal, vagy sehogy. NEM „tiszta”. */
  | "nemTudjuk";

export type TerhessegAllas =
  | "nemTerhes"
  | "terhes"
  | "szoptat"
  /** Nem tudjuk. A rendszer NEM esik vissza a „nem terhes” ágra. */
  | "ismeretlen";

export interface Kiallitas {
  keszitmeny: string;
  /** MEGNEVEZETT klinikus, a saját jogosultságával. */
  klinikus: string;
  indikaciotEllenorizte: boolean;
  allergia: AllergiaAllas;
  /** Ha `van`: ütközik-e EZZEL a készítménnyel. A hiánya nem „nem”. */
  allergiaUtkozik?: boolean;
  interakcio: InterakcioAllas;
  /** Ha a lista megvan: talált-e ütközést. */
  interakcioTalalat?: boolean;
  terhesseg: TerhessegAllas;
  /** Gesztációs hét — ami az I. trimeszterben tilos, a III.-ban lehet elsőként választandó. */
  gaHet?: number | null;
  /** Fogamzóképes korú-e. Teratogén szernél ez önmagában is szempont. */
  fogamzokepes?: boolean;
  /** A készítménynek van-e ALÁÍRT terhességi/szoptatási állásfoglalása. */
  vanTerhessegiBesorolas: boolean;
  teratogen?: boolean;
  /** Teratogén szernél: a fogamzásgátlás kérdése a felírás része. */
  fogamzasgatlastMegbeszelte?: boolean;
  /** A dózis vesefüggő-e, és ismert-e a vesefunkció. */
  dozisVesefuggo?: boolean;
  crclIsmert?: boolean;
  /** MEGNEVEZETT indoklás egy kapu vállalt megkerüléséhez. */
  vallaltKockazat?: { kapu: string; miert: string; ki: string };
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export type KapuAllapot =
  | "kiallithato"
  | "nincsKlinikus"
  | "indikacioEllenorizetlen"
  | "allergiaNemKerdezve"
  | "allergiaUtkozik"
  | "interakcioNemTudjuk"
  | "interakcioTalalat"
  | "terhessegIsmeretlen"
  | "nincsTerhessegiBesorolas"
  | "fogamzasgatlasMegbeszeletlen"
  | "vesefunkcioIsmeretlen";

export interface KapuItelet {
  allapot: KapuAllapot;
  kiallithato: boolean;
  /** Megkerülhető-e megnevezett indoklással. Az adathiány NEM az. */
  vallalhato: boolean;
  miert: string;
}

/**
 * A KIÁLLÍTÁSI KAPU. Egy van belőle, és minden út ezen megy át — a
 * telemedicina-modul is.
 *
 * A sorrend nem esetleges: előbb az, ami MEG SEM TÖRTÉNT (nincs klinikus, nem
 * kérdezték meg), aztán az, ami megtörtént és rosszat mond. Az adathiány nem
 * vállalható kockázat: amit meg lehet kérdezni, azt meg kell kérdezni.
 */
export function kiallithato(k: Kiallitas): KapuItelet {
  const V = (allapot: KapuAllapot, vallalhato: boolean, miert: string): KapuItelet => {
    if (vallalhato && k.vallaltKockazat?.kapu === allapot
        && k.vallaltKockazat.miert.trim() && k.vallaltKockazat.ki.trim()) {
      return { allapot: "kiallithato", kiallithato: true, vallalhato: true,
        miert:
          `Kiállítva VÁLLALT KOCKÁZATTAL (${k.vallaltKockazat.ki}): ` +
          `${k.vallaltKockazat.miert}. A megkerült kapu: ${allapot}. ` +
          `Az eredeti ok: ${miert}` };
    }
    return { allapot, kiallithato: false, vallalhato, miert };
  };

  if (!k.klinikus?.trim()) {
    return V("nincsKlinikus", false,
      `Kiállítani MEGNEVEZETT klinikus tud, a saját jogosultságával. A beteg ` +
      `kérése ehhez bemenet, nem felhatalmazás.`);
  }
  if (!k.indikaciotEllenorizte) {
    return V("indikacioEllenorizetlen", false,
      `Az indikáció ellenőrzése nincs rögzítve. Egy „megújítás”, ami a korábbi ` +
      `rendelést ismétli, pontosan az a hiba, amit a rendszer mindenütt máshol ` +
      `tilt: a korábbi döntés nem bizonyítja a mostanit.`);
  }
  if (k.allergia === "nemKerdeztek") {
    return V("allergiaNemKerdezve", false,
      `Az allergia nincs megkérdezve. A HIÁNYZÓ ALLERGIAADAT NEM „nincs ` +
      `allergiája” — és ezt nem lehet kockázatvállalással pótolni, mert meg ` +
      `lehet kérdezni.`);
  }
  if (k.allergia === "van" && k.allergiaUtkozik !== false) {
    return V("allergiaUtkozik", k.allergiaUtkozik === true,
      k.allergiaUtkozik === true
        ? `A beteg ismert allergiája ÜTKÖZIK ezzel a készítménnyel.`
        : `A beteg allergiás, de nincs rögzítve, hogy ütközik-e EZZEL a ` +
          `készítménnyel. A kérdés nyitva maradt — ez nem nemleges válasz.`);
  }
  if (k.interakcio === "nemTudjuk") {
    return V("interakcioNemTudjuk", true,
      `Az interakció-ellenőrzés eredménye NEM „tiszta”, hanem NEM TUDJUK: a ` +
      `beteg teljes aktuális gyógyszerlistája nem áll rendelkezésre. A beteg ` +
      `más orvosoktól is kap gyógyszert, és a „nincs interakció” válasz ilyenkor ` +
      `hamis biztonságot ad — pontosan azt a fajtát, amitől valaki abbahagyja a ` +
      `kérdezést.`);
  }
  if (k.interakcioTalalat === true) {
    return V("interakcioTalalat", true,
      `Az interakció-ellenőrzés TALÁLATOT adott` +
      (k.interakcio === "csakElmondasAlapjan"
        ? ` — és a lista a beteg elmondásából származik, tehát hiányos is lehet: ` +
          `a találat valós, a hiánya nem lenne bizonyíték.`
        : `.`));
  }
  if (k.terhesseg === "ismeretlen") {
    return V("terhessegIsmeretlen", false,
      `A terhességi állapot ismeretlen, és a rendszer NEM esik vissza a „nem ` +
      `terhes” ágra — ugyanaz a szabály, mint a laborreferenciáknál és a ` +
      `gyermekgyógyászatnál. Ez a rendszer klinikai magja: itt a terhesség nem ` +
      `mellékszempont.`);
  }
  if (!k.vanTerhessegiBesorolas) {
    return V("nincsTerhessegiBesorolas", true,
      `A készítménynek („${k.keszitmeny}”) NINCS aláírt terhességi/szoptatási ` +
      `állásfoglalása a törzsben. A rendszer nem találgat: besorolás nélkül a ` +
      `kiállítás megnevezett kockázatvállalást kíván. (A régi FDA-kategóriák ` +
      `visszavonás alatt vannak — hogy melyik besorolás legyen, és ki hitelesíti, ` +
      `emberi döntés.)`);
  }
  if (k.teratogen && k.fogamzokepes && !k.fogamzasgatlastMegbeszelte) {
    return V("fogamzasgatlasMegbeszeletlen", false,
      `Teratogén szer fogamzóképes korú betegnek, a fogamzásgátlás megbeszélése ` +
      `nélkül. Ez a felírás RÉSZE, nem utólagos tanács — a beteg a patikában ` +
      `nem fogja megtudni.`);
  }
  if (k.dozisVesefuggo && !k.crclIsmert) {
    return V("vesefunkcioIsmeretlen", false,
      `A dózis vesefüggő, a vesefunkció viszont nem ismert. Ezt meg lehet ` +
      `mérni, tehát nem vállalható kockázat.`);
  }
  return { allapot: "kiallithato", kiallithato: true, vallalhato: false,
    miert:
      `Kiállítható: ${k.klinikus}, ellenőrzött indikációval, ` +
      `allergia ${k.allergia}, interakció ${k.interakcio}, ` +
      `terhességi állapot ${k.terhesseg}.` };
}

/* ── A VISSZAVONÁS ───────────────────────────────────────────────────── */

export type VisszavonasAllapot =
  /** Visszavonva, mielőtt a beteg kiváltotta. */
  | "kivaltasElott"
  /** Kiváltotta, de (tudomásunk szerint) nem szedte be. */
  | "kivaltotta"
  /** Beszedte. A visszavonás ezt NEM teszi meg nem történtté. */
  | "beszedte"
  /** Nem tudjuk, mi történt vele. NEM „nem váltotta ki”. */
  | "ismeretlen";

export interface Visszavonas {
  allapot: VisszavonasAllapot;
  /** Kell-e a beteget elérni. */
  betegetErtesiteni: boolean;
  miert: string;
}

export function visszavon(
  kivaltotta: boolean | null, beszedte: boolean | null,
): Visszavonas {
  if (beszedte === true) {
    return { allapot: "beszedte", betegetErtesiteni: true,
      miert:
        `A recept vissza van vonva, DE A BETEG BESZEDTE. A visszavonás nem ` +
        `visszacsinálás: a rekordban ez nem ugyanaz, mintha ki sem állították ` +
        `volna, és a beteget el kell érni.` };
  }
  if (kivaltotta === true) {
    return { allapot: "kivaltotta", betegetErtesiteni: true,
      miert:
        `A recept vissza van vonva, de a beteg már KIVÁLTOTTA. A doboz nála ` +
        `van — a visszavonás önmagában nem akadályozza meg a beszedést.` };
  }
  if (kivaltotta === false) {
    return { allapot: "kivaltasElott", betegetErtesiteni: false,
      miert: `A recept a kiváltás előtt visszavonva.` };
  }
  return { allapot: "ismeretlen", betegetErtesiteni: true,
    miert:
      `Nem tudjuk, kiváltotta-e. EZ NEM „nem váltotta ki”: amíg nem tudjuk, a ` +
      `beteget úgy kell kezelni, mint akinél a gyógyszer ott lehet.` };
}

/* ── GYSE ────────────────────────────────────────────────────────────── */

export type GyseAllapot =
  /** Szakorvos javasolta, érvényességi idővel. NEM rendelés. */
  | "javaslat"
  /** A javaslat LEJÁRT — belőle rendelés már nem lesz. */
  | "javaslatLejart"
  /** Jogosult orvos kiállította. */
  | "rendelve"
  /** Kiadva, a kihordási idő fut. */
  | "kihordas"
  /** A kihordási idő letelt, újra rendelhető. */
  | "ujraRendelheto";

export interface GyseKeres {
  eszkozcsoport: string;
  /** A javaslatot tevő szakorvos és a javaslat érvényessége. */
  javasolta?: { ki: string; mikor: string; ervenyesEddig: string };
  /** A kiállító orvos szakvizsgája. */
  kiallitoSzakvizsga?: string | null;
  /** Az eszközcsoporthoz KÖTELEZŐ szakvizsgák; üres = nincs megkötés. */
  szuksegesSzakvizsgak: string[];
  /** Mennyi kérhető egy időszakban, és mennyit már kiadtak. */
  mennyisegiKorlat?: { max: number; kiadva: number; idoszak: string } | null;
  /** A legutóbbi kiadás és a kihordási idő hónapban. */
  utolsoKiadas?: { mikor: string; kihordasHonap: number } | null;
}

export type GyseKapuAllapot =
  | "rendelheto"
  | "nincsJavaslat"
  | "javaslatLejart"
  | "szakvizsgaHianyzik"
  | "mennyisegiKorlat"
  | "kihordasAlatt";

export interface GyseItelet {
  allapot: GyseKapuAllapot;
  rendelheto: boolean;
  miert: string;
}

/**
 * A GYSE NEM GYÓGYSZER, és nem szabad ugyanúgy kezelni.
 *
 * A javaslat nem rendelés — a 27. modul laikus kérésének a párja: belőle akkor
 * lesz rendelés, ha a jogosult orvos kiállítja, és a javaslat érvényessége
 * LEJÁR. A kihordási idő alatt pedig újabb rendelés nem indul, és ezt a
 * rendszernek meg kell mondania, MIELŐTT a beteg a patikában tudja meg.
 */
export function gyseRendelheto(g: GyseKeres, most: string): GyseItelet {
  if (!g.javasolta?.ki?.trim()) {
    return { allapot: "nincsJavaslat", rendelheto: false,
      miert:
        `Nincs szakorvosi javaslat a(z) „${g.eszkozcsoport}” eszközcsoportra. A ` +
        `JAVASLAT NEM RENDELÉS, de a rendelés sem lesz javaslat nélkül.` };
  }
  if (Date.parse(g.javasolta.ervenyesEddig) < Date.parse(most)) {
    return { allapot: "javaslatLejart", rendelheto: false,
      miert:
        `A szakorvosi javaslat ${g.javasolta.ervenyesEddig}-én lejárt ` +
        `(${g.javasolta.ki}, ${g.javasolta.mikor}). A javaslat érvényessége azért ` +
        `jár le, mert az állapot változik — egy két éve kelt javaslat nem a ` +
        `mostani betegről szól.` };
  }
  if (g.szuksegesSzakvizsgak.length
      && !g.szuksegesSzakvizsgak.includes(g.kiallitoSzakvizsga ?? "")) {
    return { allapot: "szakvizsgaHianyzik", rendelheto: false,
      miert:
        `A(z) „${g.eszkozcsoport}” kiállítása szakvizsgához kötött ` +
        `(${g.szuksegesSzakvizsgak.join(", ")}); a kiállítóé: ` +
        `${g.kiallitoSzakvizsga || "nincs megadva"}. Ez KAPU, nem figyelmeztetés: ` +
        `a jogosulatlanul kiállított rendelés támogatása utólag visszakövetelhető.` };
  }
  if (g.utolsoKiadas) {
    const eltelt = (Date.parse(most) - Date.parse(g.utolsoKiadas.mikor)) / 86_400_000 / 30.44;
    if (eltelt < g.utolsoKiadas.kihordasHonap) {
      const hatra = Math.ceil(g.utolsoKiadas.kihordasHonap - eltelt);
      return { allapot: "kihordasAlatt", rendelheto: false,
        miert:
          `A kihordási idő fut: az utolsó kiadás ${g.utolsoKiadas.mikor}, a ` +
          `kihordási idő ${g.utolsoKiadas.kihordasHonap} hónap, hátra van ` +
          `${hatra} hónap. Újabb rendelés addig nem indul — és ezt ITT kell ` +
          `megmondani, nem a patikában.` };
    }
  }
  if (g.mennyisegiKorlat && g.mennyisegiKorlat.kiadva >= g.mennyisegiKorlat.max) {
    return { allapot: "mennyisegiKorlat", rendelheto: false,
      miert:
        `A mennyiségi korlát kimerült: ${g.mennyisegiKorlat.kiadva}/` +
        `${g.mennyisegiKorlat.max} ${g.mennyisegiKorlat.idoszak} alatt.` };
  }
  return { allapot: "rendelheto", rendelheto: true,
    miert:
      `Rendelhető: érvényes javaslat (${g.javasolta.ki}, lejár ` +
      `${g.javasolta.ervenyesEddig}), a szakvizsga megfelel, a kihordási idő ` +
      `letelt vagy nincs.` };
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface FelirasMerleg {
  hatoanyag: number;
  /** Hánynak van ALÁÍRT terhességi/szoptatási állásfoglalása. */
  terhessegiBesorolassal: number;
  szoptatasiAdattal: number;
}

export function merleg(
  drugs: Array<{ id: string; pregnancy?: unknown; lactation?: unknown }>,
): FelirasMerleg {
  return {
    hatoanyag: drugs.length,
    terhessegiBesorolassal: drugs.filter((d) => d.pregnancy).length,
    szoptatasiAdattal: drugs.filter((d) => d.lactation).length,
  };
}

export function validateFeliras(
  drugs: Array<{ id: string; pregnancy?: unknown; lactation?: unknown }>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const m = merleg(drugs);
  if (m.terhessegiBesorolassal < m.hatoanyag) {
    out.push({ severity: "warning", id: "rx.terhessegiBesorolas",
      message:
        `${m.hatoanyag - m.terhessegiBesorolassal}/${m.hatoanyag} hatóanyagnak ` +
        `NINCS terhességi/szoptatási állásfoglalása a törzsben (szoptatási adat: ` +
        `${m.szoptatasiAdattal}/${m.hatoanyag}). EGY SZÜLÉSZETI RENDSZERBEN ez a ` +
        `legfeltűnőbb hiány: a szoptatás végig ki van töltve, a terhesség nincs. ` +
        `A kiállítási kapu ezért ma minden készítménynél megnevezett ` +
        `kockázatvállalást kíván — ez szándékos, és addig tart, amíg a besorolás ` +
        `forrása és hitelesítője nincs kimondva.` });
  }
  return out;
}
