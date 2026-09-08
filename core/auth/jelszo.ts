/**
 * JELSZÓ — tárolás, ellenőrzés és a szabály, ami nem a régi szabály.
 *
 * A JELSZÓSZABÁLY A NIST SP 800-63B-t követi, NEM a megszokást.
 *
 * A megszokás — „legyen benne nagybetű, szám és írásjel, és 90 naponta
 * cseréld” — mérhetően ROSSZABB jelszavakat termel. Aki nyolc karaktert kap
 * kötelező összetettséggel, `Jelszo1!`-et ír, majd 90 nap múlva `Jelszo2!`-t.
 * A NIST 2017 óta kimondottan ELLENJAVALLJA az összetételi szabályokat és a
 * kötelező időszakos cserét, és helyette hármat kér:
 *
 *   1. HOSSZ, nem összetettség. Legalább 12 karakter, felső korlát 64 fölött —
 *      a jelmondat erősebb, mint a `P@ssw0rd`.
 *   2. TILTÓLISTA. A gyakori és a már kiszivárgott jelszavak elutasítása. Ez
 *      fogja meg azt, amit az összetételi szabály nem: a `Tavasz2026!`
 *      minden összetételi feltételnek megfelel, és mégis kitalálható.
 *   3. CSERE CSAK OKKAL. Kompromittálódás gyanúja esetén azonnal — egyébként
 *      nem. Az időszakos csere csak arra tanítja meg a felhasználót, hogy
 *      sorszámozzon.
 *
 * A TÁROLÁS scrypt-tel történik, jelszavanként külön sóval. A scrypt
 * MEMÓRIAIGÉNYES, ezért a GPU-s törés nem skálázódik úgy, mint SHA-nál. Az
 * összehasonlítás `timingSafeEqual` — a korai kilépés a hasonlítás közben
 * karakterenként szivárogtatná a helyes értéket.
 *
 * ÉS AMI A LEGKÖNNYEBBEN KIMARAD: A NEM LÉTEZŐ FELHASZNÁLÓ ELLENŐRZÉSE.
 *
 * Ha a kiszolgáló ismeretlen névnél AZONNAL elutasít, létezőnél viszont
 * lefuttatja a scrypt-et, akkor a válaszidő megmondja, LÉTEZIK-E a felhasználó.
 * Ez felhasználó-felsoroló orákulum: nem a jelszót adja ki, hanem a
 * névsort — és egy kórházban a névsor önmagában is adat. Ezért az ismeretlen
 * névre is lefut egy azonos költségű ÁRNYÉK-ELLENŐRZÉS.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/* ── PARAMÉTEREK ─────────────────────────────────────────────────────── */

/**
 * scrypt költségparaméterek. Az `N` kettőhatvány; a memóriaigény
 * nagyjából `128 · N · r` bájt — itt ~16 MB.
 */
export const SCRYPT = { N: 16384, r: 8, p: 1, kulcsBajt: 64, soBajt: 16 } as const;

export const HOSSZ_MIN = 12;
export const HOSSZ_MAX = 256;

/**
 * TILTÓLISTA — a gyakori jelszavak és a rendszer saját szavai.
 *
 * Nem teljes lista, és nem is lehet az: éles üzemben egy kiszivárgott-jelszó
 * adatbázis (pl. HIBP k-anonimitásos API) a helyes megoldás. Ami itt van, az
 * a MINIMUM, és a hiánya nem „nincs tiltólista”, hanem „a tiltólista még nem
 * a valódi”.
 */
export const TILTOLISTA = new Set([
  "admin", "administrator", "password", "jelszo", "jelszó", "123456",
  "12345678", "123456789", "1234567890", "qwertz", "qwerty", "asdfgh",
  "ogdoc", "ogdoc123", "kórház", "korhaz", "orvos", "doktor", "nover",
  "nővér", "szuleszet", "szülészet", "nogyogyaszat", "nőgyógyászat",
  "welcome", "letmein", "changeme", "valtoztassmeg", "titok", "secret",
]);

/* ── AZ ÍTÉLET ───────────────────────────────────────────────────────── */

export type JelszoAllapot =
  | "megfelel"
  /** Rövidebb a minimumnál. */
  | "rovid"
  /** Hosszabb a felső korlátnál — a korlát a szolgáltatásmegtagadás ellen van. */
  | "hosszu"
  /** Tiltólistás vagy annak nyilvánvaló változata. */
  | "tiltolistas"
  /** A felhasználónevet vagy a nevet tartalmazza. */
  | "sajatAdat"
  /** Egyetlen ismétlődő karakter vagy szomszédos sor a billentyűzeten. */
  | "mintazatos";

export interface JelszoItelet {
  allapot: JelszoAllapot;
  megfelel: boolean;
  miert: string;
}

const ekezettelen = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** A végén álló számsor levágása: „Tavasz2026” töve „tavasz”. */
const tő = (s: string) => ekezettelen(s).replace(/[0-9!?.\-_*]+$/u, "");

export function jelszoItelet(
  jelszo: string, sajat: string[] = [],
): JelszoItelet {
  if (jelszo.length < HOSSZ_MIN) {
    return { allapot: "rovid", megfelel: false,
      miert:
        `A jelszó ${jelszo.length} karakter, a minimum ${HOSSZ_MIN}. A HOSSZ ` +
        `számít, nem az összetettség: egy négyszavas jelmondat erősebb és ` +
        `könnyebben megjegyezhető, mint a „Jelszo1!”. A rendszer ezért NEM ` +
        `kér nagybetűt, számot és írásjelet — az a szabály mérhetően rosszabb ` +
        `jelszavakat termel.` };
  }
  if (jelszo.length > HOSSZ_MAX) {
    return { allapot: "hosszu", megfelel: false,
      miert:
        `A jelszó ${jelszo.length} karakter, a felső korlát ${HOSSZ_MAX}. A ` +
        `korlát nem biztonsági, hanem szolgáltatásmegtagadás elleni: a scrypt ` +
        `költsége a bemenettel nő.` };
  }
  const t = tő(jelszo);
  if (TILTOLISTA.has(ekezettelen(jelszo)) || TILTOLISTA.has(t)) {
    return { allapot: "tiltolistas", megfelel: false,
      miert:
        `A jelszó tiltólistán van (vagy a tövében az áll: „${t}”). Ezt az ` +
        `összetételi szabály nem fogná meg — a „Tavasz2026!” minden ilyen ` +
        `feltételnek megfelel, és mégis kitalálható.` };
  }
  // A SAJÁT ADAT SZÓKÖZ NÉLKÜL IS SAJÁT ADAT. A „Minta Anna” egészben
  // keresve nem található meg a `kismintaanna2026` jelszóban — pedig ott van.
  // Ezért a szóhatárokat mindkét oldalon eltüntetjük, és a többszavas nevet
  // szavanként is nézzük: aki a nevét használja, ritkán másolja be szó szerint.
  const lapos = (x: string) => ekezettelen(x).replace(/[\s._\-]+/gu, "");
  const jLapos = lapos(jelszo);
  for (const s of sajat) {
    if (!s) continue;
    const jeloltek = [s, ...s.split(/[\s._\-@]+/u)]
      .map(lapos).filter((x) => x.length >= 3);
    const talalt = jeloltek.find((x) => jLapos.includes(x));
    if (talalt) {
      return { allapot: "sajatAdat", megfelel: false,
        miert:
          `A jelszó tartalmazza a saját adatot: „${s}” (a jelszóban: ` +
          `„${talalt}”). Aki ismeri a felhasználót, ismeri a jelszó felét is. ` +
          `A szóközök eltüntetése nem rejti el: a „Minta Anna” és a ` +
          `„mintaanna” ugyanaz a titok.` };
    }
  }
  if (/^(.)\1+$/u.test(jelszo)) {
    return { allapot: "mintazatos", megfelel: false,
      miert: `A jelszó egyetlen ismétlődő karakter.` };
  }
  return { allapot: "megfelel", megfelel: true,
    miert: `A jelszó megfelel: ${jelszo.length} karakter, nincs tiltólistán.` };
}

/* ── TÁROLÁS ─────────────────────────────────────────────────────────── */

/** `scrypt$N$r$p$só$kulcs` — a paraméterek a lenyomatban vannak, hogy emelhetők legyenek. */
export function hasheld(jelszo: string): string {
  const so = randomBytes(SCRYPT.soBajt);
  const kulcs = scryptSync(jelszo.normalize("NFC"), so, SCRYPT.kulcsBajt,
    { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 256 * 1024 * 1024 });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p,
    so.toString("base64"), kulcs.toString("base64")].join("$");
}

/**
 * EGYEZIK-E. Hamis minden hibás alakra is — a kivétel dobása itt információ.
 */
export function egyezik(jelszo: string, lenyomat: string): boolean {
  const r = bont(lenyomat);
  if (!r) return false;
  const kulcs = scryptSync(jelszo.normalize("NFC"), r.so, r.kulcs.length,
    { N: r.N, r: r.r, p: r.p, maxmem: 256 * 1024 * 1024 });
  return kulcs.length === r.kulcs.length && timingSafeEqual(kulcs, r.kulcs);
}

function bont(lenyomat: string) {
  const d = lenyomat.split("$");
  if (d.length !== 6 || d[0] !== "scrypt") return null;
  const [, N, r, p, so, kulcs] = d;
  const n = Number(N), rr = Number(r), pp = Number(p);
  if (!Number.isInteger(n) || !Number.isInteger(rr) || !Number.isInteger(pp)) return null;
  return { N: n, r: rr, p: pp,
    so: Buffer.from(so, "base64"), kulcs: Buffer.from(kulcs, "base64") };
}

/**
 * ÁRNYÉK-ELLENŐRZÉS — a nem létező felhasználóra is lefut.
 *
 * Enélkül a válaszidő megmondaná, létezik-e a név. A visszatérési értéke
 * mindig `false`, és ezt ki is mondjuk: nem elfelejtett ág, hanem szándékos
 * időkiegyenlítés.
 */
const ARNYEK = hasheld(randomBytes(32).toString("base64"));

export function arnyekEllenorzes(jelszo: string): false {
  egyezik(jelszo, ARNYEK);
  return false;
}

/**
 * SZÜKSÉGES-E ÚJRAHASHELNI. Ha a tárolt lenyomat gyengébb paraméterekkel
 * készült, mint a mai alapértelmezés, a helyes bejelentkezéskor csendben
 * frissíteni kell — ez az egyetlen pillanat, amikor a nyílt jelszó megvan.
 */
export function ujrahashelendo(lenyomat: string): boolean {
  const r = bont(lenyomat);
  if (!r) return true;
  return r.N < SCRYPT.N || r.r < SCRYPT.r || r.p < SCRYPT.p;
}
