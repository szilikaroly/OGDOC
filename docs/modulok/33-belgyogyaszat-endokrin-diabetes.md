# Modul 33 — Belgyógyászat, endokrinológia, diabetológia

*Ahol ugyanaz a labor mást jelent — és a rendszer már tudja, hogyan mondja meg.*

---

## A modul egyetlen szerkezeti kérdése

**A terhesség nem egy szempont a belgyógyászati kezelés mellett. Megváltoztatja
magát a betegséget, a célértékeket és a gyógyszert.**

Egy általános belgyógyászati modul, amit „terhességi megjegyzésekkel"
egészítenek ki, három ponton téved csendben:

1. **A referenciatartomány más.** A TSH, a kreatinin, a fehérvérsejtszám, a
   D-dimer — mind eltolódik, trimeszterenként. A rendszernek ez a rétege
   **megvan** (`reference` kontextussal, 6. lépés), csak nincs feltöltve.
2. **A célérték más.** A terhességi cukorbetegség célértékei nem a 2-es típusú
   diabétesz célértékei, és nem is „szigorúbb változatuk" — más mérés, más idő.
3. **A gyógyszer más, és trimeszterenként változik.** A thyreostatikumoknál a
   választás az I. trimeszterben más, mint utána — ez a rendszer legélesebb
   példája arra, hogy egy „terhességben adható / nem adható" kétértékű mező
   **hamis**.

---

## Mi van már meg

| | |
|---|---|
| Laborreferencia-réteg (6. lépés) | **kontextusfüggő** tartomány, hitelesítési szinttel |
| `lab.*` — TSH, HbA1c, kreatinin, 17-OHP, kortizol, DHEAS, AMH, PRL | a változók megvannak |
| `core/ui/meres.ts` | `nincsKuszob` — kimondja, ha nincs mihez mérni |
| `registry/szuresek/` | 8 szűrési szabály |
| `registry/dieta/` | 15 diétás protokoll |

**És egy mérés, ami most derült ki:** a `lab.hba1c`, a `lab.tsh`-hoz hasonló
endokrin értékek nagy része ma **néma** — sem kritikus küszöbük, sem
referenciájuk nincs. Ez a modul első kézzelfogható haszna.

---

## 1. Diabetológia — két különböző betegség egy néven

| | GDM (terhességi) | Praegestatiós (1-es/2-es típus) |
|---|---|---|
| Mikor derül ki | 24–28. hét szűréssel | a terhesség előtt ismert |
| A magzati kockázat | főleg a II–III. trimeszterben | **a szervfejlődés idején is** |
| A HbA1c szerepe | korlátozott | **a fogamzás előtti érték a legfontosabb** |
| A kezelés | diéta → metformin/inzulin | meglévő kezelés **átállítása** |
| Szülés utáni teendő | **újraértékelés** — nem szűnik meg magától | folytatódik |

**A rendszernek ezt a kettőt nem szabad egy `diabetes: igen` mezőben
összemosnia.** Egy praegestatiós diabéteszes első trimeszterében a magzati
szervfejlődés zajlik a rossz anyagcsere mellett — a GDM-nél ez a szakasz már
elmúlt. A teendő időben más.

**És a szülés utáni újraértékelés az, ami a leggyakrabban elmarad**: a GDM nem
szűnik meg a szüléssel, csak nem mérik többé. A rendszer ezt az elmaradást a
15. utánkövetés modul mintájára **jelként** kell kezelje, ne hiányként.

---

## 2. Pajzsmirigy — ahol a kétértékű mező hazudik

A trimeszterspecifikus TSH-tartomány nem finomítás: a nem terhes felső határral
mérve terhesség I. trimeszterében **fölöslegesen kezelnénk**, a III.-ban pedig
**elengednénk** valódi eltérést.

És a gyógyszerválasztás **trimeszterfüggő** — ez az a példa, ami miatt a
„terhességben adható?" kétértékű mező szerkezetileg hibás. A rendszernek a
gyógyszer terhességi információját **gesztációs korral együtt** kell tárolnia,
nem igen/nem alakban (l. 32. modul).

---

## 3. PCOS, hyperandrogenismus, prolaktin

Ez a csoport a **nőgyógyászat és az endokrinológia határán** él, és ma egyik
modulban sincs otthon: az `lab.amh`, `lab.dheas`, `lab.17ohp`, `lab.prl`,
`lab.lh`, `lab.fsh` mind megvan a regiszterben — és **mind néma**.

A PCOS diagnózisa kritériumrendszer (nem egyetlen érték), és a rendszernek van
rá szerkezete: a szepszis-kritériumok (9. lépés) pontosan ilyen — megnevezett
kritériumok, küszöbökkel, aláírással.

---

## 4. Amit ez a modul NEM tesz

**Nem lesz általános belgyógyászati rendszer.** A hatóköre az, ami a szülészeti
és nőgyógyászati ellátásban ténylegesen felmerül: anyagcsere, pajzsmirigy,
hypertonia, thrombophilia, vesefunkció, autoimmun kórképek terhességi
vonatkozása.

Ami ezen kívül esik — kardiológia, gasztroenterológia, onkológia a nőgyógyászati
körön túl —, oda **beutalás** megy, nem saját protokoll. Ugyanaz a döntés, mint
a védőnői modulban: aki nem az adott kérdés gazdája, az **továbbküld**.

---

## 5. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| `ctx.pregnant`, `ctx.ga` | laborreferencia | **a kontextus dönti el a tartományt** |
| `lab.tsh`, `lab.hba1c` … | mérésértékelés | ma `nincsKuszob` — ez a modul tölti fel |
| GDM/praegestatiós megkülönböztetés | kockázati számítások | más bemenet, más eredmény |
| endokrin kritériumok | 9. lépés kritériumszerkezete | aláírással |
| szülés utáni újraértékelés | 15. utánkövetés | **elmaradás = jel** |
| gyógyszerváltás | 32. modul | trimeszterfüggő, nem kétértékű |

---

## 6. A gépi fele — ami elkészült

`core/endo/diabetes.ts` · `core/lab/analit.ts` · `registry/labor/analit-csoportok.json`

**A rés, amit a modul megtalált: a referenciatartomány tudta, hogy a terhesség
eltolja a normálértéket — a KRITIKUS küszöb nem.**

A mérésértékelés sorrendben elsőként a `domain.critical` határt nézi,
kontextus nélkül, azzal az indoklással, hogy „ez a változó definíciós határa,
nem referenciatartomány-kérdés". Az éhomi vércukornál ez az indoklás hamis:

| | `lab.ogtt.0` | `lab.glucose.fasting` |
|---|---|---|
| kritikus küszöb (volt) | 5,1 mmol/L | **7,0 mmol/L** |

Ugyanaz a minta, ugyanaz az egység. Egy **5,8-as érték terhesen a terhességi
cukorbetegség diagnosztikus küszöbe fölött van** — de attól függött, melyik
mezőbe gépelték be, hogy lett-e belőle riasztás.

A küszöb mostantól kontextusfüggő (`domain.criticalByContext`), ugyanazokkal a
kulcsokkal, mint a referencia. **Ismeretlen terhességi állapotnál a szigorúbb
küszöb érvényes** — a nem terhes küszöbre visszaesni itt ugyanaz a hiba lenne,
mint a referenciánál, csak itt a riasztás marad el.

Az **analit-csoport** ezt általánosítja: kimondja, hogy két mező ugyanazt méri,
és a validáló ellenőrzi, hogy ugyanabban a kontextusban ugyanazt a küszöböt
mondják-e. *(A csoport első futása azonnal talált egy másodikat: a
`lab.ogtt.0`-nak nem volt alsó határa — egy 2,6-os hypoglykaemiás értéket
átengedett volna.)*

### A két diabétesz mint két entitás

`kockazatiAblak()` — a különbség **időbeli, nem súlyossági**: praegestatiós
diabétesznél a 4–10. hét (szervfejlődés) **már kockázat alatt áll**, GDM-nél ez
a szakasz a diagnózis előtt lezajlik.

`szulesUtaniUjraertekeles()` — a szülés utáni 4–12. héten esedékes OGTT
elmaradása **jel**, nem hiány: *a GDM nem szűnik meg a szüléssel, csak nem mérik
többé*, és ez az egyetlen pont, ahol a később kialakuló 2-es típusú
cukorbetegség időben kiderülne.

### És a némaság, megszámolva

**8/17 endokrin mérés szólal meg; 9 néma** — sem küszöb, sem
referenciatartomány. A PCOS, a pajzsmirigy és a prolaktin kérdésköre jórészt
ezekre épül.

---

## 7. Elfogadási kritérium

1. A GDM és a praegestatiós diabétesz **külön entitás**, nem egy mező két
   értéke.
2. A trimeszterspecifikus laborreferenciák felvéve és **hitelesítve** — vagy a
   mérés `nincsKuszob` állapotot ad, nem felnőtt sávot.
3. A szülés utáni GDM-újraértékelés elmaradása **jelet ad**.
4. A gyógyszer terhességi információja **gesztációs korhoz kötött**, nem
   igen/nem.
5. A hatókörön kívüli kérdésre **beutalás** a válasz, nem saját protokoll.

---

## 8. Nyitott kérdések

- **Melyik trimeszterspecifikus referencia?** Nemzetközi ajánlás vagy hazai
  labor sajátja? Ez a 18. lépés kérdésének endokrin változata: *idegen
  populáción mért tartomány idegen választ ad.*
- **A PCOS-kritériumrendszer** melyik változata, és ki írja alá?
- **Hol a határ** a szülészeti és a belgyógyászati felelősség között? Ez nem
  fejlesztési kérdés, de a rendszernek tudnia kell, kihez szól a teendő.
