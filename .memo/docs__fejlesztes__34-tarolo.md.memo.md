---
source: docs/fejlesztes/34-tarolo.md
sha256: 9f5f3e8bf611ba80a863f3357dbf708e2a6d73b37dc3ff8b691fe97309c90356
lines: 191
profile: prose
generator: subagent
raw_tokens_est: 2264
verified: 11 confirmed
---

# docs/fejlesztes/34-tarolo.md

## Topics
- L1-150: mi készült el, elfogadási kritériumok, jogosultsági rétegek, sürgősségi hozzáférés, két lánc, kapuszabályok
- L151-191: fájlarchívum tartós írása, útvonalvédelem, nyitott kérdések

## Claims

- [C1] [CONFIRMED] A réteg nem foglalkozik hitelesítéssel, azt a gazda oldja meg; a réteg már azonosított cselekvőről dönt @L28 `nem is ide való: a **hitelesítés**`
- [C2] [CONFIRMED] A hozzáférési jogot az ellátási kapcsolat ténye adja, nem a szerepkör önmagában @L61 `ténye adja, nem a diploma.`
- [C3] [CONFIRMED] A sürgősségi hozzáférés harmadik feltétele a nevesített, határidős utólagos felülvizsgálat @L80 `**valakinek utólag meg kell néznie**, névvel és határidővel.`
- [C4] [CONFIRMED] A `pendingReviews()` az auditnaplóból számol, nem külön nyilvántartásból @L86 `az **auditnaplóból** számol, nem külön nyilvántartásból`
- [C5] [CONFIRMED] A `sealedHash` nem kulccsal hitelesített, ezért a romlást fogja meg, a felkészült támadót nem @L115 `nem kulccsal hitelesített.`
- [C6] [CONFIRMED] Az auditsor az adat kiolvasása előtt íródik, és ha az audit írása bukik, a művelet is bukik @L135 `az adat kiolvasása **előtt** íródik.`
- [C7] [CONFIRMED] A `FileArchive` hozzáfűző JSONL, nem JSON-tömb, hogy a félbeszakadt írás csak az utolsó sort érintse @L153 `**hozzáfűző**, soronként egy bejegyzés (JSONL)`
- [C8] [CONFIRMED] A csonka utolsó sor félbeszakadt írásnak számít, a máshol lévő csonka sor viszont sérülésnek @L159 `**A csonka utolsó sor félbeszakadt írás**`
- [C9] [CONFIRMED] A második `fsync` a könyvtárbejegyzésre kell, különben áramszünet után a tartalom név nélkül marad @L166 `**nincs neve**. Ezért mondhatja ez az osztály a`
- [C10] [CONFIRMED] Az esetazonosító engedélyező listán megy át, nem tiltólistán, a könyvtárból kivezető írás ellen @L170 `**engedélyező listán** megy át, nem tiltólistán`
- [C11] [CONFIRMED] A `web/` csontváz még memóriában tárol és valódi betegadattal nem futtatható @L183 `betegadattal nem futtatható.`
