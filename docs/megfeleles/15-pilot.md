# Munkalap — a pilot előfeltételei

*Generált: `npm run pilot`. 1/7 előfeltétel áll (tervbeli 0/5, kimondatlan 1/2) · 1/3 zárási kritérium mérhető.*

## A pilot NEM indulhat el

A PILOT NEM INDULHAT: 6 előfeltétel hiányzik a(z) 7-ból, és 3 szervezeti döntés is hiányzik. Ez az első lépés, ami valódi betegadatot érint — amit itt elrontunk, azt utólag nem lehet visszacsinálni.

## 1. Amiért ez a lépés más súlyú a többinél

**Ez az első lépés, ami beteg-azonosításra alkalmas adatot érint.** Minden
eddigi kapu azt akadályozta meg, hogy a rendszer rossz *számot* mondjon; egy
rossz szám javítható. Amit itt rontunk el, az nem: a jogalap nélkül felvett
adat nem lesz visszamenőleg jogszerű, az elveszett vajúdási idősor nem áll
össze emlékezetből, és a klinikus, aki egyszer elveszítette, többé nem bízik
benne.

## 2. Az öt előfeltétel, amit a terv felsorol

| | Lépés | Előfeltétel | Ami hiányzik |
|---|---|---|---|
| ☐ | 1. | Tartós, jogosultsághoz kötött, auditált tároló | kulcstar-hsm: NINCS — a kulcsok fájlban állnak |
| ☐ | 3. | Adatvédelmi döntések (jogalap, beleegyezés, törlés) | dontes-alairasok: 0/38 szabály aláírva |
| ☐ | 6–8. | Labor-referenciák, normogramok és kalkulátorok hitelesítése | szamitasi-kapuk: 7 kalkulátor kapu mögött, 36 öröklött; 0/32 laborreferencia, 0/3 normogram, 0/11 szepszisküszöb aláírva |
| ☐ | 10. | Megőrzési idők aláírt rendje | megorzes-alairasok: 0/14 megőrzési idő aláírva |
| ☐ | 15. | Riasztási rend: címzettek és eszkalációs lánc | riasztasi-rend: 0/8 riasztástípus kiadható |

## 3. A kettő, amit a terv NEM sorol fel — és a rendszer mégis megkövetel

Az öt felsorolt előfeltétel **mind teljesülhet úgy, hogy a rendszer valódi
adaton mégsem futhat.** Ez nem a terv pontatlansága: a felsorolás a
*dokumentációs* előfeltételeket nevezi meg, a rendszer saját kapui viszont
kettővel többet kényszerítenek ki.

| | Előfeltétel | Állapot | Miért nem hagyható ki |
|---|---|---|---|
| ☐ | Hitelesítés — a „ki vagy te” kérdés | hitelesites: NINCS — a cselekvőt kérésfejléc állítja | A terv öt előfeltételt sorol, és a hitelesítés nincs köztük. Mind az öt teljesülhet úgy, hogy a rendszer VALÓDI ADATON MÉGSEM FUTHAT: a cselekvő kilétét egyetlen ellenőrizetlen kérésfejléc állítja, és a jogosultsági réteg arról dönt, akinek a kérés mondja magát. Ez nem a felsorolás pontatlansága — ez az az előfeltétel, ami a másik ötnél hangosabban hiányzik. |
| ☑ | Naplóhorgony — a levágott vég kimutatása | naplo-horgony: megvan és a tárolóba bekötve; telepítésenként külön kötetre kell tenni | A pilot első elfogadási kritériuma („nem veszített adatot”) horgony nélkül nem MÉRHETŐ: a levágott végű napló hiánytalan láncnak látszik. Az előfeltétel nem az épség, hanem az épség BIZONYÍTHATÓSÁGA. |

## 4. Amit gép nem tölthet ki

- **Nincs kijelölt osztály.**
- **Nincs vezető, aki vállalja.**
- **Nincs kezdődátum.**

Az osztály és a vezető nem adminisztratív mező. A lépés kimondja: *„egy
osztály, egy vezetővel, aki **vállalja**”* — és a vállalás az, amit gép nem
tud pótolni. A rendszer legfeljebb annyit tehet, hogy nem indul el nélküle.

## 5. Mivel mérjük a végén — a pilot ELŐTT eldöntve

A záráskor kimondott *„minden rendben ment”* pontosan annyit ér, amennyit a
mérése. Ha a mérési mód a pilot végén dől el, azt választjuk, ami épp kijön.

| Kritérium | Ma mérhető? | Mivel | Mi hiányzik hozzá |
|---|---|---|---|
| A rendszer nem veszített adatot. | **igen** | Minden pilot-eset naplójára horgonnyal igazolt épség (core/pilot/horgony.ts, adatvesztesMerleg). | Horgony nélkül a rendszer nem azt állítja, hogy nem veszett adat, hanem hogy nem tudja. A hiányzó mérés nem „nem veszett”. |
| A klinikusok nem kerülték ki a rendszert. | nem — nincs nevező | A rendszerben rögzített esetek száma osztva az osztályon ténylegesen ellátott esetek számával. | A rendszer a SZÁMLÁLÓT ismeri, a nevezőt nem: Az osztályon a pilot alatt ellátott esetek száma — a rendszeren KÍVÜLRŐL. — A rendszer csak a SZÁMLÁLÓT ismeri. Kikerülési bejegyzés hiánya nem bizonyíték: aki kikerüli a rendszert, épp azt nem hagyja benne nyomon. A nevezőt az osztálynak kell adnia, és a mérés e nélkül értelmetlen, nem csak pontatlan. |
| Van legalább egy dokumentált eset, ahol a rendszer olyat mondott, amit a klinikus egyébként nem vett volna észre. | **elérhetetlen** | Klinikusi nyilatkozat egy megnevezett esetről, a kiadott riasztás azonosítójával. | ELÉRHETETLEN, nem csak teljesítetlen: a(z) „Riasztási rend: címzettek és eszkalációs lánc” előfeltétel nem áll (riasztasi-rend: 0/8 riasztástípus kiadható). A rendszer meg sem szólal, tehát nem lehet olyan eset, amit ez a kritérium kér. |

**A hiányzó mérés sehol nem „teljesült”.** A pilot végén a *„nem
veszítettünk adatot”* és a *„nem mértük, veszítettünk-e”* két különböző
mondat — és éppen a pilot az, aminek ezt a kettőt szét kell választania.

## 6. Amit ez a lépés a rendszerben talált

**A lenyomatlánc a múltat köti meg, a végét nem.** Egy negyven bejegyzéses
naplóból az utolsó ötöt letörölve a maradék 1–35 lánc *hiánytalan*: nincs
hézag, minden lenyomat illeszkedik, a `verifyChain()` „ép”-et mond, a
rejtjelezett `verifySealedChain()` szintén, és a tároló a csonkát
megnyugtatóan felolvassa. Öt vajúdási bejegyzés hiányzik, és nem szól semmi.

Nem hibás megvalósítás: a naplóban **nincs olyan adat**, amiből ez
kiderülhetne. Ezért a **horgony** — a napló vége, a naplón *kívül* rögzítve,
külön köteten. A pilot első elfogadási kritériuma enélkül nem mérhető, hanem
csak *remélhető*.

És egy sorrendi következmény a 15. lépésből: amíg **egyetlen riasztástípus
sem kiadható**, a harmadik elfogadási kritérium — *„a rendszer mondott
olyat, amit a klinikus nem vett volna észre”* — nem teljesítetlen, hanem
**elérhetetlen**. A rendszer meg sem szólal.
