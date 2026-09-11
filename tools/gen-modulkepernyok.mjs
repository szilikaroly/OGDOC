/**
 * MODULKÉPERNYŐ-GALÉRIA — a FUTÓ felületről.
 *
 *   OGDOC_SYNTHETIC=1 npm run web            # másik ablakban
 *   NODE_PATH=$(npm root -g) node tools/gen-modulkepernyok.mjs \
 *     --jelszo "a jelenlegi admin-jelszó"
 *
 * Kimenet: docs/artifact/modulkepernyok.html (~6,5 MB, gitignore-olt).
 *
 * MIÉRT A GENERÁTOR VAN A REPÓBAN, ÉS NEM A KIMENET.
 *
 * A galéria 46 beágyazott képernyőképből áll, és minden egyes futásnál
 * MÁS: a felület a regiszterből generálódik, tehát egy új változó új mezőt
 * tesz a lapra, és eltolja alatta az összeset. Egy befagyasztott 6,5 MB-os
 * HTML a repóban két hét múlva már nem azt mutatná, ami fut — és épp az a
 * hibacsalád, ami ellen ez a rendszer épül: egy állítás, amit senki nem
 * ellenőriz, elcsúszik.
 *
 * A generátor viszont mindig a MOSTANI felületet fényképezi. Ezért ő megy a
 * repóba, a kimenete nem.
 *
 * EGY KÜLSŐ FÜGGŐSÉG, SZÁNDÉKOSAN ELKÜLÖNÍTVE. Ez az egyetlen eszköz, ami
 * Playwrightot kíván — ezért `.mjs`, nem `.ts`: a klinikai mag és a
 * validálás továbbra is futásidejű függőség NÉLKÜL fut, és ez a fájl nem
 * mossa el azt a határt. Ha a Playwright nincs telepítve, ez az egy eszköz
 * nem fut le; minden más igen.
 */
// A PLAYWRIGHT `require`-rel JÖN BE, NEM `import`-tal.
//
// Az ESM-feloldás NEM veszi figyelembe a `NODE_PATH`-t, a CJS `require`
// viszont igen — és a Playwright itt jellemzően GLOBÁLISAN van telepítve,
// nem a projekt `node_modules`-ában (a projektnek nincs is: a mag futásidejű
// függőség nélkül fut, és ez az eszköz nem mossa el azt a határt).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync, readdirSync } from "node:fs";

const ARG = (n, alap) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : alap;
};
const CIM = ARG("cim", "http://localhost:3000");
const FELH = ARG("felhasznalo", "admin");
const JELSZO = ARG("jelszo", "admin");
const KI = ARG("ki", "docs/artifact/modulkepernyok.html");
const BONGESZO = ARG("bongeszo", process.env.OGDOC_CHROMIUM ?? undefined);
const SZEL = 1400, MAG = 1050;

/**
 * A MODULKULCSOK OLVASHATÓ NEVE.
 *
 * A felület a NYERS kulcsot írja ki fejlécként (`hx.repro`, `pedgyn`), mert a
 * kulcsokhoz nincs megjelenítendő név a regiszterben. Ez a tábla CSAK a
 * galéria olvashatóságát szolgálja, és nem pótolja a hiányt: ha a felület
 * klinikus elé kerül, a nevek a REGISZTERBE valók, nem ide.
 */
const NEV = {
  addr: "Lakcím", admin: "Azonosító adatok", allergy: "Allergia",
  anthro: "Antropometria", cardio: "Kardiológia", code: "Kódolás — BNO és OENO",
  complaints: "Panaszok", ctx: "Ellátási kontextus", demog: "Demográfia",
  diet: "Diéta", disch: "Elbocsátás", ekg: "EKG — tizenkét elvezetés",
  epi: "Epikrízis", "exam.obs": "Szülészeti vizsgálat", fu: "Utánkövetési hozzájárulás",
  hx: "Anamnézis", "hx.eeszt": "EESZT-előzmény", "hx.family": "Családi anamnézis",
  "hx.gyn": "Nőgyógyászati előzmény", "hx.life": "Életmód",
  "hx.origin": "Saját születési előzmény", "hx.psy": "Pszichiátriai előzmény",
  "hx.repro": "Reprodukciós anamnézis", "hx.supp": "Étrend-kiegészítők",
  "hx.surg": "Műtéti előzmény", "hx.sys": "Belszervi előzmény",
  imaging: "Képalkotás és CTG", lab: "Labor", labour: "Szülés", nb: "Újszülött",
  neo: "Neonatológia", onc: "Onkológia", op: "Műtét", out: "Kimenetel",
  pedgyn: "Gyermeknőgyógyászat", plan: "Ellátástervezés", prom: "PROM-kérdőívek",
  psy: "Pszichológia — EPDS és társai", rules: "Szabálykimenetek", rx: "Gyógyszerelés",
  score: "Pontszámok — Bishop", status: "Fizikális státusz",
  szuloszoba: "Szülőszoba — Apgar", utankovetes: "Utánkövetés",
  vitals: "Vitális paraméterek", vizsgalatok: "Magzati biometria",
};

/** Példamezők a regiszterből — hogy a kártya megmondja, mi van a blokkban. */
function peldak() {
  const ki = {};
  for (const f of readdirSync("registry/variables")) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(readFileSync(join("registry/variables", f), "utf8"));
    for (const v of Array.isArray(d) ? d : (d.variables ?? [])) {
      const m = v.module ?? "?";
      (ki[m] ??= []).push(v.label?.hu ?? "");
    }
  }
  for (const k of Object.keys(ki)) ki[k] = ki[k].filter(Boolean).slice(0, 3);
  return ki;
}

const esc = (s) => String(s).replace(/[&<>"]/gu, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const szam = (n) => n.toLocaleString("hu-HU").replace(/ /gu, " ");

const b = await chromium.launch(BONGESZO ? { executablePath: BONGESZO } : {});
const p = await b.newPage({ viewport: { width: SZEL, height: MAG } });
await p.goto(CIM, { waitUntil: "networkidle" });

// BELÉPÉS. Az első belépésnél a rendszer jelszócserét KÖVETEL — ez nem
// megkerülhető, és nem is akarjuk megkerülni: a galéria attól hiteles, hogy
// ugyanazon az úton megy be, mint bárki más.
await p.fill("#belepoUrlap input:not([type=password])", FELH);
await p.fill("#belepoUrlap input[type=password]", JELSZO);
await p.click("#belepoUrlap button");
await p.waitForTimeout(1800);
if (await p.locator("#csereUrlap").isVisible().catch(() => false)) {
  console.error(
    `A(z) „${FELH}” fiók jelszavát a rendszer CSERÉLTETNI akarja, mielőtt bármit mutatna.\n` +
    `Lépj be egyszer a felületen, cseréld le, és add meg itt: --jelszo "…"`);
  await b.close(); process.exit(1);
}
if (!(await p.locator("main").isVisible().catch(() => false))) {
  console.error(
    `A lelet nem nyílt meg. A rendszergazda önmagában NEM olvas leletet — adj\n` +
    `magadnak klinikusi megbízást az adminpanelen, aztán futtasd újra.`);
  await b.close(); process.exit(1);
}

const modulok = await p.evaluate(() => {
  const gy = [...document.querySelectorAll("#form > div > *")];
  const jelolok = [];
  gy.forEach((e, i) => { if (e.classList.contains("module")) jelolok.push(i); });
  const teteje = (e) => e.getBoundingClientRect().top + scrollY;

  // A MAGASSÁGOT A KÖVETKEZŐ JELÖLŐ TETEJÉHEZ MÉRJÜK, nem az utolsó mező
  // aljához.
  //
  // Az első változat az utolsó DOM-testvér `bottom`-ját vette — és három
  // modulnál (`op`, `status`, `vitals`) az utolsó testvér egy REJTETT,
  // kattintásra nyíló mező. A rejtett elem `getBoundingClientRect()`-je csupa
  // nulla, tehát a `0 − top` nagy NEGATÍV számot adott: a galéria
  // −92 156 pixeles összmagasságot írt ki, három modulnál pedig
  // −50 000 körüli értéket. Ugyanaz a hibacsalád, mint a felület `hidden`
  // bogara: egy nem látszó elem geometriája nem nulla, hanem NEM ÉRTELMEZETT.
  const ki = [];
  for (let k = 0; k < jelolok.length; k++) {
    const i = jelolok[k];
    let mezo = 0;
    for (let j = i + 1; j < gy.length && !gy[j].classList.contains("module"); j++) {
      mezo += gy[j].querySelectorAll("input,select,textarea").length;
    }
    const utolso = gy[gy.length - 1];
    const kovetkezoTeteje = k + 1 < jelolok.length
      ? teteje(gy[jelolok[k + 1]])
      : teteje(utolso) + utolso.getBoundingClientRect().height;
    ki.push({ kulcs: gy[i].textContent.trim(), index: i, mezo,
              magassag: Math.round(kovetkezoTeteje - teteje(gy[i])) });
  }
  return ki;
});
const rossz = modulok.filter((m) => m.magassag <= 0);
if (rossz.length) {
  console.error(`${rossz.length} modul magassága nem pozitív ` +
    `(${rossz.map((m) => `${m.kulcs}=${m.magassag}`).join(", ")}). ` +
    `A galéria nem készül el hibás számokkal.`);
  await b.close(); process.exit(1);
}
console.log(`${modulok.length} modulblokk · együtt ` +
  `${szam(modulok.reduce((a, m) => a + m.magassag, 0))} px`);

const konyvtar = mkdtempSync(join(tmpdir(), "ogdoc-kep-"));
const PELDA = peldak();
const kartyak = [];
let osszMezo = 0, osszMag = 0;

for (const [i, m] of modulok.entries()) {
  await p.evaluate((idx) => {
    const el = [...document.querySelectorAll("#form > div > *")][idx];
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - 12, behavior: "instant" });
  }, m.index);
  await p.waitForTimeout(120);
  const ut = join(konyvtar, `${i}.jpg`);
  await p.screenshot({ path: ut, type: "jpeg", quality: 74 });
  const kep = readFileSync(ut).toString("base64");
  const nev = NEV[m.kulcs] ?? m.kulcs;
  const pelda = (PELDA[m.kulcs] ?? []).map(esc).join(" · ");
  osszMezo += m.mezo; osszMag += m.magassag;
  kartyak.push(`<button class="kartya" data-kulcs="${esc(m.kulcs)}" data-mezo="${m.mezo}">
  <div class="kep"><img alt="A(z) ${esc(nev)} modul képernyője" loading="lazy"
    src="data:image/jpeg;base64,${kep}"></div>
  <div class="fej">
    <div class="kulcs">${esc(m.kulcs)}</div>
    <div class="nev">${esc(nev)}</div>
    <div class="meret"><span><b>${m.mezo}</b> mező</span><span><b>${szam(m.magassag)}</b> px</span></div>
    <div class="pelda">${pelda}</div>
  </div>
</button>`);
  process.stdout.write(`\r  ${i + 1}/${modulok.length} · ${m.kulcs}${" ".repeat(20)}`);
}
console.log();
await b.close();
rmSync(konyvtar, { recursive: true, force: true });

const legnagyobb = Math.max(...modulok.map((m) => m.mezo));
writeFileSync(KI, sablon({
  kartyak: kartyak.join("\n"), db: modulok.length,
  osszMezo: szam(osszMezo), osszMag: szam(osszMag), legnagyobb,
  legmagasabbKulcs: modulok.reduce((a, b2) => (b2.magassag > a.magassag ? b2 : a)).kulcs,
  legmagasabbPx: szam(Math.max(...modulok.map((m) => m.magassag))),
  szel: SZEL, mag: MAG,
}));
console.log(`→ ${KI} (${(readFileSync(KI).length / 1e6).toFixed(1)} MB)`);

function sablon(v) {
  return readFileSync("tools/modulkepernyok.sablon.html", "utf8")
    .replace(/\{\{(\w+)\}\}/gu, (_, k) => String(v[k] ?? ""));
}
