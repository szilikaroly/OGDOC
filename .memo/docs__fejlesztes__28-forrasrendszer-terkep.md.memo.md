---
source: docs/fejlesztes/28-forrasrendszer-terkep.md
sha256: e6f865fc13b9c1f7b5b4bc9fc3b5b18532e915e631faf0ef139b99719cb1e8d1
lines: 639
profile: prose
generator: subagent
raw_tokens_est: 7245
verified: 32 confirmed
---

# docs/fejlesztes/28-forrasrendszer-terkep.md

## Topics
- L1-91: A két térkép elve és a normogram-katalógus harmadik (katalogizált) szintje
- L92-242: Felületi lefedettség modulonként, az át nem vehető mezők, interfészmezők
- L243-301: Az indikáció mint elszámolási előfeltétel, egy lista négy alanyra
- L302-449: MoM és reagenstétel, kettős kockázat, mérési körülmény, PUL-panel
- L450-609: Magzati anatómia öt állapota, a kétféle „nem", és négy új kaputípus
- L610-639: Az elfogadási kritériumok tesztfájlokban

## Claims

- [C1] [CONFIRMED] A térképek elve: a hiány mértéke csak a teljesség listájával látszik @L18 `Az elv mindkettőnél ugyanaz: **a hiány mértéke csak akkor látszik, ha a`
- [C2] [CONFIRMED] A katalogizált szint azt jelenti, hogy tudunk a görbéről, de a tábla nincs meg — percentilist nem ad @L36 `— **de a tábla nincs meg** | nem |`
- [C3] [CONFIRMED] 265 katalogizált görbéből 3 van betöltve és 0 hitelesítve @L41 `265 katalogizált görbe 119 mérésre · 3 betöltve · 0 hitelesített`
- [C4] [CONFIRMED] A kétféle BPD-mérési konvenció felcserélése néma percentilis-eltolódás @L57 `felcserélésük nem elírás, hanem **néma percentilis-eltolódás**.`
- [C5] [CONFIRMED] A konvenció-érzékenységet maga a katalógus dönti el, nem beleégetett lista @L60 `katalógus**: ha egy mérésre kétféle konvencióval is publikáltak görbét, akkor a`
- [C6] [CONFIRMED] A forrásrendszerben bejelölt 137 görbe adat arról, mit használnak — nem hitelesítés @L86 `Ez **adat**: azt mondja meg, mit használnak. **Nem hitelesítés.** A mi`
- [C7] [CONFIRMED] A felülettérkép 52 szakaszt, 23 adatlapot és 636 mezőt ír le @L95 `52 felületi szakasz · 23 adatlap · 636 mező`
- [C8] [CONFIRMED] A 636 mezőből 513 hiányzik — ez a backlog @L109 `| **hiányzik** | 513 | ez a backlog |`
- [C9] [CONFIRMED] A genetikai modulhoz három felületi szakasz tartozik, és egyetlen változó sincs felvéve @L118 `| **23 — Genetika** | **3** | **0** |`
- [C10] [CONFIRMED] A modulszám → változó leképezés a regiszterből származik, nem kézi listából @L131 `A modulszám → változó leképezés **magából a regiszterből** származik: a`
- [C11] [CONFIRMED] A phi jelölés a családon belüli erőszaknál nem elég: az exportból zár ki, a beteg kezébe adott papírról nem @L162 `jelölés ezt **nem** oldja meg: az az exportból és a lekérdezőből`
- [C12] [CONFIRMED] Az „összes negatív" pipa nem írja felül a „nem tudom" válaszokat @L187 `nem írja felül a „nem`
- [C13] [CONFIRMED] A javallat BNO-kódja az elszámolhatóság előfeltétele, nem adminisztratív mező @L251 `Az indikáció tehát az **elszámolhatóság előfeltétele**, és a rendszerben a`
- [C14] [CONFIRMED] Az anyai aggodalom önálló, érvényes javallat @L258 `- **Az anyai aggodalom önálló, érvényes javallat.** A rendszer sehol nem`
- [C15] [CONFIRMED] A négyszer ismételt szervrendszeri lista nálunk egy lista négy példány-dimenzióval @L283 `A rendszerben ez **egy lista, négy példány-dimenzióval**`
- [C16] [CONFIRMED] A hemoglobinopathiáknál kódolt négyértékű készlet kell, mert a hordozó és az érintett nem ugyanaz @L297 `**érintett** nem ugyanaz. Kódolt értékkészlet kell rá — *érintett · hordozó ·`
- [C17] [CONFIRMED] A gyártó és a reagens-tételszám gate státuszú, mert a MoM a mediánsorhoz tartozik @L324 `státuszúra teszi mindkét mezőt. A tételszám az`
- [C18] [CONFIRMED] A háttér- és a számított kockázat különbsége maga az információ, ezért külön áll @L338 `A kettő **különbsége maga az információ**. Egyetlen számmá összevonva elvész,`
- [C19] [CONFIRMED] A laborhiba- és mozaicizmus-jelölés címkeként látszik, de nem véd — kapuként kell viselkednie @L353 `Címkeként rögzítve **látszanak, de nem védenek**. Kapuként kell viselkedniük.`
- [C20] [CONFIRMED] A transzvaginálisan és a transzabdominálisan mért CRL nem ugyanaz a szám @L375 `> A transzvaginálisan és a transzabdominálisan mért CRL **nem ugyanaz a szám**.`
- [C21] [CONFIRMED] A PUL-modell három valószínűséget ad (elhalt, intrauterin, ectopiás), nem igen/nem választ @L421 `És a modell **három valószínűséget** ad — elhalt, intrauterin, ectopiás, együtt`
- [C22] [CONFIRMED] A klinikusi benyomás és a modell eltérése maga is adat, ezért külön mezőben áll @L430 `> **A kettő eltérése maga is adat.**`
- [C23] [CONFIRMED] A „nem látható" és a „nem hozható látótérbe" két különböző állapot @L463 `> **A „nem látható" és a „nem hozható látótérbe" nem ugyanaz.**`
- [C24] [CONFIRMED] A readState szerkezetileg különbözteti meg: a notVisible kóros leletet, a notObtainable ismétlést jelöl @L474 `abnormalFinding: true`
- [C25] [CONFIRMED] Minden szervrendszernek kiírt normál állítása kell, és ezt a validátor kikényszeríti @L482 `A „normális" önmagában nem lelet: le kell írni, **mit** állítunk normálisnak. A`
- [C26] [CONFIRMED] A genitalia-leletnél a megállapítás rögzül, de nem kerül a nyomtatott leletre @L514 `A megállapítás **rögzül**, de **nem kerül a nyomtatott leletre**. Pontosan ez`
- [C27] [CONFIRMED] Fagyasztott petesejtnél a fagyasztáskori, donornál a donor életkora tartozik a triszómia-kockázathoz @L548 `Fagyasztott petesejtnél a **fagyasztáskori** életkor, donor petesejtnél a`
- [C28] [CONFIRMED] A beleegyezés-kapu magát a számítást kapuzza — ez a minta eddig hiányzott @L570 `A rendszer kapui eddig **adat rögzítését** kapuzták. Ez **magát a számítást**`
- [C29] [CONFIRMED] A felülettérképet 38, a normogram-katalógust 17 teszt fedi @L612 `(38) és`
- [C30] [CONFIRMED] Teszt bizonyítja, hogy a katalógus megnevezi a lyukait @L617 `| a katalógus megnevezi a lyukait | a részlegesség kimondva, nem elhallgatva |`
- [C31] [CONFIRMED] Az etnikai mezők refused státusza tesztelt: a GDPR-döntés szerkezet, nem szándék @L623 `státuszúak | a GDPR-döntés szerkezet, nem szándék |`
- [C32] [CONFIRMED] Teszt őrzi, hogy a notVisible lelet, a notObtainable pedig ismétlést kér @L634 ` ismétlést kér | a két „nem" ellentétes teendőt szül |`
