/**
 * GYERMEKVÉDELMI JELZÉS — A GYANÚ A LELETBŐL IS FELMERÜLHET.
 *
 * A `pedgyn.zaszlok()` eddig akkor jelzett, ha valaki KIMONDTA a gyanút
 * (`pedgyn.safeguarding.concern`). Ez a modul azt a helyzetet kezeli, amikor
 * senki nem mondta ki — de a leletből következik.
 *
 * MIÉRT NEM ELÉG A KIMONDOTT GYANÚ
 *
 * A gyermekvédelmi mulasztások túlnyomó része nem téves ítélet, hanem
 * ELMARADT ÖSSZERAKÁS: az egyes leletek külön-külön magyarázhatók, együtt
 * viszont mintázatot adnak, és a mintázatot senki nem nézte meg. Egy 8 éves
 * gyermeknél a hüvelyváladék önmagában banális; egy 8 éves gyermeknél
 * IGAZOLT NEMI ÚTON TERJEDŐ FERTŐZÉS nem az. A rendszer ezért nem a gyanút
 * pótolja, hanem a MEGNÉZÉST kényszeríti ki.
 *
 * AMIT A MODUL NEM TESZ, ÉS SOHA NEM IS FOG
 *
 *   · nem állapít meg bántalmazást, és nem is zárja ki;
 *   · nem tesz jelentést, és nem indít eljárást;
 *   · nem sorolja be a beteget vagy a családot.
 *
 * Amit tesz: MEGNEVEZI a leletet, ami miatt a kérdést fel kell tenni, és
 * kimondja, hogy a jelzési kötelezettség a GYANÚTÓL függ, nem a
 * bizonyosságtól.
 *
 * A BÜNTETHETŐSÉG ÉS A JELZÉSI KÖTELEZETTSÉG KÉT KÜLÖN DOLOG.
 *
 * A Btk. korviszony-mátrixa (`registry/gyermek/beleegyezes-btk.json`) azt
 * mondja meg, büntetendő-e a cselekmény. A jelzési kötelezettség viszont a
 * gyermekvédelmi törvényből ered, és a VESZÉLYEZTETETTSÉG gyanújától függ. A
 * kettő összekeverése konkrét kárt okoz: aki a „nem büntetendő” cellát látja,
 * azt hiheti, hogy nincs teendő. A modul ezért soha nem ad vissza
 * büntethetőségi besorolást anélkül, hogy a jelzési kérdést külön kimondaná.
 */
import { readFileSync } from "node:fs";
import type { CaseState } from "../types.ts";
import type { Registry } from "../registry.ts";
import type { RegistryIssue } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import { szakasz } from "./pedgyn.ts";
import type { Szakasz } from "./pedgyn.ts";

/* ── A BTK-MÁTRIX ────────────────────────────────────────────────────── */

export interface Korsav {
  id: string; megnevezes: string; min: number; maxKizarolag: number | null;
}

export interface BtkKeszlet {
  id: string;
  megnevezes: string;
  verzio: string;
  forras: string;
  hivatkozas?: string;
  /** ALÁÍRÁS: amíg `null`, a besorolás tájékoztató, nem következtetés alapja. */
  alairas: { ki: string; mikor: string; mit: string } | null;
  note: string;
  korsavok: Korsav[];
  besorolasok: Record<string, string>;
  matrix: Array<{ fiatalabb: string; idosebb: string; besorolas: string }>;
  beleegyezesiKorhatar: number;
}

export function loadBtk(path: string): BtkKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as BtkKeszlet;
}

export function korsav(k: BtkKeszlet, eletkor: number): Korsav | null {
  return k.korsavok.find((s) =>
    eletkor >= s.min && (s.maxKizarolag === null || eletkor < s.maxKizarolag)) ?? null;
}

export type BtkAllapot =
  | "besorolva"
  /** Az egyik életkor hiányzik — a hiányzó adat itt sem „nem”. */
  | "kornemIsmert"
  /** A korviszony nincs a táblában. */
  | "nincsCella";

export interface BtkItelet {
  allapot: BtkAllapot;
  besorolas: string | null;
  leiras: string | null;
  /** ALÁÍRT-e a tábla. Aláíratlanul a besorolás TÁJÉKOZTATÓ. */
  alairt: boolean;
  /** ÉRVÉNYES BELEEGYEZÉST TUDOTT-E ADNI. Ez NEM azonos a büntethetőséggel. */
  adhatottBeleegyezest: boolean | null;
  miert: string;
}

/**
 * A KORVISZONY BESOROLÁSA — és a két állítás szétválasztása.
 *
 * A `besorolas` a büntethetőségről szól. Az `adhatottBeleegyezest` a
 * beleegyezési korhatárról. A kettő ELTÉRHET: a 12–14 éves és a 14–18 éves
 * fél közti cselekmény a Btk. szerint nem büntetendő, a 14 év alatti gyermek
 * viszont ettől még nem adhatott érvényes beleegyezést. Egyetlen mezőbe
 * összevonva pontosan ez a különbség tűnne el.
 */
export function korviszony(
  k: BtkKeszlet, fiatalabbKor: number | null, idosebbKor: number | null,
): BtkItelet {
  const alairt = Boolean(k.alairas);
  if (fiatalabbKor === null || idosebbKor === null) {
    return { allapot: "kornemIsmert", besorolas: null, leiras: null, alairt,
      adhatottBeleegyezest: fiatalabbKor === null
        ? null : fiatalabbKor >= k.beleegyezesiKorhatar,
      miert:
        `A korviszony nem állapítható meg: ` +
        `${fiatalabbKor === null ? "a fiatalabb" : "az idősebb"} fél életkora ` +
        `nincs rögzítve. A hiányzó életkor NEM „nagykorú” és NEM „rendben”.` };
  }
  const a = korsav(k, fiatalabbKor), b = korsav(k, idosebbKor);
  const cella = a && b
    ? k.matrix.find((m) => m.fiatalabb === a.id && m.idosebb === b.id)
    : undefined;
  const adhatott = fiatalabbKor >= k.beleegyezesiKorhatar;
  if (!cella) {
    return { allapot: "nincsCella", besorolas: null, leiras: null, alairt,
      adhatottBeleegyezest: adhatott,
      miert: `A(z) ${fiatalabbKor}/${idosebbKor} éves korviszony nincs a táblában.` };
  }
  return {
    allapot: "besorolva", besorolas: cella.besorolas,
    leiras: k.besorolasok[cella.besorolas] ?? null, alairt,
    adhatottBeleegyezest: adhatott,
    miert:
      `${a!.megnevezes} / ${b!.megnevezes}: ${k.besorolasok[cella.besorolas]}` +
      (adhatott ? "" :
        ` A ${k.beleegyezesiKorhatar} év alatti gyermek NEM ADHATOTT ÉRVÉNYES ` +
        `BELEEGYEZÉST — ez akkor is így van, ha a cselekmény a Btk. szerint nem ` +
        `büntetendő. A beleegyezés hiánya és a büntethetőség hiánya két külön állítás.`) +
      (alairt ? "" :
        ` A TÁBLA ALÁÍRATLAN: előadásdiáról származik, nem a hatályos ` +
        `jogszabályszöveg feldolgozásából. A besorolás tájékoztató.`),
  };
}

/* ── A LELETBŐL LEVEZETETT GYANÚ ─────────────────────────────────────── */

export type JelzesSuly =
  /** A jelzési kötelezettség a jog szerint FENNÁLL — nem mérlegelés kérdése. */
  | "jogilagKotelezo"
  /** Erős, önmagában is elégséges jel a kérdés feltevésére. */
  | "orszentinel"
  /** Mérlegelendő jel — magában magyarázható, együtt mintázat. */
  | "merlegelendo";

export interface Jelzes {
  id: string;
  suly: JelzesSuly;
  /** A mezők, amikből következik. Enélkül a jelzés visszakereshetetlen. */
  mezok: string[];
  mit: string;
  teendo: string;
}

const KIVETEL_HPV_HSV =
  "kivétel: a HPV és a HSV perinatálisan is szerezhető, csecsemő- és " +
  "kisdedkorban ez nem sentinel lelet";

/**
 * A LELETBŐL LEVEZETETT GYERMEKVÉDELMI JELZÉSEK.
 *
 * A lista nem diagnózis, hanem NÉZŐPONT: mindegyik tétel egy lelet, ami miatt
 * a kérdést fel KELL tenni. A `mezok` megmondja, miből következik — enélkül a
 * jelzés visszakereshetetlen lenne, és a klinikus nem tudná megítélni.
 */
export function levezetettJelzesek(
  reg: Registry, state: CaseState, btk: BtkKeszlet,
): Jelzes[] {
  const ki: Jelzes[] = [];
  const ertek = (id: string): unknown => {
    const r = resolve(reg, state, id);
    return r.state === "ok" ? r.value : undefined;
  };
  const szam = (id: string): number | null => {
    const v = ertek(id);
    return typeof v === "number" ? v : null;
  };

  const kor = szam("patient.age");
  const szak: Szakasz = szakasz(reg, state);

  /* 1. TERHESSÉG A BELEEGYEZÉSI KORHATÁR ALATT.
        Ez nem gyanú, hanem jogi tény: a 14 év alatti gyermek nem adhatott
        érvényes beleegyezést, tehát a terhesség szexuális cselekményből
        származik, amibe nem egyezhetett bele. */
  // A TERHESSÉG A `ctx.pregnant` KONTEXTUSMEZŐBŐL jön — ugyanabból, amit a
  // laborreferenciák és a gyógyszerkapuk használnak. Külön mezőt felvenni rá
  // azt jelentené, hogy két helyen áll ugyanaz a klinikai tény, és a kettő
  // elcsúszhatna: a fedéskereső (`tools/dupla-mezok.ts`) pontosan ezt keresi.
  const terhes = ertek("ctx.pregnant");
  if (kor !== null && kor < btk.beleegyezesiKorhatar && terhes === "pos") {
    ki.push({
      id: "jelzes.terhesseg.korhataralatt", suly: "jogilagKotelezo",
      mezok: ["patient.age", "ctx.pregnant"],
      mit:
        `${kor} éves gyermek terhessége. A ${btk.beleegyezesiKorhatar} év alatti ` +
        `gyermek NEM ADHAT érvényes beleegyezést szexuális cselekménybe, tehát ` +
        `ez nem „korai szexuális aktivitás”, hanem bűncselekmény következménye.`,
      teendo:
        "gyermekvédelmi jelzés HALADÉKTALANUL, a beteg elengedése előtt; " +
        "igazságügyi orvosszakértői mintavétel mérlegelése; a jelzés " +
        "megtétele nem a klinikus mérlegelésétől függ",
    });
  }

  /* 2. IGAZOLT NEMI ÚTON TERJEDŐ FERTŐZÉS PUBERTÁS ELŐTT.
        A legerősebb egyetlen laboratóriumi jel. */
  const sti = ertek("pedgyn.sti.confirmed");
  if (sti && sti !== "none" && sti !== "unk"
    && (szak === "prepubertas" || (kor !== null && kor < 12))) {
    ki.push({
      id: "jelzes.sti.prepubertalis", suly: "orszentinel",
      mezok: ["pedgyn.sti.confirmed", "patient.age", "status.fert.tanner.breast"],
      mit:
        `Igazolt nemi úton terjedő fertőzés pubertás előtti korban (${String(sti)}). ` +
        `Ez a szexuális bántalmazás egyik legerősebb önálló jele — ${KIVETEL_HPV_HSV}.`,
      teendo:
        "gyermekvédelmi konzultáció a beteg elengedése ELŐTT; a fertőzés " +
        "megszerzési útjának tisztázása, a testvérek helyzetének mérlegelése",
    });
  }

  /* 3. A SÉRÜLÉS NEM MAGYARÁZHATÓ. Ez a `pedgyn.ts`-ben is szerepel, de ott
        zászlóként; itt JELZÉSI kérdésként, mert a teendő más. */
  if (ertek("pedgyn.trauma.consistent") === "no") {
    ki.push({
      id: "jelzes.trauma.ellentmondas", suly: "orszentinel",
      mezok: ["pedgyn.trauma.consistent", "pedgyn.trauma.mechanism"],
      mit: "A genitális sérülés nem magyarázható az elmondott mechanizmussal.",
      teendo:
        "az elbeszélés SZÓ SZERINTI rögzítése (nem összefoglalva); " +
        "gyermekvédelmi konzultáció; fényképes dokumentáció mérlegelése",
    });
  }

  /* 4. PUBERTÁS ELŐTTI GENITÁLIS VÉRZÉS, ha a trauma nincs kizárva. */
  if (ertek("pedgyn.bleeding.prepubertal") === "yes" && szak === "prepubertas") {
    ki.push({
      id: "jelzes.verzes.prepubertalis", suly: "merlegelendo",
      mezok: ["pedgyn.bleeding.prepubertal"],
      mit:
        "Pubertás előtti genitális vérzés. A leggyakoribb okok jóindulatúak " +
        "(idegentest, lichen sclerosus, korai pubertás), de a bántalmazás " +
        "kizárása a kivizsgálás RÉSZE, nem a végén jön.",
      teendo: "a bántalmazás mérlegelésének rögzítése a kivizsgálási terv mellett",
    });
  }

  /* 5. ISMÉTLŐDŐ, MEGMAGYARÁZATLAN GENITÁLIS PANASZ. A mintázat a jel. */
  const ismetlodo = szam("pedgyn.presentations.12m");
  if (ismetlodo !== null && ismetlodo >= 3 && szak === "prepubertas") {
    ki.push({
      id: "jelzes.ismetlodo.megjelenes", suly: "merlegelendo",
      mezok: ["pedgyn.presentations.12m"],
      mit:
        `${ismetlodo} genitális panasz miatti megjelenés 12 hónap alatt. Az ` +
        `egyes alkalmak külön-külön magyarázhatók; a MINTÁZAT az, amit senki ` +
        `nem néz meg, és ami miatt a mulasztások keletkeznek.`,
      teendo: "a korábbi megjelenések áttekintése egyben, nem esetenként",
    });
  }

  /* 6. IDEGENTEST PUBERTÁS ELŐTT. */
  if (ertek("pedgyn.foreignBody") === "confirmed" && szak === "prepubertas") {
    ki.push({
      id: "jelzes.idegentest", suly: "merlegelendo",
      mezok: ["pedgyn.foreignBody"],
      mit:
        "Igazolt hüvelyi idegentest pubertás előtti korban. Leggyakrabban " +
        "önmaga helyezte be; a bántalmazás mérlegelése ettől még nem hagyható ki.",
      teendo: "a körülmények tisztázása és a mérlegelés rögzítése",
    });
  }

  /* 7. A PARTNER ÉLETKORA. Itt a Btk.-mátrix ad tartalmat — de a jelzési
        kérdést KÜLÖN mondjuk ki, mert a „nem büntetendő” nem „nincs teendő”. */
  const partnerKor = szam("pedgyn.partner.age");
  if (kor !== null && partnerKor !== null) {
    const it = korviszony(btk, kor, partnerKor);
    const buntetendo = it.besorolas === "szexualisEroszak"
      || it.besorolas === "szexualisVisszaeles";
    if (buntetendo || it.adhatottBeleegyezest === false) {
      ki.push({
        id: "jelzes.korviszony", suly: buntetendo ? "jogilagKotelezo" : "orszentinel",
        mezok: ["patient.age", "pedgyn.partner.age"],
        mit: it.miert,
        teendo:
          "gyermekvédelmi jelzés mérlegelése a beteg elengedése ELŐTT. A " +
          "JELZÉSI KÖTELEZETTSÉG A VESZÉLYEZTETETTSÉG GYANÚJÁTÓL FÜGG, nem a " +
          "büntethetőségtől: a „nem büntetendő” besorolás NEM jelenti azt, " +
          "hogy nincs teendő." +
          (it.alairt ? "" : " A korviszony-tábla ALÁÍRATLAN — a besorolás tájékoztató."),
      });
    }
  }

  return ki;
}

/* ── AZ ÖSSZESÍTETT ÍTÉLET ───────────────────────────────────────────── */

export type JelzesAllapot =
  /** A jog szerint jelezni KELL. */
  | "jelezniKell"
  /** Erős jel: a kérdést fel kell tenni, a jelzést mérlegelni. */
  | "merlegelniKell"
  /** Nincs levezetett jel — ez NEM azt jelenti, hogy nincs baj. */
  | "nincsLevezetettJel";

export interface JelzesItelet {
  allapot: JelzesAllapot;
  jelzesek: Jelzes[];
  /** Megtörtént-e már a jelzés. */
  jelzesMegtortent: boolean | null;
  miert: string;
}

export function jelzesItelet(
  reg: Registry, state: CaseState, btk: BtkKeszlet,
): JelzesItelet {
  const j = levezetettJelzesek(reg, state, btk);
  const r = resolve(reg, state, "pedgyn.report.made");
  const megtortent = r.state === "ok"
    ? (r.value === "pos" ? true : r.value === "neg" ? false : null) : null;

  const kotelezo = j.filter((x) => x.suly === "jogilagKotelezo");
  const sentinel = j.filter((x) => x.suly === "orszentinel");

  if (kotelezo.length) {
    return { allapot: "jelezniKell", jelzesek: j, jelzesMegtortent: megtortent,
      miert:
        `${kotelezo.length} olyan lelet, amelynél a jelzési kötelezettség ` +
        `FENNÁLL: ${kotelezo.map((x) => x.id).join(", ")}. ` +
        (megtortent === true
          ? "A jelzés megtörtént — a dokumentáció szó szerinti idézeteit ellenőrizni kell."
          : "A JELZÉS MÉG NEM TÖRTÉNT MEG. A kötelezettség a gyanútól függ, nem a " +
            "bizonyosságtól, és a mulasztás visszamenőleg nem pótolható.") };
  }
  if (sentinel.length) {
    return { allapot: "merlegelniKell", jelzesek: j, jelzesMegtortent: megtortent,
      miert:
        `${sentinel.length} erős jel a leletben. A rendszer nem állapít meg ` +
        `bántalmazást és nem is zárja ki — a kérdés feltevését és a ` +
        `MÉRLEGELÉS RÖGZÍTÉSÉT kéri, a beteg elengedése előtt.` };
  }
  return { allapot: "nincsLevezetettJel", jelzesek: j, jelzesMegtortent: megtortent,
    miert:
      `A rögzített leletekből nem vezethető le gyermekvédelmi jel. EZ NEM AZT ` +
      `JELENTI, HOGY NINCS BAJ: a levezetés csak arról tud beszélni, amit ` +
      `rögzítettek, és a leggyakoribb mulasztás nem a téves ítélet, hanem az ` +
      `EL SEM HANGZOTT KÉRDÉS.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateBtk(k: BtkKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const savok = new Set(k.korsavok.map((s) => s.id));
  const bes = new Set(Object.keys(k.besorolasok));
  const latott = new Set<string>();

  for (const s of k.korsavok) {
    if (s.maxKizarolag !== null && s.maxKizarolag <= s.min) {
      out.push({ severity: "error", id: s.id,
        message: `A(z) „${s.megnevezes}” korsáv felső határa nem nagyobb az alsónál.` });
    }
  }
  // A KORSÁVOKNAK HÉZAGMENTESEN LE KELL FEDNIÜK a 0-tól felfelé tartó skálát.
  const rendezett = [...k.korsavok].sort((a, b) => a.min - b.min);
  for (let i = 0; i < rendezett.length - 1; i++) {
    if (rendezett[i].maxKizarolag !== rendezett[i + 1].min) {
      out.push({ severity: "error", id: rendezett[i].id,
        message:
          `Hézag vagy átfedés a korsávok között: „${rendezett[i].megnevezes}” ` +
          `és „${rendezett[i + 1].megnevezes}”. Egy hézagba eső életkorra a ` +
          `rendszer nem tudna besorolást adni — és a hiányzó besorolás itt ` +
          `könnyen „rendben”-nek látszana.` });
    }
  }
  if (rendezett[rendezett.length - 1]?.maxKizarolag !== null) {
    out.push({ severity: "error", id: k.id,
      message: `A legfelső korsávnak nyitottnak kell lennie (maxKizarolag: null).` });
  }

  for (const m of k.matrix) {
    const kulcs = `${m.fiatalabb}|${m.idosebb}`;
    if (latott.has(kulcs)) {
      out.push({ severity: "error", id: kulcs,
        message: `Ismétlődő cella: két besorolás versenyez ugyanarra a korviszonyra.` });
    }
    latott.add(kulcs);
    if (!savok.has(m.fiatalabb) || !savok.has(m.idosebb)) {
      out.push({ severity: "error", id: kulcs, message: `Ismeretlen korsáv a cellában.` });
    }
    if (!bes.has(m.besorolas)) {
      out.push({ severity: "error", id: kulcs,
        message: `Ismeretlen besorolás: „${m.besorolas}”.` });
    }
  }
  // MINDEN ÉRTELMES KORVISZONYRA KELL CELLA. A fiatalabb fél nem lehet
  // idősebb az idősebbnél — a felső háromszög üresen marad, az alsónak tele.
  for (const a of rendezett) {
    for (const b of rendezett) {
      if (b.min < a.min) continue;
      if (!latott.has(`${a.id}|${b.id}`)) {
        out.push({ severity: "error", id: `${a.id}|${b.id}`,
          message:
            `Hiányzó cella: ${a.megnevezes} / ${b.megnevezes}. A hiányzó ` +
            `besorolás nem „nem büntetendő”: a rendszer ilyenkor nem tud ` +
            `választ adni, és ezt ki kell mondania.` });
      }
    }
  }
  if (!k.alairas) {
    out.push({ severity: "warning", id: k.id,
      message:
        `A korviszony-tábla ALÁÍRATLAN. Előadásdiáról származik, nem a hatályos ` +
        `jogszabályszöveg feldolgozásából — jogász aláírásáig a besorolás ` +
        `tájékoztató, és a rendszer nem következtet belőle klinikai teendőre.` });
  }
  return out;
}
