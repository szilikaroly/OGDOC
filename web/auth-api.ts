/**
 * A HITELESÍTÉSI ÉS ADMINISZTRÁCIÓS VÉGPONTOK.
 *
 * A SÜTI HÁROM JELÖLÉSE, ÉS MINDHÁROM MÁS TÁMADÁS ELLEN VAN:
 *
 *   HttpOnly           a JavaScript nem olvashatja. Egy XSS így nem viszi el a
 *                      munkamenetet — a lopott token örökre használható volna.
 *   SameSite=Strict    idegen oldalról indított kérés nem viszi magával. Ez a
 *                      CSRF elleni fő védelem, és ingyen van.
 *   Secure             csak titkosított kapcsolaton megy ki. CSAK akkor
 *                      tesszük ki, ha az üzemeltető kijelentette a TLS-t —
 *                      nyílt HTTP-n a `Secure` süti egyszerűen nem érkezne meg,
 *                      és a bejelentkezés némán elromlana.
 *
 * A NEGYEDIK VÉDELEM NEM A SÜTIN VAN. Az állapotot változtató kérés csak
 * `application/json` törzzsel fogadható el. Egy idegen oldalról elküldött
 * HTML-űrlap nem tud ilyen fejlécet küldeni előellenőrzés (preflight) nélkül,
 * az előellenőrzést pedig nincs CORS-szabály, ami átengedné.
 *
 * AMIT AZ ADMIN NEM TEHET MEG: LELETET OLVASNI.
 *
 * A rendszergazda felhasználót és megbízást kezel. Ha klinikai hozzáférés kell
 * neki, megbízást ad magának klinikusként — és az látszik, névvel, indokkal és
 * időablakkal. A különbség nem a lehetőség, hanem a NYOM.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  belep, bootstrapTar, jelszotBeallit, jelszotCserel, keres, loadTar,
  saveTar, ujAzonosito,
} from "../core/auth/felhasznalo.ts";
import type { Felhasznalo, FelhasznaloTar } from "../core/auth/felhasznalo.ts";
import {
  ellenoriz, mentMunkamenetek, nyit, takarit, toltMunkamenetek, zar, zarMind,
} from "../core/auth/munkamenet.ts";
import type { Munkamenet } from "../core/auth/munkamenet.ts";
import {
  beosztasbolKapcsolat, hatalyos, hatokorTartalma, loadCsoportok,
  validateMegbizasok,
} from "../core/auth/csoport.ts";
import type { CsoportKeszlet, Fekves, Megbizas } from "../core/auth/csoport.ts";
import { loadSzolgaltatok } from "../core/auth/szolgaltato.ts";
import { kapu } from "../core/auth/kapu.ts";
import { loadHelyek } from "../core/fekvo/hely.ts";
import type { HelyKeszlet } from "../core/fekvo/hely.ts";
import type { CareRelation, Role } from "../core/store/hozzaferes.ts";

export const SUTI = "ogdoc_munkamenet";

export interface AuthAllapot {
  tar: FelhasznaloTar;
  tarPath: string;
  megbizasok: Megbizas[];
  megbizasPath: string;
  munkamenetek: Munkamenet[];
  csoportok: CsoportKeszlet;
  helyek: HelyKeszlet;
  szolgaltatokPath: string;
  fekvesek: Fekves[];
  munkamenetPath: string;
  /** Az elutasítások NAPLÓZÁSA — a hitelesítési réteg is auditköteles. */
  naplo?: (e: { actor: string; action: string; why: string; caseId?: string }) => void;
}

/* ── BETÖLTÉS ÉS ELSŐ INDÍTÁS ────────────────────────────────────────── */

export function betolt(
  adatDir: string, registryDir: string, most: string, demoCaseId: string,
): AuthAllapot {
  const tarPath = `${adatDir}/felhasznalok.json`;
  const megbizasPath = `${adatDir}/megbizasok.json`;
  let tar = loadTar(tarPath);
  let elso = false;
  if (!tar) { tar = bootstrapTar(most); saveTar(tarPath, tar); elso = true; }

  const csoportok = loadCsoportok(`${registryDir}/auth/csoportok.json`);
  const helyek = loadHelyek(`${registryDir}/fekvo/helyek.json`);

  let megbizasok: Megbizas[] = existsSync(megbizasPath)
    ? JSON.parse(readFileSync(megbizasPath, "utf8"))
    : [];
  if (elso || !megbizasok.length) {
    megbizasok = bemutatoMegbizasok(tar, most);
    ment(megbizasPath, megbizasok);
  }
  const munkamenetPath = `${adatDir}/munkamenetek.json`;
  return {
    tar, tarPath, megbizasok, megbizasPath, munkamenetPath,
    munkamenetek: toltMunkamenetek(munkamenetPath, most), csoportok, helyek,
    szolgaltatokPath: `${registryDir}/auth/szolgaltatok.json`,
    // A BEMUTATÓ FEKVÉSE. Egy fekvés = egy eset egy helyen, időablakkal.
    fekvesek: [{ caseId: demoCaseId, hely: "hely.agy.szsz1", tol: "2026-09-01T00:00:00.000Z", ig: null }],
  };
}

function ment(path: string, m: Megbizas[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(m, null, 1) + "\n", { mode: 0o600 });
}

/**
 * AZ ELSŐ MEGBÍZÁS: a rendszergazda saját maga fölött.
 *
 * A bootstrap `forras` külön érték, mert ez az egyetlen megbízás, amit nem
 * ember adott. A `kezi` értéket használva úgy látszana, mintha valaki
 * felelősséget vállalt volna érte — nem vállalt.
 */
function bemutatoMegbizasok(tar: FelhasznaloTar, most: string): Megbizas[] {
  const admin = keres(tar, "admin");
  if (!admin) return [];
  return [{
    id: "megb.bootstrap.admin",
    felhasznalo: admin.id,
    csoport: "csoport.rendszergazda",
    hatokor: "hely.klinika",
    tol: most, ig: null, forras: "bootstrap",
    adta: "a rendszer első indítása",
    miert:
      "Az első rendszergazda. Ezt a megbízást nem ember adta — ezért külön " +
      "`bootstrap` forrással szerepel, hogy ne látsszon úgy, mintha valaki " +
      "felelősséget vállalt volna érte.",
  }];
}

/* ── A MUNKAMENET KIOLVASÁSA ─────────────────────────────────────────── */

/** Minden munkamenet-változás után menteni kell — különben az újraindítás töröl. */
function mentM(a: AuthAllapot): void {
  mentMunkamenetek(a.munkamenetPath, a.munkamenetek);
}

export function sutibol(req: IncomingMessage): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const d of raw.split(";")) {
    const [k, ...v] = d.trim().split("=");
    if (k === SUTI) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function sutitKuld(
  res: ServerResponse, token: string | null, tls: boolean,
): void {
  const jelolok = ["Path=/", "HttpOnly", "SameSite=Strict", ...(tls ? ["Secure"] : [])];
  res.setHeader("set-cookie", token === null
    ? `${SUTI}=; ${jelolok.join("; ")}; Max-Age=0`
    : `${SUTI}=${encodeURIComponent(token)}; ${jelolok.join("; ")}`);
}

/* ── AZ AZONOSÍTOTT KÉRÉS ────────────────────────────────────────────── */

export interface Azonositott {
  ok: true;
  munkamenet: Munkamenet;
  felhasznalo: Felhasznalo;
  szerepek: Role[];
  hatokorok: string[];
  kapcsolatok: CareRelation[];
}
export interface AzonositasHiba { ok: false; status: number; error: string; allapot: string }

/**
 * KI KÜLDTE A KÉRÉST — ELLENŐRZÖTT munkamenetből.
 *
 * A jogosultságot MINDEN kérésnél újraszámoljuk a megbízásokból, nem a
 * munkamenetbe fagyasztott listából. Aki délelőtt volt beosztva, délután már
 * nem az — és ha a munkamenet őrizné a szerepköreit, a beosztás lejárta
 * semmit nem jelentene.
 */
/**
 * AZ ELUTASÍTÁS IS AUDITKÖTELES — és ezt könnyű elveszíteni.
 *
 * Amíg a jogosultság a tárolóban dőlt el, minden elutasítást a tároló naplózott.
 * A hitelesítési réteg viszont a tároló ELŐTT utasít el: lejárt megbízás,
 * ismeretlen munkamenet, zárolt fiók. Ha ez a réteg nem naplóz, ezek az
 * események nyomtalanul eltűnnek — pedig épp ezek azok, amiket egy auditornak
 * látnia kell: valaki olyan próbált belépni, akinek a joga megszűnt.
 *
 * A hitelesítési hibát ezért ugyanabba a naplóba írjuk, ahova a tároló ír.
 */
function elutasit(
  a: AuthAllapot, actor: string, status: number, allapot: string, error: string,
): AzonositasHiba {
  a.naplo?.({ actor, action: "denied", why: `${allapot}: ${error}` });
  return { ok: false, status, allapot, error };
}

export function azonosit(
  a: AuthAllapot, req: IncomingMessage, most: string,
): Azonositott | AzonositasHiba {
  takarit(a.munkamenetek, most);
  const token = sutibol(req);
  const m = ellenoriz(a.munkamenetek, token, most);
  if (m.allapot !== "el" && m.allapot !== "csakJelszocsere") {
    // Az ismeretlen munkamenetnél nincs cselekvő — ezt is ki kell mondani.
    return elutasit(a, "(azonosítatlan)", 401, m.allapot, m.miert);
  }
  const f = a.tar.felhasznalok.find((x) => x.id === m.munkamenet!.felhasznalo);
  if (!f || f.allapot !== "aktiv") {
    zarMind(a.munkamenetek, m.munkamenet!.felhasznalo);
    mentM(a);
    return elutasit(a, m.munkamenet!.nev, 401, "nincs",
      "A felhasználó időközben megszűnt vagy zárolva lett.");
  }
  if (m.allapot === "csakJelszocsere") {
    return elutasit(a, f.nev, 403, "csakJelszocsere",
      "A jelszót cserélni kell, mielőtt bármi mást tennél. Amíg az " +
      "alapértelmezett vagy kiosztott jelszó érvényben van, a fiók annyit ér, " +
      "amennyit a kiosztás csatornája.");
  }
  const h = hatalyos(a.csoportok, a.megbizasok, f.id, most);
  // A HELYES OK MEGNEVEZÉSE. Szerepkör nélkül a `decide()` azt mondaná, hogy
  // „egyetlen szerepkörrel sem rendelkezik” — ami igaz, de rossz okot nevez
  // meg: a szerepkör azért nincs, mert a MEGBÍZÁS lejárt vagy visszavonták.
  // A hibás okot mutató elutasítás rosszabb a semmilyennél: a felhasználó a
  // rendszergazdához megy „adj szerepkört” kéréssel, holott műszakot kellene
  // kapnia, és a rendszergazda tartósat ad — épp azt, amit a modell tilt.
  if (!h.szerepek.length && h.nemElo.length) {
    const utolso = h.nemElo[h.nemElo.length - 1];
    return elutasit(a, f.nev, 403, "nincsEloMegbizas",
      `${f.nev} egyetlen megbízása sem él most. A legutóbbi: ` +
      `„${utolso.m.csoport}” a(z) ${utolso.m.hatokor} hatókörre — ` +
      `${utolso.miert}. Ez NEM szerepkörhiány: a szerepkör azért nincs, mert ` +
      `a beosztás lejárt vagy visszavonták. Új műszak kell hozzá, nem tartós ` +
      `jogosultság.`);
  }
  if (!h.szerepek.length) {
    return elutasit(a, f.nev, 403, "nincsMegbizas",
      `${f.nev} fiókja él, de EGYETLEN MEGBÍZÁSA SINCS — sem élő, sem lejárt. ` +
      `A belépés nem jogosultság: a felhasználó létezése és az, hogy mihez ` +
      `férhet hozzá, két külön döntés. Rendszergazdának kell megbízást adnia.`);
  }
  return {
    ok: true, munkamenet: m.munkamenet!, felhasznalo: f,
    szerepek: h.szerepek, hatokorok: h.hatokorok,
    kapcsolatok: beosztasbolKapcsolat(
      a.helyek, a.csoportok, a.megbizasok, a.fekvesek, f.nev, f.id),
  };
}

/* ── VÉGPONTOK ───────────────────────────────────────────────────────── */

export interface Valasz { status: number; body: unknown; sutiToken?: string | null }

export function belepes(
  a: AuthAllapot, nev: string, jelszo: string, most: string,
): Valasz {
  const r = belep(a.tar, nev ?? "", jelszo ?? "", most);
  saveTar(a.tarPath, a.tar);
  if (r.allapot !== "belepett" && r.allapot !== "jelszotCserelni") {
    return { status: r.allapot === "fekezve" ? 429 : 401,
      body: { ok: false, allapot: r.allapot, error: r.miert,
        ...(r.varakozasMp ? { varakozasMp: r.varakozasMp } : {}) } };
  }
  const f = r.felhasznalo!;
  // A MUNKAMENET-AZONOSÍTÓ MINDIG ÚJ. A bejelentkezés előtt beültetett
  // azonosító nem élheti túl a bejelentkezést (session fixation).
  zarMind(a.munkamenetek, f.id);
  const h = hatalyos(a.csoportok, a.megbizasok, f.id, most);
  const { token, munkamenet } = nyit(
    f.id, f.nev, h.szerepek, h.hatokorok, most, r.allapot === "jelszotCserelni");
  a.munkamenetek.push(munkamenet);
  mentM(a);
  return { status: 200, sutiToken: token,
    body: {
      ok: true, allapot: r.allapot, miert: r.miert,
      en: {
        id: f.id, nev: f.nev, felhasznalonev: f.felhasznalonev,
        szerepek: h.szerepek, hatokorok: h.hatokorok,
        jelszotCserelni: f.jelszotCserelni,
        elo: h.elo, nemElo: h.nemElo,
      },
    } };
}

export function kilepes(a: AuthAllapot, token: string | undefined): Valasz {
  if (token) { zar(a.munkamenetek, token); mentM(a); }
  return { status: 200, sutiToken: null, body: { ok: true } };
}

export function jelszocsere(
  a: AuthAllapot, req: IncomingMessage, regi: string, uj: string, most: string,
): Valasz {
  const token = sutibol(req);
  const m = ellenoriz(a.munkamenetek, token, most);
  if (!m.munkamenet) return { status: 401, body: { ok: false, error: m.miert } };
  const f = a.tar.felhasznalok.find((x) => x.id === m.munkamenet!.felhasznalo);
  if (!f) return { status: 401, body: { ok: false, error: "Ismeretlen felhasználó." } };
  const r = jelszotCserel(f, regi ?? "", uj ?? "", most);
  if (!r.ok) return { status: 400, body: { ok: false, error: r.miert } };
  saveTar(a.tarPath, a.tar);
  // A JELSZÓCSERE MINDEN MÁS MUNKAMENETET LEZÁR. Ha a jelszó azért változik,
  // mert kiszivárgott, a támadó munkamenete nem élheti túl a cserét.
  zarMind(a.munkamenetek, f.id);
  const h = hatalyos(a.csoportok, a.megbizasok, f.id, most);
  const uj2 = nyit(f.id, f.nev, h.szerepek, h.hatokorok, most, false);
  a.munkamenetek.push(uj2.munkamenet);
  mentM(a);
  return { status: 200, sutiToken: uj2.token,
    body: { ok: true, miert:
      r.miert + " Minden más munkamenet lezárult: ha a jelszó azért változott, " +
      "mert kiszivárgott, a támadó munkamenete nem élheti túl a cserét." } };
}

export function en(a: AuthAllapot, req: IncomingMessage, most: string): Valasz {
  const z = azonosit(a, req, most);
  if (!z.ok) return { status: z.status, body: { ok: false, allapot: z.allapot, error: z.error } };
  const h = hatalyos(a.csoportok, a.megbizasok, z.felhasznalo.id, most);
  return { status: 200, body: {
    ok: true,
    en: {
      id: z.felhasznalo.id, nev: z.felhasznalo.nev,
      felhasznalonev: z.felhasznalo.felhasznalonev,
      szerepek: z.szerepek, hatokorok: z.hatokorok,
      elo: h.elo, nemElo: h.nemElo,
      // A HATÓKÖR TARTALMA — hogy a felhasználó lássa, MIT jelent a megbízása.
      hatokorTartalma: Object.fromEntries(z.hatokorok.map((x) =>
        [x, hatokorTartalma(a.helyek, x).map((y) => ({ id: y.id, nev: y.nev, fajta: y.fajta }))])),
      kapcsolatok: z.kapcsolatok,
    },
  } };
}

export function kapuAllapot(a: AuthAllapot, env: NodeJS.ProcessEnv): Valasz {
  return { status: 200, body: kapu({
    env, szolgaltatok: loadSzolgaltatok(a.szolgaltatokPath), tar: a.tar }) };
}

/* ── ADMIN ───────────────────────────────────────────────────────────── */

export function adminE(z: Azonositott): boolean {
  return z.szerepek.includes("admin");
}

const NEM_ADMIN = {
  status: 403,
  body: { ok: false, error:
    "Ehhez rendszergazdai megbízás kell. A rendszergazda felhasználót és " +
    "megbízást kezel — leletet viszont nem olvas: ha a rendszergazdai fiók " +
    "közvetlenül olvashatna beteget, minden hozzáférés megkerülhető lenne " +
    "egyetlen fiókkal, és az auditnapló nem mondana semmit." },
} as const;

export function adminAttekintes(a: AuthAllapot, z: Azonositott, most: string): Valasz {
  if (!adminE(z)) return NEM_ADMIN;
  return { status: 200, body: {
    ok: true,
    felhasznalok: a.tar.felhasznalok.map(nyilvanos),
    csoportok: a.csoportok.csoportok,
    megbizasok: a.megbizasok,
    helyek: a.helyek.helyek.map((h) => ({ id: h.id, nev: h.nev, fajta: h.fajta, resze: h.resze })),
    munkamenetek: a.munkamenetek.map((m) => ({
      felhasznalo: m.felhasznalo, nev: m.nev, kezdet: m.kezdet,
      utolsoTevekenyseg: m.utolsoTevekenyseg })),
    gondok: validateMegbizasok(a.csoportok, a.helyek, a.megbizasok),
    most,
  } };
}

/** A jelszólenyomat SOHA nem hagyja el a kiszolgálót. */
function nyilvanos(f: Felhasznalo) {
  const { jelszo, ...t } = f;
  void jelszo;
  return t;
}

export function ujFelhasznalo(
  a: AuthAllapot, z: Azonositott, b: Record<string, unknown>, most: string,
): Valasz {
  if (!adminE(z)) return NEM_ADMIN;
  const felhasznalonev = String(b.felhasznalonev ?? "").trim();
  const nev = String(b.nev ?? "").trim();
  const jelszo = String(b.jelszo ?? "");
  const szolgaltato = (b.szolgaltato ?? "helyi") as Felhasznalo["szolgaltato"];
  if (!felhasznalonev || !nev) {
    return { status: 400, body: { ok: false, error: "Felhasználónév és név kell." } };
  }
  if (keres(a.tar, felhasznalonev)) {
    return { status: 409, body: { ok: false, error: `Van már ilyen felhasználónév: ${felhasznalonev}` } };
  }
  const f: Felhasznalo = {
    id: ujAzonosito(), felhasznalonev, nev, jelszo: "", allapot: "aktiv",
    jelszotCserelni: szolgaltato === "helyi", letrehozva: most,
    utolsoBelepes: null, sikertelen: 0, utolsoSikertelen: null, szolgaltato,
    email: b.email ? String(b.email) : undefined,
    pecsetszam: b.pecsetszam ? String(b.pecsetszam) : undefined,
  };
  if (szolgaltato === "helyi") {
    const r = jelszotBeallit(f, jelszo, most);
    if (!r.ok) return { status: 400, body: { ok: false, error: r.miert } };
    // A KIOSZTOTT JELSZÓT CSERÉLNI KELL. A `jelszotBeallit` törli a jelölést,
    // ezért itt visszatesszük: ezt a jelszót nem a felhasználó választotta.
    f.jelszotCserelni = true;
  } else {
    f.jelszo = "";
    f.kulsoAzonosito = b.kulsoAzonosito ? String(b.kulsoAzonosito) : undefined;
  }
  a.tar.felhasznalok.push(f);
  saveTar(a.tarPath, a.tar);
  return { status: 200, body: { ok: true, felhasznalo: nyilvanos(f) } };
}

export function felhasznaloAllapot(
  a: AuthAllapot, z: Azonositott, b: Record<string, unknown>, most: string,
): Valasz {
  if (!adminE(z)) return NEM_ADMIN;
  const f = a.tar.felhasznalok.find((x) => x.id === b.id);
  if (!f) return { status: 404, body: { ok: false, error: "Nincs ilyen felhasználó." } };
  const cel = String(b.allapot) as Felhasznalo["allapot"];
  if (!["aktiv", "zarolt", "megszunt"].includes(cel)) {
    return { status: 400, body: { ok: false, error: `Ismeretlen állapot: ${cel}` } };
  }
  if (f.id === z.felhasznalo.id && cel !== "aktiv") {
    return { status: 409, body: { ok: false, error:
      "Saját magadat nem zárhatod ki. Nem udvariasságból: ha az utolsó " +
      "rendszergazda kizárja magát, a rendszerbe senki nem tud belépni, és a " +
      "megbízásokat senki nem tudja visszaállítani." } };
  }
  if (cel === "zarolt") {
    const miert = String(b.miert ?? "").trim();
    if (!miert) {
      return { status: 400, body: { ok: false, error:
        "A zárolás INDOK NÉLKÜL nem adható meg: indoklás nélkül utólag nem " +
        "különböztethető meg a fegyelmi intézkedéstől az elgépelés." } };
    }
    f.zarolas = { ki: z.felhasznalo.nev, mikor: most, miert };
  } else {
    delete f.zarolas;
  }
  f.allapot = cel;
  if (cel !== "aktiv") { zarMind(a.munkamenetek, f.id); mentM(a); }
  saveTar(a.tarPath, a.tar);
  return { status: 200, body: { ok: true, felhasznalo: nyilvanos(f) } };
}

export function jelszoVisszaallitas(
  a: AuthAllapot, z: Azonositott, b: Record<string, unknown>, most: string,
): Valasz {
  if (!adminE(z)) return NEM_ADMIN;
  const f = a.tar.felhasznalok.find((x) => x.id === b.id);
  if (!f) return { status: 404, body: { ok: false, error: "Nincs ilyen felhasználó." } };
  const r = jelszotBeallit(f, String(b.jelszo ?? ""), most);
  if (!r.ok) return { status: 400, body: { ok: false, error: r.miert } };
  f.jelszotCserelni = true;
  zarMind(a.munkamenetek, f.id);
  mentM(a);
  saveTar(a.tarPath, a.tar);
  return { status: 200, body: { ok: true, miert:
    "A jelszó beállítva, és CSERÉLNI KELL az első belépéskor. A felhasználó " +
    "minden munkamenete lezárult." } };
}

export function megbizasAd(
  a: AuthAllapot, z: Azonositott, b: Record<string, unknown>, most: string,
): Valasz {
  if (!adminE(z)) return NEM_ADMIN;
  const m: Megbizas = {
    id: String(b.id ?? ujAzonosito("megb")),
    felhasznalo: String(b.felhasznalo ?? ""),
    csoport: String(b.csoport ?? ""),
    hatokor: String(b.hatokor ?? ""),
    tol: String(b.tol ?? most),
    ig: b.ig == null || b.ig === "" ? null : String(b.ig),
    forras: (b.forras ?? "kezi") as Megbizas["forras"],
    adta: z.felhasznalo.nev,
    miert: String(b.miert ?? ""),
  };
  if (!a.tar.felhasznalok.some((x) => x.id === m.felhasznalo)) {
    return { status: 400, body: { ok: false, error: "Ismeretlen felhasználó." } };
  }
  const gondok = validateMegbizasok(a.csoportok, a.helyek, [m]);
  const hibak = gondok.filter((g) => g.severity === "error");
  if (hibak.length) {
    return { status: 400, body: { ok: false, error: hibak.map((g) => g.message).join(" · "), gondok } };
  }
  a.megbizasok.push(m);
  ment(a.megbizasPath, a.megbizasok);
  // A JOGOSULTSÁG VÁLTOZOTT → az érintett munkamenetei újraszámolódnak.
  // Nem zárjuk le őket: a `azonosit()` minden kérésnél újraszámol.
  return { status: 200, body: { ok: true, megbizas: m, gondok } };
}

export function megbizasVisszavon(
  a: AuthAllapot, z: Azonositott, b: Record<string, unknown>, most: string,
): Valasz {
  if (!adminE(z)) return NEM_ADMIN;
  const i = a.megbizasok.findIndex((m) => m.id === b.id);
  if (i < 0) return { status: 404, body: { ok: false, error: "Nincs ilyen megbízás." } };
  const m = a.megbizasok[i];
  // A VISSZAVONÁS NEM TÖRLÉS. A megbízás lezárul MOST-tal — ha kitörölnénk,
  // az auditnaplóban szereplő „megbízás: megb.x” hivatkozás sehova nem mutatna,
  // és utólag nem lehetne megállapítani, MIÉRT volt joga valakinek.
  if (m.ig !== null && Date.parse(m.ig) <= Date.parse(most)) {
    return { status: 409, body: { ok: false, error: "Ez a megbízás már lejárt." } };
  }
  m.ig = most;
  ment(a.megbizasPath, a.megbizasok);
  zarMind(a.munkamenetek, m.felhasznalo);
  mentM(a);
  return { status: 200, body: { ok: true, megbizas: m, miert:
    "A megbízás LEZÁRULT (nem törlődött): az auditnaplóban rá hivatkozó sorok " +
    "különben sehova nem mutatnának, és utólag nem lehetne megállapítani, " +
    "miért volt joga valakinek." } };
}
