/**
 * Ellenőrzi, hogy a generált dokumentumok egyeznek-e a forrásukkal.
 *
 *   npm run docs:check
 *
 * Enélkül a „generált" ígéret csak szándék: valaki kézzel szerkeszti a fájlt,
 * és a következő generálás némán felülírja. A `docs/14-allapot.md` pontosan
 * így csúszott el 891 változóra és 1694 tesztre, miközben 894 és 1875 volt az
 * igazság: elő volt állítva, de nem volt ellenőrizve.
 *
 * EGY DOKUMENTUM VISZONT NEM HASONLÍTHATÓ ÖSSZE MINDENHOL.
 *
 * Az állapotjelentés a TELJES fát számolja meg, a HELYBEN TELEPÜLŐ
 * regisztereket is (`registry/**\/helyi/`), amelyek licenc- vagy
 * adatvédelmi okból nem részei a terjesztett műnek. Egy friss klónban tehát
 * MÁS SZÁMOT ad — nem azért, mert valaki belenyúlt, hanem mert kevesebb
 * fájl van ott.
 *
 * A kettőt meg kell különböztetni, és a hiányt KI KELL MONDANI. Ha ilyenkor
 * hibát adnánk, a terjesztett repó `npm run check`-je hamisan bukna el; ha
 * csendben átengednénk, a „naprakész" állítás fedezet nélkül maradna. A
 * harmadik válasz a helyes: NEM MEGÁLLAPÍTHATÓ, és megmondjuk, miért.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface Generalt {
  gen: string;
  cel: string;
  /**
   * Igaz, ha a kimenet a helyben települő regiszterektől is függ. Ezeket egy
   * terjesztett klónban nem lehet összevetni — csak ott, ahol a helyi fák
   * telepítve vannak.
   */
  helyiFuggo?: boolean;
}

const GENERATED: Generalt[] = [
  { gen: "tools/gen-calc-doc.ts", cel: "docs/fejlesztes/07-kalkulatorok.md" },
  { gen: "tools/gen-field-catalog.ts", cel: "docs/fejlesztes/05-mezokatalogus.md" },
  { gen: "tools/gen-coverage.ts", cel: "docs/fejlesztes/11-lefedettseg.md" },
  { gen: "tools/gen-dontes-allokacio.ts", cel: "docs/fejlesztes/37-dontes-allokacio.md" },
  { gen: "tools/gen-allapot.ts", cel: "docs/14-allapot.md", helyiFuggo: true },
];

/** Telepítve van-e legalább egy helyben települő regiszterfa. */
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

let hiba = 0;
let ellenorizve = 0;
let kihagyva = 0;

for (const g of GENERATED) {
  if (g.helyiFuggo && !HELYI.length) {
    kihagyva++;
    console.log(`… ${g.cel} NEM MEGÁLLAPÍTHATÓ — a kimenet a helyben települő`);
    console.log(`  regiszterektől is függ, és ebben a fában egy sincs telepítve.`);
    console.log(`  Ez NEM „naprakész": itt nem lehet megállapítani. A fejlesztői`);
    console.log(`  fában, ahol a helyi fák megvannak, az ellenőrzés lefut.`);
    continue;
  }
  const fresh = execFileSync(process.execPath, [g.gen], { encoding: "utf8" });
  const onDisk = readFileSync(g.cel, "utf8");
  ellenorizve++;
  if (fresh.trimEnd() !== onDisk.trimEnd()) {
    console.error(`✗ ${g.cel} eltér a ${g.gen} kimenetétől.`);
    console.error(`  Javítás: node ${g.gen} > ${g.cel}`);
    if (g.helyiFuggo) {
      console.error(`  (Ez a dokumentum a helyi regiszterfáktól is függ. Telepítve:`);
      console.error(`   ${HELYI.join(", ")})`);
    }
    hiba++;
  } else {
    console.log(`✓ ${g.cel}`);
  }
}

if (hiba) process.exit(1);
console.log(
  `${ellenorizve} generált dokumentum naprakész` +
  (kihagyva ? `, ${kihagyva} nem megállapítható (nincs telepített helyi regiszterfa).` : "."),
);
