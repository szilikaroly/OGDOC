---
source: docs/fejlesztes/10-click-open.md
sha256: 4e642fd62ea4eccd34a812b5a18a788baeebb4ee7851291010bd53ad96dca317
lines: 303
profile: prose
generator: subagent
raw_tokens_est: 3299
verified: 19 confirmed
---

# docs/fejlesztes/10-click-open.md

## Topics
- L1-42: miért ez a legkockázatosabb pont, és a click-open öt leletállapota
- L43-92: az öt állapot elkülönítése, a részletező lánc és a kódlista-vezérelt elágazás
- L93-178: a regiszterbeli alak, build-ellenőrzések, interakció-mérőszám, betegnek szóló szöveg
- L179-303: klinikusi javaslatok, beteg-oldali anamnézisfelvétel, és a kimondott kockázatok

## Claims

- [C1] [CONFIRMED] A fejezet célja, hogy a strukturált bevitel gyorsabb legyen a gépelésnél @L3 `**A cél egyetlen mondatban: a strukturált bevitel legyen gyorsabb a gépelésnél.**`
- [C2] [CONFIRMED] Kevesebb kattintást kell kérni, mint amennyi gépelést megspórolunk @L19 `**kevesebb kattintást kell kérni, mint amennyi gépelést`
- [C3] [CONFIRMED] Minden lelet alapból csukva van, és öt állapota lehet @L26 `Minden lelet **alapból csukva** van, és **öt állapota** lehet:`
- [C4] [CONFIRMED] Két kóros lelet mellett egy húsz tételes státusz két kattintás, nem húsz mező @L40 `**Egy húsz tételes státusz így két kattintás, nem húsz mező**`
- [C5] [CONFIRMED] A korlátozott vizsgálat megnyitja a részletező láncot, a nem vizsgálható nem @L54 ` **megnyitja** a részletező láncot, az `
- [C6] [CONFIRMED] A kimaradt mezőről a rendszer semmit nem állít: nem kerül a betegtájékoztatóba és nem generál javaslatot @L67 ` mezőről a rendszer **semmit nem állít**: nem kerül a betegtájékoztatóba és`
- [C7] [CONFIRMED] A kódlista dönti el, mit kérdez tovább a rendszer, nem a felület @L88 `**A kódlista dönti el, mit kérdez tovább a rendszer — nem a`
- [C8] [CONFIRMED] Új leletcsoport felvétele elágazó lánccal sem igényel kódot @L91 `nem igényel kódot.`
- [C9] [CONFIRMED] Build-hiba, ha a lánc nem létező mezőkre mutat @L139 ` létező mezőkre mutat | hiba |`
- [C10] [CONFIRMED] Az interakció-mérőszám csak az emberi bevitelt számolja, a levezetett értékeket nem @L151 `**csak az emberi bevitelt** számolja`
- [C11] [CONFIRMED] Ha az érintett mezők száma nem csökken, a minta nem működik @L153 `**ha nem csökken, a minta nem működik.**`
- [C12] [CONFIRMED] Minden rögzített lelet generál beteg-olvasható mondatot, a normális is @L159 `Minden rögzített lelet generál egy beteg-olvasható mondatot, **a normális is**:`
- [C13] [CONFIRMED] A betegnek szóló szöveg generált, nem gépelt, így nem térhet el a rekordtól @L174 `**A szöveg generált, nem gépelt.**`
- [C14] [CONFIRMED] Minden javaslat mellett ott áll, melyik mező váltotta ki @L206 `**Minden javaslat mellett ott van, melyik mező váltotta ki.**`
- [C15] [CONFIRMED] Az anamnézist a beteg tölti ki a betegfelvételkor, portálon vagy kioszkon @L220 `**Az anamnézist a beteg tölti ki**, a betegfelvételkor`
- [C16] [CONFIRMED] A beteg bejegyzése a precedencia legalján van, a klinikusi korrekció mindig felülírja @L240 `**A beteg bejegyzése a precedencia legalján van.**`
- [C17] [CONFIRMED] A carboprost hard-stop kapuját a beteg saját bejelölése önmagában nem húzhatja meg @L243 `saját bejelölése **önmagában nem húzhatja meg**`
- [C18] [CONFIRMED] A mechanizmus kész, a tartalom nincs: három leletcsoport van kidolgozva mintaként @L285 `**A mechanizmus megvan, a tartalom nincs.**`
- [C19] [CONFIRMED] A megerősítési kapu csak akkor véd, ha nem válik rituálévá @L300 `**A megerősítési kapu csak akkor véd, ha nem válik rituálévá.**`
