# 06 — A webes migrációs terv és miért vált tárgytalanná

> **Ez a fejezet történeti.** 2026-09-01-ig az OGDOC egyfájlos artifactként indult volna, és ez
> a fejezet írta le, hogyan kerül majd webre az IPRACS Lovable-implementációs specifikációja
> alapján. Az IntuiCare platform megjelenésével a migráció tárgytalan: **a rendszer eleve a
> platformon épül** (ld. [`07-intuicare-alap.md`](07-intuicare-alap.md)).
>
> A fejezetet nem töröltük, mert két megállapítása érvényben maradt, és mert dokumentálja,
> miért nem a Lovable-specifikáció sémáját használjuk.

## 1. Mi volt a terv

Az IPRACS Lovable-specifikációja (1374 sor) egy React 18 + TypeScript + Tailwind + Zustand +
Supabase alkalmazást ír le, kész `PatientFixData` interfésszel, négytáblás Supabase-sémával
(`sessions`, `labour_entries`, `lab_snapshots`, `scoring_history`), Zustand-store-ral, PWA-val
és hét Lovable-prompttal a felépítéshez.

## 2. Miért nem ezt használjuk

### 2.1 A séma túl szűk

A specifikáció négy táblája a szülőszobára készült. Az OGDOC 19 modulja, ~2200 változója és a
CRM-oldal (dolgozók, beosztás, műtő, időpont, kérdőív) ebbe nem fér bele. Az IntuiCare **230
táblája** viszont már tartalmazza mindkettőt.

### 2.2 A `PatientFixData` nem skálázódik

```typescript
export interface PatientFixData {
  height: number; prePregWeight: number; bmi: number; ga: number;
  htn: boolean; preeclampsia: boolean; asthma: boolean; /* … ~40 mező */
}
```

Ez a szülőszobára működik. **2200 változóra nem.** Egy kézzel karbantartott interfész ekkora
méretben ugyanoda vezet, ahonnan indultunk: duplikátumok, elcsúszott jelentések, semmilyen
gépi ellenőrzés.

**Ez a megállapítás érvényben maradt**, és az OGDOC-ban így oldjuk meg:

```
registry/*.json  ──build──▶  src/lib/ogdoc/types.generated.ts
                             ├─ type VariableId = 'vitals.bp.systolic' | 'anthro.bmi' | …
                             ├─ interface CaseValues { [K in VariableId]?: Value }
                             └─ const REGISTRY: Record<VariableId, VariableDef>
```

A TypeScript ugyanazt a garanciát adja, mint a kézzel írt interfész — de a forrás egy hely
marad, és a fordító hibát dob, ha egy score nem létező változóra hivatkozik.

### 2.3 Az RLS-policy egyfelhasználós volt

A specifikáció szabálya:

```sql
CREATE POLICY "users_own_sessions" ON sessions FOR ALL USING (created_by = auth.uid());
```

Ez azt jelentette volna, hogy **csak az látja az esetet, aki rögzítette**. Egy szülőszobán, ahol
műszakváltás van, ez használhatatlan: a következő műszak nem látná a partogramot.

**Ez a probléma megoldódott** — nem nekünk kellett megoldani. Az IntuiCare tenant- és
szerepkör-alapú RLS-t használ (`current_tenant_id()`, `has_role()`, `can_access_patient()`),
ami pontosan azt adja, amit ez a fejezet hiányolt.

## 3. Ami a specifikációból mégis átkerül

| Elem | Hová |
|---|---|
| A klinikai algoritmusok pontos képletei (fullPIERS, NICHD, MEOWS, Bishop, VBAC, CMQCC, CORI) | `src/lib/ogdoc/scores/`, golden-tesztekkel |
| A hard-stop kontraindikáció-minta | `modulok/06-gyogyszereles.md` |
| A négyszintű oktatási réteg | `ctx.eduLevel` |
| „A klinikai algoritmusokat nem szabad az AI-ra bízni" (17. fejezet) | ld. lentebb |

## 4. A megmaradt szabály

A specifikáció 17. fejezete jó ösztönnel jelzi, hogy a klinikai algoritmusokat nem szabad
generátorra bízni. Ezt élesítjük, és a platformon is érvényes:

> **A generátor a `routes/` és `components/` réteget írhatja. A `src/lib/ogdoc/`-ot nem.**
> A klinikai logika a golden-tesztekkel együtt kerül be, és ha egy generált komponens
> újraimplementál egy score-t, az hiba, nem gyorsítás — a teszt el is bukik rajta, mert a
> fixture-ök a `core`-t hívják.
