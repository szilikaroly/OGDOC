# 02 — A webes platform architektúrája

> A **csontváz** (`web/`) ma fut és bizonyít; ez a fejezet arról szól, hogy mi lesz
> belőle. A kettő közti út a `03-web-csontvaz.md`-ben van.

## 1. A rétegek és a köztük lévő szerződés

```
┌─ böngésző ────────────────────────────────────────────────────────┐
│  React 19 + TanStack Start                                        │
│  FormRenderer  ←  FieldSpec[]        NEM ismer mezőnevet          │
└───────────────────────────┬───────────────────────────────────────┘
                            │  JSON, csak a `web/api.ts` alakjai
┌───────────────────────────▼───────────────────────────────────────┐
│  server function / Worker                                         │
│  web/api.ts        write() · caseView() · formSpec() · docFor()    │
│  ─── ez a réteg SZÁLLÍTÁS-FÜGGETLEN, változatlanul átvihető ───    │
└───────────────────────────┬───────────────────────────────────────┘
┌───────────────────────────▼───────────────────────────────────────┐
│  core/            regiszter · levezetés · kalkulátorok            │
│  ─── DOM-mentes, adatbázis-mentes, változatlanul átvihető ───      │
└───────────────────────────┬───────────────────────────────────────┘
┌───────────────────────────▼───────────────────────────────────────┐
│  perzisztencia    Postgres (Supabase) + sorszintű szabályok        │
└───────────────────────────────────────────────────────────────────┘
```

**A portolhatósági szerződés**: a `core/` és a `web/api.ts` semmit nem tud a
szállításról. Ezért a csontváz Node-`http`-je, egy Cloudflare Worker és egy
TanStack server function alatt **ugyanaz a kód fut**. Cserélni a `web/server.ts`-t
kell — 150 sor —, nem az üzleti logikát.

## 2. Stack és miért

| Réteg | Választás | Miért ez |
|---|---|---|
| Futtatás | Node 22+ / Cloudflare Workers | A mag natív TypeScriptet fut, build nélkül. |
| Keret | TanStack Start + React 19 | Az IntuiCare már ezen van (158 route, 407 server function). |
| Adatbázis | Postgres (Supabase) | Már megvan: 230 tábla, sorszintű szabályok. |
| Hitelesítés | Supabase Auth | Már megvan; a hiányzó rész a bérlő-létrehozás (BUG-015). |
| Objektumtár | S3-kompatibilis | DICOM és dokumentumok. |
| PACS | Orthanc | K7 döntés. |

**Nem írunk új platformot.** A K0 döntés szerint az OGDOC a jól működő részeket
átveszi; ez a fejezet az új rétegeket írja le, nem a meglévők pótlását.

## 3. Adatmodell

### 3.1 A központi tábla

A mag `CaseState.values` szerkezete közvetlenül leképződik. Az IntuiCare
`clinical_observations` táblája **lényegében már ez** — három oszlop hiányzik belőle.

```sql
create table values (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  case_id         uuid not null,
  variable_id     text not null,          -- a regiszter azonosítója
  variable_version int  not null,         -- MELYIK definíció szerint rögzült

  value_num       numeric,
  value_text      text,
  value_code      text,
  value_bool      boolean,
  value_ts        timestamptz,
  unit            text,

  t               timestamptz not null,   -- mikor VONATKOZIK rá
  recorded_at     timestamptz not null default now(),
  provenance      text not null,          -- clinician | device | imported | derived | prefilled | patient
  confidence      text,
  source_ref      text,                   -- melyik képlet vagy melyik mező
  overridden      boolean not null default false,

  recorded_by     uuid not null,
  superseded_by   uuid references values(id),   -- javítás: LÁNC, nem felülírás
  constraint one_value check (num_nonnulls(value_num, value_text, value_code, value_bool, value_ts) = 1)
);

create index on values (tenant_id, case_id, variable_id, t desc);
create index on values (tenant_id, case_id) where superseded_by is null;
```

Négy döntés, amit érdemes indokolni:

| Döntés | Miért |
|---|---|
| **Egy sor egy érték** (EAV), nem oszlop per mező | ~4000 mezőnél a széles tábla séma-migrációt jelentene minden új változónál. Így a változó felvétele **adat**, nem migráció. |
| **`variable_version` tárolása** | Ha egy mező jelentése változik, a régi adat a RÉGI definíció szerint értelmezendő. Enélkül a történeti adat csendben átértelmeződik. |
| **`superseded_by` lánc, nem `UPDATE`** | Egészségügyi rekordban a javítás is adat. Ki, mikor, mit javított — ez GDPR- és ISO 20387-követelmény. |
| **`derived` értékek is tárolódnak** | Így visszakereshető, hogy egy klinikai döntés idején a rendszer *mit mutatott* — akkor is, ha a képlet azóta változott. |

### 3.2 Amit NEM tárolunk

- **Levezethető adatot nem duplikálunk.** A kor nem tárolt mező: a születési dátumból
  számolódik. Tárolt korral a rekord egy év múlva hazudik.
- **A `consumers` listát nem tároljuk.** Generált; a gráfból jön.
- **Az űrlap szerkezetét nem tároljuk.** A regiszterből generálódik.

### 3.3 Kísérő táblák

| Tábla | Mire |
|---|---|
| `cases` | eset, bérlő, betegkapcsolat, státusz |
| `variable_defs` | a regiszter élő másolata, verziózva — ezt szerkeszti a 25. modul |
| `calc_defs` | a kalkulátorok metaadata és a `verified` állapot **jóváhagyási nyomvonallal** |
| `audit_log` | ki mit olvasott és írt (`audit: true` mezőkre kötelező) |
| `sync_outbox` | kimenő HL7/FHIR üzenetek, `NoopAdapter` → `RecordingAdapter` → éles |
| `other_review_queue` | az „egyéb" tanulási csatorna (11. fejezet) |

## 4. Hitelesítés és jogosultság

### 4.1 Sorszintű szabályok — a bérlő az alap

Minden lekérdezés `tenant_id`-re szűkül, adatbázis-szinten. Ez nem az alkalmazás
dolga: ha az alkalmazás hibázik, a szabálynak akkor is tartania kell.

```sql
alter table values enable row level security;

create policy tenant_isolation on values
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- PHI-mező olvasása külön jogosultsághoz kötött
create policy phi_read on values for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (
      variable_id not in (select id from variable_defs where phi)
      or has_role('phi_reader')
    )
  );
```

### 4.2 Szerepek és összeférhetetlenség

| Szerep | Mit lát | Mit ír |
|---|---|---|
| `klinikus` | a saját bérlő esetei | klinikai mezők |
| `asszisztens` | ugyanaz, PHI nélkül | korlátozott |
| `kutato` | **pszeudonimizált** adat, PHI nélkül | semmit |
| `kodkulcs_kezelo` | a pszeudonimizálási kulcs | kulcskezelés |
| `biobank_operator` | mintanyilvántartás | minta-események |
| `admin` | konfiguráció | regiszter-piszkozat |
| `jovahagyo` | — | regiszter-élesítés |

**Két összeférhetetlenségi szabály, adatbázis-kényszerként, nem házirendként:**

- `kutato` + `kodkulcs_kezelo` **ugyanazon a felhasználón nem adható ki** — együtt
  a pszeudonimizálás visszafejthető, tehát a védelem megszűnik;
- `admin` + `jovahagyo` szintén nem — aki szerkeszt, nem hagyhatja jóvá magát.

### 4.3 Amit a felület soha nem dönthet el

A `phi` szűrés, a szerep-ellenőrzés és az audit **a szerveren** történik. A felület
elrejtheti a mezőt, de az elrejtés nem védelem: aki a hálózati kérést látja, a
választ is látja.

## 5. API-felület

| Végpont | Metódus | Mit ad | Megjegyzés |
|---|---|---|---|
| `/api/formspec` | GET | `SectionSpec[]` | A regiszterből generált űrlapleírás. |
| `/api/case/:id` | GET | `CaseView` | Értékek, javaslatok, kalkulátor-eredmények. |
| `/api/doc/:varId` | GET | meződokumentáció | A generált feltölti/tölti listákkal. |
| `/api/value` | POST | `WriteResponse` | Írás + újraszámítás + a hatáslista. |
| `/api/calc/:id` | GET | `CalcResult` | Egy kalkulátor önálló futtatása. |
| `/api/export/fhir/:caseId` | GET | FHIR Bundle | `phi` mezők nélkül. |

**Az írás válasza tartalmazza a `affected` listát** — mely mezők számoltak újra. A
felület ezeket villantja fel, hogy a keresztfeltöltés **látható** legyen. Ha a
felhasználó nem látja, mi változott a beírására, nem fog bízni a rendszerben.

**Az elutasítás HTTP 200.** A tartományon kívüli érték nem szerverhiba, hanem
üzenet a felhasználónak: `{ ok: false, error: "anthro.height: 500 > megengedett
maximum (210)" }`. A 4xx/5xx a felületen hibaoldalt jelentene, ami itt rossz.

## 6. Teljesítmény

| Kérdés | Jelen állapot | Mi lesz ~4000 változónál |
|---|---|---|
| `recompute` | minden híváskor újraépíti a gráfot | a gráfot **egyszer** kell építeni indításkor és regiszter-változáskor |
| Újraszámítás köre | mindent újraszámol | csak az `impactOf(írt mező)` halmazt |
| `caseView` | minden kalkulátort lefuttat | csak azokat, amiknek van bemenetük |
| Űrlapleírás | kérésenként generálódik | verzió-kulccsal gyorsítótárazható, mert csak a regiszter változásakor változik |

Egyik sem sürgős 47 változónál — de mind **mérendő**, mielőtt ~4000-hez érünk.
A gráf-újraépítés a legvalószínűbb első szűk keresztmetszet.

## 7. Telepítés

| Környezet | Mire |
|---|---|
| `dev` | fejlesztés, szintetikus adat |
| `staging` | klinikai átvétel, **szintetikus adat** |
| `prod` | valódi adat, teljes audit |

**A staging soha nem kap valódi betegadatot.** Ez nem óvatosság, hanem az egyetlen
mód, hogy a klinikai átvétel szabadon rombolhasson.

Minden telepítés rögzíti: a kód verzióját, a **regiszter verzióját**, és a
**kalkulátorok `verified` állapotát**. Utólag megválaszolhatónak kell lennie, hogy
egy adott döntés idején a rendszer melyik képlettel számolt.
