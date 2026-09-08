/**
 * BORÍTÉKOS TITKOSÍTÁS — a műveletek.
 *
 * A mag itt is tiszta: nem hív kulcskezelőt és nem ír lemezre. Azt mondja
 * meg, MI a helyes rejtjelezett rekord, és hogy egy kapott rekord ÉP-E. A
 * KEK-et a gazda adja — a valóságban HSM-ből vagy KMS-ből, ahonnan nem
 * másolható ki.
 *
 * HÁROM DÖNTÉS, AMI NEM ÍZLÉS KÉRDÉSE:
 *
 *  1. AEAD, KÖTÉSSEL. Az AES-256-GCM nemcsak titkosít, hanem hitelesít is —
 *     és a hitelesítés kiterjed a NYÍLT kötésre (eset, sorszám, láncszem).
 *     Enélkül egy rejtjelezett bejegyzés áthelyezhető lenne egyik esetből a
 *     másikba, és hibátlanul visszafejtődne.
 *
 *  2. VÉLETLEN EGYSZERHASZNÁLATOS SZÁM, nem sorszámból származtatott. A
 *     sorszám-alapú megoldás elegánsabb és rövidebb — de ha a hívó valaha
 *     kétszer ír ugyanarra a sorszámra más tartalommal, a GCM
 *     KATASZTROFÁLISAN bukik (a kulcsfolyam újrafelhasználása visszafejthetővé
 *     teszi mindkettőt). Egy klinikai rendszerben a hívó hibája nem lehet
 *     katasztrofális, ezért 12 bájt véletlent fizetünk rekordonként.
 *
 *  3. A LÁNC A REJTJELEZETT ALAKON FUT. Így egy hidegtári másolat épsége
 *     ELLENŐRIZHETŐ ANÉLKÜL, hogy elővennénk a kulcsot — és minden
 *     kulcshasználat kockázat. Cserébe az újratitkosítás elszakítja a
 *     láncot; erre való a migrációs rekord.
 */
import {
  createCipheriv, createDecipheriv, randomBytes, timingSafeEqual,
} from "node:crypto";
import type { CipherId, KeyRef, Sealed, SealBinding } from "./types.ts";

const NONCE_BYTES = 12;      // GCM ajánlott mérete
const KEY_BYTES = 32;        // AES-256

const b64 = (b: Buffer) => b.toString("base64");
const un64 = (s: string) => Buffer.from(s, "base64");

/** Determinisztikus sorosítás — ugyanaz a szabály, mint a naplónál. */
function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).filter((k) => o[k] !== undefined).sort()
    .map((k) => JSON.stringify(k) + ":" + stable(o[k])).join(",") + "}";
}

function aadBytes(a: SealBinding): Buffer {
  return Buffer.from(stable(a), "utf8");
}

/* ── LEZÁRÁS ÉS FELNYITÁS ───────────────────────────────────────────── */

export function seal(
  plain: unknown, dek: Buffer, keyId: string, aad: SealBinding,
  cipher: CipherId = "AES-256-GCM",
): Sealed {
  if (dek.length !== KEY_BYTES) {
    throw new Error(`Az adatkulcs ${KEY_BYTES} bájt kell legyen, nem ${dek.length}.`);
  }
  const nonce = randomBytes(NONCE_BYTES);
  const c = createCipheriv(cipher.toLowerCase() as "aes-256-gcm", dek, nonce);
  c.setAAD(aadBytes(aad));
  const ct = Buffer.concat([c.update(Buffer.from(stable(plain), "utf8")), c.final()]);
  return {
    cipher, keyId, nonce: b64(nonce), ct: b64(ct),
    tag: b64(c.getAuthTag()), aad,
  };
}

export type OpenResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; kind: "wrongKey" | "tampered" | "relocated" | "destroyed"; why: string };

/**
 * FELNYITÁS — és a bukás NEM kivétel, hanem megnevezett eredmény.
 *
 * A négy kudarc oka gyökeresen más teendőt jelent, ezért nem egy `throw`:
 *
 *   wrongKey    rossz kulcsot adtunk — kulcskezelési hiba
 *   tampered    a rejtjelezett szöveg megváltozott — a másolat nem hiteles
 *   relocated   a rekord MÁS esethez/sorszámhoz tartozik — összefésülés
 *   destroyed   a kulcs megsemmisült — az adat véglegesen nincs meg
 */
export function open<T = unknown>(
  s: Sealed, dek: Buffer | null, key: KeyRef, expect: SealBinding,
): OpenResult<T> {
  if (key.state === "destroyed" || dek === null) {
    return { ok: false, kind: "destroyed",
      why: `A(z) ${s.keyId} kulcs MEGSEMMISÍTETT` +
           (key.destroyReason ? ` (${key.destroyReason})` : "") +
           `. A rekord véglegesen visszafejthetetlen — ez nem hiba, hanem a ` +
           `kriptográfiai törlés működése. A bejegyzés LÉTE és a törlés TÉNYE ` +
           `viszont megmaradt.` };
  }
  // A KÖTÉST ELŐBB NÉZZÜK MEG, mint a címkét: így meg tudjuk különböztetni
  // az áthelyezett rekordot a megváltoztatottól.
  if (stable(s.aad) !== stable(expect)) {
    return { ok: false, kind: "relocated",
      why: `A rekord kötése nem egyezik a várttal: ` +
           `eset „${s.aad.caseId}” / ${s.aad.seq}. bejegyzés, várt „` +
           `${expect.caseId}” / ${expect.seq}. Ez ÁTHELYEZETT rekord — más ` +
           `napló darabja került ide. Visszafejtve is hibás adatot adna.` };
  }
  try {
    const d = createDecipheriv(s.cipher.toLowerCase() as "aes-256-gcm", dek, un64(s.nonce));
    d.setAAD(aadBytes(s.aad));
    d.setAuthTag(un64(s.tag));
    const out = Buffer.concat([d.update(un64(s.ct)), d.final()]);
    return { ok: true, value: JSON.parse(out.toString("utf8")) as T };
  } catch {
    // A GCM nem árulja el, ROSSZ KULCS vagy MÓDOSÍTOTT SZÖVEG okozta-e — és
    // ez így helyes. A kulcsazonosítóból viszont eldönthető, melyik a
    // valószínű, és a teendő ezen múlik.
    const mismatched = key.keyId !== s.keyId;
    return { ok: false, kind: mismatched ? "wrongKey" : "tampered",
      why: mismatched
        ? `Rossz kulcs: a rekord a(z) ${s.keyId} kulccsal készült, a megadott ` +
          `kulcs a(z) ${key.keyId}. Kulcskezelési hiba, nem adatromlás.`
        : `A HITELESÍTŐ CÍMKE NEM STIMMEL. A rejtjelezett szöveg megváltozott a ` +
          `rögzítése óta: a másolat nem hiteles, és a rendszer NEM ad vissza ` +
          `belőle adatot. Ez a lényeg — a csendben visszafejtett, sérült ` +
          `rekord rosszabb, mint a hiányzó.` };
  }
}

/* ── A DEK BURKOLÁSA ────────────────────────────────────────────────── */

export interface WrappedKey {
  keyId: string;
  kekId: string;
  wrapped: Sealed;
}

/**
 * A KEK-et a gazda adja, és a valóságban KI SEM JÖN a kulcskezelőből — ott
 * történik a burkolás. Ez a függvény a szerződést mutatja meg, és tesztelhetővé
 * teszi; éles üzemben a KMS `Encrypt` hívása áll a helyén.
 */
export function wrapDek(dek: Buffer, kek: Buffer, keyId: string, kekId: string): WrappedKey {
  return { keyId, kekId,
    wrapped: seal(b64(dek), kek, kekId,
      { caseId: "kek", seq: 0, prevHash: keyId, formatVersion: 1 }) };
}

export function unwrapDek(w: WrappedKey, kek: Buffer, key: KeyRef): Buffer | null {
  const r = open<string>(w.wrapped, kek, key,
    { caseId: "kek", seq: 0, prevHash: w.keyId, formatVersion: 1 });
  return r.ok ? un64(r.value) : null;
}

export function newDek(): Buffer { return randomBytes(KEY_BYTES); }

/* ── KRIPTOGRÁFIAI TÖRLÉS ───────────────────────────────────────────── */

export interface EraseOrder {
  keyId: string;
  at: string;
  actor: string;
  reason: string;
  /**
   * HOL VOLT MÁSOLAT A KULCSRÓL, és mindegyik megsemmisült-e.
   *
   * A kriptográfiai törlés pontosan annyit ér, amennyire biztosak vagyunk
   * benne, hogy nem maradt kulcsmásolat. Egy „letöröltük" állítás a
   * letétkezelőnél maradt példányról nem tud.
   */
  copies: Array<{ where: string; destroyed: boolean }>;
}

export interface EraseResult {
  ok: boolean;
  key: KeyRef;
  why: string;
  remaining: string[];
}

/**
 * A KULCS MEGSEMMISÍTÉSE — a válasz arra, hogyan törlünk MÓDOSÍTHATATLAN
 * másolatból.
 *
 * Egy hidegtári szalagot nem lehet átírni; a beteg törlési kérelmét viszont
 * teljesíteni kell. Ha az esethez saját adatkulcs tartozik, a kulcs
 * megsemmisítése teszi az adatot visszafejthetetlenné — a szalagon marad,
 * de senki nem tudja elolvasni.
 *
 * ÉS A FÜGGVÉNY NEM MOND IGENT, AMÍG EGY MÁSOLAT IS ÉL. Egy „megtörtént" a
 * letétben maradt kulcsról nem tud — és éppen az a példány fogja
 * érvényteleníteni az egész törlést.
 */
export function cryptoErase(key: KeyRef, order: EraseOrder): EraseResult {
  const remaining = order.copies.filter((c) => !c.destroyed).map((c) => c.where);
  if (!order.actor?.trim() || !order.reason?.trim()) {
    return { ok: false, key, remaining,
      why: "A kulcs megsemmisítése ELRENDELŐ és INDOKLÁS nélkül nem hajtható " +
           "végre: ez visszafordíthatatlan lépés, és a kapunak előtte kell zárnia." };
  }
  if (remaining.length) {
    return { ok: false, key, remaining,
      why: `A TÖRLÉS NEM TELJES: a kulcsról még ${remaining.length} helyen van ` +
           `másolat (${remaining.join(", ")}). Amíg ezek élnek, az adat ` +
           `visszafejthető — a „töröltük” állítás ilyenkor valótlan, és éppen ` +
           `a megmaradt példány fogja megcáfolni.` };
  }
  return {
    ok: true, remaining: [],
    key: { ...key, state: "destroyed", destroyedAt: order.at,
           destroyReason: order.reason },
    why: `A(z) ${key.keyId} kulcs megsemmisült (${order.at}, ${order.actor}): ` +
         `${order.reason}. A vele védett rekordok a másolatokban FIZIKAILAG ` +
         `megmaradnak, de véglegesen visszafejthetetlenek. A napló sírköve ` +
         `és ez a bejegyzés együtt bizonyítja, hogy a törlés megtörtént — ` +
         `az adat hiánya önmagában nem bizonyítana semmit.`,
  };
}

/** Két címke összehasonlítása időzítéstámadás ellen — a burkolt kulcsokhoz. */
export function equalSecret(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}
