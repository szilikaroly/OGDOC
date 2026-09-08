/**
 * SOROS VONAL (RS-232 / RS-485) — CSAK AZ INTERFÉSZ.
 *
 * EZ A MODUL NEM NYIT PORTOT, ÉS SOHA NEM IS FOG.
 *
 * A soros átvitel a telepítés dolga: platformfüggő, jogosultságfüggő, és a
 * kábelezéstől függ. Amit a mag ad, az a SZERZŐDÉS — mit vár a hajtóprogramtól,
 * és mit kell tudni egy keretről ahhoz, hogy adattá válhasson. A tényleges
 * bájtolvasás egy `SorosMeghajto` implementáció, amit a gazda ad.
 *
 * A szétválasztás nem esztétikai. A klinikai mag tiszta függvényekből áll,
 * DOM és eszköz nélkül tesztelhető — ha itt megnyílna egy port, ez a
 * tulajdonság elveszne, és a szabályokat csak valódi mérleggel lehetne
 * ellenőrizni.
 *
 * NÉGY DOLOG, AMIT A SOROS VONAL NEM TUD — ÉS AMIT PÓTOLNI KELL
 *
 *   NINCS BETEGAZONOSÍTÓ.  Az eszköz nem tudja, kit mér. A kötést a mérés
 *                          ELINDÍTÁSAKOR rögzítjük, külön, naplózott lépésben.
 *   NINCS NYUGTÁZÁS.       Ami elveszett, arról a küldő nem tud. A hiányt a
 *                          fogadónak kell AKTÍVAN keresnie.
 *   NINCS IDŐBÉLYEG.       Az eszköz órája elcsúszik, és senki nem állítja
 *                          vissza. A fogadó ideje a mérvadó, az eszközé adat.
 *   NINCS MÉRTÉKEGYSÉG.    A profil adja. Profil nélküli eszköztől érkező szám
 *                          NEM vehető át: mértékegység nélküli szám nem adat.
 *
 * ÉS EGY ÖTÖDIK, AMI A LEGKÖNNYEBBEN OKOZ CSENDES KÁRT:
 *
 *   A HALLGATÁS NEM „NINCS MÉRÉS”. Egy soros eszköz nem tudja megmondani, hogy
 *   abbahagyta. A kihúzott kábel, a lemerült elem és a „most nincs beteg”
 *   ugyanúgy néz ki: semmi nem jön. Ezért a profilhoz VÁRT GYAKORISÁG tartozik,
 *   és a némaság ÁLLAPOTOT ad, nem semmit.
 *
 * ÉS A HATODIK, AMI EGY KÁBELCSERÉTŐL TÖRTÉNIK MEG:
 *
 *   A PROFIL AZ ESZKÖZHÖZ TARTOZIK, NEM A PORTHOZ. Ha a `COM3`-hoz kötnénk,
 *   egy átdugott kábel után a rendszer a MÉRLEG számait vérgázként olvasná —
 *   ugyanaz a szám, más mértékegység, semmi jelzés. Ezért minden profilban ott
 *   az eszközazonosság, és ha az nem állapítható meg, az átvétel MEGÁLL.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { Confidence, Provenance } from "../types.ts";

/* ── A PORT ÉS A HAJTÓPROGRAM ────────────────────────────────────────── */

export interface SorosPort {
  /** Platformfüggő útvonal: `/dev/ttyUSB0`, `COM3`. */
  ut: string;
  baud: number;
  adatbit: 5 | 6 | 7 | 8;
  paritas: "nincs" | "paros" | "paratlan";
  stopbit: 1 | 2;
  /** Áramlásvezérlés. A hiánya adatvesztést okozhat nagy sebességen. */
  aramlas: "nincs" | "hardver" | "xonxoff";
}

/**
 * A HAJTÓPROGRAM SZERZŐDÉSE — ennyit vár a mag, és semmi többet.
 *
 * Szándékosan BÁJTOKAT ad, nem kereteket: a keretezés eszközfüggő, és a
 * mag képes rá (`keretez()`). Ha a hajtóprogram keretezne, minden új eszköz
 * új hajtóprogramot kívánna.
 */
export interface SorosMeghajto {
  nyit(port: SorosPort): Promise<void>;
  /** Nyers bájtfolyam. A hívó dolga keretté tagolni. */
  olvas(): AsyncIterable<Uint8Array>;
  /** Kétirányú eszköznél (lekérdezés, kalibráció indítása). */
  ir?(adat: Uint8Array): Promise<void>;
  zar(): Promise<void>;
  /**
   * AZ ESZKÖZ ÖNAZONOSÍTÁSA, ha tudja. Sok eszköz nem tudja — akkor `null`,
   * és ez NEM „ez a megfelelő eszköz”.
   */
  eszkozAzonosito?(): Promise<string | null>;
}

/* ── A KERETEZÉS ─────────────────────────────────────────────────────── */

/**
 * Hogyan tudjuk meg, hol ér véget egy üzenet.
 *
 * A `soremeles` a leggyakoribb és a legcsalókább: ha egy mérési érték
 * szövegében van sortörés, a keret kettéhasad, és a fele értelmezhetetlen
 * marad. Az `astm` (E1381) ezért használ STX/ETX-et és ellenőrzőösszeget.
 */
export type Keretezes =
  | { fajta: "soremeles"; lezaro: "\n" | "\r\n" | "\r" }
  | { fajta: "hataroljelek"; kezdo: number; zaro: number }
  /** ASTM E1381 — STX, sorszám, adat, ETX, ellenőrzőösszeg, CR LF. */
  | { fajta: "astm" }
  | { fajta: "fixHossz"; bajt: number };

export interface SorosKeret {
  /** A nyers, változatlan tartalom — a napló ezt őrzi meg. */
  nyers: string;
  /** Mikor ÉRKEZETT (a fogadó ideje). Ez a mérvadó. */
  erkezett: string;
  /** Az eszköz saját időbélyege, ha küldött. NEM mérvadó, de adat. */
  eszkozIdo?: string | null;
  /** Sorszám, ha a protokollban van — ebből látszik a hiány. */
  sorszam?: number | null;
  /** Az ellenőrzőösszeg stimmelt-e. `null`: a protokollban nincs. */
  ellenorzoOsszeg?: boolean | null;
}

/* ── AZ ESZKÖZPROFIL ─────────────────────────────────────────────────── */

export interface MezoLekepezes {
  /** Az eszköz saját mezőneve vagy oszlopsorszáma. */
  forras: string;
  /**
   * `beteg` fajtánál: a rendszer változóazonosítója (a regiszterben lennie kell).
   * `kornyezet` fajtánál: szabad mérésnév — a környezeti adat NEM betegadat,
   * és nincs helye a változóregiszterben.
   */
  valtozo: string;
  /** A mértékegység — AZ ESZKÖZTŐL nem jön, itt kell kimondani. */
  egyseg: string;
  /** Ha az eszköz más nagyságrendben küld (g helyett kg). */
  szorzo?: number;
}

/**
 * A SOROS VONAL KÉTFÉLE ADATOT HOZ, ÉS A KETTŐ ELLENTÉTES SZABÁLYT KÍVÁN.
 *
 *   beteg      egy emberen végzett mérés. KELL hozzá kötés: enélkül nem
 *              tudni, kit mértek.
 *   kornyezet  egy ESZKÖZ állapota — fagyasztóhőmérséklet, szobahőmérséklet,
 *              nyomás. Ehhez NEM SZABAD kötés: a fagyasztó hőmérsékletét
 *              beteghez rendelni nem pontatlanság, hanem értelmetlenség.
 *
 * A megkülönböztetés nem elméleti. Az első változatban a fagyasztó-hőmérő a
 * `vitals.temp` beteg-változóra volt leképezve, aminek az értelmezési
 * tartománya 30–43 °C — egy −80 °C-os leolvasás ott SOHA nem lett volna
 * érvényes érték. A profil úgy nézett ki, mintha működne, és egyetlen mérést
 * sem tudott volna átvenni.
 */
export type ProfilFajta = "beteg" | "kornyezet";

export interface EszkozProfil {
  id: string;
  fajta: ProfilFajta;
  /**
   * `kornyezet` fajtánál: MELYIK eszköz állapotát méri. A fagyasztó, a szoba,
   * a szekrény azonosítója. `beteg` fajtánál nincs értelme.
   */
  celEszkoz?: string;
  megnevezes: string;
  gyarto: string;
  tipus: string;
  /**
   * AZ ESZKÖZ AZONOSSÁGA, nem a porté. Sorozatszám vagy az eszköz által
   * küldött önazonosító. Ha a hajtóprogram nem tudja lekérdezni, akkor
   * `null` — és akkor a kötés emberi megerősítést kíván.
   */
  eszkozAzonosito: string | null;
  keretezes: Keretezes;
  /**
   * MEZŐELVÁLASZTÓ KARAKTEREK — és itt a VESSZŐ a döntő kérdés.
   *
   * Az európai eszközök tizedesVESSZŐT küldenek (`72,4`), a CSV-szerű
   * eszközök viszont vesszővel VÁLASZTANAK EL. A kettő ugyanaz a karakter,
   * és a rendszer nem találhatja ki, melyikről van szó.
   *
   * A korábbi változat mindkettőt megpróbálta: a vesszőt elválasztónak vette,
   * a maradékot pedig tizedesponttá alakította. A `WT=72,4` így két mezőre
   * hasadt, amiből az első `72` lett — ÉRVÉNYES ÉRTÉKKÉNT, jelzés nélkül. A
   * 72,4 kg-nál ez apróság; ugyanezen az úton egy 5,0 mg/dL kreatininből 5
   * lesz, egy 0,8-ból pedig 0.
   *
   * Alapértelmezés: `["|", ";", "\t"]` — a vessző SZÁNDÉKOSAN nincs benne.
   */
  mezoElvalasztok?: string[];
  /** A tizedesjel, ahogy az eszköz küldi. Alapértelmezés: mindkettő elfogadva. */
  tizedesjel?: "." | "," | "mindketto";
  mezok: MezoLekepezes[];
  /**
   * VÁRT GYAKORISÁG másodpercben. Enélkül a némaság nem megkülönböztethető a
   * „most nincs beteg”-től. `null` = eseményvezérelt eszköz, ahol a hallgatás
   * normális — de ezt KI KELL MONDANI, nem elhagyni.
   */
  vartGyakorisagMp: number | null;
  /** Milyen bizonyossággal kerül be, ami innen jön. */
  bizonyossag: Confidence;
  /**
   * MI HIÁNYZIK AHHOZ, HOGY EZ A PROFIL TÉNYLEG MŰKÖDJÖN.
   *
   * A hiányjegyzék INNEN gyűjt, nem kézzel karbantartott listából: ha a profil
   * javul, a jegyzék magától rövidül. Egy kézzel írt hiánylista fél éven belül
   * hazudik.
   */
  hianyzik?: string[];
  leiras: string;
}

/* ── A KÖTÉS: KI A BETEG ─────────────────────────────────────────────── */

/**
 * A HOZZÁRENDELÉS KÜLÖN, NAPLÓZOTT LÉPÉS.
 *
 * Az üzenetben nincs betegazonosító, tehát a „két független azonosító”
 * szabály elvben nem teljesíthető. A kötés ezt nem megkerüli, hanem
 * KIVÁLTJA: egy megnevezett ember, egy megnevezett pillanatban kimondja,
 * kit mérnek — és ez a kimondás maga az adat.
 */
export interface Kotes {
  eszkozProfil: string;
  caseId: string;
  /** KI kötötte össze. „A rendszer” nem cselekvő. */
  kototte: string;
  tol: string;
  /** Meddig. A `null` itt NEM megengedett — lásd `validateKotes()`. */
  ig: string | null;
  /** Az eszközazonosító, amit a kötés pillanatában láttunk. */
  latottEszkozAzonosito: string | null;
  miert: string;
}

export function kotesEl(k: Kotes, most: string): boolean {
  const t = Date.parse(most);
  if (Number.isNaN(t)) return false;
  if (Date.parse(k.tol) > t) return false;
  return k.ig === null || Date.parse(k.ig) >= t;
}

/* ── AZ ÁTVÉTEL ÍTÉLETE ──────────────────────────────────────────────── */

export type AtvetelAllapot =
  | "atveheto"
  /** Nincs élő kötés — nem tudni, kit mértek. */
  | "kotesNelkul"
  /** Nincs profil ehhez az eszközhöz. */
  | "profilNelkul"
  /** A profil nem ismeri ezt a mezőt — mértékegység nélkül nem adat. */
  | "egysegNelkul"
  /** AZ ESZKÖZ NEM AZ, AMIRE A KÖTÉS SZÓL. Kábelcsere vagy áthelyezés. */
  | "eszkozNemEgyezik"
  /** Az ellenőrzőösszeg nem stimmel — sérült keret. */
  | "keretSerult"
  /** Az érték nem szám vagy nem értelmezhető. */
  | "ertelmezhetetlen"
  /** KÖRNYEZETI mérés beteghez kötve — ez nem pontatlanság, hanem értelmetlenség. */
  | "kornyezetiKotessel";

export interface AtvetelItelet {
  allapot: AtvetelAllapot;
  /** A leképezett értékek — csak `atveheto` állapotban van benne bármi. */
  ertekek: Array<{ valtozo: string; ertek: number; egyseg: string }>;
  /** A rögzítés eredete, ha átvehető. */
  eredet: Provenance | null;
  miert: string;
}

/**
 * ÁTVEHETŐ-E EZ A KERET.
 *
 * A sorrend számít: előbb az ESZKÖZ azonossága, aztán a KÖTÉS, végül a
 * tartalom. Fordítva egy rossz eszköztől érkező, formailag hibátlan mérés
 * átcsúszna — és épp az a legveszélyesebb eset.
 */
export function atveheto(
  keret: SorosKeret, profil: EszkozProfil | undefined,
  kotesek: Kotes[], latottAzonosito: string | null, most: string,
): AtvetelItelet {
  const ures = { ertekek: [], eredet: null };
  if (!profil) {
    return { ...ures, allapot: "profilNelkul",
      miert:
        `Nincs eszközprofil ehhez a kerethez. Profil nélkül nem tudjuk, mit ` +
        `jelentenek a számok, és MILYEN MÉRTÉKEGYSÉGBEN — a mértékegység nélküli ` +
        `szám nem adat.` };
  }
  // 1. AZ ESZKÖZ AZONOSSÁGA. Egy átdugott kábel után a mérleg számait
  //    vérgázként olvasnánk: ugyanaz a szám, más mértékegység, semmi jelzés.
  if (profil.eszkozAzonosito !== null && latottAzonosito !== profil.eszkozAzonosito) {
    return { ...ures, allapot: "eszkozNemEgyezik",
      miert:
        `A porton lévő eszköz azonosítója „${latottAzonosito ?? "(nem közli)"}”, ` +
        `a profil viszont „${profil.eszkozAzonosito}”-ra szól. A PROFIL AZ ` +
        `ESZKÖZHÖZ TARTOZIK, NEM A PORTHOZ: egy átdugott kábel után a rendszer a ` +
        `mérleg számait vérgázként olvasná, ugyanabban a nagyságrendben, minden ` +
        `jelzés nélkül.` };
  }
  // 2. A KÖTÉS — DE CSAK BETEGMÉRÉSNÉL.
  const elo = kotesek.filter((k) => k.eszkozProfil === profil.id && kotesEl(k, most));
  if (profil.fajta === "kornyezet") {
    if (elo.length) {
      return { ...ures, allapot: "kornyezetiKotessel",
        miert:
          `A(z) „${profil.megnevezes}” KÖRNYEZETI mérés (${profil.celEszkoz ?? "?"}), ` +
          `mégis van hozzá élő betegkötés. Egy fagyasztó hőmérsékletét beteghez ` +
          `rendelni nem pontatlanság, hanem értelmetlenség — és a betegdokumentumba ` +
          `bekerülő −80 °C-os „testhőmérséklet” onnantól kitörölhetetlen.` };
    }
  } else if (!elo.length) {
    const volt = kotesek.filter((k) => k.eszkozProfil === profil.id);
    return { ...ures, allapot: "kotesNelkul",
      miert:
        `Nincs élő kötés a(z) „${profil.megnevezes}” eszközhöz, tehát nem tudni, ` +
        `KIT mértek. ` +
        (volt.length
          ? `A legutóbbi kötés ${volt[volt.length - 1].ig ?? "?"}-kor lezárult. `
          : `Ehhez az eszközhöz még soha nem volt kötés. `) +
        `A mérés NEM VÉSZ EL: várakozó sorba kerül, és a kötés utólagos ` +
        `megadásával feldolgozható — a betegazonosító nélküli mérés csendes ` +
        `hozzárendelése volna a kár, nem az elutasítás.` };
  }
  // 3. A KERET ÉPSÉGE.
  if (keret.ellenorzoOsszeg === false) {
    return { ...ures, allapot: "keretSerult",
      miert:
        `Az ellenőrzőösszeg nem stimmel. Soros vonalon a sérült keret nem ` +
        `ritkaság (zaj, földhurok, rossz baud), és nyugtázás híján a küldő nem ` +
        `tud róla — ezért itt kell megfogni.` };
  }
  // 4. A TARTALOM.
  const mezok = bont(keret.nyers, profil);
  const ertekek: AtvetelItelet["ertekek"] = [];
  for (const m of profil.mezok) {
    const nyers = mezok.get(m.forras);
    if (nyers === undefined) continue;
    const sz = szamma(nyers, profil);
    if (sz === null) {
      return { ...ures, allapot: "ertelmezhetetlen",
        miert:
          `A(z) „${m.forras}” mező értéke nem szám: ${JSON.stringify(nyers)}` +
          (/,/.test(nyers)
            ? ` — a profil tizedesjele „.”, az érték viszont vesszőt tartalmaz. ` +
              `Ez ELUTASÍTÁS, nem csonkolás: a 72,4-ből nem lesz 72.`
            : `.`) };
    }
    ertekek.push({ valtozo: m.valtozo, ertek: sz * (m.szorzo ?? 1), egyseg: m.egyseg });
  }
  if (!ertekek.length) {
    return { ...ures, allapot: "egysegNelkul",
      miert:
        `A keretből egyetlen leképezett mező sem jött ki. A profil ${profil.mezok.length} ` +
        `mezőt ismer (${profil.mezok.map((m) => m.forras).join(", ")}); a keret ` +
        `mezői: ${[...mezok.keys()].join(", ") || "(egy sem)"}.` };
  }
  return {
    allapot: "atveheto", ertekek,
    eredet: {
      source: "device", confidence: profil.bizonyossag,
      at: keret.erkezett,
      by: `${profil.megnevezes} (${profil.gyarto} ${profil.tipus}) — soros`,
    } as Provenance,
    miert:
      `${ertekek.length} érték a(z) „${profil.megnevezes}” eszköztől` +
      (profil.fajta === "kornyezet"
        ? `, a(z) ${profil.celEszkoz} eszköz állapotaként. Környezeti mérés: ` +
          `NINCS és nem is lehet betegkötése.`
        : `, a(z) ${elo[0].caseId} esethez kötve (${elo[0].kototte}, ${elo[0].tol}).`) +
      (keret.eszkozIdo ? ` Az eszköz saját ideje: ${keret.eszkozIdo} — megőrizve, ` +
        `de nem mérvadó.` : ""),
  };
}

/** A VESSZŐ SZÁNDÉKOSAN NINCS BENNE — lásd `EszkozProfil.mezoElvalasztok`. */
const ALAP_ELVALASZTOK = ["|", ";", "\t"];

function elvalasztoMinta(profil: EszkozProfil): RegExp {
  const jelek = profil.mezoElvalasztok?.length
    ? profil.mezoElvalasztok : ALAP_ELVALASZTOK;
  return new RegExp(`[${jelek.map((j) => j.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")).join("")}]`);
}

/**
 * SZÁMMÁ ALAKÍTÁS A PROFIL TIZEDESJELE SZERINT.
 *
 * `null`, ha nem szám. A `72,4` NEM lesz `72`: vagy egész, vagy semmi.
 */
export function szamma(nyers: string, profil: EszkozProfil): number | null {
  const t = profil.tizedesjel ?? "mindketto";
  const sz = t === "." ? nyers : nyers.replace(",", ".");
  if (t === "." && /,/.test(nyers)) return null;
  const n = Number(sz.trim());
  return Number.isFinite(n) ? n : null;
}

/** Kulcs=érték párokra vagy pozíció szerint bontott mezők. */
function bont(nyers: string, profil: EszkozProfil): Map<string, string> {
  const ki = new Map<string, string>();
  const minta = elvalasztoMinta(profil);
  if (/=/.test(nyers)) {
    for (const d of nyers.split(minta)) {
      const i = d.indexOf("=");
      if (i > 0) ki.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
    if (ki.size) return ki;
  }
  const oszlopok = nyers.split(minta);
  profil.mezok.forEach((m) => {
    const i = Number(m.forras);
    if (Number.isInteger(i) && oszlopok[i] !== undefined) ki.set(m.forras, oszlopok[i].trim());
  });
  return ki;
}

/* ── A HALLGATÁS ÁLLAPOT, NEM SEMMI ──────────────────────────────────── */

export type NemasagAllapot =
  | "beszel"
  /** A várt gyakoriságon belül nem jött keret. */
  | "elhallgatott"
  /** Eseményvezérelt eszköz — a hallgatás normális, és ez ki van mondva. */
  | "esemenyvezerelt"
  /** Soha nem jött keret ettől az eszköztől. */
  | "sohaNemSzolalt";

export interface NemasagItelet {
  allapot: NemasagAllapot;
  /** Hány másodperce nem jött keret. */
  elteltMp: number | null;
  miert: string;
}

/**
 * MEGSZÓLALT-E AZ ESZKÖZ AZ ELVÁRT IDŐN BELÜL.
 *
 * Egy soros eszköz nem tudja megmondani, hogy abbahagyta. A kihúzott kábel, a
 * lemerült elem és a „most nincs beteg” ugyanúgy néz ki: semmi nem jön. A
 * némaság ezért ÁLLAPOT, nem hiány — és a fagyasztó-hőmérőnél ez a különbség
 * dönti el, hogy észrevesszük-e a kitérést.
 */
export function nemasag(
  profil: EszkozProfil, utolsoKeret: string | null, most: string,
): NemasagItelet {
  if (profil.vartGyakorisagMp === null) {
    return { allapot: "esemenyvezerelt", elteltMp: null,
      miert:
        `A(z) „${profil.megnevezes}” eseményvezérelt: a hallgatás normális. Ez ` +
        `KI VAN MONDVA a profilban, nem elhagyva — a különbség az, hogy egy ` +
        `elfelejtett gyakoriság ugyanígy nézne ki.` };
  }
  if (!utolsoKeret) {
    return { allapot: "sohaNemSzolalt", elteltMp: null,
      miert:
        `A(z) „${profil.megnevezes}” eszköztől még soha nem érkezett keret. Ez ` +
        `NEM „nincs mérés”: a kábel, a port beállítása vagy a tápellátás ` +
        `ellenőrizendő.` };
  }
  const eltelt = Math.round((Date.parse(most) - Date.parse(utolsoKeret)) / 1000);
  if (eltelt > profil.vartGyakorisagMp) {
    return { allapot: "elhallgatott", elteltMp: eltelt,
      miert:
        `A(z) „${profil.megnevezes}” ${eltelt} másodperce hallgat, a várt ` +
        `gyakoriság ${profil.vartGyakorisagMp} mp. A kihúzott kábel, a lemerült ` +
        `elem és a „most nincs beteg” UGYANÚGY NÉZ KI — ezért a némaság állapot, ` +
        `nem semmi.` };
  }
  return { allapot: "beszel", elteltMp: eltelt,
    miert: `Utolsó keret ${eltelt} mp-e (várt: ${profil.vartGyakorisagMp} mp).` };
}

/* ── FOLYTONOSSÁG ÉS ÓRAELTOLÓDÁS ────────────────────────────────────── */

export interface FolytonossagItelet {
  /** Hiányzó sorszámok. Üres lista NEM azt jelenti, hogy semmi nem veszett el. */
  hianyzo: number[];
  /** Van-e egyáltalán sorszám a protokollban. */
  sorszamozott: boolean;
  miert: string;
}

/**
 * MI VESZETT EL — amennyire egyáltalán megállapítható.
 *
 * Nyugtázás nincs, tehát az adatvesztés csendes. Ha a protokoll sorszámoz, a
 * hiány kimutatható; ha nem, akkor a rendszer NEM állíthatja, hogy minden
 * megérkezett — csak azt, hogy nem tudja.
 */
export function folytonossag(keretek: SorosKeret[]): FolytonossagItelet {
  const sz = keretek.map((k) => k.sorszam).filter((x): x is number => typeof x === "number");
  if (sz.length < 2) {
    return { hianyzo: [], sorszamozott: false,
      miert:
        `A protokoll nem sorszámoz, ezért a hiány NEM MUTATHATÓ KI. A rendszer ` +
        `nem állítja, hogy minden keret megérkezett — azt állítja, hogy nem tudja. ` +
        `A kettő nem ugyanaz.` };
  }
  const rendezett = [...new Set(sz)].sort((a, b) => a - b);
  const hianyzo: number[] = [];
  for (let i = rendezett[0]; i <= rendezett[rendezett.length - 1]; i++) {
    if (!rendezett.includes(i)) hianyzo.push(i);
  }
  return { hianyzo, sorszamozott: true,
    miert: hianyzo.length
      ? `${hianyzo.length} keret hiányzik (${hianyzo.slice(0, 10).join(", ")}` +
        `${hianyzo.length > 10 ? "…" : ""}). Nyugtázás nincs, tehát a küldő nem tud róla.`
      : `A sorszámok hézagmentesek ${rendezett[0]}-tól ${rendezett[rendezett.length - 1]}-ig.` };
}

/**
 * AZ ESZKÖZ ÓRÁJÁNAK ELTOLÓDÁSA — másodpercben, előjellel.
 *
 * Nem hiba, hanem ADAT: egy folyamatosan növekvő eltolódás azt jelenti, hogy
 * az eszköz órája szalad, és a rajta megjelenő időpontok a leleten
 * félrevezetők lesznek.
 */
export function oraeltolodas(keret: SorosKeret): number | null {
  if (!keret.eszkozIdo) return null;
  const e = Date.parse(keret.eszkozIdo), f = Date.parse(keret.erkezett);
  if (Number.isNaN(e) || Number.isNaN(f)) return null;
  return Math.round((e - f) / 1000);
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export interface SorosKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  profilok: EszkozProfil[];
}

export function loadProfilok(path: string): SorosKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as SorosKeszlet;
}

export function validateProfilok(
  k: SorosKeszlet, ismertValtozo: (id: string) => boolean,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const p of k.profilok) {
    if (latott.has(p.id)) {
      out.push({ severity: "error", id: p.id, message: `Ismétlődő profilazonosító.` });
    }
    latott.add(p.id);
    if (!p.mezok.length) {
      out.push({ severity: "error", id: p.id,
        message: `A(z) „${p.megnevezes}” profil egyetlen mezőt sem képez le.` });
    }
    if (p.fajta !== "beteg" && p.fajta !== "kornyezet") {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” profilnak nincs fajtája. A soros vonal kétféle ` +
          `adatot hoz, és a kettő ELLENTÉTES szabályt kíván: a betegmérés kötést ` +
          `KÍVÁN, a környezeti mérés nem TŰR el kötést.` });
    }
    // A KÖRNYEZETI PROFILNAK NINCS EMBERI ELLENŐRZŐ LÉPÉSE.
    // A betegmérésnél az azonosítót nem közlő eszközt a KÖTÉS fogja meg: egy
    // megnevezett ember kimondja, melyik eszközről van szó. A környezeti
    // mérésnek nincs kötése, tehát ez a lépés HIÁNYZIK — ha az eszköz sem
    // azonosítja magát, a buszon lévő második fagyasztó adata csendben az
    // elsőhöz kerül, és senki nem néz rá.
    if (p.fajta === "kornyezet" && p.eszkozAzonosito === null) {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” környezeti profilnál az eszközazonosító ` +
          `\`null\`. Betegmérésnél ez megengedett, mert a KÖTÉS emberi ` +
          `megerősítést kíván — környezeti mérésnél viszont nincs kötés, tehát ` +
          `ez az ellenőrző lépés hiányzik. Egy RS-485 buszon a 2. fagyasztó ` +
          `adata így csendben az 1.-höz kerülne, és a kitérés a rossz ` +
          `eszközre íródna.` });
    }
    if (p.fajta === "kornyezet" && !p.celEszkoz?.trim()) {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” környezeti profil, de nincs megnevezve, MELYIK ` +
          `eszköz állapotát méri. Egy hőmérséklet-leolvasás cél nélkül nem adat: ` +
          `nem tudni, melyik fagyasztó melegedett fel.` });
    }
    for (const m of p.mezok) {
      if (!m.egyseg?.trim()) {
        out.push({ severity: "error", id: p.id,
          message:
            `A(z) „${m.forras}” mezőhöz nincs MÉRTÉKEGYSÉG. A soros vonal nem ` +
            `küld egységet, tehát ha itt sincs, a szám nem adat: az 5,0 mg/dL ` +
            `kreatinin és az 5,0 µmol/L nem ugyanaz a beteg.` });
      }
      // A BETEGMÉRÉS a változóregiszterbe megy, a KÖRNYEZETI nem.
      if (p.fajta === "beteg" && !ismertValtozo(m.valtozo)) {
        out.push({ severity: "error", id: p.id,
          message: `Ismeretlen változó a leképezésben: „${m.valtozo}”.` });
      }
      if (p.fajta === "kornyezet" && ismertValtozo(m.valtozo)) {
        out.push({ severity: "error", id: p.id,
          message:
            `A(z) „${p.megnevezes}” KÖRNYEZETI profil a(z) „${m.valtozo}” ` +
            `BETEG-változóra képez le. A környezeti adat nem betegadat: a ` +
            `fagyasztó −80 °C-a a „vitals.temp” 30–43 °C-os tartományában soha ` +
            `nem lenne érvényes érték, tehát ez a profil egyetlen mérést sem ` +
            `tudna átvenni — miközben úgy néz ki, mintha működne.` });
      }
    }
    // A VESSZŐ NEM LEHET EGYSZERRE ELVÁLASZTÓ ÉS TIZEDESJEL.
    // Ez nem beállítási ízlés: ha mindkettő, akkor a `72,4` kétértelmű, és a
    // rendszer VAGY 72-t ír be érvényes értékként, VAGY elutasítja a keretet.
    // Az első a rosszabb, mert nem ad jelzést.
    const elv = p.mezoElvalasztok ?? [];
    if (elv.includes(",") && (p.tizedesjel ?? "mindketto") !== ".") {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” profilban a VESSZŐ egyszerre mezőelválasztó és ` +
          `elfogadott tizedesjel. Ez feloldhatatlan: a „72,4” vagy két mezővé ` +
          `hasad (és 72 lesz belőle, ÉRVÉNYES ÉRTÉKKÉNT, jelzés nélkül), vagy ` +
          `egy szám marad. Ha az eszköz vesszővel választ el, a tizedesjele ` +
          `kötelezően „.”.` });
    }
    // A VÁRT GYAKORISÁGOT KI KELL MONDANI — akkor is, ha nincs.
    if (p.vartGyakorisagMp === undefined) {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” profilból hiányzik a várt gyakoriság. A ` +
          `\`null\` (eseményvezérelt) ÉRVÉNYES válasz, a hiánya nem: enélkül a ` +
          `némaság nem megkülönböztethető a „most nincs beteg”-től, és egy ` +
          `kihúzott kábel csendben marad.` });
    }
    if (typeof p.vartGyakorisagMp === "number" && p.vartGyakorisagMp <= 0) {
      out.push({ severity: "error", id: p.id,
        message: `A várt gyakoriság nem lehet nulla vagy negatív.` });
    }
    if (p.eszkozAzonosito === undefined) {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” profilból hiányzik az eszközazonosító mező. A ` +
          `\`null\` (az eszköz nem közli) ÉRVÉNYES válasz — de akkor a kötés ` +
          `emberi megerősítést kíván, és ezt tudni kell.` });
    }
  }
  return out;
}

export function validateKotes(k: Kotes): string[] {
  const bad: string[] = [];
  if (!k.kototte?.trim()) {
    bad.push("nincs megnevezve, KI kötötte össze az eszközt a beteggel — " +
             "„a rendszer” nem cselekvő, és a hozzárendelés felelőssége nevesített");
  }
  // A KÖTÉS NEM LEHET NYITOTT. Egy nyitott kötés azt jelenti, hogy a következő
  // beteg mérései is az előzőhöz kerülnek — és ez a leggyakoribb, legcsendesebb
  // hiba, amit egy soros eszköz okozhat.
  if (k.ig === null) {
    bad.push("a kötésnek NINCS VÉGE. Egy nyitott kötés azt jelenti, hogy a " +
             "KÖVETKEZŐ beteg mérései is az előzőhöz kerülnek — ez a " +
             "leggyakoribb és legcsendesebb hiba, amit egy soros eszköz okozhat");
  }
  if (k.ig !== null && Date.parse(k.ig) < Date.parse(k.tol)) {
    bad.push("a kötés vége korábbi, mint a kezdete");
  }
  if (!k.miert?.trim()) {
    bad.push("nincs indok");
  }
  return bad;
}

export interface SorosMerleg {
  profil: number;
  /** Hány profil nem teljes — a leképezés hiányos vagy nincs hova írni. */
  hianyos: number;
  beteg: number;
  kornyezet: number;
  mezo: number;
  esemenyvezerelt: number;
  /** Hány profilhoz nem tartozik eszközazonosító — ott a kötés emberi. */
  azonositoNelkul: number;
}

export function merleg(k: SorosKeszlet): SorosMerleg {
  return {
    profil: k.profilok.length,
    hianyos: k.profilok.filter((p) => (p.hianyzik ?? []).length).length,
    beteg: k.profilok.filter((p) => p.fajta === "beteg").length,
    kornyezet: k.profilok.filter((p) => p.fajta === "kornyezet").length,
    mezo: k.profilok.reduce((n, p) => n + p.mezok.length, 0),
    esemenyvezerelt: k.profilok.filter((p) => p.vartGyakorisagMp === null).length,
    azonositoNelkul: k.profilok.filter((p) => p.eszkozAzonosito === null).length,
  };
}
