import { test } from "node:test";
import assert from "node:assert/strict";
import {
  arnyekEllenorzes, egyezik, hasheld, jelszoItelet, ujrahashelendo, HOSSZ_MIN,
} from "../core/auth/jelszo.ts";
import {
  belep, bootstrapTar, fekMp, jelszotBeallit, keres, alapertelmezettJelszoAll,
  SZABAD_KISERLET, FEK_MAX_MP,
} from "../core/auth/felhasznalo.ts";
import {
  ABSZOLUT_ORA, TETLENSEG_PERC, ellenoriz, nyit, zar, zarMind,
} from "../core/auth/munkamenet.ts";
import {
  beosztasbolKapcsolat, hatalyos, hatokorbeEsik, loadCsoportok, merleg,
  validateCsoportok, validateMegbizasok,
} from "../core/auth/csoport.ts";
import type { Megbizas } from "../core/auth/csoport.ts";
import { loadSzolgaltatok, validateSzolgaltatok } from "../core/auth/szolgaltato.ts";
import { kapu } from "../core/auth/kapu.ts";
import { loadHelyek } from "../core/fekvo/hely.ts";
import { decide } from "../core/store/hozzaferes.ts";

const cs = loadCsoportok("registry/auth/csoportok.json");
const helyek = loadHelyek("registry/fekvo/helyek.json");
const szolg = loadSzolgaltatok("registry/auth/szolgaltatok.json");
const T0 = "2026-09-08T08:00:00.000Z";

/* ── JELSZÓ ──────────────────────────────────────────────────────────── */

test("a hossz számít, nem az összetettség", () => {
  // A klasszikus „erős” jelszó megbukik, a jelmondat átmegy. Ez a NIST
  // SP 800-63B lényege, és ez a teszt bizonyítja, hogy tényleg így viselkedik.
  assert.equal(jelszoItelet("Jelszo1!").allapot, "rovid");
  assert.equal(jelszoItelet("helyes ló elem kapocs").allapot, "megfelel");
});

test("a tiltólista a végén álló számsoron át is fog", () => {
  // A „Tavasz2026!” minden összetételi feltételnek megfelel, és mégis
  // kitalálható — a tő levágása fogja meg.
  assert.equal(jelszoItelet("password2026").allapot, "tiltolistas");
  assert.equal(jelszoItelet("jelszo1234!!").allapot, "tiltolistas");
});

test("a saját adat SZÓKÖZ NÉLKÜL is saját adat", () => {
  const i = jelszoItelet("kismintaanna2026", ["Minta Anna"]);
  assert.equal(i.allapot, "sajatAdat");
  assert.match(i.miert, /mintaanna/);
});

test("a saját adatot szavanként is nézzük", () => {
  assert.equal(jelszoItelet("annaanyja kertje tavasszal", ["Minta Anna"]).allapot, "sajatAdat");
});

test("a lenyomat ellenőrizhető, a hibás alak nem dob", () => {
  const h = hasheld("helyes ló elem kapocs");
  assert.ok(egyezik("helyes ló elem kapocs", h));
  assert.ok(!egyezik("más", h));
  assert.ok(!egyezik("bármi", "csúnya-alak"));
  assert.ok(!ujrahashelendo(h));
  assert.ok(ujrahashelendo("scrypt$1024$8$1$AAAA$BBBB"), "gyengébb paraméter → újra kell hashelni");
});

test("az árnyék-ellenőrzés lefut és mindig hamis", () => {
  assert.equal(arnyekEllenorzes("bármi"), false);
});

/* ── FÉKEZÉS ─────────────────────────────────────────────────────────── */

test("a fék nő, de FELSŐ KORLÁTTAL — a fiók magától visszatér", () => {
  assert.equal(fekMp(SZABAD_KISERLET), 0, "az elgépelés nem támadás");
  assert.equal(fekMp(SZABAD_KISERLET + 1), 1);
  assert.ok(fekMp(50) === FEK_MAX_MP,
    "korlát nélkül a fékezés csendben zárolássá válna — és a zárolás maga a támadás");
});

test("a hibás név és a hibás jelszó UGYANAZT az üzenetet adja", () => {
  const t = bootstrapTar(T0);
  const a = belep(t, "nincs-ilyen", "akarmi", T0);
  const b = belep(t, "admin", "rossz", T0);
  assert.equal(a.allapot, "hibas");
  assert.equal(b.allapot, "hibas");
  assert.ok(a.miert.startsWith(b.miert.slice(0, 40)),
    "a megkülönböztetésből meg lehetne tudni, ki dolgozik itt");
});

test("fékezés után a helyes jelszó sem megy át azonnal", () => {
  const t = bootstrapTar(T0);
  for (let i = 0; i < 5; i++) belep(t, "admin", "rossz", T0);
  const r = belep(t, "admin", "admin", T0);
  assert.equal(r.allapot, "fekezve");
  assert.ok((r.varakozasMp ?? 0) > 0);
});

test("a külső szolgáltatóhoz tartozó felhasználó helyi jelszóval SOHA nem lép be", () => {
  const t = bootstrapTar(T0);
  const f = keres(t, "admin")!;
  f.szolgaltato = "eeszt";
  const r = belep(t, "admin", "admin", T0);
  assert.equal(r.allapot, "kulsoSzolgaltato");
  assert.match(r.miert, /NEM ok arra, hogy helyi jelszóra essünk vissza/);
});

/* ── BOOTSTRAP ───────────────────────────────────────────────────────── */

test("az admin:admin belép, de azonnal cserét kér", () => {
  const t = bootstrapTar(T0);
  assert.ok(alapertelmezettJelszoAll(t));
  assert.equal(belep(t, "admin", "admin", T0).allapot, "jelszotCserelni");
  jelszotBeallit(keres(t, "admin")!, "kek elefant sarga kapu", T0);
  assert.ok(!alapertelmezettJelszoAll(t), "csere után az alapértelmezett nem áll");
  assert.equal(belep(t, "admin", "kek elefant sarga kapu", T0).allapot, "belepett");
});

test("a bootstrap jelszó a saját szabályát BUKNÁ — ezért kivétel, és jelölve van", () => {
  assert.ok(!jelszoItelet("admin").megfelel);
  assert.ok(bootstrapTar(T0).felhasznalok[0].jelszotCserelni,
    "a kikerülés nyoma: az első dolga a csere");
});

/* ── MUNKAMENET ──────────────────────────────────────────────────────── */

test("a tétlenségi és az abszolút lejárat KÉT KÜLÖN dolgot véd", () => {
  const mind = [];
  const a = nyit("u1", "N", ["clinician"], [], T0);
  mind.push(a.munkamenet);
  // folyamatosan dolgozik → a tétlenségi óra újraindul…
  for (let p = 10; p <= ABSZOLUT_ORA * 60 - 10; p += 10) {
    ellenoriz(mind, a.token, uj(T0, p));
  }
  // …az abszolút mégis lejár. Enélkül a lopott munkamenet örökké élne.
  assert.equal(ellenoriz(mind, a.token, uj(T0, ABSZOLUT_ORA * 60 + 1)).allapot, "lejart");

  const mind2 = [];
  const b = nyit("u2", "N", ["clinician"], [], T0);
  mind2.push(b.munkamenet);
  assert.equal(ellenoriz(mind2, b.token, uj(T0, TETLENSEG_PERC + 1)).allapot, "tetlen");
});

test("ismeretlen token nem esik vissza semmire", () => {
  const mind = [nyit("u", "N", [], [], T0).munkamenet];
  assert.equal(ellenoriz(mind, "hamis", T0).allapot, "nincs");
  assert.equal(ellenoriz(mind, undefined, T0).allapot, "nincs");
});

test("a kijelentkezés és a tömeges zárás valóban zár", () => {
  const mind = [];
  const a = nyit("u1", "N", [], [], T0); mind.push(a.munkamenet);
  const b = nyit("u1", "N", [], [], T0); mind.push(b.munkamenet);
  assert.ok(zar(mind, a.token));
  assert.equal(zarMind(mind, "u1"), 1);
  assert.equal(mind.length, 0);
});

const uj = (t: string, perc: number) => new Date(Date.parse(t) + perc * 60_000).toISOString();

/* ── CSOPORT ÉS MEGBÍZÁS ─────────────────────────────────────────────── */

test("a csoportkészlet és a szolgáltatókészlet hibátlan", () => {
  assert.deepEqual(validateCsoportok(cs).filter((i) => i.severity === "error"), []);
  assert.deepEqual(validateSzolgaltatok(szolg).filter((i) => i.severity === "error"), []);
});

test("a hatókör LEFELÉ öröklődik, felfelé SOHA", () => {
  assert.ok(hatokorbeEsik(helyek, "hely.osztaly.szuloszoba", "hely.agy.szsz1"));
  assert.ok(hatokorbeEsik(helyek, "hely.klinika", "hely.agy.szsz1"));
  assert.ok(!hatokorbeEsik(helyek, "hely.agy.szsz1", "hely.osztaly.szuloszoba"),
    "egy ágyra szóló megbízásból nem lehet osztály");
  assert.ok(!hatokorbeEsik(helyek, "hely.osztaly.szuloszoba", "hely.agy.gya.1"),
    "a szülőszobai megbízás nem ér át a gyermekágyas osztályra");
});

const megb = (p: Partial<Megbizas>): Megbizas => ({
  id: "m1", felhasznalo: "u1", csoport: "csoport.apolo",
  hatokor: "hely.osztaly.szuloszoba", tol: T0, ig: uj(T0, 480),
  forras: "beosztas", adta: "dr. Vezető", miert: "délelőttös műszak", ...p,
});

test("a MŰSZAKHOZ KÖTÖTT megbízás nem lehet nyitott", () => {
  const hibak = validateMegbizasok(cs, helyek, [megb({ ig: null })])
    .filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /VISSZA NEM VONT engedély/);
});

test("az ápoló nem kaphat klinikai szintű hatókört", () => {
  const hibak = validateMegbizasok(cs, helyek, [megb({ hatokor: "hely.klinika" })])
    .filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /osztaly/);
});

test("az ügyeletes a teljes részleghez kap — de csak az ügyelet idejére", () => {
  const ok = megb({ csoport: "csoport.ugyeletes-orvos", hatokor: "hely.reszleg.szuleszet" });
  assert.deepEqual(validateMegbizasok(cs, helyek, [ok]).filter((i) => i.severity === "error"), []);
  const rossz = { ...ok, ig: null };
  assert.equal(validateMegbizasok(cs, helyek, [rossz])
    .filter((i) => i.severity === "error").length, 1,
    "a legtágabb klinikai hatókör kötelezően lezárt időablakkal jár");
});

test("adományozó nélkül a megbízás eredete visszakereshetetlen", () => {
  assert.equal(validateMegbizasok(cs, helyek, [megb({ adta: "" })])
    .filter((i) => i.severity === "error").length, 1);
});

test("a lejárt megbízás nem ad szerepkört, és MEGMONDJA, miért nem", () => {
  const m = [megb({})];
  const kozben = hatalyos(cs, m, "u1", uj(T0, 60));
  assert.deepEqual(kozben.szerepek, ["assistant"]);
  const utana = hatalyos(cs, m, "u1", uj(T0, 600));
  assert.deepEqual(utana.szerepek, []);
  assert.equal(utana.nemElo.length, 1);
  assert.match(utana.nemElo[0].miert, /lejárt/);
});

/* ── A BEOSZTÁS ELLÁTÁSI KAPCSOLATOT KELETKEZTET ─────────────────────── */

const fekves = [{ caseId: "eset-1", hely: "hely.agy.szsz1", tol: T0, ig: null }];

test("a beosztás ellátási kapcsolatot ad — a hatókörébe eső betegre", () => {
  const k = beosztasbolKapcsolat(helyek, cs, [megb({})], fekves, "Kis Éva", "u1");
  assert.equal(k.length, 1);
  assert.equal(k[0].caseId, "eset-1");
  assert.match(k[0].why, /beosztás: Ápoló/);
  // A KAPCSOLAT A MEGBÍZÁS ÉS A FEKVÉS METSZETE.
  assert.equal(k[0].until, uj(T0, 480), "a műszak vége a kapcsolat vége");
});

test("a másik osztály betegére NEM keletkezik kapcsolat", () => {
  const mas = [{ caseId: "eset-2", hely: "hely.agy.gya.1", tol: T0, ig: null }];
  assert.deepEqual(beosztasbolKapcsolat(helyek, cs, [megb({})], mas, "Kis Éva", "u1"), []);
});

test("nincs metszet → nincs kapcsolat", () => {
  // A beteget a műszak UTÁN vették fel.
  const kesobb = [{ caseId: "eset-3", hely: "hely.agy.szsz1", tol: uj(T0, 600), ig: null }];
  assert.deepEqual(beosztasbolKapcsolat(helyek, cs, [megb({})], kesobb, "Kis Éva", "u1"), []);
});

test("a teljes lánc: megbízás → kapcsolat → hozzáférési döntés", () => {
  const m = [megb({})];
  const most = uj(T0, 60);
  const h = hatalyos(cs, m, "u1", most);
  const k = beosztasbolKapcsolat(helyek, cs, m, fekves, "Kis Éva", "u1");
  const d = decide({ actor: "Kis Éva", roles: h.szerepek, action: "read",
    caseId: "eset-1", now: most, relations: k });
  assert.ok(d.ok);
  assert.match((d as { basis: string }).basis, /beosztás: Ápoló/);

  // A MŰSZAK UTÁN ugyanez elutasítás — ugyanabból az adatból.
  const kesobb = uj(T0, 600);
  const h2 = hatalyos(cs, m, "u1", kesobb);
  const d2 = decide({ actor: "Kis Éva", roles: h2.szerepek, action: "read",
    caseId: "eset-1", now: kesobb, relations: k });
  assert.ok(!d2.ok);
});

test("a mérleg számai a megbízásokból jönnek", () => {
  const m = [megb({ id: "a" }), megb({ id: "b", ig: null, forras: "kezi", csoport: "csoport.osztalyos-orvos" })];
  const x = merleg(cs, m, uj(T0, 60));
  assert.equal(x.megbizas, 2);
  assert.equal(x.elo, 2);
  assert.equal(x.nyitott, 1);
  assert.equal(x.csoport, cs.csoportok.length);
});

/* ── A KAPU ──────────────────────────────────────────────────────────── */

test("a kapu feltétellista, nem kapcsoló — és a hitelesítés MEGVAN", () => {
  const i = kapu({ env: {}, szolgaltatok: szolg, tar: bootstrapTar(T0) });
  const hit = i.feltetelek.find((f) => f.id === "hitelesites")!;
  assert.equal(hit.allapot, "all", "a megnevezett blokkoló elhárult");
  assert.ok(!i.elesRe, "de ebből NEM következik, hogy éles üzemre kész");
  assert.ok(i.feltetelek.filter((f) => f.allapot !== "all").every((f) => !f.fejlesztoi),
    "ami hiányzik, az mind SZERVEZETI feltétel — nem fejlesztői feladat");
});

test("az alapértelmezett jelszó a kapun is látszik", () => {
  const t = bootstrapTar(T0);
  assert.equal(kapu({ env: {}, szolgaltatok: szolg, tar: t })
    .feltetelek.find((f) => f.id === "alapertelmezettJelszo")!.allapot, "hianyzik");
  jelszotBeallit(keres(t, "admin")!, "kek elefant sarga kapu", T0);
  assert.equal(kapu({ env: {}, szolgaltatok: szolg, tar: t })
    .feltetelek.find((f) => f.id === "alapertelmezettJelszo")!.allapot, "all");
});

test("a „nem tudjuk” nem „rendben”", () => {
  const f = kapu({ env: {}, szolgaltatok: szolg, tar: null })
    .feltetelek.find((x) => x.id === "alapertelmezettJelszo")!;
  assert.equal(f.allapot, "nemMegallapithato");
  assert.notEqual(f.allapot, "all");
});

test("a rendszergazda NEM olvashat esetet", () => {
  const d = decide({ actor: "Admin", roles: ["admin"], action: "read",
    caseId: "eset-1", now: T0, relations: [] });
  assert.ok(!d.ok, "a mindenható admin a RENDSZER fölött mindenható, a betegadat fölött nem");
  assert.ok(decide({ actor: "Admin", roles: ["admin"], action: "login",
    caseId: "eset-1", now: T0, relations: [] }).ok);
});

test("a jelszó minimumhossza legalább 12", () => {
  assert.ok(HOSSZ_MIN >= 12);
});
