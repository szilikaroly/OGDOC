/**
 * AZ ÉLES ÜZEM KAPUJA — egyetlen kapcsoló helyett ELLENŐRIZHETŐ FELTÉTELEK.
 *
 * Eddig egy környezeti változó (`OGDOC_SYNTHETIC=1`) állt a kiszolgáló előtt,
 * és a magyarázata egyetlen mondat volt: „nincs hitelesítés”. A hitelesítés
 * most megvan — de ebből NEM következik, hogy a kapu felesleges lett.
 *
 * A KAPU LECSERÉLÉSE EGYETLEN FELTÉTEL TELJESÜLÉSEKOR AZ A HIBA, AMI ELLEN
 * AZ EGÉSZ RENDSZER ÉPÜL: a részleges megoldást teljesnek mondani. A
 * jelszavas belépés megszünteti azt, hogy bárki egy fejléccel bárkinek
 * kiadhassa magát — de nem ad második tényezőt, nem titkosítja a kapcsolatot,
 * és nem cseréli le az alapértelmezett rendszergazdai jelszót.
 *
 * Ezért a kapu mostantól FELTÉTELLISTA. Mindegyik feltételnek van állapota,
 * és mindegyik MEGMONDJA, mi hiányzik és kinél áll. A kiszolgáló akkor indul
 * éles módban, ha MIND teljesül — addig szintetikus módban fut, és kiírja,
 * pontosan hol tart.
 *
 * A KÜLÖNBSÉG A RÉGIHEZ KÉPEST: a régi kapu egy IGEN/NEM volt, amit egy
 * környezeti változó billentett. Ez itt mérőeszköz: látszik rajta a haladás,
 * és látszik rajta, mi az, ami NEM fejlesztői feladat.
 */
import type { SzolgaltatoKeszlet } from "./szolgaltato.ts";
import type { FelhasznaloTar } from "./felhasznalo.ts";
import { alapertelmezettJelszoAll } from "./felhasznalo.ts";

export type FeltetelAllapot = "all" | "hianyzik" | "nemMegallapithato";

export interface Feltetel {
  id: string;
  cim: string;
  allapot: FeltetelAllapot;
  /** Fejlesztői feladat-e. Ha nem, a „majd megcsináljuk” hamis ígéret. */
  fejlesztoi: boolean;
  miert: string;
  /** Mi kell hozzá. Üres csak akkor, ha áll. */
  mihez: string[];
}

export interface KapuItelet {
  /** Éles üzemre kész-e MINDEN feltétel. */
  elesRe: boolean;
  /** Szintetikus módban futhat-e (ehhez az `OGDOC_SYNTHETIC=1` kell). */
  szintetikus: boolean;
  feltetelek: Feltetel[];
  all: number;
  hianyzik: number;
  osszefoglalo: string;
}

export interface KapuBemenet {
  env: NodeJS.ProcessEnv;
  szolgaltatok: SzolgaltatoKeszlet;
  tar: FelhasznaloTar | null;
}

export function kapu(b: KapuBemenet): KapuItelet {
  const f: Feltetel[] = [];

  /* 1. HITELESÍTÉS — ez volt a megnevezett blokkoló. */
  const mukodo = b.szolgaltatok.szolgaltatok.filter((s) => s.allapot === "mukodik");
  f.push({
    id: "hitelesites", cim: "A cselekvő kilétét ellenőrzés igazolja",
    allapot: mukodo.length ? "all" : "hianyzik",
    fejlesztoi: true,
    miert: mukodo.length
      ? `${mukodo.length} működő szolgáltató (${mukodo.map((s) => s.nev).join(", ")}). ` +
        `A cselekvőt már nem egy ellenőrizetlen kérésfejléc állítja.`
      : `Egyetlen működő hitelesítési szolgáltató sincs.`,
    mihez: mukodo.length ? [] : ["legalább egy működő hitelesítési szolgáltató"],
  });

  /* 2. AZ ALAPÉRTELMEZETT JELSZÓ. A világ legismertebb hitelesítő adata. */
  const alap = b.tar ? alapertelmezettJelszoAll(b.tar) : false;
  f.push({
    id: "alapertelmezettJelszo", cim: "Nem áll alapértelmezett rendszergazdai jelszó",
    allapot: b.tar ? (alap ? "hianyzik" : "all") : "nemMegallapithato",
    fejlesztoi: false,
    miert: !b.tar
      ? `Nincs felhasználótár, tehát nem állapítható meg. A „nem tudjuk” itt nem „rendben”.`
      : alap
      ? `Az „admin” fiók jelszava még mindig „admin”. Ez a világ legismertebb ` +
        `hitelesítő adata: éles rendszerben azonnali kompromittálódás. Helyi, ` +
        `szintetikus futtatásnál elfogadható — de akkor is látszania kell.`
      : `Az alapértelmezett jelszó le van cserélve.`,
    mihez: alap ? ["az „admin” fiók jelszavának lecserélése"] : [],
  });

  /* 3. TITKOSÍTOTT KAPCSOLAT. A kiszolgáló nyílt HTTP-t beszél. */
  const tls = b.env.OGDOC_TLS === "1";
  f.push({
    id: "tls", cim: "A kapcsolat titkosított",
    allapot: tls ? "all" : "hianyzik",
    fejlesztoi: false,
    miert: tls
      ? `Az üzemeltető kijelentette (OGDOC_TLS=1), hogy TLS-t lezáró fordított ` +
        `proxy áll a kiszolgáló előtt. A rendszer ezt NEM tudja ellenőrizni — ` +
        `ez az üzemeltető állítása, nem mérés.`
      : `A kiszolgáló nyílt HTTP-t beszél. A jelszó és a munkamenet-azonosító ` +
        `így olvasható a hálózaton, és a legjobb jelszószabály sem véd ellene.`,
    mihez: tls ? [] : ["TLS-t lezáró fordított proxy (nginx, Caddy) és tanúsítvány"],
  });

  /* 4. MÁSODIK TÉNYEZŐ. Nem fejlesztői feladat: eszköz és eljárás kell hozzá. */
  const ket = mukodo.some((s) => s.ketTenyezos);
  f.push({
    id: "ketTenyezo", cim: "Van második tényező",
    allapot: ket ? "all" : "hianyzik",
    fejlesztoi: false,
    miert: ket
      ? `${mukodo.filter((s) => s.ketTenyezos).map((s) => s.nev).join(", ")}.`
      : `Egyetlen működő szolgáltató sem ad második tényezőt. A jelszó egyedül ` +
        `kiszivárogtatható, és a kiszivárgásról a felhasználó nem szerez tudomást.`,
    mihez: ket ? [] : [
      "EESZT- vagy eduID-csatlakozás (mindkettő ad második tényezőt)",
      "vagy intézményi MFA (TOTP, kártya) és a hozzá tartozó eljárásrend",
    ],
  });

  /* 5. A KULCSTÁR. A titkosítás annyit ér, amennyit a kulcs tárolása. */
  const hsm = b.env.OGDOC_KEYSTORE === "hsm" || b.env.OGDOC_KEYSTORE === "kms";
  f.push({
    id: "kulcstar", cim: "A kulcs nem az adat mellett áll",
    allapot: hsm ? "all" : "hianyzik",
    fejlesztoi: false,
    miert: hsm
      ? `A kulcstár: ${b.env.OGDOC_KEYSTORE}.`
      : `A kulcsok a rejtjelezett adat MELLETT állnak. Így a titkosítás a ` +
        `lemez elvesztése ellen véd, a kiszolgáló feltörése ellen nem — aki a ` +
        `fájlokhoz hozzáfér, a kulcshoz is.`,
    mihez: hsm ? [] : ["HSM vagy KMS a `KeyStore` mögé (OGDOC_KEYSTORE=hsm|kms)"],
  });

  const all = f.filter((x) => x.allapot === "all").length;
  const hianyzik = f.length - all;
  return {
    elesRe: hianyzik === 0,
    szintetikus: b.env.OGDOC_SYNTHETIC === "1",
    feltetelek: f, all, hianyzik,
    osszefoglalo: `${all}/${f.length} feltétel áll` +
      (hianyzik ? ` — ${hianyzik} hiányzik (${f.filter((x) => x.allapot !== "all")
        .filter((x) => !x.fejlesztoi).length} nem fejlesztői feladat)` : ""),
  };
}

/** Az indulási üzenet — vagy `null`, ha indulhat. */
export function indulhat(i: KapuItelet): string | null {
  if (i.elesRe) return null;
  if (i.szintetikus) return null;
  const sorok = [
    "A kiszolgáló nem indul el.",
    "",
    `ÉLES ÜZEMRE ${i.all}/${i.feltetelek.length} FELTÉTEL ÁLL.`,
    "",
  ];
  for (const f of i.feltetelek) {
    const jel = f.allapot === "all" ? "✓" : f.allapot === "hianyzik" ? "✗" : "?";
    sorok.push(`  ${jel} ${f.cim}${f.allapot !== "all" && !f.fejlesztoi ? "  [nem fejlesztői feladat]" : ""}`);
    sorok.push(`      ${f.miert}`);
    for (const m of f.mihez) sorok.push(`      kell hozzá: ${m}`);
    sorok.push("");
  }
  sorok.push(
    "Szintetikus adattal futtatható, ha ezt tudomásul veszed:",
    "",
    "    OGDOC_SYNTHETIC=1 npm run web",
    "",
  );
  return sorok.join("\n");
}
