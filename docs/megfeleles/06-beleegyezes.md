# Beleegyezési keret

A v16 már tartalmaz egy nyolcpontos biobanki hozzájáruló nyilatkozatot, önállóan választható
pontokkal, kimondott önkéntességgel és visszavonhatósággal. **Ez jó kiindulás**, és ez a
fejezet erre épít.

> A nyilatkozat szövege **sablon**: használat előtt adatvédelmi tisztviselői, jogi és
> kutatásetikai bizottsági jóváhagyást igényel. Ez a v16 óta nyitott teendő.

---

## 1. Rétegzett beleegyezés

Nem egy „aláírom / nem írom alá" döntés, hanem **külön eldönthető pontok sora**. A v16 ezt
már így csinálja, és kiterjesztjük:

| # | Pont | Alapértelmezés |
|---|---|---|
| 1 | Az adatok kutatási felhasználása, azonosításra alkalmatlan formában | külön dönt |
| 2 | **Diagnosztikai minta maradékának** biobanki tárolása és kutatási felhasználása | külön dönt |
| 3 | Kifejezetten kutatási célra történő mintavétel | külön dönt |
| 4 | Humángenetikai vizsgálat a mintán | külön dönt |
| 5 | **Széles körű (broad) felhasználás**: jövőbeni, még meg nem határozott, **etikai engedéllyel rendelkező** kutatásokban | külön dönt |
| 6 | Az adat és a minta megosztása más kutatóhelyekkel, MTA mellett | külön dönt |
| 7 | **Harmadik országba** történő továbbítás | külön dönt, **alapból nem** |
| 8 | Újrakontaktálás további kutatási kérdéssel | külön dönt |
| 9 | **Váratlan lelet visszajelzése** (secondary finding) | külön dönt — ld. 4. |
| 10 | Az adat összekapcsolása más nyilvántartással (pl. regiszter) | külön dönt |

**Egyik pont sem feltétele a másiknak**, és **egyik sem feltétele az ellátásnak**. Ez utóbbi
nem udvariassági formula: a hozzájárulás önkéntessége az ellátó–beteg viszonyban jogilag
sérülékeny, és a rendszernek is ki kell mondania.

---

## 2. A széles körű beleegyezés határai

Az 5. pont (broad consent) a biobanki működés kulcsa — enélkül minden új kutatáshoz újra meg
kellene keresni minden adományozót, ami gyakorlatilag lehetetlen.

**De a broad consent nem blanketta.** Három korlát, amit a rendszernek ki kell kényszerítenie:

1. **Etikai engedély minden felhasználáshoz.** A broad consent nem helyettesíti a kutatásetikai
   bizottság engedélyét — csak azt jelenti, hogy nem kell újra megkérdezni az adományozót.
   Technikailag: **etikai engedély azonosítója nélkül kiadás nem indítható.**
2. **Kutatási terület szerinti szűkítés.** A beleegyezés megjelölhet területet („reprodukciós
   egészség"), és azon kívülre nem terjed.
3. **Átláthatóság.** Az adományozó megnézhesse, mely kutatásokban használták fel a mintáját
   — ez a broad consent etikai ellensúlya. A `22` modul beteg-portál nézete ezt adja.

---

## 3. Visszavonás — a legfontosabb technikai követelmény

### 3.1 Mit jelent

| Réteg | Mi történik visszavonáskor |
|---|---|
| Minta | **megsemmisítés vagy zárolás** (az adományozó választása szerint), jegyzőkönyvvel |
| Adat | kizárás minden **jövőbeni** exportból, lekérdezésből, kiadásból |
| Folyó kutatás | a már kiadott mintát nem lehet visszaszerezni — ezt előre ki kell mondani |
| Publikált eredmény | nem visszavonható |

### 3.2 Amit a rendszernek tudnia kell

> **A visszavonás nem jelölés, hanem lefutó folyamat.**

```
visszavonás rögzítése
   ├─▶ a minták státusza → `withdrawn`, kiadásból kizárva  (azonnal)
   ├─▶ megsemmisítési vagy zárolási feladat generálása      (SOP-13)
   ├─▶ az adat kizárása a jövőbeni exportokból              (azonnal)
   ├─▶ a folyamatban lévő kiadási kérelmek felülvizsgálata
   ├─▶ értesítés a már kiadott minták fogadóinak (ha az MTA így rendelkezik)
   └─▶ visszaigazolás az adományozónak
```

Minden lépés naplózva, határidővel. **A visszavonás elfogadási kritérium a `22` modulban:**
a visszavont adományozó adata nem jelenhet meg egy visszavonás utáni exportban — ezt
teszttel kell bizonyítani, nem eljárásrenddel.

### 3.3 A visszavonás nem járhat hátránnyal

Az ellátás nem változik, és a rendszer nem kérdez rá az okra. A visszavonás **egy kattintás**
a beteg-portálon, plusz írásbeli megerősítés — nem egy folyamat, amit el kell érni.

---

## 4. Váratlan lelet (secondary finding)

Genetikai vizsgálatnál előfordul, hogy a kutatás olyat talál, ami az adományozó egészségére
nézve jelentős, de nem a vizsgálat tárgya.

**Ezt előre el kell dönteni, nem akkor, amikor megtörténik.** A beleegyezés 9. pontja:

| Választás | Mit jelent |
|---|---|
| Kérem a visszajelzést | csak **klinikailag hasznosítható, megerősített** leletről, genetikai tanácsadás keretében |
| Nem kérem | a lelet nem közlendő |
| Nem tudom eldönteni most | később eldönthető; addig nem közlendő |

**A tudáshoz és a nem tudáshoz való jog egyaránt védett** — a 2008. évi XXI. törvény
szempontjából is. A rendszer a választást a mintához köti, és a kutató **nem látja**, csak a
folyamat.

> **Nyitott kérdés:** mi a „klinikailag hasznosítható" küszöb? Erre nemzetközi listák
> léteznek (pl. gyógyítható vagy megelőzhető állapotok géncsoportjai), de a helyi
> gyakorlatot az etikai bizottsággal kell rögzíteni.

---

## 5. Különleges helyzetek

| Helyzet | Szabály |
|---|---|
| **Kiskorú** | törvényes képviselő nyilatkozik; a gyermek véleményét korához mérten figyelembe kell venni. **Nagykorúvá váláskor újra meg kell kérdezni** — a rendszer ezt esedékességként kezeli |
| **Cselekvőképtelen felnőtt** | törvényes képviselő; a jogszabályi feltételek szigorúbbak `[jogi ellenőrzés]` |
| **Magzat / újszülött** | az anya nyilatkozik; a köldökzsinórvér és a placenta külön elbírálás |
| **Elhunyt adományozó** | a hozzájárulás hatálya és a hozzátartozók jogai `[jogi ellenőrzés]` |
| **Sürgős helyzet** | kutatási mintavétel nem történhet; csak diagnosztikai maradék, utólagos megkereséssel |

A **nagykorúvá válás** a legkönnyebben elfelejtett tétel, és a rendszer tudja kezelni:
a születési dátumból számított esedékesség, automatikus feladatként.

---

## 6. A tájékoztatás formája

Rétegzett, ahogy az EDPB is javasolja:

1. **Rövid összefoglaló** — egy oldal, közérthetően: mi történik a mintával és az adattal
2. **Részletes tájékoztató** — GDPR Art. 13–14 teljes tartalma
3. **Nyilatkozat** — a 10 pont, külön-külön eldönthetően

Mindhárom **verziózott**, és a `gdpr_consents.dokumentum_verzio` mező rögzíti, melyik
változatot írta alá az adományozó. Ha a tájékoztató változik, a régi hozzájárulás a régi
szöveghez tartozik — és lehet, hogy újra kell kérni.

---

## 7. Nyitott kérdések

1. A nyilatkozat szövegének **DPO, jogi és etikai bizottsági jóváhagyása** (a v16 óta nyitott)
2. A **jogalap** végleges megválasztása (`02-gdpr.md` 2.2)
3. A váratlan lelet **klinikai hasznosíthatósági küszöbe** (4. pont)
4. Kiskorú és cselekvőképtelen adományozó szabályainak jogi ellenőrzése (5. pont)
