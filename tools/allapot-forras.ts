/**
 * A KÖZÖS SZÁMFORRÁS — amit a README és az állapotjelentés EGYARÁNT olvas.
 *
 * Ez a modul nem generál semmit; azt adja meg, HONNAN JÖN az igazság. Két
 * fogyasztója van (`gen-allapot.ts` és `gen-readme-allapot.ts`), és pontosan
 * azért egy modul, mert két másolatban tartva ugyanaz a kiolvasás előbb-utóbb
 * két különböző számot adna ugyanarra a kérdésre. Ebben a repóban ez már
 * megtörtént: a hiányjegyzék 51 tételt írt, a rendszer 73-at, mert a gyűjtés
 * két helyen volt leírva.
 *
 * ── A TESZTEK SZÁMA: MELYIK SOR AZ IGAZSÁG ──────────────────────────────
 *
 * A TAP-kimenet négy különböző számot ad, és NEM MINDEGY, melyiket olvassuk:
 *
 *     # tests N        ennyi teszt LÉTEZIK
 *     # pass  N − K    ennyi futott le sikeresen EBBEN a fában
 *     # fail  0
 *     # skipped K      ennyi maradt ki
 *
 * SZÁNDÉKOSAN NINCS ITT KONKRÉT SZÁM. Egy kommentbe írt darabszám ugyanaz a
 * hazug szám, mint a README-ben állt — csak nehezebb észrevenni, mert a
 * kommentet semmilyen ellenőrzés nem nézi.
 *
 * Korábban a `# pass` sort olvastuk. Az a szám a FÁTÓL FÜGG: ahol a helyben
 * települő regiszterek megvannak, ott eggyel több teszt fut le, mert a
 * telepített országos jegyzékre épülő teszt nem marad ki. A generált doksi
 * „Teszt” sora így valójában a sikeres futások számát mondta, két különböző
 * értékkel két fában.
 *
 * A `# tests` viszont MINDKÉT FÁBAN UGYANAZ: a kihagyott teszt is létező
 * teszt. A kihagyást nem eltüntetjük, hanem külön mondjuk ki (`kihagyott`) —
 * ahogy a rendszer máshol is külön állítás a „nem tudjuk” és a „nulla”.
 *
 * ── A RIPORTERT KIMONDJUK ───────────────────────────────────────────────
 *
 * A kiolvasás a `# tests` alakra épül, ami TAP. A `node --test`
 * alapértelmezett riportere a Node verziójától FÜGG — újabb Node-on csövön is
 * `spec`, ami `ℹ tests 1939`-et ír. Megadás nélkül ez a modul néma nullát
 * adna vissza. Ezért áll itt a `--test-reporter=tap` kiírva: a kimondatlan
 * alapértelmezés is döntés, csak nem a miénk.
 */
import { execFileSync } from "node:child_process";

export interface TesztMerleg {
  /** Ennyi teszt létezik. Fától FÜGGETLEN — a kihagyott teszt is teszt. */
  tesztek: number;
  /** Ennyi futott le sikeresen ebben a fában. Fától FÜGG. */
  sikeres: number;
  /** Bukott tesztek. */
  bukott: number;
  /** Kihagyott (`# SKIP`) tesztek — jellemzően telepítetlen helyi fa miatt. */
  kihagyott: number;
}

/**
 * FOLYAMATONKÉNTI gyorsítótár. A tesztfuttatás másodpercekbe telik, és egy
 * generálás során többször is kellhet — de a gyorsítótár SOHA nem frissül:
 * ezek az eszközök egyszer futó parancsok, nem hosszan élő szolgáltatások.
 * Ha valaha hosszú életű folyamatból hívnánk, ez a cache elavult mérleget adna.
 */
let gyorsitotar: TesztMerleg | null = null;

/**
 * A tesztek mérlege a futtatásból, nem becslésből.
 *
 * Ugyanazt a tesztválasztást futtatja, amit az `npm test`. Ha a kettő
 * eltérne, a README egy másik számot állítana, mint amit a fejlesztő lát.
 */
export function tesztMerleg(): TesztMerleg {
  if (gyorsitotar) return gyorsitotar;
  let ki: string;
  try {
    ki = execFileSync(process.execPath,
      ["--test", "--test-reporter=tap", "test/*.test.ts"],
      { encoding: "utf8", maxBuffer: 256e6, stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    // A bukott teszt NEM kivétel, hanem eredmény: a `node --test` ilyenkor
    // nem nulla kóddal lép ki, a kimenet viszont érvényes és kiolvasandó.
    const kimenet = (e as { stdout?: string }).stdout;
    if (typeof kimenet !== "string" || !kimenet.includes("# tests")) {
      throw new Error(
        `a tesztfuttatás nem indult el, így a tesztek száma nem állapítható meg: ${e}`);
    }
    ki = kimenet;
  }
  const szam = (kulcs: string): number => {
    const m = new RegExp(`^# ${kulcs} (\\d+)$`, "m").exec(ki);
    if (!m) {
      throw new Error(
        `a tesztfuttatás kimenetéből nem olvasható ki a „# ${kulcs}” sor ` +
        `(TAP-riporter kérve). A szám NEM nulla, hanem ismeretlen — inkább ` +
        `elszáll a generálás, mint hogy hamis számot írjon a doksiba.`);
    }
    return Number(m[1]);
  };
  const merleg: TesztMerleg = {
    tesztek: szam("tests"),
    sikeres: szam("pass"),
    bukott: szam("fail"),
    kihagyott: szam("skipped"),
  };
  // A NULLA TESZT NEM EREDMÉNY, HANEM TÜNET. A `node --test` egy semmire nem
  // illeszkedő mintára `# tests 0`-t ír és NULLÁVAL lép ki — egy elgépelt
  // glob, egy átnevezett könyvtár vagy egy elköltöztetett tesztfa mind ilyen.
  // Ezt elfogadva a README-be „0 teszt fut, 0 hiba” kerülne: pontosan az a
  // néma nulla, ami ellen ez az egész fájl épült.
  if (merleg.tesztek === 0) {
    throw new Error(
      "a tesztfuttatás NULLA tesztet talált a `test/*.test.ts` mintára. Ez nem " +
      "azt jelenti, hogy nincs tesztünk, hanem azt, hogy nem futott le semmi — " +
      "a minta, a könyvtár vagy a futtatás romlott el. A nulla itt tünet, nem adat.");
  }
  return (gyorsitotar = merleg);
}

/**
 * A mérleg, de KIZÁRÓLAG zöld futásból.
 *
 * Egy bukott teszt melletti darabszám nem állítás a rendszerről, hanem
 * törmelék: ha egy modul betöltése száll el, a fájl későbbi tesztjei be sem
 * regisztrálódnak, tehát a `# tests` már nem „a létező tesztek száma”. A
 * generált dokumentumok ezért NEM készülnek el piros fán — inkább nem
 * számolunk, mint rosszul.
 *
 * A nyers `tesztMerleg()` továbbra is visszaadja a bukást (az a README-blokk
 * dolga, hogy ki tudja írni); a generátorok ezt a szigorúbb kaput használják.
 */
export function zoldTesztMerleg(): TesztMerleg {
  const m = tesztMerleg();
  if (m.bukott > 0) {
    throw new Error(
      `a tesztfuttatás ${m.bukott} hibával zárult, ezért a generálás leáll. Egy ` +
      `piros fából származó darabszám nem a rendszerről szól, hanem a törésről — ` +
      `előbb a tesztek, utána a dokumentáció.`);
  }
  return m;
}

export interface Lepes {
  szam: number;
  cim: string;
  /** Az állapotjelölés a cím utáni idézetblokk első félkövér mondatából. */
  jelzes: string | null;
}

export interface LepesAllas {
  lepesek: Lepes[];
  /** „MEGVAN”-nal KEZDŐDŐ jelzés: a lépés egésze kész. */
  teljes: number;
  /** A jelzés tartalmazza a „MEGVAN”-t, de nem azzal kezdődik: a gépi fele áll. */
  reszben: number;
}

/**
 * A tizennyolc lépés állása a lépésdokumentum SZÖVEGÉBŐL kiolvasva.
 *
 * A „MEGVAN” és a „gépi fele MEGVAN” KÉT KÜLÖNBÖZŐ ÁLLAPOT. Egybeszámolva a
 * jelentés többet állítana, mint amennyi igaz: a 3. és az 5. lépés emberi
 * felére a gép egyetlen sort sem tud hozzátenni.
 *
 * A függvény szöveget kap, nem fájlnevet — így tesztelhető anélkül, hogy a
 * valódi dokumentum tartalmához kötnénk az elvárást.
 */
export function lepesAllas(szoveg: string): LepesAllas {
  const lepesek: Lepes[] = [...szoveg.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => {
    // A cím utáni idézetblokk a lépés állapota; az első félkövér mondat a jelölés.
    const utan = szoveg.slice(m.index! + m[0].length, m.index! + m[0].length + 900);
    const jelzes = /^\s*>\s+\*\*([^*]+)\*\*/m.exec(utan)?.[1]?.replace(/[.:]\s*$/, "");
    return { szam: Number(m[1]), cim: m[2], jelzes: jelzes ?? null };
  });
  return {
    lepesek,
    teljes: lepesek.filter((l) => /^MEGVAN/.test(l.jelzes ?? "")).length,
    reszben: lepesek.filter(
      (l) => l.jelzes && /MEGVAN/.test(l.jelzes) && !/^MEGVAN/.test(l.jelzes)).length,
  };
}
