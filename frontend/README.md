# DisasterIntel Frontend

React 19 + Vite 8 application for the AI-Powered Disaster Intelligence & Response System.

## Quick Start
```bash
cd frontend
npm install
npm run dev        # Development server at http://localhost:5173
npm run build      # Production build
npm run lint       # Lint with Oxlint
npm run preview    # Preview production build
```

## Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/               # Button, Card, Badge, FormField, StepIndicator, StatsCard, EmptyState
│   ├── Header.jsx        # Navigation with theme toggle
│   ├── Footer.jsx
│   └── Layout.jsx        # Providers + outlet
├── context/              # React Context providers
│   ├── IncidentContext.jsx   # Global incident state (Firestore + localStorage)
│   └── ThemeContext.jsx      # Light/Dark theme with localStorage persistence
├── pages/                # Route pages
│   ├── Home.jsx              # Dashboard (active incidents, forecasts, priorities)
│   ├── ReportDisaster.jsx    # 5-step incident reporting + image upload
│   ├── DisasterMap.jsx       # Map placeholder with filters
│   ├── Alerts.jsx            # Official + citizen alerts with filters
│   ├── SafetyInfo.jsx        # Safety categories, hazard guides, contacts
│   └── EmergencySOS.jsx      # Hold-to-activate SOS with GPS
├── services/             # Firebase integration
│   ├── firebase.js       # Firebase app + Firestore + Storage init
│   ├── firestore.js      # Incident CRUD + real-time subscription
│   └── storage.js        # Image upload + validation
├── App.jsx               # Routes
├── main.jsx              # Entry point
└── index.css             # Global styles (Bootstrap + custom CSS vars)
```

## Key Features

### Theme System
- Light/Dark toggle in header (persists in localStorage)
- Respects `prefers-color-scheme` on first visit
- CSS variables in `index.css` for both themes

### IncidentContext
- Global state: incidents, activeIncidents, addIncident, updateIncidentStatus
- Firestore real-time sync with `onSnapshot`
- localStorage fallback when offline or Firebase unavailable
- Demo incidents (Sikkim) never synced to Firestore

### Image Upload (Phase 4B)
- Path: `incidents/{incidentId}/img_<timestamp>_<random>.ext`
- Validation: JPEG/PNG/WebP/HEIC, max 5 MB
- Preview before submit, remove option
- Offline: skips upload, marks `imageUploadPending`

### Emergency SOS
- Hold 0.5s → 3s countdown → CRITICAL incident
- Auto GPS capture (with permission handling)
- 112 call button (tel:112)
- Works offline (queued locally)

### Incident AI Integration (Phase 5A)
The frontend is designed to integrate with the backend Incident AI Foundation:
- `IncidentInput` schema matches the Report Disaster form data
- `IncidentAIResult` schema compatible with Firestore incident objects
- Image URLs from Firebase Storage passed to AI for analysis
- AI results can be attached to incidents for display on Dashboard/Map/Alerts
- Demo provider returns `is_demo: true` - UI can show appropriate badges

## Environment Variables
Copy `.env.example` to `.env` and fill in Firebase config:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview production build |

## Verification
```bash
npm run lint   # Passes (pre-existing warnings only)
npm run build  # Passes (~622 kB JS gzipped)
```

## Firebase Rules (DEVELOPMENT ONLY)
See root `storage.rules` and `firestore.rules` - **not for production**.

## Phase 5A - Incident AI Foundation (Backend)
The AI foundation lives in `backend/app/ai/`:

### Schemas
- `IncidentInput` - Matches report form data (description, location, severity, image URL, etc.)
- `IncidentAIResult` - Structured AI assessment (type, severity, confidence, impact, safety, actions)

### Provider Architecture
- `IncidentAIProvider` - Abstract base for pluggable models
- `DemoIncidentAIProvider` - Rule-based mock (clearly labeled `is_demo: true`)
- `ProviderRegistry` - Dynamic provider selection

### Validation (Unit-Testable)
- Input validation (description, coordinates, affected people, image URL)
- Severity normalization & comparison
- Disaster type normalization
- AI result schema validation
- Confidence validation & interpretation

### Future Frontend Integration (Phase 5B+)
- AI analysis trigger on incident submission
- Display AI predictions on Dashboard/Map/Alerts
- Confidence badges and demo indicators
- Image analysis results display
- Confidence calibration visualization