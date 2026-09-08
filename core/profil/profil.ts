/**
 * PÁCIENS PROFIL — az allergia, ami egy helyen él, és az összefoglaló, ami
 * megmondja, mit NEM olvasott.
 *
 * KÉT SZABÁLY, ÉS MINDKETTŐ A RENDSZER LEGRÉGEBBI ELVÉNEK AZ ÉLESÍTÉSE.
 *
 * 1. AZ ÜRES ALLERGIAMEZŐ NEM „NINCS ALLERGIÁJA”.
 *
 *    Három állapot van, nem kettő: MEGERŐSÍTETT allergia, MEGKÉRDEZTÜK ÉS
 *    NEMET MONDOTT, és NEM KÉRDEZTÜK MEG. A harmadikat a rendszer eddig
 *    ugyanúgy üres mezőként mutatta, mint a másodikat — és a felírásnál a
 *    kettő különbsége az, ami számít.
 *
 *    És egy találat, ami a modul írásakor derült ki: az allergia ma ÖT
 *    VÁLTOZÓBAN, NÉGY MODULBAN él szétszórva. Aki a műtői ellenőrzőlistán
 *    bejelöli, az nem tudja, hogy a gyógyszerelési réteg másik mezőt néz. Ez
 *    ugyanaz a duplikátum-hiba, amit a rendszer a Bishop-score-nál és a
 *    magzatvíz-mezőnél már egyszer megfogott — csak itt a tét halálos.
 *
 * 2. AZ ÖSSZEFOGLALÓ ATTÓL ÖSSZEFOGLALÓ, HOGY KIHAGY — ÉS AMI KIMARADT, AZ NEM
 *    LÁTSZIK RAJTA.
 *
 *    Ez a hiányzó-adat-szabály legveszélyesebb esete, mert a hiány itt nem üres
 *    mező, hanem sima, olvasható, magabiztos szöveg. Kétszáz dokumentumból
 *    készült összefoglaló, ami öt piros zászlót kiemel, száznyolcvanötről
 *    hallgat — és ez a hallgatás pontosan úgy néz ki, mint a „nincs más
 *    fontos”.
 *
 *    EZÉRT AZ ÖSSZEFOGLALÓ NEM AZ, AMIT A KLINIKUS ELOLVAS A DOKUMENTUMOK
 *    HELYETT. AZ, AMI MEGMONDJA, MELYIK DOKUMENTUMOT KELL ELOLVASNIA.
 *
 *    És ezért nem tölthet ki strukturált mezőt. Rámutathat — „ebben allergiáról
 *    lehet szó” —, de a mezőt klinikus tölti ki. Ha az AI töltené, a klinikus
 *    megszokná, hogy ott van, és a HIÁNYÁT olvasná „nincs allergiája”-ként.
 */
import type { Registry } from "../registry.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── AZ ALLERGIA ─────────────────────────────────────────────────────── */

export type AllergiaAllapot =
  /** Megerősített allergia, forrással. */
  | "megerositett"
  /** MEGKÉRDEZTÜK, és nemet mondott. Ez ÁLLÍTÁS. */
  | "megkerdezveNincs"
  /** Gyanú, még nem tisztázott. */
  | "gyanu"
  /** NEM KÉRDEZTÜK MEG. Ez NEM „nincs allergiája”. */
  | "nemKerdeztek";

export interface AllergiaBejegyzes {
  /** Mire — hatóanyag, anyagcsoport, étel, latex. */
  mire: string;
  allapot: Exclude<AllergiaAllapot, "nemKerdeztek">;
  /** Milyen reakció volt. Megerősítettnél kötelező. */
  reakcio?: string;
  /** Ki rögzítette. AI SOHA nem szerepelhet itt. */
  rogzitette: string;
  /** Honnan tudjuk — dokumentum, beteg elmondása, korábbi észlelés. */
  forras: string;
}

export interface AllergiaProfil {
  /** Megkérdezték-e egyáltalán. */
  megkerdezve: boolean;
  bejegyzesek: AllergiaBejegyzes[];
}

export interface AllergiaAllas {
  allapot: AllergiaAllapot;
  /** Felírható-e gyógyszer erre a profilra támaszkodva. */
  felirhato: boolean;
  megerositett: string[];
  gyanus: string[];
  miert: string;
}

/**
 * AZ ALLERGIAPROFIL ÁLLÁSA.
 *
 * A `nemKerdeztek` NEM engedi a felírást — és ez a modul legszigorúbb kapuja.
 * Nem azért, mert a legtöbb betegnek van allergiája, hanem mert az elmulasztott
 * allergia következménye visszafordíthatatlan, a megkérdezés költsége pedig egy
 * mondat.
 */
export function allergiaAllas(p: AllergiaProfil): AllergiaAllas {
  const megerositett = p.bejegyzesek.filter((b) => b.allapot === "megerositett").map((b) => b.mire);
  const gyanus = p.bejegyzesek.filter((b) => b.allapot === "gyanu").map((b) => b.mire);

  if (!p.megkerdezve) {
    return {
      allapot: "nemKerdeztek", felirhato: false, megerositett, gyanus,
      miert:
        "NEM KÉRDEZTÜK MEG. Az üres allergiamező nem „nincs allergiája” — a " +
        "kettő különbsége a felírásnál az, ami számít. A megkérdezés költsége " +
        "egy mondat; az elmulasztott allergiáé visszafordíthatatlan.",
    };
  }
  if (megerositett.length) {
    return {
      allapot: "megerositett", felirhato: true, megerositett, gyanus,
      miert:
        `Megerősített allergia: ${megerositett.join(", ")}` +
        (gyanus.length ? ` · tisztázandó: ${gyanus.join(", ")}` : "") + ".",
    };
  }
  if (gyanus.length) {
    return {
      allapot: "gyanu", felirhato: true, megerositett, gyanus,
      miert:
        `Tisztázatlan gyanú: ${gyanus.join(", ")}. A gyanú nem a „nincs” gyengébb ` +
        `változata — a felírás előtt tisztázandó.`,
    };
  }
  return {
    allapot: "megkerdezveNincs", felirhato: true, megerositett: [], gyanus: [],
    miert: "Megkérdezve, allergiát nem említett. Ez ÁLLÍTÁS, nem hiányzó adat.",
  };
}

/**
 * A SZÉTSZÓRT ALLERGIAMEZŐK MEGTALÁLÁSA.
 *
 * A regiszterből derivált, nem begépelt lista: ha valaki új allergiamezőt vesz
 * fel egy hatodik helyen, ez megtalálja. Aki a műtői ellenőrzőlistán bejelöli,
 * annak tudnia kell, hogy a gyógyszerelési réteg ugyanazt látja-e.
 */
/** Az EGYETLEN allergia-entitás és a hozzá tartozó, példányonkénti mezők. */
export const ALLERGIA_ENTITAS = [
  "allergy.list", "allergy.asked", "allergy.reaction", "allergy.severity",
  "allergy.verified",
];

/**
 * Mely allergiamezők élnek MÉG az entitáson kívül.
 *
 * A lista a REGISZTERBŐL derivált, nem begépelt felsorolás: egy hatodik mezőt
 * is megtalálna. Ami kimarad belőle:
 *
 *   - maga az entitás (`allergy.*`),
 *   - a FELVÁLTOTT mezők (`status: superseded`) — megmaradnak, hogy a korábbi
 *     értékek visszaolvashatók legyenek, de már nem szétszórtság,
 *   - és az `aliasOf` nézetek.
 *
 * Ami BENNE marad, az vagy valódi maradék, vagy — mint a `diet.allergies.food`
 * és az `op.who.signIn.allergy` — MÁS KÉRDÉS, ami csak a nevében allergia. A
 * kettő megkülönböztetése a `masKerdes` listán áll, és az sem lehet néma.
 */
export const MAS_KERDES: Record<string, string> = {
  "diet.allergies.food":
    "Az ételallergia FAJTÁIT részletezi a diétás tervezéshez; a TÉNYÉT az " +
    "`allergy.list` `allergen.etel` tétele hordozza. Nem duplikátum, de együtt " +
    "kell mozognia az entitással.",
  "op.who.signIn.allergy":
    "ELLENŐRZÉSI TÉNY, nem allergia-állítás: azt rögzíti, hogy egyeztették-e. " +
    "Ráadásul BOOLEAN, tehát nincs benne hely a „megkérdeztük, de a beteg nem " +
    "tudja” esetnek — a kipipálása nem bizonyítja, hogy az allergia ismert.",
};

export function szetszortAllergiaMezok(reg: Registry): string[] {
  return reg.all()
    .filter((v) => /allerg/i.test(v.id) && !v.aliasOf
      && !ALLERGIA_ENTITAS.includes(v.id)
      && v.status !== "superseded" && v.status !== "deprecated")
    .map((v) => v.id).sort();
}

/** A szétszórt mezők közül azok, amik NEM ugyanarra a kérdésre válaszolnak. */
export function masKerdesuMezok(reg: Registry): string[] {
  return szetszortAllergiaMezok(reg).filter((id) => id in MAS_KERDES);
}

/** A valódi maradék: allergiamező az entitáson kívül, ami ugyanazt kérdezi. */
export function maradekAllergiaMezok(reg: Registry): string[] {
  return szetszortAllergiaMezok(reg).filter((id) => !(id in MAS_KERDES));
}

/* ── AZ ELŐÉLET-ÖSSZEFOGLALÓ ─────────────────────────────────────────── */

export interface Lefedettseg {
  /** Hány dokumentumot kapott. */
  kapott: number;
  /** Hányat dolgozott fel. */
  feldolgozott: number;
  /** Amit nem tudott értelmezni, és MIÉRT. */
  ertelmezhetetlen: Array<{ dokumentum: string; ok: string }>;
  /** A legrégebbi feldolgozott dokumentum dátuma — az előzmény időbeli határa. */
  legregebbi: string | null;
}

export interface Allitas {
  szoveg: string;
  /** MELYIK dokumentumból. Hivatkozás nélküli állítás nem kerülhet be. */
  dokumentum?: string;
  /** Piros zászló-e. */
  pirosZaszlo?: boolean;
}

export interface Osszefoglalo {
  modell: string;
  verzio?: string;
  lefedettseg: Lefedettseg;
  allitasok: Allitas[];
  /** Van-e érvényes, célhoz kötött beleegyezés. */
  beleegyezes?: string;
}

export type OsszefoglaloAllapot =
  /** Kiadható — javaslatként, klinikusi átvételre várva. */
  | "kiadhato"
  /** Nincs beleegyezés a letöltéshez és a feldolgozáshoz. */
  | "beleegyezesNelkul"
  /** Nincs kimondva a lefedettség. */
  | "lefedettsegNelkul"
  /** Van hivatkozás nélküli állítás. */
  | "hivatkozasNelkul"
  /** A modell kapu mögött van (l. core/ai/modell.ts). */
  | "kapuMogott";

export interface OsszefoglaloAllas {
  allapot: OsszefoglaloAllapot;
  kiadhato: boolean;
  /** Az a mondat, amivel az összefoglaló KEZDŐDIK — nem a lábjegyzete. */
  fejlec: string | null;
  hivatkozasNelkul: string[];
  miert: string;
}

/**
 * KIADHATÓ-E AZ ÖSSZEFOGLALÓ.
 *
 * Három saját szabály az AI-kapun felül, és mindhárom ugyanazt védi: hogy az
 * olvasó tudja, MIRŐL NEM SZÓL ez a szöveg.
 */
export function osszefoglaloAllas(o: Osszefoglalo, modellNyitva: boolean): OsszefoglaloAllas {
  if (!modellNyitva) {
    return { allapot: "kapuMogott", kiadhato: false, fejlec: null, hivatkozasNelkul: [],
      miert:
        "A modell kapu mögött van. Egy előélet-összefoglaló, ami piros zászlókat " +
        "emel ki klinikai döntéshez, az MDR 11. szabályának hatálya alá eshet — " +
        "a válasz nélkül az almodul zárva marad." };
  }
  if (!o.beleegyezes?.trim()) {
    return { allapot: "beleegyezesNelkul", kiadhato: false, fejlec: null, hivatkozasNelkul: [],
      miert:
        "Nincs érvényes, célhoz kötött beleegyezés. A letöltött dokumentum " +
        "MÁSOLAT, és attól kezdve a mi felelősségünk: saját megőrzési órával, és " +
        "visszavonáskor a másolat is megy." };
  }
  const l = o.lefedettseg;
  if (!(l.kapott > 0) || l.feldolgozott > l.kapott) {
    return { allapot: "lefedettsegNelkul", kiadhato: false, fejlec: null, hivatkozasNelkul: [],
      miert:
        "A lefedettség nincs értelmesen kimondva. Enélkül az összefoglaló teljes " +
        "élettörténetnek látszik — pedig arról hallgat, amit nem kapott meg." };
  }
  const hivatkozasNelkul = o.allitasok.filter((a) => !a.dokumentum?.trim()).map((a) => a.szoveg);
  if (hivatkozasNelkul.length) {
    return { allapot: "hivatkozasNelkul", kiadhato: false, fejlec: null, hivatkozasNelkul,
      miert:
        `${hivatkozasNelkul.length} állítás mögött nincs dokumentumhivatkozás. Nem ` +
        `azért kell, hogy ELLENŐRIZHETŐ legyen, hanem hogy ellenőrizni KELLJEN.` };
  }
  const fejlec =
    `${l.feldolgozott}/${l.kapott} dokumentum feldolgozva` +
    (l.ertelmezhetetlen.length ? `, ${l.ertelmezhetetlen.length} nem értelmezhető` : "") +
    (l.legregebbi
      ? `. Az előzmény ${l.legregebbi}-ig nyúlik vissza: az azelőttiről ez az ` +
        `összefoglaló NEM MOND SEMMIT.`
      : ". Az előzmény időbeli határa ismeretlen.");

  return { allapot: "kiadhato", kiadhato: true, fejlec, hivatkozasNelkul: [],
    miert:
      `Kiadható JAVASLATKÉNT. ${fejlec} Az összefoglaló nem helyettesíti a ` +
      `dokumentumokat: megmondja, melyiket kell elolvasni.` };
}

/**
 * TÖLTHET-E AZ ÖSSZEFOGLALÓ STRUKTURÁLT MEZŐT.
 *
 * Soha. Ez nem beállítás, hanem a modul szabálya — ezért nincs is paramétere
 * azon kívül, hogy melyik mezőről van szó, és ezért ad mindig ugyanazt.
 *
 * Ha az AI töltené az allergiamezőt, a klinikus megszokná, hogy ott van, és a
 * HIÁNYÁT olvasná „nincs allergiája”-ként — vagyis pontosan azt a hibát
 * csinálnánk meg gépi úton, ami ellen az egész rendszer épül.
 */
export function mezotTolthet(mezo: string): { tolthet: false; miert: string } {
  return { tolthet: false,
    miert:
      `Az összefoglaló NEM tölti ki a(z) „${mezo}” mezőt, csak rámutathat a ` +
      `dokumentumra. Ha az AI töltené, a klinikus megszokná, hogy ott van, és a ` +
      `hiányát olvasná nemleges válaszként.` };
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

/* ── A BELEEGYEZÉS VISSZAVONÁSA ──────────────────────────────────────── */

/**
 * A VISSZAVONÁS NEM TÖRLI A TÖRTÉNELMET — ÉS NEM IS SZABAD, HOGY TÖRÖLJE.
 *
 * A követelmény így hangzott: „a beleegyezés visszavonásakor a letöltött másolat
 * is törlődik”. Ez igaz, de önmagában félrevezető, mert három különböző dolog
 * keletkezett a beleegyezésből, és a három sorsa NEM ugyanaz:
 *
 *   TÖRLENDŐ        a letöltött másolat. Ez a mi tárolónkban él, a mi
 *                   megőrzési óránkkal, és a jogalapja szűnt meg.
 *
 *   VISSZAVONANDÓ   a belőle készült összefoglaló. Nem törölhető nyomtalanul —
 *                   ha egy klinikus már olvasta, a döntése rá épült —, de
 *                   VISSZAVONTKÉNT kell megjelennie, és új döntéshez nem
 *                   használható.
 *
 *   MEGTARTANDÓ     amit a klinikus a saját döntéseként RÖGZÍTETT, és a
 *                   hozzáférés AUDITNAPLÓJA. Ezek törlése nem adatvédelem,
 *                   hanem a dokumentáció meghamisítása: az ellátás megtörtént,
 *                   és arról, hogy ki mikor mit nézett meg, éppen a betegnek
 *                   van joga tudni.
 *
 * A leggyakoribb hiba az első és a harmadik összemosása: egy „töröljünk
 * mindent” gomb az auditnaplót is elviszi, és onnantól nem bizonyítható, hogy a
 * visszavonás után már nem nyúlt hozzá senki.
 */

export type VisszavonasSors = "torlendo" | "visszavonando" | "megtartando";

export interface VisszavonasTetel {
  mi: string;
  sors: VisszavonasSors;
  miert: string;
}

export interface VisszavontAllapot {
  /** Elvégezhető-e gépileg a teljes visszavonás. */
  gepilegElvegezheto: boolean;
  tetelek: VisszavonasTetel[];
  miert: string;
}

export interface VisszavonasKeres {
  /** Hány letöltött dokumentummásolat van a tárolónkban. */
  masolatok: number;
  /** Készült-e összefoglaló. */
  osszefoglaloKeszult: boolean;
  /** Olvasta-e már klinikus (ekkor nem tüntethető el nyomtalanul). */
  klinikusOlvasta: boolean;
  /** A klinikus rögzített-e belőle SAJÁT állítást a rekordba. */
  atvettAllitasok: number;
  /** Van-e auditnapló a hozzáférésekről. */
  auditNaplo: boolean;
}

export function visszavonas(k: VisszavonasKeres): VisszavontAllapot {
  const tetelek: VisszavonasTetel[] = [];

  tetelek.push({
    mi: `letöltött dokumentummásolat (${k.masolatok} db)`,
    sors: "torlendo",
    miert:
      "A másolat a mi tárolónkban él, a mi megőrzési óránkkal, és a jogalapja " +
      "szűnt meg. Ez az, ami ténylegesen törlendő.",
  });

  if (k.osszefoglaloKeszult) {
    tetelek.push({
      mi: "az előélet-összefoglaló",
      sors: k.klinikusOlvasta ? "visszavonando" : "torlendo",
      miert: k.klinikusOlvasta
        ? "Klinikus már olvasta, tehát döntés épülhetett rá — nyomtalanul nem " +
          "tüntethető el. VISSZAVONTKÉNT jelenik meg, és új döntéshez nem " +
          "használható."
        : "Senki nem olvasta, a forrása megy — az összefoglaló is.",
    });
  }

  if (k.atvettAllitasok > 0) {
    tetelek.push({
      mi: `a klinikus által ÁTVETT állítások (${k.atvettAllitasok} db)`,
      sors: "megtartando",
      miert:
        "Ezek már nem az összefoglaló állításai, hanem a klinikus SAJÁT " +
        "rögzített megállapításai, saját felelősséggel. Törlésük nem " +
        "adatvédelem, hanem a dokumentáció meghamisítása: az ellátás megtörtént.",
    });
  }

  tetelek.push({
    mi: "a hozzáférések auditnaplója",
    sors: "megtartando",
    miert: k.auditNaplo
      ? "Arról, hogy KI MIKOR MIT nézett meg, éppen a betegnek van joga tudni — " +
        "és a visszavonás után csak ebből bizonyítható, hogy már nem nyúlt " +
        "hozzá senki. Az auditnapló törlése a visszavonás ellentéte."
      : "NINCS AUDITNAPLÓ. A visszavonás így nem is ellenőrizhető: nem lehet " +
        "megmutatni, hogy utána már nem fért hozzá senki.",
  });

  const gepi = k.atvettAllitasok === 0 && !k.klinikusOlvasta && k.auditNaplo;
  return {
    gepilegElvegezheto: gepi,
    tetelek,
    miert: gepi
      ? "A visszavonás gépileg elvégezhető: a másolat törlődik, és nincs " +
        "olvasott vagy átvett származék."
      : "A visszavonás NEM végezhető el egyetlen gombbal. " +
        (k.klinikusOlvasta || k.atvettAllitasok
          ? "Van olyan származék, amit már felhasználtak — azt visszavonni kell, " +
            "nem eltüntetni. "
          : "") +
        (k.auditNaplo ? "" : "És hiányzik az auditnapló, ami nélkül maga a " +
          "visszavonás sem bizonyítható."),
  };
}

/* ── A JELENLEGI KEZELÉS TELJESSÉGE ──────────────────────────────────── */

/**
 * TELJES-E A GYÓGYSZERLISTA — ÉS MIÓTA.
 *
 * A 32. modul interakció-kapuja három állapotot ismer, és ez a függvény tölti
 * fel: `teljesListaval` · `csakElmondasAlapjan` · `nemTudjuk`.
 *
 * ÉS A HARMADIK DIMENZIÓ, AMI KIMARADT VOLNA: AZ IDŐ. Egy három hónapja
 * letöltött EESZT-lista NEM a jelenlegi lista. Teljes volt — akkor. Azóta a
 * beteg kaphatott új gyógyszert bárkitől, és éppen az az új szer az, amivel az
 * interakció fennállna. A rendszer ezért a lista KORÁT is nézi, és a lejárt
 * teljesség nem „majdnem teljes”, hanem `nemTudjuk`: a friss hiány pontosan
 * ott van, ahol a kockázat.
 */
export type ListaForras = "eeszt" | "beteg" | "nincs";

export interface KezelesLista {
  forras: ListaForras;
  /** Mikor készült/töltöttük le. */
  mikor?: string | null;
  /** Van-e érvényes beleegyezés az EESZT-lekéréshez. */
  beleegyezes?: boolean;
}

export type TeljessegAllapot = "teljesListaval" | "csakElmondasAlapjan" | "nemTudjuk";

export interface TeljessegAllas {
  allapot: TeljessegAllapot;
  /** Hány napos a lista. */
  naposKor: number | null;
  miert: string;
}

/** Ennyi nap után a letöltött lista már nem a JELENLEGI kezelés. */
export const LISTA_FRISSESSEG_NAP = 30;

export function kezelesTeljesseg(l: KezelesLista, most: string): TeljessegAllas {
  const kor = l.mikor
    ? Math.floor((Date.parse(most) - Date.parse(l.mikor)) / 86_400_000)
    : null;

  if (l.forras === "nincs") {
    return { allapot: "nemTudjuk", naposKor: null,
      miert:
        "Nincs gyógyszerlista. Az interakció-ellenőrzés eredménye ezért NEM " +
        "„tiszta”, hanem NEM TUDJUK — a beteg más orvosoktól is kap gyógyszert." };
  }
  if (l.forras === "beteg") {
    return { allapot: "csakElmondasAlapjan", naposKor: kor,
      miert:
        "A lista a beteg elmondásából származik, tehát hiányos lehet. Ez ÉRTÉKES " +
        "bemenet — gyakran az egyetlen —, de a hiánya nem bizonyíték: ami nem " +
        "hangzott el, arról nem következik, hogy nincs." };
  }
  if (!l.beleegyezes) {
    return { allapot: "nemTudjuk", naposKor: kor,
      miert:
        "EESZT-listaként van megjelölve, de nincs érvényes beleegyezés a " +
        "lekérésre. Beleegyezés nélkül nincs lista — és a jelölés önmagában nem " +
        "pótolja." };
  }
  if (kor === null) {
    return { allapot: "nemTudjuk", naposKor: null,
      miert:
        "A lista letöltésének ideje nem ismert. Egy teljes lista, aminek nem " +
        "tudjuk a korát, nem a JELENLEGI kezelés — csak egy pillanatkép " +
        "ismeretlen időpontból." };
  }
  if (kor > LISTA_FRISSESSEG_NAP) {
    return { allapot: "nemTudjuk", naposKor: kor,
      miert:
        `A lista ${kor} napos (a frissességi határ ${LISTA_FRISSESSEG_NAP} nap). ` +
        "TELJES VOLT — AKKOR. Azóta a beteg kaphatott új gyógyszert bárkitől, és " +
        "éppen az az új szer az, amivel az interakció fennállna: a friss hiány " +
        "pontosan ott van, ahol a kockázat." };
  }
  return { allapot: "teljesListaval", naposKor: kor,
    miert: `Teljes EESZT-lista, ${kor} napos, érvényes beleegyezéssel.` };
}

export function validateProfil(reg: Registry): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const maradek = maradekAllergiaMezok(reg);
  if (maradek.length) {
    out.push({
      severity: "error", id: "profil.allergia",
      message:
        `Az allergia még ${maradek.length} külön változóban él az entitáson kívül ` +
        `(${maradek.join(", ")}), nézetkapcsolat nélkül. Aki az egyiket kitölti, ` +
        `nem tudja, hogy a másik réteg a másikat nézi — ugyanaz a duplikátum-hiba, ` +
        `mint a Bishop-score-nál és a magzatvíz-mezőnél, csak itt a tét halálos. ` +
        `Az egyetlen entitás az \`allergy.list\`; a felváltott mezők állapota ` +
        `legyen \`superseded\`, a más kérdést feltevőké pedig szerepeljen a ` +
        `\`MAS_KERDES\` listán, indoklással.`,
    });
  }
  /*
   * AMI CSAK A NEVÉBEN ALLERGIA. Nem hiba, de nem is elhallgatható: a
   * `diet.allergies.food` az ételallergia FAJTÁIT részletezi, a WHO-sor pedig
   * azt rögzíti, hogy EGYEZTETTÉK-e. Ha ez a megkülönböztetés eltűnik, a
   * következő olvasó duplikátumnak veszi őket, és összevonja — vagy ami
   * rosszabb, az egyiket törli.
   */
  for (const id of masKerdesuMezok(reg)) {
    out.push({ severity: "warning", id: `profil.allergia.${id}`,
      message: `A(z) \`${id}\` csak a nevében allergiamező. ${MAS_KERDES[id]}` });
  }
  return out;
}

export interface ProfilMerleg {
  /** Az entitás mezői. */
  entitas: number;
  /** Az entitáson kívüli allergiamezők, amik UGYANARRA a kérdésre válaszolnak. */
  maradek: number;
  /** Amik csak a nevükben allergiamezők — megnevezve, nem elhallgatva. */
  masKerdes: number;
  egyesitve: boolean;
}

export function merleg(reg: Registry): ProfilMerleg {
  const maradek = maradekAllergiaMezok(reg);
  return {
    entitas: ALLERGIA_ENTITAS.filter((id) => reg.get(id)).length,
    maradek: maradek.length,
    masKerdes: masKerdesuMezok(reg).length,
    egyesitve: maradek.length === 0,
  };
}
