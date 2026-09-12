# AI-Powered Disaster Intelligence & Response System

## Project Purpose
A college hackathon project to build an intelligent disaster management system that helps users report disasters, receive alerts, and coordinate emergency response. Focused on **India** with **Sikkim** as the initial pilot region.

## Current Phase
**Phase 5A Complete** - Incident AI Foundation

### Completed Phases
- **Phase 1** - Project Foundation (React + Vite frontend, FastAPI backend)
- **Phase 2A** - Frontend Application Shell (6 pages, responsive layout, navigation)
- **Phase 2B** - UI Polish & Consistency (dashboard, theming, SOS page, alerts, safety info)
- **Phase 3A** - Functional Disaster Reporting (localStorage, offline queue, global state)
- **Phase 3B** - Emergency SOS (hold-to-activate, GPS, offline queue, 112 integration)
- **Phase 4A** - Firebase Firestore Foundation (incident sync, real-time updates, offline fallback)
- **Phase 4B** - Firebase Storage + Disaster Report Images (image upload, validation, offline handling)
- **Phase 5A** - Incident AI Foundation (schemas, provider interface, demo provider, validation)

## Technology Stack
- **Frontend**: React 19 + Vite 8 + React Router 6 + Bootstrap 5.3
- **State**: React Context (IncidentContext, ThemeContext) + localStorage
- **Backend**: Python + FastAPI + Uvicorn
- **Database**: Firebase Firestore (real-time) + localStorage fallback
- **Storage**: Firebase Storage (images) + localStorage fallback
- **ML/AI**: scikit-learn, numpy, scipy (Phase 5A+)
- **Linting**: Oxlint
- **Build**: Vite 8 (Rolldown)

## Project Structure
```
disaster-management/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Button, Card, Badge, etc.)
│   │   ├── context/          # React Context providers (IncidentContext, ThemeContext)
│   │   ├── pages/            # Page components (Home, Report, Map, Alerts, Safety, SOS)
│   │   ├── services/         # Firebase services (firebase.js, firestore.js, storage.js)
│   │   ├── App.jsx           # App routes
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles (Bootstrap + custom CSS variables)
│   ├── public/
│   ├── .env.example          # Firebase config template
│   ├── storage.rules         # Firebase Storage rules (DEVELOPMENT ONLY)
│   ├── package.json
│   └── vite.config.js
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── ai/               # Incident AI module (Phase 5A)
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── schemas.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   └── demo_provider.py
│   │   │   ├── preprocessing/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── text.py
│   │   │   │   └── image.py
│   │   │   ├── validation/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── input.py
│   │   │   │   ├── severity.py
│   │   │   │   ├── disaster_type.py
│   │   │   │   ├── schema.py
│   │   │   │   └── confidence.py
│   │   │   └── providers/
│   │   │       ├── __init__.py
│   │   │       └── registry.py
│   │   ├── main.py           # FastAPI app with /api/health endpoint
│   │   └── __pycache__/
│   ├── requirements.txt
│   └── .venv/                # Python virtual environment (ignored by git)
├── .gitignore
├── .env.example              # Root env template
├── storage.rules             # Firebase Storage rules (DEVELOPMENT ONLY)
├── firestore.rules           # Firebase Firestore rules (DEVELOPMENT ONLY)
└── README.md
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Backend Setup
```bash
cd backend
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend will be available at `http://127.0.0.1:8000`
API documentation at `http://127.0.0.1:8000/docs`

## Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database** (Native mode) and **Storage**
3. Add a Web App to get config values
4. Copy `frontend/.env.example` to `frontend/.env` and fill in:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Deploy Firestore rules (see `firestore.rules`) and Storage rules (`storage.rules`)

## Frontend Pages & Features
| Page | Route | Key Features |
|------|-------|--------------|
| **Dashboard** | `/` | Active incidents, risk forecasts, priority zones, stats cards |
| **Report Incident** | `/report` | 5-step wizard, GPS coords, image upload (5MB, JPEG/PNG/WebP/HEIC), offline queue |
| **Incident Map** | `/map` | Filter sidebar (type/severity/time), legend, placeholder for Phase 3 map |
| **Alerts** | `/alerts` | Official + citizen reports, severity filter, expandable details, channel status |
| **Safety Info** | `/safety` | Category nav, hazard guides (Before/During/After), emergency contacts |
| **Emergency SOS** | `/sos` | Hold-to-activate, 3s countdown, GPS capture, CRITICAL incident, 112 call button |

## Key Features Implemented
- **Theme Toggle**: Light/Dark mode with `localStorage` persistence, respects system preference
- **Incident Context**: Global state with Firestore real-time sync + localStorage fallback
- **Offline Support**: Incident queue, pending sync on reconnect, no false delivery claims
- **SOS System**: Hold 0.5s → 3s countdown → auto GPS → CRITICAL incident → 112 call button
- **Image Upload**: 5 MB limit, JPEG/PNG/WebP/HEIC, preview, `incidents/{incidentId}/` path
- **Incident AI Foundation** (Phase 5A): Pluggable provider interface, demo provider, schemas, validation
- **India/Sikkim Focus**: Emergency number **112**, Sikkim locations, demo incidents in Sikkim

## Incident AI Foundation (Phase 5A)
**Status**: Foundation complete, demo provider only - NO TRAINED MODELS YET

### Architecture
```
backend/app/ai/
├── schemas.py           # Pydantic models (IncidentInput, IncidentAIResult)
├── models/
│   ├── base.py          # IncidentAIProvider abstract base class
│   └── demo_provider.py # DEMO provider (rule-based, clearly labeled)
├── preprocessing/
│   ├── text.py          # Text cleaning, keyword extraction, location extraction
│   └── image.py         # ImagePreprocessor interface + mock (Phase 5B+)
├── validation/
│   ├── input.py         # Incident input validation
│   ├── severity.py      # Severity normalization, comparison, priority
│   ├── disaster_type.py # Disaster type normalization, validation
│   ├── schema.py        # AI result schema validation, consistency checks
│   └── confidence.py    # Confidence validation, calibration, interpretation
├── providers/
│   └── registry.py      # Provider registry for dynamic selection
└── config.py            # AIConfig with env var support
```

### Supported Disaster Types
- `flood`, `landslide`, `earthquake`, `fire`, `cyclone`, `storm`, `infrastructure_damage`, `other`

### Supported Severity Levels
- `critical`, `high`, `moderate`, `low`

### Current Implementation Status
| Component | Status |
|-----------|--------|
| Schemas (IncidentInput, IncidentAIResult) | ✅ Complete |
| Provider interface (IncidentAIProvider) | ✅ Complete |
| Demo provider (rule-based) | ✅ Complete |
| Text preprocessing | ✅ Complete |
| Image preprocessing interface | ✅ Interface only |
| Validation utilities | ✅ Complete (unit-testable) |
| Provider registry | ✅ Complete |
| Configuration | ✅ Complete |
| **Trained ML models** | ❌ Phase 5B+ |
| **Image analysis models** | ❌ Phase 5B+ |
| **Forecasting/prediction** | ❌ Phase 5C+ |
| **Resource optimization** | ❌ Phase 5D+ |

### Demo Provider
The `DemoIncidentAIProvider` is a **rule-based mock provider** that:
- Uses keyword matching for disaster type classification
- Uses keyword + affected people count for severity classification
- Returns fixed confidence of 0.65 (NOT from a trained model)
- Clearly labeled with `is_demo=True` in all outputs
- **Never present outputs as real AI predictions**

### Configuration
Environment variables (see `backend/app/ai/config.py`):
```bash
AI_DEFAULT_PROVIDER=demo          # Provider name (default: "demo")
AI_DEMO_ENABLED=true              # Enable demo provider (default: true)
AI_MIN_CONFIDENCE=0.3             # Minimum confidence threshold
AI_MAX_TEXT_LENGTH=4000           # Max text length for analysis
AI_LOG_LEVEL=INFO                 # Logging level
```

### Testing the AI Foundation
```bash
cd backend
source .venv/bin/activate
python -c "
from app.ai import get_provider
from app.ai.schemas import IncidentInput
import asyncio

async def test():
    provider = get_provider()
    print(f'Provider: {provider.name} v{provider.version}')
    print(f'Is demo: {provider.is_demo}')
    
    incident = IncidentInput(
        description='Heavy flooding in Rangpo area, water levels rising rapidly, 45 people affected',
        latitude=27.1767,
        longitude=88.5333,
        location_text='Rangpo, East Sikkim',
        affected_people=45
    )
    
    result = await provider.analyze(incident)
    print(f'Predicted type: {result.predicted_disaster_type}')
    print(f'Predicted severity: {result.predicted_severity}')
    print(f'Confidence: {result.confidence}')
    print(f'Is demo: {result.is_demo}')

asyncio.run(test())
"
```

### Validation Utilities (Unit-Testable)
```python
from app.ai.validation import (
    validate_incident_input,
    normalize_severity,
    normalize_disaster_type,
    validate_confidence,
    validate_incident_ai_result,
    interpret_confidence,
)
```

### AI Result Schema (compatible with Firestore Incident object)
```json
{
  "predictedDisasterType": "flood",
  "predictedSeverity": "high",
  "confidence": 0.85,
  "infrastructureImpact": "Roads, bridges at risk...",
  "safetyAssessment": "Evacuate immediately...",
  "affectedAreas": ["Rangpo", "Singtam"],
  "recommendedActions": ["Evacuate low-lying areas", "Call 112"],
  "modelVersion": "sklearn-v0.1",
  "processingTimeMs": 45,
  "isDemo": false
}
```

## Current API Endpoints
- `GET /api/health` - Returns `{"status": "ok"}`

## Verification
```bash
# Frontend
cd frontend
npm run lint      # Passes (only pre-existing warnings)
npm run build     # Passes (~622 kB JS, ~278 kB CSS gzipped)

# Backend
cd backend
source .venv/bin/activate
python -c "import sklearn; import numpy; import scipy; print('All imports OK')"
uvicorn app.main:app --reload
# /api/health returns {"status": "ok"}
```

## Current Limitations (Not Yet Implemented)
- **AI/ML Trained Models** (Phase 5B+)
- Landslide / risk prediction (Phase 5C+)
- Resource optimization (Phase 5D+)
- Interactive map with clustering (Phase 3)
- Push notifications / SMS / Email alerts
- Firebase Authentication
- Weather APIs integration
- Admin/authority dashboard
- Production deployment
- Satellite communication (future scope note in SOS)

## Firebase Rules (Development Only)
### Firestore (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incidents/{document} {
      allow read, write: if true; // DEVELOPMENT ONLY
    }
  }
}
```

### Storage (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /incidents/{incidentId}/{fileName} {
      allow read: if true;
      allow write: if request.resource.contentType.matches('image/(jpeg|png|webp|heic|heif)')
        && request.resource.size <= 5 * 1024 * 1024
        && request.resource.name.matches('^img_[0-9]+_[a-z0-9]+\\.(jpg|jpeg|png|webp|heic|heif)$');
    }
  }
}
```

> ⚠️ **WARNING**: These rules are **DEVELOPMENT ONLY**. Production rules must require authentication, validate ownership, implement quotas, and restrict access by user/role.

## Limitations & Next Steps
### Phase 5A Limitations
- **NO TRAINED MODELS** - Only demo provider available
- **NO IMAGE ANALYSIS** - Image preprocessing interface exists but no model
- **NO FORECASTING** - No temporal prediction capabilities
- **NO REAL CONFIDENCE** - Demo returns fixed 0.65 confidence
- **RULE-BASED ONLY** - Classification uses keyword matching, not ML

### Phase 5B Will Implement
- Real trained models (scikit-learn classifiers, potentially PyTorch)
- Image analysis models (CNN/ViT for disaster image classification)
- Confidence calibration (Platt scaling, isotonic regression)
- Training pipeline with proper dataset management
- Model versioning and A/B testing framework
- Integration with Firestore for incident AI results attachment

### Phase 5C Will Implement
- Risk forecasting (temporal prediction)
- Landslide susceptibility modeling
- Flood progression modeling
- Resource optimization (allocation algorithms)

## Verification
```bash
# Frontend
cd frontend
npm run lint      # Passes (only pre-existing warnings)
npm run build     # Passes (~622 kB JS, ~278 kB CSS gzipped)

# Backend
cd backend
source .venv/bin/activate
python -c "import sklearn; import numpy; import scipy; print('All imports OK')"
uvicorn app.main:app --reload
# /api/health returns {"status": "ok"}
```