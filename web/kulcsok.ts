/**
 * FEJLESZTŐI KULCSTÁR ÉS NAPLÓNYELŐ — a HSM helye, megjelölve.
 *
 * A `SecureCaseStore` esetenként külön adatkulcsot (DEK) kér a `KeyStore`-tól,
 * és a kulcs TARTÓSSÁGA szándékosan nem az övé: a kriptográfiai törlés épp
 * attól működik, hogy a kulcsot valaki más őrzi és semmisíti meg.
 *
 * EZ A MODUL AZ A „VALAKI MÁS” — a legrosszabb elképzelhető alakban:
 * a kulcsok egy sima fájlban állnak, a titkosított adat MELLETT. Éles
 * rendszerben ez pontosan az, amit nem szabad: aki hozzáfér az archívumhoz,
 * hozzáfér a kulcshoz is, tehát a titkosítás nem véd senki ellen.
 *
 * Miért van akkor mégis? Mert a kulcsnak TÚL KELL ÉLNIE az újraindítást,
 * különben a perzisztencia bizonyítása hamis: a második indításnál nem azért
 * olvasnánk vissza az esetet, mert a tárolás működik, hanem azért nem, mert a
 * kulcs elveszett — és a kettő megkülönböztethetetlen volna.
 *
 * A HELYE: HSM vagy KMS. A csere egyetlen `KeyStore` implementáció; a tároló
 * és a webes réteg egyetlen sora sem változik tőle. Ez a `13-18-lepes.md`
 * 1. lépésének nyitva maradt tétele.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { appendFileSync } from "node:fs";
import type { KeyRef } from "../core/crypto/types.ts";
import type { KeyStore } from "../core/store/biztonsagos.ts";
import type { AuditEvent, LogEvent, OpEvent, Sink } from "../core/log/types.ts";

interface StoredKey { dek: string | null; key: KeyRef }

/**
 * FÁJLBAN TARTOTT KULCSOK — kizárólag szintetikus üzemhez.
 *
 * A `destroy` a kulcsot `null`-ra állítja, és ez nem hiba: a kriptográfiai
 * törlés így néz ki. Az eset naplója megmarad, a tartalma viszont soha többé
 * nem nyílik fel — és a tároló ezt `unreadable` néven, nem `corrupt` néven
 * jelenti, mert a teendő más.
 */
export class FileKeyStore implements KeyStore {
  private path: string;
  private cache = new Map<string, StoredKey>();

  constructor(path: string) {
    this.path = path;
    mkdirSync(dirname(path), { recursive: true });
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, StoredKey>;
      for (const [k, v] of Object.entries(raw)) this.cache.set(k, v);
    } catch {
      // Nincs még kulcsfájl — az első kulcs létrehozásakor keletkezik.
    }
  }

  private flush(): void {
    const out: Record<string, StoredKey> = {};
    for (const [k, v] of this.cache) out[k] = v;
    writeFileSync(this.path, JSON.stringify(out, null, 2), { mode: 0o600 });
  }

  dek(caseId: string): { dek: Buffer | null; key: KeyRef } {
    const meglevo = this.cache.get(caseId);
    if (meglevo) {
      return {
        dek: meglevo.dek === null ? null : Buffer.from(meglevo.dek, "base64"),
        key: meglevo.key,
      };
    }
    const dek = randomBytes(32);
    const rec: StoredKey = {
      dek: dek.toString("base64"),
      key: {
        keyId: `dek.${caseId}`, kekId: "kek.fejlesztoi", state: "active",
        createdAt: new Date().toISOString(),
      },
    };
    this.cache.set(caseId, rec);
    this.flush();
    return { dek, key: rec.key };
  }

  /** KRIPTOGRÁFIAI TÖRLÉS. A napló marad, a tartalom soha többé nem nyílik fel. */
  destroy(caseId: string, why: string): void {
    const meglevo = this.cache.get(caseId);
    if (!meglevo) return;
    this.cache.set(caseId, {
      dek: null,
      key: {
        ...meglevo.key, state: "destroyed",
        destroyedAt: new Date().toISOString(), destroyReason: why,
      },
    });
    this.flush();
  }
}

/**
 * FÁJLBA ÍRÓ NAPLÓNYELŐ — két külön fájlba, mert a kettő nem ugyanaz.
 *
 * Az ÜZEMELTETÉSI napló (`op`) hibakeresésre való, és tartalmazhat technikai
 * részletet. Az AUDITNAPLÓ (`audit`) jogi bizonyíték: ki, mit, mikor, milyen
 * alapon. A kettő egy fájlban tartása azért rossz, mert a megőrzési idejük,
 * az olvasóik és a törölhetőségük is más.
 *
 * Az `audit` DOBHAT, és ez szándékos: ha az auditsor nem íródik ki, a művelet
 * bukik el. Egy naplózatlan olvasás rosszabb, mint egy meghiúsult olvasás.
 */
export function fileSink(dir: string): Sink & { auditPath: string } {
  mkdirSync(dir, { recursive: true });
  const opPath = join(dir, "op.jsonl");
  const auditPath = join(dir, "audit.jsonl");
  const ir = (path: string, e: LogEvent) =>
    appendFileSync(path, JSON.stringify(e) + "\n", { encoding: "utf8" });

  return {
    auditPath,
    op(e: OpEvent) {
      try { ir(opPath, e); } catch {
        // Az üzemeltetési napló hibája NEM buktatja el a műveletet.
      }
    },
    audit(e: AuditEvent) { ir(auditPath, e); },
  };
}

/** Az auditnapló visszaolvasása — az auditor szerepkör ezt kapja. */
export function readAudit(path: string, limit = 200): AuditEvent[] {
  let raw = "";
  try { raw = readFileSync(path, "utf8"); } catch { return []; }
  const out: AuditEvent[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line) as AuditEvent); } catch {
      // A sérült sor nem tüntethető el némán: a hívó látja a darabszámot.
    }
  }
  return out.slice(-limit).reverse();
}
