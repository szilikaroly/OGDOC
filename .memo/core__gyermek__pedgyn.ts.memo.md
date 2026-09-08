---
source: core/gyermek/pedgyn.ts
sha256: 4bb2d6e36e7f01e2eedf1200e1adcd89d1711de2c3aad8b0e6adf90ceb5476fa
lines: 298
profile: code
generator: subagent
raw_tokens_est: 3200
verified: 17 confirmed
---

# core/gyermek/pedgyn.ts

## Topics
- L1-125: modul alapelvei, életkori szakasz meghatározása, vizsgálati mód megengedhetősége
- L126-243: a gyermeknőgyógyászati vizit zászlói és teendői
- L244-298: a pubertás időzítésének megítélése vagy kimondott megítélhetetlensége

## Claims

- [C1] [CONFIRMED] itt — a rendszer szokásos szabályával szemben — a mérlegelés elmaradása maga a piros zászló @L21 `MÉRLEGELÉS ELMARADÁSA maga a piros zászló — mert a gyermekvédelmi`
- [C2] [CONFIRMED] a rendszer bántalmazást nem állapít meg, és nem is zár ki @L27 `· nem állapít meg bántalmazást, és nem is zárja ki;`
- [C3] [CONFIRMED] a szakaszt elsősorban a Tanner-mellstádium dönti el, az életkor csak stádium hiányában @L53 `if (b.state === "ok" && typeof b.value === "number") {`
- [C4] [CONFIRMED] életkor alapján 8 év alatt prepubertás a besorolás @L59 `if (kor.value < 8) return "prepubertas";`
- [C5] [CONFIRMED] FAIL-CLOSED: ismeretlen szakasznál a tükrös feltárás ugyanúgy elutasított, mint pubertás előtt @L87 `if (mod === "speculum" && (szak === "prepubertas" || szak === "ismeretlen")) {`
- [C6] [CONFIRMED] az elutasítás mellé irányt is ad: vaginoszkópia @L90 `helyette: "vaginoscopy",`
- [C7] [CONFIRMED] a bántalmazás-mérlegelés hiánya vagy notAsked értéke hianyzoMerlegeles zászlót ad @L137 `if (merlegelt === undefined || merlegelt === "notAsked") {`
- [C8] [CONFIRMED] a biztos gyanú piros, a bizonytalan gyanú tisztázandó súlyt kap @L154 `suly: gyanu === "yes" ? "piros" : "tisztazando",`
- [C9] [CONFIRMED] a mechanizmussal nem magyarázható sérülés piros zászló @L166 `if (ertek("pedgyn.trauma.consistent") === "no") {`
- [C10] [CONFIRMED] pubertás előtti korban a fel nem tett vérzéskérdés önmagában zászló @L186 `} else if (szak === "prepubertas" && (verzes === undefined || verzes === "notAsked")) {`
- [C11] [CONFIRMED] bűzös vagy véres váladéknál a teendő vaginoszkópia mérlegelése, nem ismételt antibiotikum @L201 `teendo: "vaginoszkópia mérlegelése — ismételt antibiotikum helyett",`
- [C12] [CONFIRMED] serdülőnél a titoktartás keretének megbeszéletlensége tisztázandó zászlót ad @L215 `if (szak === "serdulo" && ertek("pedgyn.confidentiality.discussed") !== "pos") {`
- [C13] [CONFIRMED] a számérték-olvasó a rögzített „nem tudom” választ is hiányzóként kezeli @L249 `if (nemTudja(reg, id, r.value)) { hianyzik.push(id); return undefined; }`
- [C14] [CONFIRMED] a 8 év alatt indult mellfejlődés korai pubertás gyanúja @L257 `if (thelarche !== undefined && thelarche < 8) {`
- [C15] [CONFIRMED] 13 év felett a késői pubertást csak a megfigyelt B1 Tanner-stádium mondja ki, nem a hiányzó thelarche-adat @L274 `if (kor !== undefined && kor >= 13 && b.state === "ok" && b.value === 1) {`
- [C16] [CONFIRMED] 15 év felett a rögzítetlen menarche „nem megítélhető”, nem „nem volt” @L280 `if (kor !== undefined && menarche === undefined && kor >= 15`
- [C17] [CONFIRMED] adathiány esetén nem születik besorolás, az ítélet nemMegitelheto @L296 `miert: "a pubertás időzítéséhez szükséges adatok hiányoznak — besorolás nem születik",`
