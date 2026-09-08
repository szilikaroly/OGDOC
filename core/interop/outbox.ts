/**
 * KIMENŐ SOR — a klinikai üzenet nem veszhet el egy időtúllépésen.
 *
 * A külső rendszerek lassúak és megbízhatatlanok, a futtatókörnyezet pedig
 * rövid életű. Az outbox mintája ezért nem kényelem: az üzenetet ELŐBB
 * rögzítjük tartósan, és CSAK AZUTÁN próbáljuk elküldeni — így a küldés
 * bukása késleltetés, nem adatvesztés.
 *
 * A modul tiszta: nem küld semmit. Azt mondja meg, MIKOR és MIT kell újra
 * próbálni, és mikor kell EMBERHEZ fordulni.
 */

export type OutboxStatus = "pending" | "sent" | "failed" | "abandoned";

export interface OutboxEntry {
  id: string;
  channel: string;
  /**
   * IDEMPOTENCIAKULCS. A fogadó ebből ismeri fel, hogy ezt az üzenetet már
   * látta — újraküldésnél ez akadályozza meg, hogy két lelet keletkezzen.
   */
  idempotencyKey: string;
  createdAt: string;
  status: OutboxStatus;
  attempts: number;
  lastError?: string | null;
  lastAttemptAt?: string | null;
  /** A fogadó rendszer azonosítója, ha sikerült. */
  externalRef?: string | null;
  /**
   * KLINIKAI SÜRGŐSSÉG. Nem minden kimenő üzenet egyforma: egy kritikus
   * laborérték továbbítása más, mint egy havi statisztikai export.
   */
  clinical: boolean;
}

export interface RetryPlan {
  action: "send" | "wait" | "escalate" | "done";
  /** Mikor próbálkozzunk újra. */
  nextAt: string | null;
  why: string;
}

/**
 * EXPONENCIÁLIS VÁRAKOZÁS, DE FELSŐ KORLÁTTAL — ÉS EMBERI VÉGPONTTAL.
 *
 * A végtelen újrapróbálkozás rosszabb, mint a feladás: a sor feltöltődik, a
 * fogadó rendszert nyomjuk, és közben senki nem tudja, hogy baj van. Ezért a
 * sorozat nem „örökké próbálkozunk", hanem `escalate` — EMBERHEZ fordul.
 *
 * És a küszöb KLINIKAI ÜZENETNÉL SZIGORÚBB. Egy kritikus laborérték
 * továbbításánál a hatodik sikertelen próbálkozás nem üzemeltetési esemény,
 * hanem betegbiztonsági: valakinek fel kell hívnia a telefont.
 */
export function planRetry(
  e: OutboxEntry, now: string,
  opts: { maxAttempts?: number; clinicalMaxAttempts?: number; baseSeconds?: number } = {},
): RetryPlan {
  const max = e.clinical
    ? (opts.clinicalMaxAttempts ?? 5)
    : (opts.maxAttempts ?? 12);
  const base = opts.baseSeconds ?? 30;

  if (e.status === "sent") {
    return { action: "done", nextAt: null,
      why: `Kézbesítve${e.externalRef ? ` (${e.externalRef})` : ""}.` };
  }
  if (e.status === "abandoned") {
    return { action: "escalate", nextAt: null,
      why: "Feladva — emberi beavatkozásra vár. Ez az állapot NEM tűnhet el " +
           "magától: amíg valaki nem zárja le, a sor mutatja." };
  }
  if (e.attempts >= max) {
    return {
      action: "escalate", nextAt: null,
      why: e.clinical
        ? `${e.attempts} SIKERTELEN PRÓBÁLKOZÁS KLINIKAI ÜZENETNÉL. Ez nem ` +
          `üzemeltetési esemény, hanem betegbiztonsági: az üzenet nem ért célba, ` +
          `és valakinek fel kell hívnia a telefont. A gép ennél többet nem tud ` +
          `tenni, és a további próbálkozás csak elfedné a bajt.` +
          (e.lastError ? ` Utolsó hiba: ${e.lastError}` : "")
        : `${e.attempts} sikertelen próbálkozás. A végtelen újrapróbálkozás ` +
          `rosszabb, mint a feladás: a sor feltöltődik, a fogadót nyomjuk, és ` +
          `közben senki nem tudja, hogy baj van.` +
          (e.lastError ? ` Utolsó hiba: ${e.lastError}` : ""),
    };
  }
  if (!e.lastAttemptAt || e.attempts === 0) {
    return { action: "send", nextAt: now, why: "Első küldési kísérlet." };
  }
  const waitSec = Math.min(base * 2 ** (e.attempts - 1), 3600);
  const next = new Date(Date.parse(e.lastAttemptAt) + waitSec * 1000).toISOString();
  if (Date.parse(next) <= Date.parse(now)) {
    return { action: "send", nextAt: now,
      why: `${e.attempts}. kísérlet után a várakozás (${waitSec} mp) letelt.` };
  }
  return { action: "wait", nextAt: next,
    why: `${e.attempts}. kísérlet után ${waitSec} mp várakozás; ${next}-kor próbáljuk újra.` };
}

export interface OutboxHealth {
  pending: number;
  escalated: number;
  oldestPendingMinutes: number | null;
  clinicalStuck: OutboxEntry[];
  why: string;
}

/**
 * A SOR ÁLLAPOTA — és a klinikai üzenet külön kiemelve.
 *
 * Egy kimenő sor, amit senki nem néz, ugyanaz a csendes adatvesztés, mint a
 * bejövő oldal átnézetlen várakozó sora. A különbség csak az irány.
 */
export function outboxHealth(
  entries: OutboxEntry[], now: string, stuckMinutes = 30,
): OutboxHealth {
  const pending = entries.filter((e) => e.status === "pending" || e.status === "failed");
  const escalated = entries.filter((e) => e.status === "abandoned");
  const age = (e: OutboxEntry) =>
    Math.round((Date.parse(now) - Date.parse(e.createdAt)) / 60000);
  const clinicalStuck = pending.filter((e) => e.clinical && age(e) > stuckMinutes);
  const oldest = pending.length ? Math.max(...pending.map(age)) : null;

  return {
    pending: pending.length,
    escalated: escalated.length,
    oldestPendingMinutes: oldest,
    clinicalStuck,
    why: clinicalStuck.length
      ? `${clinicalStuck.length} KLINIKAI ÜZENET ${stuckMinutes} PERCNÉL RÉGEBBEN ` +
        `nem ért célba. Ez nem sorhossz-kérdés: a címzett nem tudja, amit tudnia ` +
        `kellene, és erről csak ez a szám szól.`
      : escalated.length
        ? `${escalated.length} feladott üzenet vár emberi beavatkozásra.`
        : pending.length
          ? `${pending.length} üzenet a sorban, a legrégebbi ${oldest} perce.`
          : "A kimenő sor üres.",
  };
}
