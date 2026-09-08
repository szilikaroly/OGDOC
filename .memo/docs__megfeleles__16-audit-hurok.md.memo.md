---
source: docs/megfeleles/16-audit-hurok.md
sha256: 6fa52d807767799affd287d4d40d4d9ff7d10575633ec6d16543539f442afccd
lines: 106
profile: prose
generator: subagent
raw_tokens_est: 1400
verified: 4 confirmed
---

# docs/megfeleles/16-audit-hurok.md

## Topics
- L1-27: Az audit-hurok célja és a három audit-mező hiányzó változói
- L28-106: Négyértékű válaszkódolás, a három pár, közlési küszöbök, jelenlegi állapot

## Claims

- [C1] [PENDING] Generált munkalap az `npm run audit`-ból; 3 pár, 0 vizsgált eset, 0/3 pár közölhető @L3 `*Generált: `npm run audit`. 3 pár, 3/3 audit-mező bekötve · 0 vizsgált eset · 0/3 pár közölhető · 3 küszöb hiányzik.*`
- [C2] [PENDING] A hiba: mindhárom audit-mező `variable: null` volt, így a klinikus válasza sehol nem maradt volna meg @L16 `szabállyal és hosszú indoklással — és mind a háromban `variable: null`.`
- [C3] [PENDING] A prenatális audit-mező a `form.kimenetelGyermek` űrlaphoz és az `audit.prenatal.confirmed` változóhoz kötött @L24 `| A prenatális diagnózis megerősítve? (igen · …) | `form.kimenetelGyermek` | `audit.prenatal.confirmed` |`
- [C4] [PENDING] Az `indeterminate` (a referencia nem tudott dönteni) nem kerül a nevezőbe @L43 `| `indeterminate` | a referencia **nem tudott dönteni** | nem |`
- [C5] [CONFIRMED] A kitöltetlen mezőnek szándékosan nincs kódja @L47 `Az utolsónak nincs kódja, és ez szándékos:`
- [C6] [CONFIRMED] Küszöb hiányában a kapu zárva marad: 100/100 egyezés mellett sem adna ki számot @L83 `**A hiányzó küszöb nem engedékenység: a kapu zárva marad.** Ma a hurok 100/100`
- [C7] [CONFIRMED] A konfidenciasáv Wilson-féle pontszám-intervallum, nem normál közelítés @L87 `A sáv **Wilson-féle pontszám-intervallum**, nem a tankönyvi normál közelítés.`
- [C8] [CONFIRMED] Nincs egyetlen vizsgált eset sem, mert az esetek a 16. lépésből (a pilotból) jönnének @L103 `**Nincs egyetlen eset sem**, és ez nem ennek a lépésnek a hiánya: az esetek a`
