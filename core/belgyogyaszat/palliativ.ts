/**
 * PALLIATÍV ELLÁTÁS ÉS HOSPICE — két különböző dolog egy néven.
 *
 * A „hospice” ebben a rendszerben két, egymással össze nem téveszthető
 * dolgot jelent, és a kettő szerkezete ELLENTÉTES:
 *
 *                         FELNŐTT PALLIATÍV        PERINATÁLIS PALLIATÍV
 *   Ki haldoklik          a beteg                  a magzat — a beteg NEM
 *   Ki dönt               a beteg                  a szülők, a magzat helyett
 *   Az ellátás tárgya     tünetkontroll, méltóság  a szülés terve, a búcsú
 *   Meddig tart           a halálig                a szülés UTÁN is, hónapokig
 *
 * AZ ÖSSZEMOSÁS KÖVETKEZMÉNYE KONKRÉT ÉS SÚLYOS. Egyetlen közös „palliatív”
 * zászló azt eredményezné, hogy a letális magzati rendellenességgel gondozott
 * terhes nő ELLÁTÁSA IS VISSZAFOGÓDIK — pedig ő nem haldoklik, és a vérzés, a
 * preeclampsia, a fertőzés ugyanúgy teljes ellátást kíván. Ezért a rendszer
 * nem enged egyetlen közös zászlót: a magzat ellátási céljai és az anya
 * ellátási céljai KÜLÖN mezőben állnak, és a `dosszie()` ezt kikényszeríti.
 *
 * AZ ELLÁTÁSI CÉL NEM KÉTÁLLÁSÚ.
 *
 * A „teljes ellátás” és a „komfort” közti egyetlen kapcsoló a leggyakoribb és
 * legkárosabb egyszerűsítés: a „nem újraélesztendő” jelölést a gyakorlat
 * rendszeresen „ne kezeld”-ként olvassa. Ezért minden beavatkozás KÜLÖN
 * döntés — az újraélesztés, a lélegeztetés, az antibiotikum és a transzfúzió
 * nem egy kérdés négyszer, hanem négy kérdés. Az antibiotikum és a
 * transzfúzió a palliatív ellátásban gyakran TÜNETKONTROLL, nem gyógyítás.
 *
 * AMIT A GÉP NEM DÖNTHET EL.
 *
 * Egy előzetes rendelkezés érvényességét, azt hogy egy beavatkozás
 * „életfenntartó”-e, és hogy egy terhes nő „előreláthatóan képes-e a gyermek
 * kihordására”, gép nem állapítja meg. Az utolsó orvosi JÓSLAT, nem adat. A
 * rendszer jelzi, hogy a kérdés fennáll, és megnevezi, kihez tartozik —
 * EGY ELŐZETES RENDELKEZÉST GÉP NEM ÉRVÉNYTELENÍTHET.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A KÉT FAJTA ─────────────────────────────────────────────────────── */

export type PalliativFajta = "pall.felnott" | "pall.perinatalis";

export interface Fajta {
  id: string;
  megnevezes: string;
  kiHaldoklik: string;
  kiDont: string;
  gondozasTargya: string;
  idotav: string;
  ellatasVege: string;
  utana: string;
  jellemzoUt: string;
  tiltas: string;
}

export type CelKor = "felnott" | "perinatalis";

export interface EllatasiCel {
  id: string;
  megnevezes: string;
  kor: CelKor;
  leiras: string;
}

export interface Tunetkor {
  id: string;
  megnevezes: string;
  eszkoz: string[];
  gyogyszerKapcsolat: string;
  megjegyzes: string;
}

export interface JogiFeltetel {
  id: string;
  megnevezes: string;
  allitas: string;
  alakiFeltetel: string;
  jogszabaly: string;
  /** KI ellenőrzi. A §-szintű hivatkozás nem fejlesztői feladat. */
  jogiEllenorzes: string;
  /** Meddig megy el a gép, és hol áll meg. */
  gepiHatar: string;
}

export interface Atadas {
  id: string;
  megnevezes: string;
  res: string;
  mit: string;
}

export interface PalliativKeszlet {
  megnevezes: string;
  modul: number;
  alairas: null | { ki: string; mikor: string; lenyomat: string };
  note: string;
  fajtak: Fajta[];
  ellatasiCelok: EllatasiCel[];
  tunetkorok: Tunetkor[];
  jogiFeltetelek: JogiFeltetel[];
  atadasok: Atadas[];
}

export function loadPalliativ(path: string): PalliativKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as PalliativKeszlet;
}

/* ── A DÖNTÉS ────────────────────────────────────────────────────────── */

export type CelDontes =
  /** Kérik. */
  | "vallalja"
  /** Visszautasítják. */
  | "visszautasitja"
  /** Megbeszélték, és nyitva hagyták. Ez NEM ugyanaz, mint a hiány. */
  | "nyitva"
  /** Még nem beszélték meg. */
  | "megNemBeszelt";

export interface CelAllas {
  cel: string;
  dontes: CelDontes;
  /** KI mondta ki. „A család” nem cselekvő: nevesített ember kell. */
  kimondta: string | null;
  mikor: string | null;
  /** Rövid indoklás — ez az, ami a következő műszaknak segít. */
  miert: string | null;
}

/**
 * EGY DOSSZIÉ. A KÉT FAJTA SOHA NEM KEVEREDIK.
 *
 * A `celok` a fajtához tartozó ellátási célok állása. Perinatális
 * dossziénál ezek a MAGZAT ellátására vonatkoznak — az anyáéra soha.
 */
export interface Dosszie {
  fajta: PalliativFajta;
  caseId: string;
  celok: CelAllas[];
  /** Van-e rögzített előzetes rendelkezés, és ellenőrizte-e valaki az alakiságát. */
  elozetesRendelkezes: { van: boolean; alakisagEllenorizve: boolean | null } | null;
  /** Terhes-e a beteg. Perinatális dossziénál mindig igen. */
  terhes: boolean | null;
}

export type DosszieAllapot =
  | "rendben"
  /** Az anya ellátási céljait perinatális dossziéba írták. */
  | "anyaiCelPerinatalisban"
  /** Nem a fajtához tartozó cél szerepel. */
  | "idegenCel"
  /** Van döntés, de nincs, aki kimondta volna. */
  | "nevtelen"
  /** Terhesség mellett rögzített életfenntartó visszautasítás. */
  | "jogiMegitelestKivan"
  /** A megbeszélés el sem kezdődött. */
  | "megNemBeszelt";

export interface DosszieItelet {
  allapotok: DosszieAllapot[];
  /** Használható-e ez a dosszié az ellátás vezetésére. */
  hasznalhato: boolean;
  uzenetek: string[];
}

/**
 * A DOSSZIÉ ÁTVIZSGÁLÁSA.
 *
 * A legfontosabb, amit ez kizár: hogy az ANYA ellátási céljai egy perinatális
 * palliatív dossziéba kerüljenek. Ha egyszer odakerülnének, onnantól egy
 * „palliatív” beteg volna a rendszerben, aki valójában nem haldoklik — és a
 * következő műszak ezt nem tudná.
 */
export function dosszieVizsgal(
  d: Dosszie, k: PalliativKeszlet, most: string,
): DosszieItelet {
  const allapotok: DosszieAllapot[] = [];
  const uzenetek: string[] = [];
  const varhatoKor: CelKor = d.fajta === "pall.perinatalis" ? "perinatalis" : "felnott";
  const celIndex = new Map(k.ellatasiCelok.map((c) => [c.id, c]));

  for (const a of d.celok) {
    const c = celIndex.get(a.cel);
    if (!c) {
      allapotok.push("idegenCel");
      uzenetek.push(
        `Ismeretlen ellátási cél: „${a.cel}”. A táblában ${k.ellatasiCelok.length} ` +
        `cél van; ami nincs benne, arról a dosszié nem mond semmit.`);
      continue;
    }
    if (c.kor !== varhatoKor) {
      if (varhatoKor === "perinatalis") {
        allapotok.push("anyaiCelPerinatalisban");
        uzenetek.push(
          `A(z) „${c.megnevezes}” FELNŐTT ellátási cél egy PERINATÁLIS palliatív ` +
          `dossziéban. Ez a modul legsúlyosabb hibája: a perinatális palliatív ` +
          `ellátásban a magzat haldoklik, az ANYA NEM. Ha az ő ellátási céljai ide ` +
          `kerülnek, a rendszerben egy „palliatív” beteg lesz, aki valójában teljes ` +
          `szülészeti ellátást kíván — és a következő műszak ezt nem fogja tudni.`);
      } else {
        allapotok.push("idegenCel");
        uzenetek.push(
          `A(z) „${c.megnevezes}” perinatális cél egy felnőtt palliatív dossziéban.`);
      }
      continue;
    }
    if (a.dontes !== "megNemBeszelt" && !a.kimondta?.trim()) {
      allapotok.push("nevtelen");
      uzenetek.push(
        `A(z) „${c.megnevezes}” céljánál van döntés (${a.dontes}), de nincs ` +
        `megnevezve, KI mondta ki. „A család” és „a csapat” nem cselekvő: a ` +
        `visszavonás és a felülvizsgálat is ehhez a névhez kötődik.`);
    }
  }

  if (!d.celok.some((a) => a.dontes !== "megNemBeszelt")) {
    allapotok.push("megNemBeszelt");
    uzenetek.push(
      `Egyetlen ellátási célról sincs döntés. Ez ÉRVÉNYES állapot — a ` +
      `megbeszélés nem sürgethető —, de nem használható az ellátás vezetésére: ` +
      `a dosszié megléte nem helyettesíti a beszélgetést.`);
  }

  // A JOGI KÉRDÉST A RENDSZER FELVETI, DE NEM DÖNTI EL.
  const eletfenntarto = new Set(["cel.ujraelesztes", "cel.intubalas", "cel.intenziv"]);
  const visszautasitottEletfenntarto = d.celok.some(
    (a) => eletfenntarto.has(a.cel) && a.dontes === "visszautasitja");
  if (d.terhes === true && visszautasitottEletfenntarto) {
    allapotok.push("jogiMegitelestKivan");
    const j = k.jogiFeltetelek.find((x) => x.id === "jog.terhes.visszautasitas");
    uzenetek.push(
      `Terhesség mellett rögzített életfenntartó beavatkozás VISSZAUTASÍTÁSA. A ` +
      `magyar szabályozásban van olyan korlát, amely erre az esetre vonatkozhat ` +
      `(${j?.jogszabaly ?? "1997. évi CLIV. törvény"}) — de ennek megítélése ` +
      `${j?.jogiEllenorzes ?? "jogász"} és klinikus feladata, NEM a rendszeré. ` +
      `Két olyan elem van benne, amit gép nem dönthet el: hogy a beavatkozás ` +
      `„életfenntartó”-e, és hogy a beteg „előreláthatóan képes-e a gyermek ` +
      `kihordására” — az utóbbi orvosi jóslat, nem adat. A rendszer ezért JELZI a ` +
      `kérdést, és nem érvényteleníti a rendelkezést.`);
  }

  if (d.elozetesRendelkezes?.van && d.elozetesRendelkezes.alakisagEllenorizve === null) {
    uzenetek.push(
      `Van rögzített előzetes rendelkezés, de nincs feljegyezve, hogy az alaki ` +
      `feltételeit ellenőrizte-e valaki. A „nem tudjuk” itt sem „rendben van”: ` +
      `az ellenőrzés hiánya a dokumentumot nem érvényteleníti, de a hivatkozást ` +
      `bizonytalanná teszi.`);
  }

  const sulyos = allapotok.some(
    (a) => a === "anyaiCelPerinatalisban" || a === "idegenCel" || a === "megNemBeszelt");
  if (!allapotok.length) {
    uzenetek.push(
      `A dosszié rendben: ${d.celok.filter((a) => a.dontes !== "megNemBeszelt").length} ` +
      `ellátási célról van nevesített döntés (${most}).`);
  }
  return { allapotok, hasznalhato: !sulyos, uzenetek };
}

/* ── AZ ÁTADÁSI RÉS ─────────────────────────────────────────────────── */

export interface AtadasItelet {
  id: string;
  nyitva: boolean;
  eltelNap: number | null;
  miert: string;
}

/**
 * MÉRHETŐ ÁTADÁSI RÉSEK.
 *
 * Mindhárom rés ugyanaz a szerkezet: két ellátási forma között van egy ablak,
 * amit egyik sem birtokol. A rendszer ezt a 15. modul elmulasztott vizit
 * mintájára JELKÉNT kezeli — nem hiányként, hanem esedékességként.
 */
export function atadasiRes(
  a: Atadas, elozoEsemeny: string | null, kovetkezoKapcsolat: string | null,
  most: string, kuszobNap: number,
): AtadasItelet {
  if (!elozoEsemeny) {
    return { id: a.id, nyitva: false, eltelNap: null,
      miert:
        `A(z) „${a.megnevezes}” átadás nem értelmezhető: a kiindulási esemény ` +
        `nincs rögzítve. Ez NEM azt jelenti, hogy nincs rés — azt, hogy nem ` +
        `mérhető.` };
  }
  const eltelt = Math.floor((Date.parse(most) - Date.parse(elozoEsemeny)) / 86_400_000);
  if (kovetkezoKapcsolat) {
    const ideig = Math.floor(
      (Date.parse(kovetkezoKapcsolat) - Date.parse(elozoEsemeny)) / 86_400_000);
    return { id: a.id, nyitva: false, eltelNap: ideig,
      miert: `A(z) „${a.megnevezes}” átadás megtörtént ${ideig} nap alatt.` };
  }
  if (eltelt < kuszobNap) {
    return { id: a.id, nyitva: false, eltelNap: eltelt,
      miert:
        `${eltelt} nap telt el, a küszöb ${kuszobNap} nap — az ablak még nyitva ` +
        `van, de nem lejárt.` };
  }
  return { id: a.id, nyitva: true, eltelNap: eltelt,
    miert:
      `A(z) „${a.megnevezes}” átadás ${eltelt} napja nyitott (küszöb: ` +
      `${kuszobNap} nap). ${a.res} ${a.mit}` };
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface PalliativMerleg {
  fajta: number;
  cel: number;
  felnottCel: number;
  perinatalisCel: number;
  tunetkor: number;
  jogiFeltetel: number;
  /** Hány jogi feltételnél áll meg a gép, és adja emberhez. */
  gepiHatarral: number;
  atadas: number;
  alairt: boolean;
}

export function merleg(k: PalliativKeszlet): PalliativMerleg {
  return {
    fajta: k.fajtak.length,
    cel: k.ellatasiCelok.length,
    felnottCel: k.ellatasiCelok.filter((c) => c.kor === "felnott").length,
    perinatalisCel: k.ellatasiCelok.filter((c) => c.kor === "perinatalis").length,
    tunetkor: k.tunetkorok.length,
    jogiFeltetel: k.jogiFeltetelek.length,
    gepiHatarral: k.jogiFeltetelek.filter((j) => j.gepiHatar?.trim()).length,
    atadas: k.atadasok.length,
    alairt: k.alairas !== null,
  };
}

export function validatePalliativ(k: PalliativKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];

  // MINDKÉT FAJTÁNAK LÉTEZNIE KELL. Ha az egyik hiányzik, a másik lesz „a”
  // palliatív ellátás — és épp ez az összemosás, ami ellen a modul épült.
  for (const kell of ["pall.felnott", "pall.perinatalis"]) {
    if (!k.fajtak.some((f) => f.id === kell)) {
      out.push({ severity: "error", id: kell,
        message:
          `Hiányzik a(z) „${kell}” palliatív fajta. Ha csak az egyik van meg, az ` +
          `lesz „a” palliatív ellátás, és a másik esetben a rendszer a rossz ` +
          `szerkezetet kínálja fel — ez a modul legsúlyosabb hibája.` });
    }
  }
  for (const f of k.fajtak) {
    if (!f.tiltas?.trim()) {
      out.push({ severity: "error", id: f.id,
        message:
          `A(z) „${f.megnevezes}” fajtához nincs kimondva, mit NEM jelent a ` +
          `jelölés. A palliatív címke félreolvasása — „kevesebb ellátás jár” — ` +
          `nem elméleti kockázat, ezért a tiltás kötelező mező.` });
    }
    if (!f.kiHaldoklik?.trim() || !f.kiDont?.trim()) {
      out.push({ severity: "error", id: f.id,
        message:
          `A(z) „${f.megnevezes}” fajtánál hiányzik, KI haldoklik vagy KI dönt. ` +
          `A két fajta épp ebben a két kérdésben tér el.` });
    }
  }

  // MINDKÉT KÖRHÖZ KELL CÉL. Egy üres perinatális céllista azt jelentené, hogy
  // a perinatális dossziéban csak felnőtt célok közül lehet választani.
  for (const kor of ["felnott", "perinatalis"] as CelKor[]) {
    if (!k.ellatasiCelok.some((c) => c.kor === kor)) {
      out.push({ severity: "error", id: `cel.${kor}`,
        message:
          `A(z) „${kor}” körhöz egyetlen ellátási cél sem tartozik. Üres ` +
          `céllistával a dosszié csak a MÁSIK kör céljaiból tudna választani — ` +
          `vagyis pontosan az összemosás történne meg.` });
    }
  }

  const latott = new Set<string>();
  for (const c of k.ellatasiCelok) {
    if (latott.has(c.id)) {
      out.push({ severity: "error", id: c.id, message: `Ismétlődő cél-azonosító.` });
    }
    latott.add(c.id);
    if (c.kor !== "felnott" && c.kor !== "perinatalis") {
      out.push({ severity: "error", id: c.id,
        message: `A(z) „${c.megnevezes}” célnál a kör érvénytelen: „${c.kor}”.` });
    }
  }

  // A JOGI FELTÉTELNÉL KI KELL MONDANI, HOL ÁLL MEG A GÉP.
  for (const j of k.jogiFeltetelek) {
    if (!j.gepiHatar?.trim()) {
      out.push({ severity: "error", id: j.id,
        message:
          `A(z) „${j.megnevezes}” jogi feltételnél nincs kimondva, meddig megy el ` +
          `a gép, és hol áll meg. Jogi szabály gépi határ nélkül azt sugallja, ` +
          `hogy a rendszer alkalmazza — és egy előzetes rendelkezést gép nem ` +
          `érvényteleníthet.` });
    }
    if (!j.jogiEllenorzes?.trim()) {
      out.push({ severity: "error", id: j.id,
        message:
          `A(z) „${j.megnevezes}” feltételnél nincs megnevezve, KI ellenőrzi a ` +
          `jogszabályi hivatkozást. A §-szintű hivatkozás nem fejlesztői feladat.` });
    }
  }

  for (const a of k.atadasok) {
    if (!a.res?.trim() || !a.mit?.trim()) {
      out.push({ severity: "error", id: a.id,
        message:
          `A(z) „${a.megnevezes}” átadásnál hiányzik a rés leírása vagy az, hogy ` +
          `a rendszer mit tesz vele. Egy megnevezett, de nem mért rés csak leírás.` });
    }
  }
  return out;
}
