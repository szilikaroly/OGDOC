---
source: docs/fejlesztes/08-ai-csatolasi-pontok.md
sha256: 5810b30888d82af669ebd08c7b96f15c558aafcf50549a866d8ece599dbe7764
lines: 198
profile: prose
generator: subagent
raw_tokens_est: 2321
verified: 14 confirmed
---

# docs/fejlesztes/08-ai-csatolasi-pontok.md

## Topics
- L1-20: a négy szabály, ami minden AI-csatolási pontra vonatkozik
- L21-156: a hét csatolási pont szerződése és kockázatai, és ahol AI-t nem szabad használni
- L157-198: a javaslat technikai szerződése, a feldolgozási út és a mérőszámok

## Claims

- [C1] [CONFIRMED] Az AI kimenete javaslat, nem levezetett érték: az AI nem állít, javasol @L10 `Az AI nem állít, javasol.`
- [C2] [CONFIRMED] Megerősítés nélkül nem rögzül érték, és a hivatkozás megnevezi a modellt és verzióját @L11 `**Megerősítés nélkül nem rögzül érték.**`
- [C3] [CONFIRMED] Az AI adatot strukturál, klinikailag nem értékel; a felismerés a meglévő kalkulátorokat táplálja @L12 `**Az AI nem értékel klinikailag — adatot strukturál.**`
- [C4] [CONFIRMED] Minden AI-kimenet naplózódik modellel, verzióval, bemenet-hash-sel és a megerősítés tényével @L13 `**Minden AI-kimenet naplózódik**: modell, verzió, bemenet-hash, kimenet, megerősítette-e valaki.`
- [C5] [CONFIRMED] Az EKG-digitalizálásnál a detektált kalibrációt meg kell erősíteni, mielőtt bármi számolna @L36 `a **detektált kalibráció megjelenik és megerősítendő**, mielőtt bármi számolna.`
- [C6] [CONFIRMED] A diktálás nem szabad szöveges mezőt tölt, hanem kódlista-tételt javasol @L58 `a diktálás **nem szabad`
- [C7] [CONFIRMED] A diktálásnál a tagadás elvesztése a legveszélyesebb hiba @L68 `**A tagadás a legveszélyesebb hiba.**`
- [C8] [CONFIRMED] A természetes nyelvű lekérdezésnél az AI a szűrőfához fér hozzá, nem az adathoz @L110 `**Az AI itt nem az adathoz fér hozzá, hanem a lekérdezéshez.**`
- [C9] [CONFIRMED] Tanult kockázati modell külső validáció nélkül definiálható, de eredményt nem ad @L144 `**definiálható, de nem ad eredményt**`
- [C10] [CONFIRMED] Hard-stop kapunál nem használható AI, mert az asztma-carboprost tiltás determinisztikus szabály @L150 `Az asztma → carboprost tiltás determinisztikus szabály.`
- [C11] [CONFIRMED] A javaslat szerződésében az emberi olvasatú indoklás kötelező mező @L166 `// MIÉRT — kötelező, ember számára olvasható`
- [C12] [CONFIRMED] A küszöb alatti konfidenciájú javaslat meg sem jelenik @L177 `→ nem jelenik meg.`
- [C13] [CONFIRMED] Az elutasított javaslatok naplózása mutatja meg, hol téved a modell rendszeresen @L184 `**Az elutasítás naplózása** legalább olyan értékes, mint az elfogadásé`
- [C14] [CONFIRMED] A legfontosabb mérőszám az elfogadás utáni javítás aránya, mert a magas érték rituálévá vált megerősítést jelez @L192 `**Elfogadás utáni javítás aránya**`
