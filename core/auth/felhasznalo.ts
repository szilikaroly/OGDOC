/**
 * FELHASZNÁLÓK ÉS BEJELENTKEZÉS.
 *
 * A ZÁROLÁS HELYETT FÉKEZÉS — mert a zárolás maga a támadás.
 *
 * A megszokott szabály: öt hibás jelszó után a fiók zárolva. Ez éles üzemben
 * azt jelenti, hogy a támadónak nem kell BEJUTNIA — elég ötször hibásan
 * próbálkoznia az ügyeletes orvos nevével hajnali háromkor, és az illető nem
 * fér hozzá a rendszerhez. Egy kórházban ez nem kellemetlenség, hanem
 * betegellátási kockázat.
 *
 * Ezért a rendszer FÉKEZ, nem zár: minden sikertelen kísérlet után nő a
 * kivárás, de a fiók magától újra elérhetővé válik. A zárolás megmarad —
 * de csak KÉZI művelet, megnevezett emberrel és indokkal.
 *
 * AZ ISMERETLEN NÉV UGYANANNYI IDEIG TART. A `jelszo.arnyekEllenorzes()` a
 * nem létező felhasználóra is lefuttatja a scrypt-et. Enélkül a válaszidő
 * megmondaná, ki dolgozik itt — és egy kórházban a névsor önmagában is adat.
 *
 * A HIBAÜZENET NEM ÁRULJA EL, MELYIK FÉL VOLT ROSSZ. „Hibás felhasználónév
 * vagy jelszó” — egyetlen szöveg mindkét esetre. A megkülönböztetés
 * felhasználó-felsoroló orákulum.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { arnyekEllenorzes, egyezik, hasheld, jelszoItelet, ujrahashelendo } from "./jelszo.ts";

/* ── A FELHASZNÁLÓ ───────────────────────────────────────────────────── */

export type FelhasznaloAllapot =
  | "aktiv"
  /** KÉZZEL zárolt, megnevezett emberrel és indokkal. Nem a rendszer zárolta. */
  | "zarolt"
  /** Kilépett; a fiók megmarad az auditnapló miatt, de nem lép be. */
  | "megszunt";

export interface Felhasznalo {
  id: string;
  /** Bejelentkezési név. Kis-nagybetűre nem érzékeny. */
  felhasznalonev: string;
  nev: string;
  /** scrypt lenyomat. SOHA nem hagyja el a kiszolgálót. */
  jelszo: string;
  allapot: FelhasznaloAllapot;
  /** Mikor kell jelszót cserélnie, mert a mostani bootstrap vagy kiosztott. */
  jelszotCserelni: boolean;
  letrehozva: string;
  utolsoBelepes: string | null;
  /** Sikertelen kísérletek a legutóbbi siker óta — a fékezés ebből számol. */
  sikertelen: number;
  utolsoSikertelen: string | null;
  /** Ha zárolt: ki és miért. „A rendszer” nem személy. */
  zarolas?: { ki: string; mikor: string; miert: string };
  /** Melyik szolgáltató hitelesíti. A helyi jelszó csak az egyik. */
  szolgaltato: "helyi" | "eeszt" | "eduid" | "intezmenyi";
  /** Külső szolgáltatónál: az ottani azonosító. */
  kulsoAzonosito?: string;
  email?: string;
  /** Pecsétszám / működési nyilvántartási szám — a klinikai szerepkörhöz. */
  pecsetszam?: string;
}

export interface FelhasznaloTar {
  verzio: 1;
  felhasznalok: Felhasznalo[];
}

/* ── FÉKEZÉS ─────────────────────────────────────────────────────────── */

/**
 * MENNYIT KELL VÁRNI a következő próbálkozásig.
 *
 * Az első három kísérlet szabad — az elgépelés nem támadás. Utána
 * megduplázódó kivárás, felső korláttal: 4. → 1 mp, 5. → 2 mp, … 12. → 256 mp.
 * A felső korlát azért kell, hogy a fiók magától visszatérjen; korlát nélkül a
 * fékezés csendben zárolássá válna.
 */
export const SZABAD_KISERLET = 3;
export const FEK_MAX_MP = 256;

export function fekMp(sikertelen: number): number {
  if (sikertelen <= SZABAD_KISERLET) return 0;
  return Math.min(FEK_MAX_MP, 2 ** (sikertelen - SZABAD_KISERLET - 1));
}

export function fekLejar(f: Felhasznalo): number {
  if (!f.utolsoSikertelen) return 0;
  return Date.parse(f.utolsoSikertelen) + fekMp(f.sikertelen) * 1000;
}

/* ── A BEJELENTKEZÉS ─────────────────────────────────────────────────── */

export type BelepesAllapot =
  | "belepett"
  /** Hibás név VAGY jelszó — a kettő szándékosan nem különböztethető meg. */
  | "hibas"
  /** Fékezés alatt: a kivárás még nem telt le. */
  | "fekezve"
  /** Kézzel zárolt fiók. */
  | "zarolt"
  /** Megszűnt fiók. */
  | "megszunt"
  /** Belépett, de a jelszót cserélni KELL, mielőtt bármi mást tehetne. */
  | "jelszotCserelni"
  /** A felhasználót külső szolgáltató hitelesíti — helyi jelszóval nem lép be. */
  | "kulsoSzolgaltato";

export interface BelepesEredmeny {
  allapot: BelepesAllapot;
  felhasznalo: Felhasznalo | null;
  /** Fékezésnél: hány másodperc múlva próbálkozhat újra. */
  varakozasMp?: number;
  miert: string;
}

const HIBAS_SZOVEG =
  "Hibás felhasználónév vagy jelszó. A rendszer SZÁNDÉKOSAN nem mondja meg, " +
  "melyik volt rossz: a megkülönböztetésből meg lehetne tudni, ki dolgozik itt, " +
  "és egy kórházban a névsor önmagában is adat.";

export function keres(tar: FelhasznaloTar, nev: string): Felhasznalo | undefined {
  const n = nev.trim().toLowerCase();
  return tar.felhasznalok.find((f) => f.felhasznalonev.toLowerCase() === n);
}

/**
 * BELÉPÉS. A `tar` MÓDOSUL: a kísérletszám és az időbélyeg a tárba kerül.
 */
export function belep(
  tar: FelhasznaloTar, nev: string, jelszo: string, most: string,
): BelepesEredmeny {
  const f = keres(tar, nev);
  if (!f) {
    // AZONOS KÖLTSÉGŰ ÁRNYÉK-ELLENŐRZÉS. Nem elfelejtett ág.
    arnyekEllenorzes(jelszo);
    return { allapot: "hibas", felhasznalo: null, miert: HIBAS_SZOVEG };
  }
  if (f.allapot === "megszunt") {
    arnyekEllenorzes(jelszo);
    return { allapot: "megszunt", felhasznalo: null,
      miert: "A fiók megszűnt. A megszűnt fiók megmarad az auditnapló miatt, de nem lép be." };
  }
  if (f.allapot === "zarolt") {
    arnyekEllenorzes(jelszo);
    return { allapot: "zarolt", felhasznalo: null,
      miert:
        `A fiókot ${f.zarolas?.ki ?? "ismeretlen"} zárolta ` +
        `(${f.zarolas?.mikor ?? "?"}): ${f.zarolas?.miert ?? "indok nincs rögzítve"}. ` +
        `A zárolás KÉZI művelet — a rendszer magától nem zár, csak fékez.` };
  }
  if (f.szolgaltato !== "helyi") {
    arnyekEllenorzes(jelszo);
    return { allapot: "kulsoSzolgaltato", felhasznalo: null,
      miert:
        `Ezt a felhasználót a(z) „${f.szolgaltato}” szolgáltató hitelesíti, ` +
        `helyi jelszóval nem lép be. Ha a külső szolgáltató nem érhető el, az ` +
        `NEM ok arra, hogy helyi jelszóra essünk vissza — a visszaesés csendben ` +
        `gyengítené a hitelesítést.` };
  }
  const lejar = fekLejar(f);
  const t = Date.parse(most);
  if (t < lejar) {
    arnyekEllenorzes(jelszo);
    const mp = Math.ceil((lejar - t) / 1000);
    return { allapot: "fekezve", felhasznalo: null, varakozasMp: mp,
      miert:
        `Túl sok sikertelen kísérlet — várj ${mp} másodpercet. A rendszer FÉKEZ, ` +
        `nem ZÁR: a zárolás maga volna a támadás, mert elég volna ötször hibásan ` +
        `próbálkozni az ügyeletes nevével ahhoz, hogy ne férjen a rendszerhez.` };
  }
  if (!egyezik(jelszo, f.jelszo)) {
    f.sikertelen += 1;
    f.utolsoSikertelen = most;
    return { allapot: "hibas", felhasznalo: null,
      miert: HIBAS_SZOVEG +
        (fekMp(f.sikertelen) > 0
          ? ` A következő próbálkozásig ${fekMp(f.sikertelen)} másodperc.` : "") };
  }
  f.sikertelen = 0;
  f.utolsoSikertelen = null;
  f.utolsoBelepes = most;
  // A HELYES BELÉPÉS AZ EGYETLEN PILLANAT, amikor a nyílt jelszó megvan:
  // ha a lenyomat gyengébb paraméterekkel készült, most kell frissíteni.
  if (ujrahashelendo(f.jelszo)) f.jelszo = hasheld(jelszo);

  if (f.jelszotCserelni) {
    return { allapot: "jelszotCserelni", felhasznalo: f,
      miert:
        `A jelszó helyes, de CSERÉLNI KELL, mielőtt bármi mást tennél. Ez a ` +
        `jelszó kiosztott vagy alapértelmezett — amíg érvényben van, a fiók ` +
        `annyit ér, amennyit a kiosztás csatornája.` };
  }
  return { allapot: "belepett", felhasznalo: f, miert: `Belépett: ${f.nev}.` };
}

/* ── JELSZÓCSERE ─────────────────────────────────────────────────────── */

export interface CsereEredmeny { ok: boolean; miert: string }

export function jelszotCserel(
  f: Felhasznalo, regi: string, uj: string, most: string,
): CsereEredmeny {
  if (!egyezik(regi, f.jelszo)) {
    arnyekEllenorzes(uj);
    return { ok: false, miert: "A jelenlegi jelszó nem egyezik." };
  }
  return jelszotBeallit(f, uj, most);
}

export function jelszotBeallit(f: Felhasznalo, uj: string, most: string): CsereEredmeny {
  const i = jelszoItelet(uj, [f.felhasznalonev, f.nev, f.email ?? ""].filter(Boolean));
  if (!i.megfelel) return { ok: false, miert: i.miert };
  if (egyezik(uj, f.jelszo)) {
    return { ok: false, miert: "Az új jelszó megegyezik a régivel." };
  }
  f.jelszo = hasheld(uj);
  f.jelszotCserelni = false;
  f.sikertelen = 0;
  f.utolsoSikertelen = null;
  void most;
  return { ok: true, miert: "A jelszó megváltozott." };
}

/* ── A TÁR ───────────────────────────────────────────────────────────── */

export function loadTar(path: string): FelhasznaloTar | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as FelhasznaloTar;
}

export function saveTar(path: string, tar: FelhasznaloTar): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(tar, null, 1) + "\n", { mode: 0o600 });
}

/* ── BOOTSTRAP ───────────────────────────────────────────────────────── */

export const BOOTSTRAP_NEV = "admin";
export const BOOTSTRAP_JELSZO = "admin";

/**
 * AZ ELSŐ RENDSZERGAZDA — és miért kiabál róla a rendszer.
 *
 * Az `admin:admin` a világ legismertebb hitelesítő adata. Helyi, szintetikus
 * futtatásnál elfogadható, éles rendszerben azonnali kompromittálódás. A
 * különbséget nem elrejteni kell, hanem KIMONDANI:
 *
 *   · a fiók `jelszotCserelni: true` jelöléssel jön létre, tehát a belépés
 *     után az első dolga a csere;
 *   · a jelszószabály ezt a jelszót ELUTASÍTANÁ (5 karakter, tiltólistás),
 *     ezért a bootstrap KIKERÜLI a szabályt — és ez a kikerülés jelölve van;
 *   · a kiszolgáló minden indításkor kiírja, amíg a jelszó változatlan.
 *
 * A `jelszoItelet()` megkerülése az egyetlen ilyen hely a rendszerben. Ha még
 * egy lenne, az már nem kivétel volna, hanem szokás.
 */
export function bootstrapTar(most: string): FelhasznaloTar {
  return {
    verzio: 1,
    felhasznalok: [{
      id: "user.admin",
      felhasznalonev: BOOTSTRAP_NEV,
      nev: "Rendszergazda (alapértelmezett)",
      jelszo: hasheld(BOOTSTRAP_JELSZO),
      allapot: "aktiv",
      jelszotCserelni: true,
      letrehozva: most,
      utolsoBelepes: null,
      sikertelen: 0,
      utolsoSikertelen: null,
      szolgaltato: "helyi",
    }],
  };
}

/** Áll-e még az alapértelmezett jelszó. A kiszolgáló ezt írja ki indításkor. */
export function alapertelmezettJelszoAll(tar: FelhasznaloTar): boolean {
  const f = keres(tar, BOOTSTRAP_NEV);
  return Boolean(f && f.szolgaltato === "helyi" && egyezik(BOOTSTRAP_JELSZO, f.jelszo));
}

export function ujAzonosito(elotag = "user"): string {
  return `${elotag}.${randomBytes(8).toString("hex")}`;
}
