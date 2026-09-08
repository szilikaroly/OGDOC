---
source: core/op/types.ts
sha256: 6d0a168c6a8000fb3c69762963d6dace8da5981385c5a7e2d4fa380d22005550
lines: 68
profile: code
generator: subagent
raw_tokens_est: 716
verified: 5 confirmed, 1 needs_agent
---

# core/op/types.ts

## Topics
- L1-13: A beavatkozási törzs célja: kódAJÁNLÁS, nem automatikus kódolás
- L14-68: A Procedure interfész — kód, verzió, alternatívák, kódcsalád, sablonmezők

## Claims

- [C1] [NEEDS_AGENT] a modul kódajánlást ad, a kódolás felelőssége az emberé marad @semantic L1-11
- [C2] [CONFIRMED] az `oeno` blokk kötelezően megnevezi a törzset, mert az ötjegyű kód alakjából nem derül ki, melyik listába tartozik @L34 `system: "mut" | "oeno";`
- [C3] [CONFIRMED] a kódhoz verziót is tárol, mert a törzs évente változik @L36 `version: string;`
- [C4] [CONFIRMED] az `alternatives` ugyanannak a beavatkozásnak más kódját adja, `when` mezővel emberi olvasatra @L42 `alternatives?: Array<{ code: string; label: string; when: I18n }>;`
- [C5] [CONFIRMED] az `also` kódok a fő kód MELLÉ kerülnek, nem helyette @L44 `also?: Array<{ code: string; label: string; why: I18n }>;`
- [C6] [CONFIRMED] gyűjtőkód hiányában a `codeFamily` jelölteket sorol és megindokolja, miért nem dönt @L58 `candidates: Array<{ code: string; label: string }>;`
