---
source: docs/modulok/12-onkologia.md
sha256: 7bb7a0879f6601a302d71582df72e61cbfc758328dfc40a0c86d7ce5ea67bf93
lines: 135
profile: prose
generator: subagent
raw_tokens_est: 1761
verified: 9 confirmed
---

# docs/modulok/12-onkologia.md

## Topics
- L1-101: Az onkológiai modul hatóköre, a terhesség alatti daganat útvonala, elfogadási kapu
- L102-135: Verziózott kódlisták, a `readCode()` háromfelé válasza, RECIST-korlát

## Claims

- [C1] [CONFIRMED] Ez a modul illeszkedik legkevésbé a gerinchez és a legalacsonyabb prioritású (Prio 0,6) @L19 `nőgyógyászati dokumentációs gerinchez, és a legalacsonyabb prioritást kapja (Prio 0,6).`
- [C2] [CONFIRMED] A terhesség alatti daganatnál a diagnóziskori gesztációs kor dönti el, mi adható @L45 `- **Gesztációs kor a diagnóziskor** — ez dönti el, mi adható`
- [C3] [CONFIRMED] Kemoterápia után legalább 3 hét kell a szülésig, a csontvelő-mélypont miatt @L50 `- Szülés időzítése a kezeléshez képest (a kemoterápia után legalább 3 hét a szülésig, a`
- [C4] [CONFIRMED] A genetikai tanácsadás és a vizsgálat maga a 23. modulé, nem ezé @L77 `**A tanácsadás és a vizsgálat maga a [23. modulé](23-genetika.md)** — a tanácsadási kapuval,`
- [C5] [CONFIRMED] A megosztott döntéshozatal kapuja két mezőt kíván: a tényt és a megbeszélt lehetőségek felsorolását @L98 `A kapu **két** mezőt kíván: a megosztott döntéshozatal tényét ÉS a megbeszélt lehetőségek`
- [C6] [CONFIRMED] A verziószám önmagában kevés: a visszaolvasáshoz a rögzítéskori lista kell, nem a verzió neve @L111 `nem, hogy MIT jelentett akkor. Ehhez a régi **lista** kell, nem a régi verzió neve.`
- [C7] [CONFIRMED] A cervix FIGO-jelölése változatlan maradt, a tartalma nem — ez a csendes, veszélyes eset @L114 `**Ugyanaz a jelölés, más tartalom** — és ez a csendes eset, ami veszélyes: a kód feloldódik,`
- [C8] [PENDING] A `readCode()` három választ ad: mit jelentett akkor, `retired`-e ma, és `meaningChanged`-e @L118 `A `readCode()` ezért három választ ad: mi volt akkor, létezik-e ma (`retired`), és ugyanazt`
- [C9] [CONFIRMED] A megszűnt kódot a rendszer nem konvertálja át a mai rendszerre @L122 `A megszűnt kódot a rendszer **nem konvertálja át** a mai rendszerre. A hamis átfordítás`
- [C10] [CONFIRMED] A RECIST 1.1 nem számítható, mert nincs lézió-roszter; az `onc.response.recist` a klinikus kategóriáját tárolja @L131 `**A RECIST 1.1 nem számítható, csak a válaszkategória rögzíthető.** A célléziók`
