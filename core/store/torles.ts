/**
 * TÖRLÉS ÉS VISSZAVONÁS — az adatvédelmi tisztviselő két különböző műveletet.
 *
 * Ez a réteg azt a kérdést válaszolja meg, amit a legtöbb rendszer rosszul tesz
 * fel. Nem az a kérdés, hogy „hogyan töröljünk”, hanem hogy **szabad-e**, és ha
 * nem, akkor mi az, ami a beteg kérésére mégis megtehető.
 *
 * A LEGGYAKORIBB TÉVEDÉS, MINDKÉT IRÁNYBAN
 *
 * Egyik oldalon a rendszer kérésre töröl, és ezzel jogszabályt sért: az
 * egészségügyi dokumentációt a megőrzési idő végéig meg KELL őrizni, és a
 * GDPR 17. cikk (3) bekezdése ezt kifejezetten kiveszi a törléshez való jog
 * alól. A másikon a rendszer semmit nem töröl és semmit nem magyaráz, mire a
 * beteg jogosan érzi úgy, hogy az adatai fölött senkinek nincs hatalma.
 *
 * A HELYES VÁLASZ KÉTÁGÚ, ÉS EZT A BETEGNEK ELŐRE LÁTNIA KELL:
 *
 *   · a KUTATÁSI felhasználás bármikor visszavonható, azonnali hatállyal;
 *   · az ELLÁTÁSI dokumentáció marad, a megőrzési idő végéig.
 *
 * KÉTFÉLE TÖRLÉS, ÉS A KÜLÖNBSÉG LÉNYEGI
 *
 *   KRIPTOGRÁFIAI  A kulcs semmisül meg, a napló marad. A TÉNY — hogy volt
 *                  eset, mikor írták, ki írta — ellenőrizhető marad; a
 *                  TARTALOM soha többé nem nyílik fel. Ez az alapértelmezés.
 *   FIZIKAI        Az archívum sorai tűnnek el. Ez MEGTÖRI A LÁNCOT, és a
 *                  lánc megtörése az auditálhatóság vége: onnantól nem
 *                  bizonyítható, hogy a maradék hiteles. Csak kimondott,
 *                  külön indokolt esetben.
 *
 * A TÖRLÉS BIZONYÍTÉKA. Egy törlés, amiről nem marad tanúsítvány, két hónap
 * múlva megkülönböztethetetlen az adatvesztéstől. A művelet ezért mindig
 * tanúsítványt ad: mit, mikor, ki rendelte el, milyen jogalapon — és hogyan
 * ellenőrizhető.
 */
import type { DocumentRegistry } from "../docs/registry.ts";
import { deletable } from "../docs/registry.ts";
import type { Horgonyok } from "../docs/megorzes.ts";
import { igazolasEllenorzes } from "../docs/megorzes.ts";

export type TorlesFajta = "kriptografiai" | "fizikai";

export interface Alairo {
  nev: string;
  szerep: "dpo" | "clinician" | "jogi";
  at: string;
}

/**
 * A TÖRLÉSI RENDELKEZÉS — amit alá kell írni, mielőtt bármi történik.
 *
 * A `jogalap` nem szabad szöveges díszítés: a törlésnek megnevezett jogi
 * alapja van, és a tanúsítványba is ez kerül. Egy „a beteg kérte” önmagában
 * nem jogalap — a kérés kiváltó ok, a jogalap az, ami alapján teljesíthető.
 */
export interface TorlesiRendelkezes {
  caseId: string;
  fajta: TorlesFajta;
  /** Pl. „GDPR 17. cikk (1) b) — a hozzájárulás visszavonása”. */
  jogalap: string;
  /** Egy mondat: miért ez a döntés ennél az esetnél. */
  indoklas: string;
  rendelte: Alairo;
  /**
   * A VISSZAFORDÍTHATATLAN LÉPÉS MÁSODIK ALÁÍRÓJA.
   *
   * Nem jogszabályi követelmény, hanem a rendszer saját szabálya: ugyanaz,
   * mint a `irreversible` kapu a felülettérképen — a kapunak a lépés ELŐTT
   * kell zárnia, és egyetlen ember egyetlen kattintása ne semmisítsen meg
   * visszahozhatatlanul adatot.
   */
  masodikAlairo?: Alairo;
  /** Függőben van-e betegkérés a dokumentáció kikérésére. */
  betegkeresFuggoben?: boolean;
  /** Mikorra van a megőrzési idő letelte igazolva. `null` = nincs igazolva. */
  megorzesLejart?: string | null;
}

export type AkadalySuly = "blokkolo" | "figyelmeztetes";

export interface TorlesiAkadaly {
  id: string;
  suly: AkadalySuly;
  /** Mi az akadály — a DPO ezt olvassa, nem hibakódot. */
  why: string;
  /** MI KELL AHHOZ, hogy elháruljon. Enélkül az akadály zsákutca. */
  mihezKotott: string;
}

export interface TorlesErtekeles {
  caseId: string;
  fajta: TorlesFajta;
  akadalyok: TorlesiAkadaly[];
  /** Végrehajtható-e MOST. Blokkoló akadály mellett soha. */
  vegrehajthato: boolean;
  /** Mi maradna meg a törlés után — a betegnek is ezt kell látnia. */
  megmarad: string[];
  osszefoglalo: string;
}

/** A rendelkezés önmagában teljes-e. Hiányos rendelkezés nem hajtható végre. */
export function validateRendelkezes(r: TorlesiRendelkezes): string[] {
  const bad: string[] = [];
  if (!r.caseId?.trim()) bad.push("nincs megnevezve az eset");
  if (r.fajta !== "kriptografiai" && r.fajta !== "fizikai") {
    bad.push(`ismeretlen törlésfajta: ${String(r.fajta)}`);
  }
  if (!r.jogalap?.trim()) {
    bad.push(
      "nincs megnevezve a JOGALAP. A „beteg kérte” kiváltó ok, nem jogalap: " +
      "az az, ami alapján a kérés teljesíthető",
    );
  }
  if (!r.indoklas?.trim()) bad.push("nincs indoklás");
  if (!r.rendelte?.nev?.trim()) bad.push("nincs megnevezve, KI rendelte el");
  if (r.rendelte && r.rendelte.szerep !== "dpo") {
    bad.push(
      `a törlést adatvédelmi tisztviselő rendelheti el, nem „${r.rendelte.szerep}”`,
    );
  }
  for (const a of [r.rendelte, r.masodikAlairo]) {
    if (a && !/^\d{4}-\d{2}-\d{2}T/.test(a.at ?? "")) {
      bad.push(`hibás vagy hiányzó időbélyeg: ${a.nev} (${a.at})`);
    }
  }
  if (r.masodikAlairo && r.masodikAlairo.nev === r.rendelte?.nev) {
    bad.push(
      "a második aláíró nem lehet ugyanaz a személy — a négy szem elve " +
      "egyetlen szempárral nem teljesül",
    );
  }
  return bad;
}

export interface TorlesKontextus {
  /** A dokumentumregiszter — innen jönnek a megőrzési kötelezettségek. */
  docs: DocumentRegistry;
  /** Meg tudja-e semmisíteni a kulcstár a kulcsot. */
  kulcsMegsemmisitheto: boolean;
  now: string;
  /**
   * AZ ESET DÁTUMAI, amikhez képest a megőrzési idő számolható.
   *
   * Enélkül a `megorzesLejart` mezőbe írt dátumot semmi nem tudja
   * visszaellenőrizni — és eddig nem is ellenőrizte semmi. A horgonyok
   * megadása nem kötelező, de a hiányuk maga is akadály: ami nem
   * ellenőrizhető, az nem igazolt.
   */
  horgonyok?: Horgonyok;
}

/**
 * MI ÁLL A TÖRLÉS ÚTJÁBAN — és mi kellene hozzá.
 *
 * Minden akadály mellett ott áll, MIHEZ KÖTÖTT a feloldása. Egy akadály,
 * amiről nem derül ki, mi hárítaná el, nem kapu, hanem zsákutca: a DPO nem
 * tud vele mit kezdeni, a beteg pedig azt hallja, hogy „nem lehet”.
 */
export function torlesiAkadalyok(
  r: TorlesiRendelkezes, ctx: TorlesKontextus,
): TorlesiAkadaly[] {
  const out: TorlesiAkadaly[] = [];
  const push = (id: string, suly: AkadalySuly, why: string, mihezKotott: string) =>
    out.push({ id, suly, why, mihezKotott });

  // 0. A rendelkezés maga.
  for (const b of validateRendelkezes(r)) {
    push("rendelkezes", "blokkolo", `Hiányos rendelkezés: ${b}.`,
      "A rendelkezés kiegészítése.");
  }

  // 1. NÉGY SZEM. A visszafordíthatatlan lépéshez második aláíró kell.
  if (!r.masodikAlairo) {
    push("masodikAlairo", "blokkolo",
      "A törlés visszafordíthatatlan, és nincs második aláíró. Egyetlen " +
      "ember egyetlen kattintása ne semmisítsen meg visszahozhatatlanul adatot.",
      "Egy második, névvel és időbélyeggel ellátott aláírás.");
  }

  // 2. A MEGŐRZÉSI KÖTELEZETTSÉG — ez a leggyakrabban félreértett kapu.
  //
  //    A GDPR 17. cikk (3) b) pontja kifejezetten kiveszi a törléshez való jog
  //    alól azt, amit jogi kötelezettség alapján kell megőrizni. Az
  //    egészségügyi dokumentáció ilyen. A beteg kérheti; teljesíteni a
  //    megőrzési idő előtt nem szabad.
  const ellatasi = ctx.docs.careRecords();
  const nemTorolheto = ellatasi
    .map((d) => ({ d, r: deletable(ctx.docs, d.id, {
      patientRequestPending: r.betegkeresFuggoben,
    }) }))
    .filter((x) => !x.r.ok);

  if (nemTorolheto.length) {
    const ellenorizetlen = nemTorolheto.filter((x) =>
      "reason" in x.r && /ellenőrzöttsége/.test(x.r.reason));
    if (ellenorizetlen.length) {
      push("megorzesEllenorzetlen", "blokkolo",
        `${ellenorizetlen.length} ellátási dokumentumtípus megőrzési ideje ` +
        `nincs elsődleges forrásból visszaellenőrizve ` +
        `(${ellenorizetlen.slice(0, 3).map((x) => x.d.id).join(", ")}` +
        `${ellenorizetlen.length > 3 ? ", …" : ""}). Ellenőrizetlen megőrzési ` +
        `idő mellett a rendszer NEM töröl: a törlés visszafordíthatatlan, egy ` +
        `rosszul megadott időtartam pedig olyan adatvesztést okoz, amit semmi ` +
        `nem hoz vissza.`,
        "A megőrzési idők összevetése a hatályos jogszabályszöveggel " +
        "(a 13-18. lépéslista 10. lépése).");
    }
    const betegkeres = nemTorolheto.filter((x) =>
      "reason" in x.r && /betegkérés/.test(x.r.reason));
    if (betegkeres.length) {
      push("betegkeres", "blokkolo",
        "Függőben lévő betegkérés a dokumentáció kikérésére. A megsemmisítés " +
        "előtt a betegnek módot kell adni arra, hogy megkapja, ami róla szól.",
        "A betegkérés teljesítése vagy visszavonása.");
    }
  }

  if (r.megorzesLejart === undefined || r.megorzesLejart === null) {
    push("megorzesLejarta", "blokkolo",
      "Nincs igazolva, hogy a jogszabályi megőrzési idő letelt. Az " +
      "egészségügyi dokumentáció a megőrzési idő végéig akkor is megőrzendő, " +
      "ha a beteg a törlését kéri — a GDPR 17. cikk (3) bekezdése ezt " +
      "kifejezetten kiveszi a törléshez való jog alól.",
      "A megőrzési idő leteltének igazolása (dátum), vagy a kutatási " +
      "hozzájárulás visszavonása a törlés helyett.");
  } else if (Date.parse(r.megorzesLejart) > Date.parse(ctx.now)) {
    push("megorzesLejarta", "blokkolo",
      `A megőrzési idő ${r.megorzesLejart}-kor jár le, ez még nem telt el.`,
      "Várakozás a megőrzési idő leteltéig.");
  } else {
    // A BEGÉPELT DÁTUM ÖSSZEVETVE A KISZÁMOLTTAL.
    //
    // Eddig itt véget ért az ellenőrzés: ha a beírt dátum a múltban volt, a
    // kapu kinyílt. Semmi nem vetette össze a dokumentumok saját megőrzési
    // idejével és horgonyával, pedig mindkettő ott áll a regiszterben — így
    // egy elgépelt vagy rosszul kiszámolt évszám visszahozhatatlanul
    // megsemmisíthette volna a dokumentációt. Ma ezt még elfedi, hogy egyetlen
    // típus sem `primary`; a 10. lépés befejezésekor az a maszk lehullik.
    const horgonyok = ctx.horgonyok ?? {};
    const rossz = ctx.docs.careRecords()
      .map((d) => ({ d, e: igazolasEllenorzes(d, r.megorzesLejart!, horgonyok) }))
      .filter((x) => !x.e.rendben);
    if (rossz.length) {
      const elso = rossz[0];
      push("megorzesIgazolas", "blokkolo",
        `A BEGÉPELT LEJÁRAT NEM IGAZOLHATÓ VISSZA a dokumentumok saját ` +
        `megőrzési idejéből (${rossz.length}/${ctx.docs.careRecords().length} ` +
        `ellátási típusnál). ${elso.e.miert}`,
        ctx.horgonyok
          ? "A megőrzési idő leteltének helyes dátuma, vagy a horgonyok " +
            "kiegészítése."
          : "Az eset dátumainak (horgonyainak) átadása a törlési kontextusban — " +
            "enélkül a begépelt dátum nem ellenőrizhető.");
    }
  }

  // 3. A KULCSTÁR. Kriptográfiai törlés kulcsmegsemmisítés nélkül nem törlés.
  if (r.fajta === "kriptografiai" && !ctx.kulcsMegsemmisitheto) {
    push("kulcstar", "blokkolo",
      "A kulcstár nem tudja megsemmisíteni a kulcsot. Kriptográfiai törlés " +
      "kulcsmegsemmisítés nélkül nem törlés, hanem annak látszata.",
      "Olyan kulcstár, ami a megsemmisítést támogatja és igazolja (HSM/KMS).");
  }

  // 4. FIZIKAI TÖRLÉS — megtöri a láncot. Nem tiltjuk, de kimondjuk.
  if (r.fajta === "fizikai") {
    push("lanctores", "figyelmeztetes",
      "A fizikai törlés MEGTÖRI A HASÍTÓLÁNCOT: onnantól nem bizonyítható, " +
      "hogy a megmaradt bejegyzések hitelesek. A kriptográfiai törlés " +
      "ugyanazt a célt éri el úgy, hogy az auditnyom ép marad.",
      "Kimondott döntés arról, hogy a lánc megtörése elfogadható — és " +
      "annak rögzítése, miért nem elég a kriptográfiai törlés.");
  }

  return out;
}

/** Mi marad meg a törlés után — a betegnek is ezt kell látnia, előre. */
export function megmaradTorlesUtan(r: TorlesiRendelkezes): string[] {
  const kozos = [
    "Az AUDITNAPLÓ: ki, mit, mikor, milyen alapon. Ez soha nem törlődik — " +
    "enélkül a törlés maga sem volna bizonyítható.",
    "A törlési tanúsítvány: mit töröltek, mikor és ki rendelte el.",
  ];
  if (r.fajta === "kriptografiai") {
    return [
      ...kozos,
      "Az esetnapló SZERKEZETE: hány bejegyzés, mikor, kitől — a TARTALOM " +
      "nélkül. A hasítólánc ellenőrizhető marad, a lelet nem nyílik fel többé.",
    ];
  }
  return [...kozos,
    "Az esetnapló sorai ELTŰNNEK, a lánc megtörik. A megmaradt bejegyzések " +
    "hitelessége nem lesz bizonyítható."];
}

export function ertekelTorles(
  r: TorlesiRendelkezes, ctx: TorlesKontextus,
): TorlesErtekeles {
  const akadalyok = torlesiAkadalyok(r, ctx);
  const blokkolo = akadalyok.filter((a) => a.suly === "blokkolo");
  const megmarad = megmaradTorlesUtan(r);
  return {
    caseId: r.caseId, fajta: r.fajta, akadalyok,
    vegrehajthato: blokkolo.length === 0,
    megmarad,
    osszefoglalo: blokkolo.length
      ? `A törlés NEM hajtható végre: ${blokkolo.length} blokkoló akadály. ` +
        `Mindegyik mellett ott áll, mi hárítaná el — ha a beteg kérése az ` +
        `indok, a KUTATÁSI HOZZÁJÁRULÁS VISSZAVONÁSA az, ami most is ` +
        `teljesíthető, és azonnali hatályú.`
      : `A törlés végrehajtható. Utána ${megmarad.length} dolog marad meg, ` +
        `és ezt a betegnek előre látnia kell.`,
  };
}

/* ── A KUTATÁSI HOZZÁJÁRULÁS VISSZAVONÁSA ──────────────────────────────── */

export interface VisszavonasEredmeny {
  caseId: string;
  /** Mi szűnik meg — azonnali hatállyal. */
  megszunik: string[];
  /** Mi marad — és MIÉRT. Ezt a beteg a nyilatkozatban látja, nem utólag. */
  marad: Array<{ mi: string; miert: string }>;
  osszefoglalo: string;
}

/**
 * A KÉTÁGÚ VISSZAVONÁS.
 *
 * Ez az, ami a beteg kérésére MOST IS teljesíthető, és amit a törlési
 * rendelkezés helyett fel kell ajánlani. A kutatási felhasználás megszűnik; az
 * ellátási dokumentáció marad, a jogszabályi megőrzési idő végéig.
 *
 * A hangsúly az „előre” szón van: ha a beteg ezt csak a visszavonás után
 * tudja meg, akkor becsapva érzi magát — jogosan.
 */
export function visszavonasHatasa(
  caseId: string, docs: DocumentRegistry,
): VisszavonasEredmeny {
  const marado = docs.careRecords();
  return {
    caseId,
    megszunik: [
      "A minta és az adat KUTATÁSI felhasználása — azonnali hatállyal.",
      "A jövőbeli álnevesített kiadás kutatási célra.",
      "A biobanki tárolás kutatási jogcíme.",
    ],
    marad: marado.map((d) => ({
      mi: `${d.label?.hu ?? d.id} (${d.retention?.period ?? "?"})`,
      miert:
        `Ellátási dokumentáció: a megőrzése jogi kötelezettség ` +
        `(${d.retention?.source ?? "megőrzési szabály"}), és ez a GDPR 17. cikk ` +
        `(3) bekezdése szerint kívül esik a törléshez való jogon.`,
    })),
    osszefoglalo:
      `A kutatási felhasználás megszűnik. ${marado.length} ellátási ` +
      `dokumentumtípus marad, a jogszabályi megőrzési idő végéig — ezt a beteg ` +
      `a beleegyező nyilatkozatban látja, nem utólag.`,
  };
}

/* ── A TÖRLÉS TANÚSÍTVÁNYA ─────────────────────────────────────────────── */

export interface TorlesiTanusitvany {
  caseId: string;
  fajta: TorlesFajta;
  at: string;
  jogalap: string;
  indoklas: string;
  alairok: Alairo[];
  /** Hány naplóbejegyzést érintett — a szerkezet a kriptográfiai törlésnél megmarad. */
  bejegyzesek: number;
  /** Hogyan ellenőrizhető, hogy a törlés megtörtént. */
  hogyanEllenorizheto: string;
  megmarad: string[];
}

export function tanusitvany(
  r: TorlesiRendelkezes, bejegyzesek: number, at: string,
): TorlesiTanusitvany {
  return {
    caseId: r.caseId, fajta: r.fajta, at,
    jogalap: r.jogalap, indoklas: r.indoklas,
    alairok: [r.rendelte, ...(r.masodikAlairo ? [r.masodikAlairo] : [])],
    bejegyzesek,
    hogyanEllenorizheto: r.fajta === "kriptografiai"
      ? "Az archívum megvan és a hasítólánca ép; a kulcs megsemmisült. A " +
        "visszafejtés `unreadable` hibával bukik el — nem `corrupt` hibával, " +
        "mert az adat nem romlott el, hanem szándékosan olvashatatlan."
      : "Az archívum sorai eltűntek. A lánc megtört, ezért a törlés ténye a " +
        "tanúsítványból és az auditnaplóból igazolható, az archívumból nem.",
    megmarad: megmaradTorlesUtan(r),
  };
}
