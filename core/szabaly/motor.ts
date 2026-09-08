/**
 * SZABÁLYMOTOR — sorrendezett besorolási táblák, tartalom nélkül.
 *
 * Klinikai besorolások (O-RADS, MEC, SPR, FIGO-stádiumok) java része NEM
 * pontozás, hanem SORRENDEZETT TÁBLA: az első illeszkedő sor nyer. A motor
 * ezért maga semmilyen klinikai tartalmat nem hordoz — a tábla adat, a motor
 * kód, és a kettő külön él. Ez nem esztétika:
 *
 *   - a licencköteles tábla (ACR, IOTA) kimaradhat a tárból, a motor nem;
 *   - egy irányelvfrissítés adatfájl-csere, nem kódmódosítás;
 *   - és a találat VISSZAKERESHETŐ a forrás egy sorára — egy besorolás,
 *     amit nem lehet visszavezetni a táblára, klinikailag használhatatlan.
 *
 * ÉS EGY DOLGOT MÁSKÉPP CSINÁLUNK, MINT AZ ÁTVETT MINTA.
 *
 * Az eredeti leírás szerint „a hiányzó mező nem hiba, hanem jelzés: 0-ként
 * számol, de a `missing` listában megjelenik”. Ez ebben a rendszerben NEM
 * fogadható el, és pontosan az a hiba, ami ellen az egész projekt épül.
 *
 * Nulla az O-RADS-ban azt jelenti, hogy NINCS ascites, NINCS peritonealis
 * nodulus, NINCS árnyék. Ha a mezőt senki nem töltötte ki, akkor a
 * „nem magyarázott ascites → O-RADS 5” szabály CSENDBEN nem sül el, és a
 * kiértékelés továbbmegy a következő sorra — ami esetleg O-RADS 2-t ad. A
 * `missing` lista kiírása ezen nem segít: a KATEGÓRIA már megszületett, és az
 * olvasó azt látja.
 *
 * Ezért itt: HA EGY SZABÁLY OLYAN MEZŐRE HIVATKOZIK, AMI HIÁNYZIK, A
 * KIÉRTÉKELÉS MEGÁLL. Nem ugrunk át rajta, mert a sorrendezett táblában az
 * átugrott sor jogosultsága eldöntetlen, és minden utána következő találat
 * megalapozatlan. Az eredmény `eldonthetetlen`, és megnevezi, MELYIK sornál és
 * MELYIK mező miatt.
 *
 * A KIFEJEZÉSEK BETÖLTÉSKOR ELLENŐRZŐDNEK, nem futásidőben: a hibás készlet be
 * sem töltődik. A tiltás külön kitér az EGYSZERES `=`-re — az nemcsak
 * biztonsági rés, hanem egy elgépelt `=` az `==` helyett NÉMÁN mindig igazzá
 * tenné a szabályt, és az első sor mindent elnyelne.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A KÉSZLET ───────────────────────────────────────────────────────── */

export interface Szabaly {
  /** A kimeneti kategória. */
  kat: string;
  /** A predikátum a `vars` mezőin. */
  ha: string;
  /** A tábla sorának leírása — enélkül a találat nem magyarázható. */
  miert: string;
  kockazat?: string;
  teendo?: string;
  /** A leletbe illeszthető mondat. */
  lelet?: string;
  /** Figyelmeztetés — például forrásellentmondás. */
  megjegyzes?: string;
}

export interface SzabalyKeszlet {
  id: string;
  megnevezes: string;
  verzio: string;
  forras: string;
  hivatkozas?: string;
  /** A mezőnevek. A kifejezések CSAK ezekre hivatkozhatnak. */
  vars: string[];
  jelmagyarazat?: Array<[string, string, string]>;
  /** Mérési és alkalmazási előírások — a tábla része, nem díszítés. */
  eloirasok?: string[];
  szabalyok: Szabaly[];
}

export function loadSzabalyok(path: string): SzabalyKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as SzabalyKeszlet;
}

/* ── A KIFEJEZÉS-FORDÍTÓ ─────────────────────────────────────────────── */

/** Ami a mezőnevek kimaszkolása után maradhat. Minden más elutasítva. */
const ENGEDETT = /^[\s0-9.()<>=!&|+\-*/%]*$/;

export interface FordítasEredmeny {
  fn: ((ertekek: Record<string, number>) => boolean) | null;
  /** Mely mezőkre hivatkozik a kifejezés. */
  hivatkozott: string[];
  hiba: string | null;
}

export function fordit(vars: string[], kif: string): FordítasEredmeny {
  if (!kif?.trim()) {
    return { fn: null, hivatkozott: [], hiba: "üres kifejezés" };
  }
  /* EGYSZERES `=` TILTÁSA. Nem elég a maradék-ellenőrzés: az `=` átmenne a
     megengedett karakterek között. Egy elgépelt `diam = 5` NÉMÁN mindig igaz
     lenne, és az első sor mindent elnyelne. */
  if (/(^|[^<>=!])=([^=]|$)/.test(kif)) {
    return { fn: null, hivatkozott: [],
      hiba:
        "egyszeres `=` a kifejezésben. Ez nemcsak biztonsági rés: egy elgépelt " +
        "`=` az `==` helyett némán MINDIG igazzá tenné a szabályt, és a " +
        "sorrendezett táblában az első sor mindent elnyelne." };
  }
  const hivatkozott: string[] = [];
  /* A HOSSZABB NÉV ELŐBB: ha `sol` és `solid` is mező, a rövidebb elsőként
     kimaszkolva a hosszabb közepét vágná ki, és a maradék azonosítóként
     bukna el — vagy ami rosszabb, véletlenül átmenne. */
  const rendezett = [...vars].sort((a, b) => b.length - a.length);
  let maradek = kif;
  for (const v of rendezett) {
    const re = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    if (re.test(maradek)) hivatkozott.push(v);
    maradek = maradek.replace(re, " ");
  }
  if (!ENGEDETT.test(maradek)) {
    const szemet = maradek.replace(/[\s0-9.()<>=!&|+\-*/%]/g, "");
    return { fn: null, hivatkozott,
      hiba:
        `a kifejezés ismeretlen elemet tartalmaz: „${szemet.slice(0, 40)}”. Csak a ` +
        `megnevezett mezők, számok és összehasonlító/logikai jelek állhatnak benne ` +
        `— azonosító, property-elérés, hívás és pontosvessző nem.` };
  }
  try {
    const test = vars.map((v) => `const ${v} = e[${JSON.stringify(v)}] ?? 0;`).join("");
    // eslint-disable-next-line no-new-func
    const f = new Function("e", `${test}return !!(${kif});`) as
      (e: Record<string, number>) => boolean;
    return { fn: f, hivatkozott, hiba: null };
  } catch (err) {
    return { fn: null, hivatkozott,
      hiba: `a kifejezés nem fordítható: ${(err as Error).message}` };
  }
}

/* ── A LEFORDÍTOTT KÉSZLET ───────────────────────────────────────────── */

export interface ForditottSzabaly extends Szabaly {
  /** A sor 0-alapú sorszáma — ezzel kereshető vissza a forrástáblában. */
  index: number;
  fn: (e: Record<string, number>) => boolean;
  hivatkozott: string[];
}

export interface ForditottKeszlet extends Omit<SzabalyKeszlet, "szabalyok"> {
  szabalyok: ForditottSzabaly[];
}

export function forditKeszlet(k: SzabalyKeszlet): ForditottKeszlet {
  const szabalyok: ForditottSzabaly[] = [];
  k.szabalyok.forEach((sz, i) => {
    const f = fordit(k.vars, sz.ha);
    if (!f.fn) {
      throw new Error(
        `${k.id}: a(z) ${i}. szabály nem fordítható — ${f.hiba}. A HIBÁS KÉSZLET ` +
        `BE SEM TÖLTŐDIK: a klinikai tábla ellenőrzése betöltéskor fut, nem az ` +
        `első kiértékeléskor.`,
      );
    }
    szabalyok.push({ ...sz, index: i, fn: f.fn, hivatkozott: f.hivatkozott });
  });
  return { ...k, szabalyok };
}

/* ── A KIÉRTÉKELÉS ───────────────────────────────────────────────────── */

export type TalalatAllapot =
  | "talalat"
  /**
   * A kiértékelés megállt: egy szabály olyan mezőre hivatkozik, ami hiányzik.
   * NEM „nincs találat” és NEM a következő sor — a hiányzó mező nem nulla.
   */
  | "eldonthetetlen"
  /** Végigment a táblán, egyik sor sem illeszkedett. */
  | "nincsTalalat";

export interface Talalat {
  allapot: TalalatAllapot;
  kat: string | null;
  /** A találó sor 0-alapú sorszáma — a forrástáblában visszakereshető. */
  index: number | null;
  szabaly: ForditottSzabaly | null;
  /** `eldonthetetlen` esetén: mely mezők hiányoznak, és melyik sornál. */
  hianyzo: string[];
  megallitoIndex: number | null;
  miert: string;
}

/**
 * A TÁBLA KIÉRTÉKELÉSE. Az első illeszkedő sor nyer — DE a hiányzó mezőre
 * hivatkozó sort nem ugorjuk át.
 */
export function kiertekel(
  k: ForditottKeszlet, ertekek: Record<string, number | null | undefined>,
): Talalat {
  const megvan: Record<string, number> = {};
  const hianyzik = new Set<string>();
  for (const v of k.vars) {
    const x = ertekek[v];
    if (typeof x === "number" && Number.isFinite(x)) megvan[v] = x;
    else hianyzik.add(v);
  }

  for (const sz of k.szabalyok) {
    const hianyzoItt = sz.hivatkozott.filter((v) => hianyzik.has(v));
    if (hianyzoItt.length) {
      return { allapot: "eldonthetetlen", kat: null, index: null, szabaly: null,
        hianyzo: hianyzoItt, megallitoIndex: sz.index,
        miert:
          `A kiértékelés MEGÁLLT a(z) ${sz.index}. sornál: a szabály a(z) ` +
          `${hianyzoItt.join(", ")} mezőre hivatkozik, és az hiányzik. ` +
          `A hiányzó mező NEM NULLA: nullaként számolva ez a sor csendben nem ` +
          `sülne el, a kiértékelés továbbmenne, és egy KÉSŐBBI sor adna ` +
          `kategóriát — megalapozatlanul. („${sz.miert}”)` };
    }
    if (sz.fn(megvan)) {
      return { allapot: "talalat", kat: sz.kat, index: sz.index, szabaly: sz,
        hianyzo: [], megallitoIndex: null,
        miert:
          `${k.megnevezes} ${sz.kat} — a(z) ${sz.index}. sor: ${sz.miert}` +
          (sz.megjegyzes ? ` FIGYELEM: ${sz.megjegyzes}` : "") };
    }
  }
  return { allapot: "nincsTalalat", kat: null, index: null, szabaly: null,
    hianyzo: [], megallitoIndex: null,
    miert:
      `A(z) ${k.megnevezes} táblájának egyetlen sora sem illeszkedik. Ez nem ` +
      `„negatív” eredmény: vagy a tábla hiányos, vagy a bemenet olyan ` +
      `kombináció, amire a forrás nem tér ki — és ezt látni kell.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateSzabalyok(k: SzabalyKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  if (!k.vars.length) {
    out.push({ severity: "error", id: k.id, message: `Nincs egyetlen mező sem.` });
  }
  const dup = k.vars.filter((v, i) => k.vars.indexOf(v) !== i);
  if (dup.length) {
    out.push({ severity: "error", id: k.id,
      message: `Ismétlődő mezőnév: ${[...new Set(dup)].join(", ")}.` });
  }
  for (const v of k.vars) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
      out.push({ severity: "error", id: k.id,
        message: `A(z) „${v}” mezőnév nem használható azonosítóként.` });
    }
  }
  if (!k.forras?.trim()) {
    out.push({ severity: "error", id: k.id,
      message:
        `Nincs megnevezve a forrás. Egy besorolás, aminek nem tudni a forrását, ` +
        `nem összehasonlítható és nem is frissíthető.` });
  }
  if (!k.verzio?.trim()) {
    out.push({ severity: "error", id: k.id,
      message: `Nincs verzió. Az irányelvek változnak, és a régi besorolás visszamenőleg is olvasható kell legyen.` });
  }
  k.szabalyok.forEach((sz, i) => {
    const f = fordit(k.vars, sz.ha);
    if (!f.fn) {
      out.push({ severity: "error", id: `${k.id}.${i}`,
        message: `A(z) ${i}. szabály kifejezése hibás: ${f.hiba}` });
    }
    if (!f.hivatkozott.length && f.fn) {
      out.push({ severity: "warning", id: `${k.id}.${i}`,
        message:
          `A(z) ${i}. szabály EGYETLEN mezőre sem hivatkozik, tehát mindig ` +
          `ugyanazt adja. Sorrendezett táblában egy ilyen sor mindent elnyel, ` +
          `ami utána jön — ha ez alapértelmezett sor, az utolsó helyen a helye.` });
    }
    if (!sz.miert?.trim()) {
      out.push({ severity: "error", id: `${k.id}.${i}`,
        message:
          `A(z) ${i}. szabálynak nincs leírása. A találat így visszakereshetetlen: ` +
          `egy kategória, amit nem lehet a forrás egy sorára visszavezetni, ` +
          `klinikailag használhatatlan.` });
    }
    if (!sz.kat?.trim()) {
      out.push({ severity: "error", id: `${k.id}.${i}`, message: `A(z) ${i}. szabálynak nincs kategóriája.` });
    }
  });
  /* AZ ELÉRHETETLEN SOR. Ha egy korábbi szabály ugyanarra a bemenetre mindig
     illeszkedik, a későbbi soha nem sül el — a táblában viszont ott áll, és
     az olvasó azt hiszi, működik. */
  const nincsFeltetel = k.szabalyok.findIndex((sz) =>
    fordit(k.vars, sz.ha).hivatkozott.length === 0);
  if (nincsFeltetel >= 0 && nincsFeltetel < k.szabalyok.length - 1) {
    out.push({ severity: "error", id: `${k.id}.${nincsFeltetel}`,
      message:
        `A(z) ${nincsFeltetel}. szabály feltétel nélküli, de nem az utolsó: az ` +
        `utána következő ${k.szabalyok.length - nincsFeltetel - 1} sor SOHA nem ` +
        `sül el. A táblában ott állnak, és az olvasó azt hiszi, működnek.` });
  }
  return out;
}

/* ── A TERJESZTÉS KAPUJA ─────────────────────────────────────────────── */

/**
 * LICENCKÖTELES TÁBLA A TERJESZTETT FÁBAN — build-hiba.
 *
 * A motor tartalommentes, és ezért szabadon terjeszthető. A táblák nem
 * feltétlenül: az ACR O-RADS besorolásai szerzői jogvédettek, az IOTA ADNEX
 * együtthatói licenchez kötöttek. Ezek a `helyi/` alkönyvtárba valók, ami
 * gitignorált és az exportcsomagból kizárt.
 *
 * Ugyanaz a szerkezet, mint a SNOMED CT GPS-nél: a szabály nem emlékeztető a
 * dokumentációban, hanem KAPU a fordításban — mert a másolás egy `cp`
 * parancsnyi, és a következmény nem.
 */
export const LICENCKOTELES_FORRAS = [
  "ACR", "American College of Radiology", "O-RADS", "IOTA", "ADNEX",
];

export function validateTerjesztes(
  keszletek: Array<{ id: string; forras: string; utvonal: string }>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const k of keszletek) {
    if (k.utvonal.includes("/helyi/")) continue;
    const talalt = LICENCKOTELES_FORRAS.filter((f) =>
      k.forras.toLowerCase().includes(f.toLowerCase()));
    if (talalt.length) {
      out.push({ severity: "error", id: k.id,
        message:
          `LICENCKÖTELES TÁBLA A TERJESZTETT FÁBAN: a(z) „${k.id}” forrása ` +
          `${talalt.join(", ")}, az állomány viszont nem a „helyi” könyvtárban ` +
          `van (${k.utvonal}). A motor tartalommentes és terjeszthető; a tábla ` +
          `nem. A másolás egy parancsnyi, a következménye nem.` });
    }
  }
  return out;
}
