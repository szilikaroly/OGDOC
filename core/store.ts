/**
 * TÁROLÓ — az eset túléli az oldalbetöltést.
 *
 * Ez a `10` modul első elfogadási kritériuma, és az IPRACS legfőbb hibájának
 * javítása: *„session-szintű adat: oldalbetöltés után a `labourData[]`
 * elveszik."* Egy vajúdás-idősor, ami frissítéskor eltűnik, nem
 * dokumentáció — és a klinikus, aki egyszer elveszítette, többé nem bízik
 * benne.
 *
 * A réteg SZÁNDÉKOSAN a lehető legkisebb: két művelet, semmi lekérdezés. A
 * mag DOM-mentes és adatbázis-mentes marad; hogy a bájtok fájlba, böngészőbe
 * vagy adatbázisba kerülnek, az a hívó dolga.
 *
 * AMI NINCS BENNE, ÉS TUDATOSAN: titkosítás, jogosultság, auditnapló. Ez a
 * réteg a MEGMARADÁST oldja meg, nem a védelmet. Éles betegadat mellett a
 * `Store` implementációjának mindhármat hozzá kell tennie — és amíg nincs
 * hozzátéve, a rendszer nem futhat valódi adaton.
 */
import type { CaseState, Value } from "./types.ts";

export interface Store {
  load(caseId: string): Promise<CaseState | null>;
  save(caseId: string, state: CaseState): Promise<void>;
}

/**
 * Az eset SOROSÍTÁSA. Nem `JSON.stringify` közvetlenül: a formátumnak van
 * verziója, mert a `CaseState` alakja változni fog, és a régi mentés
 * olvashatóságáért a rendszer felel, nem a felhasználó.
 */
export interface Serialized {
  formatVersion: 1;
  savedAt: string;
  state: CaseState;
}

export function serialize(state: CaseState, now = new Date().toISOString()): string {
  const out: Serialized = { formatVersion: 1, savedAt: now, state };
  return JSON.stringify(out);
}

export function deserialize(text: string): CaseState {
  const parsed = JSON.parse(text) as Partial<Serialized>;
  if (parsed.formatVersion !== 1) {
    throw new Error(
      `Ismeretlen mentési formátum: ${parsed.formatVersion}. ` +
      `A régi mentés olvashatóságáért a rendszer felel — a betöltés nem ` +
      `folytatódik találgatással.`,
    );
  }
  const st = parsed.state;
  if (!st?.ctx?.now || !st.values) {
    throw new Error("Hiányos mentés: nincs kontextus vagy értéknapló.");
  }
  // A napló APPEND-ONLY, és a sorrendje jelentést hordoz (azonos időbélyegű
  // javításnál a később bekerült nyer). A sorosítás ezért a tömbök sorrendjét
  // is megőrzi — ezt itt csak ellenőrizzük, nem rendezzük át.
  for (const [id, vals] of Object.entries(st.values)) {
    if (!Array.isArray(vals)) throw new Error(`${id}: az értéknapló nem tömb`);
  }
  return { ...st, errors: st.errors ?? [] } as CaseState;
}

/** Memóriabeli tároló — teszthez és a webes csontvázhoz. NEM éles adatra. */
export class MemoryStore implements Store {
  private data = new Map<string, string>();

  async load(caseId: string): Promise<CaseState | null> {
    const text = this.data.get(caseId);
    return text ? deserialize(text) : null;
  }

  async save(caseId: string, state: CaseState): Promise<void> {
    this.data.set(caseId, serialize(state));
  }
}

/**
 * Hány érték van a naplóban összesen — a mentés épségének legegyszerűbb
 * ellenőrzése betöltés után.
 */
export function valueCount(state: CaseState): number {
  return Object.values(state.values).reduce((n, v: Value[]) => n + v.length, 0);
}
