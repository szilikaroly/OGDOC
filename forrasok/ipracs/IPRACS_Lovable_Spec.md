# IPRACS — Lovable.dev Implementációs Specifikáció

## Rendszer azonosítása

**Teljes név:** Integrated Perinatal Risk Assessment and Computational Decision Support  
**Célplatform:** Lovable.dev → React 18 + TypeScript + Tailwind CSS + Shadcn/UI + Supabase  
**Felhasználói kör:** Szülészeti orvosok és szülésznők szülőszobai tableten/számítógépen  
**Offline működés:** PWA (Progressive Web App) + Supabase offline-first sync  
**Bilingualitás:** Magyar elsődleges, angol másodlagos  

---

## 1. Master Prompt (Lovable-be első promptként)

```
Build a bilingual (Hungarian/English) obstetric clinical decision support web app called IPRACS.
Tech stack: React 18, TypeScript, Tailwind CSS, Shadcn/UI, Supabase (database + auth), 
PWA with offline capability. 

The app runs on tablet in a delivery room. It has 13 main tabs. 
Design language: clean medical UI, white cards with colored top borders 
(4px solid) coding the clinical domain, blue (#0F47AF) primary color.

Core architecture principle: Single Source of Truth (SSOT).
Every clinical value is entered ONCE in its primary field. 
All scoring calculators READ from that single source via sync functions.
No value is ever entered twice.

The main data structures are:
1. PatientFixData — entered once (demographics, obstetric history, comorbidities)
2. LabourSeriesEntry[] — repeated exam entries stored in array (vitals, FHR, cervix, etc.)
3. LabSnapshot — point-in-time lab values stored in Supabase

Create the shell with all 13 tabs, the global state management 
(Zustand store), TypeScript interfaces, Supabase schema, and routing.
Then I will add modules one by one.
```

---

## 2. Technológiai Stack Pontosítása

### 2.1 Frontend
```
React 18.3+ with TypeScript strict mode
Tailwind CSS 3.4 (utility-first)
Shadcn/UI components (Card, Button, Input, Select, Checkbox, Badge, 
  Dialog, Tabs, ScrollArea, Separator, Progress, Alert)
Recharts (Canvas partogram, line charts for vitals trend)
Zustand 4.x (global state management — replaces labourData[] global)
React Hook Form + Zod (validated forms)
date-fns (time calculations)
```

### 2.2 Backend (Supabase)
```
Supabase PostgreSQL — 4 tables (see Section 4)
Supabase Realtime — multi-device sync (tablet + wall display)
Supabase Auth — nurse/doctor login with role-based access
Supabase Storage — exported JSON session backups
Row-Level Security (RLS) on all tables
```

### 2.3 PWA
```
Vite PWA plugin (vite-plugin-pwa)
Workbox offline caching strategy: NetworkFirst for API, CacheFirst for assets
Service worker caches the full app shell + all scoring algorithms
IndexedDB (via Dexie.js) for offline lab/exam queue, synced when online
```

---

## 3. TypeScript Interfaces (Teljes Adatmodell)

```typescript
// ─── CORE DATA MODEL ───────────────────────────────────────────────────────

export interface PatientFixData {
  // Demographics
  patientName: string;
  patientDob: string;          // ISO date
  patientId: string;
  admissionTime: string;       // ISO datetime
  
  // Obstetric measurements
  height: number;              // cm
  prePregWeight: number;       // kg
  currentWeight: number;       // kg
  bmi: number;                 // auto-calculated: weight/(height/100)²
  ga: number;                  // gestational age weeks.days (e.g. 38.4)
  gravida: number;
  para: number;
  ethnicity: 'white' | 'black' | 'hispanic' | 'asian' | 'other';
  
  // Obstetric history
  prevMode: 'nulliparous' | 'vaginal' | 'cesarean' | 'both';
  prevComplications: string;
  age: number;                 // years (for VTE, VBAC)
  
  // VBAC flags (FIX source for Grobman calculator)
  vbacPrevVaginal: boolean;
  vbacPrevVBAC: boolean;
  vbacRecurringIndication: boolean;

  // Comorbidities (drive contraindication gates + risk modules)
  htn: boolean;
  preeclampsia: boolean;
  dm: boolean;                 // type 1/2
  gdm: boolean;                // gestational DM
  asthma: boolean;             // blocks carboprost
  cardiac: boolean;
  thrombophilia: boolean;
  aps: boolean;                // antiphospholipid syndrome
  prevVTE: boolean;
  hypothyroid: boolean;
  hyperthyroid: boolean;
  bipolar: boolean;
  prevPPP: boolean;            // prev postpartum psychosis
  prevPPD: boolean;
  
  // CMQCC PPH risk (FIX source)
  placentaPrevia: boolean;
  placentaAccreta: boolean;
  multipleGestation: boolean;
  macrosomia: boolean;
  
  // Allergy
  pcnAllergy: 'none' | 'mild' | 'anaphylaxis';
  otherAllergies: string;
}

export interface LabourSeriesEntry {
  id: string;                  // uuid
  sessionId: string;
  timestamp: string;           // ISO datetime
  hourFromAdmission: number;   // calculated
  
  // Vitals (MEOWS/MEWC/Shock Index inputs)
  systolic: number;
  diastolic: number;
  pulse: number;
  temp: number;                // °C
  spo2: number;                // % (→ fullPIERS pe-spo2)
  rr: number;                  // /min
  
  // Labour progression (Partogram + Bishop)
  cervix: number;              // cm 0-10
  effacement: number;          // % 0-100 (for Bishop)
  descent: number;             // 0-5 (partogram)
  station: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  contractions: number;        // /10 min
  contractionDuration: number; // seconds
  amniotic: 'intact' | 'clear' | 'meconium+' | 'meconium++' | 'meconium+++' | 'blood';
  position: 'anterior' | 'posterior' | 'transverse';
  caput: 0 | 1 | 2 | 3;
  moulding: 0 | 1 | 2 | 3;
  
  // Bishop components (→ syncBishopToRisk)
  bishopDilation: number;      // sub-score 0-3
  bishopEffacement: number;    // sub-score 0-3
  bishopStation: 0 | 1 | 2 | 3;
  bishopConsistency: 0 | 1 | 2;
  bishopPosition: 0 | 1 | 2;
  
  // Fetal (→ NICHD sync)
  fhr: number;                 // bpm (→ fhr-bl)
  fhrDecel: 'none' | 'early' | 'late' | 'variable'; // (→ fhr-dec)
  
  // Fluid / bleeding
  urine: number;               // mL
  qbl: number;                 // cumulative quantified blood loss mL (→ CMQCC)
  
  // Dyspnea / chest pain (→ fullPIERS pe-cp)
  dyspneaChestPain: boolean;
  
  // Pain
  painVAS: number;             // 0-10
  painRelief: string;
  
  // Clinical notes
  notes: string;
}

export interface LabSnapshot {
  id: string;
  sessionId: string;
  timestamp: string;
  
  // CBC
  hb: number;                  // g/dL (→ transfusion decision)
  hct: number;                 // %
  plt: number;                 // ×10⁹/L (→ fullPIERS, HELLP, DIC)
  wbc: number;                 // ×10⁹/L
  
  // Coagulation
  inr: number;                 // (→ transfusion tf-inr)
  pt: number;                  // seconds
  aptt: number;                // seconds
  fib: number;                 // mg/dL (→ MTP trigger <200 in pregnancy)
  ddimer: number;              // mg/L
  
  // Metabolic
  sodium: number;              // mmol/L
  potassium: number;           // mmol/L
  cr: number;                  // μmol/L (→ fullPIERS pe-cr)
  urea: number;                // mmol/L
  glucose: number;             // mmol/L (→ insulin auto-fill)
  magnesium: number;           // mmol/L
  calcium: number;             // mmol/L
  albumin: number;             // g/L
  lactate: number;             // mmol/L (→ sepsis qSOFA)
  
  // Liver
  ast: number;                 // U/L (→ fullPIERS pe-ast, HELLP)
  alt: number;                 // U/L
  alp: number;                 // U/L
  ldh: number;                 // U/L (→ HELLP)
  bilirubin: number;           // μmol/L
  
  // Thyroid
  tsh: number;                 // mIU/L (→ thyroid storm calc)
  ft4: number;                 // pmol/L
  ft3: number;                 // pmol/L
  trak: number;                // IU/L (→ Graves/fetal hyperthyroid warning)
  antiTPO: number;             // IU/mL
  
  // Preeclampsia markers
  sflt1: number;               // pg/mL (→ sFlt-1/PlGF ratio)
  plgf: number;                // pg/mL
  
  // Inflammation
  crp: number;                 // mg/L
  pct: number;                 // ng/mL
  
  // Urinalysis
  proteinDipstick: '0' | '+' | '++' | '+++' | '++++';
  protein24h: number;          // mg/24h
  
  clinicianNotes: string;
}

export interface ScoringResults {
  cori: number;                // 0-5 Composite Obstetric Risk Index
  fullPIERS: number | null;    // 0-1 probability
  sfltPlgfRatio: number | null;
  meowsScore: number;
  mewcActive: string[];
  shockIndex: number;
  nichd: 'I' | 'II' | 'III' | null;
  cmqccRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  cmqccStage: 0 | 1 | 2 | 3;
  omqSOFA: number;             // 0-3
  bishopTotal: number;         // 0-13
  vbacPercent: number | null;  // 0-100
  timestamp: string;
}
```

---

## 4. Supabase Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions (one per patient admission)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  patient_name TEXT,
  patient_dob DATE,
  patient_id TEXT,
  admission_time TIMESTAMPTZ,
  fix_data JSONB NOT NULL DEFAULT '{}',   -- PatientFixData
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active'             -- active | completed | archived
);

-- Labour series (partogram entries)
CREATE TABLE labour_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL,                     -- LabourSeriesEntry
  hour_from_admission FLOAT,
  entered_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_labour_session ON labour_entries(session_id, created_at);

-- Lab snapshots
CREATE TABLE lab_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL,                     -- LabSnapshot
  entered_by UUID REFERENCES auth.users(id)
);

-- Scoring history (auto-saved on each recalculation)
CREATE TABLE scoring_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scores JSONB NOT NULL,                   -- ScoringResults
  triggered_by TEXT                        -- 'auto' | 'manual' | 'tab_open'
);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_history ENABLE ROW LEVEL SECURITY;

-- Policy: users see only their sessions
CREATE POLICY "users_own_sessions" ON sessions
  FOR ALL USING (created_by = auth.uid());
CREATE POLICY "users_own_labour" ON labour_entries
  FOR ALL USING (session_id IN (
    SELECT id FROM sessions WHERE created_by = auth.uid()
  ));
CREATE POLICY "users_own_labs" ON lab_snapshots
  FOR ALL USING (session_id IN (
    SELECT id FROM sessions WHERE created_by = auth.uid()
  ));
```

---

## 5. Zustand Global Store

```typescript
// store/useIPRACSStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface IPRACSStore {
  // Session
  sessionId: string | null;
  admissionTime: Date | null;
  
  // Primary data sources (SSOT)
  fixData: Partial<PatientFixData>;
  labourSeries: LabourSeriesEntry[];
  latestLab: Partial<LabSnapshot> | null;
  
  // Derived / cached scoring
  lastScores: Partial<ScoringResults> | null;
  
  // UI state
  eduLevel: 'student' | 'resident' | 'specialist' | 'professor';
  
  // Actions
  setFixData: (data: Partial<PatientFixData>) => void;
  addLabourEntry: (entry: LabourSeriesEntry) => void;
  setLatestLab: (lab: Partial<LabSnapshot>) => void;
  setScores: (scores: Partial<ScoringResults>) => void;
  setEduLevel: (level: IPRACSStore['eduLevel']) => void;
  
  // Computed (derived from latestLab, labourSeries, fixData)
  getLatestVital: () => LabourSeriesEntry | undefined;
  getFixedGA: () => number | undefined;
}

export const useIPRACSStore = create<IPRACSStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      admissionTime: null,
      fixData: {},
      labourSeries: [],
      latestLab: null,
      lastScores: null,
      eduLevel: 'specialist',
      
      setFixData: (data) => set((s) => ({ 
        fixData: { ...s.fixData, ...data } 
      })),
      addLabourEntry: (entry) => set((s) => ({ 
        labourSeries: [...s.labourSeries, entry] 
      })),
      setLatestLab: (lab) => set({ latestLab: lab }),
      setScores: (scores) => set((s) => ({ 
        lastScores: { ...s.lastScores, ...scores } 
      })),
      setEduLevel: (level) => set({ eduLevel: level }),
      getLatestVital: () => {
        const s = get().labourSeries;
        return s.length > 0 ? s[s.length - 1] : undefined;
      },
      getFixedGA: () => get().fixData.ga,
    }),
    {
      name: 'ipracs-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## 6. Component Architektúra

```
src/
├── app/
│   ├── layout.tsx              # Root layout: header, tab navigation
│   └── page.tsx                # Main app shell
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx       # Patient name, GA, clock, admission time
│   │   ├── TabNavigation.tsx   # 13 main tabs + active state
│   │   └── EduLevelSelector.tsx # Student/Resident/Specialist/Professor toggle
│   │
│   ├── tabs/
│   │   ├── MonitoringTab/      # 4 sub-tabs: FIX, Vizsgálat, Labor, Supportive
│   │   │   ├── FixDataForm.tsx
│   │   │   ├── ExamForm.tsx    # includes Bishop Score section
│   │   │   ├── LabForm.tsx
│   │   │   └── SupportiveForm.tsx
│   │   ├── PartographTab/
│   │   │   ├── PartographCanvas.tsx   # recharts LineChart cervix/FHR/pain
│   │   │   └── BloodLossMarker.tsx
│   │   ├── WHOTab/
│   │   │   └── WHOGrid.tsx
│   │   ├── RiskTab/
│   │   │   ├── CORICard.tsx
│   │   │   ├── FullPIERSCard.tsx
│   │   │   ├── SFltPlGFCard.tsx
│   │   │   ├── MEOWSCard.tsx
│   │   │   ├── NICHDCard.tsx
│   │   │   ├── CMQCCCard.tsx
│   │   │   ├── OmqSOFACard.tsx
│   │   │   ├── BishopCard.tsx
│   │   │   └── VBACCard.tsx
│   │   ├── NeonatalTab/
│   │   │   ├── NRPCard.tsx
│   │   │   ├── HypoglycemiaCard.tsx
│   │   │   ├── LATCHCard.tsx
│   │   │   └── NOWSBridge.tsx
│   │   ├── MentalTab/
│   │   │   ├── EPDSCard.tsx
│   │   │   └── PPPRiskCard.tsx
│   │   ├── EmergencyTab/
│   │   │   ├── InsulinCard.tsx
│   │   │   ├── HemostasisCard.tsx
│   │   │   ├── TransfusionCard.tsx
│   │   │   ├── ThyroidCard.tsx
│   │   │   ├── VTECard.tsx
│   │   │   └── DeliriumCard.tsx
│   │   ├── AntibioticsTab/
│   │   │   ├── AntibioticSelector.tsx
│   │   │   └── FMTCard.tsx
│   │   ├── WithdrawalTab/
│   │   │   ├── COWSCard.tsx
│   │   │   ├── CIWACard.tsx
│   │   │   ├── BZDCard.tsx
│   │   │   ├── StimulantCard.tsx
│   │   │   ├── CannabisCard.tsx
│   │   │   └── NOWSCard.tsx
│   │   ├── AIReportTab/
│   │   │   └── ReportGenerator.tsx
│   │   ├── DecisionsTab/
│   │   │   └── DecisionNotes.tsx
│   │   ├── OutcomeTab/
│   │   │   └── DeliveryOutcome.tsx
│   │   └── LegendTab/
│   │       └── Legend.tsx
│   │
│   ├── shared/
│   │   ├── ClinicalCard.tsx    # Card wrapper with colored top border + edu levels
│   │   ├── AIExplainer.tsx     # Colored explanation box (success/info/warning/critical)
│   │   ├── EduContent.tsx      # Shows/hides based on edu level
│   │   ├── SyncIndicator.tsx   # Shows which field was auto-populated (SSOT indicator)
│   │   └── HardStop.tsx        # Red modal for contraindications
│   │
│   └── ui/                     # Shadcn/UI components (auto-generated)
│
├── lib/
│   ├── algorithms/             # All clinical scoring functions (pure TypeScript)
│   │   ├── fullPIERS.ts
│   │   ├── meows.ts
│   │   ├── nichd.ts
│   │   ├── cmqcc.ts
│   │   ├── bishop.ts
│   │   ├── vbac.ts
│   │   ├── cori.ts
│   │   ├── cows.ts
│   │   ├── ciwa.ts
│   │   ├── nows.ts
│   │   ├── fourAT.ts
│   │   └── antibiotic.ts
│   │
│   ├── sync/                   # SSOT sync bridges
│   │   └── syncAllRiskInputs.ts
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   └── hooks/
│   │       ├── useSession.ts
│   │       ├── useLabourEntries.ts
│   │       └── useLabSnapshots.ts
│   │
│   └── constants/
│       ├── lactation.ts        # Hale LRC database
│       └── antibiotics.ts      # ABX_DB object
│
└── store/
    └── useIPRACSStore.ts
```

---

## 7. Klinikai Algoritmusok — Pontos Implementáció

### 7.1 fullPIERS (von Dadelszen, Lancet 2011)

```typescript
// lib/algorithms/fullPIERS.ts
export interface FullPIERSInput {
  ga: number;        // gestational weeks
  chestPain: 0 | 1; // dyspnea or chest pain present
  spo2: number;      // SpO2 %
  plt: number;       // ×10⁹/L
  creatinine: number;// μmol/L
  ast: number;       // U/L
}

export function calcFullPIERS(input: FullPIERSInput): {
  probability: number;
  percent: string;
  category: 'low' | 'moderate' | 'high';
  valid: boolean;
} {
  const { ga, chestPain, spo2, plt, creatinine, ast } = input;
  
  if ([ga, spo2, plt, creatinine, ast].some(v => isNaN(v) || v <= 0)) {
    return { probability: 0, percent: '—', category: 'low', valid: false };
  }
  
  const logit = 
    -2.68
    + (-0.154 * ga)
    + (1.23 * chestPain)
    + (-0.0271 * spo2)
    + (0.207 * Math.log(plt))
    + (0.00004 * plt * plt)
    + (0.0101 * creatinine)
    + (0.00000262 * creatinine * creatinine)
    + (0.025 * Math.log(ast))
    + (-0.000592 * ast * ast);
    
  const probability = 1 / (1 + Math.exp(-logit));
  const category = probability < 0.05 ? 'low' : probability < 0.15 ? 'moderate' : 'high';
  
  return {
    probability,
    percent: (probability * 100).toFixed(1) + '%',
    category,
    valid: true
  };
}
```

### 7.2 NICHD FHR Kategorizáció (Macones 2008)

```typescript
// lib/algorithms/nichd.ts
export interface NICHDInput {
  baseline: number;                               // FHR bpm (from partograph)
  variability: 'absent' | 'minimal' | 'moderate' | 'marked';
  accelerations: 'present' | 'absent';
  decelerations: 'none' | 'early' | 'variable' | 'late' | 'prolonged';
  sinusoidal: boolean;
}

export type NICHDCategory = 'I' | 'II' | 'III';

export function calcNICHD(input: NICHDInput): {
  category: NICHDCategory;
  rationale: string;
  management: { hu: string; en: string };
} {
  const { baseline, variability, accelerations, decelerations, sinusoidal } = input;
  
  // Category III — immediate action
  if (
    sinusoidal ||
    (variability === 'absent' && decelerations === 'late') ||
    (variability === 'absent' && decelerations === 'variable') ||
    (variability === 'absent' && baseline < 110) // bradycardia with absent variability
  ) {
    return {
      category: 'III',
      rationale: 'Absent variability + recurrent late/variable decelerations OR sinusoidal pattern',
      management: {
        hu: '🚨 Azonnali beavatkozás! Anyai pozíció változtatás, O₂, IV folyadék, CS mérlegelése',
        en: '🚨 Intrauterine resuscitation + expedite delivery. Call attending.'
      }
    };
  }
  
  // Category I — normal
  if (
    baseline >= 110 && baseline <= 160 &&
    variability === 'moderate' &&
    decelerations === 'none' || decelerations === 'early' &&
    !sinusoidal
  ) {
    return {
      category: 'I',
      rationale: 'Normal baseline, moderate variability, no significant decelerations',
      management: {
        hu: '✅ Folyamatos monitorozás. Beavatkozás nem szükséges.',
        en: '✅ Routine monitoring. No intervention required.'
      }
    };
  }
  
  // Category II — indeterminate (everything else)
  return {
    category: 'II',
    rationale: 'Indeterminate features require enhanced surveillance',
    management: {
      hu: '⚠️ Fokozott monitorozás. Korrektív intézkedések. 30 perces újraértékelés.',
      en: '⚠️ Enhanced monitoring. Correct reversible causes. Reassess in 30 min.'
    }
  };
}
```

### 7.3 MEOWS / MEWC / Shock Index

```typescript
// lib/algorithms/meows.ts
export interface VitalSnapshot {
  systolic: number;
  diastolic: number;
  pulse: number;
  temp: number;
  spo2: number;
  rr: number;
  urine?: number; // mL/hr if available
}

export function calcMEOWS(v: VitalSnapshot): {
  score: number;
  level: 0 | 1 | 2 | 3;
  triggers: string[];
} {
  let score = 0;
  const triggers: string[] = [];
  
  // Systolic BP
  if (v.systolic < 80 || v.systolic > 160) { score += 3; triggers.push(`SBP ${v.systolic} mmHg`); }
  else if (v.systolic < 90 || v.systolic > 150) { score += 2; }
  else if (v.systolic > 140) { score += 1; }
  
  // Pulse
  if (v.pulse < 40 || v.pulse > 130) { score += 3; triggers.push(`HR ${v.pulse} bpm`); }
  else if (v.pulse < 50 || v.pulse > 110) { score += 2; }
  else if (v.pulse > 100) { score += 1; }
  
  // Temperature
  if (v.temp < 35 || v.temp >= 38.5) { score += 2; triggers.push(`Temp ${v.temp}°C`); }
  else if (v.temp >= 37.5) { score += 1; }
  
  // RR
  if (v.rr < 10 || v.rr > 30) { score += 3; triggers.push(`RR ${v.rr}/min`); }
  else if (v.rr < 12 || v.rr > 25) { score += 2; }
  
  // SpO2
  if (v.spo2 < 90) { score += 3; triggers.push(`SpO₂ ${v.spo2}%`); }
  else if (v.spo2 < 95) { score += 2; }
  
  const level = score === 0 ? 0 : score <= 2 ? 1 : score <= 4 ? 2 : 3;
  return { score, level, triggers };
}

export function calcShockIndex(v: VitalSnapshot): {
  si: number;
  level: 'normal' | 'elevated' | 'urgent' | 'critical';
  interpretation: { hu: string; en: string };
} {
  const si = v.pulse / v.systolic;
  const level = si < 0.9 ? 'normal' : si < 1.4 ? 'elevated' : si < 1.7 ? 'urgent' : 'critical';
  
  const messages = {
    normal:   { hu: 'Normál (<0.9)', en: 'Normal (<0.9)' },
    elevated: { hu: '⚠️ Emelkedett 0.9-1.4 — fokozott monitorozás', en: '⚠️ Elevated — enhanced monitoring' },
    urgent:   { hu: '🚨 Sürgős 1.4-1.7 — azonnali orvosi értékelés', en: '🚨 Urgent — immediate escalation' },
    critical: { hu: '🚨 KRITIKUS ≥1.7 — PPH/sokk protokoll!', en: '🚨 CRITICAL — activate PPH/shock protocol!' },
  };
  
  return { si: parseFloat(si.toFixed(2)), level, interpretation: messages[level] };
}
```

### 7.4 Bishop Score

```typescript
// lib/algorithms/bishop.ts
export interface BishopInput {
  dilation: number;    // cm 0-10 (from exam form)
  effacement: number;  // % 0-100
  station: 0 | 1 | 2 | 3;  // pre-scored in select
  consistency: 0 | 1 | 2;
  position: 0 | 1 | 2;
}

export function calcBishop(input: BishopInput): {
  total: number;
  dilScore: number;
  effScore: number;
  interpretation: { hu: string; en: string };
  color: 'green' | 'orange' | 'red';
} {
  // Dilation sub-score: 0→0pt, 1-2→1pt, 3-4→2pt, 5+→3pt
  const dilScore = input.dilation === 0 ? 0 :
    input.dilation <= 2 ? 1 : input.dilation <= 4 ? 2 : 3;
    
  // Effacement sub-score: ≤30→0pt, 31-50→1pt, 51-80→2pt, >80→3pt
  const effScore = input.effacement <= 30 ? 0 :
    input.effacement <= 50 ? 1 : input.effacement <= 80 ? 2 : 3;
  
  const total = dilScore + effScore + input.station + input.consistency + input.position;
  
  const color = total >= 8 ? 'green' : total >= 6 ? 'orange' : 'red';
  const interpretation = {
    hu: total >= 8 
      ? '✅ Kedvező cervix — spontán vajúdás valószínű' 
      : total >= 6 
        ? '⚠️ Közepesen érett — indukció előtt cervix érlelés mérlegelése'
        : '❌ Kedvezőtlen cervix — cervix érlelés javasolt (PGE2 vagy Foley)',
    en: total >= 8 
      ? '✅ Favorable cervix — induction likely to succeed'
      : total >= 6
        ? '⚠️ Moderate — consider cervical ripening before induction'
        : '❌ Unfavorable — cervical ripening recommended'
  };
  
  return { total, dilScore, effScore, interpretation, color };
}
```

### 7.5 VBAC (Grobman 2021 — race-neutral)

```typescript
// lib/algorithms/vbac.ts
export interface VBACInput {
  prevVaginal: boolean;     // previous vaginal delivery (any)
  prevVBAC: boolean;        // previous successful VBAC
  recurringIndication: boolean; // same indication as prior CS
  bmi: number;              // pre-pregnancy
  age: number;              // years
  admissionDilation: number; // cm at admission (optional, defaults to 0)
}

export function calcVBAC(input: VBACInput): {
  probability: number;
  percent: string;
  recommendation: { hu: string; en: string };
} {
  // Grobman 2021 race-neutral calculator coefficients
  // Based on MFMU Network (N=11,774)
  let logit = 0.85;
  
  if (input.prevVaginal)          logit += 1.01;
  if (input.prevVBAC)             logit += 1.57;
  if (input.recurringIndication)  logit -= 1.39;
  if (input.bmi >= 40)            logit -= 0.97;
  else if (input.bmi >= 30)       logit -= 0.44;
  if (input.age >= 35)            logit -= 0.29;
  if (input.admissionDilation >= 4) logit += 0.43;
  
  const probability = 1 / (1 + Math.exp(-logit));
  const pct = Math.round(probability * 100);
  
  return {
    probability,
    percent: pct + '%',
    recommendation: {
      hu: pct >= 70 
        ? `✅ ${pct}% VBAC siker — TOL erősen javasolt`
        : pct >= 50 
          ? `⚠️ ${pct}% VBAC siker — mérlegelendő, informed consent`
          : `❌ ${pct}% VBAC siker — elektív ismételt CS mérlegelése`,
      en: pct >= 70 
        ? `✅ ${pct}% VBAC success — TOL strongly recommended`
        : pct >= 50
          ? `⚠️ ${pct}% — shared decision-making required`
          : `❌ ${pct}% — consider repeat elective cesarean`
    }
  };
}
```

### 7.6 CMQCC PPH Risk v3.0

```typescript
// lib/algorithms/cmqcc.ts
export interface CMQCCInput {
  // High risk (any = HIGH)
  placentaPrevia: boolean;
  placentaAccreta: boolean;
  activeBleeding: boolean;
  
  // Medium risk (≥2 = HIGH, 1 = MEDIUM)
  prevPPH: boolean;
  multipleGestation: boolean;
  gdm: boolean;
  macrosomia: boolean;
  polyhydramnios: boolean;
  prevCS: boolean;
  fibroids: boolean;
  bmi40: boolean;             // BMI ≥ 40 (auto-calculated from fixData)
  
  // Dynamic
  qbl: number;                // cumulative QBL mL (from partograph)
  magnesium: boolean;         // active MgSO4
}

export function calcCMQCC(input: CMQCCInput): {
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  stage: 0 | 1 | 2 | 3;
  actions: { hu: string; en: string }[];
} {
  const isHigh = input.placentaPrevia || input.placentaAccreta || input.activeBleeding;
  const medCount = [
    input.prevPPH, input.multipleGestation, input.gdm,
    input.macrosomia, input.polyhydramnios, input.prevCS,
    input.fibroids, input.bmi40, input.magnesium
  ].filter(Boolean).length;
  
  const risk: 'LOW' | 'MEDIUM' | 'HIGH' = isHigh ? 'HIGH' : 
    medCount >= 2 ? 'HIGH' : medCount >= 1 ? 'MEDIUM' : 'LOW';
  
  // QBL-based stage (WHO 2025: threshold 300mL + abnormal vitals)
  const stage: 0 | 1 | 2 | 3 = 
    input.qbl >= 1500 ? 3 :
    input.qbl >= 1000 ? 2 :
    input.qbl >= 300  ? 1 : 0;
  
  return { risk, stage, actions: getCMQCCActions(stage, risk) };
}

function getCMQCCActions(stage: number, risk: string) {
  // Returns stage-specific MOTIVE bundle actions
  const stageActions = {
    0: [{ hu: 'Profilaktikus: oxitocin 10 IU IM szülés után', en: 'Prophylactic: oxytocin 10 IU IM after delivery' }],
    1: [
      { hu: 'Uterusmasszázs + oxitocin 20 IU/500 mL IV', en: 'Uterine massage + oxytocin 20 IU/500 mL IV' },
      { hu: 'TXA 1g IV <3h az onset-től', en: 'TXA 1g IV within 3h of onset' },
      { hu: 'Vércsoportmeghatározás + 2 IV kanül', en: 'Type & crossmatch + 2 large-bore IV lines' },
    ],
    2: [
      { hu: '🚨 MTP aktiválása: PRBC:FFP:PLT = 1:1:1', en: '🚨 Activate MTP: PRBC:FFP:PLT = 1:1:1' },
      { hu: 'TXA 2. dózis 30 perc múlva ha folytatódik', en: 'TXA 2nd dose 30 min if bleeding continues' },
      { hu: 'Carboprost 250 μg IM (TILOS asztmában)', en: 'Carboprost 250 μg IM (CONTRAINDICATED in asthma)' },
    ],
    3: [
      { hu: '🚨 Sebészeti/intervenciós radiológiai konzultáció AZONNALI', en: '🚨 Immediate surgical / IR consultation' },
      { hu: 'Ballon tamponád, uterine devascularization', en: 'Intrauterine balloon + uterine devascularization' },
    ],
  };
  return stageActions[stage as keyof typeof stageActions] || [];
}
```

### 7.7 CORI (Composite Obstetric Risk Index)

```typescript
// lib/algorithms/cori.ts
export interface CORIInputs {
  meowsLevel: 0 | 1 | 2 | 3;
  mewcCount: number;
  fullPIERSProb: number | null;
  sfltPlgfRatio: number | null;
  cmqccRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  shockIndexLevel: 'normal' | 'elevated' | 'urgent' | 'critical';
  omqSOFA: number;
  nichdCategory: 'I' | 'II' | 'III' | null;
  partogramStatus: 'normal' | 'alert' | 'action';
}

export function calcCORI(inputs: CORIInputs): {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  domains: Record<string, number>;
  criticalDomain: string | null;
} {
  const riskToNum = { LOW: 1, MEDIUM: 2, HIGH: 4 };
  const shockToNum = { normal: 0, elevated: 1, urgent: 3, critical: 5 };
  
  const domains = {
    maternal: Math.max(inputs.meowsLevel, inputs.mewcCount >= 2 ? 3 : 0),
    pe: Math.max(
      inputs.fullPIERSProb != null 
        ? (inputs.fullPIERSProb < 0.05 ? 0 : inputs.fullPIERSProb < 0.15 ? 2 : 4)
        : 0,
      inputs.sfltPlgfRatio != null
        ? (inputs.sfltPlgfRatio < 38 ? 0 : inputs.sfltPlgfRatio < 85 ? 2 : 4)
        : 0
    ),
    hemorrhage: Math.max(riskToNum[inputs.cmqccRisk], shockToNum[inputs.shockIndexLevel]),
    infection: inputs.omqSOFA >= 2 ? 4 : inputs.omqSOFA >= 1 ? 2 : 0,
    fetal: inputs.nichdCategory === 'III' ? 5 : inputs.nichdCategory === 'II' ? 2 : 0,
    labour: inputs.partogramStatus === 'action' ? 3 : inputs.partogramStatus === 'alert' ? 2 : 0,
  };
  
  const maxScore = Math.max(...Object.values(domains)) as 0|1|2|3|4|5;
  const criticalDomain = Object.entries(domains)
    .filter(([,v]) => v === maxScore && maxScore >= 3)
    .map(([k]) => k)[0] || null;
  
  return { score: Math.min(5, maxScore) as 0|1|2|3|4|5, domains, criticalDomain };
}
```

---

## 8. Szinkronizációs Bridge Hook

```typescript
// lib/sync/syncAllRiskInputs.ts
import { useIPRACSStore } from '@/store/useIPRACSStore';
import { calcBishop } from '@/lib/algorithms/bishop';
import { calcVBAC } from '@/lib/algorithms/vbac';

export function useSyncAllRiskInputs() {
  const { fixData, labourSeries, latestLab, setScores } = useIPRACSStore();
  
  const latestEntry = labourSeries[labourSeries.length - 1];
  
  // GA: from fixData.ga → fullPIERS input
  const syncedGA = fixData.ga;
  
  // SpO2: from latest exam → fullPIERS
  const syncedSpO2 = latestEntry?.spo2;
  
  // Dyspnea/CP: from latest exam → fullPIERS chestPain
  const syncedChestPain = latestEntry?.dyspneaChestPain ? 1 : 0 as 0 | 1;
  
  // Lab values → fullPIERS
  const syncedPLT = latestLab?.plt;
  const syncedCR  = latestLab?.cr;
  const syncedAST = latestLab?.ast;
  const syncedSFlt = latestLab?.sflt1;
  const syncedPlgf = latestLab?.plgf;
  
  // FHR → NICHD (most recent partograph entry)
  const syncedFHRBaseline = latestEntry?.fhr;
  const syncedFHRDecel = latestEntry?.fhrDecel;  // already in NICHD format
  
  // QBL → CMQCC (most recent partograph entry)
  const syncedQBL = latestEntry?.qbl ?? 0;
  
  // BMI → CMQCC + VBAC
  const syncedBMI = fixData.bmi;
  const syncedAge = fixData.age;
  
  // Bishop → from latest exam sub-scores
  const bishopResult = latestEntry ? calcBishop({
    dilation: latestEntry.bishopDilation,
    effacement: latestEntry.bishopEffacement,
    station: latestEntry.bishopStation,
    consistency: latestEntry.bishopConsistency,
    position: latestEntry.bishopPosition,
  }) : null;
  
  // VBAC → from fixData
  const vbacResult = fixData.vbacPrevVaginal !== undefined ? calcVBAC({
    prevVaginal: fixData.vbacPrevVaginal ?? false,
    prevVBAC: fixData.vbacPrevVBAC ?? false,
    recurringIndication: fixData.vbacRecurringIndication ?? false,
    bmi: fixData.bmi ?? 25,
    age: fixData.age ?? 30,
    admissionDilation: latestEntry?.cervix ?? 0,
  }) : null;
  
  return {
    // These are returned as pre-populated values for risk forms
    // Components USE these values; they never need to re-enter them
    ga: syncedGA,
    spo2: syncedSpO2,
    chestPain: syncedChestPain,
    plt: syncedPLT,
    creatinine: syncedCR,
    ast: syncedAST,
    sflt1: syncedSFlt,
    plgf: syncedPlgf,
    fhrBaseline: syncedFHRBaseline,
    fhrDecel: syncedFHRDecel,
    qbl: syncedQBL,
    bmi: syncedBMI,
    age: syncedAge,
    bishop: bishopResult,
    vbac: vbacResult,
  };
}
```

---

## 9. UI Komponens Minta — ClinicalCard

```typescript
// components/shared/ClinicalCard.tsx
interface ClinicalCardProps {
  title: string;
  titleEn?: string;
  borderColor: string;          // e.g. '#0F47AF'
  children: React.ReactNode;
  eduContent?: {
    student?: string;
    resident?: string;
    specialist?: string;
    professor?: string;
  };
}

export function ClinicalCard({ title, titleEn, borderColor, children, eduContent }: ClinicalCardProps) {
  const { eduLevel } = useIPRACSStore();
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      style={{ borderTop: `4px solid ${borderColor}` }}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {title}
          {titleEn && <span className="text-sm font-normal text-gray-400 ml-2">/ {titleEn}</span>}
        </h2>
        {children}
        {eduContent && (
          <EduContent level={eduLevel} content={eduContent} />
        )}
      </div>
    </div>
  );
}

// components/shared/AIExplainer.tsx
type AlertLevel = 'success' | 'info' | 'warning' | 'critical';
const alertStyles: Record<AlertLevel, { bg: string; border: string; text: string }> = {
  success:  { bg: '#E8F5E9', border: '#4CAF50', text: '#1B5E20' },
  info:     { bg: '#E3F2FD', border: '#1565C0', text: '#0D3C61' },
  warning:  { bg: '#FFF3E0', border: '#FF9800', text: '#4E2500' },
  critical: { bg: '#FFEBEE', border: '#B71C1C', text: '#7F0000' },
};

interface AIExplainerProps {
  title: string;
  content: string;
  level: AlertLevel;
}

export function AIExplainer({ title, content, level }: AIExplainerProps) {
  const style = alertStyles[level];
  return (
    <div 
      className="mt-3 p-3 rounded-lg"
      style={{ background: style.bg, borderLeft: `4px solid ${style.border}` }}
    >
      <p className="font-semibold text-sm mb-1" style={{ color: style.border }}>{title}</p>
      <p className="text-sm" style={{ color: style.text }} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
```

---

## 10. Tab Struktúra + Navigáció

```typescript
// components/layout/TabNavigation.tsx
const TABS = [
  { id: 'monitoring',  label: '📝 Adatrögzítés' },
  { id: 'partograph',  label: '📈 Partogram' },
  { id: 'who',         label: '📋 WHO' },
  { id: 'risk',        label: '🎲 Kockázat' },
  { id: 'neonatal',    label: '👶 Újszülött' },
  { id: 'mental',      label: '🧠 Mentális' },
  { id: 'emergency',   label: '🚨 Sürgős' },
  { id: 'antibiotics', label: '💊 Antibiotikum' },
  { id: 'withdrawal',  label: '🔄 Elvonás' },
  { id: 'ai-report',   label: '🤖 AI lelet' },
  { id: 'decisions',   label: '🎯 Döntés' },
  { id: 'outcome',     label: '👶 Kimenet' },
  { id: 'legend',      label: '📖 Útmutató' },
] as const;

// On tab change to 'risk': call useSyncAllRiskInputs() to populate derived values
// On tab change to 'emergency': trigger autoFillTransfusion(), autoFillThyroid()
// On tab change to 'partograph': redraw canvas chart
```

---

## 11. Partogram Canvas Komponens

```typescript
// components/tabs/PartographTab/PartographCanvas.tsx
// Use Recharts ComposedChart with:
// X axis: hours from admission (0-24)
// Left Y axis: cervical dilation 0-10 cm + descent 0-5
// Right Y axis: FHR 60-200 bpm
// Data series:
//   - cervix: LineChart, blue dots, connected
//   - descent: LineChart, green triangles
//   - fhr: LineChart, red, right Y axis
//   - qbl: BarChart, grey, small bars at bottom
//   - contractions: shaded areas representing duration/frequency
//   - WHO alert line: dashed orange line (4h right-shift from active phase entry)
//   - WHO action line: dashed red line (4h right of alert line)
// Click on chart → opens "Add entry" dialog pre-filled with interpolated time

// Alert/Action lines (Zhang 2010 curves — not Friedman):
// Nulliparous 4cm → full dilation expected in ~16h (much slower than Friedman)
// The 4-hour partition: alert if >1 cm slower than expected curve
```

---

## 12. Lovable Build Sequence (Javasolt Lépések)

### Lépés 1 — Shell + adatmodell (1. prompt)
```
Create the IPRACS app shell with:
- Zustand store with all TypeScript interfaces (PatientFixData, LabourSeriesEntry, LabSnapshot)
- 13-tab navigation with horizontal scrollable tab bar
- App header showing patient name, GA in weeks, clock, admission elapsed time
- PWA configuration
- Supabase connection with the 4-table schema
- Empty tab containers with colored placeholder cards
- EduLevel selector (Student/Resident/Specialist/Professor) in header
- Mobile-responsive layout (tablet-first, min-width 768px)
```

### Lépés 2 — Adatrögzítés fül (2. prompt)
```
Build the monitoring tab with 4 sub-tabs:
1. FIX Data form (one-time entry): all PatientFixData fields, BMI auto-calculation, 
   VBAC preview card showing % instantly when inputs change
2. Examination form (repeated): vitals grid, labor progression, Bishop Score inline 
   (5 components with live total and color coding), FHR + decel dropdown
3. Lab form: all LabSnapshot fields grouped by category (CBC/Coag/Metabolic/Thyroid/PE markers)
4. Supportive care: drugs administered, epidural, IV access
Each form saves to Zustand + Supabase on submit.
```

### Lépés 3 — Partogram (3. prompt)
```
Build the partograph using Recharts ComposedChart:
- Cervical dilation curve (blue line + dots)
- Fetal descent (green inverted triangles)
- FHR trend (red line, right Y axis 60-200 bpm)
- Cumulative QBL bar chart (small bars, grey, bottom)
- WHO alert line (4h shift of Zhang 2010 expected progression, orange dashed)
- WHO action line (red dashed, 4h right of alert)
- Contraction frequency shading
- Time X-axis: hours from admission
- Clicking the chart opens an "Add entry" drawer
```

### Lépés 4 — Kockázat fül (4. prompt)
```
Build the risk tab with auto-sync from SSOT:
When this tab opens, useSyncAllRiskInputs() populates all inputs.
Cards in order:
1. CORI composite (0-5 with 6-domain breakdown, color-coded)
2. fullPIERS (logistic regression formula exact, probability display + category)
3. sFlt-1/PlGF ratio (Zeisler 2016: <38 rule-out, 38-85 grey zone, >85 rule-in)
4. MEOWS + MEWC + Shock Index (vitals auto-filled from latest exam)
5. NICHD FHR (baseline + decel auto-filled from partograph)
6. CMQCC PPH Risk (risk factors from FIX, QBL from partograph)
7. omqSOFA (sepsis)
8. Bishop Score (read-only, sourced from exam sub-tab)
9. VBAC % (read-only, sourced from FIX data)
Each card has an AI explanation collapsible section.
```

### Lépés 5 — Sürgős modulok (5. prompt)
```
Build emergency tab with 6 cards:
1. Insulin therapy (auto-fills glucose from lab, protocol by type+phase)
2. Hemorrhage/CMQCC (stage 0-3 MOTIVE bundle, hard-stop modals for:
   carboprost+asthma, methylergonovine+HTN, TXA >3h)
3. Transfusion (thresholds AABB 2023, MTP activation, auto-fills Hb/PLT/INR/fib from lab)
4. Thyroid (Burch-Wartofsky calculator, auto-fills TSH/FT4 from lab)
5. VTE (Caprini + RCOG GTG 37a, weight-based LMWH dosing)
6. Delirium (4AT + CAM-ICU + THINK 12-item differential)
```

### Lépés 6 — Antibiotikum + FMT (6. prompt)
```
Build antibiotics tab:
- Indication selector (14 options, 2 groups: obstetric priority + hospital)
- PCN allergy gating (none/mild/anaphylaxis)
- Breastfeeding toggle → shows Hale LRC badge per drug
- Infant age field → triggers hard-stops (erythromycin <2wk, nitrofurantoin <8d, TMP-SMX <2mo)
- ORACLE PPROM: hard-stop modal if amoxicillin-clavulanate selected
- Separate FMT card: CDI episodes + severity → FDA-approved options 
  (Vowst: 4 capsules × 3 days, Rebyota: rectal enema) vs traditional FMT vs bezlotoxumab
```

### Lépés 7 — Elvonás + Újszülött + AI (7. prompt)
```
Build withdrawal tab: COWS (11 items 0-48), CIWA-Ar (10 items 0-67 with permanent thiamine 
banner), BZD equivalents calculator (7 drugs), stimulant protocol, cannabis/CHS, 
and full NOWS (ESC-NOW 3 questions + Finnegan 3-scores + morphine dosing).

Build neonatal tab: NRP 8th edition decision tree, hypoglycemia protocol with 
dextrose gel dosing, LATCH (5-component 0-10), NOWS bridge button.

Build AI report tab: 5 report styles (clinical narrative, SBAR, discharge summary, 
nursing summary, consultation request) × 2 languages (HU/EN), assembled from all 
current scoring module outputs + trend detection.
```

---

## 13. Dizájn Tokenek (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'ipracs-blue':    '#0F47AF',
        'ipracs-blue-md': '#1976D2',
        'ipracs-red':     '#B71C1C',
        'ipracs-red-md':  '#D32F2F',
        'ipracs-orange':  '#E65100',
        'ipracs-green':   '#1B5E20',
        'ipracs-purple':  '#4527A0',
        'ipracs-pink':    '#880E4F',
        'ipracs-teal':    '#00695C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

---

## 14. Kontraindikáció Hard-Stop Minta

```typescript
// components/shared/HardStop.tsx
// Modal that BLOCKS proceeding when a contraindication is detected.
// Usage: trigger when user selects carboprost + patient has asthma.

const HARD_STOPS: Record<string, { condition: (store: IPRACSStore) => boolean; message: { hu: string; en: string } }> = {
  'carboprost_asthma': {
    condition: (s) => s.fixData.asthma === true,
    message: {
      hu: '🚫 CARBOPROST KONTRAINDIKÁLT — Asztma anamnézis! Alternatíva: Misoprostol 800 μg SL',
      en: '🚫 CARBOPROST CONTRAINDICATED — Asthma history! Alternative: Misoprostol 800 μg SL'
    }
  },
  'methylergonovine_htn': {
    condition: (s) => s.fixData.htn === true || s.fixData.preeclampsia === true,
    message: {
      hu: '🚫 METHYLERGONOVIN KONTRAINDIKÁLT — Hypertensio! Alternatíva: Carboprost (ha nincs asztma)',
      en: '🚫 METHYLERGONOVINE CONTRAINDICATED — Hypertension! Alternative: Carboprost (if no asthma)'
    }
  },
  'pprom_augmentin': {
    condition: () => true, // always triggered in PPROM
    message: {
      hu: '🚫 AMOXICILLIN-KLAVULANÁT TILOS PPROM-BAN — NEC kockázat RR 4.72 (ORACLE I). Helyes: Ampicillin + Eritromicin',
      en: '🚫 AMOXICILLIN-CLAVULANATE CONTRAINDICATED IN PPROM — NEC risk RR 4.72 (ORACLE I). Use: Ampicillin + Erythromycin'
    }
  },
};
```

---

## 15. Fontosabb Klinikai Referenciák a Kódban

```typescript
// Every algorithm file should include its evidence source as a comment:

// fullPIERS: von Dadelszen P et al. Lancet 2011;377:219-227 | AUC 0.88 | n=2023
// sFlt-1/PlGF: Zeisler H et al. NEJM 2016;374:13-22 | NPV 99.3% at 1 week
// MEOWS: Singh S et al. Anaesthesia 2012;67:12-18 | AUC 0.87
// NICHD: Macones GA et al. Obstet Gynecol 2008;112:661 | NICHD 3-tier
// CMQCC: CMQCC PPH Toolkit v3.0, 2022
// WHO PPH: WHO/FIGO/ICM Joint Statement Oct 2025 | threshold 300 mL
// VBAC: Grobman WA et al. AJOG 2021;225:664.e1 | PMC8611105 | race-neutral
// Bishop: Bishop EH. Obstet Gynecol 1964;24:266 | modified scoring
// COWS: Wesson DR & Ling W. J Psychoactive Drugs 2003;35:253
// CIWA-Ar: Sullivan JT et al. Br J Addict 1989;84:1353
// ESC-NOW: Young LW et al. NEJM 2023;388:2326 | LOS -6.7d, pharm RR 0.44
// NRP 8th: AAP/AHA 2021 | epi 0.02 mg/kg IV preferred
// EPDS HU: Töreki A et al. Midwifery 2014;30:911 | PMID 24742635 | cutoff 12/13
// CDI IDSA: Johnson S et al. Clin Infect Dis 2021;73:e1029
// 4AT: Bellelli G et al. Age Ageing 2014;43:496 | sens 89.7%, spec 84.1%
```

---

## 16. Offline / PWA Konfiguráció

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*supabase\.co\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
  manifest: {
    name: 'IPRACS — Szülőszobai Döntéstámogatás',
    short_name: 'IPRACS',
    theme_color: '#0F47AF',
    background_color: '#F5F7FA',
    display: 'standalone',
    orientation: 'landscape',  // tablet landscape
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
})
```

---

## 17. Fontos Megjegyzések Lovable Számára

1. **Minden klinikai döntéstámogató függvényt CSAK TypeScript-ben implementálj** — ne használj külső ML könyvtárakat, a pontos formulák fentebb meg vannak adva.

2. **Az SSOT princípium sacred** — ha ugyanaz az adat (pl. thrombocyta) több helyen jelenik meg, az MINDIG read-only másolat, sosem duplikált beviteli mező.

3. **Hard-stop modálok nem megkerülhetők** — a Dialog-ban nincs "Mégis folytatom" gomb a kontraindikációknál.

4. **Bilingualitás**: a klinikai szövegek egy objektumba kerülnek: `{ hu: '...', en: '...' }`. Az aktuális nyelv egy globális `lang: 'hu' | 'en'` store state.

5. **Tablet-first dizájn**: min-width 768px assumed, landscape orientation, large touch targets (min 44px), no hover-dependent interactions.

6. **A partogram canvas ne frissüljön minden keystroke-on** — csak a tab megnyitásakor és az "Adat rögzítése" gomb megnyomásakor.

7. **Szín-kódolás következetes**: klinikai alert szint mindig:
   - ✅ Zöld (#4CAF50): normál / safe
   - ⚠️ Narancssárga (#FF9800): monitor / caution  
   - 🚨 Piros (#D32F2F): action required
   - 💀 Sötétpiros (#B71C1C): critical / immediate

8. **Az oktatási tartalom lazy-load** — csak a "📚 Részletek" gomb kattintásakor töltődjön be, ne lassítsa az inicializálást.
```
