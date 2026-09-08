/**
 * HBCS BESOROLÁS — a 18 lépés 2. lépésének futásidő fele.
 *
 * A `registry/finanszirozas/hbcs-besorolas.json` a 10/2012. (II. 28.) NEFMI
 * rendelet 2. mellékletéből kinyert szerkezet: 26 főcsoport, 773 HBCS-csoport,
 * 39 359 kódhivatkozás, és csoportonként a besorolási SZABÁLY.
 *
 * A SZABÁLY AZ, AMI NEHÉZ — és amit a legkönnyebb elrontani. A rendelet
 * több mint kétszáz különböző logikai alakot használ, köztük olyanokat, amiket
 * a mai adatmodell nem tud kiértékelni:
 *
 *   „a szülést közvetlenül megelőzően 12 napnál hosszabb ápolás”
 *   „a felvételtől számított 4,5 órán belül”
 *   „3 különböző beavatkozás körből legalább egy-egy vizsgálat”
 *
 * EZÉRT A BESOROLÓ HÁROMÁLLAPOTÚ, nem kétállapotú:
 *
 *   teljesül          a szabály kiértékelhető volt, és igaz
 *   nem teljesül      kiértékelhető volt, és hamis
 *   NEM ÉRTÉKELHETŐ   a szabály elemzetlen, vagy hiányzik hozzá adat
 *
 * A harmadik állapot nélkül a rendszer a nem értett szabályt „nem teljesül”-nek
 * venné, és CSENDBEN rossz csoportot adna — vagyis rossz finanszírozási tételt.
 * Ugyanaz a szabály, mint mindenütt máshol: **a hiányzó adat nem »nem«.**
 *
 * AMIT EZ A RÉTEG NEM TESZ MEG. Nem választ a találatok közül. A rendelet
 * elszámolási szabályai (legmagasabb súlyszám, csillagos csoportok
 * intézeti jogosultsága, összevonás) külön döntést kívánnak, és részben
 * intézményi adatot — ez a réteg a JELÖLTEKET adja, nem a végszót.
 */
import { readFileSync } from "node:fs";

/* ── A BETÖLTÖTT ALAK ───────────────────────────────────────────────── */

export type BlokkFajta =
  | "betegség" | "beavatkozás" | "eszköz" | "anaesztézia"
  | "kemoterápia" | "vérkészítmény";

export interface Blokk {
  jel: string | null;
  fajta: BlokkFajta | null;
  label: string;
  kotoszo?: "és" | "vagy";
  kodok: string[];
  /** „A főcsoportba tartozó bármely betegség” — nyitott lista. */
  barmely?: boolean;
  /** …„az alább felsoroltak KIVÉTELÉVEL” — a lista tiltólista. */
  kizarva?: boolean;
  /** „(LEGALÁBB 4 NAPON ÁT)” — ma nem értékelhető feltétel. */
  feltetel?: string;
}

export interface Csoport {
  focsoport: string;
  label: string;
  blokkok: Blokk[];
  szabalySorok: string[];
  megjegyzesek: string[];
  elszamolasiFeltetelek?: string[];
}

export interface Focsoport {
  label: string;
  kozosBlokkok: Record<string, Blokk>;
  felteteleSorok?: string[];
}

export interface BesorolasTabla {
  id: string;
  version: string;
  validFrom: string;
  source: { cite: string; file: string; sha256: string; extractedAt: string };
  focsoportok: Record<string, Focsoport>;
  csoportok: Record<string, Csoport>;
}

export function loadBesorolas(path: string): BesorolasTabla {
  const t = JSON.parse(readFileSync(path, "utf8")) as BesorolasTabla;
  if (t.id !== "tbl.hbcs.besorolas") {
    throw new Error(`Nem besorolási tábla: ${t.id}`);
  }
  if (!t.source?.sha256) {
    throw new Error(
      "A besorolási táblának meg kell neveznie a FORRÁSÁT a lenyomatával " +
      "együtt. Enélkül egy visszamenőleges elszámolás nem reprodukálható: " +
      "nem derülne ki, melyik kiadásból dolgozott a rendszer.",
    );
  }
  return t;
}

/* ── A SZABÁLY NYELVTANA ────────────────────────────────────────────── */

export type Szerep = "diagnózis" | "beavatkozás" | "eszköz" | "anaesztézia" | "kemoterápia";

export type Kifejezes =
  | { k: "blokk"; jel: string; szerep: Szerep }
  | { k: "és"; tagok: Kifejezes[] }
  | { k: "vagy"; tagok: Kifejezes[] };

const SZEREP: Array<[RegExp, Szerep]> = [
  [/^DIAGN/i, "diagnózis"],
  [/^BEAV/i, "beavatkozás"],
  [/^ESZK/i, "eszköz"],
  [/^ANAEST/i, "anaesztézia"],
  [/^(KEMOT|RADKEM|DAG)/i, "kemoterápia"],
];

/**
 * A SZABÁLYSZÖVEG ELEMZÉSE — csak a felismert alakokra.
 *
 * Rekurzív leszálló elemző zárójelekre, ÉS/VAGY kötőszavakra és
 * `"betű" SZEREP` operandusokra. Ha bármi mást talál, `null`-t ad — és a
 * hívó ebből NEM „üres szabályt” csinál, hanem „nem értékelhető”-t.
 */
export function parseSzabaly(text: string): Kifejezes | null {
  // idiómák, amiket a rendelet szavakkal ír körül
  let s = text.trim()
    .replace(/A szülés ténye\s*\(\s*"([A-Z0-9]+)"\s+vagy\s+"([A-Z0-9]+)"\s*\)/i,
             '("$1" DIAGN. VAGY "$2" DIAGN.)')
    .replace(/\[/g, "(").replace(/\]/g, ")");

  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };

  function operandus(): Kifejezes | null {
    ws();
    if (s[i] === "(") {
      i++;
      const e = vagy();
      ws();
      if (s[i] !== ")") return null;
      i++;
      return e;
    }
    const m = /^"([^"]+)"\s*([A-ZÁÉÍÓÖŐÚÜŰ]+)\.?/i.exec(s.slice(i));
    if (!m) return null;
    const szerep = SZEREP.find(([re]) => re.test(m[2]))?.[1];
    if (!szerep) return null;
    i += m[0].length;
    return { k: "blokk", jel: m[1], szerep };
  }

  function es(): Kifejezes | null {
    const tagok: Kifejezes[] = [];
    for (;;) {
      const t = operandus();
      if (!t) return null;
      tagok.push(t);
      ws();
      const m = /^ÉS\b/i.exec(s.slice(i));
      if (!m) break;
      i += m[0].length;
    }
    return tagok.length === 1 ? tagok[0] : { k: "és", tagok };
  }

  function vagy(): Kifejezes | null {
    const tagok: Kifejezes[] = [];
    for (;;) {
      const t = es();
      if (!t) return null;
      tagok.push(t);
      ws();
      const m = /^VAGY\b/i.exec(s.slice(i));
      if (!m) break;
      i += m[0].length;
    }
    return tagok.length === 1 ? tagok[0] : { k: "vagy", tagok };
  }

  const e = vagy();
  ws();
  return e && i === s.length ? e : null;
}

/* ── AZ ESET ────────────────────────────────────────────────────────── */

export interface Eset {
  /** BNO-kódok. Az elsőt a rendelet fődiagnózisnak tekinti. */
  diagnozisok: string[];
  /** OENO-kódok. */
  beavatkozasok: string[];
  eszkozok?: string[];
  apolasiNapok?: number;
}

export type Allapot = "teljesül" | "nem teljesül" | "nem értékelhető";

export interface Talalat {
  kod: string;
  label: string;
  focsoport: string;
  allapot: Allapot;
  miert: string;
  /** Ami a döntéshez hiányzott vagy elemzetlen maradt. */
  akadaly?: string;
}

/* ── A KIÉRTÉKELÉS ──────────────────────────────────────────────────── */

function kodokSzerep(e: Eset, szerep: Szerep): string[] {
  switch (szerep) {
    case "diagnózis": return e.diagnozisok;
    case "eszköz": return e.eszkozok ?? [];
    default: return e.beavatkozasok;   // beavatkozás, anaesztézia, kemoterápia
  }
}

/**
 * EGY BETŰJEL FELOLDÁSA.
 *
 * A csoport saját blokkja NEM mindig definíció: a rendelet gyakran csak
 * MEGNEVEZI a listát, a tartalmát pedig a főcsoport elején közli
 * („A kódlistát ld. kiemelve a főcsoport elején!”). Az ilyen blokk kód
 * nélkül áll — ez MUTATÓ, nem üres lista, és ha annak vennénk, a szabály
 * csendben hamisra fordulna.
 *
 * A helyi blokk tehát csak akkor nyer, ha TARTALMA is van.
 */
function blokkJelre(t: BesorolasTabla, cs: Csoport, jel: string): Blokk | null {
  const helyi = cs.blokkok.find((b) => b.jel === jel);
  if (helyi && (helyi.kodok.length || helyi.barmely)) return helyi;
  const kozos = t.focsoportok[cs.focsoport]?.kozosBlokkok[jel];
  if (kozos && (kozos.kodok.length || kozos.barmely)) {
    // a helyi feltétel (pl. „LEGALÁBB 4 NAPON ÁT”) a közös listára is áll
    return helyi?.feltetel ? { ...kozos, feltetel: helyi.feltetel } : kozos;
  }
  return helyi ?? kozos ?? null;
}

interface Reszeredmeny { allapot: Allapot; miert: string }

function blokkTeljesul(b: Blokk, e: Eset, szerep: Szerep): Reszeredmeny {
  if (b.feltetel) {
    return { allapot: "nem értékelhető", miert:
      `a(z) „${b.label}” blokk feltétele (${b.feltetel}) időbeli, és a ` +
      `besoroló ma nem kap hozzá adatot` };
  }
  const kodok = kodokSzerep(e, szerep);
  if (b.barmely && !b.kizarva) {
    return kodok.length
      ? { allapot: "teljesül", miert: `bármely ${szerep} megfelel` }
      : { allapot: "nem teljesül", miert: `nincs rögzített ${szerep}` };
  }
  if (!b.kodok.length) {
    return { allapot: "nem értékelhető", miert:
      `a(z) „${b.label}” blokknak nincs kódlistája sem a csoportban, sem a ` +
      `főcsoportban. Az üres lista nem „egy kód sem illik rá”: a hiányzó ` +
      `lista nem „nem”.` };
  }
  const talalt = kodok.filter((k) => b.kodok.includes(k));
  if (b.barmely && b.kizarva) {
    return talalt.length
      ? { allapot: "nem teljesül", miert: `kizárt kód: ${talalt.join(", ")}` }
      : { allapot: "teljesül", miert: "a kizárt listán egyik kód sincs" };
  }
  return talalt.length
    ? { allapot: "teljesül", miert: `${talalt.join(", ")}` }
    : { allapot: "nem teljesül", miert: `a(z) „${b.label}” listából egy kód sem` };
}

function ertekel(
  t: BesorolasTabla, cs: Csoport, x: Kifejezes, e: Eset,
): Reszeredmeny {
  if (x.k === "blokk") {
    const b = blokkJelre(t, cs, x.jel);
    if (!b) {
      return { allapot: "nem értékelhető", miert:
        `a szabály a(z) „${x.jel}” blokkra hivatkozik, de az sem a csoportban, ` +
        `sem a ${cs.focsoport}. főcsoportban nincs definiálva` };
    }
    return blokkTeljesul(b, e, x.szerep);
  }
  const reszek = x.tagok.map((tg) => ertekel(t, cs, tg, e));
  if (x.k === "és") {
    const rossz = reszek.find((r) => r.allapot === "nem teljesül");
    if (rossz) return rossz;                       // egy hamis tag elég
    const nem = reszek.find((r) => r.allapot === "nem értékelhető");
    if (nem) return nem;                           // csak utána a bizonytalan
    return { allapot: "teljesül", miert: reszek.map((r) => r.miert).join(" + ") };
  }
  const jo = reszek.find((r) => r.allapot === "teljesül");
  if (jo) return jo;
  const nem = reszek.find((r) => r.allapot === "nem értékelhető");
  if (nem) return nem;
  return { allapot: "nem teljesül", miert: reszek.map((r) => r.miert).join(" / ") };
}

/**
 * SZABÁLY NÉLKÜLI CSOPORT: a blokkok a saját kötőszavukkal kapcsolódnak.
 *
 * A rendelet a legtöbb csoportnál nem ír külön logikai kifejezést — a
 * „BETEGSÉGEK … ÉS BEAVATKOZÁSOK …” felsorolás maga a szabály.
 */
function blokkokbol(cs: Csoport): Kifejezes | null {
  const jelolt: Kifejezes[] = [];
  for (const [n, b] of cs.blokkok.entries()) {
    if (!b.fajta) return null;
    const szerep: Szerep = b.fajta === "betegség" ? "diagnózis"
      : b.fajta === "eszköz" ? "eszköz"
      : b.fajta === "anaesztézia" ? "anaesztézia"
      : b.fajta === "kemoterápia" ? "kemoterápia" : "beavatkozás";
    // a névtelen blokkot a helyével azonosítjuk
    jelolt.push({ k: "blokk", jel: b.jel ?? `#${n}`, szerep });
    if (n > 0 && b.kotoszo === "vagy") return null;   // vegyes kötés: nem találgatunk
  }
  return jelolt.length ? { k: "és", tagok: jelolt } : null;
}

/**
 * A CSOPORT MEGÍTÉLÉSE EGY ESETRE.
 *
 * Nem dob: az elemezhetetlen szabály is EREDMÉNY, csak a harmadik állapotban.
 */
export function ertekelCsoport(
  t: BesorolasTabla, kod: string, e: Eset,
): Talalat {
  const cs = t.csoportok[kod];
  if (!cs) throw new Error(`Ismeretlen HBCS-csoport: ${kod}`);
  const alap = { kod, label: cs.label, focsoport: cs.focsoport };

  if (cs.szabalySorok.length > 1) {
    return { ...alap, allapot: "nem értékelhető",
      miert: "a csoportnak több, egymással nem összefűzött szabálysora van",
      akadaly: cs.szabalySorok.join(" ⏎ ") };
  }

  let kif: Kifejezes | null;
  let forras: string;
  if (cs.szabalySorok.length === 1) {
    kif = parseSzabaly(cs.szabalySorok[0]);
    forras = cs.szabalySorok[0];
    if (!kif) {
      return { ...alap, allapot: "nem értékelhető",
        miert: "a besorolási szabály nem elemezhető géppel — a rendszer NEM " +
               "találgat, mert a félreértett szabály rossz finanszírozási " +
               "tételt ad",
        akadaly: forras };
    }
  } else {
    kif = blokkokbol(cs);
    forras = "a blokkok felsorolása";
    if (!kif) {
      return { ...alap, allapot: "nem értékelhető",
        miert: "a csoportnak nincs elemezhető szabálya és a blokkjai sem " +
               "kapcsolódnak egyértelműen",
        akadaly: cs.blokkok.map((b) => b.label).join(" | ") };
    }
  }

  // a szabályban hivatkozott, de a névtelen blokkokra épülő eset
  if (cs.szabalySorok.length === 1) {
    const nevtelen = cs.blokkok.filter((b) => !b.jel && b.kodok.length);
    if (nevtelen.length) {
      // a szabály betűkre hivatkozik, de vannak névtelen, kódot HORDOZÓ
      // blokkok is — azok is feltételek, és a szabály nem beszél róluk
      const extra: Kifejezes[] = nevtelen.map((b, n) => ({
        k: "blokk" as const, jel: b.jel ?? `#${cs.blokkok.indexOf(b)}`,
        szerep: (b.fajta === "betegség" ? "diagnózis"
          : b.fajta === "eszköz" ? "eszköz"
          : b.fajta === "anaesztézia" ? "anaesztézia"
          : b.fajta === "kemoterápia" ? "kemoterápia" : "beavatkozás") as Szerep,
      }));
      kif = { k: "és", tagok: [kif, ...extra] };
    }
  }

  const r = ertekelKif(t, cs, kif, e);
  return { ...alap, allapot: r.allapot, miert: r.miert,
    ...(r.allapot === "nem értékelhető" ? { akadaly: forras } : {}) };
}

/** A `#n` alakú, névtelen blokkhivatkozás feloldása is itt történik. */
function ertekelKif(
  t: BesorolasTabla, cs: Csoport, x: Kifejezes, e: Eset,
): Reszeredmeny {
  if (x.k === "blokk" && x.jel.startsWith("#")) {
    const b = cs.blokkok[Number(x.jel.slice(1))];
    if (!b) return { allapot: "nem értékelhető", miert: "hiányzó blokk" };
    return blokkTeljesul(b, e, x.szerep);
  }
  if (x.k === "blokk") return ertekel(t, cs, x, e);
  const reszek = x.tagok.map((tg) => ertekelKif(t, cs, tg, e));
  if (x.k === "és") {
    const rossz = reszek.find((r) => r.allapot === "nem teljesül");
    if (rossz) return rossz;
    const nem = reszek.find((r) => r.allapot === "nem értékelhető");
    if (nem) return nem;
    return { allapot: "teljesül", miert: reszek.map((r) => r.miert).join(" + ") };
  }
  const jo = reszek.find((r) => r.allapot === "teljesül");
  if (jo) return jo;
  const nem = reszek.find((r) => r.allapot === "nem értékelhető");
  if (nem) return nem;
  return { allapot: "nem teljesül", miert: reszek.map((r) => r.miert).join(" / ") };
}

/**
 * BESOROLÁS: melyik csoportokba eshet az eset.
 *
 * A találatok mellett MINDIG ott van, hány csoportot nem lehetett megítélni.
 * Egy „egy találat” válasz, ami mögött 200 kiértékeletlen csoport áll, nem
 * besorolás, hanem tévedés.
 */
export interface BesorolasEredmeny {
  talalatok: Talalat[];
  nemErtekelheto: Talalat[];
  vizsgalt: number;
}

export function besorol(
  t: BesorolasTabla, e: Eset, focsoport?: string,
): BesorolasEredmeny {
  const talalatok: Talalat[] = [];
  const nemErtekelheto: Talalat[] = [];
  let vizsgalt = 0;
  for (const [kod, cs] of Object.entries(t.csoportok)) {
    if (focsoport && cs.focsoport !== focsoport) continue;
    vizsgalt++;
    const r = ertekelCsoport(t, kod, e);
    if (r.allapot === "teljesül") talalatok.push(r);
    else if (r.allapot === "nem értékelhető") nemErtekelheto.push(r);
  }
  return { talalatok, nemErtekelheto, vizsgalt };
}

/** Hány csoport szabálya elemezhető géppel — az őszinte fejlécszám. */
export function elemzesiLefedettseg(t: BesorolasTabla): {
  osszes: number; elemzett: number; szazalek: number; okok: Record<string, number>;
} {
  const okok: Record<string, number> = {};
  let elemzett = 0;
  const ures: Eset = { diagnozisok: [], beavatkozasok: [] };
  for (const kod of Object.keys(t.csoportok)) {
    const r = ertekelCsoport(t, kod, ures);
    if (r.allapot !== "nem értékelhető") elemzett++;
    else okok[r.miert] = (okok[r.miert] ?? 0) + 1;
  }
  const osszes = Object.keys(t.csoportok).length;
  return { osszes, elemzett, szazalek: Math.round((elemzett / osszes) * 100), okok };
}
