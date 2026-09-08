---
source: core/import/types.ts
sha256: 8e2b7d8934f1fd6d7e0f717ba01e832ab07a4b93880dc099f1d0433a99306bb0
lines: 119
profile: code
generator: subagent
raw_tokens_est: 1067
verified: 9 confirmed, 1 needs_agent
---

# core/import/types.ts

## Topics
- L1-29: az import réteg alapállítása — a kinyerés állítás, nem adat; DocumentKind
- L30-86: SourceDocument, Span, ProposalStatus, Extractor típusok
- L87-119: a Proposal rekord mezői és a kétféle megbízhatóság szétválasztása

## Claims

- [C1] [NEEDS_AGENT] a réteg állítása szerint a kinyert érték semmilyen precedenciával nem kerül a `CaseState.values`-ba, mert a kérdés nem az, melyik adat nyer, hanem hogy adat-e egyáltalán @semantic L8-21
- [C2] [CONFIRMED] a `DocumentKind` hét rögzített dokumentumfajtát enged meg, köztük `"other"`-t @L27 `  | "prescription" | "labReport" | "imaging" | "discharge" | "referral"`
- [C3] [CONFIRMED] a `SourceDocument` külön tartja a dokumentum keletkezési idejét és az import idejét @L34 `  /** Mikor keletkezett a DOKUMENTUM — nem mikor importáltuk. */`
- [C4] [CONFIRMED] a `SourceDocument.sha256` kötelező mező: enélkül nem bizonyítható, mit olvastunk @L38 `  sha256: string;`
- [C5] [CONFIRMED] az `ocr` jelző azért kötelező, mert az OCR nem bizonytalan, hanem magabiztosan mást olvas (0/O, 1/l, tizedesvessző) @L45 `  ocr: boolean;`
- [C6] [CONFIRMED] a `Span` karakterpozíció-tartomány plusz szó szerinti szövegrészlet, az oldalszám opcionális @L63 `  text: string;`
- [C7] [CONFIRMED] a `rejected` állapotú javaslat megmarad, mert a „megnéztük és nem" is információ @L71 `  /** Ember elutasította. MEGMARAD: az „megnéztük és nem" is információ. */`
- [C8] [CONFIRMED] a `machineConfidence` 0-1 közötti, rendezésre való és kifejezetten nem kapu @L105 `  machineConfidence?: number | null;`
- [C9] [CONFIRMED] a `confidence` a datum klinikai jellegét jelöli, és a dokumentum tulajdonsága, nem a kinyerésé @L111 `  confidence?: Confidence;`
- [C10] [CONFIRMED] a `correctedValue` az embernek megerősítéskor beírt eltérő értékét tartja @L118 `  correctedValue?: unknown;`
