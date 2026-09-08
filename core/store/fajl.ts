/**
 * TARTÓS ARCHÍVUM — az eset túléli az újraindítást.
 *
 * Ez a `13-18-lepes.md` 1. lépésének első elfogadási kritériuma, és az
 * IPRACS legfőbb hibájának javítása: *„session-szintű adat: oldalbetöltés
 * után a `labourData[]` elveszik.”*
 *
 * HOZZÁFŰZŐ FÁJL, SORONKÉNT EGY BEJEGYZÉS (JSONL). Miért nem egy JSON-tömb:
 * a tömböt minden mentésnél újra kellene írni, és egy félbeszakadt újraírás
 * az EGÉSZ esetet viszi. A hozzáfűzésnél a legrosszabb eset egy csonka utolsó
 * sor — az felismerhető, és a lánc pontosan meg is mondja, hol ér véget.
 *
 * A KÉT FSYNC, ÉS AMIÉRT A MÁSODIKAT MINDENKI KIHAGYJA
 *
 * A fájlra hívott `fsync` a TARTALMAT teszi tartóssá. Egy ÚJ fájl esetében
 * viszont a könyvtárbejegyzés is friss — és ha az nem íródott ki, az
 * áramszünet után a fájl tartalma megvan, csak épp nincs neve. Ezért a
 * könyvtárat is szinkronizáljuk, valahányszor új esetfájl keletkezik.
 *
 * Ezért mondhatja ez az osztály a `"local"` tartósságot: a „mentve” szó azt
 * jelenti, hogy tartós tárolón van, nem azt, hogy pufferben áll.
 */
import { open as openFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Durability } from "../journal/types.ts";
import type { CaseArchive, StoredEntry } from "./biztonsagos.ts";

/**
 * AZ ESETAZONOSÍTÓ FÁJLNÉVVÉ ALAKÍTÁSA.
 *
 * Nem kozmetika, hanem védelem: egy `../` az azonosítóban a könyvtárból
 * kivezető írást jelentene. A tiltólista helyett ENGEDÉLYEZŐ lista —
 * ismeretlen karakter nem csúszik át azon, amire nem gondoltunk.
 */
function fileFor(dir: string, caseId: string): string {
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(caseId) || caseId.startsWith(".")) {
    throw new Error(
      `Érvénytelen esetazonosító: „${caseId}”. Betű, szám, pont, kötőjel és ` +
      `alulvonás megengedett, ponttal kezdődni nem. Ez nem formaság: egy ` +
      `útvonal-karakter az azonosítóban a tárolókönyvtárból kivezető írás.`,
    );
  }
  return join(dir, `${caseId}.jsonl`);
}

export class FileArchive implements CaseArchive {
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  async read(caseId: string): Promise<StoredEntry[]> {
    const file = fileFor(this.dir, caseId);
    if (!existsSync(file)) return [];
    const text = await readFile(file, "utf8");
    const out: StoredEntry[] = [];
    const lines = text.split("\n");
    for (const [i, line] of lines.entries()) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as StoredEntry);
      } catch {
        // CSONKA UTOLSÓ SOR: a félbeszakadt írás nyoma. Ez ÉRTELMEZHETŐ
        // állapot — a bejegyzés nem lett tartós, tehát nem is történt meg.
        // Bárhol máshol viszont sérülés, és azt nem hallgatjuk el.
        if (i === lines.length - 1 || lines.slice(i + 1).every((l) => !l.trim())) break;
        throw new Error(
          `A(z) ${caseId} archívum ${i + 1}. sora olvashatatlan, és nem az ` +
          `utolsó. Ez nem félbeszakadt írás, hanem sérülés — a fájl nem ` +
          `hiteles, mentésből kell visszaállítani.`,
        );
      }
    }
    return out;
  }

  async append(caseId: string, entries: StoredEntry[]): Promise<Durability> {
    if (!entries.length) return "local";
    const file = fileFor(this.dir, caseId);
    const isNew = !existsSync(file);
    await mkdir(this.dir, { recursive: true });

    const payload = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
    const fh = await openFile(file, "a");
    try {
      await fh.write(payload);
      await fh.sync();                       // a TARTALOM tartós
    } finally {
      await fh.close();
    }

    if (isNew) {
      // A KÖNYVTÁRBEJEGYZÉS is tartós kell legyen, különben áramszünet után
      // a tartalom megvan, de nincs neve. Ha a platform nem engedi a
      // könyvtár szinkronizálását, ezt NEM hallgatjuk el.
      let dh;
      try {
        dh = await openFile(this.dir, "r");
        await dh.sync();
      } catch {
        return "buffered";                   // nem mondhatjuk, hogy mentve
      } finally {
        await dh?.close();
      }
    }
    return "local";
  }

  /** Hol áll ennek az esetnek az archívuma — üzemeltetői kérdés, nem klinikai. */
  path(caseId: string): string {
    return fileFor(this.dir, caseId);
  }

  /** A tárolókönyvtár szülője — mentési szabály beállításához. */
  get root(): string {
    return dirname(this.dir);
  }
}
