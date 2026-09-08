# Klinikai átvétel — NN. modul

| | |
|---|---|
| **Modul** | |
| **Regiszter-verzió** | |
| **Kalkulátorok** | ebből `verified`: |
| **Dátum** | |

## 1. Amit az átvevő ellenőrzött

- [ ] Minden mező definíciója klinikailag helyes
- [ ] A kódlisták teljesek — nincs olyan gyakori eset, ami csak „egyéb"-ként rögzíthető
- [ ] A tartományok reálisak: a `min`/`max` nem zár ki valós beteget
- [ ] A `critical` sávok a helyi protokollal egyeznek
- [ ] A keresztfeltöltések klinikailag indokoltak
- [ ] Az előtöltési javaslatok `maxAge`-e szakmailag védhető
- [ ] A kalkulátorok eredménye **referencia-esetekkel** egyezik
- [ ] Egyik kalkulátor sem ad számot hiányos bemenetre

## 2. Referencia-esetek

| # | Bemenet | Elvárt eredmény | Kapott | ✔ |
|---:|---|---|---|:--:|
| 1 | | | | |
| 2 | | | | |

> A referencia-eseteket **közleményből vagy hatósági példaszámításból** kell venni,
> nem a rendszer saját kimenetéből. Ez az egyetlen, ami kifogja a fullPIERS-típusú
> hibát: ott a kód pontosan azt számolta, amit a definíció mondott — a definíció volt rossz.

## 3. Nyitott kérdések

| Kérdés | Ki dönti el | Határidő |
|---|---|---|

## 4. Aláírás

| Szerep | Név | Dátum |
|---|---|---|
| Klinikai átvevő | | |
| Fejlesztői felelős | | |
