/**
 * A webes kiszolgáló — Node beépített `http`-vel, FÜGGŐSÉG NÉLKÜL.
 *
 *   OGDOC_SYNTHETIC=1 npm run web   →  http://localhost:3000
 *
 * MI VÁLTOZOTT
 *
 * A csontváz eddig EGY esetet tartott a memóriában, jogosultság és napló
 * nélkül. Mostantól a `core/store/` alatt fut:
 *
 *   · PERZISZTENCIA — az eset titkosítva, fájlban, és túléli az újraindítást;
 *   · JOGOSULTSÁG — szerepkör → ellátási kapcsolat → időablak, minden
 *     olvasásnál és írásnál;
 *   · AUDITNAPLÓ — a napló ELŐBB íródik, mint ahogy az adat kimegy;
 *   · ESETENKÉNTI ELKÜLÖNÍTÉS — külön lánc, külön kulcs, külön archívum.
 *
 * A HITELESÍTÉS MEGVAN — ÉS EBBŐL NEM KÖVETKEZIK, HOGY A KAPU FELESLEGES.
 *
 * A cselekvőt már nem egy ellenőrizetlen kérésfejléc állítja: jelszavas
 * belépés, munkamenet-süti, és a jogosultság minden kérésnél a MEGBÍZÁSOKBÓL
 * számolódik újra (`core/auth/`). Ez megszünteti azt, hogy bárki bárkinek
 * kiadhassa magát.
 *
 * De a részleges megoldást teljesnek mondani ugyanaz a hiba, ami ellen az
 * egész rendszer épül. A kapu ezért FELTÉTELLISTA lett (`core/auth/kapu.ts`):
 * hitelesítés, alapértelmezett jelszó, TLS, második tényező, kulcstár. A
 * kiszolgáló akkor indul éles módban, ha MIND teljesül — addig szintetikus
 * módban fut, és induláskor kiírja, pontosan hol tart, és melyik hiány NEM
 * fejlesztői feladat.
 *
 * A KULCSOK egy fájlban állnak a titkosított adat mellett (`web/kulcsok.ts`).
 * Éles rendszerben ez HSM vagy KMS; a csere egyetlen `KeyStore` implementáció.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "../core/load.ts";
import { SecureCaseStore } from "../core/store/biztonsagos.ts";
import { FileArchive } from "../core/store/fajl.ts";
import { FileHorgonyTar } from "../core/pilot/horgony.ts";
import { canReadAudit } from "../core/store/hozzaferes.ts";
import type { CareRelation } from "../core/store/hozzaferes.ts";
import { beosztasbolKapcsolat } from "../core/auth/csoport.ts";
import { loadDocuments } from "../core/docs/registry.ts";
import { coverage, LANGS, SOURCE_LANG, UI } from "../core/i18n.ts";
import type { Lang } from "../core/types.ts";
import { docFor, formSpec } from "./api.ts";
import { loadModulcimek } from "../core/ui/modulcimek.ts";
import {
  archiveHealth, readCase, torlesElonezet, torlesVegrehajtas,
  visszavonasElonezet, writeValue,
} from "./tarolo-api.ts";
import {
  adminAttekintes, azonosit, belepes, betolt, en as enVegpont, felhasznaloAllapot,
  jelszocsere, jelszoVisszaallitas, kapuAllapot, kilepes, megbizasAd,
  megbizasVisszavon, sutibol, sutitKuld, ujFelhasznalo,
} from "./auth-api.ts";
import { kapu, indulhat } from "../core/auth/kapu.ts";
import { loadSzolgaltatok } from "../core/auth/szolgaltato.ts";
import { loadTar } from "../core/auth/felhasznalo.ts";
import { fileSink, FileKeyStore, readAudit } from "./kulcsok.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(HERE, "..");
const PORT = Number(process.env.PORT ?? 3000);
const DATA = process.env.OGDOC_DATA ?? join(ROOT, ".adat");

/* ── A KAPU ─────────────────────────────────────────────────────────── */

const KAPU = kapu({
  env: process.env,
  szolgaltatok: loadSzolgaltatok(join(ROOT, "registry/auth/szolgaltatok.json")),
  tar: loadTar(join(DATA, "felhasznalok.json")),
});
const blokk = indulhat(KAPU);
if (blokk) {
  console.error(blokk);
  process.exit(2);
}
const TLS = process.env.OGDOC_TLS === "1";

const reg = loadRegistry(join(ROOT, "registry", "variables"));
const issues = reg.validate().filter((i) => i.severity === "error");
if (issues.length) {
  console.error("A regiszter hibás, a kiszolgáló nem indul:");
  for (const i of issues) console.error(`  ${i.id}: ${i.message}`);
  process.exit(1);
}

/**
 * A BEMUTATÓ ESET.
 *
 * Egyetlen esetazonosító, mert a csontváz nem esetkezelő. Az ELKÜLÖNÍTÉS
 * viszont valódi: az ellátási kapcsolatok erre az egy esetre szólnak, és egy
 * másik azonosítóra ugyanazok a cselekvők már nem kapnak jogot.
 */
const CASE_ID = process.env.OGDOC_CASE ?? "eset-demo";

const docs = loadDocuments(join(ROOT, "registry", "documents", "core.json"));
// A MODULCÍMEK ADATBÓL JÖNNEK. A felület eddig a nyers kulcsot írta ki.
const modulcimek = loadModulcimek(join(ROOT, "registry", "felulet", "modulcimek.json"));

/* ── HITELESÍTÉS ────────────────────────────────────────────────────── */

const MOST = () => new Date().toISOString();
const AUTH = betolt(DATA, join(ROOT, "registry"), MOST(), CASE_ID);

/**
 * A HITELESÍTÉSI RÉTEG ELUTASÍTÁSAI IS AZ AUDITNAPLÓBA MENNEK.
 *
 * Amíg a jogosultság a tárolóban dőlt el, minden elutasítást a tároló naplózott.
 * A hitelesítési réteg viszont a tároló ELŐTT utasít el — lejárt megbízás,
 * ismeretlen munkamenet, zárolt fiók —, és ha ez a réteg nem naplózna, ezek az
 * események NYOMTALANUL eltűnnének. Pedig épp ezeket kell egy auditornak
 * látnia: valaki olyan próbált hozzáférni, akinek a joga megszűnt.
 */
AUTH.naplo = (e) => {
  sink.audit({
    kind: "audit", at: MOST(), actor: e.actor, action: "denied",
    caseId: e.caseId ?? CASE_ID,
    basis: "hitelesítési réteg — a kérés a tárolóig el sem jutott",
    denyReason: e.why,
  });
};

/**
 * AZ ELLÁTÁSI KAPCSOLATOK MINDEN KÉRÉSNÉL ÚJRASZÁMOLÓDNAK.
 *
 * Nem induláskor befagyasztott tömb: a beosztásból származó kapcsolat a
 * műszakkal együtt jár le. Ha itt fix lista állna, a délelőttös ápoló
 * kapcsolata este is élne — és senkinek nem tűnne fel.
 */
function kapcsolatok(): CareRelation[] {
  const ki: CareRelation[] = [];
  for (const f of AUTH.tar.felhasznalok) {
    ki.push(...beosztasbolKapcsolat(
      AUTH.helyek, AUTH.csoportok, AUTH.megbizasok, AUTH.fekvesek, f.nev, f.id));
  }
  return ki;
}
const kulcsok = new FileKeyStore(join(DATA, "kulcsok", "dev-keys.json"));
const sink = fileSink(join(DATA, "naplo"));
const store = new SecureCaseStore({
  archive: new FileArchive(join(DATA, "esetek")),
  keys: kulcsok,
  sink,
  relations: kapcsolatok,
  // A HORGONY KÜLÖN KÖNYVTÁRBAN, nem az esetek mellett: ami a naplófájlt
  // elviszi (törölt kötet, félbeszakadt másolás), azt vinné a bizonyítékot is.
  // Éles telepítésnél ez KÜLÖN KÖTET, jobb esetben külön gép.
  horgony: new FileHorgonyTar(join(DATA, "horgony")),
});

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function json(
  res: import("node:http").ServerResponse, status: number, body: unknown,
): void {
  const s = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(s),
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
    // A felület ebből tudja, hogy figyelmeztető sávot kell mutatnia.
    "x-ogdoc-synthetic": "1",
  });
  res.end(s);
}

async function body(req: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 64 * 1024) throw new Error("túl nagy kérés");
    chunks.push(c as Buffer);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

/**
 * A KÉRT NYELV — `?lang=`, majd `Accept-Language`, majd a forrásnyelv.
 *
 * Ismeretlen nyelvnél NEM találgatunk: a forrásnyelv jön vissza. Egy „de”
 * kérésre kiszolgált angol felület rosszabb, mint a magyar, mert azt hinné a
 * felhasználó, hogy a rendszer tudja a nyelvét.
 */
function wantedLang(url: URL, header?: string): Lang {
  const q = url.searchParams.get("lang");
  if (q && (LANGS as string[]).includes(q)) return q as Lang;
  for (const part of (header ?? "").split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if ((LANGS as string[]).includes(code)) return code as Lang;
  }
  return SOURCE_LANG;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const lang = wantedLang(url, req.headers["accept-language"]);
  const traceId = randomUUID();

  try {
    /* ── Cselekvő nélkül is kiszolgálható: a séma, nem az adat ──────── */

    if (path === "/api/formspec") return json(res, 200, formSpec(reg, lang, modulcimek));

    /**
     * A KAPU ÁLLAPOTA — hitelesítés nélkül is olvasható.
     *
     * Ez üzemeltetői információ, nem betegadat: aki a rendszert telepíti,
     * tudnia kell, mi hiányzik az éles üzemhez, MIELŐTT belép.
     */
    if (path === "/api/kapu") {
      const v = kapuAllapot(AUTH, process.env);
      return json(res, v.status, v.body);
    }

    /* ── HITELESÍTÉS ────────────────────────────────────────────────── */

    if (path === "/api/auth/belepes" && req.method === "POST") {
      const b = await body(req) as { felhasznalonev?: string; jelszo?: string };
      const v = belepes(AUTH, b.felhasznalonev ?? "", b.jelszo ?? "", MOST());
      if (v.sutiToken !== undefined) sutitKuld(res, v.sutiToken, TLS);
      return json(res, v.status, v.body);
    }

    if (path === "/api/auth/kilepes" && req.method === "POST") {
      const v = kilepes(AUTH, sutibol(req));
      sutitKuld(res, null, TLS);
      return json(res, v.status, v.body);
    }

    if (path === "/api/auth/jelszo" && req.method === "POST") {
      const b = await body(req) as { regi?: string; uj?: string };
      const v = jelszocsere(AUTH, req, b.regi ?? "", b.uj ?? "", MOST());
      if (v.sutiToken !== undefined) sutitKuld(res, v.sutiToken, TLS);
      return json(res, v.status, v.body);
    }

    if (path === "/api/auth/en") {
      const v = enVegpont(AUTH, req, MOST());
      return json(res, v.status, v.body);
    }

    if (path.startsWith("/api/doc/")) {
      const id = decodeURIComponent(path.slice("/api/doc/".length));
      if (!reg.get(id)) return json(res, 404, { error: `ismeretlen változó: ${id}` });
      return json(res, 200, docFor(reg, id, lang));
    }

    if (path === "/api/i18n") {
      const strings: Record<string, string> = {};
      for (const [k, v] of Object.entries(UI)) strings[k] = v[lang] ?? v[SOURCE_LANG] ?? k;
      return json(res, 200, {
        lang, langs: LANGS, sourceLang: SOURCE_LANG, strings,
        coverage: coverage(reg.all().map((d) => d.label), lang),
      });
    }

    /**
     * AZ ARCHÍVUM ÉPSÉGE — olvasási jog NÉLKÜL.
     *
     * Az üzemeltetőnek nincs joga a lelethez, de kell tudnia, hogy a mentés
     * ép. Ez a végpont ezért nem kér cselekvőt, és nem ad vissza tartalmat.
     */
    if (path === "/api/archive") {
      return json(res, 200, await archiveHealth(store, CASE_ID));
    }

    if (path === "/favicon.ico") {
      res.writeHead(204, { "cache-control": "public, max-age=86400" });
      return res.end();
    }

    /* ── Innentől CSELEKVŐ KELL ─────────────────────────────────────── */

    const z = azonosit(AUTH, req, MOST());
    const s = z.ok
      ? { ok: true as const, actor: { nev: z.felhasznalo.nev, roles: z.szerepek },
          who: { actor: z.felhasznalo.nev, roles: z.szerepek, traceId } }
      : { ok: false as const, status: z.status, error: z.error };

    /* ── ADMIN ──────────────────────────────────────────────────────── */

    if (path.startsWith("/api/admin/")) {
      if (!z.ok) return json(res, z.status, { ok: false, error: z.error });
      // Az állapotot változtató kérés csak JSON törzzsel fogadható el: egy
      // idegen oldalról elküldött HTML-űrlap nem tud ilyen fejlécet küldeni
      // előellenőrzés nélkül, az előellenőrzést pedig nincs CORS-szabály,
      // ami átengedné. Ez a SameSite=Strict melletti második CSRF-védelem.
      if (req.method === "POST"
        && !String(req.headers["content-type"] ?? "").includes("application/json")) {
        return json(res, 415, { ok: false, error:
          "Az állapotot változtató kéréshez `application/json` törzs kell. Ez " +
          "nem formaság: ez akadályozza meg, hogy egy idegen oldalról elküldött " +
          "űrlap a te nevedben módosítson." });
      }
      const b = req.method === "POST" ? await body(req) as Record<string, unknown> : {};
      const v =
        path === "/api/admin/attekintes" ? adminAttekintes(AUTH, z, MOST())
        : path === "/api/admin/felhasznalo" ? ujFelhasznalo(AUTH, z, b, MOST())
        : path === "/api/admin/felhasznalo/allapot" ? felhasznaloAllapot(AUTH, z, b, MOST())
        : path === "/api/admin/felhasznalo/jelszo" ? jelszoVisszaallitas(AUTH, z, b, MOST())
        : path === "/api/admin/megbizas" ? megbizasAd(AUTH, z, b, MOST())
        : path === "/api/admin/megbizas/visszavon" ? megbizasVisszavon(AUTH, z, b, MOST())
        : null;
      if (!v) return json(res, 404, { ok: false, error: "nincs ilyen admin végpont" });
      return json(res, v.status, v.body);
    }

    if (path === "/api/case") {
      if (!s.ok) return json(res, s.status, { error: s.error });
      const r = await readCase(reg, store, CASE_ID, s.who, lang);
      return r.ok
        ? json(res, 200, { ...r.body, actor: s.actor.nev, roles: s.actor.roles })
        : json(res, r.status, { error: r.error, kind: r.kind });
    }

    if (path === "/api/value" && req.method === "POST") {
      if (!s.ok) return json(res, s.status, { error: s.error });
      const b = await body(req) as { id?: string; value?: unknown; provenance?: string };
      if (typeof b.id !== "string") return json(res, 400, { error: "hiányzó id" });
      const r = await writeValue(reg, store, CASE_ID, s.who,
        { id: b.id, value: b.value, provenance: b.provenance }, lang);
      if (r.ok) return json(res, 200, { ok: true, ...r.body });
      // Az ÉRVÉNYESSÉGI elutasítás 200-as: a felületnek üzenetet kell mutatnia,
      // nem hibaoldalt. A JOGOSULTSÁGI elutasítás 403 — az más ügy.
      return json(res, r.status, { ok: false, error: r.error, ...("kind" in r ? { kind: r.kind } : {}) });
    }

    /**
     * AZ AUDITNAPLÓ — és aki olvashatja.
     *
     * Az auditor szerepkör AUDITNAPLÓT olvas, leletet nem; a klinikus
     * fordítva. Ez nem finomság: az auditnapló önmagában is érzékeny, mert
     * megmondja, kit láttak el hol és mikor.
     */
    if (path === "/api/audit") {
      if (!s.ok) return json(res, s.status, { error: s.error });
      if (!canReadAudit(s.who.roles)) {
        return json(res, 403, {
          error:
            `A(z) „${s.who.roles.join(", ")}” szerepkör nem olvashat auditnaplót. ` +
            `Az auditnapló megmondja, kit láttak el hol és mikor — ez önmagában ` +
            `is érzékeny adat.`,
        });
      }
      return json(res, 200, { events: readAudit(sink.auditPath, 200) });
    }

    /**
     * A DPO TÖRLÉSI FELÜLETE.
     *
     * Három végpont, és a sorrendjük a lényeg: előbb meg lehet nézni, MI
     * TÖRTÉNNE, aztán megnézni, mi az, ami a törlés HELYETT most is
     * teljesíthető, és csak azután végrehajtani. Egy visszafordíthatatlan
     * művelet, aminek nincs előnézete, nem felület, hanem csapda.
     */
    if (path === "/api/torles/elonezet" && req.method === "POST") {
      if (!s.ok) return json(res, s.status, { error: s.error });
      if (!s.who.roles.includes("dpo")) {
        return json(res, 403, {
          error:
            `A törlést adatvédelmi tisztviselő rendelheti el. A(z) ` +
            `„${s.who.roles.join(", ")}” szerepkör nem — a törlés ` +
            `visszafordíthatatlan, és a felelőssége nevesített.`,
        });
      }
      const b = await body(req) as { rendelkezes?: unknown };
      return json(res, 200, torlesElonezet(docs, {
        rendelkezes: (b.rendelkezes ?? {}) as never,
        kulcsMegsemmisitheto: typeof kulcsok.destroy === "function",
      }));
    }

    if (path === "/api/torles/visszavonas") {
      if (!s.ok) return json(res, s.status, { error: s.error });
      // A visszavonás HATÁSÁT bárki megnézheti, akinek joga van az esethez:
      // a betegnek magának is látnia kell, MIELŐTT dönt.
      return json(res, 200, visszavonasElonezet(docs, CASE_ID));
    }

    if (path === "/api/torles" && req.method === "POST") {
      if (!s.ok) return json(res, s.status, { error: s.error });
      const b = await body(req) as { rendelkezes?: unknown };
      const r = await torlesVegrehajtas(store, docs, s.who, {
        rendelkezes: (b.rendelkezes ?? {}) as never,
        kulcsMegsemmisitheto: typeof kulcsok.destroy === "function",
      });
      if (r.ok) return json(res, 200, { ok: true, ...r.body });
      if ("ertekeles" in r) {
        // 409: a kérés érvényes, az ÁLLAPOT nem engedi. Nem jogosultsági ügy.
        return json(res, 409, { ok: false, ertekeles: r.ertekeles });
      }
      return json(res, r.status, { ok: false, error: r.error, kind: r.kind });
    }

    /* ── Statikus fájlok — csak a public/ alól ──────────────────────── */

    const rel = path === "/" ? "index.html" : path.replace(/^\/+/, "");
    if (rel.includes("..")) return json(res, 400, { error: "érvénytelen útvonal" });
    const file = join(HERE, "public", rel);
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file)] ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
    });
    res.end(data);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "ENOENT") return json(res, 404, { error: "nincs ilyen útvonal" });
    return json(res, 500, { error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`OGDOC webes réteg  →  http://localhost:${PORT}`);
  console.log(`${reg.all().length} változó, ${formSpec(reg, "hu", modulcimek).length} szekció.`);
  console.log(`Eset: ${CASE_ID} · adatkönyvtár: ${DATA}`);
  console.log("");
  console.log("Perzisztencia, jogosultság és auditnapló: ÉLES (core/store).");
  console.log(`Hitelesítés: JELSZAVAS — ${AUTH.tar.felhasznalok.length} felhasználó, ` +
              `${AUTH.megbizasok.length} megbízás.`);
  console.log("");
  console.log(`ÉLES ÜZEM: ${KAPU.osszefoglalo}`);
  for (const f of KAPU.feltetelek) {
    const jel = f.allapot === "all" ? "  ✓" : f.allapot === "hianyzik" ? "  ✗" : "  ?";
    console.log(`${jel} ${f.cim}${f.allapot !== "all" && !f.fejlesztoi ? "   [nem fejlesztői feladat]" : ""}`);
  }
  if (!KAPU.elesRe) {
    console.log("");
    console.log("Szintetikus módban fut. Részletek: GET /api/kapu");
  }
  const alap = KAPU.feltetelek.find((f) => f.id === "alapertelmezettJelszo");
  if (alap?.allapot === "hianyzik") {
    console.log("");
    console.log("  ⚠  AZ „admin” FIÓK JELSZAVA MÉG MINDIG „admin”.");
    console.log("     Belépés után a rendszer az első dologként a cserét kéri.");
  }
});
