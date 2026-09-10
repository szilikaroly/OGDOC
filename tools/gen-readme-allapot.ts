/**
 * A README ÁLLAPOTSZÁMAI — a forrásból, nem kézből.
 *
 *   npm run docs         (beírja)
 *   npm run docs:check   (ellenőrzi)
 *
 * MIÉRT KELL EZ. A README három számot állított a rendszerről, és MIND A HÁROM
 * elcsúszott: 894 változót írt 905 helyett, 1875 tesztet 1939 helyett, és azt,
 * hogy a tizennyolc lépésből „kettőnél áll a gépi fele” — tizenöt helyett. A
 * harmadik a legrosszabb: a főoldal a saját projektjét mondta hétszer kevésbé
 * késznek, mint amilyen. Egyik sem hanyagságból: azért, mert kézzel volt
 * odaírva, és a kézzel írt szám fél éven belül hazudik.
 *
 * A MINTA NEM ÚJ. A névsor-generátorok (`gen-drug-roster.ts` és társai) pontosan
 * így működnek: a fájlba írnak, és `--check` kapcsolóval ugyanaz ellenőrzi, hogy
 * nem csúszott-e szét. Az egyetlen különbség, hogy itt egy MEGLÉVŐ dokumentum
 * egy DARABJÁT írjuk, nem az egészet — a README prózája emberé marad, a számai
 * a gépéi.
 *
 * AMI EBBE A BLOKKBA KERÜL, AZ FÁTÓL FÜGGETLEN. Ez nem véletlen, hanem
 * követelmény: a `docs/14-allapot.md` azért nem ellenőrizhető minden fában,
 * mert helyben települő regiszterektől függő számot is tartalmaz (a
 * regiszterfájlok darabszámát). A README-be szándékosan csak olyan szám kerül,
 * ami a fejlesztői fában és egy friss klónban is UGYANAZ — így a CI-ban is
 * ellenőrizhető, és nincs szükség a „nem megállapítható” harmadik válaszra.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadRegistry } from "../core/load.ts";
import { lepesAllas, zoldTesztMerleg } from "./allapot-forras.ts";

const FAJL = "README.md";
const LEPESFAJL = "docs/13-18-lepes.md";

/** A blokk határai. A README-ben idézetben állnak, ezért `> ` előzi meg őket. */
export const NYIT = "<!-- generált: allapot — `npm run docs` írja -->";
export const ZAR = "<!-- /generált: allapot -->";

export interface Szamok {
  valtozo: number;
  tesztek: number;
  bukott: number;
  teljes: number;
  reszben: number;
}

/**
 * A blokk szövege. Minden sora idézetben áll, mert a README állapotdoboza
 * idézetblokk — a jelölők is ott vannak, különben a doboz kettétörne.
 *
 * A SORTÖRÉSEK KÉZIEK ÉS ÁLLANDÓAK. Nem szélesség szerint tördelünk: a számok
 * hossza változhat, és egy automatikus tördelés attól elmozgatná a sorokat,
 * amitől minden számváltozás fölösleges diffet szülne.
 */
export function allapotBlokk(sz: Szamok): string {
  // A „0 hiba” ÁLLÍTÁS, nem díszítés. Ha van bukott teszt, azt írjuk ki —
  // a hibát elhallgató főoldal rosszabb, mint a számot nem közlő.
  const hiba = sz.bukott === 0 ? "0 hiba" : `**${sz.bukott} HIBA**`;
  return [
    `> A regiszterben **${sz.valtozo} változó** áll, és **${sz.tesztek} teszt** fut, ${hiba}.`,
    `> A [tizennyolc lépésből](${LEPESFAJL}) **${sz.teljes} kész**,`,
    `> **${sz.reszben}-nél a gépi fele áll, az emberi nem** — aláírás, illetve klinikai olvasat.`,
  ].join("\n");
}

/**
 * A jelölők közti rész cseréje.
 *
 * HIÁNYZÓ JELÖLŐ ESETÉN HIBÁT DOB, nem hagyja némán változatlanul a fájlt. Egy
 * néma no-op itt pontosan azt a hamis biztonságot adná, ami ellen az egész
 * ellenőrzés épült: a `--check` zölden átmenne, miközben a számokat semmi nem
 * tartja naprakészen.
 */
export function blokkCsere(szoveg: string, blokk: string): string {
  // A SORVÉGET MEGŐRIZZÜK. Egy CRLF-es fájlba LF-fel visszaírt blokktól a
  // `--check` valódi tartalmi eltérés nélkül bukna el, az író ág pedig vegyes
  // sorvégű fájlt hagyna maga után — a következő ellenőrzés már átmenne rajta,
  // tehát a hiba egyszer felvillanna, aztán eltűnne. Az ilyen a legrosszabb fajta.
  const sorveg = szoveg.includes("\r\n") ? "\r\n" : "\n";
  const sorok = szoveg.split(/\r?\n/);

  // A BEÍRANDÓ BLOKK NEM TARTALMAZHAT JELÖLŐT. Enélkül egy hibás blokk némán
  // beírna egy második nyitójelölőt, és a hiba csak a KÖVETKEZŐ futáskor
  // derülne ki — akkor viszont már a fájlban áll.
  if (blokk.includes(NYIT) || blokk.includes(ZAR)) {
    throw new Error(
      `${FAJL}: a beírandó blokk maga is tartalmaz jelölőt. Ez a következő ` +
      `futásra elrontaná a fájlt, ezért most áll le.`);
  }

  /**
   * A JELÖLŐ EGÉSZ SOR, NEM RÉSZSZÖVEG.
   *
   * Ha részszövegként fogadnánk el, egy „<jelölő> 1875 teszt” alakú soron
   * elavult kézi szám maradhatna: a csere a jelölősorokat érintetlenül hagyja,
   * tehát a `--check` zölden átmenne fölötte. Épp az a hiba maradna
   * ellenőrizetlenül, ami miatt ez a fájl megszületett.
   *
   * A README-ben a jelölők idézetblokkban állnak, ezért a `> ` előtag
   * megengedett — de utána már csak a jelölő állhat.
   */
  const jeloloSor = (sor: string, jelolo: string) =>
    sor.replace(/^\s*>\s?/, "").trim() === jelolo;

  const hol = (jelolo: string, nev: string): number => {
    const talalatok = sorok
      .map((sor, i) => (jeloloSor(sor, jelolo) ? i : -1))
      .filter((i) => i >= 0);
    if (!talalatok.length) {
      const reszkent = sorok.some((sor) => sor.includes(jelolo));
      throw new Error(
        `${FAJL}: hiányzik a ${nev} jelölő (${jelolo}). A blokk így nem ` +
        `frissíthető — és némán átengedni rosszabb volna, mint elszállni.` +
        (reszkent
          ? ` (Egy soron SZEREPEL a jelölő, de nem egyedül áll rajta: ott ` +
            `egyéb szöveg is van. A jelölő legyen a sor teljes tartalma.)`
          : ""));
    }
    if (talalatok.length > 1) {
      throw new Error(
        `${FAJL}: a ${nev} jelölő ${talalatok.length}-szer szerepel, egyszer ` +
        `kellene. Nem tippelünk, melyiket kell cserélni.`);
    }
    return talalatok[0];
  };

  const nyit = hol(NYIT, "nyitó");
  const zar = hol(ZAR, "záró");
  if (zar <= nyit) {
    throw new Error(`${FAJL}: a záró jelölő a nyitó ELŐTT áll — a blokk nem értelmezhető.`);
  }
  // Az ÜRES blokk nulla sor, nem egy üres sor: a `"".split()` egyetlen üres
  // elemet adna, és attól a jelölők közé egy fölösleges üres sor kerülne.
  const blokkSorok = blokk === "" ? [] : blokk.split(/\r?\n/);
  return [...sorok.slice(0, nyit + 1), ...blokkSorok, ...sorok.slice(zar)].join(sorveg);
}

/** A számok összegyűjtése a forrásokból. */
export function szamokBeolvas(): Szamok {
  const reg = loadRegistry("registry/variables");
  const t = zoldTesztMerleg();
  const l = lepesAllas(readFileSync(LEPESFAJL, "utf8"));
  return {
    valtozo: reg.all().length,
    tesztek: t.tesztek,
    bukott: t.bukott,
    teljes: l.teljes,
    reszben: l.reszben,
  };
}

// Csak közvetlen futtatáskor ír fájlt: a tesztek IMPORTÁLJÁK ezt a modult, és
// egy import nem indíthat el se fájlírást, se teljes tesztfuttatást.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const eredeti = readFileSync(FAJL, "utf8");
  const sz = szamokBeolvas();
  const uj = blokkCsere(eredeti, allapotBlokk(sz));
  const jellemzo =
    `${sz.valtozo} változó, ${sz.tesztek} teszt, ${sz.bukott} hiba, ` +
    `${sz.teljes} kész lépés, ${sz.reszben} félkész`;

  if (process.argv.includes("--check")) {
    if (uj !== eredeti) {
      console.error(
        `✗ ${FAJL}: az állapotblokk elcsúszott a forrástól (${jellemzo}).\n` +
        `  Javítás: node tools/gen-readme-allapot.ts`);
      process.exit(1);
    }
    console.log(`✓ README állapotblokk naprakész (${jellemzo})`);
  } else {
    writeFileSync(FAJL, uj, "utf8");
    console.log(
      uj === eredeti
        ? `✓ ${FAJL}: az állapotblokk már naprakész volt (${jellemzo})`
        : `✓ ${FAJL}: az állapotblokk frissítve (${jellemzo})`);
  }
}
