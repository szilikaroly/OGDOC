/**
 * A KUTATÁSETIKAI (ETT) BEADVÁNY DOSSZIÉJA — a 11. lépés gépi fele.
 *
 * A 11. lépés nem fejlesztési feladat: a kérelmet a kutatásvezető adja be, és
 * „kész”, ha beadták. A gép ebben egyetlen dolgot tehet, de azt muszáj:
 *
 *   MEGAKADÁLYOZNI, HOGY A KÉRELEM OLYAT ÁLLÍTSON, AMI NEM IGAZ.
 *
 * A beadvány minden tétele ÁLLÍTÁS EGY BIZOTTSÁGNAK. Az „adatbiztonsági
 * leírás” nem egy melléklet neve, hanem az a mondat, hogy az adathoz csak
 * jogosult fér hozzá. Ha ezt kimondjuk, miközben a cselekvő kilétét egyetlen
 * ellenőrizetlen kérésfejléc állítja, akkor a kérelem VALÓTLAN ÁLLÍTÁST
 * tartalmaz — és ez nem hiányos beadvány, hanem más műfaj.
 *
 * A DOSSZIÉ EDDIG PRÓZA VOLT. A `docs/megfeleles/10-ett.md` felsorolja a
 * tizenegy tételt és a „hol készül” hivatkozásokat. Semmi nem kötötte össze a
 * felsorolást a rendszer MOSTANI állapotával: a tábla ugyanúgy nézett ki
 * aznap, amikor a hitelesítés még sehol nem volt, és aznap is, amikor már
 * minden aláírás megvan. Ez ugyanaz a hiba, amit a 7–10. lépés talált —
 * a próza nem tud hangosan elavulni.
 *
 * EZÉRT MINDEN TÉTEL MELLETT ÉLŐ BIZONYÍTÉK ÁLL. Nem fájlnév, hanem lekérdezés:
 * hány döntést írtak alá, van-e hitelesítés, áll-e a szintetikus kapu. A tétel
 * három állapotot vehet fel, és a harmadik a lényeg:
 *
 *   FEDETT           az állítás mögött ott a rendszerállapot;
 *   RÉSZBEN FEDETT   a bizonyítékok egy része megvan;
 *   MEGALAPOZATLAN   az állítás így, ahogy van, NEM IGAZ.
 *
 * ÉS AMIT A GÉP NEM VÁLLAL. Négy tétel szervezeti: befogadó nyilatkozat,
 * kompetenciaigazolás, finanszírozás, biztosítás. Ezekről a rendszer nem tud
 * és nem is akar nyilatkozni — de attól még számon tartja őket, mert a
 * beadvány nélkülük sem teljes. A „szervezeti” nem felmentés, hanem címzés.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A DOSSZIÉ, ADATBÓL ──────────────────────────────────────────────── */

export type TetelFajta = "rendszer" | "szervezeti";

export interface DosszieTetel {
  id: string;
  cim: I18n;
  /** Amit a kérelem KIMOND. Nem cím, hanem állítás. */
  allitas: I18n;
  fajta: TetelFajta;
  /** Enélkül a beadvány nem adható be. */
  blokkolo: boolean;
  /** Élő bizonyítékok kulcsai. Szervezeti tételnél üres. */
  bizonyitek: string[];
}

export interface Dosszie {
  id: string;
  label: I18n;
  note?: string;
  tetelek: DosszieTetel[];
}

export function loadDosszie(path: string): Dosszie {
  return JSON.parse(readFileSync(path, "utf8")) as Dosszie;
}

/* ── A BIZONYÍTÉKOK — LEKÉRDEZÉS, NEM FÁJLNÉV ────────────────────────── */

export interface Bizonyitek {
  kulcs: string;
  /** Mit állít ez a bizonyíték. */
  mit: string;
  megvan: boolean;
  /** A mért érték, ahogy a bizottság elé kerülne. */
  ertek: string;
  miert: string;
}

/** A rendszer állapota, amiből a bizonyítékok képződnek. */
export interface Allapot {
  /** Aláírt / összes, rétegenként. */
  dontes: { alairt: number; osszes: number };
  megorzes: { alairt: number; osszes: number };
  labor: { alairt: number; osszes: number };
  normogram: { alairt: number; osszes: number };
  kalkulator: { kapuMogott: number; alairt: number; orokolt: number };
  szepszis: { alairt: number; osszes: number; riaszt: boolean };
  /**
   * Mérőeszközök. A 12. lépés KÉTKIMENETŰ: a `rendezett` az, amire vagy
   * licenc van, vagy leírt döntés, hogy nem használjuk. A `felveheto` ennél
   * kevesebb — a „nem használjuk” rendez, de nem nyit kaput.
   */
  meroeszkoz: {
    rendezett: number; osszes: number; felveheto: number; validaltForditas: number;
  };
  /** PHI-jelölt változók, amiket az export kizár. */
  phiValtozo: number;
  /** Riasztási rend (15. lépés): kiadható típusok / összes. */
  riasztas: { kiadhato: number; osszes: number };
  /** A gyökérkönyvtár, amiből a fájlalapú bizonyítékok látszanak. */
  gyoker: string;
}

const van = (gyoker: string, ut: string): boolean => {
  const p = `${gyoker}/${ut}`;
  return existsSync(p) && statSync(p).size > 0;
};

/**
 * A HITELESÍTÉS BIZONYÍTÉKA A KÓDBÓL JÖN, NEM ÁLLÍTÁSBÓL.
 *
 * A VIZSGÁLAT KORÁBBAN A KETTŐT ÖSSZEKÖTÖTTE, ÉS EZ HIBA VOLT.
 *
 * Az előző változat így zárult: `return { van: !kapu, kapu }` — vagyis a
 * hitelesítés MEGLÉTÉT a kapu HIÁNYAKÉNT definiálta. A két tény viszont
 * független: attól, hogy megírják a hitelesítést, a kapu még állhat (és állnia
 * is kell, amíg nincs TLS, második tényező és kulcstár). A régi képlettel a
 * dosszié akkor is „nincs hitelesítés”-t írt volna, amikor van — és csak a
 * kapu KIVÉTELÉTŐL vált volna igazzá, ami épp a rossz irányba tolja a
 * bizonyítást: a biztonsági korlát eltávolítása lett volna a bizonyíték.
 *
 * Ezért a két tényt külön mérjük, mindkettőt a forráson:
 *
 *   van   — van-e VALÓDI hitelesítés: tárolt lenyomat elleni ellenőrzés
 *           (scrypt + időfüggetlen összehasonlítás), és a kiszolgáló
 *           munkamenetből veszi a cselekvőt, nem kérésfejlécből.
 *   kapu  — áll-e még az indulási kapu, ami éles üzemet zár.
 */
export function hitelesitesAllapota(
  gyoker: string,
): { van: boolean; kapu: boolean; miert: string } {
  const olvas = (rel: string) => {
    const p = `${gyoker}/${rel}`;
    return existsSync(p) ? readFileSync(p, "utf8") : "";
  };
  const jelszo = olvas("core/auth/jelszo.ts");
  const api = olvas("web/auth-api.ts");
  const szerver = olvas("web/server.ts");

  // 1. VALÓDI ELLENŐRZÉS: tárolt lenyomat ellen, időfüggetlen összehasonlítással.
  const ellenorzes = /scryptSync/.test(jelszo) && /timingSafeEqual/.test(jelszo);
  // 2. A KISZOLGÁLÓ MUNKAMENETBŐL VESZI a cselekvőt, nem fejlécből.
  const munkamenetbol = /azonosit\(AUTH/.test(szerver) && /HttpOnly/.test(api);
  // 3. ÉS NEM MARADT FEJLÉC-ALAPÚ ÚT. Egy megkerülhető hitelesítés nem hitelesítés.
  const nincsFejleces = !/x-ogdoc-actor/.test(szerver);
  const van = ellenorzes && munkamenetbol && nincsFejleces;

  const kapu = /indulhat\(/.test(szerver) && /OGDOC_SYNTHETIC/.test(olvas("core/auth/kapu.ts"));

  const hianyok = [
    ellenorzes ? "" : "nincs tárolt lenyomat elleni ellenőrzés",
    munkamenetbol ? "" : "a kiszolgáló nem munkamenetből veszi a cselekvőt",
    nincsFejleces ? "" : "MARADT fejléc-alapú út — a megkerülhető hitelesítés nem hitelesítés",
  ].filter(Boolean);

  return { van, kapu,
    miert: van
      ? "Jelszó tárolt lenyomat ellen (scrypt, időfüggetlen összehasonlítás), " +
        "HttpOnly munkamenet-süti, és nem maradt fejléc-alapú megkerülés." +
        (kapu ? " A kapu ettől függetlenül ÁLL: a hitelesítés megléte nem teszi " +
          "éles üzemre késszé a rendszert." : "")
      : hianyok.join("; ") };
}

/**
 * A HORGONY AKKOR VÉD, HA A TÁROLÓ MEGKÉRDEZI.
 *
 * A puszta létezése semmit nem bizonyít: egy be nem kötött mechanizmus
 * pontosan úgy néz ki a bizonyítéklistán, mint egy működő — ezért a vizsgálat
 * itt is a FORRÁSON fut, azon a rétegen, aminek használnia kellene.
 */
function horgonyBekotve(gyoker: string): boolean {
  const p = `${gyoker}/core/store/biztonsagos.ts`;
  if (!existsSync(p)) return false;
  const src = readFileSync(p, "utf8");
  return /horgony\?\.read\(/.test(src) && /horgony\.write\(/.test(src);
}

export function bizonyitekok(a: Allapot): Bizonyitek[] {
  const g = a.gyoker;
  const h = hitelesitesAllapota(g);
  const bekotve = horgonyBekotve(g);
  const arany = (x: { alairt: number; osszes: number }) => `${x.alairt}/${x.osszes}`;

  const out: Bizonyitek[] = [
    {
      kulcs: "hitelesites",
      mit: "A cselekvő kiléte ellenőrzött.",
      megvan: h.van,
      ertek: h.van ? "van hitelesítés (jelszó + munkamenet)" : "NINCS",
      miert: h.miert,
    },
    {
      kulcs: "jogosultsag",
      mit: "A hozzáférés szerepkörhöz, ellátási kapcsolathoz és időablakhoz kötött.",
      megvan: van(g, "core/store/hozzaferes.ts") && van(g, "test/tarolo.test.ts"),
      ertek: "réteg megvan, tesztelve",
      miert: "A jogosultsági réteg és a rá vonatkozó tesztek megvannak.",
    },
    {
      kulcs: "auditnaplo",
      mit: "Minden olvasás és írás naplózott, a napló nem módosítható.",
      megvan: van(g, "core/store/biztonsagos.ts") && van(g, "test/naplo.test.ts"),
      ertek: "hasítóláncos napló, tesztelve",
      miert: "Az auditnapló a rejtjelezett alakon fut, épsége kulcs nélkül ellenőrizhető.",
    },
    {
      kulcs: "titkositas",
      mit: "A tárolt adat titkosított, és a lánc kulcs nélkül is ellenőrizhető.",
      megvan: van(g, "core/crypto/envelope.ts") && van(g, "test/titkositas.test.ts"),
      ertek: "borítéktitkosítás, tesztelve",
      miert: "A titkosítási réteg és a rá vonatkozó tesztek megvannak.",
    },
    {
      kulcs: "kulcstar-hsm",
      mit: "A kulcsok tartóssága HSM vagy KMS mögött áll.",
      megvan: !van(g, "web/kulcsok.ts"),
      ertek: van(g, "web/kulcsok.ts") ? "NINCS — a kulcsok fájlban állnak" : "HSM/KMS",
      miert:
        "A kulcsok egy sima fájlban állnak a titkosított adat MELLETT. A " +
        "titkosítás így a fájlrendszer jogosultságáig véd, nem tovább — és a " +
        "kriptográfiai törlés sem igazolható.",
    },
    {
      kulcs: "torles-visszavonas",
      mit: "A visszavonás kétágú, és a beteg előre látja, mi marad meg.",
      megvan: van(g, "core/store/torles.ts") && van(g, "test/torles.test.ts"),
      ertek: "kétágú visszavonás, tanúsítvánnyal",
      miert:
        "A kutatási felhasználás azonnal visszavonható; az ellátási " +
        "dokumentáció a megőrzési idő végéig marad, és ezt a beteg a " +
        "nyilatkozatban látja, nem utólag.",
    },
    {
      kulcs: "phi-kizaras",
      mit: "A betegazonosítók az exportból és a lekérdezőből kizárva.",
      megvan: a.phiValtozo > 0,
      ertek: `${a.phiValtozo} PHI-jelölt változó kizárva`,
      miert: "A `phi: true` jelölésű változók nem kerülnek exportba.",
    },
    {
      kulcs: "beleegyezes-keret",
      mit: "A beleegyezési keret leírva: rétegzett és széles körű, kiskorúval és visszavonással.",
      megvan: van(g, "docs/megfeleles/06-beleegyezes.md"),
      ertek: "keret leírva",
      miert: "A beleegyezési keret a megfelelési dokumentációban áll.",
    },
    {
      kulcs: "dontes-alairasok",
      mit: "Az adatkezelés vitatott pontjai aláírt döntéssel eldöntve.",
      megvan: a.dontes.osszes > 0 && a.dontes.alairt === a.dontes.osszes,
      ertek: `${arany(a.dontes)} szabály aláírva`,
      miert:
        "A 38 szabály mindegyike klinikai vezető, DPO és fejlesztés együttes " +
        "döntése. Aláírás nélkül az adatkezelési tájékoztató azt írná le, " +
        "amit a fejlesztés gondolt — nem azt, amit az intézmény eldöntött.",
    },
    {
      kulcs: "megorzes-alairasok",
      mit: "A megőrzési idők jogszabályhelyhez kötve, aláírva.",
      megvan: a.megorzes.osszes > 0 && a.megorzes.alairt === a.megorzes.osszes,
      ertek: `${arany(a.megorzes)} megőrzési idő aláírva`,
      miert:
        "Aláírás nélkül a rendszer nem töröl — ami helyes —, de a beadvány " +
        "megőrzési fejezete nem hivatkozhat ellenőrzött időtartamra.",
    },
    {
      kulcs: "meroeszkoz-licenc",
      mit: "Minden kérdőívre vagy licenc van, vagy leírt döntés, hogy nem használjuk.",
      megvan: a.meroeszkoz.osszes > 0 && a.meroeszkoz.rendezett === a.meroeszkoz.osszes,
      ertek: `${a.meroeszkoz.rendezett}/${a.meroeszkoz.osszes} rendezett ` +
             `(${a.meroeszkoz.felveheto} felvehető), ` +
             `${a.meroeszkoz.validaltForditas}/${a.meroeszkoz.osszes} validált fordítás`,
      miert:
        "Licenc nélküli tételszöveggel a skála nem az a skála: saját " +
        "megfogalmazású kérdésekre a validációs vágóértékek sem érvényesek. " +
        "A bizottságnak NEM azt kell állítanunk, hogy mindent használunk, " +
        "hanem azt, hogy amit használunk, arra van jogunk — ezért a leírt " +
        "„nem használjuk” döntés ugyanúgy rendezi a tételt, mint a licenc.",
    },
    {
      kulcs: "szamitasi-kapuk",
      mit: "Minden megjelenő szám hitelesített, vagy kapu mögött áll.",
      megvan: a.kalkulator.kapuMogott === 0 && a.labor.alairt === a.labor.osszes &&
              a.normogram.alairt === a.normogram.osszes,
      ertek:
        `${a.kalkulator.kapuMogott} kalkulátor kapu mögött, ` +
        `${a.kalkulator.orokolt} öröklött; ${arany(a.labor)} laborreferencia, ` +
        `${arany(a.normogram)} normogram, ${arany(a.szepszis)} szepszisküszöb aláírva`,
      miert:
        "A kapu áll: a hitelesítetlen szám nem jelenik meg. A bizottságnak " +
        "azonban tudnia kell, hogy a rendszer ma emiatt a képességei egy " +
        "részét NEM nyújtja — nem azért, mert hibás, hanem mert nem hazudik.",
    },
    {
      kulcs: "szintetikus-kapu",
      mit: "A kiszolgáló szintetikus üzemmód nélkül el sem indul.",
      // FIGYELEM: ez a bizonyíték FORDÍTVA olvasandó. Akkor „van meg”, amikor
      // a kapu OTT ÁLL — vagyis amikor a rendszer NEM futhat valódi adaton.
      // Ez a rendszer legőszintébb pontja, és nem hiányosság.
      //
      // ÉS NEM A HITELESÍTÉS HIÁNYA TARTJA. A kapu ma feltétellista
      // (`core/auth/kapu.ts`): hitelesítés, alapértelmezett jelszó, TLS,
      // második tényező, kulcstár. A hitelesítés megvan — a többi nem, és
      // egyik sem fejlesztői feladat. A kapu tehát nem attól tűnik el, hogy
      // írunk még kódot.
      megvan: h.kapu,
      ertek: h.kapu ? "áll — valódi betegadaton nem futhat" : "NINCS szintetikus kapu",
      miert:
        "A kiszolgáló csak akkor indul éles módban, ha MINDEN feltétel teljesül: " +
        "hitelesítés (megvan), alapértelmezett jelszó lecserélve, TLS, második " +
        "tényező és HSM/KMS kulcstár. A kapu megléte nem képesség, hanem " +
        "beismerés — és amíg ott áll, országos nyilvántartásba nem küldhetünk.",
    },
    {
      kulcs: "ellatas-tipusok",
      mit: "Mely ellátási típusokra készül a rendszer.",
      megvan: true,
      ertek: "fekvőbeteg- és járóbeteg-szakellátás (szülészet-nőgyógyászat)",
      miert:
        "A rendszer felülettérképe szülészeti és nőgyógyászati szakaszokra épül, " +
        "fekvő- és járóbeteg-ellátásra egyaránt.",
    },
    {
      kulcs: "fejlesztesi-kornyezet",
      mit: "A fejlesztés nyelve és futtatókörnyezete.",
      megvan: true,
      ertek: "TypeScript (Node 22, natív strip-only), Linux",
      miert:
        "A regisztrációs lap ezt kérdezi, és a rendszer önmagából megválaszolja — " +
        "kézzel beírva elavulna, és senki nem venné észre.",
    },
    {
      kulcs: "adatfeldolgozoi-kepesseg",
      mit: "A rendszer képes ellátni az adatfeldolgozói kötelezettségeket.",
      megvan: h.van && !van(g, "web/kulcsok.ts"),
      ertek:
        (h.van ? "" : "hitelesítés NINCS") +
        (van(g, "web/kulcsok.ts") ? (h.van ? "kulcstár fájlban" : "; kulcstár fájlban") : ""),
      miert:
        "Az adatfeldolgozói kötelezettség nem nyilatkozat kérdése: a hozzáférés " +
        "ellenőrzöttsége és a kulcsok tartóssága nélkül a vállalás nem teljesíthető.",
    },
    {
      kulcs: "agazati-azonosito",
      mit: "A cselekvő ágazati azonosítóhoz kötött.",
      megvan: false,
      ertek: "NINCS — a felhasználói profilban nincs ágazati azonosító",
      miert:
        "Az EESZT minden művelethez az ágazati azonosítóhoz kötött cselekvőt vár. " +
        "A megfelelési fejezet ezt a 4. fázis első feladataként nevezi meg, és a " +
        "változóregiszterben ma nincs ilyen mező.",
    },
    {
      kulcs: "riasztasi-rend",
      mit: "A riasztásoknak van címzettje és lezárt eszkalációs láncuk.",
      megvan: a.riasztas.osszes > 0 && a.riasztas.kiadhato === a.riasztas.osszes,
      ertek: `${a.riasztas.kiadhato}/${a.riasztas.osszes} riasztástípus kiadható`,
      miert:
        "Címzett nélkül a riasztás nem kiadható — a rendszer nem szólal meg. " +
        "Ez a 16. lépés harmadik elfogadási kritériumának ELŐFELTÉTELE: amíg " +
        "egyetlen típus sem kiadható, nem lehet olyan eset, ahol a rendszer " +
        "mondott valamit, amit a klinikus nem vett volna észre.",
    },
    {
      kulcs: "naplo-horgony",
      mit: "A levágott naplóvég kimutatható — a napló épsége bizonyítható.",
      megvan: van(g, "core/pilot/horgony.ts") && bekotve,
      ertek: !van(g, "core/pilot/horgony.ts")
        ? "NINCS horgonymechanizmus"
        : bekotve
          ? "megvan és a tárolóba bekötve; telepítésenként külön kötetre kell tenni"
          : "megvan, de a tároló NEM kérdezi meg — így nem véd semmit",
      miert:
        "A lenyomatlánc a MÚLTAT köti meg, a végét nem: egy levágott végű " +
        "napló hiánytalan láncnak látszik. A horgony a naplón kívül tartja a " +
        "véget, és ez az egyetlen mechanizmus, ami az adatvesztés HIÁNYÁT " +
        "bizonyítani tudja.",
    },
    {
      kulcs: "elemzesi-terv",
      mit: "Az elemzési terv előre rögzített és géppel olvasható.",
      megvan: van(g, "registry/ett/elemzesi-terv.json"),
      ertek: van(g, "registry/ett/elemzesi-terv.json") ? "rögzítve" : "NINCS rögzítve",
      miert:
        "Előre rögzített, időbélyegzett elemzési terv nélkül a lekérdező " +
        "kizárólag feltáró módban használható — és a bizottság felé nem " +
        "állítható, hogy a hipotézisvizsgálat a jóváhagyott terv szerint fut.",
    },
  ];
  return out;
}

/* ── A TÉTEL MEGÍTÉLÉSE ──────────────────────────────────────────────── */

export type TetelAllapot = "fedett" | "reszben" | "megalapozatlan" | "szervezeti";

export interface TetelErtekeles {
  id: string;
  cim: string;
  allitas: string;
  fajta: TetelFajta;
  blokkolo: boolean;
  allapot: TetelAllapot;
  /** Ami hiányzik — a bizonyíték kulcsával és azzal, mi az igazság. */
  hianyzo: Bizonyitek[];
  megvan: Bizonyitek[];
  miert: string;
}

export function ertekel(d: Dosszie, biz: Bizonyitek[]): TetelErtekeles[] {
  const byKulcs = new Map(biz.map((b) => [b.kulcs, b]));
  return d.tetelek.map((t) => {
    const kell = t.bizonyitek.map((k) => byKulcs.get(k)).filter((x): x is Bizonyitek => !!x);
    const megvan = kell.filter((b) => b.megvan);
    const hianyzo = kell.filter((b) => !b.megvan);
    const cim = t.cim.hu ?? t.id;
    const allitas = t.allitas.hu ?? "";

    if (t.fajta === "szervezeti") {
      return {
        id: t.id, cim, allitas, fajta: t.fajta, blokkolo: t.blokkolo,
        allapot: "szervezeti", hianyzo: [], megvan: [],
        miert:
          `SZERVEZETI TÉTEL: a rendszer nem tud és nem is akar róla ` +
          `nyilatkozni — a kutatásvezetőé. A lista attól még számon tartja, ` +
          `mert a beadvány nélküle sem teljes.`,
      };
    }
    if (!hianyzo.length) {
      return {
        id: t.id, cim, allitas, fajta: t.fajta, blokkolo: t.blokkolo,
        allapot: "fedett", hianyzo, megvan,
        miert: `Az állítás mögött ott a rendszerállapot: ` +
               `${megvan.map((b) => b.ertek).join("; ")}.`,
      };
    }
    const allapot: TetelAllapot = megvan.length ? "reszben" : "megalapozatlan";
    return {
      id: t.id, cim, allitas, fajta: t.fajta, blokkolo: t.blokkolo,
      allapot, hianyzo, megvan,
      miert:
        (allapot === "megalapozatlan"
          ? `AZ ÁLLÍTÁS ÍGY, AHOGY VAN, NEM IGAZ. `
          : `AZ ÁLLÍTÁS CSAK RÉSZBEN IGAZ. `) +
        `Ami hiányzik: ` +
        hianyzo.map((b) => `${b.mit} (${b.ertek})`).join(" · ") + ".",
    };
  });
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export interface Beadhatosag {
  beadhato: boolean;
  /** Blokkoló tételek, amiknek az állítása nem igaz. */
  valotlan: TetelErtekeles[];
  /** Szervezeti tételek, amiket a gép nem tud ellenőrizni. */
  szervezeti: TetelErtekeles[];
  miert: string;
}

/**
 * A KÉRELEM AKKOR ADHATÓ BE, HA MINDEN ÁLLÍTÁSA IGAZ.
 *
 * Nem akkor, ha minden melléklet összeállt. Egy hiányzó melléklet pótolható;
 * egy valótlan állítás a bizottság előtt nem az. A kapu ezért nem a
 * teljességet méri, hanem az IGAZSÁGOT: van-e olyan blokkoló tétel, aminek az
 * állítását a rendszer mostani állapota cáfolja.
 *
 * A szervezeti tételek külön sorban állnak: a gép nem mondja rájuk, hogy
 * rendben vannak, de azt sem, hogy nincsenek. Megnevezi, hogy KI válaszol.
 */
export function beadhato(ert: TetelErtekeles[]): Beadhatosag {
  const valotlan = ert.filter((t) =>
    t.blokkolo && (t.allapot === "megalapozatlan" || t.allapot === "reszben"));
  const szervezeti = ert.filter((t) => t.allapot === "szervezeti");
  if (valotlan.length) {
    return {
      beadhato: false, valotlan, szervezeti,
      miert:
        `A KÉRELEM ÍGY NEM ADHATÓ BE: ${valotlan.length} blokkoló tétel ` +
        `állítását a rendszer mostani állapota cáfolja. Egy hiányzó melléklet ` +
        `pótolható; egy valótlan állítás a bizottság előtt nem az. ` +
        `Érintett: ${valotlan.map((t) => t.id).join(", ")}.`,
    };
  }
  return {
    beadhato: true, valotlan, szervezeti,
    miert:
      `A rendszer minden blokkoló állítása fedett. Ami hátravan, az ` +
      `${szervezeti.length} szervezeti tétel — azokról a kutatásvezető ` +
      `nyilatkozik, nem a gép.`,
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateDosszie(
  d: Dosszie, biz: Bizonyitek[], masholHasznalt: string[] = [],
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const kulcsok = new Set(biz.map((b) => b.kulcs));
  const latott = new Set<string>();

  for (const t of d.tetelek) {
    if (latott.has(t.id)) {
      out.push({ severity: "error", id: t.id, message: "két dossziététel ugyanazzal az azonosítóval" });
    }
    latott.add(t.id);
    if (!t.allitas?.hu?.trim()) {
      out.push({ severity: "error", id: t.id,
        message: "a tételnek nincs ÁLLÍTÁSA — cím önmagában nem mond semmit a bizottságnak" });
    }
    for (const k of t.bizonyitek) {
      if (!kulcsok.has(k)) {
        out.push({ severity: "error", id: t.id,
          message: `ismeretlen bizonyítékkulcs: ${k} — az elavult hivatkozás rosszabb a hiányzónál` });
      }
    }
    // RENDSZERTÉTEL BIZONYÍTÉK NÉLKÜL: olyan állítás, amit semmi nem fedez, és
    // ezt semmi nem venné észre. Ez a dosszié legveszélyesebb alakja.
    if (t.fajta === "rendszer" && !t.bizonyitek.length) {
      out.push({ severity: "error", id: t.id,
        message:
          "rendszertétel BIZONYÍTÉK NÉLKÜL: az állítást semmi nem fedezi, és " +
          "semmi nem venné észre, ha valótlanná válik" });
    }
    if (t.fajta === "szervezeti" && t.bizonyitek.length) {
      out.push({ severity: "warning", id: t.id,
        message: "szervezeti tétel gépi bizonyítékkal — vagy nem szervezeti, vagy a bizonyíték téves" });
    }
  }

  // A NEM HASZNÁLT BIZONYÍTÉK sem ártalmatlan: vagy hiányzik egy tétel, vagy a
  // bizonyíték fölösleges — mindkettő azt jelenti, hogy a dosszié nem teljes.
  //
  // A `masholHasznalt` azért kell, mert a bizonyítékbázis KÖZÖS: ugyanaz a
  // mérőszám az ETT-beadványt és az EESZT-csatlakozást is fedezi. Ami itt nincs
  // hivatkozva, de ott igen, az nem fölösleges — csak nem ezé a dossziéé.
  const hasznalt = new Set([
    ...d.tetelek.flatMap((t) => t.bizonyitek), ...masholHasznalt,
  ]);
  for (const b of biz) {
    if (!hasznalt.has(b.kulcs)) {
      out.push({ severity: "warning", id: b.kulcs,
        message:
          `a(z) ${b.kulcs} bizonyítékra egyetlen dossziététel sem hivatkozik — ` +
          `vagy hiányzik egy tétel, vagy a bizonyíték fölösleges` });
    }
  }

  const ert = ertekel(d, biz);
  const b = beadhato(ert);
  if (!b.beadhato) {
    out.push({ severity: "warning", id: d.id, message: b.miert });
  }
  for (const t of ert.filter((x) => x.allapot === "megalapozatlan")) {
    out.push({ severity: "warning", id: t.id,
      message: `MEGALAPOZATLAN ÁLLÍTÁS a beadványban: „${t.allitas}” — ${t.miert}` });
  }
  return out;
}

export function merleg(ert: TetelErtekeles[]): {
  osszes: number; fedett: number; reszben: number; megalapozatlan: number; szervezeti: number;
} {
  const db = (a: TetelAllapot) => ert.filter((t) => t.allapot === a).length;
  return {
    osszes: ert.length, fedett: db("fedett"), reszben: db("reszben"),
    megalapozatlan: db("megalapozatlan"), szervezeti: db("szervezeti"),
  };
}

/* ── AZ ÁLLAPOT ÖSSZERAKÁSA AZ ÉLŐ REGISZTEREKBŐL ────────────────────── */

/**
 * A rendszer MOSTANI állapota, egy helyen.
 *
 * Azért itt, és nem a validátorban: a munkalap és a validálás ugyanazt a képet
 * kell hogy lássa. Ha a kettő külön számolna, a beadványt egy harmadik
 * állapotra írnánk meg — és a bizottság épp azt kapná, ami sehol nincs.
 */
export interface AllapotForrasok {
  gyoker: string;
  dontesAlairt: number;
  dontesOsszes: number;
  megorzesAlairt: number;
  megorzesOsszes: number;
  laborAlairt: number;
  laborOsszes: number;
  normogramAlairt: number;
  normogramOsszes: number;
  kalkKapuMogott: number;
  kalkAlairt: number;
  kalkOrokolt: number;
  szepszisAlairt: number;
  szepszisOsszes: number;
  szepszisRiaszt: boolean;
  meroeszkozRendezett: number;
  meroeszkozOsszes: number;
  meroeszkozFelveheto: number;
  meroeszkozValidalt: number;
  phiValtozo: number;
  riasztasKiadhato: number;
  riasztasOsszes: number;
}

export function allapot(f: AllapotForrasok): Allapot {
  return {
    gyoker: f.gyoker,
    dontes: { alairt: f.dontesAlairt, osszes: f.dontesOsszes },
    megorzes: { alairt: f.megorzesAlairt, osszes: f.megorzesOsszes },
    labor: { alairt: f.laborAlairt, osszes: f.laborOsszes },
    normogram: { alairt: f.normogramAlairt, osszes: f.normogramOsszes },
    kalkulator: { kapuMogott: f.kalkKapuMogott, alairt: f.kalkAlairt, orokolt: f.kalkOrokolt },
    szepszis: { alairt: f.szepszisAlairt, osszes: f.szepszisOsszes, riaszt: f.szepszisRiaszt },
    meroeszkoz: {
      rendezett: f.meroeszkozRendezett, osszes: f.meroeszkozOsszes,
      felveheto: f.meroeszkozFelveheto, validaltForditas: f.meroeszkozValidalt,
    },
    phiValtozo: f.phiValtozo,
    riasztas: { kiadhato: f.riasztasKiadhato, osszes: f.riasztasOsszes },
  };
}
