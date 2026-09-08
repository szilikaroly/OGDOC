---
source: core/fekvo/record.ts
sha256: 77f56a08f4c595d0232ec82e4a08a968fd1c4f68acea6995b5064ac1b4c878e5
lines: 242
profile: code
generator: subagent
raw_tokens_est: 2382
verified: 12 confirmed
---

# core/fekvo/record.ts

## Topics
- L1-109: a rekordkép mint kapu, layout-típusok, betöltők, hosszösszeg-önellenőrzés
- L110-242: checkRecord — férőhely, mezőhossz, típusjel-számosság, kódérvényesség

## Claims

- [C1] [CONFIRMED] a fekvőbeteg-jelentés fix hosszúságú, 746 bájtos rekord, ezért a mezőhossz nem formaiság @L4 `A fekvőbeteg-jelentés FIX HOSSZÚSÁGÚ, 746 bájtos rekord: minden mező adott`
- [C2] [CONFIRMED] a BNO_KOD öt karakteres, tehát a jelentési alak O1410 és nem O141 @L12 `BNO_KOD  5 karakter  →  O1410, nem O141`
- [C3] [CONFIRMED] a rekordkép adatból jön, mert a NEAK technikai útmutató és vele a mezőhosszak évente változnak @L16 `NEAK technikai útmutató évente változik, és a mezőhosszak vele.`
- [C4] [CONFIRMED] `layoutBytes` az almezők hosszösszegét az ismétlésszámmal szorozva adja a rekordhosszhoz @L85 `n += sub * (m.ismetles ?? 1);`
- [C5] [CONFIRMED] az `assignsHbcs` típusszinten mindig hamis — ez a réteg határa, nem hiányosság @L98 `assignsHbcs: false;`
- [C6] [CONFIRMED] a hosszellenőrzés karakterben mér, nem bájtban @L108 `const len = (s: string) => s.length;`
- [C7] [CONFIRMED] a rekord férőhelyét meghaladó diagnózisszám blokkoló lelet @L119 `if (c.diagnoses.length > layout.maxDiagnozis) {`
- [C8] [CONFIRMED] a pontot tartalmazó beavatkozáskódot külön alakvizsgálat fogja meg, mert a hossza stimmelhet @L158 `if (!/^[0-9A-Z]+$/.test(p.code)) {`
- [C9] [CONFIRMED] ha nincs rögzítve, beutalóval érkezett-e a beteg, a hiányzó „0” típusjel undetermined lesz, nem rendben @L194 `} else if (c.referred == null && !(byType.get("0") ?? 0)) {`
- [C10] [CONFIRMED] S, T, V, W, X vagy Y kezdetű kód esetén kötelező az „E” típusjelű külső ok @L205 `const external = c.diagnoses.some((d) => /^[STVWXY]/.test(d.code));`
- [C11] [CONFIRMED] az „F” típusjelű (FNO) diagnózis kimarad a BNO-törzs elleni ellenőrzésből @L216 `if (d.type === "F") continue;                    // FNO-kód, más törzsből`
- [C12] [CONFIRMED] a jelentés csak akkor adható be, ha egyetlen blocking szintű lelet sincs @L239 `canReport: !f.some((x) => x.level === "blocking"),`
