/**
 * A DPO TÖRLÉSI FELÜLETE — a kapuk, a kétágú visszavonás, a tanúsítvány.
 *
 * Amit ezek a tesztek bizonyítanak, az nem az, hogy a rendszer törölni tud.
 * Az egy sor volna. Azt bizonyítják, hogy **mikor NEM töröl** — és hogy amikor
 * nem, akkor megmondja, mi hárítaná el az akadályt, és mit lehet helyette
 * megtenni.
 *
 * A legdrágább hiba mindkét irányban lehetséges: a kérésre törlő rendszer
 * jogszabályt sért, a semmit nem törlő és semmit nem magyarázó rendszer pedig
 * a beteget fosztja meg attól, hogy az adatai fölött bármi beleszólása legyen.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { DocumentRegistry, loadDocuments } from "../core/docs/registry.ts";
import type { DocumentDef } from "../core/docs/types.ts";
import {
  ertekelTorles, megmaradTorlesUtan, tanusitvany, torlesiAkadalyok,
  validateRendelkezes, visszavonasHatasa,
} from "../core/store/torles.ts";
import type { TorlesiRendelkezes } from "../core/store/torles.ts";
import { MemoryArchive, SecureCaseStore } from "../core/store/biztonsagos.ts";
import type { KeyStore, Who } from "../core/store/biztonsagos.ts";
import { memorySink } from "../core/log/types.ts";
import type { CareRelation } from "../core/store/hozzaferes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = loadDocuments(join(HERE, "..", "registry", "documents", "core.json"));
const NOW = "2026-09-05T12:00:00.000Z";

const REND: TorlesiRendelkezes = {
  caseId: "eset-1", fajta: "kriptografiai",
  jogalap: "GDPR 17. cikk (1) b) — a hozzájárulás visszavonása",
  indoklas: "A beteg a kutatási hozzájárulását visszavonta, és törlést kért.",
  rendelte: { nev: "Tóth Katalin", szerep: "dpo", at: NOW },
  masodikAlairo: { nev: "Kovács Péter", szerep: "jogi", at: NOW },
  megorzesLejart: "2020-01-01T00:00:00.000Z",
};

/** Olyan dokumentumregiszter, amiben a megőrzési idő MÁR hitelesített. */
function hitelesDocs(): DocumentRegistry {
  return new DocumentRegistry(DOCS.all().map((d): DocumentDef => ({
    ...d,
    retention: d.retention
      ? { ...d.retention, verification: "primary", verifiedNote: "teszt" }
      : d.retention,
  })));
}

/**
 * AZ ESET DÁTUMAI. A `megorzesLejart` mezőbe írt dátumot a rendszer 2026-09-07
 * óta VISSZAELLENŐRZI a dokumentumok saját megőrzési idejéből — enélkül a
 * visszafordíthatatlan megsemmisítés egyetlen kapuja egy begépelt évszám
 * volt. Egy 1960-ban lezárt esetnél a leghosszabb, 50 éves idő 2010-ben
 * telik le, tehát a rendelkezésben álló 2020-as dátum igazolható.
 */
const HORGONYOK = { recordClose: "1960-01-01T00:00:00.000Z" };

const CTX = (over: Partial<Parameters<typeof torlesiAkadalyok>[1]> = {}) => ({
  docs: hitelesDocs(), kulcsMegsemmisitheto: true, now: NOW,
  horgonyok: HORGONYOK, ...over,
});

/* ── 1. A RENDELKEZÉS TELJESSÉGE ────────────────────────────────────── */

test("a teljes rendelkezés hiba nélkül validál", () => {
  assert.deepEqual(validateRendelkezes(REND), []);
});

const hianyos: Array<[string, Partial<TorlesiRendelkezes>, RegExp]> = [
  ["jogalap nélkül", { jogalap: "  " }, /JOGALAP/],
  ["indoklás nélkül", { indoklas: "" }, /indoklás/],
  ["elrendelő nélkül", { rendelte: undefined as never }, /KI rendelte el/],
  ["nem DPO rendelte el",
    { rendelte: { nev: "dr. X", szerep: "clinician", at: NOW } }, /adatvédelmi tisztviselő/],
  ["hibás időbélyeggel",
    { rendelte: { nev: "T K", szerep: "dpo", at: "2026.09.05" } }, /időbélyeg/],
  ["ismeretlen törlésfajtával", { fajta: "félig" as never }, /törlésfajta/],
];

for (const [mi, over, minta] of hianyos) {
  test(`hibaként bukik el: rendelkezés ${mi}`, () => {
    const bajok = validateRendelkezes({ ...REND, ...over });
    assert.ok(bajok.length > 0, `${mi}: nem lett hiba`);
    assert.ok(bajok.some((b) => minta.test(b)), `${mi}: ${bajok.join(" | ")}`);
  });
}

test("a második aláíró nem lehet ugyanaz a személy", () => {
  // A négy szem elve egyetlen szempárral nem teljesül.
  const bajok = validateRendelkezes({
    ...REND, masodikAlairo: { nev: "Tóth Katalin", szerep: "jogi", at: NOW },
  });
  assert.ok(bajok.some((b) => /négy szem/.test(b)));
});

/* ── 2. A KAPUK ─────────────────────────────────────────────────────── */

test("második aláíró nélkül a törlés nem hajtható végre", () => {
  const { masodikAlairo, ...nelkule } = REND;
  const e = ertekelTorles(nelkule as TorlesiRendelkezes, CTX());
  assert.equal(e.vegrehajthato, false);
  const a = e.akadalyok.find((x) => x.id === "masodikAlairo")!;
  assert.equal(a.suly, "blokkolo");
  assert.match(a.why, /visszafordíthatatlan/);
  assert.ok(a.mihezKotott.trim(), "az akadály mellett nem áll, mi hárítaná el");
});

test("ELLENŐRIZETLEN megőrzési idő mellett a rendszer nem töröl", () => {
  // Ez a mai állapot: mind a 14 ellátási dokumentumtípus `secondary` szintű.
  const e = ertekelTorles(REND, CTX({ docs: DOCS }));
  assert.equal(e.vegrehajthato, false);
  const a = e.akadalyok.find((x) => x.id === "megorzesEllenorzetlen")!;
  assert.match(a.why, /nincs elsődleges forrásból visszaellenőrizve/);
  assert.match(a.mihezKotott, /10\. lépés/);
});

test("A MEGŐRZÉSI KÖTELEZETTSÉG a betegkérésnél is erősebb", () => {
  // A GDPR 17. cikk (3) bekezdése kifejezetten kiveszi a törléshez való jog
  // alól azt, amit jogi kötelezettség alapján kell megőrizni. Ez a kapu az,
  // amit a „kérésre törlünk” rendszerek kihagynak.
  const { megorzesLejart, ...nincsIgazolva } = REND;
  const e = ertekelTorles(nincsIgazolva as TorlesiRendelkezes, CTX());
  assert.equal(e.vegrehajthato, false);
  const a = e.akadalyok.find((x) => x.id === "megorzesLejarta")!;
  assert.match(a.why, /17\. cikk \(3\)/);
  assert.match(a.mihezKotott, /visszavonása/);
});

test("a le nem telt megőrzési idő is blokkol", () => {
  const e = ertekelTorles(
    { ...REND, megorzesLejart: "2099-01-01T00:00:00.000Z" }, CTX());
  assert.equal(e.vegrehajthato, false);
  assert.match(e.akadalyok.find((x) => x.id === "megorzesLejarta")!.why,
    /még nem telt el/);
});

test("függőben lévő betegkérés blokkol", () => {
  const e = ertekelTorles({ ...REND, betegkeresFuggoben: true }, CTX());
  assert.equal(e.vegrehajthato, false);
  const a = e.akadalyok.find((x) => x.id === "betegkeres")!;
  assert.match(a.why, /megkapja, ami róla szól/);
});

test("kulcsmegsemmisítés nélkül a kriptográfiai törlés csak látszat", () => {
  const e = ertekelTorles(REND, CTX({ kulcsMegsemmisitheto: false }));
  assert.equal(e.vegrehajthato, false);
  assert.match(e.akadalyok.find((x) => x.id === "kulcstar")!.why, /annak látszata/);
});

test("MINDEN akadály mellett ott áll, mi hárítaná el", () => {
  // Egy akadály, amiről nem derül ki, mi oldaná fel, nem kapu, hanem zsákutca.
  const e = ertekelTorles({ ...REND, fajta: "fizikai" }, CTX({ docs: DOCS }));
  assert.ok(e.akadalyok.length >= 2);
  for (const a of e.akadalyok) {
    assert.ok(a.why.trim().length > 20, `${a.id}: üres indoklás`);
    assert.ok(a.mihezKotott.trim().length > 10, `${a.id}: nincs feloldás`);
  }
});

test("minden kapu nyitva: a törlés végrehajthatóvá válik", () => {
  const e = ertekelTorles(REND, CTX());
  assert.deepEqual(e.akadalyok.filter((a) => a.suly === "blokkolo"), []);
  assert.equal(e.vegrehajthato, true);
});

test("A BEGÉPELT LEJÁRAT NEM ELÉG: vissza is kell tudni ellenőrizni", () => {
  // Horgonyok nélkül a dátum semmivel nem vethető össze — és ami nem
  // ellenőrizhető, az nem igazolt. Eddig ez a kapu nyitva állt.
  const e = ertekelTorles(REND, CTX({ horgonyok: undefined }));
  assert.equal(e.vegrehajthato, false);
  const a = e.akadalyok.find((x) => x.id === "megorzesIgazolas")!;
  assert.match(a.why, /NEM IGAZOLHATÓ VISSZA/);
  assert.match(a.mihezKotott, /horgonyainak/);
});

test("a túl korai lejárat blokkol, nem csak a jövőbeli", () => {
  // Az eset tavaly zárult, a rendelkezés mégis 2020-as lejáratot állít: a
  // dokumentáció évtizedekkel korábban semmisülne meg.
  const e = ertekelTorles(REND, CTX({
    horgonyok: { recordClose: "2025-01-01T00:00:00.000Z" },
  }));
  assert.equal(e.vegrehajthato, false);
  assert.match(e.akadalyok.find((x) => x.id === "megorzesIgazolas")!.why,
    /TÚL KORAI/);
});

/* ── 3. FIZIKAI TÖRLÉS: NEM TILTJUK, DE KIMONDJUK ───────────────────── */

test("a fizikai törlés FIGYELMEZTETÉST kap, nem tiltást", () => {
  const e = ertekelTorles({ ...REND, fajta: "fizikai" }, CTX());
  const a = e.akadalyok.find((x) => x.id === "lanctores")!;
  assert.equal(a.suly, "figyelmeztetes");
  assert.match(a.why, /MEGTÖRI A HASÍTÓLÁNCOT/);
  // …és attól még végrehajtható, ha minden BLOKKOLÓ kapu nyitva van.
  assert.equal(e.vegrehajthato, true);
});

test("a kétféle törlés MÁST hagy maga után", () => {
  const k = megmaradTorlesUtan(REND);
  const f = megmaradTorlesUtan({ ...REND, fajta: "fizikai" });
  assert.ok(k.some((x) => /SZERKEZETE/.test(x)));
  assert.ok(f.some((x) => /lánc megtörik/.test(x)));
  // Az AUDITNAPLÓ mindkettőnél megmarad — enélkül a törlés sem bizonyítható.
  for (const lista of [k, f]) {
    assert.ok(lista.some((x) => /AUDITNAPLÓ/.test(x)));
  }
});

/* ── 4. A KÉTÁGÚ VISSZAVONÁS ────────────────────────────────────────── */

test("a kutatási visszavonás MOST IS teljesíthető — és megmondja, mi marad", () => {
  const v = visszavonasHatasa("eset-1", DOCS);
  assert.ok(v.megszunik.length >= 3);
  assert.ok(v.megszunik.some((m) => /azonnali hatállyal/.test(m)));
  assert.equal(v.marad.length, DOCS.careRecords().length);
  for (const m of v.marad) {
    assert.match(m.miert, /17\. cikk \(3\)/,
      "a maradás oka nincs megnevezve");
    assert.ok(m.mi.trim());
  }
  assert.match(v.osszefoglalo, /nem utólag/);
});

test("a törlés elakadásakor a visszavonást AJÁNLJA fel", () => {
  const e = ertekelTorles(REND, CTX({ docs: DOCS }));
  assert.equal(e.vegrehajthato, false);
  assert.match(e.osszefoglalo, /KUTATÁSI HOZZÁJÁRULÁS VISSZAVONÁSA/);
});

/* ── 5. A TANÚSÍTVÁNY ───────────────────────────────────────────────── */

test("a tanúsítvány megmondja, HOGYAN ellenőrizhető a törlés", () => {
  // Egy törlés, amiről nem marad tanúsítvány, két hónap múlva
  // megkülönböztethetetlen az adatvesztéstől.
  const t = tanusitvany(REND, 7, NOW);
  assert.equal(t.bejegyzesek, 7);
  assert.equal(t.alairok.length, 2);
  assert.equal(t.jogalap, REND.jogalap);
  assert.match(t.hogyanEllenorizheto, /unreadable/);
  assert.match(t.hogyanEllenorizheto, /nem `corrupt`/);
  assert.ok(t.megmarad.length >= 3);
});

test("a fizikai törlés tanúsítványa MÁST mond az ellenőrzésről", () => {
  const t = tanusitvany({ ...REND, fajta: "fizikai" }, 7, NOW);
  assert.match(t.hogyanEllenorizheto, /az archívumból nem/);
});

/* ── 6. A TÁROLÓ MŰVELETE ───────────────────────────────────────────── */

function keyStore(): KeyStore & { destroyed: string[] } {
  const keys = new Map<string, { dek: Buffer | null; key: never }>();
  const destroyed: string[] = [];
  return {
    destroyed,
    dek(caseId) {
      if (!keys.has(caseId)) {
        keys.set(caseId, {
          dek: randomBytes(32),
          key: { keyId: `dek.${caseId}`, kekId: "kek.teszt", state: "active",
                 createdAt: NOW } as never,
        });
      }
      return keys.get(caseId)! as never;
    },
    destroy(caseId, why) {
      destroyed.push(`${caseId}: ${why}`);
      const e = keys.get(caseId)!;
      keys.set(caseId, { dek: null, key: {
        ...(e.key as object), state: "destroyed", destroyedAt: NOW,
        destroyReason: why } as never });
    },
  };
}

const REL: CareRelation[] = [{
  actor: "dr. Minta Anna", caseId: "eset-1",
  from: "2026-09-01T00:00:00.000Z", until: null, why: "ambuláns ellátás",
}];
const ANNA: Who = { actor: "dr. Minta Anna", roles: ["clinician"] };
const KATALIN: Who = { actor: "Tóth Katalin", roles: ["dpo"] };

async function feltoltottTarolo() {
  const keys = keyStore();
  const sink = memorySink();
  const s = new SecureCaseStore({
    archive: new MemoryArchive(), keys, sink, relations: REL, now: () => NOW,
  });
  await s.write("eset-1", ANNA, [{
    op: "write", at: NOW, variableId: "vitals.bp.systolic",
    value: { value: 142, t: NOW, provenance: "clinician" } as never,
  }]);
  return { s, keys, sink };
}

test("a kriptográfiai törlés után a lelet nem nyílik fel többé", async () => {
  const { s, keys } = await feltoltottTarolo();
  assert.equal((await s.read("eset-1", ANNA)).ok, true);

  const t = await s.destroyKey("eset-1", KATALIN, "GDPR 17. cikk — betegkérés");
  assert.equal(t.ok, true);
  assert.equal(keys.destroyed.length, 1);

  const utan = await s.read("eset-1", ANNA);
  assert.equal(utan.ok, false);
  // `unreadable`, NEM `corrupt`: az adat nem romlott el, hanem szándékosan
  // olvashatatlan. A kettő teendője gyökeresen más.
  assert.equal((utan as { kind: string }).kind, "unreadable");
});

test("a törlés után a napló SZERKEZETE ellenőrizhető marad", async () => {
  const { s } = await feltoltottTarolo();
  await s.destroyKey("eset-1", KATALIN, "teszt");
  const a = await s.verifyArchive("eset-1");
  assert.equal(a.ok, true, "a hasítólánc a törlés után megtört");
  assert.equal(a.entries, 1);
});

test("a törlést csak a DPO rendelheti el — a klinikus nem", async () => {
  const { s, keys } = await feltoltottTarolo();
  const r = await s.destroyKey("eset-1", ANNA, "mert úgy gondoltam");
  assert.equal(r.ok, false);
  assert.equal((r as { kind: string }).kind, "denied");
  assert.deepEqual(keys.destroyed, [], "elutasítás után is megsemmisült a kulcs");
});

test("a törlés AUDITSORT hagy — és előbb, mint ahogy megtörténik", async () => {
  const { s, sink } = await feltoltottTarolo();
  await s.destroyKey("eset-1", KATALIN, "GDPR 17. cikk");
  const del = sink.events.filter(
    (e) => e.kind === "audit" && (e as { action: string }).action === "delete");
  assert.equal(del.length, 1);
  assert.match((del[0] as { basis: string }).basis, /adatvédelmi tisztviselői/);
});

test("az elutasított törlés is naplózódik", async () => {
  const { s, sink } = await feltoltottTarolo();
  await s.destroyKey("eset-1", ANNA, "nem az ő dolga");
  assert.ok(sink.events.some(
    (e) => e.kind === "audit" && (e as { action: string }).action === "denied"));
});

test("kulcstár megsemmisítés NÉLKÜL a művelet elbukik, nem hazudik", async () => {
  const sink = memorySink();
  const nemTud: KeyStore = { dek: keyStore().dek };   // nincs `destroy`
  const s = new SecureCaseStore({
    archive: new MemoryArchive(), keys: nemTud, sink, relations: REL, now: () => NOW,
  });
  await s.write("eset-1", ANNA, [{
    op: "write", at: NOW, variableId: "vitals.pulse",
    value: { value: 80, t: NOW, provenance: "clinician" } as never,
  }]);
  const r = await s.destroyKey("eset-1", KATALIN, "teszt");
  assert.equal(r.ok, false);
  assert.match((r as { why: string }).why, /annak látszata/);
});
