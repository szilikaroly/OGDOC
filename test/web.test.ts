/**
 * A WEBES RÉTEG A TÁROLÓ FÖLÖTT — vég a végig, valódi HTTP-n.
 *
 * A `core/store/` tesztjei (`test/tarolo.test.ts`) azt bizonyítják, hogy a
 * tároló helyesen viselkedik. Ezek a tesztek azt, hogy a WEBES RÉTEG tényleg
 * rajta megy keresztül — nem mellette.
 *
 * A különbség nem formai. Egy jogosultsági réteg, amit a kiszolgáló egyetlen
 * ponton megkerül, ugyanolyan hasznos, mint amelyik nincs is; és a megkerülés
 * pont olyan helyeken szokott lenni, ahol a kód „csak gyorsan” beolvas valamit.
 * Ezért ezek a tesztek VALÓDI kiszolgálót indítanak, valódi fájlrendszerre.
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SERVER = join(ROOT, "web", "server.ts");

const DIR = mkdtempSync(join(tmpdir(), "ogdoc-web-"));
const PORT = 3200 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;

let proc: ChildProcess | null = null;

/** Elindít egy kiszolgálót, és megvárja, amíg tényleg válaszol. */
async function indit(env: Record<string, string> = {}): Promise<ChildProcess> {
  const p = spawn(process.execPath, ["--experimental-strip-types", SERVER], {
    cwd: ROOT,
    env: {
      ...process.env, OGDOC_SYNTHETIC: "1", OGDOC_DATA: DIR,
      PORT: String(PORT), ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${BASE}/api/archive`);
      if (r.ok) return p;
    } catch { /* még nem áll */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  p.kill();
  throw new Error("a kiszolgáló nem indult el");
}

function leallit(p: ChildProcess | null): Promise<void> {
  return new Promise((res) => {
    if (!p || p.killed) return res();
    p.once("exit", () => res());
    p.kill();
  });
}

/**
 * A CSELEKVŐ MOSTANTÓL MUNKAMENET-SÜTI, NEM FEJLÉC.
 *
 * Korábban ezek a tesztek egy `x-ogdoc-actor` fejlécet küldtek, és a
 * kiszolgáló elhitte. Most valódi bejelentkezés van: a `belep()` felhasználót
 * hoz létre, jelszót cserél és sütit ad vissza. Ez több lépés — de pontosan az
 * a több lépés, ami eddig hiányzott.
 */
type Valasz = { status: number; body: never };

function sutiKi(r: Response): string {
  const raw = r.headers.get("set-cookie") ?? "";
  return /ogdoc_munkamenet=([^;]*)/.exec(raw)?.[1] ?? "";
}

async function hivas(
  path: string, token?: string, init: RequestInit = {},
): Promise<Valasz> {
  const headers: Record<string, string> = { ...(init.headers as object ?? {}) };
  if (token) headers.cookie = `ogdoc_munkamenet=${token}`;
  const r = await fetch(BASE + path, { ...init, headers });
  return { status: r.status, body: await r.json().catch(() => ({})) as never };
}

async function post(path: string, token: string | undefined, adat: unknown) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.cookie = `ogdoc_munkamenet=${token}`;
  const r = await fetch(BASE + path, {
    method: "POST", headers, body: JSON.stringify(adat) });
  return { r, status: r.status, body: await r.json().catch(() => ({})) as never };
}

const kap = (path: string, token?: string) => hivas(path, token);

async function ir(token: string, id: string, value: unknown): Promise<Valasz> {
  const x = await post("/api/value", token, { id, value });
  return { status: x.status, body: x.body };
}

/** A rendszergazda munkamenete — az admin:admin után KÖTELEZŐ jelszócserével. */
let ADMIN = "";
const JELSZO = "kek elefant sarga kapu 7";

async function adminBelep(): Promise<string> {
  const b = await post("/api/auth/belepes", undefined,
    { felhasznalonev: "admin", jelszo: "admin" });
  if (b.status === 200 && (b.body as { allapot: string }).allapot === "jelszotCserelni") {
    const c = await post("/api/auth/jelszo", sutiKi(b.r), { regi: "admin", uj: JELSZO });
    return sutiKi(c.r);
  }
  const c = await post("/api/auth/belepes", undefined,
    { felhasznalonev: "admin", jelszo: JELSZO });
  return sutiKi(c.r);
}

/**
 * FELHASZNÁLÓ + MEGBÍZÁS + BEJELENTKEZÉS, egy lépésben.
 *
 * A kiosztott jelszót a rendszer cserére jelöli, ezért a bejelentkezés után
 * azonnal cserélünk — így a teszt ugyanazt az utat járja végig, mint egy
 * valódi új dolgozó.
 */
async function letrehoz(
  felhasznalonev: string, nev: string,
  megbizas: { csoport: string; hatokor: string; tol?: string; ig?: string | null;
              forras?: string } | null,
): Promise<string> {
  const kezdo = "elso kiosztott jelszo 9";
  // A jelszó NEM tartalmazhatja a felhasználónevet — a saját-adat ellenőrzés
  // ezt (szóközök nélkül is) elutasítja. A teszt első verziója éppen ebbe
  // futott bele: `sajat jelszo ${felhasznalonev} 4`.
  const sajat = `kilenc zold kapu ${felhasznalonev.length} tavasz`;
  await post("/api/admin/felhasznalo", ADMIN, { felhasznalonev, nev, jelszo: kezdo });
  const u = await hivas("/api/admin/attekintes", ADMIN);
  const id = (u.body as { felhasznalok: Array<{ id: string; felhasznalonev: string }> })
    .felhasznalok.find((f) => f.felhasznalonev === felhasznalonev)!.id;
  if (megbizas) {
    await post("/api/admin/megbizas", ADMIN, {
      felhasznalo: id, tol: new Date(Date.now() - 3600_000).toISOString(),
      ig: null, miert: "teszt", ...megbizas });
  }
  const b = await post("/api/auth/belepes", undefined, { felhasznalonev, jelszo: kezdo });
  const c = await post("/api/auth/jelszo", sutiKi(b.r), { regi: kezdo, uj: sajat });
  return sutiKi(c.r);
}

/** A bemutató szereplői — a jogosultsági réteg három rétegére. */
const K: Record<string, string> = {};

after(async () => {
  await leallit(proc);
  rmSync(DIR, { recursive: true, force: true });
});

/* ── 1. A KAPU ──────────────────────────────────────────────────────── */

test("szintetikus jelzés nélkül a kiszolgáló EL SEM INDUL", async () => {
  // A hitelesítés hiánya nem figyelmeztetés a README-ben, hanem induláskori
  // akadály. Aki elolvassa az üzenetet, tudja, MI hiányzik és miért.
  const p = spawn(process.execPath, ["--experimental-strip-types", SERVER], {
    cwd: ROOT,
    env: { ...process.env, OGDOC_SYNTHETIC: "", PORT: String(PORT + 900) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let err = "";
  p.stderr!.on("data", (c) => { err += String(c); });
  const kod: number = await new Promise((res) => p.once("exit", (c) => res(c ?? -1)));
  assert.notEqual(kod, 0, "hibás módban is elindult");
  // A KAPU MÁR NEM EGY KAPCSOLÓ, HANEM FELTÉTELLISTA. A hitelesítés megvan —
  // ebből NEM következik, hogy éles üzemre kész: a TLS, a második tényező, a
  // kulcstár és az alapértelmezett jelszó mind hiányzik, és egyik sem
  // fejlesztői feladat.
  assert.match(err, /ÉLES ÜZEMRE \d+\/\d+ FELTÉTEL ÁLL/);
  assert.match(err, /A cselekvő kilétét ellenőrzés igazolja/);
  assert.match(err, /nem fejlesztői feladat/);
  assert.match(err, /OGDOC_SYNTHETIC=1/);
});

/* ── 2. A HÁROM JOGOSULTSÁGI RÉTEG, HTTP-N ──────────────────────────── */

test("a kiszolgáló elindul szintetikus módban", async () => {
  proc = await indit();
  const r = await kap("/api/archive");
  assert.equal(r.status, 200);
});

test("az admin:admin belép, de az első dolga a JELSZÓCSERE", async () => {
  const b = await post("/api/auth/belepes", undefined,
    { felhasznalonev: "admin", jelszo: "admin" });
  assert.equal(b.status, 200);
  assert.equal((b.body as { allapot: string }).allapot, "jelszotCserelni");
  // A cserén túl semmi mást nem tehet.
  const tiltott = await hivas("/api/admin/attekintes", sutiKi(b.r));
  assert.equal(tiltott.status, 403);
  const c = await post("/api/auth/jelszo", sutiKi(b.r), { regi: "admin", uj: JELSZO });
  assert.equal(c.status, 200);
  ADMIN = sutiKi(c.r);
  assert.ok(ADMIN);
});

test("a gyenge jelszót a kiszolgáló elutasítja", async () => {
  const r = await post("/api/admin/felhasznalo", ADMIN,
    { felhasznalonev: "gyenge", nev: "Gyenge Géza", jelszo: "Jelszo1!" });
  assert.equal(r.status, 400);
  assert.match((r.body as { error: string }).error, /HOSSZ számít/);
});

test("a szereplők létrejönnek, megbízással", async () => {
  // OSZTÁLYOS ORVOS a szülőszobán — a demó beteg ott fekszik.
  K.anna = await letrehoz("minta.anna", "dr. Minta Anna",
    { csoport: "csoport.osztalyos-orvos", hatokor: "hely.osztaly.szuloszoba" });
  // KLINIKUS, DE MÁS OSZTÁLYON: a diploma nem ad jogot.
  K.imre = await letrehoz("idegen.imre", "dr. Idegen Imre",
    { csoport: "csoport.osztalyos-orvos", hatokor: "hely.osztaly.nogyogyaszat" });
  // LEJÁRT MEGBÍZÁS: a szerepkör megvolt, a jog nincs.
  K.rezso = await letrehoz("regi.rezso", "dr. Régi Rezső",
    { csoport: "csoport.osztalyos-orvos", hatokor: "hely.osztaly.szuloszoba",
      tol: "2024-01-01T00:00:00.000Z", ig: "2024-03-01T00:00:00.000Z" });
  K.auditor = await letrehoz("nagy.nora", "Nagy Nóra (auditor)",
    { csoport: "csoport.auditor", hatokor: "hely.klinika" });
  K.dpo = await letrehoz("toth.katalin", "Tóth Katalin",
    { csoport: "csoport.dpo", hatokor: "hely.klinika" });
  for (const [k, v] of Object.entries(K)) assert.ok(v, `nincs munkamenet: ${k}`);
});

test("cselekvő nélkül nincs adat — és nincs alapértelmezett felhasználó", async () => {
  const r = await kap("/api/case");
  assert.equal(r.status, 401);
  assert.match((r.body as { error: string }).error, /NEM választ alapértelmezett/);
});

test("ismeretlen munkamenet nem esik vissza semmilyen szerepkörre", async () => {
  const r = await kap("/api/case", "hamis-token-ami-nem-letezik");
  assert.equal(r.status, 401);
});

test("a hibás jelszó és a nem létező név UGYANAZT mondja", async () => {
  const a = await post("/api/auth/belepes", undefined,
    { felhasznalonev: "nincs.ilyen.ember", jelszo: "akarmi123456" });
  const b = await post("/api/auth/belepes", undefined,
    { felhasznalonev: "minta.anna", jelszo: "rossz jelszo 12345" });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal((a.body as { allapot: string }).allapot,
               (b.body as { allapot: string }).allapot);
});

test("SZEREPKÖR: az auditor nem olvashat leletet", async () => {
  const r = await kap("/api/case", K.auditor);
  assert.equal(r.status, 403);
  assert.equal((r.body as { kind: string }).kind, "denied");
  assert.match((r.body as { error: string }).error, /auditor auditnaplót olvas, leletet nem/);
});

test("ELLÁTÁSI KAPCSOLAT: a diploma nem ad jogot", async () => {
  const r = await kap("/api/case", K.imre);
  assert.equal(r.status, 403);
  assert.match((r.body as { error: string }).error, /nincs ellátási kapcsolat/);
});

test("IDŐABLAK: a lejárt megbízás nem ad jogot — és MEGNEVEZI a valódi okot", async () => {
  const r = await kap("/api/case", K.rezso);
  assert.equal(r.status, 403);
  // Korábban itt a `decide()` „MÁR NEM ÉL” üzenete állt. Most a megbízás jár
  // le előbb, és a rendszer ezt mondja ki — mert ez a valódi ok. A rossz okot
  // mutató elutasítás rosszabb a semmilyennél: a felhasználó szerepkört kérne
  // a rendszergazdától, holott műszakot kellene kapnia.
  assert.match((r.body as { error: string }).error, /egyetlen megbízása sem él most/);
  assert.match((r.body as { error: string }).error, /NEM szerepkörhiány/);
});

test("élő kapcsolattal az olvasás megy, és HORDOZZA A JOGALAPOT", async () => {
  const r = await kap("/api/case", K.anna);
  assert.equal(r.status, 200);
  const b = r.body as { basis: string; caseId: string; breakGlass: boolean };
  assert.match(b.basis, /ellátási kapcsolat/);
  assert.equal(b.caseId, "eset-demo");
  assert.equal(b.breakGlass, false);
});

/* ── 3. ÍRÁS ÉS LEVEZETÉS ───────────────────────────────────────────── */

test("az írás átmegy a tárolón, és a levezetés utána lefut", async () => {
  const a = await ir(K.anna, "vitals.bp.systolic", 158);
  assert.equal(a.status, 200);
  assert.equal((a.body as { ok: boolean }).ok, true);

  const b = await ir(K.anna, "vitals.bp.diastolic", 98);
  const body = b.body as {
    ok: boolean; seq: number; entries: number;
    values: Array<{ id: string; value: unknown; provenance?: string }>;
  };
  assert.equal(body.ok, true);
  assert.equal(body.entries, 2, "két naplóbejegyzés");
  const map = body.values.find((v) => v.id === "vitals.map");
  assert.ok(map, "a MAP nem került levezetésre");
  assert.equal(map!.provenance, "derived");
});

test("jogosultság nélkül az írás 403, és NEM keletkezik bejegyzés", async () => {
  const elotte = await kap("/api/case", K.anna);
  const n = (elotte.body as { entries: number }).entries;

  const r = await ir(K.imre, "vitals.pulse", 88);
  assert.equal(r.status, 403);

  const utana = await kap("/api/case", K.anna);
  assert.equal((utana.body as { entries: number }).entries, n,
    "elutasított írás után is nőtt a napló");
});

test("az ÉRVÉNYESSÉGI elutasítás 200-as — üzenet, nem hibaoldal", async () => {
  // A kettőt nem szabad összemosni: a jogosultsági elutasítás 403 és emberi
  // döntést kíván; a tartományon kívüli érték a felületen javítandó.
  const r = await ir(K.anna, "vitals.bp.systolic", 9000);
  assert.equal(r.status, 200);
  assert.equal((r.body as { ok: boolean }).ok, false);
  assert.match((r.body as { error: string }).error, /maximum|tartomány/i);
});

test("levezetett mezőre írni nem lehet — és ez sem 500-as", async () => {
  const r = await ir(K.anna, "vitals.map", 100);
  assert.equal(r.status, 200);
  assert.equal((r.body as { ok: boolean }).ok, false);
  assert.match((r.body as { error: string }).error, /levezetett/);
});

/* ── 4. AZ AUDITNAPLÓ ───────────────────────────────────────────────── */

test("a klinikus NEM olvashat auditnaplót, az auditor igen", async () => {
  const k = await kap("/api/audit", K.anna);
  assert.equal(k.status, 403);
  assert.match((k.body as { error: string }).error, /kit láttak el hol és mikor/);

  const a = await kap("/api/audit", K.auditor);
  assert.equal(a.status, 200);
  assert.ok((a.body as { events: unknown[] }).events.length > 0);
});

test("minden olvasás, írás ÉS elutasítás megjelenik az auditnaplóban", async () => {
  const a = await kap("/api/audit", K.auditor);
  const events = (a.body as {
    events: Array<{ actor: string; action: string; basis: string; denyReason?: string }>;
  }).events;

  assert.ok(events.some((e) => e.actor === "dr. Minta Anna" && e.action === "write"));
  assert.ok(events.some((e) => e.actor === "dr. Minta Anna" && e.action === "read"));
  // AZ ELUTASÍTÁS IS NAPLÓZANDÓ: a sikertelen kísérlet legalább annyira
  // érdekes, mint a sikeres — a naplózatlan kopogtatásból lesz a betörés.
  assert.ok(events.some((e) => e.actor === "dr. Idegen Imre" && e.action === "denied"));
  // A LEJÁRT MEGBÍZÁS ELUTASÍTÁSA A HITELESÍTÉSI RÉTEGBEN történik, a tároló
  // előtt — és attól még naplóköteles. Enélkül épp az az esemény tűnne el,
  // amit egy auditornak látnia kell: valaki olyan próbált hozzáférni, akinek a
  // joga megszűnt.
  const rezso = events.find((e) => e.actor === "dr. Régi Rezső" && e.action === "denied");
  assert.ok(rezso, "a lejárt megbízás elutasítása nem került az auditnaplóba");
  assert.match(rezso!.basis, /hitelesítési réteg/);
  assert.match(rezso!.denyReason ?? "", /nincsEloMegbizas/);

  for (const e of events) {
    assert.ok(e.basis?.trim() || e.denyReason?.trim(),
      "auditsor jogalap és ok nélkül");
  }
});

test("az auditnapló KÜLÖN fájlban van az üzemeltetési naplótól", async () => {
  const files = readdirSync(join(DIR, "naplo"));
  assert.ok(files.includes("audit.jsonl"));
  assert.ok(files.includes("op.jsonl"));
  // Megőrzési idő, olvasók, törölhetőség: mind más. Egy fájlban tartva
  // a szigorúbb szabály húzódna rá a lazábbra vagy fordítva.
  const audit = readFileSync(join(DIR, "naplo", "audit.jsonl"), "utf8");
  assert.ok(!audit.includes('"kind":"op"'));
});

test("az auditnapló nem tartalmaz ÉRTÉKET, csak azonosítót", async () => {
  // „ki, mit, mikor, milyen alapon” — az ÉRTÉK nem tartozik ide: az
  // auditnapló megőrzési ideje más, és a lelet másolása benne új adatkezelés.
  const audit = readFileSync(join(DIR, "naplo", "audit.jsonl"), "utf8");
  assert.ok(audit.includes("vitals.bp.systolic"), "a változóazonosító hiányzik");
  assert.ok(!/\b158\b/.test(audit), "a rögzített ÉRTÉK bekerült az auditnaplóba");
});

/* ── 5. PERZISZTENCIA ÉS TITKOSÍTÁS ─────────────────────────────────── */

test("az archívum épsége olvasási jog NÉLKÜL is ellenőrizhető", async () => {
  const r = await kap("/api/archive");
  assert.equal(r.status, 200);
  const b = r.body as { ok: boolean; entries: number; why: string };
  assert.equal(b.ok, true);
  assert.ok(b.entries >= 2);
  assert.match(b.why, /REJTJELEZETT ALAKON/);
});

test("a lemezre írt eset TITKOSÍTVA van — a lelet nem olvasható ki belőle", async () => {
  const nyers = readFileSync(join(DIR, "esetek", "eset-demo.jsonl"), "utf8");
  assert.ok(nyers.includes("AES-256-GCM"));
  assert.ok(!nyers.includes("vitals.bp.systolic"),
    "a változóazonosító nyílt szövegben az archívumban");
  assert.ok(!/"value":\s*158/.test(nyers), "az érték nyílt szövegben");
});

test("az eset ÉS a munkamenet TÚLÉLI a kiszolgáló újraindítását", async () => {
  const elotte = await kap("/api/case", K.anna);
  const n = (elotte.body as { entries: number }).entries;

  await leallit(proc);
  proc = await indit();

  // A MUNKAMENET IS TÚLÉLI. Memóriában tartott munkamenettárral egy frissítés
  // az ügyeletest is kilépteti, műszak közepén — és a fájlba mentés nem
  // gyengít, mert a tárban a token LENYOMATA áll, nem a token.
  const utana = await kap("/api/case", K.anna);
  assert.equal(utana.status, 200);
  const b = utana.body as {
    entries: number; values: Array<{ id: string; value: unknown }>;
  };
  assert.equal(b.entries, n, "az újraindítás után nem ugyanannyi bejegyzés");
  assert.equal(b.values.find((v) => v.id === "vitals.bp.systolic")?.value, 158);
  // …és a levezetett mezők ÚJRASZÁMOLVA jönnek vissza, nem a naplóból.
  assert.ok(b.values.some((v) => v.id === "vitals.map"));
});

/* ── 6. AMIT A RÉTEG NEM ÁLLÍT MAGÁRÓL ──────────────────────────────── */

test("a kiszolgáló minden válaszban megjelöli, hogy szintetikus üzem", async () => {
  const r = await fetch(`${BASE}/api/formspec`);
  assert.equal(r.headers.get("x-ogdoc-synthetic"), "1");
});

test("a kapu állapota bejelentkezés NÉLKÜL is olvasható", async () => {
  // Üzemeltetői információ, nem betegadat: aki a rendszert telepíti, tudnia
  // kell, mi hiányzik az éles üzemhez, MIELŐTT belép.
  const r = await kap("/api/kapu");
  assert.equal(r.status, 200);
  const b = r.body as {
    elesRe: boolean; feltetelek: Array<{ id: string; allapot: string; fejlesztoi: boolean }>;
  };
  assert.equal(b.feltetelek.find((f) => f.id === "hitelesites")!.allapot, "all");
  assert.equal(b.elesRe, false, "a hitelesítés megléte nem teszi éles üzemre késszé");
  const hianyzo = b.feltetelek.filter((f) => f.allapot !== "all");
  assert.ok(hianyzo.length > 0);
  assert.ok(hianyzo.every((f) => !f.fejlesztoi),
    "ami hiányzik, az mind szervezeti feltétel — nem fejlesztői feladat");
});

test("a rendszergazda NEM olvashat leletet", async () => {
  const r = await kap("/api/case", ADMIN);
  assert.equal(r.status, 403);
});

test("a séma cselekvő nélkül is lekérhető — az adat nem", async () => {
  // Az űrlapleírás nem betegadat: a regiszterből jön, és a felület enélkül
  // nem tud bejelentkező képernyőt sem rajzolni.
  const spec = await kap("/api/formspec");
  assert.equal(spec.status, 200);
  const eset = await kap("/api/case");
  assert.equal(eset.status, 401);
});

/* ── 7. A DPO TÖRLÉSI FELÜLETE ──────────────────────────────────────── */

async function torles(path: string, token: string, rendelkezes: unknown) {
  const x = await post(path, token, { rendelkezes });
  return { status: x.status, body: x.body };
}

const REND = {
  caseId: "eset-demo", fajta: "kriptografiai",
  jogalap: "GDPR 17. cikk (1) b) — a hozzájárulás visszavonása",
  indoklas: "A beteg a kutatási hozzájárulását visszavonta.",
  rendelte: { nev: "Tóth Katalin", szerep: "dpo", at: "2026-09-05T12:00:00.000Z" },
};

test("a törlést csak a DPO nézheti meg — a klinikus nem", async () => {
  const r = await torles("/api/torles/elonezet", K.anna, REND);
  assert.equal(r.status, 403);
  assert.match((r.body as { error: string }).error, /adatvédelmi tisztviselő/);
});

test("az ELŐNÉZET semmit nem változtat, csak megmutatja az akadályokat", async () => {
  // Egy visszafordíthatatlan művelet, aminek nincs előnézete, nem felület,
  // hanem csapda.
  const elotte = await kap("/api/archive");
  const r = await torles("/api/torles/elonezet", K.dpo, REND);
  assert.equal(r.status, 200);
  const e = r.body as {
    vegrehajthato: boolean;
    akadalyok: Array<{ id: string; suly: string; why: string; mihezKotott: string }>;
  };
  assert.equal(e.vegrehajthato, false);
  assert.ok(e.akadalyok.some((a) => a.id === "masodikAlairo"));
  assert.ok(e.akadalyok.some((a) => a.id === "megorzesEllenorzetlen"));
  for (const a of e.akadalyok) assert.ok(a.mihezKotott.trim());

  const utana = await kap("/api/archive");
  assert.deepEqual(utana.body, elotte.body, "az előnézet megváltoztatta az esetet");
});

test("a végrehajtás 409-cel elakad — és NEM 403-cal", async () => {
  // A DPO-nak VAN joga; az ÁLLAPOT nem engedi. A kettő összemosása azt
  // sugallná, hogy több jogosultsággal a törlés menne — pedig nem menne.
  const r = await torles("/api/torles", K.dpo, REND);
  assert.equal(r.status, 409);
  assert.equal((r.body as { ok: boolean }).ok, false);
  assert.ok((r.body as { ertekeles: unknown }).ertekeles);
});

test("az elakadt törlés után az eset ÉRINTETLEN és olvasható", async () => {
  const r = await kap("/api/case", K.anna);
  assert.equal(r.status, 200);
  assert.equal(
    (r.body as { values: Array<{ id: string; value: unknown }> })
      .values.find((v) => v.id === "vitals.bp.systolic")?.value, 158);
});

test("a VISSZAVONÁS az, ami most is teljesíthető — és megmondja, mi marad", async () => {
  const r = await kap("/api/torles/visszavonas", K.dpo);
  assert.equal(r.status, 200);
  const v = r.body as {
    megszunik: string[]; marad: Array<{ mi: string; miert: string }>;
    osszefoglalo: string;
  };
  assert.ok(v.megszunik.some((m) => /azonnali hatállyal/.test(m)));
  assert.ok(v.marad.length >= 10);
  for (const m of v.marad) assert.match(m.miert, /17\. cikk \(3\)/);
  assert.match(v.osszefoglalo, /nem utólag/);
});

test("a visszavonás hatását a KEZELŐORVOS is megnézheti", async () => {
  // A betegnek magának is látnia kell, MIELŐTT dönt — a kezelőorvos pedig ez
  // alapján tud tanácsot adni. Ez nem törlési művelet, hanem tájékoztatás.
  const r = await kap("/api/torles/visszavonas", K.anna);
  assert.equal(r.status, 200);
});
