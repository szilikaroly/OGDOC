# 40 — A webes réteg a tárolón

*Az 1. lépés utolsó nyitva maradt tétele: a `web/` csontváz eddig nem használta
a `core/store/`-t. Most használja — és az, ami továbbra sem megy, meg van
nevezve.*

---

## Mit mondott az 1. lépés

> **Ami továbbra is nyitva van:** a `KeyStore` mögé HSM vagy KMS kell (a kulcs
> tartóssága szándékosan nem ezé a rétegé), és a `web/` csontváz még nem ezt
> használja — ahhoz hitelesítés kell, ami külön lépés. A rendszer tehát **még
> mindig nem futhat valódi betegadaton**, de már nem a tároló miatt.

Ez a lépés a második felét oldja meg — és közben pontosítja, mit jelent a
„hitelesítés külön lépés".

---

## Mi lett éles

| | Előtte | Most |
|---|---|---|
| tárolás | memória, újraindításkor elveszik | **titkosított fájlarchívum**, túléli az újraindítást |
| jogosultság | nincs | **három réteg** minden olvasásnál és írásnál |
| auditnapló | nincs | **külön fájlban**, az adat előtt írva |
| elkülönítés | egy eset, globálisan | esetenként külön lánc, kulcs és archívum |

A három jogosultsági réteg HTTP-n keresztül végigjátszható, és mindegyik
**látható eredményt** ad:

```
szerepkör          auditor → /api/case          403  „auditnaplót olvas, leletet nem”
ellátási kapcsolat Idegen Imre → /api/case      403  „a diploma nem ad jogot”
időablak           Régi Rezső → /api/case       403  „a kapcsolat MÁR NEM ÉL”
                   Minta Anna → /api/case       200  jogalap: ellátási kapcsolat
```

Egy jogosultsági réteg, amit a kiszolgáló egyetlen ponton megkerül, ugyanolyan
hasznos, mint amelyik nincs is — ezért a tesztek **valódi kiszolgálót**
indítanak valódi fájlrendszerre, és nem a függvényeket hívják közvetlenül.

---

## Ami NEM lett éles: a hitelesítés

A `core/store/` saját dokumentációja kimondja: *„Nem hitelesít. A »ki vagy te«
kérdést a gazdának kell megválaszolnia."* A webes réteg ezt a hiányt **nem
pótolja, hanem megnevezi**:

- a cselekvőt egyetlen kérésfejléc (`x-ogdoc-actor`) állítja;
- azt senki nem ellenőrzi;
- a jogosultsági réteg hibátlanul működik — **csak épp arról dönt, akinek a
  kérés mondja magát.**

### A kapu

A kiszolgáló `OGDOC_SYNTHETIC=1` nélkül **el sem indul**, és az üzenet
elmagyarázza, mi hiányzik. Ez nem README-be írt figyelmeztetés: aki elindítja,
kénytelen elolvasni.

Miért kapu, és nem bejelentkező képernyő? Mert egy bejelentkező képernyő
**elfedné** a hiányt: úgy nézne ki, mintha hitelesítés volna. A csonk
megnevezve kevésbé veszélyes, mint a csonk elfedve.

### A cselekvőválasztó sem bejelentkezés

A felület legördülője minden cselekvő mellé odaírja, **mit mutat be** — mert a
lista nem felhasználólista, hanem a jogosultsági réteg bemutatója.

---

## Két elutasítás, amit nem szabad összemosni

| | HTTP | Kié | Mi a teendő |
|---|---|---|---|
| jogosultsági (`denied`) | **403** | a tárolóé | emberi döntés kell hozzá; audit sor keletkezik róla |
| érvényességi (tartomány, levezetett mező) | **200**, `ok: false` | a regiszteré | a felületen javítandó szám |

A regiszter érvényességi ellenőrzése **a naplózás előtt** fut le: érvénytelen
érték nem kerülhet a naplóba, mert a napló utólag nem javítható.

A tároló háromféle bukása külön státuszt kap, mert a teendő mindháromnál más:
`denied` → 403 · `corrupt` → 409 (mentésből visszaállítani) · `unreadable` →
410 (a kulcs megsemmisült — a törlés így néz ki).

---

## Az auditnapló és aki olvashatja

Új, kimondott szabály a `core/store/hozzaferes.ts`-ben:

```ts
export const AUDIT_READERS: Role[] = ["auditor", "dpo"];
```

**Miért nem `Action`.** Az `Action` az, ami az ESETTEL történik; az auditnapló
olvasása egy *másik objektum* olvasása. `Action`-né téve az auditnapló olvasása
bekerülne a saját maga által naplózott műveletek közé.

**A klinikus kimarad**, és ez szándékos: az auditnapló megmondja, kit láttak el
hol és mikor — egy kollégára rákeresni benne nem gyógyítás.

**Az auditnapló nem tartalmaz értéket**, csak azonosítót: ki, mit, mikor,
milyen alapon. A megőrzési ideje más, mint a leleté, és a lelet másolása bele
új adatkezelés volna. Teszt őrzi.

**Az elutasítás is naplózódik.** A sikertelen kísérlet legalább annyira
érdekes, mint a sikeres: a naplózatlan kopogtatásból lesz a betörés.

---

## Az archívum épsége — jog nélkül

A `GET /api/archive` **nem kér cselekvőt**, és nem ad vissza tartalmat. Az
üzemeltetőnek és a mentésellenőrzőnek nincs joga a lelethez, de kell tudnia,
hogy a mentés ép — és ez a rejtjelezett alakon, kulcs nélkül ellenőrizhető.

---

## Mit bizonyít a teszt

`test/web.test.ts` — 22 teszt, valódi kiszolgálóval és valódi fájlrendszerrel:

1. **A kapu** — szintetikus jelzés nélkül a folyamat nem nulla kóddal áll le, és
   az üzenet megnevezi a hiányt.
2. **A három jogosultsági réteg** külön-külön, HTTP-státusszal és indoklással.
3. **Cselekvő nélkül nincs adat**, és nincs alapértelmezett felhasználó.
4. **Az írás átmegy a tárolón**, és a levezetés utána fut (a MAP `derived`).
5. **Elutasított írás után nem nő a napló** — a jogosultság nem utólagos szűrő.
6. **A kétféle elutasítás** külön státuszt kap.
7. **Az auditnapló**: szerepkör-elkülönítés, külön fájl, érték nélkül,
   elutasítással együtt.
8. **A lemezre írt eset titkosítva van** — sem a változóazonosító, sem az érték
   nem olvasható ki nyílt szövegben.
9. **Az eset túléli az újraindítást**, és a levezetett mezők újraszámolva
   jönnek vissza, nem a naplóból.

---

## Hol van a kód

| | |
|---|---|
| a tároló összekötése | `web/tarolo-api.ts` |
| a hitelesítés határa | `web/session.ts` |
| fejlesztői kulcstár, naplónyelő | `web/kulcsok.ts` |
| kiszolgáló | `web/server.ts` |
| auditolvasási jog | `core/store/hozzaferes.ts` → `canReadAudit` |
| tesztek | `test/web.test.ts` (22) |

Adatkönyvtár: `OGDOC_DATA` (alapértelmezés `ogdoc/.adat/`), a `.gitignore`
kizárja.

---

## Ami továbbra is nyitva van

**A hitelesítés.** Ez a réteg nem pótolja; a kapu megakadályozza, hogy
véletlenül élesnek higgyük. Valódi betegadathoz SSO vagy kártyás azonosítás
kell, ami a cselekvőt HITELESÍTI, mielőtt a jogosultsági réteg dönt róla.

**A kulcsőrzés.** A `FileKeyStore` a kulcsokat a titkosított adat *mellé* írja —
éles rendszerben pontosan az, amit nem szabad. A csere egyetlen `KeyStore`
implementáció; a tároló és a webes réteg egyetlen sora sem változik tőle.

**A többesetes kezelés.** A kiszolgáló egyetlen esetazonosítóval dolgozik
(`OGDOC_CASE`). Az ELKÜLÖNÍTÉS viszont már valódi: az ellátási kapcsolatok erre
az egy esetre szólnak, és egy másik azonosítóra ugyanazok a cselekvők nem
kapnak jogot.

**A törlés útja.** ~~Végpont még nem tartozik hozzá.~~ **MEGVAN:** a DPO
törlési felülete a `deletable` / `survivesRevocation` szabályokra épül, kétágú
visszavonással és tanúsítvánnyal —
[`41-torles.md`](41-torles.md).
