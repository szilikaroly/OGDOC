---
source: core/complaints/types.ts
sha256: 99d3a142a834d3f6e8e0f06afe56a3069d9afedd202bc2e9622e3e3a0ff7517f
lines: 62
profile: code
generator: subagent
raw_tokens_est: 651
verified: 7 confirmed
---

# core/complaints/types.ts

## Topics
- L1-31: Miért szótári tétel a panasz, és miért szerkezet a kontextusfeltétel
- L32-62: A panasztétel mezői: szinonimák, vörös zászlók, megnyíló mezők, útvonalak

## Claims

- [C1] [CONFIRMED] A feltétel adatszerkezet, nem kiértékelendő kifejezés — így nem kerül tetszőleges kód a regiszterfájlba @L17 `Kontextusfeltétel — SZERKEZET, nem kifejezés.`
- [C2] [CONFIRMED] A hivatkozott változónak léteznie kell a regiszterben, és ez fordításkor ellenőrizhető @L26 `/** A hivatkozott változó azonosítója — a regiszterben léteznie kell. */`
- [C3] [CONFIRMED] A feltétel hét operátort enged meg @L28 `op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in";`
- [C4] [CONFIRMED] A feltételes vörös zászló feltételei együttesen kell teljesüljenek @L47 `* FELTÉTELES vörös zászló: a felsorolt feltételek EGYÜTTES teljesülésekor.`
- [C5] [CONFIRMED] Az `opens` az esedékessé váló mezőket sorolja, az `asks` a további kérdéseket — két külön lista @L53 `opens?: string[];`
- [C6] [CONFIRMED] A `differential` emlékeztető, nem diagnózis @L57 `/** Amire gondolni kell — nem diagnózis, hanem emlékeztető. */`
- [C7] [CONFIRMED] Az üres `pathways` azt jelenti, hogy a tétel minden ellátási útvonalon megjelenik @L59 `/** Melyik ellátási útvonalon jelenjen meg. Üres = mindegyiken. */`
