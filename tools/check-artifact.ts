/**
 * AZ ARTIFACT SZÁMAI EGYEZNEK-E A RENDSZERÉVEL.
 *
 *   npm run artifact:check
 *
 * MIÉRT KELL EZ. A bemutató HTML-je kézzel karbantartott, a számai viszont a
 * rendszerről szólnak — és a kettő KÉTSZER csúszott szét ebben a projektben:
 *
 *   · a lefedettségi mondat azt írta, hogy „894 változó a tervezett ~894-ből”,
 *     vagyis 100%-ot mutatott ott, ahol 22,4% az igazság. A „tervezett” számot
 *     valaki egyszer a pillanatnyi állapothoz igazította, onnantól a hányados
 *     szükségszerűen 1 lett;
 *   · a hiányjegyzék 51 tételt írt, miközben a rendszer 73-at mondott, mert a
 *     gyűjtés két helyen volt leírva, külön másolatban.
 *
 * Mindkettő ugyanaz: EGY SZÁM, AMIT SENKI NEM ELLENŐRIZ, ELCSÚSZIK. Ez a
 * generált dokumentumokra régóta igaz (`docs:check`), a bemutatóra eddig nem.
 *
 * A SZERZŐDÉS: ha a bemutató élő számot állít, JELÖLJE MEG.
 *
 *     <b data-szam="valtozo">905</b> változó a regiszterben
 *
 * Amit nem jelölnek meg, arra az ellenőrzés nem terjed ki — és a záró sor
 * kimondja, hány számot ellenőrzött. A „0 eltérés” önmagában nem elég állítás:
 * nulla megjelölt szám mellett is nulla az eltérés.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const HTML = "docs/artifact/ogdoc.html";
const html = readFileSync(HTML, "utf8");
const adat = JSON.parse(execFileSync(process.execPath,
  ["--experimental-strip-types", "tools/gen-artifact.ts"],
  { encoding: "utf8", maxBuffer: 64e6 }));

/**
 * A HELYBEN TELEPÜLŐ REGISZTERFÁK. Ugyanaz a felderítés, mint a
 * `check-generated.ts`-ben — és ugyanazért.
 */
function helyiFakTelepitve(): string[] {
  const gyoker = "registry";
  if (!existsSync(gyoker)) return [];
  const meg: string[] = [];
  const jar = (ut: string, melyseg: number) => {
    if (melyseg > 3) return;
    for (const e of readdirSync(ut, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const teljes = join(ut, e.name);
      if (e.name === "helyi") {
        if (readdirSync(teljes).length) meg.push(teljes);
      } else {
        jar(teljes, melyseg + 1);
      }
    }
  };
  jar(gyoker, 0);
  return meg.sort();
}
const HELYI = helyiFakTelepitve();

/**
 * AMI A HELYI FÁKTÓL IS FÜGG — és ezért egy terjesztett klónban NEM
 * ÖSSZEVETHETŐ.
 *
 * A bemutató számai a FEJLESZTŐI fában készültek, ahol a licenc- vagy
 * méretkorlát miatt helyben települő regiszterek megvannak. Egy tiszta klónban
 * ezek hiányoznak, tehát a rendszer kevesebbet mond — de ettől a bemutató még
 * nem hazudik, csak mást mértünk.
 *
 *   · `regiszterFajl` — a `registry/**\/*.json` darabszáma, és a helyi fák
 *     ide települnek;
 *   · `teszt` — a telepített országos jegyzékre épülő teszt helyi fa nélkül
 *     KIMARAD (`# SKIP`), tehát a sikeres tesztek száma eggyel kevesebb.
 *
 * ITT A HARMADIK VÁLASZ A HELYES. Ha ilyenkor „eltérést” jelentenénk, a
 * checker minden tiszta klónban hibát kiáltana ott, ahol nincs; ha viszont
 * „naprakész”-t írnánk, olyat állítanánk, amit nem mértünk meg. A helyes
 * válasz: NEM MEGÁLLAPÍTHATÓ, és megmondjuk, miért — pontosan úgy, ahogy a
 * `check-generated.ts` teszi a `docs/14-allapot.md`-vel.
 */
const HELYIFUGGO = new Set(["regiszterFajl", "teszt"]);

/** Honnan jön az egyes megjelölt számok igazsága. */
const FORRAS: Record<string, () => number> = {
  valtozo: () => adat.szamok.valtozo,
  modul: () => adat.szamok.modul,
  magSor: () => adat.szamok.magSor,
  magFajl: () => adat.szamok.magFajl,
  tesztFajl: () => adat.szamok.tesztFajl,
  doksiFajl: () => adat.szamok.doksiFajl,
  doksiSor: () => adat.szamok.doksiSor,
  regiszterFajl: () => adat.szamok.regiszterFajl,
  hiany: () => adat.hianyMerleg.osszes,
  blokkolo: () => adat.hianyMerleg.blokkolo,
  szervezeti: () => adat.hianyMerleg.szervezeti,
  fejlesztoi: () => adat.hianyMerleg.fejlesztoi,
  figyelmeztetes: () => (adat.figyelmeztetesek ?? []).length,
  // A TESZTEK SZÁMA a futtatásból jön, nem a fájlokból: a tesztfájlok száma és
  // a tesztek száma két különböző dolog, és a bemutató az utóbbit állítja.
  teszt: () => tesztSzam(),
};

let tesztGyorsitotar: number | null = null;
function tesztSzam(): number {
  if (tesztGyorsitotar !== null) return tesztGyorsitotar;
  // UGYANAZ A TESZTVÁLASZTÁS, AMIT AZ `npm test` FUTTAT. Ha a kettő eltérne, a
  // bemutató egy másik számot állítana, mint amit a fejlesztő lát — és épp az
  // ilyen apró eltérésekből lesz a hazug szám.
  //
  // A RIPORTERT KIMONDJUK. Korábban nem volt megadva, a kiolvasás viszont a
  // `# pass` sorra épült — ami TAP-alak. A `node --test` alapértelmezett
  // riportere a Node verziójától függ: újabb Node-on csővezetéken is `spec`,
  // ami `ℹ pass 1938` alakot ír, nem `# pass 1938`-at. Ettől ez az ellenőrzés
  // minden 22-nél újabb Node-on elszállt — a rendszer hibája nélkül.
  //
  // A tanulság ugyanaz, ami az egész fájlé: AMIT NEM MONDUNK KI, AZ ELCSÚSZIK.
  // A kimondatlan alapértelmezés is döntés — csak nem a miénk.
  const ki = execFileSync(process.execPath,
    ["--test", "--test-reporter=tap", "test/*.test.ts"],
    { encoding: "utf8", maxBuffer: 256e6, stdio: ["ignore", "pipe", "ignore"] });
  const m = /^# pass (\d+)$/m.exec(ki);
  if (!m) throw new Error("a tesztfuttatás kimenetéből nem olvasható ki a „# pass” sor");
  return (tesztGyorsitotar = Number(m[1]));
}

/** `<b data-szam="x">1 234</b>` → { x, 1234 }. A szóköz ezresjel. */
const jelolt = [...html.matchAll(/data-szam="([a-zA-Z]+)"[^>]*>([\d   ]+)</g)]
  .map(([, kulcs, ertek]) => ({ kulcs, ertek: Number(ertek.replace(/[^\d]/gu, "")) }));

if (!jelolt.length) {
  console.error(
    `✗ ${HTML}: EGYETLEN MEGJELÖLT SZÁM SINCS. Az ellenőrzés így mindig átmenne, ` +
    `és ez rosszabb, mintha nem volna — hamis biztonságot ad.`);
  process.exit(1);
}

let hiba = 0;
let nemMegallapithato = 0;
const latott = new Set<string>();
for (const { kulcs, ertek } of jelolt) {
  const f = FORRAS[kulcs];
  if (!f) {
    console.error(
      `✗ ismeretlen jelölés: data-szam="${kulcs}". Vagy elgépelés, vagy új szám, ` +
      `amihez nincs forrás megnevezve — mindkettő javítandó.`);
    hiba++; continue;
  }
  // A HELYIFÜGGŐ SZÁMOT NEM MÉRJÜK MEG ROSSZUL — inkább kimondjuk, hogy itt
  // nem mérhető. A `f()` hívása is elmarad: a `teszt` egy teljes tesztfuttatás,
  // aminek az eredményét úgyis eldobnánk.
  if (HELYIFUGGO.has(kulcs) && !HELYI.length) {
    nemMegallapithato++;
    console.log(
      `… ${kulcs} NEM MEGÁLLAPÍTHATÓ — ez a szám a helyben települő ` +
      `regiszterektől is függ, és ebben a fában egy sincs telepítve. ` +
      `A bemutató ${ertek}-t ír; ez itt NEM cáfolható és NEM igazolható.`);
    continue;
  }
  const igaz = f();
  latott.add(kulcs);
  if (ertek !== igaz) {
    console.error(`✗ ${kulcs}: a bemutató ${ertek}-t ír, a rendszer ${igaz}-t mond.`);
    if (HELYIFUGGO.has(kulcs)) {
      console.error(`  (Ez a szám a helyi regiszterfáktól is függ. Telepítve: ${HELYI.join(", ")})`);
    }
    hiba++;
  } else {
    console.log(`✓ ${kulcs} = ${igaz}`);
  }
}

if (hiba) {
  console.error(
    `\n${hiba} eltérés. A bemutató számai a rendszerről szólnak — ha elcsúsznak, a ` +
    `bemutató épp arról hazudik, amiről a legpontosabbnak kellene lennie.`);
  process.exit(1);
}
// A ZÁRÓ SOR KIMONDJA, HÁNY SZÁMOT ELLENŐRZÖTT — és hányat nem tudott. A
// „0 eltérés” önmagában nem elég állítás; a nem megállapítható tételt
// elhallgatni ugyanaz a hiba volna, mint naprakésznek mondani.
console.log(
  `\n${jelolt.length - nemMegallapithato} megjelölt szám (${latott.size} különböző) naprakész` +
  (nemMegallapithato
    ? `, ${nemMegallapithato} nem megállapítható (nincs telepített helyi regiszterfa).`
    : "."));
