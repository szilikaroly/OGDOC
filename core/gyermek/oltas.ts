/**
 * OLTÁSOK A GYERMEKORVOSI OLDALON — a 29. modul és a 30. modul közös pontja.
 *
 * A naptár EGY van (a 30. modul `registry/vedono/oltasok.json` állománya, a
 * Módszertani levélből). Nem másoljuk le a gyermekorvosi modulba: két naptárból
 * előbb-utóbb két különböző oltási rend lesz, és a különbségük nem tűnik fel
 * senkinek. Ami itt kell, az nem másik naptár, hanem a MÁSIK REKORD kezelése.
 *
 * MERT A REKORD KETTŐ. Ugyanazt a gyereket a védőnő és a házi gyermekorvos is
 * dokumentálja, és a beadás bármelyik oldalon történhet. Ebből három hiba
 * következik, és mind a három csendes:
 *
 * 1. AMIT A GYERMEKORVOS BEADOTT, A VÉDŐNŐ HIÁNYZÓNAK LÁTJA. A védőnői oldal
 *    ilyenkor „elmaradt oltást” jelez egy beoltott gyereknél — behívás,
 *    esetleg hatósági jelzés olyasmiért, ami megtörtént.
 *
 * 2. AMIT A GYERMEKORVOS TARTÓSAN ELLENJAVALLTNAK MINŐSÍTETT, A VÉDŐNŐ
 *    MULASZTÁSNAK LÁTJA. Ez a súlyosabb irány: a kötelező oltás elmaradása
 *    jogkövetkezménnyel jár, és a dokumentált ellenjavallat pontosan az, ami
 *    ezt kizárja — ha nem jut át a másik oldalra, a védekezés hiányzik onnan,
 *    ahol szükség lenne rá.
 *
 * 3. ÉS A LEGVESZÉLYESEBB: A KÉT REKORD UGYANARRÓL MÁST MOND. Ugyanaz az oltás
 *    két különböző napon, két különböző tételszámmal. Ez vagy KÉTSZERI BEADÁS,
 *    vagy elgépelés — és a kettő nem ugyanaz. Egy naiv egyesítés (oltásnév
 *    szerinti kulcs, „az utolsó nyer”) pontosan ezt a különbséget tünteti el:
 *    a kétszeri beadás egyetlen szép sorrá válik.
 *
 * EZÉRT AZ EGYESÍTÉS NEM DEDUPLIKÁL. Ütközésnél mindkét bejegyzést megtartja,
 * `utkozes` állapotot ad, és a sor NEM ad esedékességi ítéletet: eldöntendő,
 * nem eldöntött. A feloldás emberi — annak kell megnéznie az oltási könyvet,
 * aki hozzáfér mindkét forráshoz.
 *
 * AMI EMBERI DÖNTÉS ÉS NEM ITT DŐL EL: hogy a két rekord közül melyik a
 * hiteles forrás (ma Magyarországon az EESZT-nek kellene ez lennie), és hogy
 * az összevezetésnek van-e jogalapja az adott gyereknél. A modul az
 * ÖSSZERENDELÉS kapuja mögött áll (`osszerendelheto`) — jogalap nélkül nincs
 * összevezetés, mert amit egyszer összekötöttünk, azt utólag nem lehet „nem
 * tudottá” tenni.
 */
import type {
  Bejegyzes, GyermekAllas, OltasKeszlet, Sor, SorAllapot,
} from "../vedono/oltas.ts";
import { allas } from "../vedono/oltas.ts";
import type { RegistryIssue } from "../registry.ts";

export type Forras = "vedono" | "gyermekorvos";

export interface ForrasBejegyzes extends Bejegyzes {
  honnan: Forras;
}

export type EgyezesAllapot =
  /** Csak az egyik oldal ismeri — a másik oldalon ez ma hiányzónak látszik. */
  | "csakVedono"
  | "csakGyermekorvos"
  /** Mindkettő ismeri, és ugyanazt mondja. */
  | "egyezik"
  /** Mindkettő ismeri, de MÁST mond. Kétszeri beadás vagy elgépelés. */
  | "utkozes";

export interface EgyesitesSor {
  oltas: string;
  allapot: EgyezesAllapot;
  bejegyzesek: ForrasBejegyzes[];
  /** Feloldható-e gépileg. Ütközésnél SOHA. */
  gepilegFeloldhato: boolean;
  miert: string;
}

function azonos(a: Bejegyzes, b: Bejegyzes): boolean {
  return a.allapot === b.allapot
    && (a.mikor ?? "") === (b.mikor ?? "")
    && (a.tetelszam ?? "") === (b.tetelszam ?? "");
}

/**
 * A KÉT REKORD EGYESÍTÉSE — ütközésnél megtartva mindkettőt.
 * Nem választ, nem deduplikál, nem hagy nyertest.
 */
export function egyesit(
  vedonoi: Bejegyzes[], orvosi: Bejegyzes[],
): EgyesitesSor[] {
  const nevek: string[] = [];
  for (const b of [...vedonoi, ...orvosi]) {
    if (!nevek.includes(b.oltas)) nevek.push(b.oltas);
  }
  return nevek.map((n) => {
    const v = vedonoi.filter((b) => b.oltas === n);
    const o = orvosi.filter((b) => b.oltas === n);
    const be: ForrasBejegyzes[] = [
      ...v.map((b) => ({ ...b, honnan: "vedono" as Forras })),
      ...o.map((b) => ({ ...b, honnan: "gyermekorvos" as Forras })),
    ];
    if (!o.length) {
      return { oltas: n, allapot: "csakVedono", bejegyzesek: be, gepilegFeloldhato: true,
        miert:
          `„${n}”: csak a VÉDŐNŐI rekordban szerepel. A gyermekorvosi oldalon ` +
          `ez ma hiányzónak látszik — pedig nem az.` };
    }
    if (!v.length) {
      const e = o[0].allapot === "ellenjavallt";
      return { oltas: n, allapot: "csakGyermekorvos", bejegyzesek: be, gepilegFeloldhato: true,
        miert: e
          ? `„${n}”: a gyermekorvos TARTÓS ELLENJAVALLATOT dokumentált, de a ` +
            `védőnői rekordban ez nincs meg. Ott ez MULASZTÁSNAK látszik — és a ` +
            `kötelező oltás elmaradása jogkövetkezménnyel jár, miközben éppen ez ` +
            `a bejegyzés zárná ki azt.`
          : `„${n}”: csak a GYERMEKORVOSI rekordban szerepel. A védőnői oldalon ` +
            `ez ma elmaradt oltásnak látszik — behívás, esetleg jelzés olyasmiért, ` +
            `ami megtörtént.` };
    }
    const parban = v.length === 1 && o.length === 1 && azonos(v[0], o[0]);
    if (parban) {
      return { oltas: n, allapot: "egyezik", bejegyzesek: be, gepilegFeloldhato: true,
        miert: `„${n}”: a két rekord ugyanazt mondja.` };
    }
    return { oltas: n, allapot: "utkozes", bejegyzesek: be, gepilegFeloldhato: false,
      miert:
        `„${n}”: A KÉT REKORD MÁST MOND — ` +
        be.map((b) => `${b.honnan}: ${b.allapot}` +
          `${b.mikor ? ` ${b.mikor}` : ""}${b.tetelszam ? ` (${b.tetelszam})` : ""}`)
          .join(" · ") +
        `. Ez vagy KÉTSZERI BEADÁS, vagy elgépelés, és a kettő nem ugyanaz. ` +
        `Gépileg nem oldható fel: valakinek meg kell néznie az oltási könyvet.` };
  });
}

/* ── A GYERMEKORVOSI OLTÁSI ÁLLÁS ────────────────────────────────────── */

export type GyOltasAllapot = SorAllapot | "utkozes";

export interface GyOltasSor {
  oltas: string;
  allapot: GyOltasAllapot;
  jelentendo: boolean;
  /** Melyik forrás(ok)ból származik a bejegyzés. */
  forrasok: Forras[];
  miert: string;
}

/**
 * A gyermekorvosi rendelésen látott oltási állás — a KÖZÖS naptárból és a
 * KÉT rekordból. Ütközésnél a sor nem kap esedékességi ítéletet: `utkozes`
 * marad, mert egy feloldatlan ellentmondásból nem következik sem az, hogy
 * beadták, sem az, hogy elmaradt.
 */
export function oltasiAllas(
  k: OltasKeszlet, gy: GyermekAllas,
  vedonoi: Bejegyzes[], orvosi: Bejegyzes[], turelmiHonap = 1,
): GyOltasSor[] {
  const egy = new Map(egyesit(vedonoi, orvosi).map((e) => [e.oltas, e]));
  const feloldott: Bejegyzes[] = [];
  for (const e of egy.values()) {
    if (e.allapot !== "utkozes") feloldott.push(e.bejegyzesek[0]);
  }
  const sorok: Sor[] = allas(k, gy, feloldott, turelmiHonap);
  return sorok.map((s) => {
    const e = egy.get(s.pont.oltas);
    if (e?.allapot === "utkozes") {
      return { oltas: s.pont.oltas, allapot: "utkozes", jelentendo: false,
        forrasok: [...new Set(e.bejegyzesek.map((b) => b.honnan))],
        miert: e.miert };
    }
    return { oltas: s.pont.oltas, allapot: s.allapot, jelentendo: s.jelentendo,
      forrasok: e ? [...new Set(e.bejegyzesek.map((b) => b.honnan))] : [],
      miert: s.miert };
  });
}

export interface GyOltasMerleg {
  sor: number;
  utkozes: number;
  csakEgyikRekordban: number;
  hianyzik: number;
  jelentendo: number;
  evfolyamNelkul: number;
}

export function merleg(sorok: GyOltasSor[], egyesites: EgyesitesSor[]): GyOltasMerleg {
  return {
    sor: sorok.length,
    utkozes: sorok.filter((s) => s.allapot === "utkozes").length,
    csakEgyikRekordban: egyesites.filter(
      (e) => e.allapot === "csakVedono" || e.allapot === "csakGyermekorvos").length,
    hianyzik: sorok.filter((s) => s.allapot === "hianyzik").length,
    jelentendo: sorok.filter((s) => s.jelentendo).length,
    evfolyamNelkul: sorok.filter((s) => s.allapot === "evfolyamIsmeretlen").length,
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

/**
 * A gyermekorvosi modul nem hozhat SAJÁT naptárat. Ha egyszer mégis lesz egy
 * második oltási rend a fában, ez a kapu az, ami észreveszi.
 */
export function validateGyermekOltas(
  kozos: OltasKeszlet, sajat?: OltasKeszlet,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  if (sajat) {
    out.push({ severity: "error", id: "gyoltas.masodikNaptar",
      message:
        `A gyermekorvosi modulnak külön oltási naptára van (${sajat.naptar.length} ` +
        `tétel) a közös mellett (${kozos.naptar.length} tétel). Két naptárból ` +
        `előbb-utóbb két különböző oltási rend lesz, és a különbségük nem tűnik ` +
        `fel senkinek. A naptár EGY.` });
  }
  if (kozos.modul !== 30) {
    out.push({ severity: "warning", id: "gyoltas.forras",
      message:
        `A közös naptár modulszáma ${kozos.modul}, nem 30. A 29. modul a 30. ` +
        `modul naptárát használja — ha ez elmozdul, a forrás bizonytalan.` });
  }
  return out;
}
