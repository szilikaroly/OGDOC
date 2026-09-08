/**
 * A SZEPSZISKÜSZÖBÖK ÉS AZ omqSOFA-ELTÉRÉS — a 9. lépés gépi fele.
 *
 * Két forrás, két szám, egy beteg. A CMQCC szülészeti eszköztára a
 * légzésszámra > 24-et, a pulzusra > 110-et mond; a rendszerben már futó
 * omqSOFA (SOMANZ 2017) ugyanezekre a mérésekre > 20-at és > 90-et. Ez nem
 * elírás: két munkacsoport két számot közölt ugyanarra az élettani jelre.
 *
 * AMI EDDIG VOLT, ÉS AMI ELÉGTELEN. Az eltérés eddig PRÓZÁBAN állt: a
 * protokoll `relatedCalculators[].conflict` mezőjében, kézzel írt mondatban.
 * A próza nem tud elavulni hangosan. Ha valaki a küszöböt 24-ről 22-re írja,
 * a mondat változatlanul „> 24 vs > 20"-at hirdet, a validátor pedig
 * változatlanul kiírja — most már tévesen. Ez a rendszerben ismerős hiba:
 * a 7. lépésben egy sosem igaz összehasonlítás, a 8.-ban a kód és a leírás
 * elcsúszása. A válasz mindháromszor ugyanaz: NE PRÓZÁBÓL, HANEM A KÉT ÉLŐ
 * DEFINÍCIÓBÓL vezessük le.
 *
 * Ez a réteg ezért a küszöböket a kalkulátor FUTÓ KÓDJÁBÓL olvassa ki — nem a
 * dokumentált képlet szövegéből —, mert a beteg a kódot kapja, nem a leírást.
 *
 * A MÁSODIK, SÚLYOSABB HIÁNY. A rendszer minden más hitelesítési rétege
 * (laborreferenciák, normogramok, kalkulátorok) ALÁÍRÁSBÓL nyitja a kaput:
 * van egy lenyomat a normatív magról, és amíg nincs aláírás, a réteg nem ad
 * eredményt. A szepszisprotokoll volt az EGYETLEN hely, ahol a kaput két
 * JELÖLÉS nyitotta: a `verification` szó „assumed"-ról „primary"-ra írása és
 * a `blocksAlerting` hamisra állítása. Két szó egy JSON-ban — és a rendszer
 * riasztani kezd olyan határértékekre, amelyeket senki nem vetett össze az
 * elsődleges forrással. Ezt a lyukat ez a réteg zárja be.
 *
 * AMI NEM EZÉ A RÉTEGÉ. Annak eldöntése, MELYIK szám az intézményé. Az nem
 * gépi kérdés: a szülészeti osztályvezető és az intenzíves döntése, és a
 * lépés kimondja, hogy dokumentumban le kell írni. A gép annyit tesz, hogy a
 * döntést ADATKÉNT tárolja, a döntés alapjául szolgáló eltérésekre lenyomatot
 * vesz, és ha a küszöbök a döntés óta elmozdultak, a döntést ELAVULTNAK
 * mondja — nem hallgat.
 *
 * ÉS AMIT A DÖNTÉS NEM TESZ: nem csendesíti el a másik forrást. A választott
 * küszöb lesz a normatív, de az eltérés továbbra is látszik a forrásával
 * együtt. „Két szám" nem lesz „egy szám" attól, hogy választottunk.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { CalcDef } from "../calc/types.ts";
import type { RegistryIssue } from "../registry.ts";
import { konstansok } from "../calc/hitelesites.ts";
import type { Criterion, CriterionSet, SepsisProtocol } from "./types.ts";

/* ── A KÜSZÖB, MINT IRÁNY ÉS HATÁR ───────────────────────────────────── */

/**
 * Egy küszöb két adata: MERRE néz és HOL van. Ennyi kell ahhoz, hogy két
 * forrás küszöbe összevethető legyen akkor is, ha másképp írták le.
 *
 * A CMQCC a testhőt tartományon kívüliségként adja (36–38 között normális),
 * az omqSOFA két külön feltételként (< 36 vagy > 38). SZÁMSZERŰEN UGYANAZ, és
 * egy naiv összehasonlító mégis eltérést jelentene. Ezért mindkét alak
 * ugyanarra a két határra bomlik: `lt 36` és `gt 38`.
 */
export type Irany = "lt" | "lte" | "gt" | "gte";

export interface Kuszob {
  /** A regiszterbeli változó, amire vonatkozik. */
  var: string;
  irany: Irany;
  ertek: number;
  /** Ami leírja: kritériumazonosító vagy kalkulátorazonosító. */
  honnan: string;
}

const KULCS = (k: Kuszob) => `${k.var}|${k.irany}`;

/** Egy kritérium küszöbei. Az `eq`/`notEq` nem szám: nincs mit összevetni. */
export function kriteriumKuszobei(c: Criterion): Kuszob[] {
  const be = (irany: Irany, ertek: number | undefined): Kuszob[] =>
    typeof ertek === "number" ? [{ var: c.var, irany, ertek, honnan: c.id }] : [];
  switch (c.op) {
    case "gt":  return be("gt",  c.value as number);
    case "gte": return be("gte", c.value as number);
    case "lt":  return be("lt",  c.value as number);
    case "lte": return be("lte", c.value as number);
    case "outside": return [...be("lt", c.low), ...be("gt", c.high)];
    default: return [];
  }
}

export function protokollKuszobei(p: SepsisProtocol): Kuszob[] {
  return [...p.screen.criteria, ...p.organDysfunction.criteria]
    .flatMap(kriteriumKuszobei);
}

/* ── A KÜSZÖB KIOLVASÁSA A FUTÓ KÓDBÓL ───────────────────────────────── */

const IRANYOK: Record<string, Irany> = { ">": "gt", ">=": "gte", "<": "lt", "<=": "lte" };

/**
 * A kalkulátor küszöbei — A FÜGGVÉNY FORRÁSÁBÓL, nem a `formula` prózájából.
 *
 * A paraméterek pozíció szerint felelnek meg a deklarált bemeneteknek, ezért a
 * kód `pulse > 90` alakú összehasonlítása visszavezethető arra a REGISZTERBELI
 * VÁLTOZÓRA, amit a kalkulátor ott vár. Ez teszi a két forrást összemérhetővé:
 * a szepszisprotokoll változóval hivatkozik, a kalkulátor paraméternévvel.
 *
 * Miért a kód és nem a leírás: a `formula` mező szép mondat, amit ember ír és
 * ember felejt el frissíteni. A `fn` az, ami lefut.
 */
export function kodKuszobok(c: CalcDef): Kuszob[] {
  const src = String(c.fn)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  const tobb = /^[^(]*\(([^)]*)\)\s*=>/.exec(src);
  const egy = /^\s*(\w+)\s*=>/.exec(src);
  const parancsok = tobb
    ? tobb[1].split(",").map((s) => s.trim().split(/[\s=:]/)[0]).filter(Boolean)
    : egy ? [egy[1]] : [];

  const out: Kuszob[] = [];
  parancsok.forEach((nev, i) => {
    const input = c.inputs[i];
    if (!input || nev.startsWith("...")) return;
    const re = new RegExp(`(?<![\\w.])${nev}\\s*(>=|<=|>|<)\\s*(-?\\d+(?:\\.\\d+)?)`, "g");
    for (const m of src.matchAll(re)) {
      out.push({ var: input.id, irany: IRANYOK[m[1]], ertek: Number(m[2]), honnan: c.id });
    }
  });
  return out;
}

/* ── AZ ELTÉRÉS ──────────────────────────────────────────────────────── */

export type ElteresFajta =
  /** Ugyanaz a változó, ugyanaz az irány, MÁS szám. */
  | "elter"
  /** Ugyanaz a változó, ugyanaz az irány, ugyanaz a szám. */
  | "egyezik"
  /** A protokoll méri, a kalkulátor nem. */
  | "csakProtokollban"
  /** A kalkulátor méri, a protokoll nem. */
  | "csakKalkulatorban";

export interface Elteres {
  var: string;
  irany: Irany;
  fajta: ElteresFajta;
  protokoll: number | null;
  kalkulator: number | null;
  /** A kalkulátor azonosítója — a másik forrás neve. */
  calc: string;
  miert: string;
}

const IRANY_JEL: Record<Irany, string> = { lt: "<", lte: "≤", gt: ">", gte: "≥" };

/**
 * A KÉT FORRÁS ÖSSZEVETÉSE, LEVEZETVE.
 *
 * Nem csak az eltéréseket adja vissza, hanem az egyezéseket és a
 * féloldalasságokat is. Ennek oka van: a hitelesítést végző klinikusnak azt is
 * látnia kell, hogy a testhőküszöb UGYANAZ (tehát nincs miről dönteni), és
 * hogy a CMQCC nézi a fehérvérsejtszámot, amit az omqSOFA nem, az omqSOFA
 * pedig az oxigénszaturációt, amit a CMQCC nem. A „két szám" mögött négyféle
 * viszony van, és csak az egyik igényel döntést.
 */
export function eltereseK(p: SepsisProtocol, calcs: CalcDef[]): Elteres[] {
  const prot = protokollKuszobei(p);
  const out: Elteres[] = [];
  const rokonok = new Set((p.relatedCalculators ?? []).map((r) => r.id));

  for (const c of calcs) {
    if (!rokonok.has(c.id)) continue;
    const kod = kodKuszobok(c);
    const protMap = new Map(prot.map((k) => [KULCS(k), k]));
    const kodMap = new Map(kod.map((k) => [KULCS(k), k]));

    // KÉT FORRÁS CSAK OTT ÖSSZEMÉRHETŐ, AHOL UGYANAZT MÉRI. A vérzési
    // stádiumbesorolás is „rokon kalkulátor” — ugyanannak a műhelynek a másik
    // eszköztára —, de a becsült vérveszteségről és a sokkindexről szól: nincs
    // közös változója a szepszisküszöbökkel. Ha nincs metszet, az összevetés
    // nem eltérést mutatna, hanem zajt: két lista, ami sosem szólt ugyanarról.
    const kozosVar = new Set([...kod].map((k) => k.var)
      .filter((v) => prot.some((x) => x.var === v)));
    if (!kozosVar.size) continue;

    const kulcsok = [...new Set([...protMap.keys(), ...kodMap.keys()])].sort();

    for (const kulcs of kulcsok) {
      const a = protMap.get(kulcs);
      const b = kodMap.get(kulcs);
      const varId = (a ?? b)!.var;
      const irany = (a ?? b)!.irany;
      const jel = IRANY_JEL[irany];
      if (a && b && a.ertek !== b.ertek) {
        out.push({
          var: varId, irany, fajta: "elter", protokoll: a.ertek, kalkulator: b.ertek, calc: c.id,
          miert:
            `KÉT KÜSZÖB UGYANARRA A MÉRÉSRE: a szepszisprotokoll ${jel} ${a.ertek}, ` +
            `a(z) ${c.id} ${jel} ${b.ertek}. Ugyanaz a beteg, ugyanaz a mérés, két szám. ` +
            `A szigorúbb (${Math.min(a.ertek, b.ertek)}) korábban riaszt és többet téved; ` +
            `a megengedőbb (${Math.max(a.ertek, b.ertek)}) ritkábban riaszt és később fog. ` +
            `A választás nem gépi kérdés.`,
        });
      } else if (a && b) {
        out.push({
          var: varId, irany, fajta: "egyezik", protokoll: a.ertek, kalkulator: b.ertek, calc: c.id,
          miert: `A két forrás UGYANAZT mondja (${jel} ${a.ertek}) — nincs miről dönteni.`,
        });
      } else if (a) {
        out.push({
          var: varId, irany, fajta: "csakProtokollban", protokoll: a.ertek, kalkulator: null, calc: c.id,
          miert:
            `A szepszisprotokoll méri (${jel} ${a.ertek}), a(z) ${c.id} nem. Ez nem ` +
            `ellentmondás, hanem HATÓKÖRI különbség: a gyorsszűrő kevesebbet kérdez.`,
        });
      } else if (b) {
        out.push({
          var: varId, irany, fajta: "csakKalkulatorban", protokoll: null, kalkulator: b.ertek, calc: c.id,
          miert:
            `A(z) ${c.id} méri (${jel} ${b.ertek}), a szepszisprotokoll nem. Ha az ` +
            `intézmény a protokollt választja, ez a jel KIESIK — és ezt tudni kell.`,
        });
      }
    }
  }
  return out;
}

/* ── A CÍMKE ÉS A KÜSZÖB ELCSÚSZÁSA ──────────────────────────────────── */

export interface CimkeElcsuszas {
  crit: string;
  cimke: string;
  /** A címkében szerepel, a kiértékelt küszöbök között nem. */
  csakCimkeben: string[];
  /** A küszöbök között szerepel, a címkében nem. */
  csakKuszobben: string[];
  miert: string;
}

/**
 * A CÍMKE AZT ÍGÉRI, AMIT A GÉP MÉR?
 *
 * Ugyanaz a szerkezet, mint a kalkulátoroknál a kód és a próza összevetése —
 * itt a kritérium CÍMKÉJE és a kritérium SAJÁT küszöbei között. Két irányban
 * fog hibát:
 *
 *   · A címkében van szám, a küszöbben nincs: a felirat olyan ágat ígér, amit
 *     a gép nem értékel ki. Az olvasó azt hiszi, megnézte.
 *   · A küszöbben van szám, a címkében nincs: a klinikus nem tudja, MILYEN
 *     határhoz mér a rendszer. Ez a rosszabb irány.
 */
export function cimkeElcsuszasok(p: SepsisProtocol): CimkeElcsuszas[] {
  const out: CimkeElcsuszas[] = [];
  for (const c of [...p.screen.criteria, ...p.organDysfunction.criteria]) {
    const cimke = c.label.hu ?? "";
    const cimkeSzamok = new Set(konstansok(cimke));
    const kuszobSzamok = new Set(kriteriumKuszobei(c).map((k) => String(k.ertek)));
    const csakCimkeben = [...cimkeSzamok].filter((x) => !kuszobSzamok.has(x));
    const csakKuszobben = [...kuszobSzamok].filter((x) => !cimkeSzamok.has(x));
    if (!csakCimkeben.length && !csakKuszobben.length) continue;
    out.push({
      crit: c.id, cimke, csakCimkeben, csakKuszobben,
      miert:
        (csakCimkeben.length
          ? `A CÍMKE OLYAN ÁGAT ÍGÉR, AMIT A GÉP NEM ÉRTÉKEL KI (${csakCimkeben.join(", ")}): ` +
            `a felirat szerint a rendszer megnézi, a kiértékelés szerint nem. `
          : "") +
        (csakKuszobben.length
          ? `A GÉP OLYAN HATÁRHOZ MÉR, AMI A CÍMKÉBEN NEM ÁLL (${csakKuszobben.join(", ")}): ` +
            `a klinikus a feliratot olvassa, a beteg a küszöböt kapja.`
          : ""),
    });
  }
  return out;
}

/* ── AZ IDŐBELI JELZŐ, AMINEK NINCS GÉPI ALAKJA ──────────────────────── */

const IDOSZAVAK = ["tartós", "ismételt", "sorozat", "perzisz", "visszatérő", "egymást követő"];

export interface IdobeliJelzo {
  crit: string;
  szo: string;
  miert: string;
}

/**
 * „TARTÓSAN" — egy szó, aminek a kiértékelésben nincs nyoma.
 *
 * A pulzuskritérium szövege azt mondja: „> 110/perc, TARTÓSAN", és a
 * megjegyzése hozzáteszi, hogy egyetlen mérés nem elég, mert a vajúdás
 * fájdalma és a vérvesztés is gyorsítja a pulzust. A kiértékelő viszont
 * EGYETLEN értéket néz: az első 111-es pulzus teljesíti a kritériumot, amit a
 * saját szövege szerint nem teljesíthetne.
 *
 * A gép ezt nem javítja ki. Hogy „tartós" hány mérést vagy hány percet jelent,
 * a protokoll kérdése, nem a kódé — és a rossz irányba tippelni itt drága: a
 * túl hosszú ablak késlelteti a felismerést, a túl rövid értelmetlenné teszi a
 * szót. A `sustained` mező azért van a típusban, hogy a hiányt KI LEHESSEN
 * TÖLTENI; amíg üres, a jelzés áll.
 */
export function idobeliJelzok(p: SepsisProtocol): IdobeliJelzo[] {
  const out: IdobeliJelzo[] = [];
  for (const c of [...p.screen.criteria, ...p.organDysfunction.criteria]) {
    if (c.sustained) continue;
    const szoveg = `${c.label.hu ?? ""} ${c.note?.hu ?? ""}`.toLowerCase();
    const szo = IDOSZAVAK.find((s) => szoveg.includes(s));
    if (!szo) continue;
    out.push({
      crit: c.id, szo,
      miert:
        `A kritérium szövege IDŐBELI FELTÉTELT mond („${szo}…"), a kiértékelés ` +
        `viszont egyetlen értéket néz: az első átlépő mérés teljesíti azt, amit a ` +
        `saját szövege szerint nem teljesíthetne. A gépi alak (\`sustained\`) üres — ` +
        `hogy hány mérés vagy hány perc a „tartós", a protokoll dönti el, nem a kód.`,
    });
  }
  return out;
}

/* ── A LENYOMAT ──────────────────────────────────────────────────────── */

/**
 * A KÜSZÖBÖK NORMATÍV MAGJA — minden szám, ami dönt.
 *
 * Benne van: minden kritérium változója, iránya, határa és EGYSÉGE; a két
 * készlet küszöbszáma (`needed`); a gyermekágyi ablak napokban; az órához
 * kötött csomag határidői; a riasztás átvételi határideje.
 *
 * Nincs benne: a címke, a megjegyzés, a forrás idézete és a `verification`
 * szó maga. Azok javíthatók az aláírás elvesztése nélkül — a számok nem.
 *
 * AZ EGYSÉG AZÉRT VAN BENNE, mert a néma egységváltás a legdrágább hiba:
 * a laktát 2 mmol/l-es küszöbe mg/dL-ben olvasva 18-szor téves lenne, és a
 * kód egyetlen sora sem változna.
 */
export function lenyeg(p: SepsisProtocol): string {
  const keszlet = (s: CriterionSet) =>
    `${s.id}:${s.needed}[` +
    s.criteria.map((c) =>
      `${c.id}:${c.var}:${c.op}:${c.value ?? ""}:${c.low ?? ""}..${c.high ?? ""}:${c.unit ?? ""}` +
      `:${c.suspendDuring ?? ""}:${c.sustained ? JSON.stringify(c.sustained) : ""}`,
    ).sort().join(",") + "]";
  const csomag = p.bundle.steps
    .map((s) => `${s.id}:${s.withinMinutes}:${s.before ?? ""}:${s.conditionalOn ?? ""}`)
    .sort().join(",");
  return [
    p.id,
    keszlet(p.screen),
    keszlet(p.organDysfunction),
    `pp:${p.postpartumWindowDays}`,
    `preg:${p.requiresPregnancyState}`,
    `ack:${p.escalation.acknowledgeWithinMinutes}`,
    `bundle[${csomag}]`,
  ].join("|");
}

export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);
}

/* ── AZ ALÁÍRÁS ──────────────────────────────────────────────────────── */

export interface KuszobHitelesites {
  protokoll: string;
  ki: string;
  szerep: string;
  mikor: string;
  lenyomat: string;
  /** Melyik kiadás melyik táblázatával vetették össze. */
  forrasTabla: string;
  /**
   * Amit TÉTELESEN összevetettek: kritériumazonosító → a látott szám.
   * Ami kimarad, arra az aláírás nem terjed ki — ugyanaz a szabály, mint a
   * kalkulátoroknál.
   */
  osszevetettKuszobok: string[];
  megjegyzes?: string;
}

export interface KuszobKatalogus {
  szerepek: Record<string, string>;
  hitelesitesek: KuszobHitelesites[];
}

export function loadKuszobHitelesitesek(path: string): KuszobKatalogus {
  return JSON.parse(readFileSync(path, "utf8")) as KuszobKatalogus;
}

export type KuszobAllapot = "hitelesitve" | "alairatlan" | "elavult";

export interface ProtokollAllapot {
  protokoll: string;
  allapot: KuszobAllapot;
  lenyomat: string;
  alairo: string | null;
  /** Minden küszöb, amit egy aláírásnak fednie kell. */
  kuszobok: string[];
  /** Amit az aláíró NEM vetett össze, pedig a protokollban ott van. */
  osszevetetlen: string[];
  miert: string | null;
}

/** Egy küszöb kanonikus, aláírható alakja: `sep.crit.rr>24`. */
export function kuszobJel(k: Kuszob): string {
  return `${k.honnan}${IRANY_JEL[k.irany]}${k.ertek}`;
}

export function kuszobAllapot(p: SepsisProtocol, kat: KuszobKatalogus): ProtokollAllapot {
  const mag = lenyomat(lenyeg(p));
  const kuszobok = protokollKuszobei(p).map(kuszobJel).sort();
  const h = kat.hitelesitesek.find((x) => x.protokoll === p.id);
  if (!h) {
    return { protokoll: p.id, allapot: "alairatlan", lenyomat: mag, alairo: null,
             kuszobok, osszevetetlen: kuszobok, miert: null };
  }
  const osszevetetlen = kuszobok.filter((k) => !(h.osszevetettKuszobok ?? []).includes(k));
  if (h.lenyomat !== mag) {
    return {
      protokoll: p.id, allapot: "elavult", lenyomat: mag, alairo: h.ki, kuszobok, osszevetetlen,
      miert:
        `a küszöbök magja megváltozott az aláírás óta (aláírt: ${h.lenyomat}, ` +
        `mostani: ${mag}) — az aláírás nem fedezi a mostani határértékeket`,
    };
  }
  return { protokoll: p.id, allapot: "hitelesitve", lenyomat: mag, alairo: h.ki,
           kuszobok, osszevetetlen, miert: null };
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export interface KapuAllapot {
  engedve: boolean;
  miert: string;
}

/**
 * RIASZTÁS CSAK ALÁÍRÁSBÓL.
 *
 * Ez a réteg egyetlen valódi kényszere. Eddig a kaput két JELÖLÉS nyitotta —
 * a `verification` szó és a `blocksAlerting` logikai érték —, és mindkettő
 * egyetlen JSON-szerkesztéssel átírható volt. Egy hitelesítetlen küszöbre
 * kiadott riasztás pedig nem ártalmatlan: rossz számra riasztani ugyanaz a
 * kár, mint jó számra nem.
 *
 * Mostantól a `blocksAlerting: false` ÖNMAGÁBAN nem nyit semmit: a kapu akkor
 * és csak akkor nyílik, ha van ÉRVÉNYES aláírás a mostani küszöbökre. A
 * jelölés így már nem engedély, hanem legfeljebb tiltás — kikapcsolni lehet
 * vele a riasztást aláírás mellett is, de bekapcsolni aláírás nélkül nem.
 */
export function riasztasEngedve(p: SepsisProtocol, kat: KuszobKatalogus): KapuAllapot {
  const a = kuszobAllapot(p, kat);
  if (a.allapot === "alairatlan") {
    return { engedve: false,
      miert:
        "RIASZTÁS NEM INDUL: a küszöbök ALÁÍRATLANOK. A megítélés elkészül és " +
        "látszik, de riasztást nem vált ki — ugyanaz a kapu, mint a " +
        "normogramoknál, ahol a tábla látszik, de percentilist nem ad." };
  }
  if (a.allapot === "elavult") {
    return { engedve: false, miert: `RIASZTÁS NEM INDUL: ${a.miert}` };
  }
  if (p.blocksAlerting) {
    return { engedve: false,
      miert:
        `RIASZTÁS NEM INDUL: a küszöbök alá vannak írva (${a.alairo}), de a ` +
        `protokoll blocksAlerting jelölése kikapcsolja a riasztást. Az aláírás ` +
        `enged, a jelölés tilt — a tiltás erősebb.` };
  }
  return { engedve: true,
    miert: `A küszöböket ${a.alairo} aláírta a mostani lenyomatra (${a.lenyomat}).` };
}

/* ── AZ INTÉZMÉNYI DÖNTÉS ────────────────────────────────────────────── */

export interface KuszobDontes {
  /** `nincs-dontes` amíg nem született. */
  allapot: "nincs-dontes" | "dontve";
  /** A választott forrás: a protokoll azonosítója VAGY egy kalkulátoré. */
  valasztott: string | null;
  ki: string | null;
  szerep: string | null;
  mikor: string | null;
  /** A lépés kimondja: az intézményi küszöb DOKUMENTUMBAN álljon. */
  dokumentum: string | null;
  /** Lenyomat azokra az eltérésekre, amelyek ismeretében a döntés született. */
  lenyomat: string | null;
  indoklas: string | null;
}

export function loadKuszobDontes(path: string): KuszobDontes {
  return JSON.parse(readFileSync(path, "utf8")) as KuszobDontes;
}

/** Az eltérések lenyomata — ez az, amire a döntés vonatkozik. */
export function elteresLenyomat(elteresek: Elteres[]): string {
  return lenyomat(
    elteresek.filter((e) => e.fajta === "elter")
      .map((e) => `${e.calc}|${e.var}|${e.irany}|${e.protokoll}|${e.kalkulator}`)
      .sort().join(";"),
  );
}

export type DontesAllapot = "nincs-dontes" | "dontve" | "elavult";

export interface DontesEredmeny {
  allapot: DontesAllapot;
  valasztott: string | null;
  /** Az eltérések SZÁMA, amikről dönteni kell. */
  eldontendo: number;
  miert: string;
}

export function dontesAllapot(
  p: SepsisProtocol, calcs: CalcDef[], d: KuszobDontes,
): DontesEredmeny {
  const elteresek = eltereseK(p, calcs);
  const nyitott = elteresek.filter((e) => e.fajta === "elter");
  const mostani = elteresLenyomat(elteresek);

  if (d.allapot !== "dontve" || !d.valasztott) {
    return {
      allapot: "nincs-dontes", valasztott: null, eldontendo: nyitott.length,
      miert: nyitott.length
        ? `${nyitott.length} küszöb áll két számmal (${[...new Set(nyitott.map((e) => e.var))].join(", ")}), ` +
          `és nincs intézményi döntés. A rendszer MINDKETTŐT megnevezi a forrásával ` +
          `együtt, és egyiket sem csendesíti el a másikkal — de ez nem végállapot: ` +
          `a szülészeti osztályvezetőnek és az intenzívesnek választania kell.`
        : `Nincs eltérő küszöb, tehát nincs miről dönteni.`,
    };
  }
  if (d.lenyomat !== mostani) {
    return {
      allapot: "elavult", valasztott: d.valasztott, eldontendo: nyitott.length,
      miert:
        `A DÖNTÉS ELAVULT: azóta megváltoztak az eltérő küszöbök (döntéskor: ` +
        `${d.lenyomat}, most: ${mostani}). A döntés arra a képre vonatkozott, ` +
        `ami akkor volt — nem erre.`,
    };
  }
  return {
    allapot: "dontve", valasztott: d.valasztott, eldontendo: nyitott.length,
    miert:
      `Az intézményi küszöb: ${d.valasztott} (${d.ki}, ${d.mikor}; ${d.dokumentum}). ` +
      `A másik forrás ettől NEM tűnik el: ${nyitott.length} eltérés továbbra is ` +
      `látszik a forrásával együtt.`,
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateKuszobok(
  p: SepsisProtocol, calcs: CalcDef[], kat: KuszobKatalogus, d: KuszobDontes,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const allapot = kuszobAllapot(p, kat);
  const elteresek = eltereseK(p, calcs);
  const nyitott = elteresek.filter((e) => e.fajta === "elter");

  /* 1. A KAPU CSAK ALÁÍRÁSBÓL NYÍLIK. */
  if (!p.blocksAlerting && allapot.allapot !== "hitelesitve") {
    out.push({ severity: "error", id: p.id,
      message:
        "`blocksAlerting: false` ALÁÍRÁS NÉLKÜL: a riasztás kapuját aláírás nyitja, " +
        "nem jelölés. A küszöbök hitelesítése a " +
        "`registry/szepszis/kuszob-hitelesitesek.json`-ba kerül" });
  }
  if (p.verification === "primary" && allapot.allapot !== "hitelesitve") {
    out.push({ severity: "error", id: p.id,
      message:
        "`verification: \"primary\"` ALÁÍRÁS NÉLKÜL: a protokoll csak akkor " +
        "elsődleges, ha a küszöbeit valaki tételesen összevetette a forrással" });
  }
  if (allapot.allapot === "elavult") {
    out.push({ severity: "error", id: p.id, message: allapot.miert! });
  }

  /* 2. AZ ALÁÍRÁS TÉTELES. */
  for (const h of kat.hitelesitesek) {
    if (h.protokoll !== p.id) {
      out.push({ severity: "error", id: h.protokoll,
        message: "hitelesítés nem létező szepszisprotokollra" });
      continue;
    }
    if (!h.ki?.trim()) {
      out.push({ severity: "error", id: p.id, message: "névtelen küszöbhitelesítés" });
    }
    if (!h.forrasTabla?.trim()) {
      out.push({ severity: "error", id: p.id,
        message: "hiányzó `forrasTabla` — nem derül ki, MELYIK kiadással vetették össze" });
    }
    if (allapot.osszevetetlen.length) {
      out.push({ severity: "error", id: p.id,
        message:
          `az aláírás ${allapot.osszevetetlen.length} küszöbről hallgat ` +
          `(${allapot.osszevetetlen.join(", ")}). A hitelesítés TÉTELES: ami nincs ` +
          `összevetve, arra az aláírás nem terjed ki` });
    }
  }

  /* 3. A PRÓZA NEM HAZUDHAT A SZÁMOKRÓL. */
  for (const rel of p.relatedCalculators ?? []) {
    if (!rel.conflict) continue;
    const proza = new Set(konstansok(rel.conflict));
    const sajat = nyitott.filter((e) => e.calc === rel.id);
    const hianyzo = sajat.flatMap((e) => [String(e.protokoll), String(e.kalkulator)])
      .filter((n) => !proza.has(n));
    if (hianyzo.length) {
      out.push({ severity: "error", id: rel.id,
        message:
          `az eltérés PRÓZÁJA elavult: a levezetett küszöbök között szerepel ` +
          `${[...new Set(hianyzo)].join(", ")}, a conflict szövegében nem. ` +
          `A kézzel írt mondat nem tud hangosan elavulni — ezért kell a levezetett ` +
          `listát olvasni, nem őt` });
    }
    if (!sajat.length) {
      out.push({ severity: "warning", id: rel.id,
        message:
          "a `conflict` mező küszöbeltérést állít, a két definícióból viszont " +
          "EGYETLEN eltérés sem vezethető le — a mondat vagy elavult, vagy nem " +
          "küszöbről szól" });
    }
  }

  /* 4. AZ ELTÉRÉSEK MEGNEVEZVE, AMÍG NINCS DÖNTÉS. */
  const dont = dontesAllapot(p, calcs, d);
  if (dont.allapot === "elavult") {
    out.push({ severity: "error", id: p.id, message: dont.miert });
  }
  if (dont.allapot === "dontve") {
    const forrasok = new Set([p.id, ...(p.relatedCalculators ?? []).map((r) => r.id)]);
    if (!forrasok.has(d.valasztott!)) {
      out.push({ severity: "error", id: p.id,
        message:
          `az intézményi döntés ismeretlen forrást választ (${d.valasztott}) — ` +
          `a választható források: ${[...forrasok].join(", ")}` });
    }
    if (!d.dokumentum?.trim()) {
      out.push({ severity: "error", id: p.id,
        message:
          "az intézményi küszöb DOKUMENTUM nélkül: a döntés akkor döntés, ha " +
          "leírva is megtalálható — enélkül fél év múlva senki nem tudja, mi az övé" });
    }
  } else if (nyitott.length) {
    for (const e of nyitott) {
      out.push({ severity: "warning", id: e.var, message: e.miert });
    }
  }

  /* 5. A CÍMKE ÉS A KÜSZÖB. */
  for (const c of cimkeElcsuszasok(p)) {
    out.push({ severity: "warning", id: c.crit, message: c.miert });
  }

  /* 6. AZ IDŐBELI FELTÉTEL, AMINEK NINCS GÉPI ALAKJA. */
  for (const j of idobeliJelzok(p)) {
    out.push({ severity: "warning", id: j.crit, message: j.miert });
  }

  return out;
}

/** A 9. lépés haladásmérője. */
export function merleg(
  p: SepsisProtocol, calcs: CalcDef[], kat: KuszobKatalogus, d: KuszobDontes,
): { kuszobok: number; alairt: number; eltero: number; dontve: boolean; riaszt: boolean } {
  const a = kuszobAllapot(p, kat);
  return {
    kuszobok: a.kuszobok.length,
    alairt: a.allapot === "hitelesitve" ? a.kuszobok.length - a.osszevetetlen.length : 0,
    eltero: eltereseK(p, calcs).filter((e) => e.fajta === "elter").length,
    dontve: dontesAllapot(p, calcs, d).allapot === "dontve",
    riaszt: riasztasEngedve(p, kat).engedve,
  };
}
