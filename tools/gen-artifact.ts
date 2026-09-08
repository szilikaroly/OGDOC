/**
 * AZ ARTIFACT ADATA — A RENDSZERBŐL, NEM KÉZZEL.
 *
 * Egy bemutató, amiben a számok kézzel vannak beírva, fél éven belül hazudik:
 * a rendszer javul, a bemutató nem. Ez a generátor ezért ugyanabból a
 * forrásból olvas, amiből a validátor: a regiszterekből, a tesztekből és a
 * kódból.
 *
 *     node --experimental-strip-types tools/gen-artifact.ts > artifact-adat.json
 *
 * Amit NEM tud kiolvasni — a modulok szöveges kidolgozását —, azt a
 * `docs/modulok/` fájljaiból veszi, és a hiányát KIMONDJA: egy modul, aminek
 * nincs dokumentuma, nem „üres”, hanem hiányzó.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { loadCsatornak, merleg as csMerleg, bizalom } from "../core/interop/csatorna.ts";
import { loadIsber, isberMerleg } from "../core/biobank/minta.ts";
import { loadHianyok, gyujt, merleg as hMerleg } from "../core/hianyzo/jegyzek.ts";
import type { ModulHiany } from "../core/hianyzo/jegyzek.ts";
import { modulHianyok } from "../core/hianyzo/modulhianyok.ts";
import { loadParameterek, merleg as pMerleg } from "../core/karbantartas/parameter.ts";
import { loadSzolgaltatok } from "../core/auth/szolgaltato.ts";
import { loadCsoportok } from "../core/auth/csoport.ts";
import { kapu } from "../core/auth/kapu.ts";
import { loadTar } from "../core/auth/felhasznalo.ts";
import { loadBtk } from "../core/gyermek/jelzes.ts";
import { loadMec, merleg as mecMerleg } from "../core/fogamzas/mec.ts";
import { loadHelyek, merleg as helyMerleg } from "../core/fekvo/hely.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const R = (p: string) => join(ROOT, p);

/* ── SORSZÁMLÁLÁS ────────────────────────────────────────────────────── */

function sorok(dir: string, kiterj: string[]): { fajl: number; sor: number } {
  let fajl = 0, sor = 0;
  const jar = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "helyi" && e.name !== "node_modules") jar(p); }
      else if (kiterj.some((k) => e.name.endsWith(k))) {
        fajl++; sor += readFileSync(p, "utf8").split("\n").length;
      }
    }
  };
  if (existsSync(dir)) jar(dir);
  return { fajl, sor };
}

/* ── MODULOK ─────────────────────────────────────────────────────────── */

export interface ModulSor {
  n: number;
  fajl: string | null;
  cim: string | null;
  alcim: string | null;
  sor: number;
  /** Van-e futó kód a modulhoz. */
  kod: string[];
  /** Van-e regiszterfájl a modulhoz. */
  regiszter: string[];
  /** Van-e teszt. */
  teszt: string[];
  kodSor?: number;
  tesztSor?: number;
  tesztDb?: number;
}

interface TerkepSor { n: number; kod: string[]; teszt: string[]; doksi: string | null }

function terkep(): Map<number, TerkepSor> {
  const t = JSON.parse(readFileSync(R("registry/modulok/terkep.json"), "utf8")) as
    { modulok: TerkepSor[] };
  return new Map(t.modulok.map((m) => [m.n, m]));
}

function modulok(): ModulSor[] {
  const tk = terkep();
  const dir = R("docs/modulok");
  const fajlok = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  const map = new Map<number, string>();
  for (const f of fajlok) {
    const n = Number(f.slice(0, 2));
    if (Number.isInteger(n)) map.set(n, f);
  }
  const max = Math.max(...map.keys(), 37);
  const ki: ModulSor[] = [];
  for (let n = 1; n <= max; n++) {
    const f = map.get(n);
    let cim: string | null = null, alcim: string | null = null, sorSzam = 0;
    if (f) {
      const t = readFileSync(join(dir, f), "utf8");
      const s = t.split("\n");
      sorSzam = s.length;
      cim = (s.find((x) => x.startsWith("# ")) ?? "").replace(/^#\s*/, "")
        .replace(/^Modul \d+\s*[—-]\s*/, "") || null;
      alcim = (s.find((x) => x.startsWith("*") && x.endsWith("*")) ?? "")
        .replace(/^\*|\*$/g, "") || null;
    }
    const t = tk.get(n);
    ki.push({
      n, fajl: f ?? null, cim, alcim, sor: sorSzam,
      kod: t?.kod ?? [], regiszter: [], teszt: t?.teszt ?? [],
    });
  }
  // Regiszterfájlok modulszám szerint
  const jarReg = (d: string) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "helyi") jarReg(p); continue; }
      if (!e.name.endsWith(".json")) continue;
      try {
        const j = JSON.parse(readFileSync(p, "utf8")) as { modul?: unknown };
        if (typeof j.modul === "number") {
          ki.find((m) => m.n === j.modul)?.regiszter.push(p.slice(ROOT.length));
        }
      } catch { /* nem minden regiszterfájl objektum */ }
    }
  };
  jarReg(R("registry"));
  // A KÓD ÉS A TESZT MÉRETE — hogy a modul „mérete” ne állítás legyen.
  for (const m of ki) {
    m.kodSor = m.kod.reduce((n2, p) => {
      const abs = R(p);
      if (!existsSync(abs)) return n2;
      return n2 + (statSync(abs).isDirectory()
        ? sorok(abs, [".ts"]).sor : readFileSync(abs, "utf8").split("\n").length);
    }, 0);
    m.tesztSor = m.teszt.reduce((n2, p) =>
      n2 + (existsSync(R(p)) ? readFileSync(R(p), "utf8").split("\n").length : 0), 0);
    m.tesztDb = m.teszt.reduce((n2, p) => n2 + (existsSync(R(p))
      ? (readFileSync(R(p), "utf8").match(/^test\(/gm) ?? []).length : 0), 0);
  }
  return ki;
}

/* ── A KÉSZLET ───────────────────────────────────────────────────────── */

const reg = loadRegistry(R("registry/variables"));
const csatornak = loadCsatornak(R("registry/interop/csatornak.json"));
const isber = loadIsber(R("registry/biobank/isber.json"));
const hianyok = loadHianyok(R("registry/hianyzo/tetelek.json"));
const parameterek = loadParameterek(R("registry/karbantartas/parameterek.json"));
const szolgaltatok = loadSzolgaltatok(R("registry/auth/szolgaltatok.json"));
const csoportok = loadCsoportok(R("registry/auth/csoportok.json"));
const btk = loadBtk(R("registry/gyermek/beleegyezes-btk.json"));
const mec = loadMec(R("registry/fogamzas/usmec-2024.json"));
const helyek = loadHelyek(R("registry/fekvo/helyek.json"));

const MODUL_HIANYOK: ModulHiany[] = modulHianyok(R);

const hianyMind = gyujt(hianyok, MODUL_HIANYOK);

const mag = sorok(R("core"), [".ts"]);
const teszt = sorok(R("test"), [".ts"]);
const eszkoz = sorok(R("tools"), [".ts", ".py"]);
const doksi = sorok(R("docs"), [".md"]);

const ki = {
  keszult: new Date().toISOString().slice(0, 10),
  szamok: {
    valtozo: reg.all().length,
    regiszterFajl: sorok(R("registry"), [".json"]).fajl,
    magSor: mag.sor, magFajl: mag.fajl,
    tesztFajl: teszt.fajl, tesztSor: teszt.sor,
    eszkozFajl: eszkoz.fajl,
    doksiFajl: doksi.fajl, doksiSor: doksi.sor,
    modul: 37,
  },
  modulok: modulok(),
  kapu: kapu({ env: process.env, szolgaltatok, tar: loadTar(R(".adat/felhasznalok.json")) }),
  szolgaltatok: szolgaltatok.szolgaltatok,
  csoportok: csoportok.csoportok,
  csatornak: csatornak.csatornak.map((c) => ({ ...c, bizalom: bizalom(c) })),
  csatornaMerleg: csMerleg(csatornak),
  isber: isber.tetelek,
  isberMerleg: isberMerleg(isber),
  isberLicenc: isber.licencNote,
  parameterek: parameterek.parameterek,
  parameterMerleg: pMerleg(parameterek, [], new Date().toISOString()),
  hianyok: hianyMind,
  hianyMerleg: hMerleg(hianyMind),
  btk: {
    matrix: btk.matrix, korsavok: btk.korsavok, besorolasok: btk.besorolasok,
    alairt: Boolean(btk.alairas), korhatar: btk.beleegyezesiKorhatar,
    forras: btk.forras,
  },
  mec: mecMerleg(mec),
  hely: helyMerleg(helyek),
};

/* ── AZ ALÁÍRÁSRA VÁRÓ TÉTELEK ───────────────────────────────────────
 *
 * A VALIDÁTOR SAJÁT KIMENETÉBŐL, NEM KÜLÖN LISTÁBÓL.
 *
 * Két lista két igazság lenne, és a második mindig az elhanyagoltabb. A
 * figyelmeztetések túlnyomó része ugyanaz a mondat: egy kapu zárva, mert
 * senki nem írt alá semmit. Ez nem elmaradás, hanem a rendszer működése —
 * de látni kell, hány ilyen van, és mibe csoportosul.
 */
function figyelmeztetesek(): Array<{ csoport: string; id: string; szoveg: string }> {
  const ki2: Array<{ csoport: string; id: string; szoveg: string }> = [];
  let nyers: string;
  try {
    nyers = execFileSync(process.execPath,
      ["--experimental-strip-types", R("tools/validate.ts")],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 32 << 20 });
  } catch (e) {
    nyers = String((e as { stdout?: string }).stdout ?? "");
  }
  for (const sor of nyers.split("\n")) {
    const m = /^warning (\S+) (.*)$/.exec(sor);
    if (!m) continue;
    const [, id, szoveg] = m;
    ki2.push({ csoport: id.split(".")[0], id, szoveg });
  }
  return ki2;
}

const figy = figyelmeztetesek();
const csoportok2: Record<string, number> = {};
for (const f of figy) csoportok2[f.csoport] = (csoportok2[f.csoport] ?? 0) + 1;

process.stdout.write(JSON.stringify({
  ...ki,
  figyelmeztetesek: figy,
  figyelmeztetesCsoport: Object.entries(csoportok2)
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ csoport: k, db: v })),
}, null, 1) + "\n");
void statSync;
