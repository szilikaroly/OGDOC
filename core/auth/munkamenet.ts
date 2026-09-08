/**
 * MUNKAMENET — a bejelentkezés utáni állapot, és a két külön lejárat.
 *
 * AZ ABSZOLÚT ÉS A TÉTLENSÉGI LEJÁRAT KÉT KÜLÖNBÖZŐ DOLGOT VÉD.
 *
 *   TÉTLENSÉGI  a kórházi folyosón otthagyott, bejelentkezve maradt gép ellen.
 *               Ez a valóságos kockázat: nem betörés, hanem egy nyitva hagyott
 *               képernyő, amiről bárki olvas.
 *   ABSZOLÚT    az ellopott munkamenet-azonosító ellen. Aki megszerzi a
 *               tokent, a tétlenségi órát folyamatosan újraindíthatja —
 *               abszolút korlát nélkül a lopott munkamenet örökké él.
 *
 * Csak az egyiket beállítani annyi, mint az egyik támadást kivédeni.
 *
 * A TOKEN NEM AZONOSÍTÓ, HANEM TITOK. 256 bit véletlen, és a tárban a
 * LENYOMATA áll, nem maga. Ha a munkamenettár kikerül, a benne lévő értékek
 * nem használhatók belépésre — ugyanaz az elv, mint a jelszónál.
 *
 * A MUNKAMENET-AZONOSÍTÓ CSERÉLŐDIK, VALAHÁNYSZOR A JOGOSULTSÁG VÁLTOZIK.
 * Bejelentkezéskor, jelszócsere után és szerepkörváltásnál. Enélkül a
 * bejelentkezés előtt beültetett azonosító a bejelentkezés után is érvényes
 * maradna — ez a session fixation.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Role } from "../store/hozzaferes.ts";

export const TETLENSEG_PERC = 15;
export const ABSZOLUT_ORA = 12;

export interface Munkamenet {
  /** A token LENYOMATA — a token maga csak a kliensnél van. */
  lenyomat: string;
  felhasznalo: string;
  nev: string;
  szerepek: Role[];
  hatokorok: string[];
  kezdet: string;
  utolsoTevekenyseg: string;
  /** Nyomkövetési azonosító — az auditnapló ezzel fűzi össze a kérést. */
  traceId: string;
  /** Ha a felhasználónak jelszót kell cserélnie, a munkamenet KORLÁTOZOTT. */
  csakJelszocsere: boolean;
}

export type MunkamenetAllapot =
  | "el"
  | "nincs"
  /** Tétlenségi lejárat — a felhasználó újra beléphet. */
  | "tetlen"
  /** Abszolút lejárat — újra kell jelentkezni, akkor is, ha épp dolgozott. */
  | "lejart"
  /** Csak jelszócserére jó. */
  | "csakJelszocsere";

export interface MunkamenetItelet {
  allapot: MunkamenetAllapot;
  munkamenet: Munkamenet | null;
  miert: string;
}

export function tokenLenyomat(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface UjMunkamenet { token: string; munkamenet: Munkamenet }

export function nyit(
  felhasznalo: string, nev: string, szerepek: Role[], hatokorok: string[],
  most: string, csakJelszocsere = false,
): UjMunkamenet {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    munkamenet: {
      lenyomat: tokenLenyomat(token), felhasznalo, nev, szerepek, hatokorok,
      kezdet: most, utolsoTevekenyseg: most,
      traceId: randomBytes(8).toString("hex"), csakJelszocsere,
    },
  };
}

/**
 * ÉL-E A MUNKAMENET. A `mind` tömb MÓDOSUL: a lejárt tételek kikerülnek belőle,
 * és az élő tétel `utolsoTevekenyseg` mezője frissül.
 */
export function ellenoriz(
  mind: Munkamenet[], token: string | undefined, most: string,
): MunkamenetItelet {
  if (!token) {
    return { allapot: "nincs", munkamenet: null,
      miert:
        "Nincs munkamenet. A kiszolgáló NEM választ alapértelmezett " +
        "felhasználót: a hiányzó azonosság sehol nem „igen”." };
  }
  const l = tokenLenyomat(token);
  const lb = Buffer.from(l, "hex");
  const idx = mind.findIndex((m) => {
    const b = Buffer.from(m.lenyomat, "hex");
    return b.length === lb.length && timingSafeEqual(b, lb);
  });
  if (idx < 0) {
    return { allapot: "nincs", munkamenet: null,
      miert: "Ismeretlen vagy visszavont munkamenet." };
  }
  const m = mind[idx];
  const t = Date.parse(most);
  if (t - Date.parse(m.kezdet) > ABSZOLUT_ORA * 3600_000) {
    mind.splice(idx, 1);
    return { allapot: "lejart", munkamenet: null,
      miert:
        `A munkamenet elérte a ${ABSZOLUT_ORA} órás abszolút korlátot. Ez akkor ` +
        `is lejár, ha épp dolgoztál: az abszolút korlát az ELLOPOTT munkamenet ` +
        `ellen véd, amit a tétlenségi óra sosem fogna meg, mert a támadó ` +
        `folyamatosan újraindítja.` };
  }
  if (t - Date.parse(m.utolsoTevekenyseg) > TETLENSEG_PERC * 60_000) {
    mind.splice(idx, 1);
    return { allapot: "tetlen", munkamenet: null,
      miert:
        `A munkamenet ${TETLENSEG_PERC} perc tétlenség után lejárt. Ez a ` +
        `folyosón otthagyott, bejelentkezve maradt gép ellen véd — a valóságos ` +
        `kockázat nem a betörés, hanem a nyitva hagyott képernyő.` };
  }
  m.utolsoTevekenyseg = most;
  if (m.csakJelszocsere) {
    return { allapot: "csakJelszocsere", munkamenet: m,
      miert: "A munkamenet KORLÁTOZOTT: amíg a jelszó nincs lecserélve, más művelet nem indul." };
  }
  return { allapot: "el", munkamenet: m, miert: `Élő munkamenet: ${m.nev}.` };
}

/** Kijelentkezés — a lenyomat kikerül a tárból. */
export function zar(mind: Munkamenet[], token: string): boolean {
  const l = tokenLenyomat(token);
  const i = mind.findIndex((m) => m.lenyomat === l);
  if (i < 0) return false;
  mind.splice(i, 1);
  return true;
}

/** A felhasználó ÖSSZES munkamenete — jogosultságváltáskor és zároláskor. */
export function zarMind(mind: Munkamenet[], felhasznalo: string): number {
  let n = 0;
  for (let i = mind.length - 1; i >= 0; i--) {
    if (mind[i].felhasznalo === felhasznalo) { mind.splice(i, 1); n++; }
  }
  return n;
}

/* ── TARTÓSSÁG ───────────────────────────────────────────────────────── */

/**
 * A MUNKAMENETEK TÚLÉLIK AZ ÚJRAINDÍTÁST — és ez BIZTONSÁGOS.
 *
 * A memóriában tartott munkamenettár azt jelenti, hogy egy frissítés vagy egy
 * áramszünet az ügyeletes orvost is kilépteti, műszak közepén. Ez nem elméleti
 * kellemetlenség: pont akkor történik, amikor a rendszer kell.
 *
 * A fájlba mentés azért nem gyengít, mert a tárban a token LENYOMATA áll, nem
 * a token. Aki megszerzi a fájlt, nem tud belőle belépni — vissza kellene
 * fejtenie egy SHA-256 előképet. Ugyanaz az elv, mint a jelszónál: a tár
 * ismerete nem hitelesítő adat.
 *
 * A lejárat viszont MEGMARAD: a betöltés kidobja a lejárt tételeket, tehát
 * egy hetekig állt kiszolgáló nem ébred fel élő munkamenetekkel.
 */
export function mentMunkamenetek(path: string, mind: Munkamenet[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(mind) + "\n", { mode: 0o600 });
}

export function toltMunkamenetek(path: string, most: string): Munkamenet[] {
  if (!existsSync(path)) return [];
  let mind: Munkamenet[];
  try { mind = JSON.parse(readFileSync(path, "utf8")) as Munkamenet[]; }
  catch { return []; }
  takarit(mind, most);
  return mind;
}

/** Takarítás — a lejártakat nem kell megőrizni. */
export function takarit(mind: Munkamenet[], most: string): number {
  const t = Date.parse(most);
  let n = 0;
  for (let i = mind.length - 1; i >= 0; i--) {
    const m = mind[i];
    if (t - Date.parse(m.kezdet) > ABSZOLUT_ORA * 3600_000
      || t - Date.parse(m.utolsoTevekenyseg) > TETLENSEG_PERC * 60_000) {
      mind.splice(i, 1); n++;
    }
  }
  return n;
}
