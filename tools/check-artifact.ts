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
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const HTML = "docs/artifact/ogdoc.html";
const html = readFileSync(HTML, "utf8");
const adat = JSON.parse(execFileSync(process.execPath,
  ["--experimental-strip-types", "tools/gen-artifact.ts"],
  { encoding: "utf8", maxBuffer: 64e6 }));

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
  // UGYANAZ A HÍVÁS, AMIT AZ `npm test` FUTTAT. Ha a kettő eltérne, a bemutató
  // egy másik számot állítana, mint amit a fejlesztő lát — és épp az ilyen
  // apró eltérésekből lesz a hazug szám.
  const ki = execFileSync(process.execPath, ["--test", "test/*.test.ts"],
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
const latott = new Set<string>();
for (const { kulcs, ertek } of jelolt) {
  const f = FORRAS[kulcs];
  if (!f) {
    console.error(
      `✗ ismeretlen jelölés: data-szam="${kulcs}". Vagy elgépelés, vagy új szám, ` +
      `amihez nincs forrás megnevezve — mindkettő javítandó.`);
    hiba++; continue;
  }
  const igaz = f();
  latott.add(kulcs);
  if (ertek !== igaz) {
    console.error(`✗ ${kulcs}: a bemutató ${ertek}-t ír, a rendszer ${igaz}-t mond.`);
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
console.log(`\n${jelolt.length} megjelölt szám (${latott.size} különböző) naprakész.`);
